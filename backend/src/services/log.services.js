import prisma from "../config/prisma.js";
import prisma from "../config/prisma.js";

export const createLog = async (objetoId, usuarioId, tipoOperacion) => {
  return prisma.bitacora.create({
    data: {
      objetoId: Number(objetoId),
      usuarioId: Number(usuarioId),
      tipoOperacion: tipoOperacion,
    },
  });
};