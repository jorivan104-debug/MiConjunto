import { BadRequestException, Body, Controller, ForbiddenException, Get, Injectable, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { Actual, ES_GESTOR, GESTION, Roles, UsuarioActual } from '../common/decorators';
import { AuditoriaService } from '../common/auditoria.service';
import { num, periodoActual } from '../common/util';
import { CobrosService } from '../cobros/cobros.service';
import { PrismaService } from '../prisma/prisma.service';
import { nombreUnidad, UnidadesService } from '../unidades/unidades';

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
/** Colombia no tiene horario de verano: UTC-5 todo el año. */
const OFFSET_COLOMBIA_MS = -5 * 3600_000;

export class ZonaDto {
  @IsString() nombre: string;
  @IsOptional() @IsString() descripcion?: string;
  @IsOptional() @IsInt() @Min(1) capacidad?: number;
  @IsOptional() @Matches(HORA) horaApertura?: string;
  @IsOptional() @Matches(HORA) horaCierre?: string;
  @IsOptional() @IsInt() @Min(1) @Max(24) maxHoras?: number;
  @IsOptional() @IsNumber() @Min(0) tarifa?: number;
  @IsOptional() @IsBoolean() requiereAprobacion?: boolean;
  @IsOptional() @IsBoolean() activa?: boolean;
}

export class ReservaDto {
  @IsString() zonaId: string;
  @IsString() unidadId: string;
  @IsDateString() inicio: string;
  @IsDateString() fin: string;
  @IsOptional() @IsString() nota?: string;
}

const minutosLocales = (d: Date) => {
  const l = new Date(d.getTime() + OFFSET_COLOMBIA_MS);
  return l.getUTCHours() * 60 + l.getUTCMinutes();
};
const diaLocal = (d: Date) => new Date(d.getTime() + OFFSET_COLOMBIA_MS).toISOString().slice(0, 10);
const aMin = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3));

/** Reglas de una reserva: mismo día, dentro del horario y sin exceder la duración máxima. */
export function validarHorario(zona: { horaApertura: string; horaCierre: string; maxHoras: number }, inicio: Date, fin: Date, ahora = new Date()) {
  if (fin <= inicio) throw new BadRequestException('La hora final debe ser posterior a la inicial');
  if (inicio < ahora) throw new BadRequestException('No se puede reservar en el pasado');
  if (diaLocal(inicio) !== diaLocal(new Date(fin.getTime() - 1))) throw new BadRequestException('La reserva debe empezar y terminar el mismo día');
  if ((fin.getTime() - inicio.getTime()) / 3600_000 > zona.maxHoras) throw new BadRequestException(`La duración máxima es ${zona.maxHoras} horas`);
  const finMin = minutosLocales(fin) === 0 ? 24 * 60 : minutosLocales(fin);
  if (minutosLocales(inicio) < aMin(zona.horaApertura) || finMin > aMin(zona.horaCierre)) {
    throw new BadRequestException(`El horario permitido es de ${zona.horaApertura} a ${zona.horaCierre}`);
  }
}

