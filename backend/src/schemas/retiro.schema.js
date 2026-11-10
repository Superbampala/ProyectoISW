import { z } from 'zod';

// Regex para validar formato RUT chileno (ej: 12345678-9 o 12.345.678-K)
const rutRegex = /^(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])$/;

/**
 * 1. Esquema para REGISTRAR un Retiro (POST /api/retiros)
 */
export const crearRetiroSchema = z.object({
  body: z.object({
    rutRetiro: z
      .string({ required_error: 'El RUT del retirador es obligatorio' })
      .trim()
      .regex(rutRegex, 'Formato de RUT inválido. Ejemplo: 12345678-9'),

    objetoId: z.coerce
      .number({ required_error: 'El ID del objeto retirado es obligatorio' })
      .int()
      .positive('El ID del objeto debe ser mayor a 0'),

    // Si adminEntregaId se envía manualmente en el body:
    adminEntregaId: z.coerce
      .number({ required_error: 'El ID del administrador que procesa es obligatorio' })
      .int()
      .positive('El ID del administrador debe ser mayor a 0'),

    // Opcional y nulo: coincide con `Int?` de Prisma
    usuarioRetiradorId: z.coerce
      .number({ invalid_type_error: 'El ID del usuario retirador debe ser un número entero' })
      .int()
      .positive('El ID del usuario debe ser mayor a 0')
      .nullable()
      .optional(),

    // Opcional: si el cliente especifica la fecha; si no se envía, el controlador usa new Date()
    fechaRetiro: z
      .string()
      .datetime({ message: 'La fecha de retiro debe ser un string ISO 8601 válido' })
      .optional()
  })
});

/**
 * 2. Esquema para ACTUALIZAR un Retiro (PATCH /api/retiros/:id)
 * Útil para correcciones administrativas (ej. vincular una cuenta existente o corregir un RUT).
 */
export const actualizarRetiroSchema = z.object({
  params: z.object({
    id: z.coerce
      .number({ invalid_type_error: 'El ID debe ser un número entero' })
      .int()
      .positive('El ID debe ser mayor a 0')
  }),
  body: z
    .object({
      rutRetiro: z.string().trim().regex(rutRegex, 'Formato de RUT inválido'),
      usuarioRetiradorId: z.coerce.number().int().positive().nullable(),
      fechaRetiro: z.string().datetime()
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Debe proporcionar al menos un campo para actualizar'
    })
});

/**
 * 3. Esquema para consultar un Retiro por ID (GET / DELETE /api/retiros/:id)
 */
export const retiroIdParamSchema = z.object({
  params: z.object({
    id: z.coerce
      .number({ invalid_type_error: 'El ID debe ser un número entero' })
      .int()
      .positive('El ID debe ser mayor a 0')
  })
});

/**
 * 4. Esquema para FILTRAR / CONSULTAR Retiros (GET /api/retiros)
 */
export const consultarRetirosQuerySchema = z.object({
  query: z.object({
    rutRetiro: z.string().trim().optional(),
    objetoId: z.coerce.number().int().positive().optional(),
    adminEntregaId: z.coerce.number().int().positive().optional(),
    usuarioRetiradorId: z.coerce.number().int().positive().optional(),
    
    fechaDesde: z.string().datetime().optional(),
    fechaHasta: z.string().datetime().optional(),

    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20)
  })
});