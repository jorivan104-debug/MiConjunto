import { Body, Controller, ForbiddenException, Get, Injectable, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EstadoPqrs, TipoPqrs } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Actual, ES_GESTOR, GESTION, Roles, UsuarioActual } from '../common/decorators';
import { AuditoriaService } from '../common/auditoria.service';
import { PrismaService } from '../prisma/prisma.service';
import { nombreUnidad, UnidadesService } from '../unidades/unidades';

export class CrearPqrsDto {
  @IsEnum(TipoPqrs) tipo: TipoPqrs;
  @IsString() @MinLength(3) asunto: string;
  @IsString() @MinLength(3) descripcion: string;
  @IsOptional() @IsString() unidadId?: string;
}

export class GestionPqrsDto {
  @IsOptional() @IsEnum(EstadoPqrs) estado?: EstadoPqrs;
  @IsOptional() @IsString() asignadoId?: string;
  @IsOptional() @IsString() respuesta?: string;
}

@Injectable()
export class PqrsService {
  constructor(private readonly prisma: PrismaService, private readonly auditoria: AuditoriaService, private readonly unidades: UnidadesService) {}

  private gestor = (u: UsuarioActual) => u.esSuperAdmin || ES_GESTOR(u.roles);

  async listar(copropiedadId: string, u: UsuarioActual) {
    const lista = await this.prisma.pqrs.findMany({
      where: { copropiedadId, ...(this.gestor(u) ? {} : { autorId: u.id }) },
      include: { unidad: { include: { torre: true } }, autor: { select: { nombre: true } }, asignado: { select: { nombre: true } }, _count: { select: { comentarios: true } } },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    return lista.map((p) => ({
      ...p,
      unidad: p.unidad ? nombreUnidad(p.unidad) : null,
      autor: p.autor.nombre,
      asignado: p.asignado?.nombre ?? null,
      comentarios: p._count.comentarios,
      diasAbierta: Math.floor(((p.resueltaAt ?? new Date()).getTime() - p.createdAt.getTime()) / 86_400_000),
    }));
  }

  async obtener(copropiedadId: string, id: string, u: UsuarioActual) {
    const p = await this.prisma.pqrs.findFirst({
      where: { id, copropiedadId },
      include: { comentarios: { include: { autor: { select: { nombre: true } } }, orderBy: { createdAt: 'asc' } }, autor: { select: { nombre: true } }, unidad: { include: { torre: true } } },
    });
    if (!p) throw new NotFoundException('Solicitud no encontrada');
    if (!this.gestor(u) && p.autorId !== u.id) throw new ForbiddenException('No puedes ver esta solicitud');
    return { ...p, unidad: p.unidad ? nombreUnidad(p.unidad) : null, autor: p.autor.nombre, comentarios: p.comentarios.map((c) => ({ ...c, autor: c.autor.nombre })) };
  }

  async crear(copropiedadId: string, u: UsuarioActual, dto: CrearPqrsDto) {
    if (dto.unidadId) {
      const acceso = await this.unidades.unidadesDe(copropiedadId, u);
      if (acceso !== 'todas' && !acceso.includes(dto.unidadId)) throw new ForbiddenException('No tienes acceso a esa unidad');
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'pqrs' + copropiedadId}))`;
      const ultimo = await tx.pqrs.aggregate({ where: { copropiedadId }, _max: { radicado: true } });
      const p = await tx.pqrs.create({ data: { copropiedadId, autorId: u.id, radicado: (ultimo._max.radicado ?? 0) + 1, ...dto } });
      await this.auditoria.registrar({ tx, copropiedadId, usuarioId: u.id, accion: 'RADICAR', entidad: 'Pqrs', entidadId: p.id });
      return p;
    });
  }

  async gestionar(copropiedadId: string, id: string, usuarioId: string, dto: GestionPqrsDto) {
    const p = await this.prisma.pqrs.findFirst({ where: { id, copropiedadId } });
    if (!p) throw new NotFoundException('Solicitud no encontrada');
    const resuelta = dto.estado === 'RESUELTA' || dto.estado === 'CERRADA';
    const r = await this.prisma.pqrs.update({
      where: { id },
      data: { ...dto, resueltaAt: resuelta ? p.resueltaAt ?? new Date() : dto.estado ? null : undefined },
    });
    await this.auditoria.registrar({ copropiedadId, usuarioId, accion: 'GESTIONAR', entidad: 'Pqrs', entidadId: id, detalle: dto as object });
    return r;
  }

  async comentar(copropiedadId: string, id: string, u: UsuarioActual, texto: string) {
    await this.obtener(copropiedadId, id, u);
    return this.prisma.pqrsComentario.create({ data: { pqrsId: id, autorId: u.id, texto } });
  }
}

@ApiTags('PQRS')
@ApiBearerAuth()
@Controller('copropiedades/:copId/pqrs')
export class PqrsController {
  constructor(private readonly svc: PqrsService) {}

  @Get()
  listar(@Param('copId') copId: string, @Actual() u: UsuarioActual) {
    return this.svc.listar(copId, u);
  }

  @Get(':id')
  obtener(@Param('copId') copId: string, @Param('id') id: string, @Actual() u: UsuarioActual) {
    return this.svc.obtener(copId, id, u);
  }

  @Post()
  crear(@Param('copId') copId: string, @Actual() u: UsuarioActual, @Body() dto: CrearPqrsDto) {
    return this.svc.crear(copId, u, dto);
  }

  @Patch(':id')
  @Roles(...GESTION, 'CONSEJO')
  gestionar(@Param('copId') copId: string, @Param('id') id: string, @Actual() u: UsuarioActual, @Body() dto: GestionPqrsDto) {
    return this.svc.gestionar(copId, id, u.id, dto);
  }

  @Post(':id/comentarios')
  comentar(@Param('copId') copId: string, @Param('id') id: string, @Actual() u: UsuarioActual, @Body('texto') texto: string) {
    return this.svc.comentar(copId, id, u, texto);
  }
}
