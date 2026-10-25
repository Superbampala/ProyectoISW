import { useState } from "react";
import "./App.css";

import MainMenu from "./components/mainMenu/mainMenu";
import ObjectForm from "./components/objectForm/objectForm";
import PendingObjectsBoard from "./components/pending/pendingObjectsBoard/pendingObjectsBoard";
import ApprovedObjectsBoard from "./components/approved/approvedObjectBoard/approvedObjectBoard";

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

  return (
    <MainMenu
      onViewApprovedObjects={() => setView("approved")}
      onViewPendingObjects={() => setView("pending")}
      onRegisterObject={() => setView("form")}
    />
  );
}

export default App;
