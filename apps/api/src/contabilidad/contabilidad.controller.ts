import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LECTURA_FINANCIERA, Roles } from '../common/decorators';
import { ContabilidadService } from './contabilidad.service';

@ApiTags('Contabilidad')
@ApiBearerAuth()
@Controller('copropiedades/:copId/contabilidad')
@Roles(...LECTURA_FINANCIERA)
export class ContabilidadController {
  constructor(private readonly svc: ContabilidadService) {}

  @Get('cuentas')
  cuentas(@Param('copId') copId: string) {
    return this.svc.cuentas(copId);
  }

  @Get('libro-diario')
  libro(@Param('copId') copId: string, @Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.svc.libroDiario(copId, desde ? new Date(desde) : undefined, hasta ? new Date(hasta) : undefined);
  }

  @Get('balance-prueba')
  balance(@Param('copId') copId: string, @Query('hasta') hasta?: string) {
    return this.svc.balancePrueba(copId, hasta ? new Date(hasta) : undefined);
  }
}
