import { Prisma } from '@prisma/client';

/**
 * Middleware centralizado para el manejo de errores.
 * Captura excepciones no controladas y errores específicos de Prisma.
 */
export const errorHandler = (err, req, res, next) => {
  console.error('💥 Error capturado:', err);

  // Errores de Prisma (códigos de error conocidos)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Violación de restricción de unicidad (Unique constraint failed)
    if (err.code === 'P2002') {
      const target = err.meta?.target ? err.meta.target.join(', ') : 'campo único';
      return res.status(409).json({
        error: `Conflicto: Ya existe un registro con el mismo valor para [${target}].`
      });
    }

    // P2025: Registro no encontrado para actualizar o eliminar
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'El recurso solicitado no fue encontrado en la base de datos.'
      });
    }

    // P2003: Violación de clave foránea (Foreign key constraint failed)
    if (err.code === 'P2003') {
      return res.status(400).json({
        error: 'La relación indicada no es válida (clave foránea inexistente).'
      });
    }
  }

  // Error genérico del servidor
  return res.status(500).json({
    error: 'Error interno del servidor. Por favor intenta más tarde.',
    detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};
