'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from './api';

export interface Perfil {
  id: string;
  email: string;
  nombre: string;
  esSuperAdmin: boolean;
  debeCambiarPassword: boolean;
  autorizacionDatos: boolean;
  copropiedades: { id: string; nombre: string; ciudad: string | null; roles: string[] }[];
  unidades: { id: string; copropiedadId: string; nombre: string; vinculo: string }[];
}

interface Ctx {
  perfil: Perfil | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<Perfil>;
  salir: () => void;
  recargar: () => Promise<void>;
}

const AuthCtx = createContext<Ctx>(null as unknown as Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    if (!tokenStore.get()) {
      setPerfil(null);
      setCargando(false);
      return;
    }
    try {
      setPerfil(await api<Perfil>('/auth/perfil'));
    } catch {
      tokenStore.clear();
      setPerfil(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const login = async (email: string, password: string) => {
    const r = await api<{ token: string; usuario: Perfil }>('/auth/login', { body: { email, password } });
    tokenStore.set(r.token);
    setPerfil(r.usuario);
    return r.usuario;
  };

  const salir = () => {
    tokenStore.clear();
    setPerfil(null);
    window.location.href = '/login';
  };

  return <AuthCtx.Provider value={{ perfil, cargando, login, salir, recargar }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

/** Ruta inicial según el perfil: bienvenida, selector, panel o portal. */
export function rutaInicial(p: Perfil): string {
  if (p.debeCambiarPassword || !p.autorizacionDatos) return '/bienvenida';
  if (p.copropiedades.length !== 1) return '/copropiedades';
  const c = p.copropiedades[0];
  const gestor = p.esSuperAdmin || c.roles.some((r) => ['ADMINISTRADOR', 'ASISTENTE', 'CONTADOR', 'CONSEJO', 'REVISOR_FISCAL', 'PORTERIA'].includes(r));
  return gestor ? `/admin/${c.id}` : `/portal/${c.id}`;
}
