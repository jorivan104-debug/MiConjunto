'use client';
import { useState } from 'react';
import { useCop } from '@/components/contexto';
import { Comunicados, Documentos } from '@/components/compartidos';
import { Encabezado, Transicion, cn } from '@/components/ui';

export default function PortalComunicados() {
  const { copId } = useCop();
  const [tab, setTab] = useState<'avisos' | 'docs'>('avisos');
  return (
    <Transicion>
      <Encabezado titulo="Avisos y documentos" />
      <div className="mb-4 flex gap-2">
        <button onClick={() => setTab('avisos')} className={cn(tab === 'avisos' ? 'pill-info' : 'pill-neutral')}>Comunicados</button>
        <button onClick={() => setTab('docs')} className={cn(tab === 'docs' ? 'pill-info' : 'pill-neutral')}>Documentos</button>
      </div>
      {tab === 'avisos' ? <Comunicados copId={copId} /> : <Documentos copId={copId} />}
    </Transicion>
  );
}
