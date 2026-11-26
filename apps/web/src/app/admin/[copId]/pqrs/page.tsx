'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { fecha } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import { tieneRol, useCop } from '@/components/contexto';
import { DetallePqrs, TIPOS_PQRS } from '@/components/compartidos';
import { AreaTexto, Boton, Cargando, Dialogo, Encabezado, Estado, Insignia, Selector, Tarjeta, Transicion, Vacio, useAviso } from '@/components/ui';

export default function PqrsAdmin() {
  const cop = useCop();
  const avisar = useAviso();
  const [filtro, setFiltro] = useState('abiertas');
  const { data, recargar } = useApi<any[]>(`/copropiedades/${cop.copId}/pqrs`);
  const { data: equipo } = useApi<any[]>(tieneRol(cop, 'ADMINISTRADOR') ? `/copropiedades/${cop.copId}/usuarios` : null);
  const [sel, setSel] = useState<any>(null);
  const [g, setG] = useState({ estado: '', asignadoId: '', respuesta: '' });

  const abrir = (p: any) => {
    setSel(p);
    setG({ estado: p.estado, asignadoId: p.asignadoId ?? '', respuesta: p.respuesta ?? '' });
  };
  const guardar = async () => {
    try {
      await api(`/copropiedades/${cop.copId}/pqrs/${sel.id}`, { method: 'PATCH', body: { estado: g.estado, asignadoId: g.asignadoId || undefined, respuesta: g.respuesta || undefined } });
      avisar('Solicitud actualizada');
      setSel(null);
      recargar();
    } catch (e: any) {
      avisar(e.message, 'error');
    }
  };

  const lista = data?.filter((p) => (filtro === 'abiertas' ? ['RADICADA', 'EN_PROCESO'].includes(p.estado) : filtro === 'cerradas' ? ['RESUELTA', 'CERRADA'].includes(p.estado) : true));
  const staff = equipo?.filter((m) => ['ADMINISTRADOR', 'ASISTENTE', 'CONSEJO'].includes(m.rol)) ?? [];

  return (
    <Transicion>
      <Encabezado titulo="PQRS" subtitulo="Peticiones, quejas, reclamos, sugerencias y reportes de daños" />
      <div className="mb-4 flex gap-2">
        {[['abiertas', 'Abiertas'], ['cerradas', 'Resueltas'], ['todas', 'Todas']].map(([k, v]) => (
          <button key={k} onClick={() => setFiltro(k)} className={filtro === k ? 'pill-info' : 'pill-neutral hover:bg-ink-200'}>{v}</button>
        ))}
      </div>
      {!lista ? <Cargando /> : lista.length === 0 ? <Vacio titulo="No hay solicitudes en esta vista" /> : (
        <Tarjeta className="overflow-x-auto">
          <table className="tabla">
            <thead><tr><th>#</th><th>Asunto</th><th>Tipo</th><th>Unidad</th><th>Estado</th><th>Radicada</th><th className="text-right">Días</th></tr></thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id} className="cursor-pointer hover:bg-ink-50" onClick={() => abrir(p)}>
                  <td className="tabular-nums text-ink-500">{p.radicado}</td>
                  <td className="font-medium">{p.asunto}<p className="text-xs font-normal text-ink-500">{p.autor}{p.asignado ? ` · asignada a ${p.asignado}` : ''}</p></td>
                  <td><Insignia>{TIPOS_PQRS[p.tipo]}</Insignia></td>
                  <td>{p.unidad ?? '—'}</td>
                  <td><Estado estado={p.estado} /></td>
                  <td>{fecha(p.createdAt)}</td>
                  <td className={`text-right tabular-nums ${p.diasAbierta > 15 && !p.resueltaAt ? 'font-semibold text-brand-red-700' : ''}`}>{p.diasAbierta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tarjeta>
      )}
      <Dialogo abierto={!!sel} alCerrar={() => setSel(null)} titulo="Solicitud" ancho="max-w-2xl">
        {sel && (
          <DetallePqrs
            copId={cop.copId}
            id={sel.id}
            alCambiar={recargar}
            gestion={tieneRol(cop, 'ADMINISTRADOR', 'ASISTENTE', 'CONSEJO') && (
              <div className="space-y-3 rounded-xl border border-ink-200 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Selector etiqueta="Estado" value={g.estado} onChange={(e) => setG({ ...g, estado: e.target.value })}>
                    <option value="RADICADA">Radicada</option>
                    <option value="EN_PROCESO">En proceso</option>
                    <option value="RESUELTA">Resuelta</option>
                    <option value="CERRADA">Cerrada</option>
                  </Selector>
                  {staff.length > 0 && (
                    <Selector etiqueta="Responsable" value={g.asignadoId} onChange={(e) => setG({ ...g, asignadoId: e.target.value })}>
                      <option value="">Sin asignar</option>
                      {staff.map((m) => <option key={m.membresiaId} value={m.id}>{m.nombre}</option>)}
                    </Selector>
                  )}
                </div>
                <AreaTexto etiqueta="Respuesta al residente" value={g.respuesta} onChange={(e) => setG({ ...g, respuesta: e.target.value })} />
                <Boton onClick={guardar}>Guardar gestión</Boton>
              </div>
            )}
          />
        )}
      </Dialogo>
    </Transicion>
  );
}
