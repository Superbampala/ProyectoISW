-- AlterTable
ALTER TABLE "fotos" DROP CONSTRAINT "fotos_objetoId_fkey";

ALTER TABLE "fotos"
ADD CONSTRAINT "fotos_objetoId_fkey"
FOREIGN KEY ("objetoId") REFERENCES "objetos"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "bitacora" DROP CONSTRAINT "bitacora_objetoId_fkey";

ALTER TABLE "bitacora"
ADD CONSTRAINT "bitacora_objetoId_fkey"
FOREIGN KEY ("objetoId") REFERENCES "objetos"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
