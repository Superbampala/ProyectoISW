import prisma from '../config/prisma.js';

export const getPendingObjects = () => {
    return prisma.objeto.findMany({
        where: {
            estado: 'PENDIENTE',
        },
        select: {
            id: true,
            categoria: true,
            descripcion: true,
            lugarHallazgo: true,
            fechaRegistro: true,
            titularRut: true,
            titularNombre: true,
            bitacora: {
                select: {
                    fechaHora: true,
                },
                orderBy: {
                    fechaHora: 'asc',
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


