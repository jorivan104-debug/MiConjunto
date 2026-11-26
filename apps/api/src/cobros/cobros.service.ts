import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TipoConcepto } from '@prisma/client';
import { AuditoriaService } from '../common/auditoria.service';
import { num } from '../common/util';
import { ContabilidadService, Linea } from '../contabilidad/contabilidad.service';
import { CUENTA } from '../contabilidad/plan-base';
import { PrismaService } from '../prisma/prisma.service';
import { nombreUnidad } from '../unidades/unidades';
import {
  cuotaMensualTotal,
  distribuirPorCoeficiente,
  fechaVencimiento,
  imputarPago,
  interesMes,
  tasaMoraAplicable,
  validarPeriodo,
} from './calculos';

type Tx = Prisma.TransactionClient;

@Injectable()
export class CobrosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contabilidad: ContabilidadService,
    private readonly auditoria: AuditoriaService,
  ) {}

  private async concepto(tx: Tx, copropiedadId: string, tipo: TipoConcepto) {
    const c = await tx.conceptoCobro.findFirst({ where: { copropiedadId, tipo, activo: true } });
    if (!c) throw new BadRequestException(`No hay un concepto activo de tipo ${tipo}`);
    return c;
  }

  // ---------- Presupuesto y conceptos ----------

  presupuestos(copropiedadId: string) {
    return this.prisma.presupuesto.findMany({ where: { copropiedadId }, orderBy: { anio: 'desc' } });
  }

  async guardarPresupuesto(copropiedadId: string, usuarioId: string, dto: { anio: number; totalAnual: number; fondoImprevistosPct: number; actaAprobacion?: string }) {
    if (dto.fondoImprevistosPct < 1) throw new BadRequestException('El fondo de imprevistos debe ser al menos 1 % (art. 35 Ley 675)');
    const p = await this.prisma.presupuesto.upsert({
      where: { copropiedadId_anio: { copropiedadId, anio: dto.anio } },
      create: { copropiedadId, ...dto },
      update: dto,
    });
    await this.auditoria.registrar({ copropiedadId, usuarioId, accion: 'GUARDAR', entidad: 'Presupuesto', entidadId: p.id, detalle: dto });
    return p;
  }

  conceptos(copropiedadId: string) {
    return this.prisma.conceptoCobro.findMany({ where: { copropiedadId }, orderBy: { nombre: 'asc' } });
  }

  async actualizarConcepto(copropiedadId: string, id: string, dto: { nombre?: string; gravadoIva?: boolean; ivaPct?: number; activo?: boolean }) {
    const c = await this.prisma.conceptoCobro.findFirst({ where: { id, copropiedadId } });
    if (!c) throw new NotFoundException('Concepto no encontrado');
    return this.prisma.conceptoCobro.update({ where: { id }, data: dto });
  }

  // ---------- Generación de cargos ----------

  /**
   * Crea cargos y su asiento contable (un asiento por lote, con una línea por unidad).
   */
  private async crearCargos(
    tx: Tx,
    copropiedadId: string,
    concepto: { id: string; nombre: string; cuentaIngreso: string; gravadoIva: boolean; ivaPct: Prisma.Decimal },
    periodo: string,
    vencimiento: Date,
    items: { unidadId: string; valor: number; descripcion?: string }[],
    descripcionAsiento: string,
  ) {
    const lineas: Linea[] = [];
    const creados = [];
    for (const it of items) {
      if (it.valor <= 0) continue;
      const iva = concepto.gravadoIva ? Math.round((it.valor * num(concepto.ivaPct)) / 100) : 0;
      const cargo = await tx.cargo.create({
        data: {
          copropiedadId,
          unidadId: it.unidadId,
          conceptoId: concepto.id,
          periodo,
          descripcion: it.descripcion ?? `${concepto.nombre} ${periodo}`,
          valor: it.valor,
          iva,
          saldo: it.valor + iva,
          vencimiento,
        },
      });
      creados.push(cargo);
      lineas.push({ cuentaCodigo: CUENTA.CXC, unidadId: it.unidadId, debito: it.valor + iva });
      lineas.push({ cuentaCodigo: concepto.cuentaIngreso, unidadId: it.unidadId, credito: it.valor });
      if (iva) lineas.push({ cuentaCodigo: CUENTA.IVA, unidadId: it.unidadId, credito: iva });
    }
    if (creados.length) {
      await this.contabilidad.crearAsiento(tx, copropiedadId, descripcionAsiento, 'CARGO', creados.length === 1 ? creados[0].id : null, lineas);
    }
    return creados;
  }

  /** Liquidación mensual de cuotas ordinarias y fondo de imprevistos por coeficiente. */
  async liquidar(copropiedadId: string, periodo: string, usuarioId: string) {
    validarPeriodo(periodo);
    const anio = Number(periodo.slice(0, 4));
    const cop = await this.prisma.copropiedad.findUniqueOrThrow({ where: { id: copropiedadId } });
    const presupuesto = await this.prisma.presupuesto.findUnique({ where: { copropiedadId_anio: { copropiedadId, anio } } });
    if (!presupuesto) throw new BadRequestException(`No hay presupuesto aprobado para ${anio}`);
    const unidades = await this.prisma.unidad.findMany({ where: { copropiedadId } });
    if (!unidades.length) throw new BadRequestException('La copropiedad no tiene unidades');

    const cuota = cuotaMensualTotal(num(presupuesto.totalAnual), num(presupuesto.fondoImprevistosPct));
    const coefs = unidades.map((u) => ({ id: u.id, coeficiente: num(u.coeficiente) }));
    const ordinaria = distribuirPorCoeficiente(cuota.ordinaria, coefs);
    const fondo = distribuirPorCoeficiente(cuota.fondoImprevistos, coefs);
    const vencimiento = fechaVencimiento(periodo, cop.diaVencimiento);

    return this.prisma.$transaction(async (tx) => {
      const cOrd = await this.concepto(tx, copropiedadId, 'ORDINARIA');
      const cFondo = await this.concepto(tx, copropiedadId, 'FONDO_IMPREVISTOS');
      const yaLiquidadas = new Set(
        (await tx.cargo.findMany({
          where: { copropiedadId, periodo, conceptoId: cOrd.id, estado: { not: 'ANULADO' } },
          select: { unidadId: true },
        })).map((c) => c.unidadId),
      );
      const pendientes = unidades.filter((u) => !yaLiquidadas.has(u.id));
      const ord = await this.crearCargos(tx, copropiedadId, cOrd, periodo, vencimiento,
        pendientes.map((u) => ({ unidadId: u.id, valor: ordinaria.get(u.id) ?? 0 })), `Liquidación cuotas de administración ${periodo}`);
      const fon = await this.crearCargos(tx, copropiedadId, cFondo, periodo, vencimiento,
        pendientes.map((u) => ({ unidadId: u.id, valor: fondo.get(u.id) ?? 0 })), `Fondo de imprevistos ${periodo}`);
      for (const u of pendientes) await this.aplicarAnticipos(tx, copropiedadId, u.id);
      await this.auditoria.registrar({ tx, copropiedadId, usuarioId, accion: 'LIQUIDAR', entidad: 'Cargo', detalle: { periodo, unidades: pendientes.length } });
      return {
        periodo,
        unidadesLiquidadas: pendientes.length,
        unidadesOmitidas: yaLiquidadas.size,
        totalOrdinaria: ord.reduce((s, c) => s + num(c.valor), 0),
        totalFondo: fon.reduce((s, c) => s + num(c.valor), 0),
        vencimiento,
      };
    }, { timeout: 120_000 });
  }

  /**
   * Intereses de mora del periodo (art. 30 Ley 675) sobre el capital vencido antes del inicio del periodo.
   * Nunca se calculan intereses sobre intereses.
   */
  async generarIntereses(copropiedadId: string, periodo: string, usuarioId: string) {
    validarPeriodo(periodo);
    const cop = await this.prisma.copropiedad.findUniqueOrThrow({ where: { id: copropiedadId } });
    const tasa = await this.prisma.tasaInteres.findUnique({ where: { periodo } });
    if (!tasa) throw new BadRequestException(`Falta la tasa de interés bancario corriente de ${periodo} certificada por la Superfinanciera`);
    const tasaMensual = tasaMoraAplicable(num(tasa.ibcEfectivaAnual), cop.tasaMoraMensual === null ? null : num(cop.tasaMoraMensual));
    const [a, m] = periodo.split('-').map(Number);
    const inicioPeriodo = new Date(Date.UTC(a, m - 1, 1));

    return this.prisma.$transaction(async (tx) => {
      const cInt = await this.concepto(tx, copropiedadId, 'INTERES_MORA');
      const ya = new Set((await tx.cargo.findMany({
        where: { copropiedadId, periodo, conceptoId: cInt.id, estado: { not: 'ANULADO' } }, select: { unidadId: true },
      })).map((c) => c.unidadId));
      const capital = await tx.cargo.groupBy({
        by: ['unidadId'],
        where: { copropiedadId, estado: 'PENDIENTE', vencimiento: { lt: inicioPeriodo }, concepto: { tipo: { not: 'INTERES_MORA' } } },
        _sum: { saldo: true },
      });
      const items = capital
        .filter((c) => !ya.has(c.unidadId))
        .map((c) => ({
          unidadId: c.unidadId,
          valor: interesMes(num(c._sum.saldo), tasaMensual),
          descripcion: `Intereses de mora ${periodo} (${(tasaMensual * 100).toFixed(2)} % mensual sobre $${num(c._sum.saldo).toLocaleString('es-CO')})`,
        }));
      const creados = await this.crearCargos(tx, copropiedadId, cInt, periodo, fechaVencimiento(periodo, cop.diaVencimiento), items, `Intereses de mora ${periodo}`);
      await this.auditoria.registrar({ tx, copropiedadId, usuarioId, accion: 'INTERESES', entidad: 'Cargo', detalle: { periodo, tasaMensual, unidades: creados.length } });
      return { periodo, tasaMensual, unidades: creados.length, total: creados.reduce((s, c) => s + num(c.valor), 0) };
    }, { timeout: 120_000 });
  }

  /** Cobro puntual (cuota extraordinaria, multa u otro) a una unidad o a todas por coeficiente. */
  async cargoManual(
    copropiedadId: string,
    usuarioId: string,
    dto: { conceptoId: string; descripcion: string; valor: number; periodo: string; unidadId?: string; todasPorCoeficiente?: boolean; vencimiento?: string },
  ) {
    validarPeriodo(dto.periodo);
    if (!dto.unidadId && !dto.todasPorCoeficiente) throw new BadRequestException('Indica la unidad o marca "todas por coeficiente"');
    const cop = await this.prisma.copropiedad.findUniqueOrThrow({ where: { id: copropiedadId } });
    const concepto = await this.prisma.conceptoCobro.findFirst({ where: { id: dto.conceptoId, copropiedadId } });
    if (!concepto) throw new NotFoundException('Concepto no encontrado');
    if (concepto.tipo === 'INTERES_MORA') throw new BadRequestException('Los intereses se generan con el proceso de mora');
    const venc = dto.vencimiento ? new Date(dto.vencimiento) : fechaVencimiento(dto.periodo, cop.diaVencimiento);
    let items: { unidadId: string; valor: number; descripcion: string }[];
    if (dto.todasPorCoeficiente) {
      const unidades = await this.prisma.unidad.findMany({ where: { copropiedadId } });
      const dist = distribuirPorCoeficiente(dto.valor, unidades.map((u) => ({ id: u.id, coeficiente: num(u.coeficiente) })));
      items = unidades.map((u) => ({ unidadId: u.id, valor: dist.get(u.id) ?? 0, descripcion: dto.descripcion }));
    } else {
      const u = await this.prisma.unidad.findFirst({ where: { id: dto.unidadId, copropiedadId } });
      if (!u) throw new NotFoundException('Unidad no encontrada');
      items = [{ unidadId: u.id, valor: Math.round(dto.valor), descripcion: dto.descripcion }];
    }
    return this.prisma.$transaction(async (tx) => {
      const creados = await this.crearCargos(tx, copropiedadId, concepto, dto.periodo, venc, items, dto.descripcion);
      for (const it of items) await this.aplicarAnticipos(tx, copropiedadId, it.unidadId);
      await this.auditoria.registrar({ tx, copropiedadId, usuarioId, accion: 'CARGO_MANUAL', entidad: 'Cargo', detalle: { ...dto, cargos: creados.length } });
      return { cargos: creados.length, total: creados.reduce((s, c) => s + num(c.valor) + num(c.iva), 0) };
    }, { timeout: 120_000 });
  }

  /** Crea un cargo individual dentro de una transacción existente (reservas). */
  async cargoInterno(tx: Tx, copropiedadId: string, tipo: TipoConcepto, unidadId: string, valor: number, descripcion: string, periodo: string, vencimiento: Date) {
    const concepto = await this.concepto(tx, copropiedadId, tipo);
    const [cargo] = await this.crearCargos(tx, copropiedadId, concepto, periodo, vencimiento, [{ unidadId, valor, descripcion }], descripcion);
    await this.aplicarAnticipos(tx, copropiedadId, unidadId);
    return cargo;
  }

  async anularCargo(copropiedadId: string, cargoId: string, usuarioId: string, motivo: string) {
    return this.prisma.$transaction(async (tx) => {
      const c = await tx.cargo.findFirst({ where: { id: cargoId, copropiedadId }, include: { aplicaciones: true, concepto: true } });
      if (!c) throw new NotFoundException('Cargo no encontrado');
      if (c.estado === 'ANULADO') throw new BadRequestException('El cargo ya está anulado');
      if (c.aplicaciones.length) throw new BadRequestException('El cargo tiene pagos aplicados; anula primero esos pagos');
      await tx.cargo.update({ where: { id: cargoId }, data: { estado: 'ANULADO', saldo: 0 } });
      const total = num(c.valor) + num(c.iva);
      await this.contabilidad.crearAsiento(tx, copropiedadId, `Anulación: ${c.descripcion}. Motivo: ${motivo}`, 'ANULACION', cargoId, [
        { cuentaCodigo: c.concepto.cuentaIngreso, unidadId: c.unidadId, debito: num(c.valor) },
        { cuentaCodigo: CUENTA.IVA, unidadId: c.unidadId, debito: num(c.iva) },
        { cuentaCodigo: CUENTA.CXC, unidadId: c.unidadId, credito: total },
      ]);
      await this.auditoria.registrar({ tx, copropiedadId, usuarioId, accion: 'ANULAR', entidad: 'Cargo', entidadId: cargoId, detalle: { motivo } });
      return { ok: true };
    });
  }

  // ---------- Imputación de pagos y anticipos ----------

  /** Aplica un valor a los cargos pendientes de una unidad y actualiza sus saldos. */
  async imputar(tx: Tx, unidadId: string, pagoId: string, valor: number) {
    const cargos = await tx.cargo.findMany({ where: { unidadId, estado: 'PENDIENTE' }, include: { concepto: true } });
    const r = imputarPago(valor, cargos.map((c) => ({ id: c.id, saldo: num(c.saldo), esInteres: c.concepto.tipo === 'INTERES_MORA', vencimiento: c.vencimiento })));
    for (const a of r.aplicaciones) {
      const c = cargos.find((x) => x.id === a.cargoId)!;
      const nuevo = num(c.saldo) - a.valor;
      await tx.cargo.update({ where: { id: c.id }, data: { saldo: nuevo, estado: nuevo <= 0 ? 'PAGADO' : 'PENDIENTE' } });
      await tx.aplicacionPago.create({ data: { pagoId, cargoId: c.id, valor: a.valor } });
    }
    return { aplicado: valor - r.saldoAFavor, saldoAFavor: r.saldoAFavor };
  }

  /** Usa saldos a favor (anticipos) de la unidad para pagar cargos nuevos. */
  async aplicarAnticipos(tx: Tx, copropiedadId: string, unidadId: string) {
    const pagos = await tx.pago.findMany({
      where: { unidadId, estado: 'CONFIRMADO', saldoAFavor: { gt: 0 } },
      orderBy: { fecha: 'asc' },
    });
    for (const p of pagos) {
      const pendientes = await tx.cargo.count({ where: { unidadId, estado: 'PENDIENTE' } });
      if (!pendientes) break;
      const r = await this.imputar(tx, unidadId, p.id, num(p.saldoAFavor));
      if (r.aplicado <= 0) continue;
      await tx.pago.update({ where: { id: p.id }, data: { saldoAFavor: r.saldoAFavor } });
      await this.contabilidad.crearAsiento(tx, copropiedadId, 'Aplicación de anticipo a cartera', 'PAGO', p.id, [
        { cuentaCodigo: CUENTA.ANTICIPOS, unidadId, debito: r.aplicado },
        { cuentaCodigo: CUENTA.CXC, unidadId, credito: r.aplicado },
      ]);
    }
  }

  // ---------- Consultas ----------

  /** Cartera por unidad con edades de vencimiento. */
  async cartera(copropiedadId: string) {
    const hoy = Date.now();
    const cargos = await this.prisma.cargo.findMany({
      where: { copropiedadId, estado: 'PENDIENTE' },
      include: { unidad: { include: { torre: true, personas: { where: { hasta: null, responsablePago: true }, include: { usuario: { select: { nombre: true } } } } } } },
    });
    const porUnidad = new Map<string, any>();
    for (const c of cargos) {
      const f = porUnidad.get(c.unidadId) ?? {
        unidadId: c.unidadId,
        unidad: nombreUnidad(c.unidad),
        responsable: c.unidad.personas[0]?.usuario.nombre ?? null,
        saldo: 0, corriente: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90: 0,
      };
      const s = num(c.saldo);
      f.saldo += s;
      const dias = Math.floor((hoy - c.vencimiento.getTime()) / 86_400_000);
      if (dias <= 0) f.corriente += s;
      else if (dias <= 30) f.d1_30 += s;
      else if (dias <= 60) f.d31_60 += s;
      else if (dias <= 90) f.d61_90 += s;
      else f.d90 += s;
      porUnidad.set(c.unidadId, f);
    }
    const filas = [...porUnidad.values()].sort((a, b) => b.saldo - a.saldo);
    const totales = filas.reduce(
      (t, f) => ({ saldo: t.saldo + f.saldo, corriente: t.corriente + f.corriente, d1_30: t.d1_30 + f.d1_30, d31_60: t.d31_60 + f.d31_60, d61_90: t.d61_90 + f.d61_90, d90: t.d90 + f.d90 }),
      { saldo: 0, corriente: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90: 0 },
    );
    return { filas, totales };
  }

  async estadoCuenta(copropiedadId: string, unidadId: string) {
    const unidad = await this.prisma.unidad.findFirst({
      where: { id: unidadId, copropiedadId },
      include: { torre: true, copropiedad: true, personas: { where: { hasta: null }, include: { usuario: { select: { nombre: true, email: true } } } } },
    });
    if (!unidad) throw new NotFoundException('Unidad no encontrada');
    const [cargos, pagos] = await Promise.all([
      this.prisma.cargo.findMany({ where: { unidadId }, include: { concepto: true }, orderBy: { vencimiento: 'desc' }, take: 200 }),
      this.prisma.pago.findMany({ where: { unidadId }, orderBy: { fecha: 'desc' }, take: 100 }),
    ]);
    const saldo = cargos.filter((c) => c.estado === 'PENDIENTE').reduce((s, c) => s + num(c.saldo), 0);
    const saldoAFavor = pagos.filter((p) => p.estado === 'CONFIRMADO').reduce((s, p) => s + num(p.saldoAFavor), 0);
    const vencido = cargos.filter((c) => c.estado === 'PENDIENTE' && c.vencimiento.getTime() < Date.now()).reduce((s, c) => s + num(c.saldo), 0);
    return {
      unidad: { id: unidad.id, nombre: nombreUnidad(unidad), coeficientePct: Math.round(num(unidad.coeficiente) * 1e8) / 1e6 },
      copropiedad: { nombre: unidad.copropiedad.nombre, nit: unidad.copropiedad.nit },
      personas: unidad.personas.map((p) => ({ nombre: p.usuario.nombre, vinculo: p.vinculo })),
      saldo,
      vencido,
      saldoAFavor,
      cargos: cargos.map((c) => ({
        id: c.id, periodo: c.periodo, descripcion: c.descripcion, concepto: c.concepto.nombre, tipo: c.concepto.tipo,
        valor: num(c.valor), iva: num(c.iva), saldo: num(c.saldo), vencimiento: c.vencimiento, estado: c.estado,
      })),
      pagos: pagos.map((p) => ({ id: p.id, fecha: p.fecha, valor: num(p.valor), medio: p.medio, referencia: p.referencia, estado: p.estado, saldoAFavor: num(p.saldoAFavor) })),
    };
  }

  /**
   * Certificado de deuda (art. 48 Ley 675): firmado por el administrador, es título ejecutivo.
   * Si el saldo es cero, sirve como paz y salvo.
   */
  async certificado(copropiedadId: string, unidadId: string) {
    const ec = await this.estadoCuenta(copropiedadId, unidadId);
    const pendientes = ec.cargos.filter((c) => c.estado === 'PENDIENTE');
    const capital = pendientes.filter((c) => c.tipo !== 'INTERES_MORA').reduce((s, c) => s + c.saldo, 0);
    const intereses = pendientes.filter((c) => c.tipo === 'INTERES_MORA').reduce((s, c) => s + c.saldo, 0);
    const admin = await this.prisma.membresia.findFirst({ where: { copropiedadId, rol: 'ADMINISTRADOR' }, include: { usuario: true } });
    return {
      tipo: ec.saldo > 0 ? 'CERTIFICADO_DEUDA' : 'PAZ_Y_SALVO',
      fecha: new Date(),
      copropiedad: ec.copropiedad,
      unidad: ec.unidad,
      propietarios: ec.personas.filter((p) => p.vinculo === 'PROPIETARIO').map((p) => p.nombre),
      capital,
      intereses,
      total: ec.saldo,
      detalle: pendientes.map((c) => ({ periodo: c.periodo, descripcion: c.descripcion, saldo: c.saldo, vencimiento: c.vencimiento })),
      administrador: admin?.usuario.nombre ?? null,
    };
  }

  tasas() {
    return this.prisma.tasaInteres.findMany({ orderBy: { periodo: 'desc' }, take: 36 });
  }

  async guardarTasa(periodo: string, ibcEfectivaAnual: number) {
    validarPeriodo(periodo);
    if (ibcEfectivaAnual <= 0 || ibcEfectivaAnual > 1) throw new BadRequestException('La tasa debe ser una fracción entre 0 y 1 (0.17 = 17 %)');
    return this.prisma.tasaInteres.upsert({ where: { periodo }, create: { periodo, ibcEfectivaAnual }, update: { ibcEfectivaAnual } });
  }
}
