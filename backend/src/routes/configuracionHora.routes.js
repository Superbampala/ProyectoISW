import { Router } from "express";
import {
  createTimeConfiguration,
  getCurrentTimeConfiguration,
  getTimeConfigurationHistory,
} from "../controllers/configuracionHora.controller.js";
import { devAuthMiddleware } from "../middlewares/dev-auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  consultarConfiguracionesQuerySchema,
  crearConfiguracionHoraSchema,
} from "../schemas/confighora.schema.js";

const router = Router();

router.get("/", devAuthMiddleware, getCurrentTimeConfiguration);
router.get(
  "/historial",
  devAuthMiddleware,
  validate(consultarConfiguracionesQuerySchema),
  getTimeConfigurationHistory,
);
router.post(
  "/",
  devAuthMiddleware,
  validate(crearConfiguracionHoraSchema),
  createTimeConfiguration,
);

export default router;