import { ZodError } from 'zod';

/**
 * Middleware genérico para la validación de peticiones HTTP utilizando esquemas de Zod.
 * 
 * @param {import('zod').ZodSchema} schema - Esquema de Zod que define la estructura esperada
 * @returns {Function} Express middleware (req, res, next)
 */
export const validate = (schema) => {
  return (req, res, next) => {
    // Se agrupan 'body', 'query' y 'params' en un solo objeto para validarlos simultáneamente.
    // 'safeParse' ejecuta la validación de forma segura sin lanzar excepciones (no rompe el servidor).
    const result = schema.safeParse({
      body: req.body,     // Datos enviados en el cuerpo JSON de la petición (POST, PUT, PATCH)
      query: req.query,   // Parámetros de búsqueda en la URL
      params: req.params  // Parámetros dinámicos definidos en la ruta
    });

    // Si los datos enviados no cumplen con la estructura o restricciones definidas en el esquema
    if (!result.success) {
      // Mapeamos el arreglo de errores que genera Zod para convertirlo en un formato legible para la API
      const errors = result.error.errors.map((err) => ({
        // err.path indica la ubicación del error
        // 'slice(1)' elimina el primer elemento ('body', 'query' o 'params') para que devuelva el nombre del campo
        // 'join('.')' conecta subcampos si existen objetos anidados
        campo: err.path.slice(1).join('.'), 

        // Mensaje de error personalizado definido en la regla de Zod
        mensaje: err.message
      }));

      // Se interrumpe la ejecución del flujo y se responde inmediatamente al cliente 
      // con un código de estado HTTP 400 (Bad Request) y el desglose de los fallos.
      return res.status(400).json({
        error: 'Error de validación en los datos enviados',
        detalles: errors
      });
    }

    // Validacion correcta, result.data contiene los datos procesados por Zod.
    // Transformaciones automáticas declaradas en los esquemas como:
    // - z.coerce.number() (conversión de string a entero)
    // - .trim() (eliminación de espacios innecesarios)
    // - .toLowerCase() (conversión de correos a minúsculas)
    if (result.data.body) req.body = result.data.body;
    if (result.data.query) req.query = result.data.query;
    if (result.data.params) req.params = result.data.params;

    // Llama a la siguiente función middleware 
    next();
  };
};