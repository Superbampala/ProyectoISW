import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../api/config";

export function usePendingObjects() {
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPendingObjects = useCallback(async (signal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/objects/pending`, { signal });

      if (!response.ok) {
        throw new Error(
          `No se pudieron obtener los objetos (${response.status})`,
        );
      }

      const data = await response.json();
      setObjects(data);
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setError(requestError.message);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchPendingObjects(controller.signal);
    return () => controller.abort();
    // si fetchPendingObjects cambia, se vuelve a ejecutar el efecto
  }, [fetchPendingObjects]);

  const refetch = useCallback(
    () => fetchPendingObjects(),
    // si fetchPendingObjects cambia, se vuelve a crear la función refetch
    [fetchPendingObjects],
  );

  return { objects, loading, error, refetch };
}
