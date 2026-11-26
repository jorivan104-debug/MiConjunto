import { Body, Controller, Get, Injectable, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TipoCopropiedad } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Actual, GESTION, LECTURA_FINANCIERA, Roles, UsuarioActual } from '../common/decorators';
import { AuditoriaService } from '../common/auditoria.service';
import { num, periodoActual } from '../common/util';
import { CONCEPTOS_BASE, PLAN_BASE } from '../contabilidad/plan-base';
import { PrismaService } from '../prisma/prisma.service';

export class CrearCopropiedadDto {
  @IsString() nit: string;
  @IsString() nombre: string;
  @IsOptional() @IsEnum(TipoCopropiedad) tipo?: TipoCopropiedad;
  @IsOptional() @IsString() direccion?: string;
  @IsOptional() @IsString() ciudad?: string;
  @IsOptional() @IsBoolean() responsableIva?: boolean;
}

export class ActualizarCopropiedadDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsEnum(TipoCopropiedad) tipo?: TipoCopropiedad;
  @IsOptional() @IsString() direccion?: string;
  @IsOptional() @IsString() ciudad?: string;
  @IsOptional() @IsBoolean() responsableIva?: boolean;
  /** Tasa mensual en fracción (0.015 = 1,5 %). null = tope legal. */
  @IsOptional() @IsNumber() @Min(0) @Max(0.1) tasaMoraMensual?: number | null;
  @IsOptional() @IsInt() @Min(1) @Max(28) diaVencimiento?: number;
}

@Injectable()
export class CopropiedadesService {
  constructor(private readonly prisma: PrismaService, private readonly auditoria: AuditoriaService) {}

  /** Crea la copropiedad con su plan de cuentas y conceptos base; quien la crea queda como administrador. */
  async crear(usuarioId: string, dto: CrearCopropiedadDto) {
    return this.prisma.$transaction(async (tx) => {
      const c = await tx.copropiedad.create({ data: dto });
      await tx.membresia.create({ data: { usuarioId, copropiedadId: c.id, rol: 'ADMINISTRADOR' } });
      await tx.cuentaContable.createMany({ data: PLAN_BASE.map((p) => ({ ...p, copropiedadId: c.id })) });
      await tx.conceptoCobro.createMany({
        data: CONCEPTOS_BASE.map((k) => ({
          copropiedadId: c.id,
          nombre: k.nombre,
          tipo: k.tipo,
          cuentaIngreso: k.cuentaIngreso,
          gravadoIva: !!k.gravadoIva && !!dto.responsableIva,
          ivaPct: k.gravadoIva && dto.responsableIva ? 19 : 0,
        })),
      });
      await this.auditoria.registrar({ tx, copropiedadId: c.id, usuarioId, accion: 'CREAR', entidad: 'Copropiedad', entidadId: c.id });
      return c;
    });
  }

  obtener(id: string) {
    return this.prisma.copropiedad.findUniqueOrThrow({ where: { id } });
  }

  async actualizar(id: string, usuarioId: string, dto: ActualizarCopropiedadDto) {
    const c = await this.prisma.copropiedad.update({ where: { id }, data: dto });
    if (dto.responsableIva !== undefined) {
      // El alquiler de zonas comunes se grava con IVA solo si la copropiedad es responsable (DIAN, Comunicado 019 de 2025)
      await this.prisma.conceptoCobro.updateMany({
        where: { copropiedadId: id, tipo: 'RESERVA' },
        data: { gravadoIva: dto.responsableIva, ivaPct: dto.responsableIva ? 19 : 0 },
      });
    }
    await this.auditoria.registrar({ copropiedadId: id, usuarioId, accion: 'ACTUALIZAR', entidad: 'Copropiedad', entidadId: id, detalle: dto as object });
    return c;
  }

  /** Indicadores del tablero del administrador. */
  async tablero(id: string) {
    const periodo = periodoActual();
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const ahora = new Date();
    const [unidades, cartera, vencida, recaudo, pqrsAbiertas, reservasPend, pagosPend, facturadoMes] = await Promise.all([
      this.prisma.unidad.count({ where: { copropiedadId: id } }),
      this.prisma.cargo.aggregate({ where: { copropiedadId: id, estado: 'PENDIENTE' }, _sum: { saldo: true } }),
      this.prisma.cargo.aggregate({ where: { copropiedadId: id, estado: 'PENDIENTE', vencimiento: { lt: ahora } }, _sum: { saldo: true } }),
      this.prisma.pago.aggregate({ where: { copropiedadId: id, estado: 'CONFIRMADO', fecha: { gte: inicioMes } }, _sum: { valor: true } }),
      this.prisma.pqrs.count({ where: { copropiedadId: id, estado: { in: ['RADICADA', 'EN_PROCESO'] } } }),
      this.prisma.reserva.count({ where: { zona: { copropiedadId: id }, estado: 'PENDIENTE' } }),
      this.prisma.pago.count({ where: { copropiedadId: id, estado: 'PENDIENTE' } }),
      this.prisma.cargo.aggregate({ where: { copropiedadId: id, periodo, estado: { not: 'ANULADO' } }, _sum: { valor: true, iva: true } }),
    ]);
    const unidadesEnMora = await this.prisma.cargo.groupBy({
      by: ['unidadId'],
      where: { copropiedadId: id, estado: 'PENDIENTE', vencimiento: { lt: ahora } },
    });
    return {
      periodo,
      unidades,
      carteraTotal: num(cartera._sum.saldo),
      carteraVencida: num(vencida._sum.saldo),
      unidadesEnMora: unidadesEnMora.length,
      recaudoMes: num(recaudo._sum.valor),
      facturadoMes: num(facturadoMes._sum.valor) + num(facturadoMes._sum.iva),
      pqrsAbiertas,
      reservasPendientes: reservasPend,
      pagosPorConfirmar: pagosPend,
    };
  }
}

@ApiTags('Copropiedades')
@ApiBearerAuth()
@Controller('copropiedades')
export class CopropiedadesController {
  constructor(private readonly svc: CopropiedadesService) {}

  @Post()
  crear(@Actual() u: UsuarioActual, @Body() dto: CrearCopropiedadDto) {
    return this.svc.crear(u.id, dto);
  }

  @Get(':copId')
  obtener(@Param('copId') copId: string) {
    return this.svc.obtener(copId);
  }

  @Patch(':copId')
  @Roles('ADMINISTRADOR')
  actualizar(@Param('copId') copId: string, @Actual() u: UsuarioActual, @Body() dto: ActualizarCopropiedadDto) {
    return this.svc.actualizar(copId, u.id, dto);
  }

  @Get(':copId/tablero')
  @Roles(...GESTION, ...LECTURA_FINANCIERA)
  tablero(@Param('copId') copId: string) {
    return this.svc.tablero(copId);
  }
}
