'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CreditCard, FileText, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { MEDIOS, fecha, nombrePeriodo, pesos } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import { useCop } from '@/components/contexto';
import { Boton, Campo, Cargando, Dialogo, Estado, Selector, Tarjeta, Transicion, Vacio, useAviso } from '@/components/ui';

function PagosContenido() {
  const { copId } = useCop();
  const avisar = useAviso();
  const params = useSearchParams();
  const { data: mias } = useApi<any[]>(`/copropiedades/${copId}/unidades/mias`);
  const [unidadId, setUnidadId] = useState<string | null>(params.get('unidad'));
  useEffect(() => {
    if (!unidadId && mias?.length) setUnidadId(mias[0].id);
  }, [mias, unidadId]);
  const { data: ec, recargar } = useApi<any>(unidadId ? `/copropiedades/${copId}/cobros/estado-cuenta/${unidadId}` : null);
  const [dlg, setDlg] = useState(false);
  const [f, setF] = useState({ valor: '', medio: 'CONSIGNACION', referencia: '', fecha: new Date().toISOString().slice(0, 10) });
  const [soporte, setSoporte] = useState<File | null>(null);
  const [pagando, setPagando] = useState(false);

  const reportar = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData();
    form.append('unidadId', unidadId!);
    form.append('valor', f.valor);
    form.append('medio', f.medio);
    if (f.referencia) form.append('referencia', f.referencia);
    form.append('fecha', new Date(`${f.fecha}T12:00:00-05:00`).toISOString());
    if (soporte) form.append('soporte', soporte);
    try {
      await api(`/copropiedades/${copId}/pagos/reportar`, { form });
      avisar('Pago reportado. La administración lo confirmará pronto.');
      setDlg(false);
      recargar();
    } catch (err: any) {
      avisar(err.message, 'error');
    }
  };

  const pagarEnLinea = async () => {
    setPagando(true);
    try {
      const r = await api(`/copropiedades/${copId}/pagos/checkout/${unidadId}`, { method: 'POST' });
      window.location.href = r.url;
    } catch (err: any) {
      avisar(err.message, 'error');
      setPagando(false);
    }
  };

  if (!mias || (unidadId && !ec)) return <Cargando />;
  if (!unidadId) return <Vacio titulo="No tienes unidades vinculadas" />;
  const pendientes = ec.cargos.filter((c: any) => c.estado === 'PENDIENTE');

  return (
    <Transicion>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1>Estado de cuenta</h1>
          <p className="text-sm text-ink-500">{ec.unidad.nombre} · coeficiente {ec.unidad.coeficientePct.toFixed(4)} %</p>
        </div>
        {mias.length > 1 && (
          <div className="w-56">
            <Selector value={unidadId} onChange={(e) => setUnidadId(e.target.value)}>
              {mias.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </Selector>
          </div>
        )}
      </div>

      <Tarjeta className="p-6">
        <p className="text-sm text-ink-500">Total a pagar</p>
        <p className="text-4xl font-bold tabular-nums text-brand-navy">{pesos(ec.saldo)}</p>
        {ec.vencido > 0 && <p className="mt-1 text-sm text-brand-red-700">Incluye {pesos(ec.vencido)} vencidos, que generan intereses de mora.</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          {ec.saldo > 0 && <Boton icono={<CreditCard size={16} />} cargando={pagando} onClick={pagarEnLinea}>Pagar en línea (PSE)</Boton>}
          <Boton variante="outline" icono={<Upload size={16} />} onClick={() => { setF({ ...f, valor: String(ec.saldo || '') }); setDlg(true); }}>Reportar consignación</Boton>
          <Link href={`/certificado/${copId}/${unidadId}`} target="_blank"><Boton variante="ghost" icono={<FileText size={16} />}>{ec.saldo > 0 ? 'Certificado de deuda' : 'Paz y salvo'}</Boton></Link>
        </div>
      </Tarjeta>

      <h3 className="mb-3 mt-8">Cobros pendientes</h3>
      {pendientes.length === 0 ? <p className="text-sm text-ink-500">No tienes cobros pendientes.</p> : (
        <Tarjeta className="divide-y divide-ink-100">
          {pendientes.map((c: any) => {
            const vencido = new Date(c.vencimiento) < new Date();
            return (
              <div key={c.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium text-ink-900">{c.descripcion}</p>
                  <p className="text-xs text-ink-500">{nombrePeriodo(c.periodo)} · vence {fecha(c.vencimiento)}{c.iva ? ` · incluye IVA ${pesos(c.iva)}` : ''}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{pesos(c.saldo)}</p>
                  <Estado estado={vencido ? 'VENCIDO' : 'PENDIENTE'} />
                </div>
              </div>
            );
          })}
        </Tarjeta>
      )}

      <h3 className="mb-3 mt-8">Pagos</h3>
      {ec.pagos.length === 0 ? <p className="text-sm text-ink-500">Aún no hay pagos registrados.</p> : (
        <Tarjeta className="divide-y divide-ink-100">
          {ec.pagos.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{fecha(p.fecha)}</p>
                <p className="text-xs text-ink-500">{MEDIOS[p.medio] ?? p.medio}{p.referencia ? ` · ${p.referencia}` : ''}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold tabular-nums text-brand-green-700">{pesos(p.valor)}</p>
                <Estado estado={p.estado} />
              </div>
            </div>
          ))}
        </Tarjeta>
      )}

      <Dialogo abierto={dlg} alCerrar={() => setDlg(false)} titulo="Reportar pago">
        <form onSubmit={reportar} className="space-y-4">
          <Campo etiqueta="Valor pagado (COP)" type="number" min="1" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Selector etiqueta="Medio" value={f.medio} onChange={(e) => setF({ ...f, medio: e.target.value })}>
              <option value="CONSIGNACION">Consignación</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="OTRO">Otro</option>
            </Selector>
            <Campo etiqueta="Fecha" type="date" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} />
          </div>
          <Campo etiqueta="Número de referencia" value={f.referencia} onChange={(e) => setF({ ...f, referencia: e.target.value })} />
          <Campo etiqueta="Soporte (foto o PDF)" type="file" accept="image/*,.pdf" onChange={(e) => setSoporte(e.target.files?.[0] ?? null)} className="py-2" />
          <Boton type="submit" className="w-full">Enviar</Boton>
        </form>
      </Dialogo>
    </Transicion>
  );
}

export default function PortalPagos() {
  return (
    <Suspense fallback={<Cargando />}>
      <PagosContenido />
    </Suspense>
  );
}
