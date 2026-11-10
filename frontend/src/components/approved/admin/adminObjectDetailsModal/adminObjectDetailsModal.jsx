import "./adminObjectDetailsModal.css";
import ProtectedPhoto from "../../../protectedPhoto/protectedPhoto";

function formatCategory(category = "") {
  return category
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

export default function ObjectDetailsModal({ object, onClose }) {
  function handleBackdropClick(event) {
    event.stopPropagation();
    onClose();
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
          {object.fotos?.length ? (
            <div className="object-details-modal__photo-grid">
              {object.fotos.map((photo) => (
                <ProtectedPhoto
                  key={photo.id}
                  objectId={object.id}
                  photoId={photo.id}
                  alt={`Fotografía de ${formatCategory(object.categoria)}`}
                />
              ))}
            </div>
          ) : (
            <p className="object-details-modal__no-photos">
              Este objeto no tiene fotografías.
            </p>
          )}
        </section>

        <dl className="object-details-modal__fields">
          <div>
            <dt>Categoría</dt>
            <dd>{formatCategory(object.categoria)}</dd>
          </div>
          {object.categoria === "DOCUMENTOS_Y_TARJETAS" && (
            <>
              <div>
                <dt>RUT del titular</dt>
                <dd>{object.titularRut || "No informado"}</dd>
              </div>
              <div>
                <dt>Nombre del titular</dt>
                <dd>{object.titularNombre || "No informado"}</dd>
              </div>
            </>
          )}
          <div>
            <dt>Descripción</dt>
            <dd>{object.descripcion}</dd>
          </div>
          <div>
            <dt>Lugar de hallazgo</dt>
            <dd>{object.lugarHallazgo}</dd>
          </div>
          <div>
            <dt>Punto de entrega</dt>
            <dd>{object.punto?.nombre || `Punto ${object.puntoId}`}</dd>
          </div>
        </dl>

        <div className="object-details-modal__actions">
          <button type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
