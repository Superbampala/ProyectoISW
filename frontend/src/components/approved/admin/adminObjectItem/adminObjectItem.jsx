import { useState} from "react";
import "./adminObjectItem.css";
import ObjectDetailsModal from "../adminObjectDetailsModal/adminObjectDetailsModal";

function formatCategory(categoria = "") {
  const text = categoria.replaceAll("_", " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function AdminObjectItem({ obj, onUpdated }) {
  const [isOpen, setIsOpen] = useState(false);

  const category = formatCategory(obj.categoria);
  const photo = obj.fotos?.[0]?.urlArchivo;

  function openDetails() {
    setIsOpen(true);
  }

  function closeDetails() {
    setIsOpen(false);
  }

  return (
    <li
      className="card"
      role="button"
      onClick={openDetails}
    >
      <div className="card__media">
        {photo ? (
          <img src={photo} alt={category} loading="lazy" />
        ) : (
          <span className="card__placeholder">Sin foto</span>
        )}
        {obj.fotos?.length > 1 && (
          <span className="card__count">{obj.fotos.length} fotos</span>
        )}
      </div>
      <div className="card__body">
        <div className="card__header">
          <h2 className="card__title">{category}</h2>
        </div>
        <p className="card__text">{obj.descripcion}</p>
        <p className="card__meta">{obj.lugarHallazgo}</p>
      </div>
      {isOpen && (
        <ObjectDetailsModal
          object={obj}
          onClose={closeDetails}
          onSaved={onUpdated}
        />
      )}
    </li>
  );
}
