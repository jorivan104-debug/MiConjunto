'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { rutaInicial, useAuth } from '@/lib/auth';
import { Boton, Campo, Logo, Tarjeta, useAviso } from '@/components/ui';

/** Primer ingreso: cambio de contraseña temporal y autorización de datos (Ley 1581 de 2012). */
export default function Bienvenida() {
  const { perfil, cargando, recargar } = useAuth();
  const router = useRouter();
  const avisar = useAviso();
  const [politica, setPolitica] = useState<{ version: string; texto: string } | null>(null);
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [acepta, setAcepta] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api('/auth/politica-datos').then(setPolitica);
  }, []);
  useEffect(() => {
    if (!cargando && !perfil) router.replace('/login');
    if (perfil && !perfil.debeCambiarPassword && perfil.autorizacionDatos) router.replace(rutaInicial(perfil));
  }, [perfil, cargando, router]);
  if (!perfil) return null;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      if (perfil.debeCambiarPassword) await api('/auth/cambiar-password', { body: { actual, nueva } });
      if (!perfil.autorizacionDatos) {
        if (!acepta) throw new Error('Debes aceptar la política de tratamiento de datos para continuar');
        await api('/auth/autorizar-datos', { method: 'POST' });
      }
      await recargar();
    } catch (err: any) {
      avisar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 p-4">
      <Tarjeta className="w-full max-w-lg p-8">
        <Logo variante="nombre" className="mb-6 h-10" />
        <h1 className="text-2xl">Hola, {perfil.nombre.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-ink-500">Antes de empezar necesitamos dos cosas.</p>
        <form onSubmit={enviar} className="mt-6 space-y-5">
          {perfil.debeCambiarPassword && (
            <div className="space-y-3">
              <h3>1. Crea tu contraseña</h3>
              <Campo etiqueta="Contraseña temporal" type="password" value={actual} onChange={(e) => setActual(e.target.value)} required />
              <Campo etiqueta="Nueva contraseña" type="password" minLength={8} value={nueva} onChange={(e) => setNueva(e.target.value)} ayuda="Mínimo 8 caracteres" required />
            </div>
          )}
          {!perfil.autorizacionDatos && politica && (
            <div className="space-y-3">
              <h3>{perfil.debeCambiarPassword ? '2. ' : ''}Autorización de tratamiento de datos</h3>
              <p className="rounded-xl bg-ink-50 p-4 text-sm leading-relaxed text-ink-700">{politica.texto}</p>
              <label className="flex items-start gap-3 text-sm text-ink-700">
                <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[#1F7C3A]" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />
                Autorizo el tratamiento de mis datos personales según esta política (versión {politica.version}).
              </label>
            </div>
          )}
          <Boton type="submit" cargando={enviando} className="w-full" tamano="lg">
            Continuar
          </Boton>
        </form>
      </Tarjeta>
    </main>
  );
}
