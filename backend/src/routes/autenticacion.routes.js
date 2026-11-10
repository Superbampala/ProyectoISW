import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware.js';
import {
  registroSchema,
  verificarCorreoSchema,
  reenviarVerificacionSchema,
  inicioSesionSchema,
  actualizarRolSchema
} from '../schemas/autenticacion.schema.js';
import {
  registrarCuenta,
  verificarCorreo,
  reenviarCorreoVerificacion,
  iniciarSesion
} from '../controllers/autenticacion.controller.js';
import { autenticarSesion, exigirRol } from '../middlewares/auth.middleware.js';
import { listarUsuarios, actualizarRol } from '../controllers/autenticacion.controller.js';

const router = Router();

// POST /api/autenticacion/registro
router.post('/registro', validate(registroSchema), registrarCuenta);

// GET /api/autenticacion/verificar?token=...
router.get('/verificar', validate(verificarCorreoSchema), verificarCorreo);

// POST /api/autenticacion/reenviar-verificacion
router.post('/reenviar-verificacion', validate(reenviarVerificacionSchema), reenviarCorreoVerificacion);

router.post('/login', validate(inicioSesionSchema), iniciarSesion);
router.post('/iniciar-sesion', validate(inicioSesionSchema), iniciarSesion);

router.get(
  '/usuarios',
  autenticarSesion,
  exigirRol('ADMIN_SISTEMA'),
  listarUsuarios
);
router.patch(
  '/usuarios/:id/rol',
  autenticarSesion,
  exigirRol('ADMIN_SISTEMA'),
  validate(actualizarRolSchema),
  actualizarRol
);

export default router;