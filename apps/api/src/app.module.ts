import { Controller, Get, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthController, AuthService } from './auth/auth';
import { CobrosController, TasasController } from './cobros/cobros.controller';
import { CobrosService } from './cobros/cobros.service';
import { AuditoriaModule } from './common/auditoria.service';
import { Public } from './common/decorators';
import { AuthGuard } from './common/guards';
import { ComunicadosController, ComunicadosService } from './comunicados/comunicados';
import { ContabilidadController } from './contabilidad/contabilidad.controller';
import { ContabilidadService } from './contabilidad/contabilidad.service';
import { CopropiedadesController, CopropiedadesService } from './copropiedades/copropiedades';
import { DocumentosController, DocumentosService } from './documentos/documentos';
import { PagosController, PagosService, WebhooksController } from './pagos/pagos';
import { PqrsController, PqrsService } from './pqrs/pqrs';
import { PrismaModule } from './prisma/prisma.service';
import { ReservasController, ReservasService } from './reservas/reservas';
import { UnidadesController, UnidadesService } from './unidades/unidades';
import { UsuariosController, UsuariosService } from './usuarios/usuarios';

@Controller('salud')
class SaludController {
  @Public()
  @Get()
  salud() {
    return { ok: true, servicio: 'mi-conjunto-api' };
  }
}

@Module({
  imports: [
    PrismaModule,
    AuditoriaModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'desarrollo-no-usar-en-produccion',
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [
    SaludController, AuthController, CopropiedadesController, UnidadesController, UsuariosController,
    CobrosController, TasasController, PagosController, WebhooksController, ContabilidadController,
    ComunicadosController, PqrsController, ReservasController, DocumentosController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    AuthService, CopropiedadesService, UnidadesService, UsuariosService, CobrosService, PagosService,
    ContabilidadService, ComunicadosService, PqrsService, ReservasService, DocumentosService,
  ],
})
export class AppModule {}
