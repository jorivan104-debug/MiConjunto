import { Body, Controller, Get, Injectable, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { Actual, ES_GESTOR, GESTION, Roles, UsuarioActual } from '../common/decorators';
import { AuditoriaService } from '../common/auditoria.service';
import { PrismaService } from '../prisma/prisma.service';

export class ComunicadoDto {
  @IsString() @MinLength(3) titulo: string;
  @IsString() @MinLength(3) cuerpo: string;
}

@Injectable()
export class ComunicadosService {
  constructor(private readonly prisma: PrismaService, private readonly auditoria: AuditoriaService) {}

  async listar(copropiedadId: string, u: UsuarioActual) {
    const [lista, miembros] = await Promise.all([
      this.prisma.comunicado.findMany({
        where: { copropiedadId },
        include: { autor: { select: { nombre: true } }, lecturas: { select: { usuarioId: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.membresia.findMany({ where: { copropiedadId }, distinct: ['usuarioId'], select: { usuarioId: true } }),
    ]);
    const gestor = u.esSuperAdmin || ES_GESTOR(u.roles);
    return lista.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      cuerpo: c.cuerpo,
      autor: c.autor.nombre,
      createdAt: c.createdAt,
      leido: c.lecturas.some((l) => l.usuarioId === u.id),
      ...(gestor ? { lecturas: c.lecturas.length, destinatarios: miembros.length } : {}),
    }));
  }

  async crear(copropiedadId: string, autorId: string, dto: ComunicadoDto) {
    const c = await this.prisma.comunicado.create({ data: { copropiedadId, autorId, ...dto } });
    await this.auditoria.registrar({ copropiedadId, usuarioId: autorId, accion: 'PUBLICAR', entidad: 'Comunicado', entidadId: c.id });
    // Aquí se conectan los canales de envío (correo, WhatsApp, push) en la fase 2.
    return c;
  }

  async marcarLeido(copropiedadId: string, id: string, usuarioId: string) {
    const c = await this.prisma.comunicado.findFirst({ where: { id, copropiedadId } });
    if (!c) throw new NotFoundException('Comunicado no encontrado');
    await this.prisma.lecturaComunicado.upsert({
      where: { comunicadoId_usuarioId: { comunicadoId: id, usuarioId } },
      create: { comunicadoId: id, usuarioId },
      update: {},
    });
    return { ok: true };
  }
}

@ApiTags('Comunicados')
@ApiBearerAuth()
@Controller('copropiedades/:copId/comunicados')
export class ComunicadosController {
  constructor(private readonly svc: ComunicadosService) {}

  @Get()
  listar(@Param('copId') copId: string, @Actual() u: UsuarioActual) {
    return this.svc.listar(copId, u);
  }

  @Post()
  @Roles(...GESTION)
  crear(@Param('copId') copId: string, @Actual() u: UsuarioActual, @Body() dto: ComunicadoDto) {
    return this.svc.crear(copId, u.id, dto);
  }

  @Post(':id/leido')
  leido(@Param('copId') copId: string, @Param('id') id: string, @Actual() u: UsuarioActual) {
    return this.svc.marcarLeido(copId, id, u.id);
  }
}
