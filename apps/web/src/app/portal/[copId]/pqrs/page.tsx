'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { fecha } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import { useCop } from '@/components/contexto';
import { DetallePqrs, TIPOS_PQRS } from '@/components/compartidos';
import { AreaTexto, Boton, Campo, Cargando, Dialogo, Encabezado, Estado, Selector, Tarjeta, Transicion, Vacio, useAviso } from '@/components/ui';

export default function PortalPqrs() {
  const { copId } = useCop();
  const avisar = useAviso();
  const { data, recargar } = useApi<any[]>(`/copropiedades/${copId}/pqrs`);
  const { data: mias } = useApi<any[]>(`/copropiedades/${copId}/unidades/mias`);
  const [nueva, setNueva] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [f, setF] = useState({ tipo: 'PETICION', asunto: '', descripcion: '', unidadId: '' });

  const radicar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await api(`/copropiedades/${copId}/pqrs`, { body: { ...f, unidadId: f.unidadId || mias?.[0]?.id } });
      avisar(`Solicitud radicada con el número ${r.radicado}`);
      setNueva(false);
      setF({ tipo: 'PETICION', asunto: '', descripcion: '', unidadId: '' });
      recargar();
    } catch (err: any) {
      avisar(err.message, 'error');
    }
  };

  return (
    <Transicion>
      <Encabezado titulo="Mis solicitudes" subtitulo="Peticiones, quejas, reclamos, sugerencias y daños" acciones={<Boton icono={<Plus size={16} />} onClick={() => setNueva(true)}>Nueva solicitud</Boton>} />
      {!data ? <Cargando /> : data.length === 0 ? <Vacio titulo="No has radicado solicitudes" texto="Reporta un daño o escribe a la administración; te avisaremos cuando respondan." /> : (
        <div className="space-y-3">
          {data.map((p) => (
            <Tarjeta key={p.id} interactiva className="flex items-center justify-between gap-3 p-4" onClick={() => setSel(p.id)}>
              <div>
                <p className="font-medium text-brand-navy">{p.asunto}</p>
                <p className="text-xs text-ink-500">#{p.radicado} · {TIPOS_PQRS[p.tipo]} · {fecha(p.createdAt)}</p>
              </div>
              <Estado estado={p.estado} />
            </Tarjeta>
          ))}
        </div>
      )}
      <Dialogo abierto={nueva} alCerrar={() => setNueva(false)} titulo="Nueva solicitud">
        <form onSubmit={radicar} className="space-y-4">
          <Selector etiqueta="Tipo" value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
            {Object.entries(TIPOS_PQRS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Selector>
          {mias && mias.length > 1 && (
            <Selector etiqueta="Unidad" value={f.unidadId} onChange={(e) => setF({ ...f, unidadId: e.target.value })}>
              {mias.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </Selector>
          )}
          <Campo etiqueta="Asunto" value={f.asunto} onChange={(e) => setF({ ...f, asunto: e.target.value })} required />
          <AreaTexto etiqueta="Cuéntanos qué pasa" value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} required rows={5} />
          <Boton type="submit" className="w-full">Radicar</Boton>
        </form>
      </Dialogo>
      <Dialogo abierto={!!sel} alCerrar={() => setSel(null)} titulo="Solicitud" ancho="max-w-2xl">
        {sel && <DetallePqrs copId={copId} id={sel} alCambiar={recargar} />}
      </Dialogo>
    </Transicion>
  );
}
