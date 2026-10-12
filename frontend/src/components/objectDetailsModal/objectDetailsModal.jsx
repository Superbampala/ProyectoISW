import { useEffect } from "react";
import "./objectDetailsModal.css";

export default function ObjectDetailsModal({ objectId, onClose }) {

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

        <p>ID del objeto: {objectId}</p>

        <p>
          Próximamente aquí estarán los campos para editar el objeto.
        </p>

        <button type="button" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}