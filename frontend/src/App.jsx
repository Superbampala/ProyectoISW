import { useEffect, useState } from "react";
import "./App.css";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { API_URL, getAuthHeaders } from "./api/config";

import AuthPage from "./components/auth/AuthPage";
import MainMenu from "./components/mainMenu/mainMenu";
import ObjectForm from "./components/objectForm/objectForm";
import PendingObjectsBoard from "./components/pending/pendingObjectsBoard/pendingObjectsBoard";
import ApprovedObjectsBoard from "./components/approved/approvedObjectBoard/approvedObjectBoard";
import TimeConfiguration from "./components/timeConfiguration/timeConfiguration";
import UserAdminBoard from "./components/userAdmin/userAdminBoard";

function ProtectedRoute({ user, allowedRoles, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/menu" replace />;
  }
  return children;
}

function App() {
  const [authMessage, setAuthMessage] = useState("");
  const navigate = useNavigate();
  
  // RECUPERA LA SESION LOCAL Y RECHAZA TOKENS AUSENTES O VENCIDOS
  const [user, setUser] = useState(() => {
    try {
      const session = JSON.parse(localStorage.getItem("ubb-session") || "null");
      const payload = session?.token?.split(".")[1];
      const expiresAt = payload
        ? JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))).exp * 1000
        : 0;

      if (!session?.usuario || !session?.token || expiresAt <= Date.now()) {
        localStorage.removeItem("ubb-session");
        return null;
      }

      return session.usuario;
    } catch {
      localStorage.removeItem("ubb-session");
      return null;
    }
  });

  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();

    fetch(`${API_URL}/autenticacion/perfil`, {
      headers: getAuthHeaders(),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          localStorage.removeItem("ubb-session");
          setUser(null);
          setAuthMessage("La sesión no es válida o ha expirado");
          navigate("/login", { replace: true });
          return;
        }
        setUser(data.usuario);
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setAuthMessage("No fue posible validar la sesión");
        }
      });

    return () => controller.abort();
  }, [navigate]);

  const handleLogout = () => {
    fetch(`${API_URL}/autenticacion/logout`, {
      method: "POST",
      headers: getAuthHeaders(),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          setAuthMessage(data.message || "No fue posible cerrar la sesión");
          return;
        }
        localStorage.removeItem("ubb-session");
        setUser(null);
        setAuthMessage("Sesión cerrada");
        navigate("/login", { replace: true });
      })
      .catch(() => {
        setAuthMessage("No fue posible conectar con el servidor");
      });
  };

  // ELIMINA LA SESION LOCAL Y REGRESA AL LOGIN
  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/menu" replace />
          ) : (
            <AuthPage
              initialMessage={authMessage}
              onAuthenticated={(authenticatedUser) => {
                setAuthMessage("");
                setUser(authenticatedUser);
                navigate("/menu", { replace: true });
              }}
            />
          )
        }
      />
      <Route
        path="/verificar-correo"
        element={<AuthPage initialMessage={authMessage} />}
      />
      <Route
        path="/"
        element={
          window.location.search.includes("resetToken=") ? (
            <AuthPage initialMessage={authMessage} />
          ) : user ? (
            <Navigate to="/menu" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/menu"
        element={
          <ProtectedRoute user={user}>
            <MainMenu
              user={user}
              onLogout={handleLogout}
              onViewApprovedObjects={() => navigate("/objetos-aprobados")}
              onViewPendingObjects={() => navigate("/pendientes")}
              onRegisterObject={() => navigate("/registrar-objeto")}
              onManageUsers={() => navigate("/usuarios")}
              onOpenSettings={() => navigate("/configuracion-hora")}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/registrar-objeto"
        element={
          <ProtectedRoute user={user} allowedRoles={["USUARIO_UBB"]}>
            <ObjectForm onBack={() => navigate("/menu")} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/objetos-aprobados"
        element={
          <ProtectedRoute user={user}>
            <ApprovedObjectsBoard onBack={() => navigate("/menu")} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pendientes"
        element={
          <ProtectedRoute
            user={user}
            allowedRoles={["USUARIO_UBB", "ADMIN_PUNTO", "ADMIN_SISTEMA"]}
          >
            <PendingObjectsBoard onBack={() => navigate("/menu")} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute user={user} allowedRoles={["ADMIN_SISTEMA"]}>
            <UserAdminBoard onBack={() => navigate("/menu")} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracion-hora"
        element={
          <ProtectedRoute
            user={user}
            allowedRoles={["ADMIN_PUNTO", "ADMIN_SISTEMA"]}
          >
            <TimeConfiguration
              userId={user?.id}
              userRole={user?.rol}
              onBack={() => navigate("/menu")}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          user ? (
            <Navigate to="/menu" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
