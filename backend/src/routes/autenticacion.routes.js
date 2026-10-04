import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { registroSchema } from '../schemas/auth.schema.js';
import { registrarCuenta } from '../controllers/auth.controller.js';

const router = Router();

// POST /api/auth/registro
router.post('/registro', validate(registroSchema), registrarCuenta);

export default router;