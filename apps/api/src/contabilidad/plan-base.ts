import { Naturaleza, TipoConcepto } from '@prisma/client';

/**
 * Plan de cuentas base para copropiedades, inspirado en el PUC colombiano.
 * Es configurable por copropiedad y debe validarlo el contador (marco NIIF aplicable).
 */
export const PLAN_BASE: { codigo: string; nombre: string; naturaleza: Naturaleza }[] = [
  { codigo: '1105', nombre: 'Caja', naturaleza: 'DEBITO' },
  { codigo: '1110', nombre: 'Bancos', naturaleza: 'DEBITO' },
  { codigo: '1305', nombre: 'Cuentas por cobrar a copropietarios', naturaleza: 'DEBITO' },
  { codigo: '2408', nombre: 'IVA por pagar', naturaleza: 'CREDITO' },
  { codigo: '2805', nombre: 'Anticipos recibidos de copropietarios', naturaleza: 'CREDITO' },
  { codigo: '3305', nombre: 'Fondo de imprevistos', naturaleza: 'CREDITO' },
  { codigo: '4170', nombre: 'Cuotas de administración', naturaleza: 'CREDITO' },
  { codigo: '4171', nombre: 'Cuotas extraordinarias', naturaleza: 'CREDITO' },
  { codigo: '4210', nombre: 'Intereses de mora', naturaleza: 'CREDITO' },
  { codigo: '4220', nombre: 'Uso y alquiler de zonas comunes', naturaleza: 'CREDITO' },
  { codigo: '4250', nombre: 'Multas y sanciones', naturaleza: 'CREDITO' },
  { codigo: '4295', nombre: 'Otros ingresos', naturaleza: 'CREDITO' },
];

export const CUENTA = {
  CAJA: '1105',
  BANCOS: '1110',
  CXC: '1305',
  IVA: '2408',
  ANTICIPOS: '2805',
} as const;

export const CONCEPTOS_BASE: { nombre: string; tipo: TipoConcepto; cuentaIngreso: string; gravadoIva?: boolean }[] = [
  { nombre: 'Cuota de administración', tipo: 'ORDINARIA', cuentaIngreso: '4170' },
  { nombre: 'Fondo de imprevistos', tipo: 'FONDO_IMPREVISTOS', cuentaIngreso: '3305' },
  { nombre: 'Cuota extraordinaria', tipo: 'EXTRAORDINARIA', cuentaIngreso: '4171' },
  { nombre: 'Intereses de mora', tipo: 'INTERES_MORA', cuentaIngreso: '4210' },
  { nombre: 'Uso de zonas comunes', tipo: 'RESERVA', cuentaIngreso: '4220', gravadoIva: true },
  { nombre: 'Multa por convivencia', tipo: 'MULTA', cuentaIngreso: '4250' },
  { nombre: 'Otros cobros', tipo: 'OTRO', cuentaIngreso: '4295' },
];
