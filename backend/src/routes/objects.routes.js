import { Router } from 'express';
import {
  createObject,
  getDeliveryPoints,
  getObjectPhoto,
  uploadObjectPhotos,
  deleteObjectPhoto,
  updateObject,
  getApprovedObjects,
  getAllPendingObjects,
  getPendingObjectsByUser,
  approveObject,
  getObjectOptions,
  deletePendingObject,
} from '../controllers/object.controller.js';
import { autenticarSesion, exigirRol } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  actualizarObjetoSchema,
  consultarObjetosQuerySchema,
  objetoIdParamSchema,
  crearObjetoSchema,
} from '../schemas/object.schema.js';
import {
  fotoObjetoParamsSchema,
  objetoFotoParamSchema,
} from '../schemas/foto.schema.js';
import { uploadObjectPhotos as uploadObjectPhotosMiddleware } from '../middlewares/photo-upload.middleware.js';

const router = Router();

router.post('/', autenticarSesion, exigirRol('USUARIO_UBB'), uploadObjectPhotosMiddleware, validate(crearObjetoSchema), createObject);
router.get('/', validate(consultarObjetosQuerySchema), getApprovedObjects);
router.get('/pending', autenticarSesion, exigirRol('ADMIN_PUNTO', 'ADMIN_SISTEMA'), validate(consultarObjetosQuerySchema), getAllPendingObjects);
router.get('/pending/user', autenticarSesion, exigirRol('USUARIO_UBB'), validate(consultarObjetosQuerySchema), getPendingObjectsByUser);
router.get('/options', getObjectOptions);
router.get('/puntos-entrega', getDeliveryPoints);
router.patch('/:id', autenticarSesion, validate(actualizarObjetoSchema), updateObject);
router.patch('/:id/approve', autenticarSesion, exigirRol('ADMIN_PUNTO', 'ADMIN_SISTEMA'), validate(objetoIdParamSchema), approveObject);
router.delete('/:id', autenticarSesion, exigirRol('ADMIN_PUNTO', 'ADMIN_SISTEMA'), validate(objetoIdParamSchema), deletePendingObject);
router.post(
  '/:objectId/photos',
  autenticarSesion,
  validate(objetoFotoParamSchema),
  uploadObjectPhotosMiddleware,
  uploadObjectPhotos
);
router.get(
  '/:objectId/photos/:photoId',
  autenticarSesion,
  validate(fotoObjetoParamsSchema),
  getObjectPhoto
);
router.delete(
  '/:objectId/photos/:photoId',
  autenticarSesion,
  validate(fotoObjetoParamsSchema),
  deleteObjectPhoto
);

export default router;