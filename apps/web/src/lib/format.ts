const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
export const pesos = (v: number | string | null | undefined) => cop.format(Number(v ?? 0));
export const fecha = (d: string | Date) => new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Bogota' });
export const fechaHora = (d: string | Date) =>
  new Date(d).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' });
export const hora = (d: string | Date) => new Date(d).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' });
export const periodoActual = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
export const nombrePeriodo = (p: string) => {
  const [a, m] = p.split('-').map(Number);
  const t = new Date(a, m - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export const ROLES: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  ASISTENTE: 'Asistente',
  CONTADOR: 'Contador',
  CONSEJO: 'Consejo de administración',
  REVISOR_FISCAL: 'Revisor fiscal',
  PROPIETARIO: 'Propietario',
  RESIDENTE: 'Residente',
  PORTERIA: 'Portería',
};
export const GESTORES = ['ADMINISTRADOR', 'ASISTENTE', 'CONTADOR', 'CONSEJO', 'REVISOR_FISCAL'];

export const MEDIOS: Record<string, string> = { TRANSFERENCIA: 'Transferencia', CONSIGNACION: 'Consignación', PSE: 'PSE', TARJETA: 'Tarjeta', EFECTIVO: 'Efectivo', OTRO: 'Otro' };
