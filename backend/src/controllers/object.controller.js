import * as objectService from "../services/object.services.js";

export const getPendingObjects = async (req, res) => {
  try {
    const pendingObjects = await objectService.getPendingObjects();
    res.status(200).json(pendingObjects);
  } catch (error) {
    console.error("Error al obtener los objetos pendientes:", error);
    res.status(500).json({ error: "Error al obtener los objetos pendientes" });
  }
};

export const editObject = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Se requiere autenticación para editar un objeto",
      });
    }

    const pre = await objectService.getObjectById(req.params.id);
    if (!pre)
      return res.status(404).json({ error: "Pre-inscripción no encontrada" });

    const isPointAdmin = req.user.rol === "ADMIN_PUNTO";
    const isSystemAdmin = req.user.rol === "ADMIN_SISTEMA";
    const isAuthor = req.user.id === pre.usuarioHalladorId;
    const isApproved = pre.estado === "APROBADO";

    const canEdit = isSystemAdmin || isPointAdmin || (isAuthor && !isApproved);

    if (!canEdit) {
      const error =
        isAuthor && isApproved
          ? "La pre-inscripción ya fue aprobada y no puede ser editada por su autor"
          : "No tienes permiso para realizar esta acción";
      return res.status(403).json({ error });
    }

    const allowedFields = [
      "categoria",
      "titularRut",
      "titularNombre",
      "descripcion",
      "lugarHallazgo",
      "puntoId",
    ];

    const data = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }

    if (Object.keys(data).length === 0) {
      return res
        .status(400)
        .json({ error: "No se enviaron campos para editar" });
    }

    const finalCategory = data.categoria ?? pre.categoria;
    const isDocument = finalCategory === "DOCUMENTOS_Y_TARJETAS";

    if (!isDocument) {
      if (data.categoria !== undefined) {
        // se envio categoria, por ejemlo si se cambia de documentos a otro tipo, se borran los datos del titular
        // nota: undefined no toca el campo, null si lo sobreescribe
        data.titularRut = null;
        data.titularNombre = null;
      } else if (req.body.titularRut !== undefined || req.body.titularNombre !== undefined) {
        // se envio el titular pero no es documento
        return res.status(400).json({
          error:
            "Solo los objetos de categoría 'documentos' pueden tener titular",
        });
      }
    }

    const updated = await objectService.updateObject(req.params.id, data);

    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
