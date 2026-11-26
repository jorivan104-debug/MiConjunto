'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Calculator, FileText, Percent, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { nombrePeriodo, periodoActual, pesos } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import { tieneRol, useCop } from '@/components/contexto';
import { Boton, Campo, Cargando, Dialogo, Encabezado, Selector, Tarjeta, Transicion, useAviso } from '@/components/ui';

export default function Cobros() {
  const cop = useCop();
  const avisar = useAviso();
  const opera = tieneRol(cop, 'ADMINISTRADOR', 'ASISTENTE', 'CONTADOR');
  const base = `/copropiedades/${cop.copId}/cobros`;
  const { data: presupuestos, recargar: recPres } = useApi<any[]>(`${base}/presupuestos`);
  const { data: cartera, recargar: recCartera } = useApi<any>(`${base}/cartera`);
  const { data: conceptos } = useApi<any[]>(`${base}/conceptos`);
  const { data: unidades } = useApi<any>(opera ? `/copropiedades/${cop.copId}/unidades` : null);
  const [periodo, setPeriodo] = useState(periodoActual());
  const [ocupado, setOcupado] = useState('');
  const [presDlg, setPresDlg] = useState(false);
  const [cargoDlg, setCargoDlg] = useState(false);
  const anio = new Date().getFullYear();
  const [pres, setPres] = useState({ anio: String(anio), totalAnual: '', fondoImprevistosPct: '1', actaAprobacion: '' });
  const [cargo, setCargo] = useState({ conceptoId: '', descripcion: '', valor: '', unidadId: '', todas: false });

  const accion = async (nombre: string, ruta: string) => {
    setOcupado(nombre);
    try {
      const r = await api(`${base}/${ruta}`, { body: { periodo } });
      if (ruta === 'liquidar') avisar(`Liquidadas ${r.unidadesLiquidadas} unidades por ${pesos(r.totalOrdinaria + r.totalFondo)}${r.unidadesOmitidas ? ` (${r.unidadesOmitidas} ya estaban liquidadas)` : ''}`);
      else avisar(`Intereses generados a ${r.unidades} unidades por ${pesos(r.total)} (tasa ${(r.tasaMensual * 100).toFixed(2)} % mensual)`);
      recCartera();
    } catch (e: any) {
      avisar(e.message, 'error');
    } finally {
      setOcupado('');
    }
  };

  const guardarPres = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api(`${base}/presupuestos`, { method: 'PUT', body: { anio: Number(pres.anio), totalAnual: Number(pres.totalAnual), fondoImprevistosPct: Number(pres.fondoImprevistosPct), actaAprobacion: pres.actaAprobacion || undefined } });
      avisar('Presupuesto guardado');
      setPresDlg(false);
      recPres();
    } catch (e: any) {
      avisar(e.message, 'error');
    }
  };

  const crearCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await api(`${base}/cargos`, {
        body: { conceptoId: cargo.conceptoId, descripcion: cargo.descripcion, valor: Number(cargo.valor), periodo, unidadId: cargo.todas ? undefined : cargo.unidadId, todasPorCoeficiente: cargo.todas },
      });
      avisar(`${r.cargos} cargos creados por ${pesos(r.total)}`);
      setCargoDlg(false);
      recCartera();
    } catch (e: any) {
      avisar(e.message, 'error');
    }
  };

  const actual = presupuestos?.find((p) => p.anio === Number(periodo.slice(0, 4)));
  const manuales = conceptos?.filter((c) => ['EXTRAORDINARIA', 'MULTA', 'OTRO'].includes(c.tipo) && c.activo) ?? [];

  return (
    <Transicion>
      <Encabezado titulo="Cobros y cartera" subtitulo="Liquidación por coeficiente, intereses de mora y estado de la cartera" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Tarjeta className="p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3>Presupuesto {periodo.slice(0, 4)}</h3>
            {tieneRol(cop, 'ADMINISTRADOR', 'CONTADOR') && <Boton tamano="sm" variante="outline" onClick={() => { if (actual) setPres({ anio: String(actual.anio), totalAnual: String(Number(actual.totalAnual)), fondoImprevistosPct: String(Number(actual.fondoImprevistosPct)), actaAprobacion: actual.actaAprobacion ?? '' }); setPresDlg(true); }}>{actual ? 'Editar' : 'Registrar'}</Boton>}
          </div>
          {actual ? (
            <div className="space-y-1 text-sm">
              <p className="text-2xl font-bold text-brand-navy">{pesos(actual.totalAnual)}</p>
              <p className="text-ink-600">Cuota mensual total: {pesos(Number(actual.totalAnual) / 12)}</p>
              <p className="text-ink-600">Fondo de imprevistos: {Number(actual.fondoImprevistosPct)} %</p>
              {actual.actaAprobacion && <p className="text-ink-500">{actual.actaAprobacion}</p>}
            </div>
          ) : <p className="text-sm text-ink-500">Registra el presupuesto aprobado por la asamblea para poder liquidar.</p>}
        </Tarjeta>

        <Tarjeta className="p-6 lg:col-span-2">
          <h3 className="mb-1">Procesos del mes</h3>
          <p className="mb-4 text-sm text-ink-500">Cada proceso es seguro de repetir: no duplica cobros ya generados.</p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-44"><Campo etiqueta="Periodo" type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} /></div>
            {opera && (
              <>
                <Boton icono={<Calculator size={16} />} cargando={ocupado === 'liq'} onClick={() => accion('liq', 'liquidar')}>Liquidar cuotas</Boton>
                <Boton variante="secondary" icono={<Percent size={16} />} cargando={ocupado === 'int'} onClick={() => accion('int', 'intereses')}>Generar intereses</Boton>
                <Boton variante="outline" icono={<Plus size={16} />} onClick={() => setCargoDlg(true)}>Cobro extraordinario o multa</Boton>
              </>
            )}
          </div>
          <p className="mt-3 text-xs text-ink-500">{nombrePeriodo(periodo)}</p>
        </Tarjeta>
      </div>

      <Tarjeta className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-2">
          <h3>Cartera por edades</h3>
          {cartera && <p className="text-sm text-ink-500">Total: <strong className="text-brand-navy">{pesos(cartera.totales.saldo)}</strong></p>}
        </div>
        {!cartera ? <div className="p-6"><Cargando /></div> : cartera.filas.length === 0 ? (
          <p className="p-6 text-sm text-ink-500">No hay cartera pendiente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="tabla">
              <thead>
                <tr><th>Unidad</th><th>Responsable</th><th className="text-right">Al día</th><th className="text-right">1-30</th><th className="text-right">31-60</th><th className="text-right">61-90</th><th className="text-right">+90</th><th className="text-right">Total</th><th /></tr>
              </thead>
              <tbody>
                {cartera.filas.map((f: any) => (
                  <tr key={f.unidadId}>
                    <td className="font-medium">{f.unidad}</td>
                    <td className="text-ink-600">{f.responsable ?? '—'}</td>
                    {['corriente', 'd1_30', 'd31_60', 'd61_90', 'd90'].map((k) => (
                      <td key={k} className={`text-right tabular-nums ${k !== 'corriente' && f[k] > 0 ? 'text-brand-red-700' : 'text-ink-600'}`}>{f[k] ? pesos(f[k]) : '—'}</td>
                    ))}
                    <td className="text-right font-semibold tabular-nums">{pesos(f.saldo)}</td>
                    <td className="whitespace-nowrap text-right">
                      <Link href={`/certificado/${cop.copId}/${f.unidadId}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-brand-blue hover:underline"><FileText size={14} /> Certificado</Link>
                    </td>
                  </tr>
                ))}
                <tr className="bg-ink-50 font-semibold">
                  <td colSpan={2}>Total</td>
                  {['corriente', 'd1_30', 'd31_60', 'd61_90', 'd90', 'saldo'].map((k) => <td key={k} className="text-right tabular-nums">{pesos(cartera.totales[k])}</td>)}
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>

      <Dialogo abierto={presDlg} alCerrar={() => setPresDlg(false)} titulo="Presupuesto anual">
        <form onSubmit={guardarPres} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Año" type="number" value={pres.anio} onChange={(e) => setPres({ ...pres, anio: e.target.value })} required />
            <Campo etiqueta="Fondo de imprevistos (%)" type="number" step="0.1" min="1" value={pres.fondoImprevistosPct} onChange={(e) => setPres({ ...pres, fondoImprevistosPct: e.target.value })} ayuda="Mínimo 1 % (art. 35)" required />
          </div>
          <Campo etiqueta="Total anual aprobado (COP)" type="number" value={pres.totalAnual} onChange={(e) => setPres({ ...pres, totalAnual: e.target.value })} required />
          <Campo etiqueta="Acta de aprobación" value={pres.actaAprobacion} onChange={(e) => setPres({ ...pres, actaAprobacion: e.target.value })} placeholder="Acta 012 de marzo" />
          <Boton type="submit" className="w-full">Guardar presupuesto</Boton>
        </form>
      </Dialogo>

      <Dialogo abierto={cargoDlg} alCerrar={() => setCargoDlg(false)} titulo="Cobro extraordinario o multa">
        <form onSubmit={crearCargo} className="space-y-4">
          <Selector etiqueta="Concepto" value={cargo.conceptoId} onChange={(e) => setCargo({ ...cargo, conceptoId: e.target.value })} required>
            <option value="">Selecciona</option>
            {manuales.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Selector>
          <Campo etiqueta="Descripción" value={cargo.descripcion} onChange={(e) => setCargo({ ...cargo, descripcion: e.target.value })} required placeholder="Cuota extraordinaria pintura fachada" />
          <Campo etiqueta="Valor (COP)" type="number" value={cargo.valor} onChange={(e) => setCargo({ ...cargo, valor: e.target.value })} required ayuda={cargo.todas ? 'Valor total a repartir por coeficiente' : 'Valor para la unidad'} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#1F7C3A]" checked={cargo.todas} onChange={(e) => setCargo({ ...cargo, todas: e.target.checked })} /> Repartir entre todas las unidades por coeficiente</label>
          {!cargo.todas && (
            <Selector etiqueta="Unidad" value={cargo.unidadId} onChange={(e) => setCargo({ ...cargo, unidadId: e.target.value })} required>
              <option value="">Selecciona</option>
              {unidades?.unidades.map((u: any) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </Selector>
          )}
          <p className="text-xs text-ink-500">Periodo: {nombrePeriodo(periodo)}. Las cuotas extraordinarias deben estar aprobadas por la asamblea.</p>
          <Boton type="submit" className="w-full">Crear cobro</Boton>
        </form>
      </Dialogo>
    </Transicion>
  );
}
