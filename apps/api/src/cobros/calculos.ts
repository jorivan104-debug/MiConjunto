/**
 * Reglas de cálculo de cobros en propiedad horizontal (Ley 675 de 2001).
 * Funciones puras: sin base de datos, para poder probarlas a fondo.
 * Todos los valores están en pesos colombianos y se redondean al peso.
 */

export const redondear = (v: number) => Math.round(v);

/**
 * Art. 30 Ley 675: el interés de mora es 1,5 veces el interés bancario corriente (IBC)
 * certificado por la Superintendencia Financiera. El IBC se certifica como tasa efectiva anual;
 * se convierte a tasa efectiva mensual equivalente.
 */
export function tasaMoraMensualMaxima(ibcEfectivaAnual: number): number {
  if (ibcEfectivaAnual < 0) throw new Error('La tasa no puede ser negativa');
  return Math.pow(1 + 1.5 * ibcEfectivaAnual, 1 / 12) - 1;
}

/** La asamblea puede fijar una tasa menor, nunca mayor al tope legal. */
export function tasaMoraAplicable(ibcEfectivaAnual: number, tasaCopropiedad?: number | null): number {
  const maxima = tasaMoraMensualMaxima(ibcEfectivaAnual);
  if (tasaCopropiedad === null || tasaCopropiedad === undefined) return maxima;
  return Math.min(Math.max(tasaCopropiedad, 0), maxima);
}

/** Interés de un mes sobre capital vencido. No se cobran intereses sobre intereses. */
export function interesMes(capitalVencido: number, tasaMensual: number): number {
  if (capitalVencido <= 0) return 0;
  return redondear(capitalVencido * tasaMensual);
}

export interface CuotaMensual {
  ordinaria: number;
  fondoImprevistos: number;
}

/** Art. 35 Ley 675: el fondo de imprevistos es un porcentaje (mínimo 1 %) adicional al presupuesto. */
export function cuotaMensualTotal(totalAnual: number, fondoPct: number): CuotaMensual {
  if (fondoPct < 1) throw new Error('El fondo de imprevistos no puede ser menor al 1 % (art. 35 Ley 675)');
  const ordinaria = totalAnual / 12;
  return { ordinaria, fondoImprevistos: (ordinaria * fondoPct) / 100 };
}

export interface UnidadCoef {
  id: string;
  coeficiente: number;
}

/**
 * Reparte un total entre unidades según su coeficiente (art. 29 Ley 675).
 * Usa el método del mayor residuo para que la suma de cuotas sea exactamente el total.
 * Los coeficientes se normalizan por su suma, por si no suman exactamente 1.
 */
export function distribuirPorCoeficiente(total: number, unidades: UnidadCoef[]): Map<string, number> {
  const resultado = new Map<string, number>();
  if (unidades.length === 0) return resultado;
  const suma = unidades.reduce((s, u) => s + u.coeficiente, 0);
  if (suma <= 0) throw new Error('La suma de coeficientes debe ser mayor que cero');
  const objetivo = redondear(total);
  const partes = unidades.map((u) => {
    const exacto = (objetivo * u.coeficiente) / suma;
    const base = Math.floor(exacto);
    return { id: u.id, base, residuo: exacto - base };
  });
  let faltante = objetivo - partes.reduce((s, p) => s + p.base, 0);
  const orden = [...partes].sort((a, b) => b.residuo - a.residuo || a.id.localeCompare(b.id));
  for (const p of orden) {
    if (faltante <= 0) break;
    p.base += 1;
    faltante -= 1;
  }
  for (const p of partes) resultado.set(p.id, p.base);
  return resultado;
}

export interface CargoPendiente {
  id: string;
  saldo: number;
  esInteres: boolean;
  vencimiento: Date;
}

export interface Imputacion {
  aplicaciones: { cargoId: string; valor: number }[];
  saldoAFavor: number;
}

/**
 * Imputa un pago a los cargos pendientes.
 * Art. 1653 del Código Civil: el pago se imputa primero a intereses y luego a capital.
 * Dentro de cada grupo, primero lo más antiguo.
 */
export function imputarPago(valor: number, cargos: CargoPendiente[]): Imputacion {
  if (valor <= 0) throw new Error('El valor del pago debe ser mayor que cero');
  let restante = redondear(valor);
  const ordenados = [...cargos]
    .filter((c) => c.saldo > 0)
    .sort((a, b) => {
      if (a.esInteres !== b.esInteres) return a.esInteres ? -1 : 1;
      return a.vencimiento.getTime() - b.vencimiento.getTime();
    });
  const aplicaciones: { cargoId: string; valor: number }[] = [];
  for (const c of ordenados) {
    if (restante <= 0) break;
    const aplicado = Math.min(restante, redondear(c.saldo));
    if (aplicado > 0) {
      aplicaciones.push({ cargoId: c.id, valor: aplicado });
      restante -= aplicado;
    }
  }
  return { aplicaciones, saldoAFavor: restante };
}

/** Valida formato de periodo AAAA-MM. */
export function validarPeriodo(periodo: string): void {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)) throw new Error('El periodo debe tener formato AAAA-MM');
}

/** Fecha de vencimiento del periodo: el día configurado del mismo mes. */
export function fechaVencimiento(periodo: string, dia: number): Date {
  validarPeriodo(periodo);
  const [a, m] = periodo.split('-').map(Number);
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return new Date(Date.UTC(a, m - 1, Math.min(Math.max(dia, 1), ultimo), 23, 59, 59));
}

/** Periodo anterior a uno dado. */
export function periodoAnterior(periodo: string): string {
  validarPeriodo(periodo);
  const [a, m] = periodo.split('-').map(Number);
  const d = new Date(Date.UTC(a, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
