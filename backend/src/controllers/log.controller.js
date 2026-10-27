import * as objectService from "../services/object.services.js";

export const approveLog = async (req, res) => {
  try {
    if (!["ADMIN_PUNTO", "ADMIN_SISTEMA"].includes(req.user?.rol)) {
      return res.status(403).json({
        error: "Solo los administradores pueden aprobar objetos",
      });
    }

    const { objetoId } = req.params;
    const approvedLog = await objectService.approveLog(objetoId, req.user.id);
    res.status(200).json(approvedLog);
  } catch (error) {
    console.error("Error al aprobar el objeto:", error);
    res.status(500).json({ error: "Error al aprobar el objeto" });
  }
};

export const manualRejectLog = async (req, res) => {
  try {
    if (!["ADMIN_PUNTO", "ADMIN_SISTEMA"].includes(req.user?.rol)) {
        return res.status(403).json({
            error: "Solo los administradores pueden rechazar objetos",
        });
    }

    const { objetoId } = req.params;
    const rejectedLog = await objectService.manualRejectLog(objetoId, req.user.id);
    res.status(200).json(rejectedLog);
  } catch (error) {
    console.error("Error al rechazar el objeto:", error);
    res.status(500).json({ error: "Error al rechazar el objeto" });
  }
};
