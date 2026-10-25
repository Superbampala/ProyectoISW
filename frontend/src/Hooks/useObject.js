import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../api/config";

export function useObjects({ pending = false } = {}) {
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPendingObjects = useCallback(async (signal) => {
    try {
      const endpoint = pending ? "/objects/pending" : "/objects";
      const headers = pending
        ? { "x-user-id": "2", "x-user-role": "ADMIN_PUNTO" }
        : undefined;
      const response = await fetch(`${API_URL}${endpoint}`, { signal, headers });

      if (!response.ok) {
        throw new Error(`No se pudieron obtener los objetos (${response.status})`);
      }

      const data = await response.json();
      setError(null);
      setObjects(data);
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setError(requestError.message);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [pending]);

  useEffect(() => {
    const controller = new AbortController();
    // La petición sincroniza el listado con la API al montar el componente.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPendingObjects(controller.signal);
    return () => controller.abort();
    // si fetchPendingObjects cambia, se vuelve a ejecutar el efecto
  }, [fetchPendingObjects]);

  //refresh permite ver los cambios actualizados desde la bd
  const refetch = useCallback(
    () => {
      setLoading(true);
      return fetchPendingObjects();
    },
    // si fetchPendingObjects cambia, se vuelve a crear la función refetch
    [fetchPendingObjects],
  );

  return { objects, loading, error, refetch };
}

export function usePendingObjects() {
  return useObjects({ pending: true });
}

export function useCreateObject() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [confirmation, setConfirmation] = useState(null);

  const createObject = useCallback(async (objectData) => {
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setConfirmation(null);

    try {
      const response = await fetch(`${API_URL}/objects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "1",
          "x-user-role": "USUARIO_UBB",
        },
        body: JSON.stringify(objectData),
      });
      const data = await response.json();
      // Manejo de errores de validación de campos, todos los errores de validación se envían en un objeto con la propiedad "detalles"
      if (!response.ok) {
        const errors = Object.fromEntries(
          (data.detalles || []).map(({ campo, mensaje }) => [campo, mensaje]),
        );
        setFieldErrors(errors);
        throw new Error(
          data.error || `No se pudo registrar el objeto (${response.status})`,
        );
      }

      setConfirmation(data.message);
      return data;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createObject, loading, error, fieldErrors, confirmation };
}

export function useDeliveryPoints() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_URL}/objects/puntos-entrega`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "No se pudieron cargar los puntos");
        }
        setPoints(data);
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { points, loading, error };
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
    // La petición sincroniza las opciones con la API al montar el componente.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchObjectOptions(controller.signal);
    return () => controller.abort();
  }, [fetchObjectOptions]);

  return { options, loading, error };
}

export function useApproveObject() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const approveObject = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/objetos/${id}/aprobar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "2",
          "x-user-role": "ADMIN_PUNTO",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `No se pudo aprobar el objeto (${response.status})`,
        );
      }

      return data;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
    finally {
      setLoading(false);
    }
  }, []);

  return {
    approveObject,
    loading,
    error,
  };
}
