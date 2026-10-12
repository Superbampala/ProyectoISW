import { z } from 'zod';

/**
 * 1. Esquema para CREAR / REGISTRAR una nueva Configuración de Hora (POST /api/configuracion-hora)
 */
export const crearConfiguracionHoraSchema = z.object({
  body: z.object({
    horasLimite: z.coerce
      .number({
        required_error: 'El campo horas límite es obligatorio',
        invalid_type_error: 'Las horas límite deben ser un número entero'
      })
      .int('Las horas límite deben ser un número entero')
      .positive('Las horas límite deben ser un número mayor a 0')
      .max(8760, 'El valor máximo permitido es de 8760 horas (1 año)'), // Límite razonable opcional

    actualizadoPorId: z.coerce
      .number({
        required_error: 'El ID del usuario administrador es obligatorio',
        invalid_type_error: 'El ID del usuario debe ser un número entero'
      })
      .int()
      .positive('El ID del usuario debe ser mayor a 0')
  })
});

/**
 * 2. Esquema para ACTUALIZAR una configuración por ID (PATCH /api/configuracion-hora/:id)
 */
export const actualizarConfiguracionHoraSchema = z.object({
  params: z.object({
    id: z.coerce
      .number({ invalid_type_error: 'El ID debe ser un número entero' })
      .int()
      .positive('El ID debe ser mayor a 0')
  }),
  body: z
    .object({
      horasLimite: z.coerce.number().int().positive().max(8760),
      actualizadoPorId: z.coerce.number().int().positive()
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Debe proporcionar al menos un campo para actualizar'
    })
});

/**
 * 3. Esquema para validar ID por parámetro de URL (GET / DELETE /api/configuracion-hora/:id)
 */
export const configuracionHoraIdParamSchema = z.object({
  params: z.object({
    id: z.coerce
      .number({ invalid_type_error: 'El ID debe ser un número entero' })
      .int()
      .positive('El ID debe ser mayor a 0')
  })
});

/**
 * 4. Esquema para CONSULTAR HISTORIAL O PAGINACIÓN (GET /api/configuracion-hora)
 */
export const consultarConfiguracionesQuerySchema = z.object({
  query: z.object({
    actualizadoPorId: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20)
  })
});