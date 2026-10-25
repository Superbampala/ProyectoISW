import prisma from "../config/prisma.js";

const categorias = [
  "DOCUMENTOS_Y_TARJETAS",
  "ELECTRONICA",
  "ROPA_Y_ACCESORIOS",
  "LLAVES",
  "UTILES_Y_MATERIAL_ESTUDIO",
  "OTROS",
];

export const createObject = async (objectData) => {
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

  return prisma.objeto.create({
    data,
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
};

export const getAllPendingObjects = () => {
  return prisma.objeto.findMany({
    where: { estado: "PENDIENTE" },
    select: {
      id: true,
      categoria: true,
      descripcion: true,
      lugarHallazgo: true,
      fechaRegistro: true,
      horaLimite: true,
      titularRut: true,
      titularNombre: true,
      bitacora: {
        select: { fechaHora: true },
        orderBy: { fechaHora: "asc" },
      },
      fotos: {
        select: { urlArchivo: true },
      },
    },
  });
};

export const getPendingObjectsByUser = (userId) => {
  return prisma.objeto.findMany({
    where: { estado: "PENDIENTE", usuarioHalladorId: Number(userId) },
    select: {
      id: true,
      categoria: true,
      descripcion: true,
      lugarHallazgo: true,
      fechaRegistro: true,
      horaLimite: true,
      titularRut: true,
      titularNombre: true,
      bitacora: {
        select: { fechaHora: true },
        orderBy: { fechaHora: "asc" },
      },
      fotos: {
        select: { urlArchivo: true },
      },
    },
  });
}

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

export const approveObject = (id) => {
  return prisma.objeto.update({
    where: { id: Number(id) },
    data: { estado: "APROBADO" },
  });
}

export const deleteObject = (id) => {
  return prisma.objeto.delete({
    where: { id: Number(id) },
  });
};
