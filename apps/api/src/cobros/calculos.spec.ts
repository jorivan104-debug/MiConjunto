import {
  cuotaMensualTotal,
  distribuirPorCoeficiente,
  fechaVencimiento,
  imputarPago,
  interesMes,
  periodoAnterior,
  tasaMoraAplicable,
  tasaMoraMensualMaxima,
} from './calculos';

describe('tasa de mora (art. 30 Ley 675)', () => {
  it('convierte 1,5 veces el IBC efectivo anual a tasa mensual', () => {
    const t = tasaMoraMensualMaxima(0.2);
    expect(t).toBeCloseTo(Math.pow(1.3, 1 / 12) - 1, 10);
    expect(t).toBeCloseTo(0.02210, 4);
  });

  it('respeta la tasa menor fijada por la asamblea', () => {
    expect(tasaMoraAplicable(0.2, 0.01)).toBe(0.01);
  });

  it('nunca supera el tope legal', () => {
    expect(tasaMoraAplicable(0.2, 0.05)).toBeCloseTo(tasaMoraMensualMaxima(0.2), 10);
  });

  it('no cobra interés sobre saldo cero', () => {
    expect(interesMes(0, 0.02)).toBe(0);
    expect(interesMes(100000, 0.02)).toBe(2000);
  });
});

describe('cuota mensual y fondo de imprevistos (art. 35)', () => {
  it('calcula la doceava y el fondo', () => {
    const c = cuotaMensualTotal(120_000_000, 1);
    expect(c.ordinaria).toBe(10_000_000);
    expect(c.fondoImprevistos).toBe(100_000);
  });

  it('rechaza un fondo menor al 1 %', () => {
    expect(() => cuotaMensualTotal(1000, 0.5)).toThrow();
  });
});

describe('distribución por coeficiente', () => {
  it('la suma de cuotas es exactamente el total', () => {
    const unidades = [
      { id: 'a', coeficiente: 1 / 3 },
      { id: 'b', coeficiente: 1 / 3 },
      { id: 'c', coeficiente: 1 / 3 },
    ];
    const r = distribuirPorCoeficiente(1_000_000, unidades);
    const suma = [...r.values()].reduce((s, v) => s + v, 0);
    expect(suma).toBe(1_000_000);
    expect(Math.max(...r.values()) - Math.min(...r.values())).toBeLessThanOrEqual(1);
  });

  it('respeta la proporción de cada coeficiente', () => {
    const r = distribuirPorCoeficiente(1_000_000, [
      { id: 'grande', coeficiente: 0.6 },
      { id: 'pequena', coeficiente: 0.4 },
    ]);
    expect(r.get('grande')).toBe(600_000);
    expect(r.get('pequena')).toBe(400_000);
  });

  it('normaliza coeficientes que no suman 1', () => {
    const r = distribuirPorCoeficiente(900, [
      { id: 'x', coeficiente: 2 },
      { id: 'y', coeficiente: 1 },
    ]);
    expect(r.get('x')).toBe(600);
    expect(r.get('y')).toBe(300);
  });
});

describe('imputación de pagos (art. 1653 Código Civil)', () => {
  const d = (s: string) => new Date(s);
  const cargos = [
    { id: 'cuota-feb', saldo: 200_000, esInteres: false, vencimiento: d('2026-02-10') },
    { id: 'cuota-ene', saldo: 200_000, esInteres: false, vencimiento: d('2026-01-10') },
    { id: 'interes-feb', saldo: 4_000, esInteres: true, vencimiento: d('2026-02-28') },
  ];

  it('aplica primero intereses y luego la cuota más antigua', () => {
    const r = imputarPago(250_000, cargos);
    expect(r.aplicaciones).toEqual([
      { cargoId: 'interes-feb', valor: 4_000 },
      { cargoId: 'cuota-ene', valor: 200_000 },
      { cargoId: 'cuota-feb', valor: 46_000 },
    ]);
    expect(r.saldoAFavor).toBe(0);
  });

  it('deja el excedente como saldo a favor', () => {
    const r = imputarPago(500_000, cargos);
    expect(r.saldoAFavor).toBe(96_000);
  });

  it('rechaza pagos en cero', () => {
    expect(() => imputarPago(0, cargos)).toThrow();
  });
});

describe('periodos', () => {
  it('ajusta el vencimiento al último día del mes', () => {
    expect(fechaVencimiento('2026-02', 31).getUTCDate()).toBe(28);
  });
  it('calcula el periodo anterior cruzando el año', () => {
    expect(periodoAnterior('2026-01')).toBe('2025-12');
  });
});
