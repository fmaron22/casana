-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "imss";

-- CreateEnum
CREATE TYPE "imss"."EstadoLineaCaptura" AS ENUM ('RECIBIDA', 'REQUIERE_REVISION', 'DISCREPANCIA', 'PAGADA', 'VENCIDA');

-- CreateTable
CREATE TABLE "imss"."LineaCaptura" (
    "id" UUID NOT NULL,
    "patronId" UUID,
    "trabajadorId" UUID,
    "periodo" TEXT,
    "lineaCaptura" TEXT,
    "importeCentavos" INTEGER,
    "vigencia" TEXT,
    "urlPdf" TEXT,
    "destinatario" TEXT,
    "importeCalculadoCentavos" INTEGER,
    "estado" "imss"."EstadoLineaCaptura" NOT NULL DEFAULT 'RECIBIDA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineaCaptura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LineaCaptura_lineaCaptura_key" ON "imss"."LineaCaptura"("lineaCaptura");

-- CreateIndex
CREATE INDEX "LineaCaptura_patronId_idx" ON "imss"."LineaCaptura"("patronId");

-- CreateIndex
CREATE INDEX "LineaCaptura_periodo_idx" ON "imss"."LineaCaptura"("periodo");

