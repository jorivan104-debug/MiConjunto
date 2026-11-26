'use client';
import { createContext, useContext } from 'react';

export interface CopCtx {
  copId: string;
  nombre: string;
  roles: string[];
  esSuperAdmin: boolean;
}
export const CopContext = createContext<CopCtx>(null as unknown as CopCtx);
export const useCop = () => useContext(CopContext);
export const tieneRol = (c: CopCtx, ...roles: string[]) => c.esSuperAdmin || c.roles.some((r) => roles.includes(r));
