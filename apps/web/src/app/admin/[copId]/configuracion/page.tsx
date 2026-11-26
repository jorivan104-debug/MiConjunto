'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useCop } from '@/components/contexto';
import { Boton, Campo, Cargando, Encabezado, Selector, Tarjeta, Transicion, useAviso } from '@/components/ui';

export default function Configuracion() {
  const { copId } = useCop();
  const avisar = useAviso();
  const { data } = useApi<any>(`/copropiedades/${copId}`);
  const { data: tasas } = useApi<any[]>('/tasas-interes');
  const [f, setF] = useState<any>(null);
  useEffect(() => {
    if (data) setF({ ...data, tasaMoraPct: data.tasaMoraMensual ? (Number(data.tasaMoraMensual) * 100).toString() : '' });
  }, [data]);
  if (!f) return <Cargando />;

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api(`/copropiedades/${copId}`, {
        method: 'PATCH',
        body: { nombre: f.nombre, tipo: f.tipo, direccion: f.direccion || undefined, ciudad: f.ciudad || undefined, responsableIva: f.responsableIva, diaVencimiento: Number(f.diaVencimiento), tasaMoraMensual: f.tasaMoraPct ? Number(f.tasaMoraPct) / 100 : null },
      });
      avisar('Configuración guardada');
    } catch (err: any) {
      avisar(err.message, 'error');
    }
  };
  const ultima = tasas?.[0];
  const maxima = ultima ? (Math.pow(1 + 1.5 * Number(ultima.ibcEfectivaAnual), 1 / 12) - 1) * 100 : null;

  return (
    <Transicion>
      <Encabezado titulo="Configuración" subtitulo={`NIT ${f.nit}`} />
      <form onSubmit={guardar} className="grid gap-6 lg:grid-cols-2">
        <Tarjeta className="space-y-4 p-6">
          <h3>Datos de la copropiedad</h3>
          <Campo etiqueta="Nombre" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} />
          <Selector etiqueta="Tipo" value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
            <option value="RESIDENCIAL">Residencial</option>
            <option value="COMERCIAL">Comercial (revisor fiscal obligatorio)</option>
            <option value="MIXTA">Mixta (revisor fiscal obligatorio)</option>
          </Selector>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Ciudad" value={f.ciudad ?? ''} onChange={(e) => setF({ ...f, ciudad: e.target.value })} />
            <Campo etiqueta="Dirección" value={f.direccion ?? ''} onChange={(e) => setF({ ...f, direccion: e.target.value })} />
          </div>
        </Tarjeta>
        <Tarjeta className="space-y-4 p-6">
          <h3>Cobro e impuestos</h3>
          <Campo etiqueta="Día de vencimiento de la cuota" type="number" min="1" max="28" value={f.diaVencimiento} onChange={(e) => setF({ ...f, diaVencimiento: e.target.value })} />
          <Campo
            etiqueta="Tasa de mora mensual aprobada por la asamblea (%)"
            type="number"
            step="0.01"
            value={f.tasaMoraPct}
            onChange={(e) => setF({ ...f, tasaMoraPct: e.target.value })}
            ayuda={`Déjalo vacío para usar el tope legal (art. 30 Ley 675)${maxima ? `: hoy ${maxima.toFixed(2)} % mensual con la tasa de ${ultima.periodo}` : ''}. Si escribes una mayor, se aplica el tope.`}
          />
          <label className="flex items-start gap-3 text-sm text-ink-700">
            <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[#1F7C3A]" checked={f.responsableIva} onChange={(e) => setF({ ...f, responsableIva: e.target.checked })} />
            Responsable de IVA. Los alquileres de zonas comunes con cobro están gravados con IVA y requieren factura electrónica (DIAN).
          </label>
        </Tarjeta>
        <div className="lg:col-span-2"><Boton type="submit">Guardar cambios</Boton></div>
      </form>
    </Transicion>
  );
}
