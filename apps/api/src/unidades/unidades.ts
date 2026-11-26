import { BadRequestException, Body, Controller, Delete, Get, Injectable, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Prisma, TipoUnidad, VinculoUnidad } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { IsBoolean, IsEmail, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Actual, ES_GESTOR, GESTION, Roles, UsuarioActual } from '../common/decorators';
import { AuditoriaService } from '../common/auditoria.service';
import { num } from '../common/util';
import { PrismaService } from '../prisma/prisma.service';

export class UnidadDto {
  @IsOptional() @IsString() torre?: string;
  @IsString() numero: string;
  @IsOptional() @IsEnum(TipoUnidad) tipo?: TipoUnidad;
  @IsOptional() @IsNumber() areaPrivada?: number;
  /** Coeficiente en porcentaje: 1.25 = 1,25 % */
  @IsNumber() @Min(0) @Max(100) coeficientePct: number;
}

export class ImportarDto {
  /** CSV con encabezado: torre;numero;tipo;area;coeficiente_pct (también acepta comas). */
  @IsString() csv: string;
}

export class VincularDto {
  @IsEmail({}, { message: 'Correo inválido' }) email: string;
  @IsString() nombre: string;
  @IsOptional() @IsString() celular?: string;
  @IsOptional() @IsString() tipoDocumento?: string;
  @IsOptional() @IsString() numeroDocumento?: string;
  @IsEnum(VinculoUnidad) vinculo: VinculoUnidad;
  @IsOptional() @IsBoolean() responsablePago?: boolean;
}

export const nombreUnidad = (u: { numero: string; torre?: { nombre: string } | null }) =>
  `${u.torre ? u.torre.nombre + ' - ' : ''}${u.numero}`;

/** Crea el usuario si no existe y devuelve una contraseña temporal para entregarle. */
export async function asegurarUsuario(
  tx: Prisma.TransactionClient,
  datos: { email: string; nombre: string; celular?: string; tipoDocumento?: string; numeroDocumento?: string },
) {
  const email = datos.email.toLowerCase().trim();
  const existente = await tx.usuario.findUnique({ where: { email } });
  if (existente) return { usuario: existente, passwordTemporal: null as string | null };
  const passwordTemporal = randomBytes(6).toString('base64url');
  const usuario = await tx.usuario.create({
    data: { ...datos, email, passwordHash: await bcrypt.hash(passwordTemporal, 10), debeCambiarPassword: true },
  });
  return { usuario, passwordTemporal };
}

@Injectable()
export class UnidadesService {
  constructor(private readonly prisma: PrismaService, private readonly auditoria: AuditoriaService) {}

  private async torreId(tx: Prisma.TransactionClient, copropiedadId: string, nombre?: string) {
    const n = nombre?.trim();
    if (!n) return null;
    const t = await tx.torre.upsert({
      where: { copropiedadId_nombre: { copropiedadId, nombre: n } },
      create: { copropiedadId, nombre: n },
      update: {},
    });
    return t.id;
  }

  async listar(copropiedadId: string) {
    const unidades = await this.prisma.unidad.findMany({
      where: { copropiedadId },
      include: {
        torre: true,
        personas: { where: { hasta: null }, include: { usuario: { select: { id: true, nombre: true, email: true, celular: true } } } },
      },
      orderBy: [{ torre: { nombre: 'asc' } }, { numero: 'asc' }],
    });
    const saldos = await this.prisma.cargo.groupBy({
      by: ['unidadId'],
      where: { copropiedadId, estado: 'PENDIENTE' },
      _sum: { saldo: true },
    });
    const saldoPor = new Map(saldos.map((s) => [s.unidadId, num(s._sum.saldo)]));
    const sumaCoef = unidades.reduce((s, u) => s + num(u.coeficiente), 0);
    return {
      sumaCoeficientesPct: Math.round(sumaCoef * 1e8) / 1e6,
      unidades: unidades.map((u) => ({
        id: u.id,
        nombre: nombreUnidad(u),
        torre: u.torre?.nombre ?? null,
        numero: u.numero,
        tipo: u.tipo,
        areaPrivada: u.areaPrivada ? num(u.areaPrivada) : null,
        coeficientePct: Math.round(num(u.coeficiente) * 1e8) / 1e6,
        saldo: saldoPor.get(u.id) ?? 0,
        personas: u.personas.map((p) => ({ ...p.usuario, usuarioId: p.usuario.id, id: p.id, vinculo: p.vinculo, responsablePago: p.responsablePago })),
      })),
    };
  }

