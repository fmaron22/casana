-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "identity";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "onboarding";

-- CreateEnum
CREATE TYPE "identity"."EstadoOnboarding" AS ENUM ('INICIADO', 'DATOS_COMPLETOS', 'METODO_PAGO_OK', 'ACTIVO');

-- CreateEnum
CREATE TYPE "onboarding"."EstadoTrabajador" AS ENUM ('BORRADOR', 'EXPEDIENTE_COMPLETO', 'ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "onboarding"."ModalidadCotizacion" AS ENUM ('MES_COMPLETO', 'POR_DIA');

-- CreateEnum
CREATE TYPE "onboarding"."TipoDocumento" AS ENUM ('INE', 'CURP', 'COMPROBANTE_DOMICILIO', 'FOTO_BIOMETRICA', 'CONTRATO', 'OTRO');

-- CreateTable
CREATE TABLE "identity"."Patron" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "rfc" TEXT,
    "curp" TEXT,
    "domicilio" JSONB,
    "stripeCustomerId" TEXT,
    "estadoOnboarding" "identity"."EstadoOnboarding" NOT NULL DEFAULT 'INICIADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patron_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding"."Trabajador" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "curp" TEXT,
    "nss" TEXT,
    "fotoUrl" TEXT,
    "clabe" TEXT,
    "domicilio" JSONB,
    "estado" "onboarding"."EstadoTrabajador" NOT NULL DEFAULT 'BORRADOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trabajador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding"."RelacionLaboral" (
    "id" UUID NOT NULL,
    "patronId" UUID NOT NULL,
    "trabajadorId" UUID NOT NULL,
    "lugarTrabajo" TEXT,
    "puesto" TEXT,
    "modalidad" "onboarding"."ModalidadCotizacion" NOT NULL DEFAULT 'MES_COMPLETO',
    "diasSemana" INTEGER,
    "salarioDiario" INTEGER NOT NULL,
    "jornadaHoras" INTEGER,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelacionLaboral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding"."Documento" (
    "id" UUID NOT NULL,
    "tipo" "onboarding"."TipoDocumento" NOT NULL,
    "url" TEXT NOT NULL,
    "patronId" UUID,
    "trabajadorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patron_email_key" ON "identity"."Patron"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Patron_stripeCustomerId_key" ON "identity"."Patron"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Trabajador_curp_key" ON "onboarding"."Trabajador"("curp");

-- CreateIndex
CREATE INDEX "RelacionLaboral_patronId_idx" ON "onboarding"."RelacionLaboral"("patronId");

-- CreateIndex
CREATE INDEX "RelacionLaboral_trabajadorId_idx" ON "onboarding"."RelacionLaboral"("trabajadorId");

-- CreateIndex
CREATE INDEX "Documento_patronId_idx" ON "onboarding"."Documento"("patronId");

-- CreateIndex
CREATE INDEX "Documento_trabajadorId_idx" ON "onboarding"."Documento"("trabajadorId");

-- AddForeignKey
ALTER TABLE "onboarding"."RelacionLaboral" ADD CONSTRAINT "RelacionLaboral_patronId_fkey" FOREIGN KEY ("patronId") REFERENCES "identity"."Patron"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding"."RelacionLaboral" ADD CONSTRAINT "RelacionLaboral_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "onboarding"."Trabajador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding"."Documento" ADD CONSTRAINT "Documento_patronId_fkey" FOREIGN KEY ("patronId") REFERENCES "identity"."Patron"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding"."Documento" ADD CONSTRAINT "Documento_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "onboarding"."Trabajador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
