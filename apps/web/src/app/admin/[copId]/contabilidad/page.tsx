'use client';
import { useState } from 'react';
import { fecha, pesos } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import { useCop } from '@/components/contexto';
import { Cargando, Encabezado, Insignia, Tarjeta, Transicion, cn } from '@/components/ui';

const ORIGEN: Record<string, string> = { CARGO: 'Causación', PAGO: 'Recaudo', ANULACION: 'Anulación', MANUAL: 'Manual' };

export default function Contabilidad() {
  const { copId } = useCop();
  const [vista, setVista] = useState<'balance' | 'diario'>('balance');
  const { data: balance } = useApi<any>(`/copropiedades/${copId}/contabilidad/balance-prueba`);
  const { data: diario } = useApi<any[]>(vista === 'diario' ? `/copropiedades/${copId}/contabilidad/libro-diario` : null);
  const { data: cuentas } = useApi<any[]>(`/copropiedades/${copId}/contabilidad/cuentas`);
  const nombre = (c: string) => cuentas?.find((x) => x.codigo === c)?.nombre ?? c;

  return (
    <Transicion>
      <Encabezado titulo="Contabilidad" subtitulo="Cada cobro, pago e interés genera su asiento de partida doble automáticamente. Los asientos no se editan: se anulan con un asiento inverso." />
      <div className="mb-4 flex gap-2">
        {(['balance', 'diario'] as const).map((v) => (
          <button key={v} onClick={() => setVista(v)} className={cn(vista === v ? 'pill-info' : 'pill-neutral hover:bg-ink-200')}>
            {v === 'balance' ? 'Balance de prueba' : 'Libro diario'}
          </button>
        ))}
      </div>
      {vista === 'balance' ? (
        !balance ? <Cargando /> : (
          <Tarjeta className="overflow-x-auto">
            <table className="tabla">
              <thead><tr><th>Código</th><th>Cuenta</th><th className="text-right">Débitos</th><th className="text-right">Créditos</th><th className="text-right">Saldo</th></tr></thead>
              <tbody>
                {balance.filas.map((f: any) => (
                  <tr key={f.codigo} className={f.debitos || f.creditos ? '' : 'text-ink-400'}>
                    <td className="tabular-nums">{f.codigo}</td>
                    <td>{f.nombre}</td>
                    <td className="text-right tabular-nums">{pesos(f.debitos)}</td>
                    <td className="text-right tabular-nums">{pesos(f.creditos)}</td>
                    <td className="text-right font-semibold tabular-nums">{pesos(f.saldo)}</td>
                  </tr>
                ))}
                <tr className="bg-ink-50 font-semibold">
                  <td colSpan={2}>Sumas iguales</td>
                  <td className="text-right tabular-nums">{pesos(balance.totalDebitos)}</td>
                  <td className="text-right tabular-nums">{pesos(balance.totalCreditos)}</td>
                  <td className="text-right">{balance.totalDebitos === balance.totalCreditos ? <Insignia tono="success">Cuadrado</Insignia> : <Insignia tono="danger">Descuadrado</Insignia>}</td>
                </tr>
              </tbody>
            </table>
          </Tarjeta>
        )
      ) : !diario ? <Cargando /> : (
        <div className="space-y-3">
          {diario.map((a) => (
            <Tarjeta key={a.id} className="p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-brand-navy">Asiento {a.numero}</span>
                <Insignia tono={a.origen === 'ANULACION' ? 'danger' : a.origen === 'PAGO' ? 'success' : 'info'}>{ORIGEN[a.origen]}</Insignia>
                <span className="text-sm text-ink-500">{fecha(a.fecha)} · {a.descripcion}</span>
              </div>
              <table className="tabla">
                <tbody>
                  {Object.values(
                    a.lineas.reduce((acc: any, l: any) => {
                      const k = l.cuentaCodigo;
                      acc[k] = acc[k] ?? { cuenta: k, debito: 0, credito: 0 };
                      acc[k].debito += l.debito;
                      acc[k].credito += l.credito;
                      return acc;
                    }, {}),
                  ).map((l: any) => (
                    <tr key={l.cuenta}>
                      <td className={cn('w-2/3', l.credito > 0 && l.debito === 0 && 'pl-10')}>{l.cuenta} · {nombre(l.cuenta)}</td>
                      <td className="text-right tabular-nums">{l.debito ? pesos(l.debito) : ''}</td>
                      <td className="text-right tabular-nums">{l.credito ? pesos(l.credito) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Tarjeta>
          ))}
        </div>
      )}
    </Transicion>
  );
}
