import { BadRequestException, Injectable } from '@nestjs/common';
import { OrigenAsiento, Prisma } from '@prisma/client';
import { num } from '../common/util';
import { PrismaService } from '../prisma/prisma.service';

export interface Linea {
  cuentaCodigo: string;
  debito?: number;
  credito?: number;
  unidadId?: string | null;
}

@Injectable()
export class ContabilidadService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un asiento de partida doble. Los asientos no se borran ni se editan:
   * para corregir se registra un asiento de anulación con los valores invertidos.
   */
  async crearAsiento(
    tx: Prisma.TransactionClient,
    copropiedadId: string,
    descripcion: string,
    origen: OrigenAsiento,
    origenId: string | null,
    lineas: Linea[],
    fecha = new Date(),
  ) {
    const limpias = lineas
      .map((l) => ({ ...l, debito: Math.round(l.debito ?? 0), credito: Math.round(l.credito ?? 0) }))
      .filter((l) => l.debito !== 0 || l.credito !== 0);
    const d = limpias.reduce((s, l) => s + l.debito, 0);
    const c = limpias.reduce((s, l) => s + l.credito, 0);
    if (d !== c) throw new BadRequestException(`Asiento descuadrado: débitos ${d} y créditos ${c}`);
    if (d === 0) return null;
    // Bloqueo por copropiedad para numerar sin saltos ni duplicados
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${copropiedadId}))`;
    const ultimo = await tx.asiento.aggregate({ where: { copropiedadId }, _max: { numero: true } });
    return tx.asiento.create({
      data: {
        copropiedadId,
        numero: (ultimo._max.numero ?? 0) + 1,
        descripcion,
        origen,
        origenId,
        fecha,
        lineas: { create: limpias },
      },
    });
  }

  /** Revierte los asientos de un origen (cargo o pago) invirtiendo débitos y créditos. */
  async anularAsientosDe(tx: Prisma.TransactionClient, copropiedadId: string, origenId: string, descripcion: string) {
    const asientos = await tx.asiento.findMany({ where: { copropiedadId, origenId }, include: { lineas: true } });
    for (const a of asientos) {
      await this.crearAsiento(
        tx,
        copropiedadId,
        `${descripcion} (anula asiento ${a.numero})`,
        'ANULACION',
        origenId,
        a.lineas.map((l) => ({ cuentaCodigo: l.cuentaCodigo, unidadId: l.unidadId, debito: num(l.credito), credito: num(l.debito) })),
      );
    }
  }

  cuentas(copropiedadId: string) {
    return this.prisma.cuentaContable.findMany({ where: { copropiedadId }, orderBy: { codigo: 'asc' } });
  }

  async libroDiario(copropiedadId: string, desde?: Date, hasta?: Date) {
    const asientos = await this.prisma.asiento.findMany({
      where: { copropiedadId, fecha: { gte: desde, lte: hasta } },
      include: { lineas: true },
      orderBy: { numero: 'desc' },
      take: 500,
    });
    return asientos.map((a) => ({
      ...a,
      lineas: a.lineas.map((l) => ({ ...l, debito: num(l.debito), credito: num(l.credito) })),
    }));
  }

  /** Balance de prueba: saldos por cuenta según su naturaleza. */
  async balancePrueba(copropiedadId: string, hasta?: Date) {
    const [cuentas, sumas] = await Promise.all([
      this.cuentas(copropiedadId),
      this.prisma.lineaAsiento.groupBy({
        by: ['cuentaCodigo'],
        where: { asiento: { copropiedadId, fecha: { lte: hasta } } },
        _sum: { debito: true, credito: true },
      }),
    ]);
    const porCuenta = new Map(sumas.map((s) => [s.cuentaCodigo, s]));
    const filas = cuentas.map((c) => {
      const s = porCuenta.get(c.codigo);
      const debitos = num(s?._sum.debito);
      const creditos = num(s?._sum.credito);
      const saldo = c.naturaleza === 'DEBITO' ? debitos - creditos : creditos - debitos;
      return { codigo: c.codigo, nombre: c.nombre, naturaleza: c.naturaleza, debitos, creditos, saldo };
    });
    return {
      filas,
      totalDebitos: filas.reduce((s, f) => s + f.debitos, 0),
      totalCreditos: filas.reduce((s, f) => s + f.creditos, 0),
    };
  }
}
