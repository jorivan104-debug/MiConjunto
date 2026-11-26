'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { rutaInicial, useAuth } from '@/lib/auth';
import { Boton, Campo, Logo, Tarjeta } from '@/components/ui';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      const p = await login(email, password);
      router.replace(rutaInicial(p));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-green-light via-white to-brand-blue-light p-4">
      <Tarjeta className="w-full max-w-md p-8 animate-scale-fade-in">
        <Logo className="mx-auto mb-6 h-36 w-36" />
        <h1 className="text-center text-2xl">Bienvenido</h1>
        <p className="mb-6 mt-1 text-center text-sm text-ink-500">Ingresa para ver tu conjunto</p>
        <form onSubmit={enviar} className="space-y-4">
          <Campo etiqueta="Correo" type="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Campo etiqueta="Contraseña" type="password" name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="rounded-xl bg-brand-red-light px-3 py-2 text-sm text-brand-red-700">{error}</p>}
          <Boton type="submit" cargando={cargando} className="w-full" tamano="lg">
            Ingresar
          </Boton>
        </form>
      </Tarjeta>
    </main>
  );
}
