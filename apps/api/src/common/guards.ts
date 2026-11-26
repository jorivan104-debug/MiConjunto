import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Rol } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PUBLIC_KEY, ROLES_KEY } from './decorators';

/**
 * Guard global: valida el JWT y, si la ruta tiene :copId, verifica que el usuario
 * pertenezca a esa copropiedad y tenga uno de los roles exigidos.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Falta el token de acceso');
    let payload: { sub: string; email: string; sa: boolean };
    try {
      payload = await this.jwt.verifyAsync(header.slice(7));
    } catch {
      throw new UnauthorizedException('Token inválido o vencido');
    }
    const user = { id: payload.sub, email: payload.email, esSuperAdmin: payload.sa, roles: [] as Rol[] };
    req.user = user;

    const copId: string | undefined = req.params?.copId;
    if (!copId) return true;

    const membresias = await this.prisma.membresia.findMany({
      where: { usuarioId: user.id, copropiedadId: copId },
      select: { rol: true },
    });
    user.roles = membresias.map((m) => m.rol);
    if (user.esSuperAdmin) {
      user.roles = Array.from(new Set<Rol>([...user.roles, 'ADMINISTRADOR']));
      return true;
    }
    if (user.roles.length === 0) throw new ForbiddenException('No perteneces a esta copropiedad');

    const requeridos = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (requeridos?.length && !user.roles.some((r) => requeridos.includes(r))) {
      throw new ForbiddenException('Tu rol no permite esta acción');
    }
    return true;
  }
}
