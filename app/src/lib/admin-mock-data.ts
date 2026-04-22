/** Datos mock para el panel de administración (no reemplazan backend real). */

export const adminConjunto = {
  nombre: "Conjunto Residencial Los Robles",
  direccion: "Carrera 45 # 120-30, Bogotá",
  torres: 3,
  unidadesTotales: 186,
};

export const adminUsuario = {
  nombre: "Ana María Rueda",
  rol: "Administradora",
  email: "ana.rueda@adminlosrobles.com",
};

export const adminKpis = {
  recaudoMes: 68_450_000,
  metaRecaudoMes: 71_200_000,
  carteraMora: 12_380_000,
  unidadesEnMora: 14,
  pqrsAbiertos: 7,
  mantenimientoAbierto: 5,
  visitantesHoy: 42,
};

export interface UnidadResumen {
  id: string;
  codigo: string;
  torre: string;
  propietario: string;
  saldo: number;
  diasMora: number;
  ultimoPago: string | null;
}

export const unidadesConMora: UnidadResumen[] = [
  {
    id: "u-101",
    codigo: "Torre A · 101",
    torre: "A",
    propietario: "Gómez & Asociados SAS",
    saldo: 1_155_000,
    diasMora: 45,
    ultimoPago: "2026-02-28",
  },
  {
    id: "u-204",
    codigo: "Torre B · 204",
    torre: "B",
    propietario: "Luis Fernando Ortiz",
    saldo: 770_000,
    diasMora: 32,
    ultimoPago: "2026-03-18",
  },
  {
    id: "u-312",
    codigo: "Torre A · 312",
    torre: "A",
    propietario: "Patricia Velandia",
    saldo: 535_000,
    diasMora: 18,
    ultimoPago: "2026-04-02",
  },
  {
    id: "u-508",
    codigo: "Torre C · 508",
    torre: "C",
    propietario: "Inversiones El Roble Ltda.",
    saldo: 2_310_000,
    diasMora: 62,
    ultimoPago: "2026-02-01",
  },
  {
    id: "u-702",
    codigo: "Torre B · 702",
    torre: "B",
    propietario: "Camilo Restrepo",
    saldo: 385_000,
    diasMora: 12,
    ultimoPago: "2026-04-08",
  },
];

export interface PqrsAdmin {
  id: string;
  radicado: string;
  unidad: string;
  asunto: string;
  categoria: "Petición" | "Queja" | "Reclamo" | "Sugerencia";
  estado: "Pendiente" | "En curso" | "Resuelto";
  fecha: string;
  responsable: string | null;
}

export const pqrsBandeja: PqrsAdmin[] = [
  {
    id: "p1",
    radicado: "PQRS-2026-042",
    unidad: "Parqueadero S1 · P15",
    asunto: "Filtración en techo del parqueadero",
    categoria: "Queja",
    estado: "En curso",
    fecha: "2026-04-10",
    responsable: "Mantenimiento",
  },
  {
    id: "p2",
    radicado: "PQRS-2026-038",
    unidad: "Torre B · 201",
    asunto: "Solicitud de bicicletero en sótano 2",
    categoria: "Petición",
    estado: "Pendiente",
    fecha: "2026-04-05",
    responsable: null,
  },
  {
    id: "p3",
    radicado: "PQRS-2026-044",
    unidad: "Torre A · 402",
    asunto: "Ruido en horario nocturno Torre C",
    categoria: "Queja",
    estado: "Pendiente",
    fecha: "2026-04-21",
    responsable: null,
  },
  {
    id: "p4",
    radicado: "PQRS-2026-039",
    unidad: "Zona común",
    asunto: "Mejora iluminación zona verde",
    categoria: "Sugerencia",
    estado: "En curso",
    fecha: "2026-04-12",
    responsable: "Consejo",
  },
];

export interface MovimientoTesoreria {
  id: string;
  fecha: string;
  concepto: string;
  tipo: "ingreso" | "egreso";
  monto: number;
}

export const movimientosRecientes: MovimientoTesoreria[] = [
  {
    id: "m1",
    fecha: "2026-04-22",
    concepto: "Consignación cuotas ordinarias (lote bancario)",
    tipo: "ingreso",
    monto: 4_200_000,
  },
  {
    id: "m2",
    fecha: "2026-04-21",
    concepto: "Pago proveedor aseo abril",
    tipo: "egreso",
    monto: 8_900_000,
  },
  {
    id: "m3",
    fecha: "2026-04-21",
    concepto: "Pago mantenimiento ascensores Torre A",
    tipo: "egreso",
    monto: 1_250_000,
  },
  {
    id: "m4",
    fecha: "2026-04-20",
    concepto: "Recaudo PSE / residentes",
    tipo: "ingreso",
    monto: 2_180_000,
  },
];

export interface RubroPresupuesto {
  rubro: string;
  presupuestado: number;
  ejecutado: number;
}

export const ejecucionPresupuesto: RubroPresupuesto[] = [
  { rubro: "Personal y seguridad", presupuestado: 28_000_000, ejecutado: 26_400_000 },
  { rubro: "Aseo y zonas comunes", presupuestado: 12_500_000, ejecutado: 11_200_000 },
  { rubro: "Mantenimiento técnico", presupuestado: 9_800_000, ejecutado: 7_100_000 },
  { rubro: "Servicios públicos", presupuestado: 15_200_000, ejecutado: 14_950_000 },
  { rubro: "Seguros y legal", presupuestado: 5_600_000, ejecutado: 5_600_000 },
];

export interface UnidadMaestro {
  id: string;
  codigo: string;
  tipo: string;
  coeficiente: number;
  propietario: string;
  estado: "Al día" | "Mora" | "Arrendado";
}

export const unidadesMaestro: UnidadMaestro[] = [
  { id: "um1", codigo: "A-101", tipo: "Apartamento", coeficiente: 1.82, propietario: "Gómez & Asociados SAS", estado: "Mora" },
  { id: "um2", codigo: "A-201", tipo: "Apartamento", coeficiente: 2.1, propietario: "María García", estado: "Al día" },
  { id: "um3", codigo: "A-402", tipo: "Apartamento", coeficiente: 2.34, propietario: "Carlos Mendoza", estado: "Al día" },
  { id: "um4", codigo: "B-204", tipo: "Apartamento", coeficiente: 1.95, propietario: "Luis Fernando Ortiz", estado: "Mora" },
  { id: "um5", codigo: "B-702", tipo: "Apartamento", coeficiente: 2.05, propietario: "Camilo Restrepo", estado: "Mora" },
  { id: "um6", codigo: "C-508", tipo: "Apartamento", coeficiente: 2.4, propietario: "Inversiones El Roble Ltda.", estado: "Mora" },
  { id: "um7", codigo: "LC-03", tipo: "Local", coeficiente: 0.9, propietario: "Andrés López", estado: "Arrendado" },
  { id: "um8", codigo: "PQ-S1-12", tipo: "Parqueadero", coeficiente: 0.35, propietario: "Laura Sánchez", estado: "Al día" },
];

export function formatCurrencyAdmin(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function pct(n: number, d: number): string {
  if (d === 0) return "0%";
  return `${Math.round((n / d) * 100)}%`;
}
