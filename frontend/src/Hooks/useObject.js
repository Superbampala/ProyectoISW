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

  //refresh permite ver los cambios actualizados desde la bd
  const refetch = useCallback(
    () => fetchPendingObjects(),
    // si fetchPendingObjects cambia, se vuelve a crear la función refetch
    [fetchPendingObjects],
  );

  return { objects, loading, error, refetch };
}

export function useEditObject() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const editObject = useCallback(async (id, updatedData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/objetos/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "2",
          "x-user-role": "ADMIN_PUNTO",
        },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `No se pudo actualizar el objeto (${response.status})`,
        );
      }

      return data;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    editObject,
    loading,
    error,
  };
}

export function useObjectOptions() {
  const [options, setOptions] = useState({ categorias: [], puntosEntrega: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchObjectOptions = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/objetos/opciones`, { signal });
      if (!response.ok) {
        throw new Error(
          `No se pudieron obtener las opciones de objetos (${response.status})`,
        );
      }

      const data = await response.json();
      setOptions(data);
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
    fetchObjectOptions(controller.signal);
    return () => controller.abort();
  }, [fetchObjectOptions]);

  return { options, loading, error };
}
