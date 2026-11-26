import { Global, Injectable, Module } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Registro inmutable de acciones sensibles, para el revisor fiscal y la Ley 1581. */
@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  registrar(params: {
    copropiedadId?: string;
    usuarioId?: string;
    accion: string;
    entidad: string;
    entidadId?: string;
    detalle?: Prisma.InputJsonValue;
    tx?: Prisma.TransactionClient;
  }) {
    const { tx, ...data } = params;
    return (tx ?? this.prisma).auditoria.create({ data });
  }
}

@Global()
@Module({ providers: [AuditoriaService], exports: [AuditoriaService] })
export class AuditoriaModule {}
