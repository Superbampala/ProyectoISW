CREATE TABLE "registros_preinscripcion" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "objeto_id" INTEGER,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_preinscripcion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "registros_preinscripcion_usuario_id_fecha_registro_idx"
ON "registros_preinscripcion"("usuario_id", "fecha_registro");

ALTER TABLE "registros_preinscripcion"
ADD CONSTRAINT "registros_preinscripcion_usuario_id_fkey"
FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "registros_preinscripcion"
ADD CONSTRAINT "registros_preinscripcion_objeto_id_fkey"
FOREIGN KEY ("objeto_id") REFERENCES "objetos"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
