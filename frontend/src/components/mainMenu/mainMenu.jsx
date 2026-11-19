import "./mainMenu.css";
import {
  ArrowIcon,
  ListIcon,
  LogoutIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
} from "../icons/icons";

export default function MainMenu({
  user = { nombre: "Usuario", rol: "USUARIO_UBB" },
  onLogout = () => {},
  onViewApprovedObjects = () => {},
  onViewPendingObjects = () => {},
  onRegisterObject = () => {},
  onManageUsers = () => {},
}) {
  const isUser = user.rol === "USUARIO_UBB";
  const isSystemAdmin = user.rol === "ADMIN_SISTEMA";
  const pendingObjectsTitle = isUser ? "Mis objetos pendientes" : "Objetos pendientes";

  return (
    <div className="menu">
      <header className="menu__header">
        <div>
          <h1 className="menu__heading">Gestión de objetos perdidos</h1>
          <span className="menu__user">Hola, {user.nombre}</span>
        </div>
        <div className="menu__header-actions">
          {canManageSettings && (
            <button
              className="menu__settings"
              type="button"
              onClick={onOpenSettings}
              aria-label="Configuración del plazo de entrega"
              title="Configuración"
            >
              <SettingsIcon />
            </button>
          )}
          <button
            className="menu__logout"
            type="button"
            onClick={onLogout}
            aria-label="Cerrar sesión"
          >
            <LogoutIcon />
          </button>
        </div>
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

          {isSystemAdmin && (
            <button
              className="menu__card"
              type="button"
              onClick={onManageUsers}
            >
              <span className="menu__card-icon">
                <SearchIcon />
              </span>
              <span className="menu__card-copy">
                <strong>Administración de usuarios</strong>
                <span>Consultar usuarios y cambiar sus roles</span>
              </span>
              <ArrowIcon />
            </button>
          )}
        </div>

        {isUser && (
          <button
            className="menu__create"
            type="button"
            onClick={onRegisterObject}
            aria-label="Encontré un objeto"
          >
            <PlusIcon />
          </button>
        )}
      </main>
    </div>
  );
}