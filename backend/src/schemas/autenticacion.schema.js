import { z } from 'zod';

const rutRegex = /^(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])$/;

// Lista de dominios institucionales autorizados
const DOMINIOS_PERMITIDOS = ['@ubiobio.cl', '@alumnos.ubiobio.cl'];

export const registroSchema = z.object({
  body: z.object({
    nombre: z
      .string({ required_error: 'El nombre es obligatorio' })
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres'),

    rut: z
      .string({ required_error: 'El RUT es obligatorio' })
      .trim()
      .regex(rutRegex, 'Formato de RUT inválido. Ejemplo: 12345678-9'),

    correo: z
      .string({ required_error: 'El correo es obligatorio' })
      .trim()
      .email('Debe ser un correo electrónico válido')
      .refine(
        (email) => DOMINIOS_PERMITIDOS.some((dominio) => email.toLowerCase().endsWith(dominio)),
        { message: 'El correo debe pertenecer al dominio institucional (@ubiobio.cl o @alumnos.ubiobio.cl)' }
      ),

    password: z
      .string({ required_error: 'La contraseña es obligatoria' })
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
  })
});