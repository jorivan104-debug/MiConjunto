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

  @Delete(':membresiaId')
  quitar(@Param('copId') copId: string, @Param('membresiaId') id: string, @Actual() u: UsuarioActual) {
    return this.svc.quitar(copId, id, u.id);
  }
}
