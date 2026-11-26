import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Rol } from '@prisma/client';

export const PUBLIC_KEY = 'public';
/** Ruta sin autenticación. */
export const Public = () => SetMetadata(PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
/**
 * Roles permitidos dentro de la copropiedad indicada en el parámetro :copId.
 * Sin roles = cualquier miembro de la copropiedad.
 */
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);

export interface UsuarioActual {
  id: string;
  email: string;
  esSuperAdmin: boolean;
  /** Roles del usuario en la copropiedad de la ruta (lo llena el guard). */
  roles: Rol[];
}

export const Actual = createParamDecorator((_: unknown, ctx: ExecutionContext): UsuarioActual => {
  return ctx.switchToHttp().getRequest().user;
});

/** Grupos de roles usados con frecuencia. */
export const GESTION: Rol[] = ['ADMINISTRADOR', 'ASISTENTE'];
export const FINANZAS: Rol[] = ['ADMINISTRADOR', 'ASISTENTE', 'CONTADOR'];
export const LECTURA_FINANCIERA: Rol[] = ['ADMINISTRADOR', 'ASISTENTE', 'CONTADOR', 'CONSEJO', 'REVISOR_FISCAL'];
export const ES_GESTOR = (roles: Rol[]) => roles.some((r) => ['ADMINISTRADOR', 'ASISTENTE', 'CONTADOR', 'CONSEJO', 'REVISOR_FISCAL'].includes(r));
