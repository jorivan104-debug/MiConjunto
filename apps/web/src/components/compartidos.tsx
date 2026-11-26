'use client';
import { useState } from 'react';
import { CheckCheck, Download, FileText, Megaphone, Send } from 'lucide-react';
import { abrirArchivo, api } from '@/lib/api';
import { fecha, fechaHora } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import { AreaTexto, Boton, Cargando, Dialogo, Estado, Insignia, Tarjeta, Vacio, useAviso } from './ui';

export const TIPOS_PQRS: Record<string, string> = { PETICION: 'Petición', QUEJA: 'Queja', RECLAMO: 'Reclamo', SUGERENCIA: 'Sugerencia', DANO: 'Reporte de daño' };

/** Lista de comunicados; marca como leído al abrir. */
export function Comunicados({ copId, gestor }: { copId: string; gestor?: boolean }) {
  const { data, recargar } = useApi<any[]>(`/copropiedades/${copId}/comunicados`);
  const [abierto, setAbierto] = useState<any>(null);
  const abrir = async (c: any) => {
    setAbierto(c);
    if (!c.leido) {
      await api(`/copropiedades/${copId}/comunicados/${c.id}/leido`, { method: 'POST' });
      recargar();
    }
  };
  if (!data) return <Cargando />;
  if (!data.length) return <Vacio titulo="No hay comunicados" texto="Aquí verás los anuncios de la administración." />;
  return (
    <div className="space-y-3">
      {data.map((c) => (
        <Tarjeta key={c.id} interactiva className="flex gap-4 p-5" onClick={() => abrir(c)}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-yellow-light text-brand-yellow-800"><Megaphone size={20} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-brand-navy">{c.titulo}</p>
              {!c.leido && <Insignia tono="warning" punto>Nuevo</Insignia>}
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-ink-600">{c.cuerpo}</p>
            <p className="mt-2 flex items-center gap-3 text-xs text-ink-500">
              {fechaHora(c.createdAt)} · {c.autor}
              {gestor && c.destinatarios !== undefined && <span className="inline-flex items-center gap-1"><CheckCheck size={14} /> Leído por {c.lecturas} de {c.destinatarios}</span>}
            </p>
          </div>
        </Tarjeta>
      ))}
      <Dialogo abierto={!!abierto} alCerrar={() => setAbierto(null)} titulo={abierto?.titulo ?? ''}>
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{abierto?.cuerpo}</p>
        <p className="mt-4 text-xs text-ink-500">{abierto && fechaHora(abierto.createdAt)} · {abierto?.autor}</p>
      </Dialogo>
    </div>
  );
}

export function Documentos({ copId, puedeBorrar, recargarKey }: { copId: string; puedeBorrar?: boolean; recargarKey?: number }) {
  const { data, recargar } = useApi<any[]>(`/copropiedades/${copId}/documentos?k=${recargarKey ?? 0}`);
  const avisar = useAviso();
  if (!data) return <Cargando />;
  if (!data.length) return <Vacio titulo="No hay documentos" texto="Reglamento, actas, estados financieros y pólizas aparecerán aquí." />;
  return (
    <Tarjeta className="divide-y divide-ink-100">
      {data.map((d) => (
        <div key={d.id} className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue-light text-brand-blue"><FileText size={18} /></div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink-900">{d.titulo}</p>
            <p className="text-xs text-ink-500">{d.categoria} · {fecha(d.createdAt)}{d.visibilidad !== 'TODOS' && ` · Solo ${d.visibilidad === 'CONSEJO' ? 'consejo' : 'administración'}`}</p>
          </div>
          <Boton tamano="sm" variante="ghost" icono={<Download size={14} />} onClick={() => abrirArchivo(`/copropiedades/${copId}/documentos/${d.id}/archivo`).catch((e) => avisar(e.message, 'error'))}>Abrir</Boton>
          {puedeBorrar && (
            <Boton tamano="sm" variante="ghost" onClick={async () => { if (confirm('¿Eliminar documento?')) { await api(`/copropiedades/${copId}/documentos/${d.id}`, { method: 'DELETE' }); recargar(); } }}>Eliminar</Boton>
          )}
        </div>
      ))}
    </Tarjeta>
  );
}

/** Detalle de una PQRS con su conversación. */
export function DetallePqrs({ copId, id, alCambiar, gestion }: { copId: string; id: string; alCambiar?: () => void; gestion?: React.ReactNode }) {
  const { data, recargar } = useApi<any>(`/copropiedades/${copId}/pqrs/${id}`);
  const [texto, setTexto] = useState('');
  const avisar = useAviso();
  if (!data) return <Cargando />;
  const comentar = async () => {
    if (!texto.trim()) return;
    try {
      await api(`/copropiedades/${copId}/pqrs/${id}/comentarios`, { body: { texto } });
      setTexto('');
      recargar();
      alCambiar?.();
    } catch (e: any) {
      avisar(e.message, 'error');
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Insignia tono="info">Radicado #{data.radicado}</Insignia>
        <Insignia>{TIPOS_PQRS[data.tipo]}</Insignia>
        <Estado estado={data.estado} />
      </div>
      <div>
        <p className="font-semibold text-brand-navy">{data.asunto}</p>
        <p className="mt-1 whitespace-pre-line text-sm text-ink-700">{data.descripcion}</p>
        <p className="mt-2 text-xs text-ink-500">{data.autor}{data.unidad ? ` · ${data.unidad}` : ''} · {fechaHora(data.createdAt)}</p>
      </div>
      {data.respuesta && (
        <div className="rounded-xl bg-brand-green-light p-4 text-sm text-ink-800">
          <p className="mb-1 font-medium text-brand-green-700">Respuesta de la administración</p>
          {data.respuesta}
        </div>
      )}
      {gestion}
      <div className="space-y-2">
        {data.comentarios.map((c: any) => (
          <div key={c.id} className="rounded-xl bg-ink-50 p-3 text-sm">
            <p className="text-ink-800">{c.texto}</p>
            <p className="mt-1 text-xs text-ink-500">{c.autor} · {fechaHora(c.createdAt)}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <AreaTexto value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe un comentario" className="min-h-[44px]" rows={2} />
        <Boton variante="secondary" icono={<Send size={16} />} onClick={comentar} aria-label="Enviar comentario" />
      </div>
    </div>
  );
}