  async crear(copropiedadId: string, usuarioId: string, dto: UnidadDto) {
    return this.prisma.$transaction(async (tx) => {
      const u = await tx.unidad.create({
        data: {
          copropiedadId,
          torreId: await this.torreId(tx, copropiedadId, dto.torre),
          numero: dto.numero.trim(),
          tipo: dto.tipo ?? 'APARTAMENTO',
          areaPrivada: dto.areaPrivada,
          coeficiente: dto.coeficientePct / 100,
        },
      });
      await this.auditoria.registrar({ tx, copropiedadId, usuarioId, accion: 'CREAR', entidad: 'Unidad', entidadId: u.id });
      return u;
    });
  }

  async actualizar(copropiedadId: string, id: string, usuarioId: string, dto: UnidadDto) {
    return this.prisma.$transaction(async (tx) => {
      const antes = await tx.unidad.findFirst({ where: { id, copropiedadId } });
      if (!antes) throw new NotFoundException('Unidad no encontrada');
      const u = await tx.unidad.update({
        where: { id },
        data: {
          torreId: await this.torreId(tx, copropiedadId, dto.torre),
          numero: dto.numero.trim(),
          tipo: dto.tipo,
          areaPrivada: dto.areaPrivada,
          coeficiente: dto.coeficientePct / 100,
        },
      });
      await this.auditoria.registrar({
        tx, copropiedadId, usuarioId, accion: 'ACTUALIZAR', entidad: 'Unidad', entidadId: id,
        detalle: { coeficienteAnterior: num(antes.coeficiente), coeficienteNuevo: dto.coeficientePct / 100 },
      });
      return u;
    });
  }

  async eliminar(copropiedadId: string, id: string, usuarioId: string) {
    const cargos = await this.prisma.cargo.count({ where: { unidadId: id } });
    if (cargos > 0) throw new BadRequestException('La unidad tiene movimientos y no se puede eliminar');
    await this.prisma.unidad.deleteMany({ where: { id, copropiedadId } });
    await this.auditoria.registrar({ copropiedadId, usuarioId, accion: 'ELIMINAR', entidad: 'Unidad', entidadId: id });
    return { ok: true };
  }

  /** Carga masiva desde CSV (copiado de Excel). Crea o actualiza por torre + número. */
  async importar(copropiedadId: string, usuarioId: string, csv: string) {
    const lineas = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lineas.length < 2) throw new BadRequestException('El archivo debe tener encabezado y al menos una fila');
    const sep = lineas[0].includes(';') ? ';' : lineas[0].includes('\t') ? '\t' : ',';
    const cab = lineas[0].toLowerCase().split(sep).map((c) => c.trim());
    const idx = (n: string) => cab.findIndex((c) => c.startsWith(n));
    const iT = idx('torre'), iN = idx('numero'), iTipo = idx('tipo'), iA = idx('area'), iC = idx('coef');
    if (iN < 0 || iC < 0) throw new BadRequestException('Faltan las columnas "numero" y "coeficiente_pct"');
    const errores: string[] = [];
    let creadas = 0, actualizadas = 0;
    await this.prisma.$transaction(async (tx) => {
      for (let i = 1; i < lineas.length; i++) {
        const c = lineas[i].split(sep).map((x) => x.trim());
        const numero = c[iN];
        const coef = Number((c[iC] ?? '').replace(',', '.'));
        if (!numero || !Number.isFinite(coef) || coef <= 0 || coef > 100) {
          errores.push(`Fila ${i + 1}: número o coeficiente inválido`);
          continue;
        }
        const tipoTxt = iTipo >= 0 ? c[iTipo]?.toUpperCase() : undefined;
        const tipo = tipoTxt && tipoTxt in TipoUnidad ? (tipoTxt as TipoUnidad) : 'APARTAMENTO';
        const area = iA >= 0 && c[iA] ? Number(c[iA].replace(',', '.')) : undefined;
        const torreId = await this.torreId(tx, copropiedadId, iT >= 0 ? c[iT] : undefined);
        const existente = await tx.unidad.findFirst({ where: { copropiedadId, torreId, numero } });
        const data = { tipo, areaPrivada: Number.isFinite(area) ? area : undefined, coeficiente: coef / 100 };
        if (existente) {
          await tx.unidad.update({ where: { id: existente.id }, data });
          actualizadas++;
        } else {
          await tx.unidad.create({ data: { copropiedadId, torreId, numero, ...data } });
          creadas++;
        }
      }
      await this.auditoria.registrar({ tx, copropiedadId, usuarioId, accion: 'IMPORTAR', entidad: 'Unidad', detalle: { creadas, actualizadas } });
    }, { timeout: 60_000 });
    return { creadas, actualizadas, errores };
  }

  async vincular(copropiedadId: string, unidadId: string, usuarioId: string, dto: VincularDto) {
    const unidad = await this.prisma.unidad.findFirst({ where: { id: unidadId, copropiedadId } });
    if (!unidad) throw new NotFoundException('Unidad no encontrada');
    return this.prisma.$transaction(async (tx) => {
      const { usuario, passwordTemporal } = await asegurarUsuario(tx, dto);
      const rol = dto.vinculo === 'PROPIETARIO' ? 'PROPIETARIO' : 'RESIDENTE';
      await tx.membresia.upsert({
        where: { usuarioId_copropiedadId_rol: { usuarioId: usuario.id, copropiedadId, rol } },
        create: { usuarioId: usuario.id, copropiedadId, rol },
        update: {},
      });
      const v = await tx.unidadPersona.upsert({
        where: { unidadId_usuarioId_vinculo: { unidadId, usuarioId: usuario.id, vinculo: dto.vinculo } },
        create: { unidadId, usuarioId: usuario.id, vinculo: dto.vinculo, responsablePago: dto.responsablePago ?? dto.vinculo === 'PROPIETARIO' },
        update: { hasta: null, responsablePago: dto.responsablePago },
      });
      await this.auditoria.registrar({ tx, copropiedadId, usuarioId, accion: 'VINCULAR', entidad: 'Unidad', entidadId: unidadId, detalle: { persona: usuario.id, vinculo: dto.vinculo } });
      return { vinculoId: v.id, usuarioId: usuario.id, passwordTemporal };
    });
  }

  async desvincular(copropiedadId: string, vinculoId: string, usuarioId: string) {
    const v = await this.prisma.unidadPersona.findFirst({ where: { id: vinculoId, unidad: { copropiedadId } } });
    if (!v) throw new NotFoundException('Vínculo no encontrado');
    await this.prisma.unidadPersona.update({ where: { id: vinculoId }, data: { hasta: new Date() } });
    await this.auditoria.registrar({ copropiedadId, usuarioId, accion: 'DESVINCULAR', entidad: 'Unidad', entidadId: v.unidadId });
    return { ok: true };
  }

  /** Unidades a las que el usuario tiene acceso: todas si gestiona, o solo las suyas. */
  async unidadesDe(copropiedadId: string, user: UsuarioActual): Promise<string[] | 'todas'> {
    if (user.esSuperAdmin || ES_GESTOR(user.roles)) return 'todas';
    const v = await this.prisma.unidadPersona.findMany({
      where: { usuarioId: user.id, hasta: null, unidad: { copropiedadId } },
      select: { unidadId: true },
    });
    return v.map((x) => x.unidadId);
  }

  async misUnidades(copropiedadId: string, usuarioId: string) {
    const v = await this.prisma.unidadPersona.findMany({
      where: { usuarioId, hasta: null, unidad: { copropiedadId } },
      include: { unidad: { include: { torre: true } } },
    });
    return v.map((x) => ({ id: x.unidad.id, nombre: nombreUnidad(x.unidad), vinculo: x.vinculo, coeficientePct: Math.round(num(x.unidad.coeficiente) * 1e8) / 1e6 }));
  }
}

