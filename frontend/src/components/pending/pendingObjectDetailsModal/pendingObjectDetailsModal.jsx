import "./pendingObjectDetailsModal.css";
import { useState } from "react";
import ConfirmationDialog from "../../confirmationInput/confirmationInput";
import {
  useEditObject,
  useObjectOptions,
  useApproveObject,
  useDeletePendingObject,
  useEditObjectPhotos,
} from "../../../Hooks/useObject";
import ProtectedPhoto from "../../protectedPhoto/protectedPhoto";
import { getSession } from "../../../api/config";

const allowedFields = [
  "categoria",
  "titularRut",
  "titularNombre",
  "descripcion",
  "lugarHallazgo",
  "puntoId",
];

function getInitialForm(object) {
  // recorre allowedFields y crea un objeto con los valores del objeto original, o un string vacío si no existe
  return allowedFields.reduce((form, field) => {
    form[field] = object[field] ?? "";
    return form;
  }, {});
}

function formatCategory(category) {
  return category
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

export default function ObjectDetailsModal({
  object,
  onClose,
  onSaved,
  onApprovalNotice,
}) {
  const [form, setForm] = useState(() => getInitialForm(object));
  const {
    options,
    loading: optionsLoading,
    error: optionsError,
  } = useObjectOptions();
  const { editObject, loading: saving, error: saveError } = useEditObject();
  const {
    deletePendingObject,
    loading: deleting,
    error: deleteError,
  } = useDeletePendingObject();
  const [formError, setFormError] = useState(null);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const { approveObject } = useApproveObject();
  const {
    addPhotos,
    removePhoto,
    loading: photosSaving,
    error: photosError,
  } = useEditObjectPhotos();
  const [removedPhotoIds, setRemovedPhotoIds] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [expandedPhotoId, setExpandedPhotoId] = useState(null);

  const user = getSession()?.usuario;

  const canApproveOrDelete =
    user.rol === "ADMIN_PUNTO" || user.rol === "ADMIN_SISTEMA";
  const busy = saving || deleting || photosSaving;
  const photos = object.fotos || [];

  const visiblePhotos = photos.filter((photo) => {
    return !removedPhotoIds.includes(photo.id);
  });

  function handleBackdropClick(event) {
    event.stopPropagation();
    onClose();
  }

  // actualiza el formulario
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function handlePhotoSelection(event) {
    const selectedPhotos = Array.from(event.target.files || []);
    const availableSlots = 5 - visiblePhotos.length - newPhotos.length;
    if (selectedPhotos.length > availableSlots) {
      setFormError(
        `Puedes tener como máximo 5 fotografías. Espacios disponibles: ${availableSlots}.`,
      );
      event.target.value = "";
      return;
    }

    setFormError(null);
    setNewPhotos((currentPhotos) => [...currentPhotos, ...selectedPhotos]);
  }

  function markPhotoForRemoval(photoId) {
    setRemovedPhotoIds((currentIds) => [...currentIds, photoId]);
  }

  function removeNewPhoto(index) {
    setNewPhotos((currentPhotos) =>
      currentPhotos.filter((_photo, photoIndex) => photoIndex !== index),
    );
  }

  async function showApproveDialog() {
    if (form.categoria === "DOCUMENTOS_Y_TARJETAS") {
      if (!String(form.titularRut || "").trim()) {
        setFormError("El RUT del titular es obligatorio para documentos y tarjetas");
        return;
      }
      if (String(form.titularNombre || "").trim().length < 2) {
        setFormError("El nombre del titular es obligatorio para documentos y tarjetas");
        return;
      }
    }
    setFormError(null);
    setConfirmationAction("APROBAR");
  }

  async function confirmApprove() {
    if (form.categoria === "DOCUMENTOS_Y_TARJETAS") {
      if (!String(form.titularRut || "").trim()) {
        setFormError("El RUT del titular es obligatorio para documentos y tarjetas");
        return;
      }
      if (String(form.titularNombre || "").trim().length < 2) {
        setFormError("El nombre del titular es obligatorio para documentos y tarjetas");
        return;
      }
    }

    try {
      await saveObject();
      const approval = await approveObject(object.id);
      onApprovalNotice?.(
        approval.notification || {
          status: "INFO",
          message: "Objeto aprobado.",
        },
      );
      onSaved?.();
      onClose();
    } catch (error) {
      setFormError(error.message);
    }
  }

  async function showDeleteDialog() {
    setConfirmationAction("ELIMINAR");
  }

  async function confirmDelete() {
    setFormError(null);

    try {
      await deletePendingObject(object.id);
      onSaved?.();
      onClose();
    } catch (error) {
      setFormError(error.message);
    }
  }

  function showSaveDialog(event) {
    // evita que se recarge la pagina
    event.preventDefault();
    setConfirmationAction("GUARDAR");
  }

  async function saveObject() {
    // limpia el error del formulario antes de intentar guardar
    setFormError(null);

    if (form.categoria === "DOCUMENTOS_Y_TARJETAS") {
      if (!String(form.titularRut || "").trim()) {
        const message =
          "El RUT del titular es obligatorio para documentos y tarjetas";
        setFormError(message);
        throw new Error(message);
      }
      if (String(form.titularNombre || "").trim().length < 2) {
        const message =
          "El nombre del titular es obligatorio para documentos y tarjetas";
        setFormError(message);
        throw new Error(message);
      }
    }

    const data = { ...form, puntoId: Number(form.puntoId) };
    if (data.categoria !== "DOCUMENTOS_Y_TARJETAS") {
      data.titularRut = null;
      data.titularNombre = null;
    }

    try {
      await editObject(object.id, data);
      for (const photoId of removedPhotoIds) {
        await removePhoto(object.id, photoId);
      }
      await addPhotos(object.id, newPhotos);
      onSaved?.();
    } catch (error) {
      setFormError(error.message);
      throw error;
    }
  }

  return (
    <div
      className="object-details-modal__backdrop"
      onClick={handleBackdropClick}
    >
      <div
        className="object-details-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <h2>Detalles del objeto</h2>
        <p>ID del objeto: {object.id}</p>

        <section
          className="object-details-modal__photos"
          aria-label="Fotografías del objeto"
        >
          <h3>Fotografías</h3>
          <label className="object-details-modal__photo-input">
            Agregar fotografías
            <input
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={handlePhotoSelection}
              disabled={busy}
            />
          </label>
          {visiblePhotos.length || newPhotos.length ? (
            <div className="object-details-modal__photo-grid">
              {visiblePhotos.map((photo) => (
                <div
                  className="object-details-modal__photo-item"
                  key={photo.id}
                >
                  <ProtectedPhoto
                    objectId={object.id}
                    photoId={photo.id}
                    alt={`Fotografía de ${formatCategory(object.categoria)}`}
                    onClick={() => setExpandedPhotoId(photo.id)}
                  />
                  <button
                    type="button"
                    className="object-details-modal__remove-photo"
                    onClick={() => markPhotoForRemoval(photo.id)}
                    disabled={busy}
                  >
                    Quitar
                  </button>
                </div>
              ))}
              {newPhotos.map((photo, index) => (
                <div
                  className="object-details-modal__photo-item"
                  key={photo.name + photo.lastModified}
                >
                  <span className="object-details-modal__new-photo">
                    {photo.name}
                  </span>
                  <button
                    type="button"
                    className="object-details-modal__remove-photo"
                    onClick={() => removeNewPhoto(index)}
                    disabled={busy}
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="object-details-modal__no-photos">
              Este objeto no tiene fotografías.
            </p>
          )}
        </section>

        {optionsError && (
          <p className="object-details-modal__error">{optionsError}</p>
        )}
        {formError && (
          <p className="object-details-modal__error">{formError}</p>
        )}
        {saveError && !formError && (
          <p className="object-details-modal__error">{saveError}</p>
        )}
        {deleteError && !formError && (
          <p className="object-details-modal__error">{deleteError}</p>
        )}
        {photosError && !formError && (
          <p className="object-details-modal__error">{photosError}</p>
        )}

        <form onSubmit={showSaveDialog}>
          <label>
            Categoría
            <select
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              disabled={optionsLoading || busy}
              required
            >
              <option value="">Selecciona una categoría</option>
              {options.categorias.map((category) => (
                <option key={category} value={category}>
                  {formatCategory(category)}
                </option>
              ))}
            </select>
          </label>

          {form.categoria === "DOCUMENTOS_Y_TARJETAS" && (
            <>
              <label>
                RUT del titular
                <input
                  name="titularRut"
                  value={form.titularRut}
                  onChange={handleChange}
                  disabled={busy}
                  placeholder="xx.xxx.xxx-x"
                />
              </label>

              <label>
                Nombre del titular
                <input
                  name="titularNombre"
                  value={form.titularNombre}
                  onChange={handleChange}
                  disabled={busy}
                />
              </label>
            </>
          )}

          <label>
            Descripción
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              disabled={busy}
              required
              minLength={3}
              maxLength={500}
            />
          </label>

          <label>
            Lugar de hallazgo
            <input
              name="lugarHallazgo"
              value={form.lugarHallazgo}
              onChange={handleChange}
              disabled={busy}
              required
              minLength={3}
              maxLength={200}
            />
          </label>

          <label>
            Punto de entrega
            <select
              name="puntoId"
              value={form.puntoId}
              onChange={handleChange}
              disabled={optionsLoading || busy}
              required
            >
              <option value="">Selecciona un punto</option>
              {options.puntosEntrega.map((point) => (
                <option key={point.id} value={point.id}>
                  {point.nombre}
                </option>
              ))}
            </select>
          </label>

          <div className="object-details-modal__actions">
            <button type="button" onClick={onClose} disabled={busy}>
              Cerrar
            </button>
            <button type="submit" disabled={optionsLoading || busy}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            {canApproveOrDelete && (
              <>
                <button
                  type="button"
                  onClick={showApproveDialog}
                  className="object-details-modal__approve-button"
                  disabled={busy}
                >
                  Aprobar
                </button>
                <button
                  type="button"
                  onClick={showDeleteDialog}
                  className="object-details-modal__delete-button"
                  disabled={busy}
                >
                  {deleting ? "Eliminando..." : "Eliminar"}
                </button>
              </>
            )}
          </div>
        </form>
        {confirmationAction && (
          <ConfirmationDialog
            action={confirmationAction}
            onCancel={() => setConfirmationAction(null)}
            onConfirm={async () => {
              setConfirmationAction(null);
              if (confirmationAction === "GUARDAR") await saveObject();
              if (confirmationAction === "APROBAR") await confirmApprove();
              if (confirmationAction === "ELIMINAR") await confirmDelete();
            }}
          />
        )}
        {expandedPhotoId && (
          <div
            className="object-details-modal__expanded-photo"
            aria-modal="true"
            onClick={(event) => {
              event.stopPropagation();
              setExpandedPhotoId(null);
            }}
          >
            <button
              type="button"
              className="object-details-modal__close-expanded-photo"
              onClick={() => setExpandedPhotoId(null)}
            >
              Cerrar
            </button>
            <ProtectedPhoto
              objectId={object.id}
              photoId={expandedPhotoId}
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
}
