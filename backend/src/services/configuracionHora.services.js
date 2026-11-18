import prisma from "../config/prisma.js";

const DEFAULT_DEADLINE_HOURS = 2;

export const getCurrentTimeConfiguration = async () => {
  const configuration = await prisma.configuracionHora.findFirst({
    orderBy: { fechaCambio: "desc" },
    include: {
      actualizadoPor: {
        select: { id: true, nombre: true },
      },
    },
  });

  if (!configuration) {
    return {
      horasLimite: DEFAULT_DEADLINE_HOURS,
      fechaCambio: null,
      actualizadoPor: null,
    };
  }

  return configuration;
};

export const createTimeConfiguration = (horasLimite, actualizadoPorId) =>
  prisma.configuracionHora.create({
    data: {
      horasLimite: Number(horasLimite),
      actualizadoPorId: Number(actualizadoPorId),
    },
    include: {
      actualizadoPor: {
        select: { id: true, nombre: true },
      },
    },
  });

export const getTimeConfigurationHistory = async ({ page, limit, actualizadoPorId }) => {
  const where = actualizadoPorId
    ? { actualizadoPorId: Number(actualizadoPorId) }
    : {};
  const [registros, total] = await prisma.$transaction([
    prisma.configuracionHora.findMany({
      where,
      orderBy: { fechaCambio: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        actualizadoPor: {
          select: { id: true, nombre: true },
        },
      },
    }),
    prisma.configuracionHora.count({ where }),
  ]);

  return { registros, total, pagina: page, limite: limit };
};