@ApiTags('Unidades')
@ApiBearerAuth()
@Controller('copropiedades/:copId/unidades')
export class UnidadesController {
  constructor(private readonly svc: UnidadesService) {}

  @Get()
  @Roles(...GESTION, 'CONTADOR', 'CONSEJO', 'REVISOR_FISCAL', 'PORTERIA')
  listar(@Param('copId') copId: string) {
    return this.svc.listar(copId);
  }

  @Get('mias')
  mias(@Param('copId') copId: string, @Actual() u: UsuarioActual) {
    return this.svc.misUnidades(copId, u.id);
  }

  @Post()
  @Roles(...GESTION)
  crear(@Param('copId') copId: string, @Actual() u: UsuarioActual, @Body() dto: UnidadDto) {
    return this.svc.crear(copId, u.id, dto);
  }

  @Post('importar')
  @Roles(...GESTION)
  importar(@Param('copId') copId: string, @Actual() u: UsuarioActual, @Body() dto: ImportarDto) {
    return this.svc.importar(copId, u.id, dto.csv);
  }

  @Patch(':id')
  @Roles('ADMINISTRADOR')
  actualizar(@Param('copId') copId: string, @Param('id') id: string, @Actual() u: UsuarioActual, @Body() dto: UnidadDto) {
    return this.svc.actualizar(copId, id, u.id, dto);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  eliminar(@Param('copId') copId: string, @Param('id') id: string, @Actual() u: UsuarioActual) {
    return this.svc.eliminar(copId, id, u.id);
  }

  @Post(':id/personas')
  @Roles(...GESTION)
  vincular(@Param('copId') copId: string, @Param('id') id: string, @Actual() u: UsuarioActual, @Body() dto: VincularDto) {
    return this.svc.vincular(copId, id, u.id, dto);
  }

  @Delete('personas/:vinculoId')
  @Roles(...GESTION)
  desvincular(@Param('copId') copId: string, @Param('vinculoId') vinculoId: string, @Actual() u: UsuarioActual) {
    return this.svc.desvincular(copId, vinculoId, u.id);
  }
}
