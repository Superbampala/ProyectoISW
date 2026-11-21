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

const buildObjectFilters = (baseWhere = {}, filters = {}) => {
  const where = { ...baseWhere };

  if (filters.categoria) {
    where.categoria = filters.categoria;
  }

  if (filters.puntoId) {
    where.puntoId = Number(filters.puntoId);
  }

  if (filters.desde) {
    where.fechaRegistro = {
      // gte -> greater than or equal
      gte: new Date(`${filters.desde}T00:00:00.000Z`),
    };
  }

  if (filters.hasta) {
    where.fechaRegistro = {
      ...where.fechaRegistro,
      //lte: less than or equal
      lte: new Date(`${filters.hasta}T23:59:59.999Z`),
    };
  }

  return where;
};

const DAILY_REGISTRATION_LIMIT = 4;
const DAILY_REGISTRATION_ROLE = "USUARIO_UBB";
const DEFAULT_DEADLINE_HOURS = 2;

export class DailyRegistrationLimitError extends Error {
  constructor() {
    super(
      "Has alcanzado el límite diario de 4 preinscripciones. Intenta nuevamente mañana.",
    );
    this.name = "DailyRegistrationLimitError";
    this.statusCode = 429;
  }
}

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
  const limitHours = timeConfiguration?.horasLimite ?? DEFAULT_DEADLINE_HOURS;

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
      if (objectData.usuarioRol === DAILY_REGISTRATION_ROLE) {
        await transaction.$queryRaw`
          SELECT pg_advisory_xact_lock(${Number(usuarioHalladorId)})
        `;

        const [dailyCount] = await transaction.$queryRaw`
          SELECT COUNT(*)::int AS count
          FROM "registros_preinscripcion"
          WHERE "usuario_id" = ${Number(usuarioHalladorId)}
            AND ("fecha_registro" AT TIME ZONE 'America/Santiago')::date =
              (CURRENT_TIMESTAMP AT TIME ZONE 'America/Santiago')::date
        `;

        if (dailyCount.count >= DAILY_REGISTRATION_LIMIT) {
          throw new DailyRegistrationLimitError();
        }
      }

      const object = await transaction.objeto.create({ data });

      if (files.length > 0) {
        await transaction.foto.createMany({
          data: files.map((file) => ({
            objetoId: object.id,
            urlArchivo: file.filename,
          })),
        });
      }

      await transaction.registroPreinscripcion.create({
        data: {
          usuarioId: Number(usuarioHalladorId),
          objetoId: object.id,
        },
      });

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
        select: { usuarioHalladorId: true, puntoId: true },
      },
    },
  });

export const deleteObjectPhotoFile = (filename) =>
  fs.unlink(path.join(process.cwd(), "uploads", "objects", filename));

export const addObjectPhotos = async (objectId, files) => {
  const id = Number(objectId);
  const object = await prisma.objeto.findUnique({
    where: { id },
    select: { estado: true, fotos: { select: { id: true } } },
  });

  if (!object) {
    const error = new Error("Pre-inscripción no encontrada");
    error.statusCode = 404;
    throw error;
  }
  if (object.estado !== "PENDIENTE") {
    const error = new Error(
      "Solo se pueden editar fotos de objetos pendientes",
    );
    error.statusCode = 409;
    throw error;
  }
  if (object.fotos.length + files.length > 5) {
    for (const file of files) {
      try {
        await fs.unlink(file.path);
      } catch {
        // El archivo puede no existir; no se detiene el manejo del error principal.
      }
    }

    const error = new Error(
      "Cada objeto puede tener como máximo 5 fotografías",
    );

    error.statusCode = 400;
    throw error;
  }

  try {
    return await prisma.$transaction(async (transaction) => {
      await transaction.foto.createMany({
        data: files.map((file) => ({
          objetoId: id,
          urlArchivo: file.filename,
        })),
      });
      return transaction.foto.findMany({
        where: { objetoId: id },
        select: { id: true, urlArchivo: true },
      });
    });
  } catch (error) {
    await Promise.all(
      files.map((file) => fs.unlink(file.path).catch(() => undefined)),
    );
    throw error;
  }
};

