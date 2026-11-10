import { useEffect, useRef, useState } from "react";
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

const draftStorageKey = "object-form-draft";

function getInitialForm() {
  const defaultForm = {
    categoria: "",
    descripcion: "",
    lugarHallazgo: "",
    puntoId: "",
    titularRut: "",
    titularNombre: "",
    fotos: [],
  };

  if (typeof window === "undefined") return defaultForm;

  try {
    const savedDraft = JSON.parse(
      sessionStorage.getItem(draftStorageKey) || "null",
    );
    return savedDraft ? { ...defaultForm, ...savedDraft, fotos: [] } : defaultForm;
  } catch {
    return defaultForm;
  }
}

export default function ObjectForm({ onBack = () => {} }) {
  const { points, loading: pointsLoading, error: pointsError } = useDeliveryPoints();
  const {
    createObject,
    loading,
    error,
    fieldErrors,
    confirmation,
  } = useCreateObject();
  const [localErrors, setLocalErrors] = useState({});
  const [form, setForm] = useState(getInitialForm);
  const photoInputRef = useRef(null);

  useEffect(() => {
    const draft = { ...form };
    delete draft.fotos;
    sessionStorage.setItem(draftStorageKey, JSON.stringify(draft));
  }, [form]);

  const handleBack = () => {
    sessionStorage.removeItem(draftStorageKey);
    onBack();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    // Limpiar errores locales al cambiar un campo
    setLocalErrors((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const handlePhotosChange = (event) => {
    const files = Array.from(event.target.files || []);
    const invalidType = files.some(
      (file) => !["image/jpeg", "image/png"].includes(file.type),
    );
    const oversized = files.some((file) => file.size > 10 * 1024 * 1024);
    const tooMany = files.length > 5;

    if (invalidType || oversized || tooMany) {
      setLocalErrors((current) => ({
        ...current,
        fotos: tooMany
          ? "Puedes seleccionar como máximo 5 fotografías"
          : invalidType
            ? "Solo se permiten fotografías JPG o PNG"
            : "Cada fotografía debe pesar como máximo 10 MB",
      }));
      event.target.value = "";
      return;
    }

    setForm((current) => ({ ...current, fotos: files }));
    setLocalErrors((current) => {
      const next = { ...current };
      delete next.fotos;
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Preparar los datos del objeto a enviar, excluyendo campos vacíos o no aplicables
    const objectData = {
      categoria: form.categoria,
      descripcion: form.descripcion,
      lugarHallazgo: form.lugarHallazgo,
      puntoId: form.puntoId,
    };

    if (form.categoria === "DOCUMENTOS_Y_TARJETAS") {
      objectData.titularRut = form.titularRut;
      objectData.titularNombre = form.titularNombre;
    }
    // Validación de campos antes de enviar la solicitud, 
    const validationErrors = {};
    if (!form.categoria) validationErrors.categoria = "Selecciona una categoría";
    if (form.descripcion.trim().length < 3) {
      validationErrors.descripcion =
        "La descripción debe tener al menos 3 caracteres";
    }
    if (form.lugarHallazgo.trim().length < 3) {
      validationErrors.lugarHallazgo =
        "El lugar de hallazgo debe tener al menos 3 caracteres";
    }
    if (!form.puntoId) {
      validationErrors.puntoId = "Selecciona un punto de entrega";
    }
    if (form.categoria === "DOCUMENTOS_Y_TARJETAS") {
      if (!form.titularRut.trim()) {
        validationErrors.titularRut = "El RUT del titular es obligatorio";
      }
      if (form.titularNombre.trim().length < 2) {
        validationErrors.titularNombre =
          "El nombre debe tener al menos 2 caracteres";
      }
    }

    setLocalErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      await createObject({ ...objectData, fotos: form.fotos });
      sessionStorage.removeItem(draftStorageKey);
      if (photoInputRef.current) photoInputRef.current.value = "";
      setForm({
        categoria: "",
        descripcion: "",
        lugarHallazgo: "",
        puntoId: "",
        titularRut: "",
        titularNombre: "",
        fotos: [],
      });
    } catch {
      // El hook expone el error para mostrarlo en el formulario.
    }
  };

  return (
    <div className="object-form">
      <header className="board__header">
        <button className="board__back" onClick={handleBack} aria-label="Volver">
          <BackIcon />
        </button>
        <h1 className="board__heading">Encontré un objeto</h1>
      </header>

      <main className="object-form__content">
        <form className="object-form__card" onSubmit={handleSubmit} noValidate>
          <p className="object-form__intro">
            Completa los datos del objeto para pre-inscribirlo.
          </p>

          <label>
            Categoría
            <select name="categoria" value={form.categoria} onChange={handleChange}>
              <option value="">Selecciona una categoría</option>
              {categories.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {getFieldError("categoria", localErrors, fieldErrors)}
          </label>

          {form.categoria === "DOCUMENTOS_Y_TARJETAS" && (
            <>
              <label>
                RUT del titular
                <input
                  name="titularRut"
                  value={form.titularRut}
                  onChange={handleChange}
                  placeholder="Ejemplo: 12345678-9"
                />
                {getFieldError("titularRut", localErrors, fieldErrors)}
              </label>

              <label>
                Nombre del titular
                <input
                  name="titularNombre"
                  value={form.titularNombre}
                  onChange={handleChange}
                  minLength="2"
                  maxLength="100"
                  placeholder="Nombre de la persona titular"
                />
                {getFieldError("titularNombre", localErrors, fieldErrors)}
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
              placeholder="Describe el objeto encontrado"
            />
            {getFieldError("descripcion", localErrors, fieldErrors)}
          </label>

          <label>
            Lugar de hallazgo
            <input
              name="lugarHallazgo"
              value={form.lugarHallazgo}
              onChange={handleChange}
              minLength="3"
              maxLength="200"
              placeholder="¿Dónde lo encontraste?"
            />
            {getFieldError("lugarHallazgo", localErrors, fieldErrors)}
          </label>

          <label>
            Fotografías
            <input
              ref={photoInputRef}
              name="fotos"
              type="file"
              accept="image/jpeg,image/png"
              multiple
              capture="environment"
              onChange={handlePhotosChange}
            />
            <small>
              Hasta 5 fotografías JPG o PNG, máximo 10 MB cada una. Si el
              navegador se recarga al volver de la cámara, selecciona la foto
              nuevamente.
            </small>
            {getFieldError("fotos", localErrors, fieldErrors)}
          </label>

          <label>
            Punto de entrega
            <select name="puntoId" value={form.puntoId} onChange={handleChange}>
              <option value="">
                {pointsLoading ? "Cargando puntos..." : "Selecciona un punto"}
              </option>
              {points.map((point) => (
                <option key={point.id} value={point.id}>{point.nombre}</option>
              ))}
            </select>
            {getFieldError("puntoId", localErrors, fieldErrors)}
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

function getFieldError(field, localErrors, serverErrors) {
  const message = localErrors[field] || serverErrors[field];
  return message ? <span className="object-form__field-error">{message}</span> : null;
}
