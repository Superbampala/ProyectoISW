import { useEffect, useState } from "react";
import { useObjectOptions } from "../../Hooks/useObject";
import "./objectFilters.css";

const categoryLabels = {
  DOCUMENTOS_Y_TARJETAS: "Documentos y tarjetas",
  ELECTRONICA: "Electrónica",
  ROPA_Y_ACCESORIOS: "Ropa y accesorios",
  LLAVES: "Llaves",
  UTILES_Y_MATERIAL_ESTUDIO: "Útiles y material de estudio",
  OTROS: "Otros",
};

export default function ObjectFilters({ filters, onApply }) {
  const { options } = useObjectOptions();
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const clearFilters = () => {
    const empty = {
      categoria: "",
      puntoId: "",
      desde: "",
      hasta: "",
    };
    setDraft(empty);
    onApply(empty);
  };

  return (
    <form
      className="object-filters"
      onSubmit={(event) => {
        event.preventDefault();
        onApply(draft);
      }}
    >
      <label>
        Categoría
        <select
          value={draft.categoria}
          onChange={(event) => updateDraft("categoria", event.target.value)}
        >
          <option value="">Todas</option>
          {options.categorias.map((categoria) => (
            <option key={categoria} value={categoria}>
              {categoryLabels[categoria] || categoria}
            </option>
          ))}
        </select>
      </label>

      <label>
        Punto de entrega
        <select
          value={draft.puntoId}
          onChange={(event) => updateDraft("puntoId", event.target.value)}
        >
          <option value="">Todos</option>
          {options.puntosEntrega.map((punto) => (
            <option key={punto.id} value={punto.id}>
              {punto.nombre}
            </option>
          ))}
        </select>
      </label>

      <label>
        Desde
        <input
          type="date"
          value={draft.desde}
          max={draft.hasta || undefined}
          onChange={(event) => updateDraft("desde", event.target.value)}
        />
      </label>

      <label>
        Hasta
        <input
          type="date"
          value={draft.hasta}
          min={draft.desde || undefined}
          onChange={(event) => updateDraft("hasta", event.target.value)}
        />
      </label>

      <div className="object-filters__actions">
        <button type="submit" className="board__button">
          Filtrar
        </button>
        <button
          type="button"
          className="board__button board__button--secondary"
          onClick={clearFilters}
        >
          Limpiar
        </button>
      </div>
    </form>
  );
}
