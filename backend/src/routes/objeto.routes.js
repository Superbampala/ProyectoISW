import { Router } from 'express';
import {
  createObject,
  getDeliveryPoints,
} from '../controllers/object.controller.js';
import { devAuthMiddleware } from '../middlewares/dev-auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { crearObjetoSchema } from '../schemas/object.schema.js';

const router = Router();

router.post('/', devAuthMiddleware, validate(crearObjetoSchema), createObject);
router.get('/puntos-entrega', getDeliveryPoints);

export default router;