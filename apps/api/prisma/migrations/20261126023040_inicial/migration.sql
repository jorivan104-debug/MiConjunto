-- CreateEnum
CREATE TYPE "TipoCopropiedad" AS ENUM ('RESIDENCIAL', 'COMERCIAL', 'MIXTA');

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMINISTRADOR', 'ASISTENTE', 'CONTADOR', 'CONSEJO', 'REVISOR_FISCAL', 'PROPIETARIO', 'RESIDENTE', 'PORTERIA');

-- CreateEnum
CREATE TYPE "TipoUnidad" AS ENUM ('APARTAMENTO', 'CASA', 'LOCAL', 'OFICINA', 'PARQUEADERO', 'DEPOSITO');

-- CreateEnum
CREATE TYPE "VinculoUnidad" AS ENUM ('PROPIETARIO', 'RESIDENTE', 'ARRENDATARIO');

-- CreateEnum
CREATE TYPE "TipoConcepto" AS ENUM ('ORDINARIA', 'FONDO_IMPREVISTOS', 'EXTRAORDINARIA', 'MULTA', 'RESERVA', 'INTERES_MORA', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoCargo" AS ENUM ('PENDIENTE', 'PAGADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "MedioPago" AS ENUM ('PSE', 'TARJETA', 'CONSIGNACION', 'TRANSFERENCIA', 'EFECTIVO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'RECHAZADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "Naturaleza" AS ENUM ('DEBITO', 'CREDITO');

-- CreateEnum
CREATE TYPE "OrigenAsiento" AS ENUM ('CARGO', 'PAGO', 'ANULACION', 'MANUAL');

-- CreateEnum
CREATE TYPE "TipoPqrs" AS ENUM ('PETICION', 'QUEJA', 'RECLAMO', 'SUGERENCIA', 'DANO');

-- CreateEnum
CREATE TYPE "EstadoPqrs" AS ENUM ('RADICADA', 'EN_PROCESO', 'RESUELTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "Visibilidad" AS ENUM ('TODOS', 'CONSEJO', 'ADMINISTRACION');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "celular" TEXT,
    "tipoDocumento" TEXT,
    "numeroDocumento" TEXT,
    "esSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "debeCambiarPassword" BOOLEAN NOT NULL DEFAULT false,
    "autorizacionDatosAt" TIMESTAMP(3),
    "autorizacionVersion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Copropiedad" (
    "id" TEXT NOT NULL,
    "nit" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoCopropiedad" NOT NULL DEFAULT 'RESIDENCIAL',
    "direccion" TEXT,
    "ciudad" TEXT,
    "responsableIva" BOOLEAN NOT NULL DEFAULT false,
    "tasaMoraMensual" DECIMAL(8,6),
    "diaVencimiento" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Copropiedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membresia" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "copropiedadId" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membresia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Torre" (
    "id" TEXT NOT NULL,
    "copropiedadId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Torre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unidad" (
    "id" TEXT NOT NULL,
    "copropiedadId" TEXT NOT NULL,
    "torreId" TEXT,
    "tipo" "TipoUnidad" NOT NULL DEFAULT 'APARTAMENTO',
    "numero" TEXT NOT NULL,
    "areaPrivada" DECIMAL(10,2),
    "coeficiente" DECIMAL(12,10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnidadPersona" (
    "id" TEXT NOT NULL,
    "unidadId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "vinculo" "VinculoUnidad" NOT NULL,
    "responsablePago" BOOLEAN NOT NULL DEFAULT false,
    "desde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hasta" TIMESTAMP(3),

    CONSTRAINT "UnidadPersona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presupuesto" (
    "id" TEXT NOT NULL,
    "copropiedadId" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "totalAnual" DECIMAL(16,2) NOT NULL,
    "fondoImprevistosPct" DECIMAL(5,2) NOT NULL DEFAULT 1,
    "actaAprobacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Presupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptoCobro" (
    "id" TEXT NOT NULL,
    "copropiedadId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoConcepto" NOT NULL,
    "gravadoIva" BOOLEAN NOT NULL DEFAULT false,
    "ivaPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "cuentaIngreso" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ConceptoCobro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cargo" (
    "id" TEXT NOT NULL,
    "copropiedadId" TEXT NOT NULL,
    "unidadId" TEXT NOT NULL,
    "conceptoId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "valor" DECIMAL(16,2) NOT NULL,
    "iva" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "saldo" DECIMAL(16,2) NOT NULL,
    "vencimiento" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoCargo" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "copropiedadId" TEXT NOT NULL,
    "unidadId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor" DECIMAL(16,2) NOT NULL,
    "saldoAFavor" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "medio" "MedioPago" NOT NULL,
    "referencia" TEXT,
    "soporteUrl" TEXT,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "registradoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AplicacionPago" (
    "id" TEXT NOT NULL,
    "pagoId" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    "valor" DECIMAL(16,2) NOT NULL,

    CONSTRAINT "AplicacionPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TasaInteres" (
    "periodo" TEXT NOT NULL,
    "ibcEfectivaAnual" DECIMAL(8,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TasaInteres_pkey" PRIMARY KEY ("periodo")
);

-- CreateTable
CREATE TABLE "CuentaContable" (
    "id" TEXT NOT NULL,
    "copropiedadId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "naturaleza" "Naturaleza" NOT NULL,

    CONSTRAINT "CuentaContable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asiento" (
    "id" TEXT NOT NULL,
    "copropiedadId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT NOT NULL,
    "origen" "OrigenAsiento" NOT NULL,
    "origenId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineaAsiento" (
    "id" TEXT NOT NULL,
    "asientoId" TEXT NOT NULL,
    "cuentaCodigo" TEXT NOT NULL,
    "unidadId" TEXT,
    "debito" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "credito" DECIMAL(16,2) NOT NULL DEFAULT 0,

    CONSTRAINT "LineaAsiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comunicado" (
    "id" TEXT NOT NULL,
    "copropiedadId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comunicado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LecturaComunicado" (
    "id" TEXT NOT NULL,
    "comunicadoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "leidoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LecturaComunicado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pqrs" (
    "id" TEXT NOT NULL,
    "copropiedadId" TEXT NOT NULL,
    "radicado" INTEGER NOT NULL,
    "tipo" "TipoPqrs" NOT NULL,
    "asunto" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" "EstadoPqrs" NOT NULL DEFAULT 'RADICADA',
    "unidadId" TEXT,
    "autorId" TEXT NOT NULL,
    "asignadoId" TEXT,
    "respuesta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resueltaAt" TIMESTAMP(3),

    CONSTRAINT "Pqrs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PqrsComentario" (
    "id" TEXT NOT NULL,
    "pqrsId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PqrsComentario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZonaComun" (
    "id" TEXT NOT NULL,
    "copropiedadId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "capacidad" INTEGER,
    "horaApertura" TEXT NOT NULL DEFAULT '08:00',
    "horaCierre" TEXT NOT NULL DEFAULT '22:00',
    "maxHoras" INTEGER NOT NULL DEFAULT 4,
    "tarifa" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "requiereAprobacion" BOOLEAN NOT NULL DEFAULT true,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ZonaComun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "zonaId" TEXT NOT NULL,
    "unidadId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'PENDIENTE',
    "nota" TEXT,
    "cargoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "copropiedadId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'General',
    "archivo" TEXT NOT NULL,
    "mimeType" TEXT,
    "visibilidad" "Visibilidad" NOT NULL DEFAULT 'TODOS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL,
    "copropiedadId" TEXT,
    "usuarioId" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "detalle" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Copropiedad_nit_key" ON "Copropiedad"("nit");

-- CreateIndex
CREATE UNIQUE INDEX "Membresia_usuarioId_copropiedadId_rol_key" ON "Membresia"("usuarioId", "copropiedadId", "rol");

-- CreateIndex
CREATE UNIQUE INDEX "Torre_copropiedadId_nombre_key" ON "Torre"("copropiedadId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Unidad_copropiedadId_torreId_numero_key" ON "Unidad"("copropiedadId", "torreId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "UnidadPersona_unidadId_usuarioId_vinculo_key" ON "UnidadPersona"("unidadId", "usuarioId", "vinculo");

-- CreateIndex
CREATE UNIQUE INDEX "Presupuesto_copropiedadId_anio_key" ON "Presupuesto"("copropiedadId", "anio");

-- CreateIndex
CREATE UNIQUE INDEX "ConceptoCobro_copropiedadId_tipo_nombre_key" ON "ConceptoCobro"("copropiedadId", "tipo", "nombre");

-- CreateIndex
CREATE INDEX "Cargo_copropiedadId_periodo_idx" ON "Cargo"("copropiedadId", "periodo");

-- CreateIndex
CREATE INDEX "Cargo_unidadId_estado_idx" ON "Cargo"("unidadId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_referencia_key" ON "Pago"("referencia");

-- CreateIndex
CREATE UNIQUE INDEX "CuentaContable_copropiedadId_codigo_key" ON "CuentaContable"("copropiedadId", "codigo");

-- CreateIndex
CREATE INDEX "Asiento_copropiedadId_origen_origenId_idx" ON "Asiento"("copropiedadId", "origen", "origenId");

-- CreateIndex
CREATE UNIQUE INDEX "Asiento_copropiedadId_numero_key" ON "Asiento"("copropiedadId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "LecturaComunicado_comunicadoId_usuarioId_key" ON "LecturaComunicado"("comunicadoId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Pqrs_copropiedadId_radicado_key" ON "Pqrs"("copropiedadId", "radicado");

-- CreateIndex
CREATE UNIQUE INDEX "Reserva_cargoId_key" ON "Reserva"("cargoId");

-- CreateIndex
CREATE INDEX "Reserva_zonaId_inicio_idx" ON "Reserva"("zonaId", "inicio");

-- CreateIndex
CREATE INDEX "Auditoria_copropiedadId_createdAt_idx" ON "Auditoria"("copropiedadId", "createdAt");

-- AddForeignKey
ALTER TABLE "Membresia" ADD CONSTRAINT "Membresia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membresia" ADD CONSTRAINT "Membresia_copropiedadId_fkey" FOREIGN KEY ("copropiedadId") REFERENCES "Copropiedad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Torre" ADD CONSTRAINT "Torre_copropiedadId_fkey" FOREIGN KEY ("copropiedadId") REFERENCES "Copropiedad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unidad" ADD CONSTRAINT "Unidad_copropiedadId_fkey" FOREIGN KEY ("copropiedadId") REFERENCES "Copropiedad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unidad" ADD CONSTRAINT "Unidad_torreId_fkey" FOREIGN KEY ("torreId") REFERENCES "Torre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnidadPersona" ADD CONSTRAINT "UnidadPersona_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "Unidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnidadPersona" ADD CONSTRAINT "UnidadPersona_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_copropiedadId_fkey" FOREIGN KEY ("copropiedadId") REFERENCES "Copropiedad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptoCobro" ADD CONSTRAINT "ConceptoCobro_copropiedadId_fkey" FOREIGN KEY ("copropiedadId") REFERENCES "Copropiedad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_copropiedadId_fkey" FOREIGN KEY ("copropiedadId") REFERENCES "Copropiedad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "Unidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_conceptoId_fkey" FOREIGN KEY ("conceptoId") REFERENCES "ConceptoCobro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_copropiedadId_fkey" FOREIGN KEY ("copropiedadId") REFERENCES "Copropiedad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "Unidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AplicacionPago" ADD CONSTRAINT "AplicacionPago_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AplicacionPago" ADD CONSTRAINT "AplicacionPago_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaContable" ADD CONSTRAINT "CuentaContable_copropiedadId_fkey" FOREIGN KEY ("copropiedadId") REFERENCES "Copropiedad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asiento" ADD CONSTRAINT "Asiento_copropiedadId_fkey" FOREIGN KEY ("copropiedadId") REFERENCES "Copropiedad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaAsiento" ADD CONSTRAINT "LineaAsiento_asientoId_fkey" FOREIGN KEY ("asientoId") REFERENCES "Asiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comunicado" ADD CONSTRAINT "Comunicado_copropiedadId_fkey" FOREIGN KEY ("copropiedadId") REFERENCES "Copropiedad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comunicado" ADD CONSTRAINT "Comunicado_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LecturaComunicado" ADD CONSTRAINT "LecturaComunicado_comunicadoId_fkey" FOREIGN KEY ("comunicadoId") REFERENCES "Comunicado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LecturaComunicado" ADD CONSTRAINT "LecturaComunicado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pqrs" ADD CONSTRAINT "Pqrs_copropiedadId_fkey" FOREIGN KEY ("copropiedadId") REFERENCES "Copropiedad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pqrs" ADD CONSTRAINT "Pqrs_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "Unidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pqrs" ADD CONSTRAINT "Pqrs_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pqrs" ADD CONSTRAINT "Pqrs_asignadoId_fkey" FOREIGN KEY ("asignadoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PqrsComentario" ADD CONSTRAINT "PqrsComentario_pqrsId_fkey" FOREIGN KEY ("pqrsId") REFERENCES "Pqrs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PqrsComentario" ADD CONSTRAINT "PqrsComentario_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZonaComun" ADD CONSTRAINT "ZonaComun_copropiedadId_fkey" FOREIGN KEY ("copropiedadId") REFERENCES "Copropiedad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "ZonaComun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "Unidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_copropiedadId_fkey" FOREIGN KEY ("copropiedadId") REFERENCES "Copropiedad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_copropiedadId_fkey" FOREIGN KEY ("copropiedadId") REFERENCES "Copropiedad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
