'use client';
import { useState } from 'react';
import { Check, Paperclip, Plus, X } from 'lucide-react';
import { abrirArchivo, api } from '@/lib/api';
import { fecha, pesos } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import { tieneRol, useCop } from '@/components/contexto';
import { Boton, Campo, Cargando, Dialogo, Encabezado, Estado, Selector, Tarjeta, Transicion, Vacio, useAviso } from '@/components/ui';

const MEDIOS: Record<string, string> = { TRANSFERENCIA: 'Transferencia', CONSIGNACION: 'Consignación', PSE: 'PSE', TARJETA: 'Tarjeta', EFECTIVO: 'Efectivo', OTRO: 'Otro' };

export default function Pagos() {
  const cop = useCop();
  const avisar = useAviso();
  const opera = tieneRol(cop, 'ADMINISTRADOR', 'ASISTENTE', 'CONTADOR');
  const [filtro, setFiltro] = useState('');
  const { data, recargar } = useApi<any[]>(`/copropiedades/${cop.copId}/pagos${filtro ? `?estado=${filtro}` : ''}`);
  const { data: unidades } = useApi<any>(opera ? `/copropiedades/${cop.copId}/unidades` : null);
  const [dlg, setDlg] = useState(false);
  const hoy = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ unidadId: '', valor: '', medio: 'TRANSFERENCIA', referencia: '', fecha: hoy });

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api(`/copropiedades/${cop.copId}/pagos`, { body: { ...f, valor: Number(f.valor), referencia: f.referencia || undefined, fecha: new Date(`${f.fecha}T12:00:00-05:00`).toISOString() } });
      avisar('Pago registrado y aplicado a la cartera');
      setDlg(false);
      setF({ ...f, unidadId: '', valor: '', referencia: '' });
      recargar();
    } catch (err: any) {
      avisar(err.message, 'error');
    }
  };

  const accion = async (id: string, que: 'confirmar' | 'rechazar' | 'anular') => {
    let body: any;
    if (que === 'anular') {
      const motivo = prompt('Motivo de la anulación');
      if (!motivo) return;
      body = { motivo };
    }
    try {
      await api(`/copropiedades/${cop.copId}/pagos/${id}/${que}`, { method: 'POST', body });
      avisar(que === 'confirmar' ? 'Pago confirmado' : que === 'rechazar' ? 'Pago rechazado' : 'Pago anulado');
      recargar();
    } catch (err: any) {
      avisar(err.message, 'error');
    }
  };

  const unidadSel = unidades?.unidades.find((u: any) => u.id === f.unidadId);

  return (
    <Transicion>
      <Encabezado
        titulo="Pagos"
        subtitulo="Los pagos se aplican primero a intereses y luego a las cuotas más antiguas (art. 1653 del Código Civil)"
        acciones={opera && <Boton icono={<Plus size={16} />} onClick={() => setDlg(true)}>Registrar pago</Boton>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {[['', 'Todos'], ['PENDIENTE', 'Por confirmar'], ['CONFIRMADO', 'Confirmados'], ['RECHAZADO', 'Rechazados'], ['ANULADO', 'Anulados']].map(([k, v]) => (
          <button key={k} onClick={() => setFiltro(k)} className={filtro === k ? 'pill-info' : 'pill-neutral hover:bg-ink-200'}>{v}</button>
        ))}
      </div>
      {!data ? <Cargando /> : data.length === 0 ? <Vacio titulo="No hay pagos" /> : (
        <Tarjeta className="overflow-x-auto">
          <table className="tabla">
            <thead><tr><th>Fecha</th><th>Unidad</th><th>Medio</th><th>Referencia</th><th>Estado</th><th className="text-right">Valor</th><th /></tr></thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td>{fecha(p.fecha)}</td>
                  <td className="font-medium">{p.unidad}</td>
                  <td>{MEDIOS[p.medio]}</td>
                  <td className="text-ink-600">
                    {p.referencia ?? '—'}
                    {p.soporteUrl && <button className="ml-2 inline-flex items-center gap-1 text-brand-blue" onClick={() => abrirArchivo(`/copropiedades/${cop.copId}/documentos/soportes-pago/${p.id}`)}><Paperclip size={13} /> Soporte</button>}
                  </td>
                  <td><Estado estado={p.estado} />{p.saldoAFavor > 0 && <span className="ml-2 text-xs text-brand-green-700">Saldo a favor {pesos(p.saldoAFavor)}</span>}</td>
                  <td className="text-right font-semibold tabular-nums">{pesos(p.valor)}</td>
                  <td className="whitespace-nowrap text-right">
                    {opera && p.estado === 'PENDIENTE' && (
                      <>
                        <Boton tamano="sm" variante="ghost" icono={<Check size={14} />} onClick={() => accion(p.id, 'confirmar')}>Confirmar</Boton>
                        <Boton tamano="sm" variante="ghost" icono={<X size={14} />} onClick={() => accion(p.id, 'rechazar')}>Rechazar</Boton>
                      </>
                    )}
                    {tieneRol(cop, 'ADMINISTRADOR', 'CONTADOR') && p.estado === 'CONFIRMADO' && <Boton tamano="sm" variante="ghost" onClick={() => accion(p.id, 'anular')}>Anular</Boton>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tarjeta>
      )}
      <Dialogo abierto={dlg} alCerrar={() => setDlg(false)} titulo="Registrar pago">
        <form onSubmit={registrar} className="space-y-4">
          <Selector etiqueta="Unidad" value={f.unidadId} onChange={(e) => setF({ ...f, unidadId: e.target.value })} required>
            <option value="">Selecciona</option>
            {unidades?.unidades.map((u: any) => <option key={u.id} value={u.id}>{u.nombre}{u.saldo > 0 ? ` · debe ${pesos(u.saldo)}` : ''}</option>)}
          </Selector>
          <Campo etiqueta="Valor (COP)" type="number" min="1" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} required ayuda={unidadSel?.saldo ? `Saldo pendiente: ${pesos(unidadSel.saldo)}` : undefined} />
          <div className="grid grid-cols-2 gap-3">
            <Selector etiqueta="Medio" value={f.medio} onChange={(e) => setF({ ...f, medio: e.target.value })}>
              {Object.entries(MEDIOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Selector>
            <Campo etiqueta="Fecha" type="date" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} required />
          </div>
          <Campo etiqueta="Referencia" value={f.referencia} onChange={(e) => setF({ ...f, referencia: e.target.value })} ayuda="Número de transacción o consignación (no se puede repetir)" />
          <Boton type="submit" className="w-full">Registrar</Boton>
        </form>
      </Dialogo>
    </Transicion>
  );
}
