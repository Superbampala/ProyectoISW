import { Router } from 'express';
import {
  createObject,
  getDeliveryPoints,
  getObjectPhoto,
} from '../controllers/object.controller.js';
import { devAuthMiddleware } from '../middlewares/dev-auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { crearObjetoSchema } from '../schemas/object.schema.js';
import { uploadObjectPhotos } from '../middlewares/photo-upload.middleware.js';

const router = Router();

router.post('/', devAuthMiddleware, uploadObjectPhotos, validate(crearObjetoSchema), createObject);
router.get('/puntos-entrega', getDeliveryPoints);
router.get('/:objectId/photos/:photoId', devAuthMiddleware, getObjectPhoto);

export default router;