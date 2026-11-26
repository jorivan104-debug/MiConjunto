'use client';
import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { api } from '@/lib/api';
import { fecha, hora, pesos } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import { tieneRol, useCop } from '@/components/contexto';
import { Boton, Campo, Cargando, Dialogo, Encabezado, Estado, Tarjeta, Transicion, Vacio, useAviso } from '@/components/ui';

export default function ReservasAdmin() {
  const cop = useCop();
  const avisar = useAviso();
  const gestor = tieneRol(cop, 'ADMINISTRADOR', 'ASISTENTE');
  const { data: zonas, recargar: recZonas } = useApi<any[]>(`/copropiedades/${cop.copId}/reservas/zonas`);
  const { data: reservas, recargar } = useApi<any[]>(`/copropiedades/${cop.copId}/reservas`);
  const [dlg, setDlg] = useState<any>(null);
  const [z, setZ] = useState<any>({});

  const decidir = async (id: string, que: 'aprobar' | 'rechazar') => {
    try {
      await api(`/copropiedades/${cop.copId}/reservas/${id}/${que}`, { method: 'POST' });
      avisar(que === 'aprobar' ? 'Reserva aprobada. Si tiene tarifa, se generó el cobro.' : 'Reserva rechazada');
      recargar();
    } catch (e: any) {
      avisar(e.message, 'error');
    }
  };

  const guardarZona = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { nombre: z.nombre, descripcion: z.descripcion || undefined, capacidad: z.capacidad ? Number(z.capacidad) : undefined, horaApertura: z.horaApertura, horaCierre: z.horaCierre, maxHoras: Number(z.maxHoras), tarifa: Number(z.tarifa || 0), requiereAprobacion: !!z.requiereAprobacion, activa: z.activa !== false };
    try {
      if (dlg === 'nueva') await api(`/copropiedades/${cop.copId}/reservas/zonas`, { body });
      else await api(`/copropiedades/${cop.copId}/reservas/zonas/${dlg.id}`, { method: 'PATCH', body });
      avisar('Zona guardada');
      setDlg(null);
      recZonas();
    } catch (err: any) {
      avisar(err.message, 'error');
    }
  };

  const pendientes = reservas?.filter((r) => r.estado === 'PENDIENTE') ?? [];
  const proximas = reservas?.filter((r) => r.estado === 'APROBADA' && new Date(r.fin) > new Date()) ?? [];

  return (
    <Transicion>
      <Encabezado
        titulo="Reservas"
        subtitulo="Zonas comunes, solicitudes y agenda"
        acciones={gestor && <Boton icono={<Plus size={16} />} onClick={() => { setZ({ horaApertura: '08:00', horaCierre: '22:00', maxHoras: 4, tarifa: 0, requiereAprobacion: true }); setDlg('nueva'); }}>Nueva zona</Boton>}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Tarjeta className="p-6">
            <h3 className="mb-4">Por aprobar ({pendientes.length})</h3>
            {!reservas ? <Cargando /> : pendientes.length === 0 ? <p className="text-sm text-ink-500">No hay solicitudes pendientes.</p> : (
              <div className="space-y-3">
                {pendientes.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-200 p-4">
                    <div>
                      <p className="font-medium text-brand-navy">{r.zona} · {fecha(r.inicio)}, {hora(r.inicio)} a {hora(r.fin)}</p>
                      <p className="text-sm text-ink-500">{r.unidad} · {r.usuario}{r.tarifa ? ` · tarifa ${pesos(r.tarifa)}` : ''}</p>
                      {r.nota && <p className="mt-1 text-sm text-ink-600">“{r.nota}”</p>}
                    </div>
                    {gestor && (
                      <div className="flex gap-2">
                        <Boton tamano="sm" icono={<Check size={14} />} onClick={() => decidir(r.id, 'aprobar')}>Aprobar</Boton>
                        <Boton tamano="sm" variante="outline" icono={<X size={14} />} onClick={() => decidir(r.id, 'rechazar')}>Rechazar</Boton>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Tarjeta>
          <Tarjeta className="p-6">
            <h3 className="mb-4">Próximas reservas</h3>
            {proximas.length === 0 ? <p className="text-sm text-ink-500">No hay reservas aprobadas próximas.</p> : (
              <table className="tabla">
                <tbody>
                  {proximas.sort((a, b) => +new Date(a.inicio) - +new Date(b.inicio)).map((r) => (
                    <tr key={r.id}><td className="font-medium">{fecha(r.inicio)}</td><td>{hora(r.inicio)} a {hora(r.fin)}</td><td>{r.zona}</td><td>{r.unidad}</td><td><Estado estado={r.estado} /></td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </Tarjeta>
        </div>
        <div className="space-y-3">
          <h3>Zonas comunes</h3>
          {!zonas ? <Cargando /> : zonas.length === 0 ? <Vacio titulo="Sin zonas" /> : zonas.map((x) => (
            <Tarjeta key={x.id} interactiva={gestor} className="p-4" onClick={() => { if (gestor) { setZ(x); setDlg(x); } }}>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-brand-navy">{x.nombre}</p>
                {!x.activa && <span className="pill-neutral">Inactiva</span>}
              </div>
              <p className="text-sm text-ink-500">{x.horaApertura} a {x.horaCierre} · máx. {x.maxHoras} h · {x.tarifa ? pesos(x.tarifa) : 'Sin costo'}{x.requiereAprobacion ? ' · requiere aprobación' : ''}</p>
            </Tarjeta>
          ))}
        </div>
      </div>
      <Dialogo abierto={!!dlg} alCerrar={() => setDlg(null)} titulo={dlg === 'nueva' ? 'Nueva zona común' : 'Editar zona'}>
        <form onSubmit={guardarZona} className="space-y-4">
          <Campo etiqueta="Nombre" value={z.nombre ?? ''} onChange={(e) => setZ({ ...z, nombre: e.target.value })} required />
          <Campo etiqueta="Descripción" value={z.descripcion ?? ''} onChange={(e) => setZ({ ...z, descripcion: e.target.value })} />
          <div className="grid grid-cols-3 gap-3">
            <Campo etiqueta="Abre" type="time" value={z.horaApertura} onChange={(e) => setZ({ ...z, horaApertura: e.target.value })} />
            <Campo etiqueta="Cierra" type="time" value={z.horaCierre} onChange={(e) => setZ({ ...z, horaCierre: e.target.value })} />
            <Campo etiqueta="Máx. horas" type="number" min="1" value={z.maxHoras} onChange={(e) => setZ({ ...z, maxHoras: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Capacidad" type="number" value={z.capacidad ?? ''} onChange={(e) => setZ({ ...z, capacidad: e.target.value })} />
            <Campo etiqueta="Tarifa (COP)" type="number" min="0" value={z.tarifa} onChange={(e) => setZ({ ...z, tarifa: e.target.value })} ayuda="Gravada con IVA si la copropiedad es responsable" />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#1F7C3A]" checked={!!z.requiereAprobacion} onChange={(e) => setZ({ ...z, requiereAprobacion: e.target.checked })} /> Requiere aprobación de la administración</label>
          {dlg !== 'nueva' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#1F7C3A]" checked={z.activa !== false} onChange={(e) => setZ({ ...z, activa: e.target.checked })} /> Zona activa</label>}
          <Boton type="submit" className="w-full">Guardar</Boton>
        </form>
      </Dialogo>
    </Transicion>
  );
}
