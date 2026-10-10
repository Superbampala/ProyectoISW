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
