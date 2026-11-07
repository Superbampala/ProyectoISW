-- preserva la referencia al objeto en la bitacora cuando se elimina el objeto
ALTER TABLE "bitacora"
ADD COLUMN "objeto_id_historico" INTEGER;

UPDATE "bitacora"
SET "objeto_id_historico" = "objetoId";

ALTER TABLE "bitacora"
ALTER COLUMN "objeto_id_historico" SET NOT NULL;

ALTER TABLE "bitacora"
DROP CONSTRAINT "bitacora_objetoId_fkey";

ALTER TABLE "bitacora"
ALTER COLUMN "objetoId" DROP NOT NULL;

ALTER TABLE "bitacora"
ADD CONSTRAINT "bitacora_objetoId_fkey"
FOREIGN KEY ("objetoId") REFERENCES "objetos"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
