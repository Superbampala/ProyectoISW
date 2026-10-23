import { usePendingObjects } from "../../../Hooks/useObject";
import "./pendingObjectsBoard.css";
import ObjectItem from "../pendingObjectItem/pendingObjectItem";
import { BackIcon } from "../../icons/icons";

export default function ObjectsBoard({
  onBack = () => {},
}) {
  const { objects, loading, error, refetch, isUserScope } =
    usePendingObjects();

  return (
    <div className="board">
      <header className="board__header">
        <button className="board__back" onClick={onBack} aria-label="Volver">
          <BackIcon />
        </button>
        <h1 className="board__heading">
          {isUserScope ? "Mis objetos pendientes" : "Objetos pendientes"}
        </h1>
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
          <p className="board__state">
            {isUserScope
              ? "No tienes objetos pendientes."
              : "No hay objetos pendientes."}
          </p>
        )}

        {!loading && !error && objects.length > 0 && (
          <ul className="board__grid">
            {objects.map((obj) => (
              <ObjectItem key={obj.id} obj={obj} onUpdated={refetch} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
