/**
 * Middleware genérico de validación con Zod.
 * @param {import('zod').ZodSchema} schema - Esquema de validación de Zod
 * @param {'body' | 'params' | 'query'} [target='body'] - Parte de la petición a validar
 */
export const validate = (schema, target = 'body') => {
  return (req, res, next) => {
    // safeParse no lanza errores (evita bloques try-catch innecesarios)
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      // Formatear los errores de Zod para una respuesta legible al cliente
      const errors = result.error.errors.map((err) => ({
        campo: err.path.join('.'),
        mensaje: err.message
      }));

      return res.status(400).json({
        error: 'Error de validación en los datos enviados',
        detalles: errors
      });
    }

    // Reemplaza los datos con los validados y sanitizados por Zod
    req[target] = result.data;
    next();
  };
};
