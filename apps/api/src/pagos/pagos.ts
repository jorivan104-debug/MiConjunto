import {
  BadRequestException, Body, Controller, ForbiddenException, Get, HttpCode, Injectable, NotFoundException, Param, Post, Query,
  UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EstadoPago, MedioPago } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { randomBytes } from 'crypto';
import { Actual, FINANZAS, Public, Roles, UsuarioActual } from '../common/decorators';
import { AuditoriaService } from '../common/auditoria.service';
import { num } from '../common/util';
import { CobrosService } from '../cobros/cobros.service';
import { ContabilidadService } from '../contabilidad/contabilidad.service';
import { CUENTA } from '../contabilidad/plan-base';
import { almacenamiento } from '../documentos/almacenamiento';
import { PrismaService } from '../prisma/prisma.service';
import { nombreUnidad, UnidadesService } from '../unidades/unidades';
import { eventoValido, urlCheckout, wompiConfigurado } from './wompi';

export class RegistrarPagoDto {
  @IsString() unidadId: string;
  @IsNumber() @Min(1) valor: number;
  @IsEnum(MedioPago) medio: MedioPago;
  @IsOptional() @IsString() referencia?: string;
  @IsOptional() @IsDateString() fecha?: string;
}

export class ReportarPagoDto {
  @IsString() unidadId: string;
  @IsString() valor: string;
  @IsEnum(MedioPago) medio: MedioPago;
  @IsOptional() @IsString() referencia?: string;
  @IsOptional() @IsString() fecha?: string;
}

