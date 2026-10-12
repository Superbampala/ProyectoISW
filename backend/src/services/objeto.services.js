import prisma from '../config/prisma.js';

export const obtenerObjetosPendientes = () => {
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

export const crearObjeto = async (objetoData) => {
    const { categoria, descripcion, lugarHallazgo ,usuarioHalladorId , puntoId , titularRut ,titularNombre} = objetoData;
    if (!categoria || !descripcion || !lugarHallazgo || !puntoId || !usuarioHalladorId) {
        throw new Error('Todos los campos son obligatorios');
    }
    if (categoria ==='DOCUMENTOS_Y_TARJETAS' && (!titularRut || !titularNombre)) {
        throw new Error('Para la categoría DOCUMENTOS_Y_TARJETAS, el titularRut y titularNombre son obligatorios');
    }

    const puntoEntrega = await prisma.puntoEntrega.findUnique({
        where: {id:Number(puntoId) },
    });

    if (!puntoEntrega) {
        throw new Error('El punto de entrega no existe');
    }

    //Buscar ultimo tiempo limite configurada
    const configHoraLimite = await prisma.configuracionHora.findFirst({
        orderBy: {
            fechaCambio: 'desc',},
    });

    const horaLimite = configHoraLimite ? configHoraLimite.horasLimite : 2; // Como valor por defecto, si no hay configuraciones previas, se establece en 2 horas

    const fechaHoraLimite = new Date(
        Date.now() + horaLimite * 60 * 60 * 1000 // en milisegundos
    )

    const crearData = {
            categoria,
            descripcion,
            lugarHallazgo,
            puntoId: Number(puntoId),
            estado: 'PENDIENTE',
            usuarioHalladorId: Number(usuarioHalladorId),
            horaLimite: fechaHoraLimite,
            
    };
    if (categoria === 'DOCUMENTOS_Y_TARJETAS') {
        crearData.titularRut = titularRut;
        crearData.titularNombre = titularNombre;
    }

    return prisma.objeto.create({
        data: crearData,
    });

}