import { useState } from "react";
import "./App.css";

import MainMenu from "./components/mainMenu/mainMenu";
import ObjectForm from "./components/objectForm/objectForm";
import ObjectsBoard from "./components/objectsBoard/objectsBoard";

function App() {
  const [screen, setScreen] = useState("menu");

  if (screen === "form") {
    return <ObjectForm onBack={() => setScreen("menu")} />;
  }

  if (screen === "objects") {
    return <ObjectsBoard onBack={() => setScreen("menu")} />;
  }

  return (
    <MainMenu
      onViewObjects={() => setScreen("objects")}
      onRegisterObject={() => setScreen("form")}
    />
  );
}

export default App;
