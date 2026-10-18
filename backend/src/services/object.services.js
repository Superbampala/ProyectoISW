import prisma from "../config/prisma.js";
import { Categoria } from "@prisma/client";

export const getObjectOptions = async () => {
  const puntosEntrega = await prisma.puntoEntrega.findMany({
    select: {
      id: true,
      nombre: true,
      ubicacion: true,
    },
    orderBy: {
      nombre: "asc",
    },
  });

  return {
    categorias: Object.values(Categoria),
    puntosEntrega,
  };
};

export const getPendingObjects = () => {
  return prisma.objeto.findMany({
    where: {
      estado: "PENDIENTE",
    },
    select: {
      id: true,
      categoria: true,
      descripcion: true,
      lugarHallazgo: true,
      fechaRegistro: true,
      titularRut: true,
      titularNombre: true,
      puntoId: true,
      bitacora: {
        select: {
          fechaHora: true,
        },
        orderBy: {
          fechaHora: "asc",
        },
      },
      fotos: {
        select: {
          urlArchivo: true,
        },
      },
    },
  });
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
