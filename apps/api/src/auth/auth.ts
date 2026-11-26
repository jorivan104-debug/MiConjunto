import { Body, Controller, Get, Injectable, Post, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Actual, Public, UsuarioActual } from '../common/decorators';
import { AuditoriaService } from '../common/auditoria.service';
import { PrismaService } from '../prisma/prisma.service';

export const VERSION_POLITICA_DATOS = '2026-11';

export class LoginDto {
  @IsEmail({}, { message: 'Correo inválido' })
  email: string;
  @IsString()
  password: string;
}

export class CambiarPasswordDto {
  @IsString()
  actual: string;
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  nueva: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async login(dto: LoginDto) {
    const u = await this.prisma.usuario.findUnique({ where: { email: dto.email.toLowerCase().trim() } });
    if (!u || !u.activo || !(await bcrypt.compare(dto.password, u.passwordHash))) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }
    await this.auditoria.registrar({ usuarioId: u.id, accion: 'LOGIN', entidad: 'Usuario', entidadId: u.id });
    const token = await this.jwt.signAsync({ sub: u.id, email: u.email, sa: u.esSuperAdmin });
    return { token, usuario: await this.perfil(u.id) };
  }

  async perfil(id: string) {
    const u = await this.prisma.usuario.findUniqueOrThrow({
      where: { id },
      include: {
        membresias: {
          include: {
            copropiedad: {
              select: {
                id: true,
                nombre: true,
                ciudad: true,
                membresias: { where: { rol: 'ADMINISTRADOR' }, select: { usuario: { select: { nombre: true } } } },
              },
            },
          },
        },
        vinculos: { where: { hasta: null }, include: { unidad: { include: { torre: true } } } },
      },
    });
    type Cop = { id: string; nombre: string; ciudad: string | null; administracion: string | null; roles: string[] };
    const copropiedades = new Map<string, Cop>();
    for (const m of u.membresias) {
      const { membresias: admins, ...cop } = m.copropiedad;
      const c = copropiedades.get(m.copropiedadId) ?? { ...cop, administracion: admins.map((a) => a.usuario.nombre).join(', ') || null, roles: [] };
      c.roles.push(m.rol);
      copropiedades.set(m.copropiedadId, c);
    }
    return {
      id: u.id,
      email: u.email,
      nombre: u.nombre,
      celular: u.celular,
      esSuperAdmin: u.esSuperAdmin,
      debeCambiarPassword: u.debeCambiarPassword,
      autorizacionDatos: !!u.autorizacionDatosAt && u.autorizacionVersion === VERSION_POLITICA_DATOS,
      copropiedades: [...copropiedades.values()],
      unidades: u.vinculos.map((v) => ({
        id: v.unidad.id,
        copropiedadId: v.unidad.copropiedadId,
        nombre: `${v.unidad.torre ? v.unidad.torre.nombre + ' - ' : ''}${v.unidad.numero}`,
        vinculo: v.vinculo,
      })),
    };
  }

  async cambiarPassword(userId: string, dto: CambiarPasswordDto) {
    const u = await this.prisma.usuario.findUniqueOrThrow({ where: { id: userId } });
    if (!(await bcrypt.compare(dto.actual, u.passwordHash))) throw new BadRequestException('La contraseña actual no coincide');
    await this.prisma.usuario.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(dto.nueva, 10), debeCambiarPassword: false },
    });
    await this.auditoria.registrar({ usuarioId: userId, accion: 'CAMBIO_PASSWORD', entidad: 'Usuario', entidadId: userId });
    return { ok: true };
  }

  /** Ley 1581 de 2012: guarda la autorización de tratamiento de datos con fecha y versión. */
  async autorizarDatos(userId: string) {
    await this.prisma.usuario.update({
      where: { id: userId },
      data: { autorizacionDatosAt: new Date(), autorizacionVersion: VERSION_POLITICA_DATOS },
    });
    await this.auditoria.registrar({
      usuarioId: userId,
      accion: 'AUTORIZACION_DATOS',
      entidad: 'Usuario',
      entidadId: userId,
      detalle: { version: VERSION_POLITICA_DATOS },
    });
    return { ok: true };
  }
}

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly svc: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.svc.login(dto);
  }

  @ApiBearerAuth()
  @Get('perfil')
  perfil(@Actual() u: UsuarioActual) {
    return this.svc.perfil(u.id);
  }

  @ApiBearerAuth()
  @Post('cambiar-password')
  cambiar(@Actual() u: UsuarioActual, @Body() dto: CambiarPasswordDto) {
    return this.svc.cambiarPassword(u.id, dto);
  }

  @ApiBearerAuth()
  @Post('autorizar-datos')
  autorizar(@Actual() u: UsuarioActual) {
    return this.svc.autorizarDatos(u.id);
  }

  @Public()
  @Get('politica-datos')
  politica() {
    return {
      version: VERSION_POLITICA_DATOS,
      texto:
        'La copropiedad, como responsable del tratamiento, y Mi Conjunto, como encargado, tratan sus datos personales (identificación, contacto, unidad, pagos, solicitudes y reservas) para administrar la propiedad horizontal conforme a la Ley 675 de 2001 y la Ley 1581 de 2012. Usted puede conocer, actualizar, rectificar y suprimir sus datos y revocar esta autorización escribiendo a la administración de su copropiedad.',
    };
  }
}
