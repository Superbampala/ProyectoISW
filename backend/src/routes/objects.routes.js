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
import { devAuthMiddleware } from '../middlewares/dev-auth.middleware.js';
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

router.post('/', devAuthMiddleware, uploadObjectPhotos, validate(crearObjetoSchema), createObject);
router.get('/', validate(consultarObjetosQuerySchema), getApprovedObjects);
router.get('/pending', devAuthMiddleware, validate(consultarObjetosQuerySchema), getAllPendingObjects);
router.get('/pending/user', devAuthMiddleware, validate(consultarObjetosQuerySchema), getPendingObjectsByUser);
router.get('/options', getObjectOptions);
router.get('/puntos-entrega', getDeliveryPoints);
router.patch('/:id', devAuthMiddleware, validate(actualizarObjetoSchema), updateObject);
router.patch('/:id/approve', devAuthMiddleware, validate(objetoIdParamSchema), approveObject);
router.delete('/:id', devAuthMiddleware, validate(objetoIdParamSchema), deletePendingObject);
router.post(
  '/:objectId/photos',
  devAuthMiddleware,
  validate(objetoFotoParamSchema),
  uploadObjectPhotosMiddleware,
  uploadObjectPhotos
);
router.get(
  '/:objectId/photos/:photoId',
  devAuthMiddleware,
  validate(fotoObjetoParamsSchema),
  getObjectPhoto
);
router.delete(
  '/:objectId/photos/:photoId',
  devAuthMiddleware,
  validate(fotoObjetoParamsSchema),
  deleteObjectPhoto
);

export default router;