import { useState } from "react";
import "./App.css";

import MainMenu from "./components/mainMenu/mainMenu";
import ObjectForm from "./components/objectForm/objectForm";
import ObjectsBoard from "./components/objectsBoard/objectsBoard";

function App() {
  const [screen, setScreen] = useState("menu");
  const [showPending, setShowPending] = useState(false);

  if (screen === "form") {
    return <ObjectForm onBack={() => setScreen("menu")} />;
  }

  if (screen === "objects") {
    return (
      <ObjectsBoard
        pending={showPending}
        onBack={() => setScreen("menu")}
      />
    );
  }

  return (
    <MainMenu
      onViewObjects={() => {
        setShowPending(false);
        setScreen("objects");
      }}
      onViewPending={() => {
        setShowPending(true);
        setScreen("objects");
      }}
      onRegisterObject={() => setScreen("form")}
    />
  );
}

export default App;
