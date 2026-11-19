import { useEffect, useState } from "react";
import { API_URL, getAuthHeaders } from "../../api/config";
import { BackIcon } from "../icons/icons";
import "./userAdminBoard.css";

export default function UserAdminBoard({ onBack = () => {} }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/autenticacion/usuarios`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No fue posible cargar los usuarios");
      setUsers(data.usuarios);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const changeRole = async (id, rol) => {
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${API_URL}/autenticacion/usuarios/${id}/rol`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ rol }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No fue posible cambiar el rol");
      setMessage(data.message);
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="user-admin">
      <header className="user-admin__header">
        <button className="user-admin__back" type="button" onClick={onBack} aria-label="Volver">
          <BackIcon />
        </button>
        <h1>Administración de usuarios</h1>
      </header>
      <main className="user-admin__content">
        {loading && <p>Cargando usuarios...</p>}
        {error && <p className="user-admin__error">{error}</p>}
        {message && <p className="user-admin__message">{message}</p>}
        {!loading && users.map((usuario) => (
          <div className="user-admin__row" key={usuario.id}>
            <div>
              <strong>{usuario.nombre}</strong>
              <span>{usuario.correo}</span>
            </div>
            <select
              aria-label={`Rol de ${usuario.nombre}`}
              value={usuario.rol}
              onChange={(event) => changeRole(usuario.id, event.target.value)}
            >
              <option value="USUARIO_UBB">Usuario UBB</option>
              <option value="ADMIN_PUNTO">Administrador de punto</option>
              <option value="ADMIN_SISTEMA">Administrador del sistema</option>
            </select>
          </div>
        ))}
      </main>
    </div>
  );
}