@Injectable()
export class PagosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cobros: CobrosService,
    private readonly contabilidad: ContabilidadService,
    private readonly auditoria: AuditoriaService,
  ) {}

  listar(copropiedadId: string, estado?: EstadoPago) {
    return this.prisma.pago
      .findMany({
        where: { copropiedadId, estado },
        include: { unidad: { include: { torre: true } } },
        orderBy: { fecha: 'desc' },
        take: 300,
      })
      .then((ps) => ps.map((p) => ({ ...p, unidad: nombreUnidad(p.unidad), valor: num(p.valor), saldoAFavor: num(p.saldoAFavor) })));
  }

  /** Confirma un pago: lo imputa a la cartera y genera el asiento contable. */
  private async confirmarEnTx(tx: any, copropiedadId: string, pagoId: string) {
    const p = await tx.pago.findUniqueOrThrow({ where: { id: pagoId } });
    if (p.estado === 'CONFIRMADO') return p;
    const valor = num(p.valor);
    const pendientes = await tx.cargo.count({ where: { unidadId: p.unidadId, estado: 'PENDIENTE' } });
    const r = pendientes ? await this.cobros.imputar(tx, p.unidadId, p.id, valor) : { aplicado: 0, saldoAFavor: valor };
    const actualizado = await tx.pago.update({ where: { id: p.id }, data: { estado: 'CONFIRMADO', saldoAFavor: r.saldoAFavor } });
    await this.contabilidad.crearAsiento(tx, copropiedadId, `Recaudo ${p.medio}${p.referencia ? ' ref. ' + p.referencia : ''}`, 'PAGO', p.id, [
      { cuentaCodigo: p.medio === 'EFECTIVO' ? CUENTA.CAJA : CUENTA.BANCOS, unidadId: p.unidadId, debito: valor },
      { cuentaCodigo: CUENTA.CXC, unidadId: p.unidadId, credito: r.aplicado },
      { cuentaCodigo: CUENTA.ANTICIPOS, unidadId: p.unidadId, credito: r.saldoAFavor },
    ], p.fecha);
    return actualizado;
  }

  async registrar(copropiedadId: string, usuarioId: string, dto: RegistrarPagoDto) {
    const u = await this.prisma.unidad.findFirst({ where: { id: dto.unidadId, copropiedadId } });
    if (!u) throw new NotFoundException('Unidad no encontrada');
    return this.prisma.$transaction(async (tx) => {
      const p = await tx.pago.create({
        data: {
          copropiedadId, unidadId: u.id, valor: Math.round(dto.valor), medio: dto.medio,
          referencia: dto.referencia || null, fecha: dto.fecha ? new Date(dto.fecha) : new Date(), registradoPorId: usuarioId,
        },
      });
      const r = await this.confirmarEnTx(tx, copropiedadId, p.id);
      await this.auditoria.registrar({ tx, copropiedadId, usuarioId, accion: 'REGISTRAR', entidad: 'Pago', entidadId: p.id, detalle: { valor: dto.valor, medio: dto.medio } });
      return r;
    });
  }

  /** El residente reporta una consignación con su soporte; la administración la confirma. */
  async reportar(copropiedadId: string, usuarioId: string, dto: ReportarPagoDto, soporte?: Express.Multer.File) {
    const valor = Math.round(Number(dto.valor));
    if (!Number.isFinite(valor) || valor <= 0) throw new BadRequestException('Valor inválido');
    const soporteUrl = soporte ? await almacenamiento.guardar(copropiedadId, soporte) : null;
    const p = await this.prisma.pago.create({
      data: {
        copropiedadId, unidadId: dto.unidadId, valor, medio: dto.medio, referencia: dto.referencia || null,
        fecha: dto.fecha ? new Date(dto.fecha) : new Date(), soporteUrl, registradoPorId: usuarioId, estado: 'PENDIENTE',
      },
    });
    await this.auditoria.registrar({ copropiedadId, usuarioId, accion: 'REPORTAR', entidad: 'Pago', entidadId: p.id });
    return p;
  }

  async confirmar(copropiedadId: string, pagoId: string, usuarioId: string) {
    const p = await this.prisma.pago.findFirst({ where: { id: pagoId, copropiedadId } });
    if (!p) throw new NotFoundException('Pago no encontrado');
    if (p.estado !== 'PENDIENTE') throw new BadRequestException('Solo se confirman pagos pendientes');
    return this.prisma.$transaction(async (tx) => {
      const r = await this.confirmarEnTx(tx, copropiedadId, pagoId);
      await this.auditoria.registrar({ tx, copropiedadId, usuarioId, accion: 'CONFIRMAR', entidad: 'Pago', entidadId: pagoId });
      return r;
    });
  }

  async rechazar(copropiedadId: string, pagoId: string, usuarioId: string) {
    const p = await this.prisma.pago.findFirst({ where: { id: pagoId, copropiedadId } });
    if (!p || p.estado !== 'PENDIENTE') throw new BadRequestException('Solo se rechazan pagos pendientes');
    await this.prisma.pago.update({ where: { id: pagoId }, data: { estado: 'RECHAZADO' } });
    await this.auditoria.registrar({ copropiedadId, usuarioId, accion: 'RECHAZAR', entidad: 'Pago', entidadId: pagoId });
    return { ok: true };
  }

  /** Anula un pago confirmado: devuelve los saldos a los cargos y revierte sus asientos. */
  async anular(copropiedadId: string, pagoId: string, usuarioId: string, motivo: string) {
    return this.prisma.$transaction(async (tx) => {
      const p = await tx.pago.findFirst({ where: { id: pagoId, copropiedadId }, include: { aplicaciones: { include: { cargo: true } } } });
      if (!p) throw new NotFoundException('Pago no encontrado');
      if (p.estado !== 'CONFIRMADO') throw new BadRequestException('Solo se anulan pagos confirmados');
      for (const a of p.aplicaciones) {
        await tx.cargo.update({ where: { id: a.cargoId }, data: { saldo: num(a.cargo.saldo) + num(a.valor), estado: 'PENDIENTE' } });
      }
      await tx.aplicacionPago.deleteMany({ where: { pagoId } });
      await tx.pago.update({ where: { id: pagoId }, data: { estado: 'ANULADO', saldoAFavor: 0 } });
      await this.contabilidad.anularAsientosDe(tx, copropiedadId, pagoId, `Anulación de pago. Motivo: ${motivo}`);
      await this.auditoria.registrar({ tx, copropiedadId, usuarioId, accion: 'ANULAR', entidad: 'Pago', entidadId: pagoId, detalle: { motivo } });
      return { ok: true };
    });
  }

  /** Crea un pago pendiente y devuelve el enlace de pago en línea por el saldo de la unidad. */
  async checkout(copropiedadId: string, unidadId: string, usuarioId: string) {
    if (!wompiConfigurado()) throw new BadRequestException('El pago en línea no está configurado para esta copropiedad');
    const saldo = await this.prisma.cargo.aggregate({ where: { unidadId, estado: 'PENDIENTE' }, _sum: { saldo: true } });
    const valor = num(saldo._sum.saldo);
    if (valor <= 0) throw new BadRequestException('La unidad no tiene saldo pendiente');
    const referencia = `PH-${Date.now()}-${randomBytes(3).toString('hex')}`;
    await this.prisma.pago.create({
      data: { copropiedadId, unidadId, valor, medio: 'PSE', referencia, estado: 'PENDIENTE', registradoPorId: usuarioId },
    });
    return { referencia, valor, url: urlCheckout(referencia, valor) };
  }

  /** Webhook de Wompi: confirma o rechaza según el estado de la transacción. */
  async eventoWompi(evento: any) {
    if (!eventoValido(evento, process.env.WOMPI_EVENTS_SECRET ?? '')) throw new ForbiddenException('Firma inválida');
    const t = evento?.data?.transaction;
    if (evento.event !== 'transaction.updated' || !t?.reference) return { ok: true };
    const p = await this.prisma.pago.findUnique({ where: { referencia: t.reference } });
    if (!p || p.estado !== 'PENDIENTE') return { ok: true };
    if (Math.round(num(p.valor) * 100) !== Number(t.amount_in_cents)) throw new BadRequestException('El monto no coincide');
    if (t.status === 'APPROVED') {
      await this.prisma.$transaction((tx) => this.confirmarEnTx(tx, p.copropiedadId, p.id));
      await this.auditoria.registrar({ copropiedadId: p.copropiedadId, accion: 'CONFIRMAR_WOMPI', entidad: 'Pago', entidadId: p.id, detalle: { transaccion: t.id } });
    } else if (['DECLINED', 'VOIDED', 'ERROR'].includes(t.status)) {
      await this.prisma.pago.update({ where: { id: p.id }, data: { estado: 'RECHAZADO' } });
    }
    return { ok: true };
  }
}

