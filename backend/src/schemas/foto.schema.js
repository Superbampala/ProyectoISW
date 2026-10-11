import { z } from 'zod';

/**
 * 1. Esquema para CREAR / REGISTRAR una foto (POST /api/fotos)
 * Contempla tanto el caso de recibir la URL directa (ej. subida a AWS S3 / Cloudinary)
 * como recibir el objetoId al subir un archivo local con Multer.
 */
export const crearFotoSchema = z.object({
  body: z.object({
    urlArchivo: z
      .string({ required_error: 'La URL o ruta del archivo es obligatoria' })
      .trim()
      .min(1, 'La ruta del archivo no puede estar vacía'),

    // z.coerce es indispensable si los datos vienen de un multipart/form-data (FormData)
    objetoId: z.coerce
      .number({
        required_error: 'El ID del objeto asociado es obligatorio',
        invalid_type_error: 'El ID del objeto debe ser un número entero'
      })
      .int()
      .positive('El ID del objeto debe ser mayor a 0')
  })
});

/**
 * 2. Esquema para CONSULTAR fotos por Objeto (GET /api/objetos/:objetoId/fotos)
 */
export const consultarFotosPorObjetoSchema = z.object({
  params: z.object({
    objetoId: z.coerce
      .number({ invalid_type_error: 'El ID del objeto debe ser un número entero' })
      .int()
      .positive('El ID del objeto debe ser mayor a 0')
  })
});

/**
 * 3. Esquema para ELIMINAR o CONSULTAR una foto por su ID (GET / DELETE /api/fotos/:id)
 */
export const fotoIdParamSchema = z.object({
  params: z.object({
    id: z.coerce
      .number({ invalid_type_error: 'El ID de la foto debe ser un número entero' })
      .int()
      .positive('El ID de la foto debe ser mayor a 0')
  })
});