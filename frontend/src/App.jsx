import { useState } from "react";
import "./App.css";

import AuthPage from "./components/auth/AuthPage";
import MainMenu from "./components/mainMenu/mainMenu";
import ObjectForm from "./components/objectForm/objectForm";
import PendingObjectsBoard from "./components/pending/pendingObjectsBoard/pendingObjectsBoard";
import ApprovedObjectsBoard from "./components/approved/approvedObjectBoard/approvedObjectBoard";

function App() {
  const [view, setView] = useState("menu");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ubb-session") || "null")?.usuario || null;
    } catch {
      return null;
    }
  });

  if (!user) {
    return <AuthPage onAuthenticated={setUser} />;
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
      }}
      onViewApprovedObjects={() => setView("approved")}
      onViewPendingObjects={() => setView("pending")}
      onRegisterObject={() => setView("form")}
    />
  );
}

export default App;
