import { Router } from 'express';
import {
  crearObjeto,
  listarPuntosEntrega,
} from '../controllers/objeto.controller.js';

const router = Router();

router.post('/', crearObjeto);
router.get('/puntos-entrega', listarPuntosEntrega);

export default router;