@ApiTags('Pagos')
@ApiBearerAuth()
@Controller('copropiedades/:copId/pagos')
export class PagosController {
  constructor(private readonly svc: PagosService, private readonly unidades: UnidadesService) {}

  private async verificarUnidad(copId: string, unidadId: string, u: UsuarioActual) {
    const acceso = await this.unidades.unidadesDe(copId, u);
    if (acceso !== 'todas' && !acceso.includes(unidadId)) throw new ForbiddenException('No tienes acceso a esta unidad');
  }

  @Get()
  @Roles(...FINANZAS, 'CONSEJO', 'REVISOR_FISCAL')
  listar(@Param('copId') copId: string, @Query('estado') estado?: EstadoPago) {
    return this.svc.listar(copId, estado);
  }

  @Post()
  @Roles(...FINANZAS)
  registrar(@Param('copId') copId: string, @Actual() u: UsuarioActual, @Body() dto: RegistrarPagoDto) {
    return this.svc.registrar(copId, u.id, dto);
  }

  @Post('reportar')
  @UseInterceptors(FileInterceptor('soporte', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async reportar(@Param('copId') copId: string, @Actual() u: UsuarioActual, @Body() dto: ReportarPagoDto, @UploadedFile() soporte?: Express.Multer.File) {
    await this.verificarUnidad(copId, dto.unidadId, u);
    return this.svc.reportar(copId, u.id, dto, soporte);
  }

  @Post('checkout/:unidadId')
  async checkout(@Param('copId') copId: string, @Param('unidadId') unidadId: string, @Actual() u: UsuarioActual) {
    await this.verificarUnidad(copId, unidadId, u);
    return this.svc.checkout(copId, unidadId, u.id);
  }

  @Post(':id/confirmar')
  @Roles(...FINANZAS)
  confirmar(@Param('copId') copId: string, @Param('id') id: string, @Actual() u: UsuarioActual) {
    return this.svc.confirmar(copId, id, u.id);
  }

  @Post(':id/rechazar')
  @Roles(...FINANZAS)
  rechazar(@Param('copId') copId: string, @Param('id') id: string, @Actual() u: UsuarioActual) {
    return this.svc.rechazar(copId, id, u.id);
  }

  @Post(':id/anular')
  @Roles('ADMINISTRADOR', 'CONTADOR')
  anular(@Param('copId') copId: string, @Param('id') id: string, @Actual() u: UsuarioActual, @Body('motivo') motivo: string) {
    if (!motivo) throw new BadRequestException('Indica el motivo de la anulación');
    return this.svc.anular(copId, id, u.id, motivo);
  }
}

@ApiTags('Pagos')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly svc: PagosService) {}

  @Public()
  @Post('wompi')
  @HttpCode(200)
  wompi(@Body() evento: any) {
    return this.svc.eventoWompi(evento);
  }
}
