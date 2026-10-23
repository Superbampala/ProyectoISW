import "./approvedObjectDetailsModal.css";

function formatCategory(category) {
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

        <dl className="object-details-modal__details">
          <div>
            <dt>Categoría</dt>
            <dd>{formatCategory(object.categoria)}</dd>
          </div>
          <div>
            <dt>Descripción</dt>
            <dd>{object.descripcion}</dd>
          </div>
          <div>
            <dt>Lugar de hallazgo</dt>
            <dd>{object.lugarHallazgo}</dd>
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