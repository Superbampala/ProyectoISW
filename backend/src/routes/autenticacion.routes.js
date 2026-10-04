import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { registroSchema,verificarCorreoSchema,reenviarVerificacionSchema } from '../schemas/autenticacion.schema.js';
import { registrarCuenta,verificarCorreo,reenviarCorreoVerificacion } from '../controllers/auntenticacion.controller.js';

const router = Router();

// POST /api/autenticacion/registro
router.post('/registro', validate(registroSchema), registrarCuenta);

// GET /api/autenticacion/verificar?token=...
router.get('/verificar', validate(verificarCorreoSchema), verificarCorreo);

// POST /api/autenticacion/reenviar-verificacion
router.post('/reenviar-verificacion', validate(reenviarVerificacionSchema), reenviarCorreoVerificacion);

export default router;