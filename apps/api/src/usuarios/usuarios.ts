import { BadRequestException, Body, Controller, Delete, Get, Injectable, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Rol } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Actual, Roles, UsuarioActual } from '../common/decorators';
import { AuditoriaService } from '../common/auditoria.service';
import { PrismaService } from '../prisma/prisma.service';
import { asegurarUsuario } from '../unidades/unidades';

export class MiembroDto {
  @IsEmail({}, { message: 'Correo inválido' }) email: string;
  @IsString() nombre: string;
  @IsOptional() @IsString() celular?: string;
  @IsEnum(Rol) rol: Rol;
}

export class TraspasoDto {
  @IsEmail({}, { message: 'Correo inválido' }) email: string;
  @IsString() nombre: string;
  @IsOptional() @IsString() celular?: string;
}

/** Equipo de la copropiedad: administración, contador, consejo, revisor fiscal y portería. */
@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService, private readonly auditoria: AuditoriaService) {}

  async listar(copropiedadId: string) {
    const m = await this.prisma.membresia.findMany({
      where: { copropiedadId },
      include: { usuario: { select: { id: true, nombre: true, email: true, celular: true, activo: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return m.map((x) => ({ membresiaId: x.id, rol: x.rol, ...x.usuario }));
  }

  async agregar(copropiedadId: string, usuarioId: string, dto: MiembroDto) {
    return this.prisma.$transaction(async (tx) => {
      const { usuario, passwordTemporal } = await asegurarUsuario(tx, dto);
      await tx.membresia.upsert({
        where: { usuarioId_copropiedadId_rol: { usuarioId: usuario.id, copropiedadId, rol: dto.rol } },
        create: { usuarioId: usuario.id, copropiedadId, rol: dto.rol },
        update: {},
      });
      await this.auditoria.registrar({ tx, copropiedadId, usuarioId, accion: 'ASIGNAR_ROL', entidad: 'Usuario', entidadId: usuario.id, detalle: { rol: dto.rol } });
      return { usuarioId: usuario.id, passwordTemporal };
    });
  }

  /**
   * Traspasa la titularidad del conjunto a otro administrador. Los datos (unidades, cartera,
   * contabilidad, documentos) pertenecen a la copropiedad y no se mueven; solo cambia quién la administra.
   * Los administradores anteriores pierden ese rol y conservan los demás (por ejemplo, si son propietarios).
   */
  async traspasar(copropiedadId: string, usuarioId: string, dto: TraspasoDto) {
    return this.prisma.$transaction(async (tx) => {
      const { usuario, passwordTemporal } = await asegurarUsuario(tx, dto);
      const anteriores = await tx.membresia.findMany({
        where: { copropiedadId, rol: 'ADMINISTRADOR', usuarioId: { not: usuario.id } },
        include: { usuario: { select: { id: true, nombre: true, email: true } } },
      });
      const yaEs = await tx.membresia.findUnique({
        where: { usuarioId_copropiedadId_rol: { usuarioId: usuario.id, copropiedadId, rol: 'ADMINISTRADOR' } },
      });
      if (yaEs && anteriores.length === 0) throw new BadRequestException('Esa persona ya es la administradora de este conjunto');
      if (!yaEs) await tx.membresia.create({ data: { usuarioId: usuario.id, copropiedadId, rol: 'ADMINISTRADOR' } });
      await tx.membresia.deleteMany({ where: { id: { in: anteriores.map((a) => a.id) } } });
      await this.auditoria.registrar({
        tx,
        copropiedadId,
        usuarioId,
        accion: 'TRASPASAR_ADMINISTRACION',
        entidad: 'Copropiedad',
        entidadId: copropiedadId,
        detalle: { nuevo: { id: usuario.id, email: usuario.email }, anteriores: anteriores.map((a) => a.usuario) },
      });
      return { usuarioId: usuario.id, passwordTemporal, anteriores: anteriores.map((a) => a.usuario.email) };
    });
  }

  async quitar(copropiedadId: string, membresiaId: string, usuarioId: string) {
    const m = await this.prisma.membresia.findFirst({ where: { id: membresiaId, copropiedadId } });
    if (!m) throw new BadRequestException('Rol no encontrado');
    if (m.rol === 'ADMINISTRADOR') {
      const admins = await this.prisma.membresia.count({ where: { copropiedadId, rol: 'ADMINISTRADOR' } });
      if (admins <= 1) throw new BadRequestException('La copropiedad debe tener al menos un administrador');
    }
    await this.prisma.membresia.delete({ where: { id: membresiaId } });
    await this.auditoria.registrar({ copropiedadId, usuarioId, accion: 'QUITAR_ROL', entidad: 'Usuario', entidadId: m.usuarioId, detalle: { rol: m.rol } });
    return { ok: true };
  }
}

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('copropiedades/:copId/usuarios')
@Roles('ADMINISTRADOR')
export class UsuariosController {
  constructor(private readonly svc: UsuariosService) {}

  @Get()
  listar(@Param('copId') copId: string) {
    return this.svc.listar(copId);
  }

  @Post()
  agregar(@Param('copId') copId: string, @Actual() u: UsuarioActual, @Body() dto: MiembroDto) {
    return this.svc.agregar(copId, u.id, dto);
  }

  @Post('traspaso')
  traspasar(@Param('copId') copId: string, @Actual() u: UsuarioActual, @Body() dto: TraspasoDto) {
    return this.svc.traspasar(copId, u.id, dto);
  }

  @Delete(':membresiaId')
  quitar(@Param('copId') copId: string, @Param('membresiaId') id: string, @Actual() u: UsuarioActual) {
    return this.svc.quitar(copId, id, u.id);
  }
}
