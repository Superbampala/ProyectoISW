import { useState } from 'react'
import './App.css'
import { API_URL } from './api/config';
import ObjectsBoard from './components/objectsBoard/objectsBoard';

fetch(`${API_URL}/health`)
  .then((response) => response.json())
  .then((data) => console.log(data));

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <ObjectsBoard />
    </>
  )
}

export default App
