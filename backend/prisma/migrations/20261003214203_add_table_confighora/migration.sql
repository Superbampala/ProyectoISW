/*
  Warnings:

  - Changed the type of `tipo_operacion` on the `bitacora` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `hora_limite` to the `objetos` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoOperacion" AS ENUM ('PRE_INSCRIPCION', 'APROBACION', 'RETIRO', 'ELIMINACION_MANUAL', 'ELIMINACION_AUTOMATICA');

-- AlterTable
ALTER TABLE "bitacora" DROP COLUMN "tipo_operacion",
ADD COLUMN     "tipo_operacion" "TipoOperacion" NOT NULL;

-- AlterTable
ALTER TABLE "objetos" ADD COLUMN     "hora_limite" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "ConfiguracionHora" (
    "id" SERIAL NOT NULL,
    "hora_limite" INTEGER NOT NULL,
    "fecha_cambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por_id" INTEGER NOT NULL,

    CONSTRAINT "ConfiguracionHora_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ConfiguracionHora" ADD CONSTRAINT "ConfiguracionHora_actualizado_por_id_fkey" FOREIGN KEY ("actualizado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
