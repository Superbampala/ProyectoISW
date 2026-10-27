import { useEffect, useState } from "react";
import { API_URL } from "../../api/config";

export default function ProtectedPhoto({ objectId, photoId, alt }) {
  const [source, setSource] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_URL}/objects/${objectId}/photos/${photoId}`, {
      signal: controller.signal,
      headers: {
        "x-user-id": "2",
        "x-user-role": "ADMIN_PUNTO",
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("No se pudo cargar la fotografía");
        return response.blob();
      })
      .then((blob) => setSource(URL.createObjectURL(blob)))
      .catch((error) => {
        if (error.name !== "AbortError") setSource(null);
      });

    return () => {
      controller.abort();
      setSource((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    };
  }, [objectId, photoId]);

  return source ? <img src={source} alt={alt} loading="lazy" /> : null;
}
