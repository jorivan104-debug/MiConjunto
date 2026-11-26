import { validarHorario } from './reservas';

const zona = { horaApertura: '08:00', horaCierre: '22:00', maxHoras: 4 };
const ahora = new Date('2026-12-01T12:00:00-05:00');

describe('validarHorario', () => {
  it('acepta una reserva dentro del horario', () => {
    expect(() => validarHorario(zona, new Date('2026-12-05T10:00:00-05:00'), new Date('2026-12-05T13:00:00-05:00'), ahora)).not.toThrow();
  });
  it('rechaza fuera del horario de la zona', () => {
    expect(() => validarHorario(zona, new Date('2026-12-05T21:00:00-05:00'), new Date('2026-12-05T23:00:00-05:00'), ahora)).toThrow(/horario/);
  });
  it('rechaza si supera la duración máxima', () => {
    expect(() => validarHorario(zona, new Date('2026-12-05T09:00:00-05:00'), new Date('2026-12-05T14:00:00-05:00'), ahora)).toThrow(/duración/);
  });
  it('rechaza reservas en el pasado', () => {
    expect(() => validarHorario(zona, new Date('2026-11-30T10:00:00-05:00'), new Date('2026-11-30T11:00:00-05:00'), ahora)).toThrow(/pasado/);
  });
});
