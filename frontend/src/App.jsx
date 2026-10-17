import { useState } from "react";
import "./App.css";
import ObjectsBoard from './components/objectsBoard/objectsBoard';
import ObjectForm from "./components/objectForm/objectForm";

function App() {
  const [screen, setScreen] = useState("objects");

  return (
    <div>
      <nav className="app__nav" aria-label="Navegación principal">
        <button onClick={() => setScreen("objects")}>Objetos aprobados</button>
        <button onClick={() => setScreen("form")}>Encontré un objeto</button>
      </nav>
      {screen === "form" ? (
        <ObjectForm onBack={() => setScreen("objects")} />
      ) : (
        <ObjectsBoard />
      )}
    </div>
  );
}

export default App
