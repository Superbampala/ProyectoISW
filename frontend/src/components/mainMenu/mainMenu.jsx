import "./mainMenu.css";
import {
  ArrowIcon,
  ListIcon,
  LogoutIcon,
  PlusIcon,
  SearchIcon,
} from "../icons/icons";

export default function MainMenu({
  user = { nombre: "Usuario", rol: "USUARIO_UBB" },
  onLogout = () => {},
  onViewApprovedObjects = () => {},
  onViewPendingObjects = () => {},
  onRegisterObject = () => {},
}) {
  const pendingObjectsTitle =
    user.rol === "USUARIO_UBB" ? "Mis objetos pendientes" : "Objetos pendientes";

  return (
    <div className="menu">
      <header className="menu__header">
        <div>
          <h1 className="menu__heading">Gestión de objetos perdidos</h1>
          <span className="menu__user">Hola, {user.nombre}</span>
        </div>
        <button className="menu__logout" type="button" aria-label="Cerrar sesión" onClick={onLogout}>
          <LogoutIcon />
        </button>
      </header>

      <main className="menu__content">
        <div className="menu__actions">
          <button
            className="menu__card"
            type="button"
            onClick={onViewApprovedObjects}
          >
            <span className="menu__card-icon">
              <ListIcon />
            </span>
            <span className="menu__card-copy">
              <strong>Listado de objetos perdidos</strong>
              <span>Consultá todos los objetos registrados</span>
            </span>
            <ArrowIcon />
          </button>

          <button
            className="menu__card"
            type="button"
            onClick={onViewPendingObjects}
          >
            <span className="menu__card-icon">
              <SearchIcon />
            </span>
            <span className="menu__card-copy">
              <strong>{pendingObjectsTitle}</strong>
              <span>Revisar los objetos encontrados recientemente</span>
            </span>
            <ArrowIcon />
          </button>
        </div>

        <button
          className="menu__create"
          type="button"
          onClick={onRegisterObject}
          aria-label="Encontré un objeto"
        >
          <PlusIcon />
        </button>
      </main>
    </div>
  );
}