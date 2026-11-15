import * as configuracionHoraService from "../services/configuracionHora.services.js";

const requireConfigurationAdmin = (req, res) => {
  if (["ADMIN_SISTEMA", "ADMIN_PUNTO"].includes(req.user?.rol)) return true;

  res.status(403).json({
    error: "Solo un administrador o encargado puede gestionar la hora límite",
  });
  return false;
};

export const getCurrentTimeConfiguration = async (req, res) => {
  if (!requireConfigurationAdmin(req, res)) return;

  try {
    const configuration =
      await configuracionHoraService.getCurrentTimeConfiguration();
    return res.status(200).json(configuration);
  } catch (error) {
    console.error("Error al obtener la configuración de hora:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener la configuración de hora" });
  }
};

export const createTimeConfiguration = async (req, res) => {
  if (!requireConfigurationAdmin(req, res)) return;

  try {
    const configuration =
      await configuracionHoraService.createTimeConfiguration(
        req.body.horasLimite,
        req.user.id,
      );
    return res.status(201).json({
      message: "La hora límite fue actualizada",
      configuracion: configuration,
    });
  } catch (error) {
    console.error("Error al actualizar la configuración de hora:", error);
    return res
      .status(500)
      .json({ error: "Error al actualizar la configuración de hora" });
  }
};

export const getTimeConfigurationHistory = async (req, res) => {
  if (!requireConfigurationAdmin(req, res)) return;

  try {
    const history =
      await configuracionHoraService.getTimeConfigurationHistory(req.query);
    return res.status(200).json(history);
  } catch (error) {
    console.error("Error al obtener el historial de configuración:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener el historial de configuración" });
  }
};