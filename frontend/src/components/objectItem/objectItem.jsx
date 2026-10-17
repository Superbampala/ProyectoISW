import { useState, useEffect } from "react";
import "./objectItem.css";
import ObjectDetailsModal from "../objectDetailsModal/objectDetailsModal";

const LIMIT_MS = 2 * 60 * 60 * 1000; // 2 horas en milisegundos

function formatCategory(categoria = "") {
  const text = categoria.replaceAll("_", " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// devuelve el tiempo restante como "1 h 23 min", o null si ya pasaron las 2 horas
function getTimeLeft(iso, now) {
  if (!iso) return null;
  const remaining = new Date(iso).getTime() + LIMIT_MS - now;
  if (remaining <= 0) return null;

  const totalMinutes = Math.ceil(remaining / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  return `${hours} h ${minutes} min`;
}

export default function ObjectItem({ obj, onUpdated }) {
  const [now, setNow] = useState(Date.now());
  const [isOpen, setIsOpen] = useState(false);

  // actualiza la hora actual cada 30 segundos
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const category = formatCategory(obj.categoria);
  const photo = obj.fotos?.[0]?.urlArchivo;
  const timeLeft = getTimeLeft(obj.fechaRegistro, now);

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
          <span className="card__timer">
            {timeLeft ? `Quedan ${timeLeft}` : "Plazo vencido"}
          </span>
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
