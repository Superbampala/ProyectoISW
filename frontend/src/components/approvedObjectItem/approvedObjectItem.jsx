import { useState} from "react";
import "./approvedObjectItem.css";
import ObjectDetailsModal from "../approvedObjectDetailsModal/approvedObjectDetailsModal";

function formatCategory(categoria = "") {
  const text = categoria.replaceAll("_", " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function ObjectItem({ obj }) {
  const [isOpen, setIsOpen] = useState(false);

  const category = formatCategory(obj.categoria);

  function openDetails() {
    setIsOpen(true);
  }

  function closeDetails() {
    setIsOpen(false);
  }

  return (
    <li className="card" role="button" onClick={openDetails}>
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
        />
      )}
    </li>
  );
}
