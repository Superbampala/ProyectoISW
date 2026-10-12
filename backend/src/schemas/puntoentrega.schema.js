import { z } from 'zod';

/**
 * 1. Esquema para CREAR un Punto de Entrega (POST /api/puntos-entrega)
 */
export const crearPuntoEntregaSchema = z.object({
  body: z.object({
    nombre: z
      .string({ required_error: 'El nombre del punto de entrega es obligatorio' })
      .trim()
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(100, 'El nombre no puede exceder los 100 caracteres'),

    ubicacion: z
      .string({ required_error: 'La ubicación es obligatoria' })
      .trim()
      .min(3, 'La ubicación debe tener al menos 3 caracteres')
      .max(255, 'La ubicación no puede exceder los 255 caracteres')
  })
});

/**
 * 2. Esquema para ACTUALIZAR un Punto de Entrega (PUT/PATCH /api/puntos-entrega/:id)
 */
export const actualizarPuntoEntregaSchema = z.object({
  params: z.object({
    id: z.coerce
      .number({ invalid_type_error: 'El ID debe ser un número entero' })
      .int()
      .positive('El ID debe ser mayor a 0')
  }),
  body: z
    .object({
      nombre: z.string().trim().min(3).max(100),
      ubicacion: z.string().trim().min(3).max(255)
    })
    .partial() // Permite actualizar solo un campo (ej: solo el nombre o solo la ubicación)
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Debe proporcionar al menos un campo para actualizar'
    })
});

/**
 * 3. Esquema para validar el parámetro ID en URL (GET / DELETE /api/puntos-entrega/:id)
 */
export const puntoEntregaIdParamSchema = z.object({
  params: z.object({
    id: z.coerce
      .number({ invalid_type_error: 'El ID debe ser un número entero' })
      .int()
      .positive('El ID debe ser mayor a 0')
  })
});

/**
 * 4. Esquema opcional para BÚSQUEDA Y PAGINACIÓN (GET /api/puntos-entrega?nombre=central)
 */
export const consultarPuntosEntregaQuerySchema = z.object({
  query: z.object({
    nombre: z.string().trim().optional(),
    ubicacion: z.string().trim().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20)
  })
});