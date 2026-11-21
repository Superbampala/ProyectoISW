import { useEffect, useState } from "react";
import { API_URL, getAuthHeaders } from "../../api/config";
import { BackIcon } from "../icons/icons";
import "./timeConfiguration.css";

function getRequestErrorMessage(error, fallback) {
  if (
    error instanceof TypeError ||
    /failed to fetch|networkerror|load failed/i.test(error.message)
  ) {
    return "No se pudo conectar con el servidor.";
  }

  return error.message || fallback;
}

export default function TimeConfiguration({ onBack = () => {} }) {
  const [hours, setHours] = useState(2);
  const [currentHours, setCurrentHours] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_URL}/configuracion-hora`, {
      signal: controller.signal,
      headers: getAuthHeaders(),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "No se pudo cargar la configuración");
        }
        setHours(data.horasLimite);
        setCurrentHours(data.horasLimite);
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(
            getRequestErrorMessage(
              requestError,
              "No se pudo cargar la configuración.",
            ),
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  async function saveConfiguration(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setConfirmation(null);

    try {
      const response = await fetch(`${API_URL}/configuracion-hora`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ horasLimite: Number(hours) }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo guardar la configuración");
      }

      const savedHours = data.configuracion.horasLimite;
      setHours(savedHours);
      setCurrentHours(savedHours);
      setConfirmation("El nuevo plazo se aplicará a las preinscripciones futuras.");
    } catch (requestError) {
      setError(
        getRequestErrorMessage(
          requestError,
          "No se pudo guardar la configuración.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="time-config">
      <header className="time-config__header">
        <button className="time-config__back" onClick={onBack} aria-label="Volver">
          <BackIcon />
        </button>
        <h1 className="time-config__title">Configuración</h1>
      </header>

      <main className="time-config__content">
        <form className="time-config__panel" onSubmit={saveConfiguration}>
          <div>
            <h2 className="time-config__heading">Plazo de entrega</h2>
            <p className="time-config__current" aria-live="polite">
              {currentHours !== null
                ? `Plazo vigente: ${currentHours} ${currentHours === 1 ? "hora" : "horas"}.`
                : loading
                  ? "Cargando plazo vigente..."
                  : "No fue posible consultar el plazo vigente."}
            </p>
          </div>

          <label className="time-config__field">
            Horas para entregar el objeto
            <input
              type="number"
              min="1"
              max="8760"
              step="1"
              value={hours}
              onChange={(event) => setHours(event.target.value)}
              required
              disabled={loading || saving}
            />
          </label>

          {error && <p className="time-config__message time-config__message--error">{error}</p>}
          {confirmation && (
            <p className="time-config__message time-config__message--success" aria-live="polite">
              {confirmation}
            </p>
          )}

          <button
            className="time-config__save"
            type="submit"
            disabled={loading || saving || Number(hours) === currentHours}
          >
            {saving ? "Guardando..." : "Guardar plazo"}
          </button>
        </form>
      </main>
    </div>
  );
}