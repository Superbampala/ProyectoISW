import { useState } from "react";
import "./App.css";

import MainMenu from "./components/mainMenu/mainMenu";
import ObjectForm from "./components/objectForm/objectForm";
import PendingObjectsBoard from "./components/pending/pendingObjectsBoard/pendingObjectsBoard";
import ApprovedObjectsBoard from "./components/approved/approvedObjectBoard/approvedObjectBoard";
import TimeConfiguration from "./components/timeConfiguration/timeConfiguration";

const currentUser = {
  id: 2,
  rol: "ADMIN_PUNTO",
};

function App() {
  const [view, setView] = useState("menu");

  if (view === "form") {
    return <ObjectForm onBack={() => setView("menu")} />;
  }

  if (view === "approved") {
    return <ApprovedObjectsBoard onBack={() => setView("menu")} />;
  }

  if (view === "pending") {
    return <PendingObjectsBoard onBack={() => setView("menu")} />;
  }

  if (view === "settings") {
    return (
      <TimeConfiguration
        userId={currentUser.id}
        userRole={currentUser.rol}
        onBack={() => setView("menu")}
      />
    );
  }

  return (
    <MainMenu
      userRole={currentUser.rol}
      onViewApprovedObjects={() => setView("approved")}
      onViewPendingObjects={() => setView("pending")}
      onRegisterObject={() => setView("form")}
      onOpenSettings={() => setView("settings")}
    />
  );
}

export default App;
