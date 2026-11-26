'use client';
import { use, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CalendarDays, Home, LayoutDashboard, LogOut, Megaphone, MessageSquareWarning, Wallet } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { GESTORES } from '@/lib/format';
import { CopContext } from '@/components/contexto';
import { cn, Logo } from '@/components/ui';

const NAV = [
  { href: '', texto: 'Inicio', icono: Home },
  { href: '/pagos', texto: 'Pagos', icono: Wallet },
  { href: '/reservas', texto: 'Reservas', icono: CalendarDays },
  { href: '/pqrs', texto: 'PQRS', icono: MessageSquareWarning },
  { href: '/comunicados', texto: 'Avisos', icono: Megaphone },
];

export default function PortalLayout({ children, params }: { children: React.ReactNode; params: Promise<{ copId: string }> }) {
  const { copId } = use(params);
  const { perfil, cargando, salir } = useAuth();
  const router = useRouter();
  const ruta = usePathname();
  useEffect(() => {
    if (!cargando && !perfil) router.replace('/login');
  }, [perfil, cargando, router]);
  if (!perfil) return null;
  const cop = perfil.copropiedades.find((c) => c.id === copId);
  const ctx = { copId, nombre: cop?.nombre ?? '', roles: cop?.roles ?? [], esSuperAdmin: perfil.esSuperAdmin };
  const gestor = perfil.esSuperAdmin || ctx.roles.some((r) => GESTORES.includes(r));
  const base = `/portal/${copId}`;

  return (
    <CopContext.Provider value={ctx}>
      <div className="min-h-screen pb-24 md:pb-8">
        <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
            <Logo variante="nombre" className="h-8" />
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((n) => {
                const activo = n.href === '' ? ruta === base : ruta.startsWith(base + n.href);
                return <Link key={n.href} href={base + n.href} className={cn('nav-item', activo && 'active')}><n.icono size={16} /> {n.texto}</Link>;
              })}
            </nav>
            <div className="flex items-center gap-1">
              {gestor && <Link href={`/admin/${copId}`} className="nav-item" title="Panel de administración"><LayoutDashboard size={18} /></Link>}
              <button onClick={salir} className="nav-item" aria-label="Salir"><LogOut size={18} /></button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl p-4 md:p-8">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white/95 backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-md grid-cols-5">
            {NAV.map((n) => {
              const activo = n.href === '' ? ruta === base : ruta.startsWith(base + n.href);
              return (
                <Link key={n.href} href={base + n.href} className={cn('relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium', activo ? 'text-brand-blue' : 'text-ink-500')}>
                  {activo && <motion.span layoutId="marcador" className="absolute top-0 h-1 w-8 rounded-b-full bg-brand-blue" />}
                  <n.icono size={20} />
                  {n.texto}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </CopContext.Provider>
  );
}
