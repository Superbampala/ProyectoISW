import * as objectService from "../services/object.services.js";
import path from "node:path";
import { uploadDirectory } from "../middlewares/photo-upload.middleware.js";

export const getObjectOptions = async (req, res) => {
  try {
    const options = await objectService.getObjectOptions();
    res.status(200).json(options);
  } catch (error) {
    console.error("Error al obtener las opciones de objetos:", error);
    res.status(500).json({ error: "Error al obtener las opciones de objetos" });
  }
};

export const getAllPendingObjects = async (req, res) => {
  try {
    if (!["ADMIN_PUNTO", "ADMIN_SISTEMA"].includes(req.user?.rol)) {
      return res.status(403).json({
        error: "Solo los administradores pueden revisar pre-inscripciones",
      });
    }

    const pendingObjects = await objectService.getAllPendingObjects();
    res.status(200).json(pendingObjects);
  } catch (error) {
    console.error("Error al obtener los objetos pendientes:", error);
    res.status(500).json({ error: "Error al obtener los objetos pendientes" });
  }
};

export const getPendingObjectsByUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Se requiere autenticación para revisar pre-inscripciones",
      });
    }

    const pendingObjects = await objectService.getPendingObjectsByUser(req.user.id);
    res.status(200).json(pendingObjects);
  } catch (error) {
    console.error("Error al obtener los objetos pendientes del usuario:", error);
    res.status(500).json({ error: "Error al obtener los objetos pendientes del usuario" });
  }
};

export const getApprovedObjects = async (req, res) => {
  try {
    const approvedObjects = await objectService.getApprovedObjects();
    res.status(200).json(approvedObjects);
  } catch (error) {
    console.error("Error al obtener los objetos aprobados:", error);
    res.status(500).json({ error: "Error al obtener los objetos aprobados" });
  }
};

export const createObject = async (req, res) => {
  try {
    const newObject = await objectService.createObject({
      ...req.body,
      usuarioHalladorId: req.user.id,
    }, req.files);

    const deadline = new Date(newObject.horaLimite).toLocaleTimeString(
      "es-CL",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    );

    res.status(201).json({
      message: `Objeto pre-inscrito. Entrégalo en ${newObject.punto.nombre} antes de las ${deadline}`,
      preInscripcion: newObject,
    });
  } catch (error) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "Cada fotografía debe pesar como máximo 10 MB",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: "Solo se permiten hasta 5 fotografías JPEG o PNG",
      });
    }
    console.error("Error al crear el objeto:", error);
    res.status(500).json({ error: "Error al crear el objeto" });
  }
};

export const getObjectPhoto = async (req, res) => {
  try {
    const photo = await objectService.getObjectPhoto(req.params.photoId);
    if (!photo) return res.status(404).json({ error: "Fotografía no encontrada" });
    if (photo.objetoId !== Number(req.params.objectId)) {
      return res.status(404).json({ error: "Fotografía no encontrada" });
    }

    const isAdmin = ["ADMIN_PUNTO", "ADMIN_SISTEMA"].includes(req.user?.rol);
    const isOwner = req.user?.id === photo.objeto.usuarioHalladorId;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: "No tienes permiso para ver esta fotografía" });
    }

    return res.sendFile(path.join(uploadDirectory, photo.urlArchivo));
  } catch (error) {
    console.error("Error al obtener la fotografía:", error);
    return res.status(500).json({ error: "Error al obtener la fotografía" });
  }
};

export const getDeliveryPoints = async (req, res) => {
  try {
    const deliveryPoints = await objectService.getDeliveryPoints();
    res.status(200).json(deliveryPoints);
  } catch (error) {
    console.error("Error al listar los puntos de entrega:", error);
    res.status(500).json({ error: "Error al listar los puntos de entrega" });
  }
};

export const updateObject = async (req, res) => {
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
        data.titularRut = null;
        data.titularNombre = null;
      } else if (
        req.body.titularRut !== undefined ||
        req.body.titularNombre !== undefined
      ) {
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

export const approveObject = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Se requiere autenticación para aprobar un objeto",
      });
    }

    const pre = await objectService.getObjectById(req.params.id);
    if (!pre)
      return res.status(404).json({ error: "Pre-inscripción no encontrada" });

    const isPointAdmin = req.user.rol === "ADMIN_PUNTO";
    const isSystemAdmin = req.user.rol === "ADMIN_SISTEMA";
    const isApproved = pre.estado === "APROBADO";

    const canApprove = (isSystemAdmin || isPointAdmin ) && !isApproved;

    if (!canApprove) {
      const error =
        isApproved
          ? "La pre-inscripción ya fue aprobada y no puede ser aprobada nuevamente"
          : "No tienes permiso para realizar esta acción";
      return res.status(403).json({ error });
    }

    const updated = await objectService.approveObject(req.params.id);

    return res.status(200).json(updated);


  }catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const deletePendingObject = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Se requiere autenticación para eliminar un objeto",
      });
    }
    const isPointAdmin = req.user.rol === "ADMIN_PUNTO";
    const isSystemAdmin = req.user.rol === "ADMIN_SISTEMA";

    if (!isSystemAdmin && !isPointAdmin) {
      return res.status(403).json({ error: "No tienes permiso para realizar esta acción" });
    }

    const pre = await objectService.getObjectById(req.params.id);
    if (!pre)
      return res.status(404).json({ error: "Pre-inscripción no encontrada" });
    if (pre.estado !== "PENDIENTE") {
      return res.status(403).json({
        error: "Solo se pueden eliminar objetos pendientes",
      });
    }

    const deleted = await objectService.deleteObject(req.params.id);
    if (!deleted) {
      return res.status(409).json({
        error: "El objeto dejó de estar pendiente y no pudo eliminarse",
      });
    }

    return res.status(200).json({ message: "Pre-inscripción eliminada correctamente" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
