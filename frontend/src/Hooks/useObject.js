import { useCallback, useEffect, useState } from "react";
import { API_URL, getAuthHeaders, getSession } from "../api/config";

export function usePendingObjects(userRole = getSession()?.usuario?.rol) {
  const [objects, setObjects] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 6,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    categoria: "",
    puntoId: "",
    desde: "",
    hasta: "",
  });
  const isUserScope = userRole === "USUARIO_UBB";

  const fetchPendingObjects = useCallback(
    async (signal, page = 1, activeFilters = filters) => {
      setLoading(true);
      setError(null);

      const baseEndpoint = isUserScope
        ? "/objects/pending/user"
        : "/objects/pending";
      const params = new URLSearchParams({
        page: String(page),
        limit: "6",
      });
      if (activeFilters.categoria) params.set("categoria", activeFilters.categoria);

      if (activeFilters.puntoId) params.set("puntoId", activeFilters.puntoId);

      if (activeFilters.desde) params.set("desde", activeFilters.desde);

      if (activeFilters.hasta) params.set("hasta", activeFilters.hasta);

      const endpoint = `${baseEndpoint}?${params.toString()}`;
      try {
        const response = await fetch(`${API_URL}${endpoint}`, {
          signal,
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error(
            `No se pudieron obtener los objetos pendientes (${response.status})`,
          );
        }

        const data = await response.json();
        setObjects(data.items);
        setPagination(data);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message);
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [isUserScope, filters],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchPendingObjects(controller.signal, 1, filters);
    return () => controller.abort();
  }, [fetchPendingObjects, filters]);

  const refetch = useCallback(
    (page = pagination.page) => fetchPendingObjects(undefined, page),
    // Mantiene la página actual al volver a cargar los objetos.
    // Recrea refetch cuando cambia la página actual.
    [fetchPendingObjects, pagination.page],
  );

  const goToPage = useCallback(
    (page) => fetchPendingObjects(undefined, page),
    [fetchPendingObjects],
  );

  const applyFilters = useCallback((nextFilters) => {
    setFilters(nextFilters);
  }, []);

  return {
    objects,
    loading,
    error,
    refetch,
    goToPage,
    pagination,
    isUserScope,
    filters,
    applyFilters,
  };
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
        headers: getAuthHeaders(),
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
          ...getAuthHeaders(),
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

export function useEditObjectPhotos() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addPhotos = useCallback(async (id, files) => {
    if (!files.length) return;
    setLoading(true);
    setError(null);
    try {
      const body = new FormData();
      files.forEach((file) => body.append("fotos", file));
      const response = await fetch(`${API_URL}/objects/${id}/photos`, {
        method: "POST",
        headers: getAuthHeaders(),
        body,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudieron agregar las fotografías");
      }
      return data;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  const removePhoto = useCallback(async (objectId, photoId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_URL}/objects/${objectId}/photos/${photoId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "No se pudo eliminar la fotografía");
      }
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { addPhotos, removePhoto, loading, error };
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
          ...getAuthHeaders(),
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

export function useGetApprovedObjects(userRole = getSession()?.usuario?.rol) {
  const [objects, setObjects] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 6,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    categoria: "",
    puntoId: "",
    desde: "",
    hasta: "",
  });

  const fetchApprovedObjects = useCallback(
    async (signal, page = 1, activeFilters = filters) => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(page),
        limit: "6",
      });
      if (activeFilters.categoria)
        params.set("categoria", activeFilters.categoria);

      if (activeFilters.puntoId) params.set("puntoId", activeFilters.puntoId);

      if (activeFilters.desde) params.set("desde", activeFilters.desde);

      if (activeFilters.hasta) params.set("hasta", activeFilters.hasta);

      const endpoint =
        userRole === "ADMIN_PUNTO"
          ? "/objects/admin/approved"
          : "/objects";

      try {
        const response = await fetch(
          `${API_URL}${endpoint}?${params.toString()}`,
          { signal, headers: getAuthHeaders() },
        );
        if (!response.ok) {
          throw new Error(
            `No se pudieron obtener los objetos aprobados (${response.status})`,
          );
        }
        const data = await response.json();
        setObjects(data.items);
        setPagination(data);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message);
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [filters, userRole],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchApprovedObjects(controller.signal, 1, filters);
    return () => controller.abort();
  }, [fetchApprovedObjects, filters]);

  const refetch = useCallback(
    (page = pagination.page) => fetchApprovedObjects(undefined, page),
    [fetchApprovedObjects, pagination.page],
  );

  const goToPage = useCallback(
    (page) => fetchApprovedObjects(undefined, page),
    [fetchApprovedObjects],
  );

  const applyFilters = useCallback((nextFilters) => {
    setFilters(nextFilters);
  }, []);

  return {
    objects,
    loading,
    error,
    refetch,
    goToPage,
    pagination,
    filters,
    applyFilters,
  };
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
          ...getAuthHeaders(),
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
