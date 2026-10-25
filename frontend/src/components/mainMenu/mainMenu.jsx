import "./mainMenu.css";

export default function MainMenu({
  onViewObjects = () => {},
  onViewPending = () => {},
  onRegisterObject = () => {},
}) {
  return (
    <div className="menu">
      <header className="menu__header">
        <h1 className="menu__heading">Gestión de objetos perdidos</h1>
        <button className="menu__logout" type="button" aria-label="Cerrar sesión">
          <LogoutIcon />
        </button>
      </header>

      <main className="menu__content">
        <div className="menu__actions">
          <button className="menu__card" type="button" onClick={onViewObjects}>
            <span className="menu__card-icon">
              <ListIcon />
            </span>
            <span className="menu__card-copy">
              <strong>Listado de objetos perdidos</strong>
              <span>Consultá todos los objetos registrados</span>
            </span>
            <ArrowIcon />
          </button>

          <button className="menu__card" type="button" onClick={onViewPending}>
            <span className="menu__card-icon">
              <SearchIcon />
            </span>
            <span className="menu__card-copy">
              <strong>Objetos pendientes</strong>
              <span>Revisá los objetos encontrados recientemente</span>
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

// ------------------------
// -- dibujos de iconos ---
// ------------------------

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M15 16l4-4-4-4M19 12H9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path
        d="M5 6h14M5 12h14M5 18h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="m15 15 4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="m9 5 7 7-7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}