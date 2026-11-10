import { useState } from "react";
import "./App.css";

import AuthPage from "./components/auth/AuthPage";
import MainMenu from "./components/mainMenu/mainMenu";
import ObjectForm from "./components/objectForm/objectForm";
import PendingObjectsBoard from "./components/pending/pendingObjectsBoard/pendingObjectsBoard";
import ApprovedObjectsBoard from "./components/approved/approvedObjectBoard/approvedObjectBoard";

function App() {
  const [view, setView] = useState("menu");
  const [authMessage, setAuthMessage] = useState("");
  const [user, setUser] = useState(() => {
    try {
      const session = JSON.parse(localStorage.getItem("ubb-session") || "null");
      const payload = session?.token?.split(".")[0];
      const expiresAt = payload
        ? JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))).exp
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

  if (!user) {
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

  return (
    <MainMenu
      user={user}
      onLogout={() => {
        localStorage.removeItem("ubb-session");
        setUser(null);
        setView("menu");
        setAuthMessage("Sesión cerrada");
      }}
      onViewApprovedObjects={() => setView("approved")}
      onViewPendingObjects={() => setView("pending")}
      onRegisterObject={() => setView("form")}
    />
  );
}

export default App;
