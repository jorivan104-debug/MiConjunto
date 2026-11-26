'use client';
import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { api } from '@/lib/api';
import { fecha, hora, pesos } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import { useCop } from '@/components/contexto';
import { AreaTexto, Boton, Campo, Cargando, Dialogo, Encabezado, Estado, Tarjeta, Transicion, Vacio, useAviso } from '@/components/ui';

export default function PortalReservas() {
  const { copId } = useCop();
  const avisar = useAviso();
  const { data: zonas } = useApi<any[]>(`/copropiedades/${copId}/reservas/zonas`);
  const { data: mias } = useApi<any[]>(`/copropiedades/${copId}/unidades/mias`);
  const { data: reservas, recargar } = useApi<any[]>(`/copropiedades/${copId}/reservas`);
  const [zona, setZona] = useState<any>(null);
  const manana = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const [f, setF] = useState({ dia: manana, desde: '10:00', hasta: '12:00', nota: '' });
  const { data: ocupacion } = useApi<any[]>(zona ? `/copropiedades/${copId}/reservas/zonas/${zona.id}/ocupacion?dia=${f.dia}` : null);

  const reservar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await api(`/copropiedades/${copId}/reservas`, {
        body: { zonaId: zona.id, unidadId: mias?.[0]?.id, inicio: `${f.dia}T${f.desde}:00-05:00`, fin: `${f.dia}T${f.hasta}:00-05:00`, nota: f.nota || undefined },
      });
      avisar(r.estado === 'APROBADA' ? '¡Reserva confirmada!' : 'Solicitud enviada. La administración la revisará.');
      setZona(null);
      recargar();
    } catch (err: any) {
      avisar(err.message, 'error');
    }
  };
  const cancelar = async (id: string) => {
    if (!confirm('¿Cancelar esta reserva?')) return;
    try {
      await api(`/copropiedades/${copId}/reservas/${id}/cancelar`, { method: 'POST' });
      avisar('Reserva cancelada');
      recargar();
    } catch (err: any) {
      avisar(err.message, 'error');
    }
  };

  const activas = zonas?.filter((z) => z.activa) ?? [];
  return (
    <Transicion>
      <Encabezado titulo="Reservas" subtitulo="Elige una zona común" />
      {!zonas ? <Cargando /> : activas.length === 0 ? <Vacio titulo="No hay zonas disponibles" /> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {activas.map((z) => (
            <Tarjeta key={z.id} interactiva className="flex gap-4 p-5" onClick={() => setZona(z)}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-blue-light text-brand-blue"><CalendarDays size={22} /></div>
              <div>
                <p className="font-semibold text-brand-navy">{z.nombre}</p>
                {z.descripcion && <p className="text-sm text-ink-600">{z.descripcion}</p>}
                <p className="mt-1 text-xs text-ink-500">{z.horaApertura} a {z.horaCierre} · máx. {z.maxHoras} h · {z.tarifa ? pesos(z.tarifa) : 'Sin costo'}</p>
              </div>
            </Tarjeta>
          ))}
        </div>
      )}

      <h3 className="mb-3 mt-8">Mis reservas</h3>
      {!reservas ? <Cargando filas={2} /> : reservas.length === 0 ? <p className="text-sm text-ink-500">Aún no tienes reservas.</p> : (
        <Tarjeta className="divide-y divide-ink-100">
          {reservas.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{r.zona}</p>
                <p className="text-xs text-ink-500">{fecha(r.inicio)} · {hora(r.inicio)} a {hora(r.fin)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Estado estado={r.estado} />
                {['PENDIENTE', 'APROBADA'].includes(r.estado) && new Date(r.inicio) > new Date() && <Boton tamano="sm" variante="ghost" onClick={() => cancelar(r.id)}>Cancelar</Boton>}
              </div>
            </div>
          ))}
        </Tarjeta>
      )}

      <Dialogo abierto={!!zona} alCerrar={() => setZona(null)} titulo={`Reservar ${zona?.nombre ?? ''}`}>
        {zona && (
          <form onSubmit={reservar} className="space-y-4">
            <Campo etiqueta="Día" type="date" min={new Date().toISOString().slice(0, 10)} value={f.dia} onChange={(e) => setF({ ...f, dia: e.target.value })} required />
            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta="Desde" type="time" value={f.desde} onChange={(e) => setF({ ...f, desde: e.target.value })} required />
              <Campo etiqueta="Hasta" type="time" value={f.hasta} onChange={(e) => setF({ ...f, hasta: e.target.value })} required />
            </div>
            <div className="rounded-xl bg-ink-50 p-3 text-sm">
              <p className="font-medium text-ink-700">Ocupado ese día</p>
              {!ocupacion ? <p className="text-ink-500">Consultando…</p> : ocupacion.length === 0 ? <p className="text-brand-green-700">Todo el día está libre.</p> : ocupacion.map((o, i) => <p key={i} className="text-ink-600">{hora(o.inicio)} a {hora(o.fin)}</p>)}
            </div>
            <AreaTexto etiqueta="Nota (opcional)" value={f.nota} onChange={(e) => setF({ ...f, nota: e.target.value })} rows={2} />
            {zona.tarifa > 0 && <p className="text-sm text-ink-600">Al aprobarse se cargará {pesos(zona.tarifa)} (más IVA si aplica) a tu estado de cuenta.</p>}
            <Boton type="submit" className="w-full">{zona.requiereAprobacion ? 'Solicitar reserva' : 'Reservar'}</Boton>
          </form>
        )}
      </Dialogo>
    </Transicion>
  );
}
