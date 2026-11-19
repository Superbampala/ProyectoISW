import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware.js';
import {
  registroSchema,
  verificarCorreoSchema,
  reenviarVerificacionSchema,
  inicioSesionSchema,
  actualizarRolSchema,
  solicitarRecuperacionSchema,
  restablecerPasswordSchema
} from '../schemas/autenticacion.schema.js';
import {
  registrarCuenta,
  verificarCorreo,
  reenviarCorreoVerificacion,
  iniciarSesion,
  obtenerPerfil,
  cerrarSesion,
  solicitarRecuperacionPassword,
  restablecerPassword
} from '../controllers/autenticacion.controller.js';
import { autenticarSesion, exigirRol } from '../middlewares/auth.middleware.js';
import { listarUsuarios, actualizarRol } from '../controllers/autenticacion.controller.js';

const router = Router();

// REGISTRO  DE UNA CUENTA
// POST /api/autenticacion/registro
router.post('/registro', validate(registroSchema), registrarCuenta);

// VERIFICACION DEL ENLACE RECIBIDO POR CORREO
// GET /api/autenticacion/verificar?token=...
router.get('/verificar', validate(verificarCorreoSchema), verificarCorreo);

// REENVIO DEL ENLACE DE VERIFICACION
// POST /api/autenticacion/reenviar-verificacion
router.post('/reenviar-verificacion', validate(reenviarVerificacionSchema), reenviarCorreoVerificacion);

// INICIO DE SESION
router.post('/login', validate(inicioSesionSchema), iniciarSesion);

// SOLICITUD DE RECUPERACION DE CONTRASENA
router.post(
  '/recuperar-password',
  validate(solicitarRecuperacionSchema),
  solicitarRecuperacionPassword
);

// RESTABLECIMIENTO CON TOKEN DE UN SOLO USO
router.post(
  '/restablecer-password',
  validate(restablecerPasswordSchema),
  restablecerPassword
);

// PERFIL DEL USUARIO AUTENTICADO
router.get('/perfil', autenticarSesion, obtenerPerfil);

// CIERRE DE SESION QUE REVOCARA TODOS LOS TOKENS DEL USUARIO
router.post('/logout', autenticarSesion, cerrarSesion);

// PERMITE A ADMIN SISTEMA VER LA LISTA DE USUARIOS 
router.get(
  '/usuarios',
  autenticarSesion,
  exigirRol('ADMIN_SISTEMA'),
  listarUsuarios
);
// PERMITE A ADMIN SISTEMA ACTUALIZAR ROLES
router.patch(
  '/usuarios/:id/rol',
  autenticarSesion,
  exigirRol('ADMIN_SISTEMA'),
  validate(actualizarRolSchema),
  actualizarRol
);

export default router;