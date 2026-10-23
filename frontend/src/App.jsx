import { useState } from "react";
import "./App.css";

import MainMenu from "./components/mainMenu/mainMenu";
import PendingObjectsBoard from "./components/pending/pendingObjectsBoard/pendingObjectsBoard";
import ApprovedObjectsBoard from "./components/approved/approvedObject/approvedObject";

function App() {
  const [view, setView] = useState("menu");

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
    />
  );
}

export default App;
