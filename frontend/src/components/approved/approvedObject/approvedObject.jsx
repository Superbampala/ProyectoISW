import { useGetApprovedObjects } from "../../../Hooks/useObject";
import "../../pending/pendingObjectsBoard/pendingObjectsBoard.css";
import ObjectItem from "../approvedObjectItem/approvedObjectItem";
import { BackIcon } from "../../icons/icons";

export default function ObjectsBoard({ onBack = () => {} }) {
  const { objects, loading, error, refetch } = useGetApprovedObjects();

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
          <p className="board__state">No hay objetos perdidos</p>
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
