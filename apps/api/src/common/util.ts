import { Prisma } from '@prisma/client';

export const num = (d: Prisma.Decimal | number | string | null | undefined): number =>
  d === null || d === undefined ? 0 : Number(d);

export const periodoActual = (fecha = new Date()) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
