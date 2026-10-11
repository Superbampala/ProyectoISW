import { z } from 'zod';

// Define los valores permitidos según tu enum 'Rol' de Prisma
const rolesValidos = ['ADMIN', 'OPERADOR', 'USUARIO']; // Ajusta según tu enum en Prisma

// Regex para validar formato RUT chileno (ej: 12345678-9 o 12.345.678-K)
const rutRegex = /^(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])$/;

/**
 * 1. Esquema para CREAR un usuario
 */
export const crearUsuarioSchema = z.object({
  body: z.object({
    nombre: z
      .string({ required_error: 'El nombre es obligatorio' })
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre es demasiado largo'),

    rut: z
      .string({ required_error: 'El RUT es obligatorio' })
      .trim()
      .regex(rutRegex, 'Formato de RUT inválido. Ejemplo: 12345678-9'),

    correo: z
      .string({ required_error: 'El correo es obligatorio' })
      .trim()
      .email('El formato del correo electrónico no es válido')
      .toLowerCase(),

    password: z
      .string({ required_error: 'La contraseña es obligatoria' })
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(100, 'La contraseña no puede exceder 100 caracteres'),

    rol: z.enum(rolesValidos, {
      errorMap: () => ({
        message: `El rol debe ser uno de los siguientes: ${rolesValidos.join(', ')}`
      })
    })
  })
});

/**
 * 2. Esquema para ACTUALIZAR un usuario (Todos los campos del body son opcionales)
 */
export const actualizarUsuarioSchema = z.object({
  params: z.object({
    id: z.coerce
      .number({ invalid_type_error: 'El ID debe ser un número entero' })
      .int()
      .positive('El ID debe ser mayor a 0')
  }),
  body: z
    .object({
      nombre: z.string().trim().min(2).max(100),
      rut: z.string().trim().regex(rutRegex, 'Formato de RUT inválido'),
      correo: z.string().trim().email('Correo inválido').toLowerCase(),
      password: z.string().min(8, 'Mínimo 8 caracteres'),
      rol: z.enum(rolesValidos)
    })
    .partial() // Hace que todos los campos dentro de body sean opcionales
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Debe proporcionar al menos un campo para actualizar'
    })
});

/**
 * 3. Esquema para validar parámetros de URL con ID (ej: GET /api/usuarios/:id o DELETE)
 */
export const usuarioIdParamSchema = z.object({
  params: z.object({
    id: z.coerce
      .number({ invalid_type_error: 'El ID debe ser un número entero' })
      .int()
      .positive('El ID debe ser mayor a 0')
  })
});