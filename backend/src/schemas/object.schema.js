import { z } from 'zod';

// Regex para validar formato RUT chileno (ej: 12345678-9 o 12.345.678-K)
const rutRegex = /^(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])$/;

// Reemplaza estos valores según los enums exactos de tu schema.prisma
const categoriasValidas = [
  'DOCUMENTOS_Y_TARJETAS',
  'ELECTRONICA',
  'ROPA',
  'ACCESORIOS',
  'OTROS'
];

const estadosValidos = [
  'PENDIENTE',
  'RETIRADO',
  'DESECHADO',
  'TRANSFERIDO'
];

/**
 * 1. Esquema para CREAR un Objeto (POST /api/objetos)
 */
export const crearObjetoSchema = z.object({
  body: z
    .object({
      categoria: z.enum(categoriasValidas, {
        errorMap: () => ({
          message: `La categoría debe ser una de las siguientes: ${categoriasValidas.join(', ')}`
        })
      }),

      descripcion: z
        .string({ required_error: 'La descripción es obligatoria' })
        .trim()
        .min(3, 'La descripción debe tener al menos 3 caracteres')
        .max(500, 'La descripción no puede exceder 500 caracteres'),

      lugarHallazgo: z
        .string({ required_error: 'El lugar de hallazgo es obligatorio' })
        .trim()
        .min(3, 'El lugar de hallazgo debe tener al menos 3 caracteres')
        .max(200, 'El lugar de hallazgo no puede exceder 200 caracteres'),

      estado: z.enum(estadosValidos).default('PENDIENTE').optional(),

      titularRut: z
        .string()
        .trim()
        .regex(rutRegex, 'Formato de RUT inválido. Ejemplo: 12345678-9')
        .nullable()
        .optional(),

      titularNombre: z
        .string()
        .trim()
        .min(2, 'El nombre del titular debe tener al menos 2 caracteres')
        .max(100)
        .nullable()
        .optional(),

      puntoId: z.coerce
        .number({ required_error: 'El ID del punto de entrega es obligatorio' })
        .int()
        .positive('El ID del punto de entrega debe ser mayor a 0'),

      usuarioHalladorId: z.coerce
        .number({ required_error: 'El ID del usuario hallador es obligatorio' })
        .int()
        .positive('El ID del usuario hallador debe ser mayor a 0')
    })
    // Regla condicional: exige titularRut si la categoría es DOCUMENTOS_Y_TARJETAS
    .superRefine((data, ctx) => {
      if (data.categoria === 'DOCUMENTOS_Y_TARJETAS' && !data.titularRut) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['titularRut'],
          message: 'El RUT del titular es obligatorio cuando la categoría es DOCUMENTOS_Y_TARJETAS'
        });
      }
    })
});

/**
 * 2. Esquema para ACTUALIZAR un Objeto (PATCH /api/objetos/:id)
 */
export const actualizarObjetoSchema = z.object({
  params: z.object({
    id: z.coerce
      .number({ invalid_type_error: 'El ID debe ser un número entero' })
      .int()
      .positive('El ID debe ser mayor a 0')
  }),
  body: z
    .object({
      categoria: z.enum(categoriasValidas),
      descripcion: z.string().trim().min(3).max(500),
      lugarHallazgo: z.string().trim().min(3).max(200),
      estado: z.enum(estadosValidos),
      titularRut: z.string().trim().regex(rutRegex, 'Formato de RUT inválido').nullable(),
      titularNombre: z.string().trim().min(2).max(100).nullable(),
      puntoId: z.coerce.number().int().positive()
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Debe proporcionar al menos un campo para actualizar'
    })
});

/**
 * 3. Esquema para validar ID por parámetro de URL (GET / DELETE /api/objetos/:id)
 */
export const objetoIdParamSchema = z.object({
  params: z.object({
    id: z.coerce
      .number({ invalid_type_error: 'El ID debe ser un número entero' })
      .int()
      .positive('El ID debe ser mayor a 0')
  })
});

/**
 * 4. Esquema para BÚSQUEDA, FILTRADO Y PAGINACIÓN (GET /api/objetos)
 * Aprovecha los índices definidos en Prisma: @@index([estado]), @@index([categoria]), @@index([puntoId])
 */
export const consultarObjetosQuerySchema = z.object({
  query: z.object({
    categoria: z.enum(categoriasValidas).optional(),
    estado: z.enum(estadosValidos).optional(),
    puntoId: z.coerce.number().int().positive().optional(),
    usuarioHalladorId: z.coerce.number().int().positive().optional(),
    titularRut: z.string().trim().optional(),
    
    // Búsqueda abierta por texto
    search: z.string().trim().optional(),

    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20)
  })
});