-- CreateEnum
CREATE TYPE "TipoOperacion" AS ENUM (
    'PRE_INSCRIPCION',
    'APROBACION',
    'RETIRO',
    'ELIMINACION_MANUAL',
    'ELIMINACION_AUTOMATICA'
);

ALTER TABLE "bitacora"
ALTER COLUMN "tipo_operacion" TYPE "TipoOperacion"
USING "tipo_operacion"::"TipoOperacion";
