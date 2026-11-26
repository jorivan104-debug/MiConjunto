'use client';
import { use } from 'react';
import { useApi } from '@/lib/useApi';
import { fecha, nombrePeriodo, pesos } from '@/lib/format';
import { Boton, Cargando, Logo } from '@/components/ui';

/** Certificado de deuda (art. 48 Ley 675) o paz y salvo, listo para imprimir y firmar. */
export default function Certificado({ params }: { params: Promise<{ copId: string; unidadId: string }> }) {
  const { copId, unidadId } = use(params);
  const { data: c } = useApi<any>(`/copropiedades/${copId}/cobros/certificado/${unidadId}`);
  if (!c) return <div className="p-8"><Cargando /></div>;
  const deuda = c.tipo === 'CERTIFICADO_DEUDA';
  return (
    <main className="mx-auto max-w-3xl bg-white p-10 text-ink-800">
      <div className="no-print mb-6 flex justify-end"><Boton onClick={() => window.print()}>Imprimir</Boton></div>
      <div className="flex items-center justify-between border-b border-ink-200 pb-6">
        <div>
          <p className="text-lg font-semibold text-brand-navy">{c.copropiedad.nombre}</p>
          <p className="text-sm text-ink-500">NIT {c.copropiedad.nit}</p>
        </div>
        <Logo className="h-20 w-20" />
      </div>
      <h1 className="mt-8 text-center text-2xl uppercase">{deuda ? 'Certificado de deuda' : 'Paz y salvo'}</h1>
      <p className="mt-8 leading-relaxed">
        El suscrito administrador y representante legal de <strong>{c.copropiedad.nombre}</strong> certifica que la unidad <strong>{c.unidad.nombre}</strong>
        {c.propietarios.length ? <>, de propiedad de <strong>{c.propietarios.join(', ')}</strong>,</> : ''}{' '}
        {deuda ? (
          <>adeuda a la fecha la suma de <strong>{pesos(c.total)}</strong> por concepto de expensas comunes, discriminada así:</>
        ) : (
          <>se encuentra a paz y salvo por concepto de expensas comunes a la fecha.</>
        )}
      </p>
      {deuda && (
        <>
          <table className="tabla mt-6">
            <thead><tr><th>Periodo</th><th>Concepto</th><th>Vencimiento</th><th className="text-right">Saldo</th></tr></thead>
            <tbody>
              {c.detalle.map((d: any, i: number) => (
                <tr key={i}><td>{nombrePeriodo(d.periodo)}</td><td>{d.descripcion}</td><td>{fecha(d.vencimiento)}</td><td className="text-right tabular-nums">{pesos(d.saldo)}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 space-y-1 text-right">
            <p>Capital: <strong>{pesos(c.capital)}</strong></p>
            <p>Intereses de mora: <strong>{pesos(c.intereses)}</strong></p>
            <p className="text-lg">Total: <strong>{pesos(c.total)}</strong></p>
          </div>
          <p className="mt-6 text-sm text-ink-500">
            Este certificado presta mérito ejecutivo según el artículo 48 de la Ley 675 de 2001. Los intereses de mora se liquidan a la tasa permitida por el artículo 30 de la misma ley.
          </p>
        </>
      )}
      <p className="mt-8">Se expide en {fecha(c.fecha)}.</p>
      <div className="mt-20 w-72 border-t border-ink-400 pt-2">
        <p className="font-medium">{c.administrador ?? 'Administrador'}</p>
        <p className="text-sm text-ink-500">Administrador y representante legal</p>
      </div>
    </main>
  );
}
