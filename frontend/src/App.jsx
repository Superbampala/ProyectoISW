import { useState } from "react";
import "./App.css";
import MainMenu from "./components/mainMenu/mainMenu";
import ObjectsBoard from "./components/objectsBoard/objectsBoard";

function App() {
  const [showObjectsBoard, setShowObjectsBoard] = useState(false);

  if (showObjectsBoard) {
    return <ObjectsBoard onBack={() => setShowObjectsBoard(false)} />;
  }

  return <MainMenu onViewObjects={() => setShowObjectsBoard(true)} />;
}

export default App;
