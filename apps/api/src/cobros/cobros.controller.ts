import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { Actual, FINANZAS, LECTURA_FINANCIERA, Public, Roles, UsuarioActual } from '../common/decorators';
import { UnidadesService } from '../unidades/unidades';
import { CobrosService } from './cobros.service';

const PERIODO = /^\d{4}-(0[1-9]|1[0-2])$/;

export class PresupuestoDto {
  @IsInt() @Min(2000) @Max(2100) anio: number;
  @IsNumber() @Min(0) totalAnual: number;
  @IsNumber() @Min(1) @Max(100) fondoImprevistosPct: number;
  @IsOptional() @IsString() actaAprobacion?: string;
}

export class PeriodoDto {
  @Matches(PERIODO, { message: 'El periodo debe tener formato AAAA-MM' }) periodo: string;
}

export class CargoManualDto {
  @IsString() conceptoId: string;
  @IsString() descripcion: string;
  @IsNumber() @Min(1) valor: number;
  @Matches(PERIODO, { message: 'El periodo debe tener formato AAAA-MM' }) periodo: string;
  @IsOptional() @IsString() unidadId?: string;
  @IsOptional() @IsBoolean() todasPorCoeficiente?: boolean;
  @IsOptional() @IsString() vencimiento?: string;
}

export class AnularDto {
  @IsString() motivo: string;
}

export class ConceptoDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsBoolean() gravadoIva?: boolean;
  @IsOptional() @IsNumber() @Min(0) @Max(100) ivaPct?: number;
  @IsOptional() @IsBoolean() activo?: boolean;
}

export class TasaDto {
  @Matches(PERIODO) periodo: string;
  /** Interés bancario corriente efectivo anual en fracción: 0.1734 = 17,34 % */
  @IsNumber() ibcEfectivaAnual: number;
}

@ApiTags('Cobros y cartera')
@ApiBearerAuth()
@Controller('copropiedades/:copId/cobros')
export class CobrosController {
  constructor(private readonly svc: CobrosService, private readonly unidades: UnidadesService) {}

  private async puedeVerUnidad(copId: string, unidadId: string, u: UsuarioActual) {
    const acceso = await this.unidades.unidadesDe(copId, u);
    if (acceso !== 'todas' && !acceso.includes(unidadId)) throw new ForbiddenException('No tienes acceso a esta unidad');
  }

  @Get('presupuestos')
  @Roles(...LECTURA_FINANCIERA)
  presupuestos(@Param('copId') copId: string) {
    return this.svc.presupuestos(copId);
  }

  @Put('presupuestos')
  @Roles('ADMINISTRADOR', 'CONTADOR')
  guardarPresupuesto(@Param('copId') copId: string, @Actual() u: UsuarioActual, @Body() dto: PresupuestoDto) {
    return this.svc.guardarPresupuesto(copId, u.id, dto);
  }

  @Get('conceptos')
  @Roles(...LECTURA_FINANCIERA)
  conceptos(@Param('copId') copId: string) {
    return this.svc.conceptos(copId);
  }

  @Patch('conceptos/:id')
  @Roles('ADMINISTRADOR', 'CONTADOR')
  concepto(@Param('copId') copId: string, @Param('id') id: string, @Body() dto: ConceptoDto) {
    return this.svc.actualizarConcepto(copId, id, dto);
  }

  @Post('liquidar')
  @Roles(...FINANZAS)
  liquidar(@Param('copId') copId: string, @Actual() u: UsuarioActual, @Body() dto: PeriodoDto) {
    return this.svc.liquidar(copId, dto.periodo, u.id);
  }

  @Post('intereses')
  @Roles(...FINANZAS)
  intereses(@Param('copId') copId: string, @Actual() u: UsuarioActual, @Body() dto: PeriodoDto) {
    return this.svc.generarIntereses(copId, dto.periodo, u.id);
  }

  @Post('cargos')
  @Roles(...FINANZAS)
  cargo(@Param('copId') copId: string, @Actual() u: UsuarioActual, @Body() dto: CargoManualDto) {
    return this.svc.cargoManual(copId, u.id, dto);
  }

  @Post('cargos/:id/anular')
  @Roles('ADMINISTRADOR', 'CONTADOR')
  anular(@Param('copId') copId: string, @Param('id') id: string, @Actual() u: UsuarioActual, @Body() dto: AnularDto) {
    return this.svc.anularCargo(copId, id, u.id, dto.motivo);
  }

  @Get('cartera')
  @Roles(...LECTURA_FINANCIERA)
  cartera(@Param('copId') copId: string) {
    return this.svc.cartera(copId);
  }

  @Get('estado-cuenta/:unidadId')
  async estado(@Param('copId') copId: string, @Param('unidadId') unidadId: string, @Actual() u: UsuarioActual) {
    await this.puedeVerUnidad(copId, unidadId, u);
    return this.svc.estadoCuenta(copId, unidadId);
  }

  @Get('certificado/:unidadId')
  async certificado(@Param('copId') copId: string, @Param('unidadId') unidadId: string, @Actual() u: UsuarioActual) {
    await this.puedeVerUnidad(copId, unidadId, u);
    return this.svc.certificado(copId, unidadId);
  }
}

@ApiTags('Cobros y cartera')
@ApiBearerAuth()
@Controller('tasas-interes')
export class TasasController {
  constructor(private readonly svc: CobrosService) {}

  @Public()
  @Get()
  listar() {
    return this.svc.tasas();
  }

  @Put()
  guardar(@Actual() u: UsuarioActual, @Body() dto: TasaDto) {
    if (!u.esSuperAdmin) throw new ForbiddenException('Solo el equipo de la plataforma actualiza la tasa certificada');
    return this.svc.guardarTasa(dto.periodo, dto.ibcEfectivaAnual);
  }
}
