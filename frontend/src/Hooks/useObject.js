import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../api/config";

export function usePendingObjects(userRole = "ADMIN_PUNTO") {
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isUserScope = userRole === "USUARIO_UBB";

  const fetchPendingObjects = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);

      const endpoint = isUserScope
        ? "/objects/pending/user"
        : "/objects/pending";
      try {
        const response = await fetch(`${API_URL}${endpoint}`, {
          signal,
          headers: {
            // Temporal para dev-auth; se reemplazará al conectar la autenticación real.
            // Temporal para probar con un usuario UBB que tiene objetos pendientes.
            "x-user-id": isUserScope ? "11" : "2",
            "x-user-role": isUserScope ? "USUARIO_UBB" : "ADMIN_PUNTO",
          },
        });

        if (!response.ok) {
          throw new Error(
            `No se pudieron obtener los objetos pendientes (${response.status})`,
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
    },
    [isUserScope],
  );

  useEffect(() => {
    const controller = new AbortController();
    // La petición sincroniza el listado con la API al montar el componente.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPendingObjects(controller.signal);
    return () => controller.abort();
  }, [fetchPendingObjects]);

  const refetch = useCallback(
    () => fetchPendingObjects(),
    [fetchPendingObjects],
  );

  return { objects, loading, error, refetch, isUserScope };
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
      const body = new FormData();
      Object.entries(objectData).forEach(([key, value]) => {
        if (key === "fotos") {
          value.forEach((file) => body.append("fotos", file));
        } else {
          body.append(key, value);
        }
      });

      const response = await fetch(`${API_URL}/objects`, {
        method: "POST",
        headers: {
          "x-user-id": "1",
          "x-user-role": "USUARIO_UBB",
        },
        body,
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
      const response = await fetch(`${API_URL}/objects/${id}`, {
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
      const response = await fetch(`${API_URL}/objects/options`, { signal });
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
      const response = await fetch(`${API_URL}/objects/${id}/approve`, {
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
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    approveObject,
    loading,
    error,
  };
}

export function useGetApprovedObjects() {
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApprovedObjects = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/objects`, { signal });
      if (!response.ok) {
        throw new Error(
          `No se pudieron obtener los objetos aprobados (${response.status})`,
        );
      }
      const data = await response.json();
      setObjects(data);
    } catch (requestError) {
      // Si la solicitud fue abortada, no se establece el error
      if (requestError.name !== "AbortError") {
        setError(requestError.message);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchApprovedObjects(controller.signal);
    return () => controller.abort();
  }, [fetchApprovedObjects]);

  const refetch = useCallback(
    () => fetchApprovedObjects(),
    [fetchApprovedObjects],
  );

  return { objects, loading, error, refetch };
}

export function useDeletePendingObject() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deletePendingObject = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/objects/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "2",
          "x-user-role": "ADMIN_PUNTO",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            `No se pudo eliminar el objeto pendiente (${response.status})`,
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
    deletePendingObject,
    loading,
    error,
  };
}
