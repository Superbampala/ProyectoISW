import "./objectDetailsModal.css";
import { useState } from "react";
import { useEditObject, useObjectOptions } from "../../Hooks/useObject";

const allowedFields = [
  "categoria",
  "titularRut",
  "titularNombre",
  "descripcion",
  "lugarHallazgo",
  "puntoId",
];

function getInitialForm(object) {
  // recorre allowedFields y crea un objeto con los valores del objeto original, o un string vacío si no existe
  return allowedFields.reduce((form, field) => {
    form[field] = object[field] ?? "";
    return form;
  }, {});
}

function formatCategory(category) {
  return category
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

export default function ObjectDetailsModal({ object, onClose, onSaved }) {
  const [form, setForm] = useState(() => getInitialForm(object));
  const { options, loading: optionsLoading, error: optionsError } =
    useObjectOptions();
  const { editObject, loading: saving, error: saveError } = useEditObject();
  const [formError, setFormError] = useState(null);

  function handleBackdropClick(event) {
    event.stopPropagation();
    onClose();
  }

  // actualiza el formulario
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  async function handleSubmit(event) {
    // evita que se recarge la pagina
    event.preventDefault();
    // limpia el error del formulario antes de intentar guardar
    setFormError(null);

    const data = { ...form, puntoId: Number(form.puntoId) };
    if (data.categoria !== "DOCUMENTOS_Y_TARJETAS") {
      data.titularRut = null;
      data.titularNombre = null;
    }

    try {
      const updatedObject = await editObject(object.id, data);
      // actualiza el formulario
      onSaved?.(updatedObject);
      onClose();
    } catch (error) {
      setFormError(error.message);
    }
  }

  return (
    <div
      className="object-details-modal__backdrop"
      onClick={handleBackdropClick}
    >
      <div
        className="object-details-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <h2>Detalles del objeto</h2>
        <p>ID del objeto: {object.id}</p>

        {optionsError && <p className="object-details-modal__error">{optionsError}</p>}
        {formError && <p className="object-details-modal__error">{formError}</p>}
        {saveError && !formError && (
          <p className="object-details-modal__error">{saveError}</p>
        )}

        <form onSubmit={handleSubmit}>
          <label>
            Categoría
            <select
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              disabled={optionsLoading || saving}
              required
            >
              <option value="">Selecciona una categoría</option>
              {options.categorias.map((category) => (
                <option key={category} value={category}>
                  {formatCategory(category)}
                </option>
              ))}
            </select>
          </label>

          <label>
            RUT del titular
            <input
              name="titularRut"
              value={form.titularRut}
              onChange={handleChange}
              disabled={saving}
              placeholder="12.345.678-9"
            />
          </label>

          <label>
            Nombre del titular
            <input
              name="titularNombre"
              value={form.titularNombre}
              onChange={handleChange}
              disabled={saving}
            />
          </label>

          <label>
            Descripción
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              disabled={saving}
              required
              minLength={3}
              maxLength={500}
            />
          </label>

          <label>
            Lugar de hallazgo
            <input
              name="lugarHallazgo"
              value={form.lugarHallazgo}
              onChange={handleChange}
              disabled={saving}
              required
              minLength={3}
              maxLength={200}
            />
          </label>

          <label>
            Punto de entrega
            <select
              name="puntoId"
              value={form.puntoId}
              onChange={handleChange}
              disabled={optionsLoading || saving}
              required
            >
              <option value="">Selecciona un punto</option>
              {options.puntosEntrega.map((point) => (
                <option key={point.id} value={point.id}>
                  {point.nombre}
                </option>
              ))}
            </select>
          </label>

          <div className="object-details-modal__actions">
            <button type="button" onClick={onClose} disabled={saving}>
              Cerrar
            </button>
            <button type="submit" disabled={optionsLoading || saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}