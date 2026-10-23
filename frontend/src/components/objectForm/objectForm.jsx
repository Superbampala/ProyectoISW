import { useState } from "react";
import { useCreateObject, useDeliveryPoints } from "../../Hooks/useObject";
import "./objectForm.css";
import { BackIcon } from "../icons/icons";

const categories = [
  ["DOCUMENTOS_Y_TARJETAS", "Documentos y tarjetas"],
  ["ELECTRONICA", "Electrónica"],
  ["ROPA_Y_ACCESORIOS", "Ropa y accesorios"],
  ["LLAVES", "Llaves"],
  ["UTILES_Y_MATERIAL_ESTUDIO", "Útiles y material de estudio"],
  ["OTROS", "Otros"],
];

export default function ObjectForm({ onBack = () => {} }) {
  const { points, loading: pointsLoading, error: pointsError } = useDeliveryPoints();
  const { createObject, loading, error, confirmation } = useCreateObject();
  const [form, setForm] = useState({
    categoria: "",
    descripcion: "",
    lugarHallazgo: "",
    puntoId: "",
    titularRut: "",
    titularNombre: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await createObject(form);
      setForm({
        categoria: "",
        descripcion: "",
        lugarHallazgo: "",
        puntoId: "",
        titularRut: "",
        titularNombre: "",
      });
    } catch {
      // El hook expone el error para mostrarlo en el formulario.
    }
  };

  return (
    <div className="object-form">
      <header className="board__header">
        <button className="board__back" onClick={onBack} aria-label="Volver">
          <BackIcon />
        </button>
        <h1 className="board__heading">Encontré un objeto</h1>
      </header>

      <main className="object-form__content">
        <form className="object-form__card" onSubmit={handleSubmit}>
          <p className="object-form__intro">
            Completa los datos del objeto para pre-inscribirlo.
          </p>

          <label>
            Categoría
            <select name="categoria" value={form.categoria} onChange={handleChange} required>
              <option value="">Selecciona una categoría</option>
              {categories.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          {form.categoria === "DOCUMENTOS_Y_TARJETAS" && (
            <>
              <label>
                RUT del titular
                <input
                  name="titularRut"
                  value={form.titularRut}
                  onChange={handleChange}
                  required
                  placeholder="Ejemplo: 12345678-9"
                />
              </label>

              <label>
                Nombre del titular
                <input
                  name="titularNombre"
                  value={form.titularNombre}
                  onChange={handleChange}
                  minLength="2"
                  maxLength="100"
                  required
                  placeholder="Nombre de la persona titular"
                />
              </label>
            </>
          )}

          <label>
            Descripción
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              minLength="3"
              maxLength="500"
              required
              placeholder="Describe el objeto encontrado"
            />
          </label>

          <label>
            Lugar de hallazgo
            <input
              name="lugarHallazgo"
              value={form.lugarHallazgo}
              onChange={handleChange}
              minLength="3"
              maxLength="200"
              required
              placeholder="¿Dónde lo encontraste?"
            />
          </label>

          <label>
            Punto de entrega
            <select name="puntoId" value={form.puntoId} onChange={handleChange} required>
              <option value="">
                {pointsLoading ? "Cargando puntos..." : "Selecciona un punto"}
              </option>
              {points.map((point) => (
                <option key={point.id} value={point.id}>{point.nombre}</option>
              ))}
            </select>
          </label>

          {(pointsError || error) && <p className="object-form__error">{pointsError || error}</p>}
          {confirmation && <p className="object-form__confirmation">{confirmation}</p>}

          <button className="board__button object-form__submit" disabled={loading || pointsLoading}>
            {loading ? "Enviando..." : "Pre-inscribir objeto"}
          </button>
        </form>
      </main>
    </div>
  );
}
