import prisma from "../config/prisma.js";
import fs from "node:fs/promises";
import path from "node:path";

const categorias = [
  "DOCUMENTOS_Y_TARJETAS",
  "ELECTRONICA",
  "ROPA_Y_ACCESORIOS",
  "LLAVES",
  "UTILES_Y_MATERIAL_ESTUDIO",
  "OTROS",
];

export const createObject = async (objectData, files = []) => {
  const {
    categoria,
    descripcion,
    lugarHallazgo,
    usuarioHalladorId,
    puntoId,
    titularRut,
    titularNombre,
  } = objectData;

  if (
    !categoria ||
    !descripcion ||
    !lugarHallazgo ||
    !puntoId ||
    !usuarioHalladorId
  ) {
    throw new Error("Todos los campos son obligatorios");
  }

  if (
    categoria === "DOCUMENTOS_Y_TARJETAS" &&
    (!titularRut || !titularNombre)
  ) {
    throw new Error(
      "Para la categoría DOCUMENTOS_Y_TARJETAS, el titularRut y titularNombre son obligatorios",
    );
  }

  const deliveryPoint = await prisma.puntoEntrega.findUnique({
    where: { id: Number(puntoId) },
  });

  if (!deliveryPoint) {
    throw new Error("El punto de entrega no existe");
  }

  const timeConfiguration = await prisma.configuracionHora.findFirst({
    orderBy: { fechaCambio: "desc" },
  });
  const limitHours = timeConfiguration?.horasLimite ?? 2;

  const data = {
    categoria,
    descripcion,
    lugarHallazgo,
    puntoId: Number(puntoId),
    estado: "PENDIENTE",
    usuarioHalladorId: Number(usuarioHalladorId),
    horaLimite: new Date(Date.now() + limitHours * 60 * 60 * 1000),
  };

  if (categoria === "DOCUMENTOS_Y_TARJETAS") {
    data.titularRut = titularRut;
    data.titularNombre = titularNombre;
  }

  try {
    return await prisma.$transaction(async (transaction) => {
      const object = await transaction.objeto.create({ data });

      if (files.length > 0) {
        await transaction.foto.createMany({
          data: files.map((file) => ({
            objetoId: object.id,
            urlArchivo: file.filename,
          })),
        });
      }

      return transaction.objeto.findUnique({
        where: { id: object.id },
        include: {
          punto: {
            select: {
              id: true,
              nombre: true,
              ubicacion: true,
            },
          },
          fotos: true,
        },
      });
    });
  } catch (error) {
    await Promise.all(
      files.map((file) => fs.unlink(file.path).catch(() => undefined)),
    );
    throw error;
  }
};

export const getObjectPhoto = (photoId) =>
  prisma.foto.findUnique({
    where: { id: Number(photoId) },
    include: {
      objeto: {
        select: { usuarioHalladorId: true },
      },
    },
  });

export const deleteObjectPhotoFile = (filename) =>
  fs.unlink(path.join(process.cwd(), "uploads", "objects", filename));

const pendingObjectSelect = {
  id: true,
  categoria: true,
  descripcion: true,
  lugarHallazgo: true,
  puntoId: true,
  fechaRegistro: true,
  horaLimite: true,
  titularRut: true,
  titularNombre: true,
  bitacora: {
    select: { fechaHora: true },
    orderBy: { fechaHora: "asc" },
  },
  fotos: {
    select: { id: true, urlArchivo: true },
  },
};

const getPendingObjectsPage = async (where, page = 1, limit = 6) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 6));
  const skip = (safePage - 1) * safeLimit;

  const [objects, total] = await prisma.$transaction([
    prisma.objeto.findMany({
      where:where,
      select: pendingObjectSelect,
      orderBy: { fechaRegistro: "desc" },
      skip:skip,
      take: safeLimit,
    }),
    prisma.objeto.count({ where }),
  ]);

  return {
    items: objects,
    page: safePage,
    pageSize: safeLimit,
    total,
    totalPages: Math.ceil(total / safeLimit),
  };
};

export const getAllPendingObjects = (page, limit) =>
  getPendingObjectsPage({ estado: "PENDIENTE" }, page, limit);

export const getPendingObjectsByUser = (userId, page, limit) =>
  getPendingObjectsPage({
    estado: "PENDIENTE",
    usuarioHalladorId: Number(userId),
  }, page, limit);

export const getApprovedObjects = () => {
  return prisma.objeto.findMany({
    where: { estado: "APROBADO" },
    select: {
      id: true,
      categoria: true,
      descripcion: true,
      lugarHallazgo: true,
      fechaRegistro: true,
    },
  });
};

export const getDeliveryPoints = () => {
  return prisma.puntoEntrega.findMany({
    orderBy: { nombre: "asc" },
  });
};

export const getObjectOptions = async () => {
  const puntosEntrega = await getDeliveryPoints();

  return {
    categorias,
    puntosEntrega,
  };
};

export const getObjectById = (id) => {
  return prisma.objeto.findUnique({
    where: { id: Number(id) },
  });
};

export const updateObject = (id, data) => {
  return prisma.objeto.update({
    where: { id: Number(id) },
    data,
  });
};

export const approveObject = async (id, usuarioId) => {
  const objetoId = Number(id);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.objeto.updateMany({
      where: {
        id: objetoId,
        estado: "PENDIENTE",
      },
      data: { estado: "APROBADO" },
    });

    if (updated.count !== 1) {
      const error = new Error(
        "El objeto no existe o ya no está pendiente",
      );
      error.statusCode = 409;
      throw error;
    }

    const log = await tx.bitacora.create({
      data: {
        objetoId,
        objetoIdHistorico: objetoId,
        usuarioId: Number(usuarioId),
        tipoOperacion: "APROBACION",
      },
    });

    return {
      objeto: await tx.objeto.findUnique({ where: { id: objetoId } }),
      bitacora: log,
    };
  });
};

export const deleteObject = async (id, usuarioId) => {
  const objetoId = Number(id);

  return prisma.$transaction(async (tx) => {
    const objeto = await tx.objeto.findUnique({
      where: { id: objetoId },
      select: { estado: true },
    });

    if (!objeto) {
      const error = new Error("Pre-inscripción no encontrada");
      error.statusCode = 404;
      throw error;
    }

    if (objeto.estado !== "PENDIENTE") {
      const error = new Error("Solo se pueden eliminar objetos pendientes");
      error.statusCode = 409;
      throw error;
    }

    await tx.bitacora.create({
      data: {
        objetoId,
        objetoIdHistorico: objetoId,
        usuarioId: Number(usuarioId),
        tipoOperacion: "ELIMINACION_MANUAL",
      },
    });

    await tx.objeto.delete({
      where: { id: objetoId },
    });

    return { objetoId };
  });
};
