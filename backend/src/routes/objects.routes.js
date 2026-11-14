import { Router } from 'express';
import {
  createObject,
  getDeliveryPoints,
  getObjectPhoto,
  uploadObjectPhotos,
  deleteObjectPhoto,
} from '../controllers/object.controller.js';
import { devAuthMiddleware } from '../middlewares/dev-auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { crearObjetoSchema } from '../schemas/object.schema.js';
import { uploadObjectPhotos as uploadObjectPhotosMiddleware } from '../middlewares/photo-upload.middleware.js';

const router = Router();

router.post('/', devAuthMiddleware, uploadObjectPhotos, validate(crearObjetoSchema), createObject);
router.get('/puntos-entrega', getDeliveryPoints);
router.post('/:objectId/photos', devAuthMiddleware, uploadObjectPhotosMiddleware, uploadObjectPhotos);
router.get('/:objectId/photos/:photoId', devAuthMiddleware, getObjectPhoto);
router.delete('/:objectId/photos/:photoId', devAuthMiddleware, deleteObjectPhoto);

export default router;