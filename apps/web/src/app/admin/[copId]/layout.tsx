'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BookOpen, Building, CalendarDays, ChevronsLeft, ChevronsRight, FileText, Home, LogOut, Megaphone, MessageSquareWarning,
  Receipt, Settings, Users, Wallet,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { CopContext, tieneRol } from '@/components/contexto';
import { cn, Logo } from '@/components/ui';
import { ROLES } from '@/lib/format';

const MENU = [
  { href: '', texto: 'Tablero', icono: Home, roles: ['ADMINISTRADOR', 'ASISTENTE', 'CONTADOR', 'CONSEJO', 'REVISOR_FISCAL'] },
  { href: '/unidades', texto: 'Unidades', icono: Building, roles: ['ADMINISTRADOR', 'ASISTENTE', 'CONTADOR', 'CONSEJO', 'REVISOR_FISCAL', 'PORTERIA'] },
  { href: '/cobros', texto: 'Cobros y cartera', icono: Receipt, roles: ['ADMINISTRADOR', 'ASISTENTE', 'CONTADOR', 'CONSEJO', 'REVISOR_FISCAL'] },
  { href: '/pagos', texto: 'Pagos', icono: Wallet, roles: ['ADMINISTRADOR', 'ASISTENTE', 'CONTADOR', 'CONSEJO', 'REVISOR_FISCAL'] },
  { href: '/contabilidad', texto: 'Contabilidad', icono: BookOpen, roles: ['ADMINISTRADOR', 'ASISTENTE', 'CONTADOR', 'CONSEJO', 'REVISOR_FISCAL'] },
  { href: '/comunicados', texto: 'Comunicados', icono: Megaphone, roles: [] },
  { href: '/pqrs', texto: 'PQRS', icono: MessageSquareWarning, roles: ['ADMINISTRADOR', 'ASISTENTE', 'CONSEJO', 'REVISOR_FISCAL', 'CONTADOR'] },
  { href: '/reservas', texto: 'Reservas', icono: CalendarDays, roles: ['ADMINISTRADOR', 'ASISTENTE', 'CONSEJO', 'PORTERIA'] },
  { href: '/documentos', texto: 'Documentos', icono: FileText, roles: [] },
  { href: '/equipo', texto: 'Equipo y roles', icono: Users, roles: ['ADMINISTRADOR'] },
  { href: '/configuracion', texto: 'Configuración', icono: Settings, roles: ['ADMINISTRADOR'] },
];

export default function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ copId: string }> }) {
  const { copId } = use(params);
  const { perfil, cargando, salir } = useAuth();
  const router = useRouter();
  const ruta = usePathname();
  const [colapsado, setColapsado] = useState(false);

  useEffect(() => {
    if (!cargando && !perfil) router.replace('/login');
  }, [perfil, cargando, router]);
  if (!perfil) return null;
  const cop = perfil.copropiedades.find((c) => c.id === copId);
  if (!cop && !perfil.esSuperAdmin) return <p className="p-8">No tienes acceso a esta copropiedad.</p>;
  const ctx = { copId, nombre: cop?.nombre ?? 'Copropiedad', roles: cop?.roles ?? [], esSuperAdmin: perfil.esSuperAdmin };
  const base = `/admin/${copId}`;
  const items = MENU.filter((m) => m.roles.length === 0 || tieneRol(ctx, ...m.roles));
  const esResidente = ctx.roles.some((r) => r === 'PROPIETARIO' || r === 'RESIDENTE');

  return (
    <CopContext.Provider value={ctx}>
      <div className="flex min-h-screen">
        <motion.aside
          animate={{ width: colapsado ? 76 : 264 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-ink-200 bg-white p-3 md:flex"
        >
          <div className="mb-4 flex h-14 items-center px-2">
            {colapsado ? <Logo variante="icono" className="h-8" /> : <Logo variante="nombre" className="h-9" />}
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {items.map((m) => {
              const href = base + m.href;
              const activo = m.href === '' ? ruta === base : ruta.startsWith(href);
              return (
                <Link key={m.href} href={href} className={cn('nav-item', activo && 'active', colapsado && 'justify-center')} title={m.texto}>
                  <m.icono size={18} />
                  {!colapsado && <span>{m.texto}</span>}
                </Link>
              );
            })}
          </nav>
          <div className="space-y-1 border-t border-ink-100 pt-3">
            {esResidente && !colapsado && (
              <Link href={`/portal/${copId}`} className="nav-item">
                <Home size={18} /> Mi unidad
              </Link>
            )}
            <button onClick={() => setColapsado(!colapsado)} className={cn('nav-item w-full', colapsado && 'justify-center')}>
              {colapsado ? <ChevronsRight size={18} /> : <><ChevronsLeft size={18} /> Contraer</>}
            </button>
            <button onClick={salir} className={cn('nav-item w-full', colapsado && 'justify-center')}>
              <LogOut size={18} />
              {!colapsado && 'Salir'}
            </button>
          </div>
        </motion.aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink-200 bg-white/80 px-4 backdrop-blur md:px-8">
            <div className="flex items-center gap-3">
              <Logo variante="icono" className="h-7 md:hidden" />
              <div>
                <p className="font-semibold text-brand-navy">{ctx.nombre}</p>
                <p className="text-xs text-ink-500">{ctx.roles.map((r) => ROLES[r]).join(' · ') || 'Superadministrador'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {perfil.copropiedades.length > 1 && <Link href="/copropiedades" className="text-sm text-brand-blue hover:underline">Cambiar</Link>}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-green-light text-sm font-semibold text-brand-green-700" title={perfil.nombre}>
                {perfil.nombre.split(' ').map((p) => p[0]).slice(0, 2).join('')}
              </div>
            </div>
          </header>
          <nav className="flex gap-1 overflow-x-auto border-b border-ink-200 bg-white px-2 py-2 md:hidden">
            {items.map((m) => (
              <Link key={m.href} href={base + m.href} className={cn('nav-item shrink-0', (m.href === '' ? ruta === base : ruta.startsWith(base + m.href)) && 'active')}>
                <m.icono size={16} /> {m.texto}
              </Link>
            ))}
          </nav>
          <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </CopContext.Provider>
  );
}
