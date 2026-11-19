-- AlterTable
ALTER TABLE "usuarios"
ADD COLUMN IF NOT EXISTS "version_sesion" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "usuarios"
ADD COLUMN IF NOT EXISTS "token_recuperacion" TEXT,
ADD COLUMN IF NOT EXISTS "expiracion_recuperacion" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_token_recuperacion_key"
ON "usuarios"("token_recuperacion");
