'use client';
import Link from 'next/link';
import { CalendarDays, Megaphone, MessageSquareWarning, Wallet } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { pesos } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import { useCop } from '@/components/contexto';
import { Cargando, Insignia, Tarjeta, Transicion, Vacio } from '@/components/ui';

export default function PortalInicio() {
  const { copId, nombre } = useCop();
  const { perfil } = useAuth();
  const { data: unidades } = useApi<any[]>(`/copropiedades/${copId}/unidades/mias`);
  const unidad = unidades?.[0];
  const { data: ec } = useApi<any>(unidad ? `/copropiedades/${copId}/cobros/estado-cuenta/${unidad.id}` : null);
  const { data: avisos } = useApi<any[]>(`/copropiedades/${copId}/comunicados`);
  const nuevos = avisos?.filter((a) => !a.leido) ?? [];

  return (
    <Transicion>
      <p className="text-sm text-ink-500">{nombre}</p>
      <h1 className="mb-6">Hola, {perfil?.nombre.split(' ')[0]}</h1>
      {!unidades ? <Cargando /> : !unidad ? (
        <Vacio titulo="Aún no tienes una unidad vinculada" texto="Pide a la administración que te vincule a tu apartamento o casa." />
      ) : (
        <Link href={`/portal/${copId}/pagos`}>
          <Tarjeta interactiva className={`overflow-hidden p-6 ${ec?.vencido > 0 ? 'bg-gradient-to-br from-brand-red-light to-white' : 'bg-gradient-to-br from-brand-green-light to-white'}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-ink-600">{unidad.nombre} · saldo pendiente</p>
                <p className="mt-1 text-4xl font-bold tabular-nums text-brand-navy">{ec ? pesos(ec.saldo) : '…'}</p>
                {ec && (ec.vencido > 0 ? <Insignia tono="danger" punto>En mora: {pesos(ec.vencido)}</Insignia> : ec.saldo > 0 ? <Insignia tono="info" punto>Al día, pendiente de pago</Insignia> : <Insignia tono="success" punto>¡Estás al día!</Insignia>)}
                {ec?.saldoAFavor > 0 && <p className="mt-2 text-sm text-brand-green-700">Saldo a favor: {pesos(ec.saldoAFavor)}</p>}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-green-700 shadow-soft"><Wallet size={22} /></div>
            </div>
          </Tarjeta>
        </Link>
      )}

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { href: 'reservas', texto: 'Reservar', icono: CalendarDays, color: 'bg-brand-blue-light text-brand-blue' },
          { href: 'pqrs', texto: 'Solicitud', icono: MessageSquareWarning, color: 'bg-brand-red-light text-brand-red-700' },
          { href: 'comunicados', texto: 'Avisos', icono: Megaphone, color: 'bg-brand-yellow-light text-brand-yellow-800' },
        ].map((a) => (
          <Link key={a.href} href={`/portal/${copId}/${a.href}`}>
            <Tarjeta interactiva className="flex flex-col items-center gap-2 p-4 text-center">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${a.color}`}><a.icono size={22} /></div>
              <span className="text-sm font-medium text-ink-800">{a.texto}</span>
            </Tarjeta>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3>Avisos recientes</h3>
          {nuevos.length > 0 && <Insignia tono="warning" punto>{nuevos.length} sin leer</Insignia>}
        </div>
        {!avisos ? <Cargando filas={2} /> : avisos.length === 0 ? <p className="text-sm text-ink-500">Sin avisos por ahora.</p> : (
          <div className="space-y-3">
            {avisos.slice(0, 3).map((a) => (
              <Link key={a.id} href={`/portal/${copId}/comunicados`}>
                <Tarjeta interactiva className="mb-3 p-4">
                  <p className="font-medium text-brand-navy">{a.titulo}</p>
                  <p className="line-clamp-1 text-sm text-ink-600">{a.cuerpo}</p>
                </Tarjeta>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Transicion>
  );
}
