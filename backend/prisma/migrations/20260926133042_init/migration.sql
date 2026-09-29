-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('USUARIO_UBB', 'ADMIN_PUNTO', 'ADMIN_SISTEMA');

-- CreateEnum
CREATE TYPE "Categoria" AS ENUM ('DOCUMENTOS_Y_TARJETAS', 'ELECTRONICA', 'ROPA_Y_ACCESORIOS', 'LLAVES', 'UTILES_Y_MATERIAL_ESTUDIO', 'OTROS');

-- CreateEnum
CREATE TYPE "EstadoObjeto" AS ENUM ('PENDIENTE', 'APROBADO', 'ENTREGADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puntos_entrega" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,

    CONSTRAINT "puntos_entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objetos" (
    "id" SERIAL NOT NULL,
    "categoria" "Categoria" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "lugar_hallazgo" TEXT NOT NULL,
    "estado" "EstadoObjeto" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "titular_rut" TEXT,
    "titular_nombre" TEXT,
    "puntoId" INTEGER NOT NULL,
    "usuarioHalladorId" INTEGER NOT NULL,

    CONSTRAINT "objetos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retiros" (
    "id" SERIAL NOT NULL,
    "fecha_retiro" TIMESTAMP(3) NOT NULL,
    "rut_retiro" TEXT NOT NULL,
    "objetoId" INTEGER NOT NULL,
    "adminEntregaId" INTEGER NOT NULL,
    "usuarioRetiradorId" INTEGER,

    CONSTRAINT "retiros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_punto_asignacion" (
    "usuarioId" INTEGER NOT NULL,
    "puntoId" INTEGER NOT NULL,

    CONSTRAINT "admin_punto_asignacion_pkey" PRIMARY KEY ("usuarioId", "puntoId")
);

-- CreateTable
CREATE TABLE "fotos" (
    "id" SERIAL NOT NULL,
    "url_archivo" TEXT NOT NULL,
    "fecha_subida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "objetoId" INTEGER NOT NULL,

    CONSTRAINT "fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bitacora" (
    "id" SERIAL NOT NULL,
    "tipo_operacion" TEXT NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER NOT NULL,
    "objetoId" INTEGER NOT NULL,

    CONSTRAINT "bitacora_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_rut_key" ON "usuarios"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE INDEX "objetos_estado_idx" ON "objetos"("estado");

-- CreateIndex
CREATE INDEX "objetos_categoria_idx" ON "objetos"("categoria");

-- CreateIndex
CREATE INDEX "objetos_puntoId_idx" ON "objetos"("puntoId");

-- CreateIndex
CREATE UNIQUE INDEX "retiros_objetoId_key" ON "retiros"("objetoId");

-- AddForeignKey
ALTER TABLE "objetos" ADD CONSTRAINT "objetos_puntoId_fkey" FOREIGN KEY ("puntoId") REFERENCES "puntos_entrega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objetos" ADD CONSTRAINT "objetos_usuarioHalladorId_fkey" FOREIGN KEY ("usuarioHalladorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retiros" ADD CONSTRAINT "retiros_objetoId_fkey" FOREIGN KEY ("objetoId") REFERENCES "objetos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retiros" ADD CONSTRAINT "retiros_adminEntregaId_fkey" FOREIGN KEY ("adminEntregaId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retiros" ADD CONSTRAINT "retiros_usuarioRetiradorId_fkey" FOREIGN KEY ("usuarioRetiradorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_punto_asignacion" ADD CONSTRAINT "admin_punto_asignacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_punto_asignacion" ADD CONSTRAINT "admin_punto_asignacion_puntoId_fkey" FOREIGN KEY ("puntoId") REFERENCES "puntos_entrega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_objetoId_fkey" FOREIGN KEY ("objetoId") REFERENCES "objetos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora" ADD CONSTRAINT "bitacora_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora" ADD CONSTRAINT "bitacora_objetoId_fkey" FOREIGN KEY ("objetoId") REFERENCES "objetos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
