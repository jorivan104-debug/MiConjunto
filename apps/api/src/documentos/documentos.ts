import { BadRequestException, Body, Controller, Delete, Get, Injectable, NotFoundException, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Visibilidad } from '@prisma/client';
import type { Response } from 'express';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Actual, ES_GESTOR, GESTION, Roles, UsuarioActual } from '../common/decorators';
import { AuditoriaService } from '../common/auditoria.service';
import { PrismaService } from '../prisma/prisma.service';
import { almacenamiento } from './almacenamiento';

export class DocumentoDto {
  @IsString() titulo: string;
  @IsOptional() @IsString() categoria?: string;
  @IsOptional() @IsEnum(Visibilidad) visibilidad?: Visibilidad;
}

@Injectable()
export class DocumentosService {
  constructor(private readonly prisma: PrismaService, private readonly auditoria: AuditoriaService) {}

  private visibles(u: UsuarioActual): Visibilidad[] {
    if (u.esSuperAdmin || u.roles.some((r) => ['ADMINISTRADOR', 'ASISTENTE', 'CONTADOR', 'REVISOR_FISCAL'].includes(r))) return ['TODOS', 'CONSEJO', 'ADMINISTRACION'];
    if (u.roles.includes('CONSEJO')) return ['TODOS', 'CONSEJO'];
    return ['TODOS'];
  }

  listar(copropiedadId: string, u: UsuarioActual) {
    return this.prisma.documento.findMany({ where: { copropiedadId, visibilidad: { in: this.visibles(u) } }, orderBy: { createdAt: 'desc' } });
  }

  async subir(copropiedadId: string, usuarioId: string, dto: DocumentoDto, archivo?: Express.Multer.File) {
    if (!archivo) throw new BadRequestException('Adjunta un archivo');
    const ruta = await almacenamiento.guardar(copropiedadId, archivo);
    const d = await this.prisma.documento.create({ data: { copropiedadId, ...dto, archivo: ruta, mimeType: archivo.mimetype } });
    await this.auditoria.registrar({ copropiedadId, usuarioId, accion: 'SUBIR', entidad: 'Documento', entidadId: d.id });
    return d;
  }

  async descargar(copropiedadId: string, id: string, u: UsuarioActual) {
    const d = await this.prisma.documento.findFirst({ where: { id, copropiedadId, visibilidad: { in: this.visibles(u) } } });
    if (!d) throw new NotFoundException('Documento no encontrado');
    return { doc: d, contenido: await almacenamiento.leer(d.archivo) };
  }

  /** Soporte de pago: solo la administración o quien lo reportó. */
  async soportePago(copropiedadId: string, pagoId: string, u: UsuarioActual) {
    const p = await this.prisma.pago.findFirst({ where: { id: pagoId, copropiedadId } });
    if (!p?.soporteUrl) throw new NotFoundException('El pago no tiene soporte');
    if (!(u.esSuperAdmin || ES_GESTOR(u.roles)) && p.registradoPorId !== u.id) throw new NotFoundException('El pago no tiene soporte');
    return almacenamiento.leer(p.soporteUrl);
  }

  async eliminar(copropiedadId: string, id: string, usuarioId: string) {
    await this.prisma.documento.deleteMany({ where: { id, copropiedadId } });
    await this.auditoria.registrar({ copropiedadId, usuarioId, accion: 'ELIMINAR', entidad: 'Documento', entidadId: id });
    return { ok: true };
  }
}

@ApiTags('Documentos')
@ApiBearerAuth()
@Controller('copropiedades/:copId/documentos')
export class DocumentosController {
  constructor(private readonly svc: DocumentosService) {}

  @Get()
  listar(@Param('copId') copId: string, @Actual() u: UsuarioActual) {
    return this.svc.listar(copId, u);
  }

  @Post()
  @Roles(...GESTION)
  @UseInterceptors(FileInterceptor('archivo', { limits: { fileSize: 25 * 1024 * 1024 } }))
  subir(@Param('copId') copId: string, @Actual() u: UsuarioActual, @Body() dto: DocumentoDto, @UploadedFile() archivo?: Express.Multer.File) {
    return this.svc.subir(copId, u.id, dto, archivo);
  }

  @Get(':id/archivo')
  async descargar(@Param('copId') copId: string, @Param('id') id: string, @Actual() u: UsuarioActual, @Res() res: Response) {
    const { doc, contenido } = await this.svc.descargar(copId, id, u);
    res.setHeader('Content-Type', doc.mimeType ?? 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.titulo)}"`);
    res.send(contenido);
  }

  @Get('soportes-pago/:pagoId')
  async soporte(@Param('copId') copId: string, @Param('pagoId') pagoId: string, @Actual() u: UsuarioActual, @Res() res: Response) {
    res.send(await this.svc.soportePago(copId, pagoId, u));
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  eliminar(@Param('copId') copId: string, @Param('id') id: string, @Actual() u: UsuarioActual) {
    return this.svc.eliminar(copId, id, u.id);
  }
}