export const removeObjectPhoto = async (objectId, photoId) => {
  const id = Number(objectId);
  const photo = await prisma.foto.findUnique({
    where: { id: Number(photoId) },
    include: { objeto: { select: { estado: true } } },
  });

  if (!photo || photo.objetoId !== id) {
    const error = new Error("Fotografía no encontrada");
    error.statusCode = 404;
    throw error;
  }
  if (photo.objeto.estado !== "PENDIENTE") {
    const error = new Error(
      "Solo se pueden editar fotos de objetos pendientes",
    );
    error.statusCode = 409;
    throw error;
  }

  await prisma.foto.delete({ where: { id: photo.id } });

  const references = await prisma.foto.count({
    where: { urlArchivo: photo.urlArchivo },
  });
  if (references === 0) {
    await deleteObjectPhotoFile(photo.urlArchivo).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
};

const pendingObjectSelect = {
  id: true,
  estado: true,
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
};

const getPendingObjectsPage = async (
  where,
  page = 1,
  limit = 6,
  includePhotos = false,
) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 6));
  const skip = (safePage - 1) * safeLimit;

  const [objects, total] = await prisma.$transaction([
    prisma.objeto.findMany({
      where: where,
      select: includePhotos
        ? {
            ...pendingObjectSelect,
            fotos: { select: { id: true, urlArchivo: true } },
          }
        : pendingObjectSelect,
      orderBy: { fechaRegistro: "desc" },
      skip: skip,
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

//PORISACASO

//export const getAllPendingObjects = (
//  page,
// limit,
// includePhotos = false,
//  filters = {},
//) =>
  
export const getAllPendingObjects = async (page, limit, user, filters = {}) => {
  if (user.rol === "ADMIN_SISTEMA") {
    return getPendingObjectsPage(
      buildObjectFilters({ estado: "PENDIENTE" }, filters),
      page,
      limit,
      true,
    );
  }

  const asignaciones = await prisma.adminPuntoAsignacion.findMany({
    where: { usuarioId: Number(user.id) },
    select: { puntoId: true },
  });

  const puntoIds = asignaciones.map(({ puntoId }) => puntoId);

  return getPendingObjectsPage(
    buildObjectFilters(
      {
        estado: "PENDIENTE",
        OR: [
          { puntoId: { in: puntoIds } },
          { usuarioHalladorId: Number(user.id) },
        ],
      },
      filters,
    ),
    page,
    limit,
    true,
  );
};

export const getPendingObjectsByUser = (userId, page, limit, filters = {}) =>
  getPendingObjectsPage(
    buildObjectFilters(
      {
        estado: "PENDIENTE",
        usuarioHalladorId: Number(userId),
      },
      filters,
    ),
    page,
    limit,
    true,
  );

const getApprovedObjectsPage = async (
  page = 1,
  limit = 6,
  includePhotos = false,
  filters = {},
  includeHolderData = false,
) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 6));
  const skip = (safePage - 1) * safeLimit;
  const where = buildObjectFilters({ estado: "APROBADO" }, filters);
  const select = {
    id: true,
    categoria: true,
    descripcion: true,
    lugarHallazgo: true,
    puntoId: true,
    fechaRegistro: true,
    punto: {
      select: { id: true, nombre: true },
    },
  };
  if (includeHolderData) {
    select.titularRut = true;
    select.titularNombre = true;
  }
  if (includePhotos) {
    select.fotos = { select: { id: true, urlArchivo: true } };
  }

  const [objects, total] = await prisma.$transaction([
    prisma.objeto.findMany({
      where,
      select,
      orderBy: { fechaRegistro: "desc" },
      skip,
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

export const getApprovedObjects = (page, limit, filters = {}, includeHolderData = false) =>
  getApprovedObjectsPage(page, limit, false, filters, includeHolderData);

export const getApprovedObjectsForPointAdmin = (
  page,
  limit,
  filters = {},
) => getApprovedObjectsPage(page, limit, true, filters, true);

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
      const error = new Error("El objeto no existe o ya no está pendiente");
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

export const deleteExpiredPendingObjects = async () => {
  const now = new Date();
  const batch = await prisma.$transaction(async (tx) => {
    const expiredObjects = await tx.$queryRaw`
      SELECT "id"
      FROM "objetos"
      WHERE "estado" = 'PENDIENTE'
        AND "hora_limite" <= ${now}
      ORDER BY "hora_limite" ASC, "id" ASC
      LIMIT 100
      FOR UPDATE SKIP LOCKED
    `;

    if (expiredObjects.length === 0) {
      return { ids: [], photoFiles: [] };
    }

    const ids = expiredObjects.map(({ id }) => id);
    const photos = await tx.foto.findMany({
      where: { objetoId: { in: ids } },
      select: { urlArchivo: true },
    });

    await tx.bitacora.createMany({
      data: ids.map((id) => ({
        tipoOperacion: "ELIMINACION_AUTOMATICA",
        usuarioId: null,
        objetoId: id,
        objetoIdHistorico: id,
      })),
    });

    const deletion = await tx.objeto.deleteMany({
      where: {
        id: { in: ids },
        estado: "PENDIENTE",
        horaLimite: { lte: now },
      },
    });

    if (deletion.count !== ids.length) {
      throw new Error("No se pudieron eliminar todos los objetos vencidos");
    }

    return {
      ids,
      photoFiles: photos.map(({ urlArchivo }) => urlArchivo),
    };
  });

  const failedPhotoFiles = [];
  await Promise.all(
    batch.photoFiles.map(async (filename) => {
      try {
        await fs.unlink(path.join(process.cwd(), "uploads", "objects", filename));
      } catch (error) {
        if (error.code !== "ENOENT") failedPhotoFiles.push(filename);
      }
    }),
  );

  return {
    deletedCount: batch.ids.length,
    failedPhotoFiles,
  };
};
