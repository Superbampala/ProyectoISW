import { useEffect, useState } from "react";
import "./App.css";
import { API_URL, getAuthHeaders } from "./api/config";

import AuthPage from "./components/auth/AuthPage";
import MainMenu from "./components/mainMenu/mainMenu";
import ObjectForm from "./components/objectForm/objectForm";
import PendingObjectsBoard from "./components/pending/pendingObjectsBoard/pendingObjectsBoard";
import ApprovedObjectsBoard from "./components/approved/approvedObjectBoard/approvedObjectBoard";

function App() {
  const [view, setView] = useState("menu");
  const [authMessage, setAuthMessage] = useState("");
  
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
          setView("menu");
          setAuthMessage("La sesión no es válida o ha expirado");
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
  }, []);

  if (!user) {
    // SIN SESION, LA APLICACION SOLO MUESTRA LAS PANTALLAS DE AUTH
    return (
      <AuthPage
        initialMessage={authMessage}
        onAuthenticated={(authenticatedUser) => {
          setAuthMessage("");
          setUser(authenticatedUser);
        }}
      />
    );
  }

  if (view === "form") {
    return <ObjectForm onBack={() => setView("menu")} />;
  }

  if (view === "approved") {
    return <ApprovedObjectsBoard onBack={() => setView("menu")} />;
  }

  if (view === "pending") {
    return <PendingObjectsBoard onBack={() => setView("menu")} />;
  }

  // ELIMINA LA SESION LOCAL Y REGRESA AL LOGIN
  return (
    <MainMenu
      user={user}
      onLogout={() => {
        fetch(`${API_URL}/autenticacion/logout`, {
          method: "POST",
          headers: getAuthHeaders(),
        })
          .then(async (response) => {
            const data = await response.json();
            if (!response.ok) {
              setAuthMessage(
                data.message || "No fue posible cerrar la sesión",
              );
              return;
            }
            localStorage.removeItem("ubb-session");
            setUser(null);
            setView("menu");
            setAuthMessage("Sesión cerrada");
          })
          .catch(() => {
            setAuthMessage("No fue posible conectar con el servidor");
          });
      }}
      onViewApprovedObjects={() => setView("approved")}
      onViewPendingObjects={() => setView("pending")}
      onRegisterObject={() => setView("form")}
    />
  );
}

export default App;
