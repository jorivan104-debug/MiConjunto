'use client';
import { useState } from 'react';
import { Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { tieneRol, useCop } from '@/components/contexto';
import { Documentos } from '@/components/compartidos';
import { Boton, Campo, Dialogo, Encabezado, Selector, Transicion, useAviso } from '@/components/ui';

export default function DocumentosAdmin() {
  const cop = useCop();
  const avisar = useAviso();
  const [dlg, setDlg] = useState(false);
  const [k, setK] = useState(0);
  const [f, setF] = useState({ titulo: '', categoria: 'Reglamento', visibilidad: 'TODOS' });
  const [archivo, setArchivo] = useState<File | null>(null);
  const subir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo) return;
    const form = new FormData();
    Object.entries(f).forEach(([k, v]) => form.append(k, v));
    form.append('archivo', archivo);
    try {
      await api(`/copropiedades/${cop.copId}/documentos`, { form });
      avisar('Documento cargado');
      setDlg(false);
      setK(k + 1);
    } catch (err: any) {
      avisar(err.message, 'error');
    }
  };
  return (
    <Transicion>
      <Encabezado titulo="Documentos" subtitulo="Reglamento, actas, estados financieros, contratos y pólizas" acciones={tieneRol(cop, 'ADMINISTRADOR', 'ASISTENTE') && <Boton icono={<Upload size={16} />} onClick={() => setDlg(true)}>Subir documento</Boton>} />
      <Documentos copId={cop.copId} puedeBorrar={tieneRol(cop, 'ADMINISTRADOR')} recargarKey={k} />
      <Dialogo abierto={dlg} alCerrar={() => setDlg(false)} titulo="Subir documento">
        <form onSubmit={subir} className="space-y-4">
          <Campo etiqueta="Título" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Selector etiqueta="Categoría" value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}>
              {['Reglamento', 'Actas', 'Estados financieros', 'Contratos', 'Pólizas', 'Manual de convivencia', 'General'].map((c) => <option key={c}>{c}</option>)}
            </Selector>
            <Selector etiqueta="Quién lo ve" value={f.visibilidad} onChange={(e) => setF({ ...f, visibilidad: e.target.value })}>
              <option value="TODOS">Todos</option>
              <option value="CONSEJO">Consejo y administración</option>
              <option value="ADMINISTRACION">Solo administración</option>
            </Selector>
          </div>
          <Campo etiqueta="Archivo" type="file" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} required className="py-2" ayuda="PDF, imagen, Word o Excel; máximo 25 MB" />
          <Boton type="submit" className="w-full">Subir</Boton>
        </form>
      </Dialogo>
    </Transicion>
  );
}
