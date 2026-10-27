const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL =
  configuredApiUrl ||
  (typeof window !== "undefined"
    ? window.location.port === "3000"
      ? `${window.location.origin}/api`
      : `http://${window.location.hostname}:3000/api`
    : "http://localhost:3000/api");