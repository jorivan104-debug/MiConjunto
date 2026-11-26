'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { rutaInicial, useAuth } from '@/lib/auth';
import { Logo } from '@/components/ui';

export default function Inicio() {
  const { perfil, cargando } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (cargando) return;
    router.replace(perfil ? rutaInicial(perfil) : '/login');
  }, [perfil, cargando, router]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white">
      <Logo className="h-40 w-40 animate-scale-fade-in" />
      <div className="h-1 w-40 overflow-hidden rounded-full bg-ink-100">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-brand-green" />
      </div>
    </div>
  );
}