@Injectable()
export class ReservasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cobros: CobrosService,
    private readonly unidades: UnidadesService,
    private readonly auditoria: AuditoriaService,
  ) {}

  zonas(copropiedadId: string) {
    return this.prisma.zonaComun.findMany({ where: { copropiedadId }, orderBy: { nombre: 'asc' } }).then((z) => z.map((x) => ({ ...x, tarifa: num(x.tarifa) })));
  }

  crearZona(copropiedadId: string, dto: ZonaDto) {
    return this.prisma.zonaComun.create({ data: { copropiedadId, ...dto } });
  }

  async actualizarZona(copropiedadId: string, id: string, dto: ZonaDto) {
    const z = await this.prisma.zonaComun.findFirst({ where: { id, copropiedadId } });
    if (!z) throw new NotFoundException('Zona no encontrada');
    return this.prisma.zonaComun.update({ where: { id }, data: dto });
  }

  async listar(copropiedadId: string, u: UsuarioActual, desde?: string) {
    const gestor = u.esSuperAdmin || ES_GESTOR(u.roles) || u.roles.includes('PORTERIA');
    const r = await this.prisma.reserva.findMany({
      where: {
        zona: { copropiedadId },
        ...(gestor ? {} : { usuarioId: u.id }),
        ...(desde ? { inicio: { gte: new Date(desde) } } : {}),
      },
      include: { zona: true, unidad: { include: { torre: true } }, usuario: { select: { nombre: true } } },
      orderBy: { inicio: 'desc' },
      take: 300,
    });
    return r.map((x) => ({ ...x, zona: x.zona.nombre, unidad: nombreUnidad(x.unidad), usuario: x.usuario.nombre, tarifa: num(x.zona.tarifa) }));
  }

  /** Ocupación de una zona en un día (para mostrar disponibilidad sin exponer datos personales). */
  async ocupacion(copropiedadId: string, zonaId: string, dia: string) {
    const inicio = new Date(`${dia}T00:00:00-05:00`);
    const fin = new Date(inicio.getTime() + 86_400_000);
    return this.prisma.reserva.findMany({
      where: { zonaId, zona: { copropiedadId }, estado: { in: ['PENDIENTE', 'APROBADA'] }, inicio: { lt: fin }, fin: { gt: inicio } },
      select: { inicio: true, fin: true, estado: true },
      orderBy: { inicio: 'asc' },
    });
  }

  async crear(copropiedadId: string, u: UsuarioActual, dto: ReservaDto) {
    const acceso = await this.unidades.unidadesDe(copropiedadId, u);
    if (acceso !== 'todas' && !acceso.includes(dto.unidadId)) throw new ForbiddenException('No tienes acceso a esa unidad');
    const zona = await this.prisma.zonaComun.findFirst({ where: { id: dto.zonaId, copropiedadId, activa: true } });
    if (!zona) throw new NotFoundException('Zona no disponible');
    const inicio = new Date(dto.inicio);
    const fin = new Date(dto.fin);
    validarHorario(zona, inicio, fin);
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${zona.id}))`;
      const cruce = await tx.reserva.count({
        where: { zonaId: zona.id, estado: { in: ['PENDIENTE', 'APROBADA'] }, inicio: { lt: fin }, fin: { gt: inicio } },
      });
      if (cruce) throw new BadRequestException('Ese horario ya está reservado');
      const r = await tx.reserva.create({
        data: { zonaId: zona.id, unidadId: dto.unidadId, usuarioId: u.id, inicio, fin, nota: dto.nota, estado: zona.requiereAprobacion ? 'PENDIENTE' : 'APROBADA' },
      });
      if (!zona.requiereAprobacion) await this.cobrar(tx, copropiedadId, r.id);
      await this.auditoria.registrar({ tx, copropiedadId, usuarioId: u.id, accion: 'RESERVAR', entidad: 'Reserva', entidadId: r.id });
      return r;
    });
  }

  /** Si la zona tiene tarifa, genera el cargo (gravado con IVA si la copropiedad es responsable). */
  private async cobrar(tx: any, copropiedadId: string, reservaId: string) {
    const r = await tx.reserva.findUniqueOrThrow({ where: { id: reservaId }, include: { zona: true } });
    const tarifa = num(r.zona.tarifa);
    if (tarifa <= 0 || r.cargoId) return;
    const fecha = r.inicio.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' });
    const cargo = await this.cobros.cargoInterno(tx, copropiedadId, 'RESERVA', r.unidadId, tarifa, `Reserva ${r.zona.nombre} ${fecha}`, periodoActual(), r.inicio);
    await tx.reserva.update({ where: { id: reservaId }, data: { cargoId: cargo.id } });
  }

  async decidir(copropiedadId: string, id: string, usuarioId: string, aprobar: boolean) {
    return this.prisma.$transaction(async (tx) => {
      const r = await tx.reserva.findFirst({ where: { id, zona: { copropiedadId } } });
      if (!r) throw new NotFoundException('Reserva no encontrada');
      if (r.estado !== 'PENDIENTE') throw new BadRequestException('La reserva ya fue gestionada');
      await tx.reserva.update({ where: { id }, data: { estado: aprobar ? 'APROBADA' : 'RECHAZADA' } });
      if (aprobar) await this.cobrar(tx, copropiedadId, id);
      await this.auditoria.registrar({ tx, copropiedadId, usuarioId, accion: aprobar ? 'APROBAR' : 'RECHAZAR', entidad: 'Reserva', entidadId: id });
      return { ok: true };
    });
  }

  async cancelar(copropiedadId: string, id: string, u: UsuarioActual) {
    const r = await this.prisma.reserva.findFirst({ where: { id, zona: { copropiedadId } } });
    if (!r) throw new NotFoundException('Reserva no encontrada');
    if (r.usuarioId !== u.id && !(u.esSuperAdmin || ES_GESTOR(u.roles))) throw new ForbiddenException('No puedes cancelar esta reserva');
    if (!['PENDIENTE', 'APROBADA'].includes(r.estado)) throw new BadRequestException('La reserva no está activa');
    await this.prisma.reserva.update({ where: { id }, data: { estado: 'CANCELADA' } });
    if (r.cargoId) {
      const cargo = await this.prisma.cargo.findUnique({ where: { id: r.cargoId }, include: { aplicaciones: true } });
      if (cargo && cargo.estado === 'PENDIENTE' && cargo.aplicaciones.length === 0) {
        await this.cobros.anularCargo(copropiedadId, cargo.id, u.id, 'Reserva cancelada');
      }
    }
    await this.auditoria.registrar({ copropiedadId, usuarioId: u.id, accion: 'CANCELAR', entidad: 'Reserva', entidadId: id });
    return { ok: true };
  }
}

@ApiTags('Reservas')
@ApiBearerAuth()
@Controller('copropiedades/:copId/reservas')
export class ReservasController {
  constructor(private readonly svc: ReservasService) {}

  @Get('zonas')
  zonas(@Param('copId') copId: string) {
    return this.svc.zonas(copId);
  }

  @Post('zonas')
  @Roles(...GESTION)
  crearZona(@Param('copId') copId: string, @Body() dto: ZonaDto) {
    return this.svc.crearZona(copId, dto);
  }

  @Patch('zonas/:id')
  @Roles(...GESTION)
  actualizarZona(@Param('copId') copId: string, @Param('id') id: string, @Body() dto: ZonaDto) {
    return this.svc.actualizarZona(copId, id, dto);
  }

  @Get('zonas/:id/ocupacion')
  ocupacion(@Param('copId') copId: string, @Param('id') id: string, @Query('dia') dia: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia ?? '')) throw new BadRequestException('Indica el día en formato AAAA-MM-DD');
    return this.svc.ocupacion(copId, id, dia);
  }

  @Get()
  listar(@Param('copId') copId: string, @Actual() u: UsuarioActual, @Query('desde') desde?: string) {
    return this.svc.listar(copId, u, desde);
  }

  @Post()
  crear(@Param('copId') copId: string, @Actual() u: UsuarioActual, @Body() dto: ReservaDto) {
    return this.svc.crear(copId, u, dto);
  }

  @Post(':id/aprobar')
  @Roles(...GESTION)
  aprobar(@Param('copId') copId: string, @Param('id') id: string, @Actual() u: UsuarioActual) {
    return this.svc.decidir(copId, id, u.id, true);
  }

  @Post(':id/rechazar')
  @Roles(...GESTION)
  rechazar(@Param('copId') copId: string, @Param('id') id: string, @Actual() u: UsuarioActual) {
    return this.svc.decidir(copId, id, u.id, false);
  }

  @Post(':id/cancelar')
  cancelar(@Param('copId') copId: string, @Param('id') id: string, @Actual() u: UsuarioActual) {
    return this.svc.cancelar(copId, id, u);
  }
}
