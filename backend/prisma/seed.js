import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();
const photosDirectory = path.join(process.cwd(), "uploads", "objects");

const photoFiles = [
  "seed-photo-1496181133206-80ce9b88a853.svg",
  "seed-photo-1553062407-98eeb64c6a62.svg",
  "seed-photo-1554224155-6726b3ff858f.svg",
  "seed-photo-1582139329536-e7284fece509.svg",
  "seed-photo-1589829545856-d10d557cf95f.svg",
  "seed-photo-1602143407151-7111542de6e8.svg",
];

const pendingObjects = [
  {
    categoria: "ELECTRONICA",
    descripcion: "Audífonos inalámbricos encontrados en una sala de clases.",
    lugarHallazgo: "Edificio de aulas, segundo piso",
    puntoId: 1,
  },
  {
    categoria: "ROPA_Y_ACCESORIOS",
    descripcion: "Mochila azul con accesorios personales.",
    lugarHallazgo: "Biblioteca central",
    puntoId: 2,
  },
  {
    categoria: "DOCUMENTOS_Y_TARJETAS",
    descripcion: "Billetera con documentos y tarjetas.",
    lugarHallazgo: "Casino universitario",
    puntoId: 1,
    titularRut: "12345678-5",
    titularNombre: "Titular de prueba",
  },
  {
    categoria: "LLAVES",
    descripcion: "Llavero con tres llaves metálicas.",
    lugarHallazgo: "Estacionamiento de bicicletas",
    puntoId: 2,
  },
];

async function main() {
  await Promise.all(
    photoFiles.map((file) => fs.access(path.join(photosDirectory, file))),
  );

  await prisma.$transaction(async (transaction) => {
    await transaction.bitacora.deleteMany();
    await transaction.foto.deleteMany();
    await transaction.retiro.deleteMany();
    await transaction.objeto.deleteMany();
    await transaction.adminPuntoAsignacion.deleteMany();
    await transaction.configuracionHora.deleteMany();
    await transaction.puntoEntrega.deleteMany();
    await transaction.usuario.deleteMany();

    const adminPunto = await transaction.usuario.create({
      data: {
        id: 1,
        nombre: "Administrador de prueba",
        rut: "11111111-1",
        correo: "admin.punto@prueba.cl",
        passwordHash: "seed-password",
        rol: "ADMIN_PUNTO",
        habilitado: true,
      },
    });

    const usuario = await transaction.usuario.create({
      data: {
        id: 2,
        nombre: "Usuario de prueba",
        rut: "22222222-2",
        correo: "usuario@prueba.cl",
        passwordHash: "seed-password",
        rol: "USUARIO_UBB",
        habilitado: true,
      },
    });

    const puntos = await Promise.all([
      transaction.puntoEntrega.create({
        data: {
          id: 1,
          nombre: "Punto de entrega norte",
          ubicacion: "Campus norte",
        },
      }),
      transaction.puntoEntrega.create({
        data: {
          id: 2,
          nombre: "Punto de entrega sur",
          ubicacion: "Campus sur",
        },
      }),
    ]);

    await transaction.adminPuntoAsignacion.create({
      data: { usuarioId: adminPunto.id, puntoId: puntos[0].id },
    });

    for (const [objectIndex, objectData] of pendingObjects.entries()) {
      const object = await transaction.objeto.create({
        data: {
          ...objectData,
          puntoId: puntos[objectData.puntoId - 1].id,
          usuarioHalladorId: usuario.id,
          horaLimite: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
      });

      await transaction.foto.createMany({
        data: Array.from({ length: 5 }, (_, photoIndex) => ({
          objetoId: object.id,
          urlArchivo: photoFiles[(objectIndex + photoIndex) % photoFiles.length],
        })),
      });
    }
  });

  console.log(
    `Seed completado: ${pendingObjects.length} objetos pendientes con 5 fotos cada uno.`,
  );
}

main()
  .catch((error) => {
    console.error("Error al ejecutar el seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });