import * as objectService from "../services/object.services.js";
import prisma from "../config/prisma.js";
import path from "node:path";
import fs from "node:fs/promises";
import { uploadDirectory } from "../middlewares/photo-upload.middleware.js";

const deleteUploadedFiles = (files) =>
  Promise.all(files.map((file) => fs.unlink(file.path).catch(() => undefined)));

const MENSAJE_SIN_PERMISO = "No tienes permiso para realizar esta acción";

const administradorDePuntoAsignado = async (usuarioId, puntoId) =>
  Boolean(await prisma.adminPuntoAsignacion.findUnique({
    where: {
      usuarioId_puntoId: {
        usuarioId: Number(usuarioId),
        puntoId: Number(puntoId),
      },
    },
  }));

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
    const pendingObjects = await objectService.getAllPendingObjects(
      req.query.page,
      req.query.limit,
      req.user,
      {
        categoria: req.query.categoria,
        puntoId: req.query.puntoId,
        desde: req.query.desde,
        hasta: req.query.hasta,
      },
    );
    res.status(200).json(pendingObjects);
  } catch (error) {
    console.error("Error al obtener los objetos pendientes:", error);
    res.status(500).json({ error: "Error al obtener los objetos pendientes" });
  }
};

export const getPendingObjectsByUser = async (req, res) => {
  try {
    const pendingObjects = await objectService.getPendingObjectsByUser(
      req.user.id,
      req.query.page,
      req.query.limit,
      {
        categoria: req.query.categoria,
        puntoId: req.query.puntoId,
        desde: req.query.desde,
        hasta: req.query.hasta,
      },
    );
    res.status(200).json(pendingObjects);
  } catch (error) {
    console.error("Error al obtener los objetos pendientes del usuario:", error);
    res.status(500).json({ error: "Error al obtener los objetos pendientes del usuario" });
  }
};

export const getApprovedObjects = async (req, res) => {
  try {
    const approvedObjects = await objectService.getApprovedObjects(
      req.query.page,
      req.query.limit,
      {
        categoria: req.query.categoria,
        puntoId: req.query.puntoId,
        desde: req.query.desde,
        hasta: req.query.hasta,
      },
      ["ADMIN_PUNTO", "ADMIN_SISTEMA"].includes(req.user?.rol),
    );
    res.status(200).json(approvedObjects);
  } catch (error) {
    console.error("Error al obtener los objetos aprobados:", error);
    res.status(500).json({ error: "Error al obtener los objetos aprobados" });
  }
};

export const getApprovedObjectsForPointAdmin = async (req, res) => {
  if (req.user?.rol !== "ADMIN_PUNTO") {
    return res.status(403).json({
      error: "Solo un administrador de punto puede ver fotografías",
    });
  }

  try {
    const approvedObjects =
      await objectService.getApprovedObjectsForPointAdmin(
        req.query.page,
        req.query.limit,
        {
          categoria: req.query.categoria,
          puntoId: req.query.puntoId,
          desde: req.query.desde,
          hasta: req.query.hasta,
        },
      );
    return res.status(200).json(approvedObjects);
  } catch (error) {
    console.error("Error al obtener los objetos aprobados:", error);
    return res.status(500).json({ error: "Error al obtener los objetos aprobados" });
  }
};

export const createObject = async (req, res) => {
  try {
    const newObject = await objectService.createObject({
      ...req.body,
      usuarioHalladorId: req.user.id,
      usuarioRol: req.user.rol,
    }, req.files);

    const deadline = new Date(newObject.horaLimite).toLocaleTimeString(
      "es-CL",
      {
        timeZone: "America/Santiago",
        hour: "2-digit",
        minute: "2-digit",
      },
    );

    res.status(201).json({
      message: `Objeto pre-inscrito. Entrégalo en ${newObject.punto.nombre} antes de las ${deadline}`,
      preInscripcion: newObject,
    });
  } catch (error) {
    if (error.statusCode === 429) {
      return res.status(429).json({ error: error.message });
    }
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
    if (
      !["USUARIO_UBB", "ADMIN_PUNTO", "ADMIN_SISTEMA"].includes(
        req.user?.rol,
      )
    ) {
      return res.status(403).json({
        error: "No tienes permiso para ver fotografías",
      });
    }

    const photo = await objectService.getObjectPhoto(req.params.photoId);
    if (!photo) return res.status(404).json({ error: "Fotografía no encontrada" });
    if (photo.objetoId !== Number(req.params.objectId)) {
      return res.status(404).json({ error: "Fotografía no encontrada" });
    }

    const isSystemAdmin = req.user?.rol === "ADMIN_SISTEMA";
    const isPointAdmin =
      req.user?.rol === "ADMIN_PUNTO" &&
      await administradorDePuntoAsignado(req.user.id, photo.objeto.puntoId);
    const isOwner = req.user?.id === photo.objeto.usuarioHalladorId;
    if (!isSystemAdmin && !isPointAdmin && !isOwner) {
      return res.status(403).json({ error: MENSAJE_SIN_PERMISO });
    }

    return res.sendFile(path.join(uploadDirectory, photo.urlArchivo));
  } catch (error) {
    console.error("Error al obtener la fotografía:", error);
    return res.status(500).json({ error: "Error al obtener la fotografía" });
  }
};

