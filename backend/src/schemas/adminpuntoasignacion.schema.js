import { z } from 'zod';

/**
 * 1. Esquema para CREAR una asignación (POST /api/admin-puntos)
 */
export const crearAsignacionSchema = z.object({
  body: z.object({
    usuarioId: z.coerce
      .number({ required_error: 'El ID del usuario es obligatorio' })
      .int()
      .positive('El ID del usuario debe ser mayor a 0'),

    puntoId: z.coerce
      .number({ required_error: 'El ID del punto de entrega es obligatorio' })
      .int()
      .positive('El ID del punto de entrega debe ser mayor a 0')
  })
});

/**
 * 2. Esquema para ELIMINAR / DESASIGNAR por clave compuesta 
 * (DELETE /api/admin-puntos/:usuarioId/:puntoId)
 */
export const asignacionCompuestaParamSchema = z.object({
  params: z.object({
    usuarioId: z.coerce
      .number({ invalid_type_error: 'El ID del usuario debe ser un número entero' })
      .int()
      .positive('El ID del usuario debe ser mayor a 0'),

    puntoId: z.coerce
      .number({ invalid_type_error: 'El ID del punto debe ser un número entero' })
      .int()
      .positive('El ID del punto debe ser mayor a 0')
  })
});

/**
 * 3. Esquema para CONSULTAR / FILTRAR asignaciones (GET /api/admin-puntos)
 * Permite buscar todos los puntos de un usuario o todos los usuarios de un punto
 */
export const consultarAsignacionesQuerySchema = z.object({
  query: z.object({
    usuarioId: z.coerce.number().int().positive().optional(),
    puntoId: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20)
  })
});