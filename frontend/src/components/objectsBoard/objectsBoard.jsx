import { usePendingObjects } from "../../Hooks/useObject";
import "./ObjectsBoard.css";
import ObjectItem from "../objectItem/objectItem";

export default function ObjectsBoard({ onBack = () => {} }) {
  const { objects, loading, error, refetch } = usePendingObjects();

  return (
    <div className="board">
      <header className="board__header">
        <button className="board__back" onClick={onBack} aria-label="Volver">
          <BackIcon />
        </button>
        <h1 className="board__heading">Objetos perdidos</h1>
      </header>

      <main className="board__content">
        {loading && <p className="board__state">Cargando...</p>}

        {error && (
          <div className="board__state">
            <p>{error}</p>
            <button className="board__button" onClick={refetch}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && objects.length === 0 && (
          <p className="board__state">No hay objetos pendientes.</p>
        )}

        {!loading && !error && objects.length > 0 && (
          <ul className="board__grid">
            {objects.map((obj) => (
              <ObjectItem key={obj.id} obj={obj} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M15 5l-7 7 7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
