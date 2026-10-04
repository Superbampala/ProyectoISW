/*
  Warnings:

  - A unique constraint covering the columns `[token_verificacion]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "expiracion_token" TIMESTAMP(3),
ADD COLUMN     "habilitado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "token_verificacion" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_token_verificacion_key" ON "usuarios"("token_verificacion");
