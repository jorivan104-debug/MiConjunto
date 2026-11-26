'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { ROLES } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import { useCop } from '@/components/contexto';
import { Boton, Campo, Cargando, Dialogo, Encabezado, Insignia, Selector, Tarjeta, Transicion, useAviso } from '@/components/ui';

const ROLES_EQUIPO = ['ADMINISTRADOR', 'ASISTENTE', 'CONTADOR', 'CONSEJO', 'REVISOR_FISCAL', 'PORTERIA'];

export default function Equipo() {
  const { copId } = useCop();
  const avisar = useAviso();
  const { data, recargar } = useApi<any[]>(`/copropiedades/${copId}/usuarios`);
  const [dlg, setDlg] = useState(false);
  const [clave, setClave] = useState<string | null>(null);
  const [f, setF] = useState({ nombre: '', email: '', celular: '', rol: 'CONTADOR' });

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await api(`/copropiedades/${copId}/usuarios`, { body: { ...f, celular: f.celular || undefined } });
      avisar('Rol asignado');
      setClave(r.passwordTemporal);
      if (!r.passwordTemporal) setDlg(false);
      setF({ nombre: '', email: '', celular: '', rol: 'CONTADOR' });
      recargar();
    } catch (err: any) {
      avisar(err.message, 'error');
    }
  };
  const quitar = async (id: string) => {
    if (!confirm('¿Quitar este rol?')) return;
    try {
      await api(`/copropiedades/${copId}/usuarios/${id}`, { method: 'DELETE' });
      recargar();
    } catch (err: any) {
      avisar(err.message, 'error');
    }
  };

  return (
    <Transicion>
      <Encabezado titulo="Equipo y roles" subtitulo="Cada persona ve solo lo que su rol permite" acciones={<Boton icono={<Plus size={16} />} onClick={() => { setClave(null); setDlg(true); }}>Agregar persona</Boton>} />
      {!data ? <Cargando /> : (
        <Tarjeta className="overflow-x-auto">
          <table className="tabla">
            <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th /></tr></thead>
            <tbody>
              {data.map((m) => (
                <tr key={m.membresiaId}>
                  <td className="font-medium">{m.nombre}</td>
                  <td className="text-ink-600">{m.email}</td>
                  <td><Insignia tono={['PROPIETARIO', 'RESIDENTE'].includes(m.rol) ? 'neutral' : 'info'}>{ROLES[m.rol]}</Insignia></td>
                  <td className="text-right">{!['PROPIETARIO', 'RESIDENTE'].includes(m.rol) && <Boton tamano="sm" variante="ghost" onClick={() => quitar(m.membresiaId)}>Quitar</Boton>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tarjeta>
      )}
      <Dialogo abierto={dlg} alCerrar={() => setDlg(false)} titulo="Agregar persona al equipo">
        {clave ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-700">Cuenta creada. Comparte esta contraseña temporal; se pedirá cambiarla en el primer ingreso:</p>
            <p className="rounded-xl bg-brand-green-light p-4 text-center font-mono text-lg text-brand-green-700">{clave}</p>
            <Boton className="w-full" onClick={() => setDlg(false)}>Listo</Boton>
          </div>
        ) : (
          <form onSubmit={agregar} className="space-y-4">
            <Campo etiqueta="Nombre" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required />
            <Campo etiqueta="Correo" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
            <Campo etiqueta="Celular" value={f.celular} onChange={(e) => setF({ ...f, celular: e.target.value })} />
            <Selector etiqueta="Rol" value={f.rol} onChange={(e) => setF({ ...f, rol: e.target.value })}>
              {ROLES_EQUIPO.map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}
            </Selector>
            <Boton type="submit" className="w-full">Agregar</Boton>
          </form>
        )}
      </Dialogo>
    </Transicion>
  );
}
