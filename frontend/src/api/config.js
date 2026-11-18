const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

// DEFINE LA URL BASE QUE USAN LAS PANTALLAS DE AUTENTICACION
export const API_URL =
  configuredApiUrl ||
  (typeof window !== "undefined"
    ? window.location.port === "3000"
      ? `${window.location.origin}/api`
      : `http://${window.location.hostname}:3000/api`
    : "http://localhost:3000/api");

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem("ubb-session") || "null");
  } catch {
    return null;
  }
}

export function getAuthHeaders() {
  const token = getSession()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}