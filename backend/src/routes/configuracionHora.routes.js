import { Router } from "express";
import {
  createTimeConfiguration,
  getCurrentTimeConfiguration,
  getTimeConfigurationHistory,
} from "../controllers/configuracionHora.controller.js";
import { autenticarSesion } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  consultarConfiguracionesQuerySchema,
  crearConfiguracionHoraSchema,
} from "../schemas/confighora.schema.js";

const router = Router();

router.get("/", autenticarSesion, getCurrentTimeConfiguration);
router.get(
  "/historial",
  autenticarSesion,
  validate(consultarConfiguracionesQuerySchema),
  getTimeConfigurationHistory,
);
router.post(
  "/",
  autenticarSesion,
  validate(crearConfiguracionHoraSchema),
  createTimeConfiguration,
);

export default router;