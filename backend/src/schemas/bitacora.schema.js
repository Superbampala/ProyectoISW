import { z } from 'zod';

/**
 * 1. Esquema para REGISTRAR un evento en Bitácora (POST)
 * (Útil si se registra explícitamente desde la API o un servicio interno)
 */
export const crearBitacoraSchema = z.object({
  body: z.object({
    tipoOperacion: z
      .string({ required_error: 'El tipo de operación es obligatorio' })
      .trim()
      .min(2, 'El tipo de operación debe tener al menos 2 caracteres')
      .max(100, 'El tipo de operación no puede exceder 100 caracteres'),

    usuarioId: z
      .number({
        required_error: 'El ID de usuario es obligatorio',
        invalid_type_error: 'El ID de usuario debe ser un número entero'
      })
      .int()
      .positive('El ID de usuario debe ser mayor a 0'),

    objetoId: z
      .number({
        required_error: 'El ID de objeto es obligatorio',
        invalid_type_error: 'El ID de objeto debe ser un número entero'
      })
      .int()
      .positive('El ID de objeto debe ser mayor a 0'),

    // Opcional: si no se envía, Prisma asigna la fecha/hora actual de la DB (@default(now()))
    fechaHora: z
      .string()
      .datetime({ message: 'La fecha debe ser una cadena ISO 8601 válida' })
      .optional()
  })
});

/**
 * 2. Esquema para FILTRAR / CONSULTAR la Bitácora (GET /api/bitacora?usuarioId=1&tipoOperacion=ENTREGA)
 * Es la validación más importante en tablas de auditoría.
 */
export const consultarBitacoraQuerySchema = z.object({
  query: z.object({
    usuarioId: z.coerce.number().int().positive().optional(),
    objetoId: z.coerce.number().int().positive().optional(),
    tipoOperacion: z.string().trim().optional(),
    
    // Filtros de rango de fechas
    fechaDesde: z.string().datetime().optional(),
    fechaHasta: z.string().datetime().optional(),

    // Paginación
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20)
  })
});

/**
 * 3. Esquema para obtener un evento específico por ID (GET /api/bitacora/:id)
 */
export const bitacoraIdParamSchema = z.object({
  params: z.object({
    id: z.coerce
      .number({ invalid_type_error: 'El ID debe ser un número entero' })
      .int()
      .positive('El ID debe ser mayor a 0')
  })
});