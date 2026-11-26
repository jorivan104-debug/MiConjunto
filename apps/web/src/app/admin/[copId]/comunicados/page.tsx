'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { tieneRol, useCop } from '@/components/contexto';
import { Comunicados } from '@/components/compartidos';
import { AreaTexto, Boton, Campo, Dialogo, Encabezado, Transicion, useAviso } from '@/components/ui';

export default function ComunicadosAdmin() {
  const cop = useCop();
  const avisar = useAviso();
  const [dlg, setDlg] = useState(false);
  const [k, setK] = useState(0);
  const [f, setF] = useState({ titulo: '', cuerpo: '' });
  const publicar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api(`/copropiedades/${cop.copId}/comunicados`, { body: f });
      avisar('Comunicado publicado');
      setDlg(false);
      setF({ titulo: '', cuerpo: '' });
      setK(k + 1);
    } catch (err: any) {
      avisar(err.message, 'error');
    }
  };
  const gestor = tieneRol(cop, 'ADMINISTRADOR', 'ASISTENTE');
  return (
    <Transicion>
      <Encabezado titulo="Comunicados" subtitulo="Circulares con confirmación de lectura" acciones={gestor && <Boton icono={<Plus size={16} />} onClick={() => setDlg(true)}>Nuevo comunicado</Boton>} />
      <Comunicados key={k} copId={cop.copId} gestor={gestor} />
      <Dialogo abierto={dlg} alCerrar={() => setDlg(false)} titulo="Nuevo comunicado">
        <form onSubmit={publicar} className="space-y-4">
          <Campo etiqueta="Título" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} required />
          <AreaTexto etiqueta="Mensaje" rows={8} value={f.cuerpo} onChange={(e) => setF({ ...f, cuerpo: e.target.value })} required />
          <Boton type="submit" className="w-full">Publicar</Boton>
        </form>
      </Dialogo>
    </Transicion>
  );
}
