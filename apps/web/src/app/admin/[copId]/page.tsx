'use client';
import Link from 'next/link';
import { AlertTriangle, CalendarDays, Clock, MessageSquareWarning, TrendingUp, Wallet } from 'lucide-react';
import { useCop } from '@/components/contexto';
import { Cargando, Dato, Encabezado, Tarjeta, Transicion } from '@/components/ui';
import { nombrePeriodo, pesos } from '@/lib/format';
import { useApi } from '@/lib/useApi';

export default function Tablero() {
  const { copId, nombre } = useCop();
  const { data: t } = useApi<any>(`/copropiedades/${copId}/tablero`);
  const { data: cartera } = useApi<any>(`/copropiedades/${copId}/cobros/cartera`);
  if (!t) return <Cargando filas={4} />;
  const pctRecaudo = t.facturadoMes > 0 ? Math.round((t.recaudoMes / t.facturadoMes) * 100) : 0;
  return (
    <Transicion>
      <Encabezado titulo="Tablero" subtitulo={`${nombre} · ${nombrePeriodo(t.periodo)}`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Dato titulo="Recaudo del mes" valor={pesos(t.recaudoMes)} detalle={`${pctRecaudo} % de lo facturado (${pesos(t.facturadoMes)})`} icono={<TrendingUp size={20} />} color="green" />
        <Dato titulo="Cartera vencida" valor={pesos(t.carteraVencida)} detalle={`${t.unidadesEnMora} de ${t.unidades} unidades en mora`} icono={<AlertTriangle size={20} />} color="red" />
        <Dato titulo="PQRS abiertas" valor={t.pqrsAbiertas} icono={<MessageSquareWarning size={20} />} color="blue" />
        <Dato titulo="Por gestionar" valor={t.reservasPendientes + t.pagosPorConfirmar} detalle={`${t.reservasPendientes} reservas · ${t.pagosPorConfirmar} pagos reportados`} icono={<Clock size={20} />} color="yellow" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Tarjeta className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3>Unidades con mayor saldo</h3>
            <Link href={`/admin/${copId}/cobros`} className="text-sm text-brand-blue hover:underline">Ver cartera</Link>
          </div>
          {!cartera ? <Cargando /> : cartera.filas.length === 0 ? (
            <p className="text-sm text-ink-500">No hay saldos pendientes. ¡Todo al día!</p>
          ) : (
            <table className="tabla">
              <thead><tr><th>Unidad</th><th>Responsable</th><th className="text-right">Vencido +30 días</th><th className="text-right">Saldo</th></tr></thead>
              <tbody>
                {cartera.filas.slice(0, 6).map((f: any) => (
                  <tr key={f.unidadId}>
                    <td className="font-medium">{f.unidad}</td>
                    <td className="text-ink-600">{f.responsable ?? '—'}</td>
                    <td className="text-right tabular-nums text-brand-red-700">{pesos(f.d31_60 + f.d61_90 + f.d90)}</td>
                    <td className="text-right font-semibold tabular-nums">{pesos(f.saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Tarjeta>
        <Tarjeta className="p-6">
          <h3 className="mb-4">Accesos rápidos</h3>
          <div className="space-y-2">
            {[
              { href: 'cobros', texto: 'Liquidar el mes', icono: Wallet },
              { href: 'pagos', texto: 'Registrar un pago', icono: TrendingUp },
              { href: 'comunicados', texto: 'Publicar un comunicado', icono: MessageSquareWarning },
              { href: 'reservas', texto: 'Revisar reservas', icono: CalendarDays },
            ].map((a) => (
              <Link key={a.href} href={`/admin/${copId}/${a.href}`} className="nav-item">
                <a.icono size={18} /> {a.texto}
              </Link>
            ))}
          </div>
        </Tarjeta>
      </div>
    </Transicion>
  );
}