export const uploadObjectPhotos = async (req, res) => {
  try {
    const objectId = req.params.objectId;
    const uploadedFiles = req.files || [];

    const object = await objectService.getObjectById(objectId);

    if (!object) {
      //porque multer ya los guardo, entonces debemos eliminarlos
      await deleteUploadedFiles(uploadedFiles);

      return res.status(404).json({
        error: "Pre-inscripción no encontrada",
      });
    }

    const isSystemAdmin = req.user?.rol === "ADMIN_SISTEMA";
    const isPointAdmin =
      req.user?.rol === "ADMIN_PUNTO" &&
      await administradorDePuntoAsignado(req.user.id, object.puntoId);
    const isOwner =
      req.user?.id === object.usuarioHalladorId &&
      object.estado === "PENDIENTE";
    const userCanEditPhotos = isSystemAdmin || isPointAdmin || isOwner;

    if (!userCanEditPhotos) {
      //porque multer ya los guardo, entonces debemos eliminarlos
      await deleteUploadedFiles(uploadedFiles);

      return res.status(403).json({
        error: MENSAJE_SIN_PERMISO,
      });
    }

    const photos = await objectService.addObjectPhotos(
      objectId,
      uploadedFiles,
    );

    return res.status(201).json({
      message: "Fotografías agregadas correctamente",
      cantidad: photos.length,
    });
  } catch (error) {
    console.error("Error al agregar fotografías:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: "Error al agregar fotografías",
    });
  }
};

export const deleteObjectPhoto = async (req, res) => {
  try {
    const object = await objectService.getObjectById(req.params.objectId);
    const isSystemAdmin = req.user?.rol === "ADMIN_SISTEMA";
    const isPointAdmin =
      req.user?.rol === "ADMIN_PUNTO" &&
      await administradorDePuntoAsignado(req.user.id, object?.puntoId);
    const isOwner =
      req.user?.id === object?.usuarioHalladorId &&
      object?.estado === "PENDIENTE";

    if (!isSystemAdmin && !isPointAdmin && !isOwner) {
      return res.status(403).json({ error: MENSAJE_SIN_PERMISO });
    }
    await objectService.removeObjectPhoto(
      req.params.objectId,
      req.params.photoId,
    );
    return res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar la fotografía:", error);
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    return res.status(500).json({ error: "Error al eliminar la fotografía" });
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
    const pointAdminAssigned =
      isPointAdmin
        ? await administradorDePuntoAsignado(req.user.id, pre.puntoId)
        : false;

    const canEdit =
      isSystemAdmin ||
      pointAdminAssigned ||
      (isAuthor && !isApproved);

    if (!canEdit) {
      return res.status(403).json({ error: MENSAJE_SIN_PERMISO });
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
    const isAuthor = req.user.id === pre.usuarioHalladorId;
    const isApproved = pre.estado === "APROBADO";
    const pointAdminAssigned =
      isPointAdmin
        ? await administradorDePuntoAsignado(req.user.id, pre.puntoId)
        : false;

    const canApprove =
      (isSystemAdmin || pointAdminAssigned || isAuthor) && !isApproved;

    if (!canApprove) {
      return res.status(403).json({ error: MENSAJE_SIN_PERMISO });
    }

    const updated = await objectService.approveObject(
      req.params.id,
      req.user.id,
    );

    return res.status(200).json(updated);


  }catch (err) {
    console.error(err);
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
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
    const pre = await objectService.getObjectById(req.params.id);
    if (!pre)
      return res.status(404).json({ error: "Pre-inscripción no encontrada" });

    const isAuthor = req.user.id === pre.usuarioHalladorId;
    const pointAdminAssigned =
      isPointAdmin
        ? await administradorDePuntoAsignado(req.user.id, pre.puntoId)
        : false;

    if (!isSystemAdmin && !pointAdminAssigned && !isAuthor) {
      return res.status(403).json({ error: MENSAJE_SIN_PERMISO });
    }
    if (pre.estado !== "PENDIENTE") {
      return res.status(403).json({
        error: "Solo se pueden eliminar objetos pendientes",
      });
    }

    await objectService.deleteObject(req.params.id, req.user.id);

    return res.status(200).json({ message: "Pre-inscripción eliminada correctamente" });
  } catch (err) {
    console.error(err);
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
