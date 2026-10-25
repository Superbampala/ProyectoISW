import { useGetApprovedObjects } from "../../../Hooks/useObject";
import "./approvedObjectBoard.css";
import UserObjectItem from "../user/userObjectItem/userObjectItem";
import AdminObjectItem from "../admin/adminObjectItem/adminObjectItem";
import { BackIcon } from "../../icons/icons";

export default function ObjectsBoard({ onBack = () => {} }) {
  const { objects, loading, error, refetch } = useGetApprovedObjects();

  //solo de prueba, se debe eliminar cuando se implemente la autenticación
  const user = {
    rol: "ADMIN_PUNTO",
  };

  return (
    <div className="board">
      <header className="board__header">
        <button className="board__back" onClick={onBack} aria-label="Volver">
          <BackIcon />
        </button>
        <h1 className="board__heading">Listado de objetos perdidos</h1>
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
              user.rol === "USUARIO_UBB" ? (
                <UserObjectItem key={obj.id} obj={obj} />
              ) : (
                <AdminObjectItem key={obj.id} obj={obj} />
              )
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
