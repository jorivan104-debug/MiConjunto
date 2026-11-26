'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, Upload, UserPlus, X } from 'lucide-react';
import { api } from '@/lib/api';
import { pesos } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import { tieneRol, useCop } from '@/components/contexto';
import { AreaTexto, Boton, Campo, Cargando, Dialogo, Encabezado, Insignia, Selector, Tarjeta, Transicion, Vacio, useAviso } from '@/components/ui';

const TIPOS = ['APARTAMENTO', 'CASA', 'LOCAL', 'OFICINA', 'PARQUEADERO', 'DEPOSITO'];
const VINCULOS: Record<string, string> = { PROPIETARIO: 'Propietario', RESIDENTE: 'Residente', ARRENDATARIO: 'Arrendatario' };

export default function Unidades() {
  const cop = useCop();
  const avisar = useAviso();
  const gestiona = tieneRol(cop, 'ADMINISTRADOR', 'ASISTENTE');
  const { data, recargar } = useApi<any>(`/copropiedades/${cop.copId}/unidades`);
  const [buscar, setBuscar] = useState('');
  const [nueva, setNueva] = useState(false);
  const [importar, setImportar] = useState(false);
  const [vincular, setVincular] = useState<any>(null);
  const [u, setU] = useState({ torre: '', numero: '', tipo: 'APARTAMENTO', areaPrivada: '', coeficientePct: '' });
  const [csv, setCsv] = useState('torre;numero;tipo;area;coeficiente_pct\n');
  const [p, setP] = useState({ email: '', nombre: '', celular: '', vinculo: 'PROPIETARIO' });
  const [clave, setClave] = useState<string | null>(null);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api(`/copropiedades/${cop.copId}/unidades`, {
        body: { torre: u.torre || undefined, numero: u.numero, tipo: u.tipo, areaPrivada: u.areaPrivada ? Number(u.areaPrivada) : undefined, coeficientePct: Number(u.coeficientePct) },
      });
      avisar('Unidad creada');
      setNueva(false);
      setU({ ...u, numero: '', areaPrivada: '', coeficientePct: '' });
      recargar();
    } catch (err: any) {
      avisar(err.message, 'error');
    }
  };

  const cargar = async () => {
    try {
      const r = await api(`/copropiedades/${cop.copId}/unidades/importar`, { body: { csv } });
      avisar(`${r.creadas} creadas, ${r.actualizadas} actualizadas${r.errores.length ? `, ${r.errores.length} con error` : ''}`, r.errores.length ? 'error' : 'ok');
      if (!r.errores.length) setImportar(false);
      recargar();
    } catch (err: any) {
      avisar(err.message, 'error');
    }
  };

  const vincularPersona = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await api(`/copropiedades/${cop.copId}/unidades/${vincular.id}/personas`, { body: { ...p, celular: p.celular || undefined } });
      avisar('Persona vinculada');
      setClave(r.passwordTemporal);
      if (!r.passwordTemporal) setVincular(null);
      setP({ email: '', nombre: '', celular: '', vinculo: 'PROPIETARIO' });
      recargar();
    } catch (err: any) {
      avisar(err.message, 'error');
    }
  };

  const desvincular = async (vinculoId: string) => {
    if (!confirm('¿Quitar a esta persona de la unidad?')) return;
    await api(`/copropiedades/${cop.copId}/unidades/personas/${vinculoId}`, { method: 'DELETE' });
    recargar();
  };

  if (!data) return <Cargando />;
  const filas = data.unidades.filter((x: any) => !buscar || `${x.nombre} ${x.personas.map((p: any) => p.nombre).join(' ')}`.toLowerCase().includes(buscar.toLowerCase()));
  const sumaOk = Math.abs(data.sumaCoeficientesPct - 100) < 0.01;

  return (
    <Transicion>
      <Encabezado
        titulo="Unidades"
        subtitulo={`${data.unidades.length} unidades · coeficientes suman ${data.sumaCoeficientesPct.toFixed(4)} %`}
        acciones={gestiona && (
          <>
            <Boton variante="outline" icono={<Upload size={16} />} onClick={() => setImportar(true)}>Importar desde Excel</Boton>
            <Boton icono={<Plus size={16} />} onClick={() => setNueva(true)}>Nueva unidad</Boton>
          </>
        )}
      />
      {data.unidades.length > 0 && !sumaOk && (
        <p className="mb-4 rounded-xl bg-brand-yellow-light px-4 py-3 text-sm text-brand-yellow-800">
          Los coeficientes deberían sumar 100 % según el reglamento. Las cuotas se reparten de forma proporcional igualmente, pero revisa los valores.
        </p>
      )}
      {data.unidades.length === 0 ? (
        <Vacio titulo="Aún no hay unidades" texto="Puedes crearlas una por una o pegar la tabla desde Excel." accion={gestiona && <Boton onClick={() => setImportar(true)}>Importar unidades</Boton>} />
      ) : (
        <Tarjeta className="overflow-hidden">
          <div className="border-b border-ink-100 p-4"><Campo placeholder="Buscar unidad o persona" value={buscar} onChange={(e) => setBuscar(e.target.value)} /></div>
          <div className="overflow-x-auto">
            <table className="tabla">
              <thead><tr><th>Unidad</th><th>Tipo</th><th className="text-right">Coeficiente</th><th>Personas</th><th className="text-right">Saldo</th><th /></tr></thead>
              <tbody>
                {filas.map((x: any) => (
                  <tr key={x.id}>
                    <td className="font-medium">{x.nombre}</td>
                    <td className="text-ink-600 capitalize">{x.tipo.toLowerCase()}</td>
                    <td className="text-right tabular-nums">{x.coeficientePct.toFixed(4)} %</td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        {x.personas.map((p: any) => (
                          <span key={p.id} className="pill-neutral">
                            {p.nombre} · {VINCULOS[p.vinculo]}
                            {gestiona && <button onClick={() => desvincular(p.id)} aria-label={`Quitar a ${p.nombre}`}><X size={12} /></button>}
                          </span>
                        ))}
                        {x.personas.length === 0 && <span className="text-xs text-ink-400">Sin personas</span>}
                      </div>
                    </td>
                    <td className="text-right tabular-nums">{x.saldo > 0 ? <span className="font-semibold text-brand-red-700">{pesos(x.saldo)}</span> : <Insignia tono="success">Al día</Insignia>}</td>
                    <td className="text-right whitespace-nowrap">
                      {gestiona && <Boton tamano="sm" variante="ghost" icono={<UserPlus size={14} />} onClick={() => { setVincular(x); setClave(null); }}>Vincular</Boton>}
                      <Link href={`/portal/${cop.copId}/pagos?unidad=${x.id}`} className="ml-2 text-sm text-brand-blue hover:underline">Estado de cuenta</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tarjeta>
      )}

      <Dialogo abierto={nueva} alCerrar={() => setNueva(false)} titulo="Nueva unidad">
        <form onSubmit={crear} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Torre o bloque" value={u.torre} onChange={(e) => setU({ ...u, torre: e.target.value })} placeholder="Torre 1" />
            <Campo etiqueta="Número" value={u.numero} onChange={(e) => setU({ ...u, numero: e.target.value })} required />
          </div>
          <Selector etiqueta="Tipo" value={u.tipo} onChange={(e) => setU({ ...u, tipo: e.target.value })}>
            {TIPOS.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
          </Selector>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Área privada (m²)" type="number" step="0.01" value={u.areaPrivada} onChange={(e) => setU({ ...u, areaPrivada: e.target.value })} />
            <Campo etiqueta="Coeficiente (%)" type="number" step="0.000001" value={u.coeficientePct} onChange={(e) => setU({ ...u, coeficientePct: e.target.value })} required ayuda="Según el reglamento" />
          </div>
          <Boton type="submit" className="w-full">Guardar</Boton>
        </form>
      </Dialogo>

      <Dialogo abierto={importar} alCerrar={() => setImportar(false)} titulo="Importar unidades" ancho="max-w-2xl">
        <p className="mb-3 text-sm text-ink-600">Copia las columnas desde Excel y pégalas aquí. El coeficiente va en porcentaje (1,25 = 1,25 %). Si la unidad ya existe, se actualiza.</p>
        <AreaTexto rows={10} value={csv} onChange={(e) => setCsv(e.target.value)} className="font-mono text-xs" />
        <Boton className="mt-4 w-full" onClick={cargar}>Importar</Boton>
      </Dialogo>

      <Dialogo abierto={!!vincular} alCerrar={() => setVincular(null)} titulo={`Vincular persona a ${vincular?.nombre ?? ''}`}>
        {clave ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-700">Se creó la cuenta. Comparte esta contraseña temporal con la persona; deberá cambiarla en su primer ingreso:</p>
            <p className="rounded-xl bg-brand-green-light p-4 text-center font-mono text-lg text-brand-green-700">{clave}</p>
            <Boton className="w-full" onClick={() => { setVincular(null); setClave(null); }}>Listo</Boton>
          </div>
        ) : (
          <form onSubmit={vincularPersona} className="space-y-4">
            <Campo etiqueta="Nombre completo" value={p.nombre} onChange={(e) => setP({ ...p, nombre: e.target.value })} required />
            <Campo etiqueta="Correo" type="email" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} required />
            <Campo etiqueta="Celular" value={p.celular} onChange={(e) => setP({ ...p, celular: e.target.value })} />
            <Selector etiqueta="Vínculo" value={p.vinculo} onChange={(e) => setP({ ...p, vinculo: e.target.value })}>
              {Object.entries(VINCULOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Selector>
            <Boton type="submit" className="w-full">Vincular</Boton>
          </form>
        )}
      </Dialogo>
    </Transicion>
  );
}
