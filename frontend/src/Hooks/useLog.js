import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../api/config";

export function useApproveRejectLog() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

    const approveObject = useCallback(async (objectId) => {
    setLoading(true);
    setError(null);
    try {
        const response = await fetch(`${API_URL}/logs/approve/${objectId}`, {
            method: "Post",
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
    }
    catch (requestError) {
        setError(requestError.message);
        throw requestError;
    }
    finally {
        setLoading(false);
    }

    }, []);

    const rejectObject = useCallback(async (objectId) => {
    setLoading(true);
    setError(null);
    try {
        const response = await fetch(`${API_URL}/logs/reject/${objectId}`, {
            method: "Post",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": "2",
                "x-user-role": "ADMIN_PUNTO",
            },
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || `No se pudo rechazar el objeto (${response.status})`,
            );
        }
        return data;
    }
    catch (requestError) {
        setError(requestError.message);
        throw requestError;
    }
    finally {
        setLoading(false);
    }
    }, []);

  return {
    approveObject,
    rejectObject,
    loading,
    error,
  };
}