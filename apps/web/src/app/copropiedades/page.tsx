'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { GESTORES, ROLES } from '@/lib/format';
import { Boton, Campo, Dialogo, Encabezado, Logo, Selector, Tarjeta, Vacio, useAviso } from '@/components/ui';

export default function Copropiedades() {
  const { perfil, cargando, recargar, salir } = useAuth();
  const router = useRouter();
  const avisar = useAviso();
  const [abierto, setAbierto] = useState(false);
  const [f, setF] = useState({ nit: '', nombre: '', tipo: 'RESIDENCIAL', ciudad: '', direccion: '' });

  useEffect(() => {
    if (!cargando && !perfil) router.replace('/login');
  }, [perfil, cargando, router]);
  if (!perfil) return null;

  type Cop = (typeof perfil.copropiedades)[number];
  const esGestor = (c: Cop) => perfil.esSuperAdmin || c.roles.some((r) => [...GESTORES, 'PORTERIA'].includes(r));
  // Solo quien administra (o el superadministrador) da de alta conjuntos nuevos
  const puedeCrear = perfil.esSuperAdmin || perfil.copropiedades.some((c) => c.roles.includes('ADMINISTRADOR'));
  const grupos = [
    { titulo: 'Conjuntos que administras o apoyas', items: perfil.copropiedades.filter(esGestor) },
    { titulo: 'Donde tienes unidades', items: perfil.copropiedades.filter((c) => !esGestor(c)) },
  ];

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const c = await api('/copropiedades', { body: f });
      await recargar();
      router.push(`/admin/${c.id}/unidades`);
    } catch (err: any) {
      avisar(err.message, 'error');
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <Logo variante="nombre" className="h-10" />
        <Boton variante="ghost" onClick={salir}>Salir</Boton>
      </div>
      <Encabezado
        titulo="Tus copropiedades"
        subtitulo="Elige el conjunto al que quieres entrar"
        acciones={puedeCrear && <Boton icono={<Plus size={16} />} onClick={() => setAbierto(true)}>Nueva copropiedad</Boton>}
      />
      {perfil.copropiedades.length === 0 ? (
        <Vacio titulo="Aún no tienes copropiedades" texto={puedeCrear ? 'Crea la primera para cargar sus unidades, coeficientes y presupuesto.' : 'Pide a la administración de tu conjunto que te vincule a tu unidad.'} />
      ) : (
        <div className="space-y-8">
          {grupos.map((g) => g.items.length > 0 && (
            <section key={g.titulo}>
              {grupos.filter((x) => x.items.length).length > 1 && <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">{g.titulo}</h2>}
              <div className="grid gap-4 sm:grid-cols-2">
                {g.items.map((c) => (
                  <Link key={c.id} href={esGestor(c) ? `/admin/${c.id}` : `/portal/${c.id}`}>
                    <Tarjeta interactiva className="flex items-center gap-4 p-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-blue-light text-brand-blue">
                        <Building2 size={22} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-brand-navy">{c.nombre}</p>
                        <p className="text-sm text-ink-500">{c.roles.map((r) => ROLES[r]).join(' · ')}{c.ciudad ? ` · ${c.ciudad}` : ''}</p>
                        {c.administracion && !c.roles.includes('ADMINISTRADOR') && <p className="mt-0.5 text-xs text-ink-500">Administración: {c.administracion}</p>}
                      </div>
                    </Tarjeta>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      <Dialogo abierto={abierto} alCerrar={() => setAbierto(false)} titulo="Nueva copropiedad">
        <form onSubmit={crear} className="space-y-4">
          <Campo etiqueta="Nombre" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required />
          <Campo etiqueta="NIT" value={f.nit} onChange={(e) => setF({ ...f, nit: e.target.value })} required />
          <Selector etiqueta="Tipo" value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
            <option value="RESIDENCIAL">Residencial</option>
            <option value="COMERCIAL">Comercial</option>
            <option value="MIXTA">Mixta</option>
          </Selector>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Ciudad" value={f.ciudad} onChange={(e) => setF({ ...f, ciudad: e.target.value })} />
            <Campo etiqueta="Dirección" value={f.direccion} onChange={(e) => setF({ ...f, direccion: e.target.value })} />
          </div>
          <Boton type="submit" className="w-full">Crear copropiedad</Boton>
        </form>
      </Dialogo>
    </main>
  );
}
