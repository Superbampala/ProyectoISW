import { useEffect, useRef, useState } from "react";
import { API_URL } from "../../api/config";
import "./auth.css";

const initialRegistration = {
  nombre: "",
  rut: "",
  correo: "",
  password: "",
};

const devAuthEnabled = import.meta.env.VITE_DEV_AUTH === "true";

function getErrorMessage(data, fallback) {
  if (data?.message) return data.message;
  if (data?.detalles?.length) return data.detalles[0].mensaje;
  return fallback;
}

export default function AuthPage({ initialMessage = "", onAuthenticated }) {
  const searchParams = new URLSearchParams(window.location.search);
  const verificationToken = searchParams.get("token");
  const [mode, setMode] = useState(verificationToken ? "verify" : "login");
  const [login, setLogin] = useState({ correo: "", password: "" });
  const [registration, setRegistration] = useState(initialRegistration);
  const [message, setMessage] = useState(
    verificationToken
      ? "Correo verificado, ya puedes iniciar sesión."
      : initialMessage,
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationExpired, setVerificationExpired] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const verificationStarted = useRef(false);

  useEffect(() => {
    if (!verificationToken || verificationStarted.current) return;
    verificationStarted.current = true;

    let active = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);

    async function verify() {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_URL}/autenticacion/verificar?token=${encodeURIComponent(verificationToken)}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok) {
          if (active) {
            setVerificationExpired(data.code === "TOKEN_EXPIRED");
            setMessage("");
            setError(getErrorMessage(data, "No fue posible verificar el correo."));
          }
          return;
        }
        if (active) setMessage(data.message);
      } catch (requestError) {
        if (active) {
          setError(
            requestError.name === "AbortError"
              ? "La verificación tardó demasiado. Solicita un nuevo correo e inténtalo nuevamente."
              : "No fue posible conectar con el servidor.",
          );
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (active) setLoading(false);
      }
    }

    verify();
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [verificationToken]);

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setLoading(false);
    setMessage("");
    setError("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${API_URL}/autenticacion/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setResendEmail(login.correo);
          setResendOpen(true);
        }
        setError(getErrorMessage(data, "No fue posible iniciar sesión."));
        return;
      }
      localStorage.setItem("ubb-session", JSON.stringify(data));
      onAuthenticated(data.usuario);
    } catch {
      setError("No fue posible conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleDevAdminLogin = () => {
    const data = {
      token: "development-session",
      usuario: {
        id: 1,
        nombre: "Administrador de prueba",
        correo: "admin.prueba@ubiobio.cl",
        rol: "ADMIN_SISTEMA",
      },
    };
    localStorage.setItem("ubb-session", JSON.stringify(data));
    onAuthenticated(data.usuario);
  };

  const handleRegistration = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${API_URL}/autenticacion/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registration),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(getErrorMessage(data, "No fue posible crear la cuenta."));
        return;
      }
      setMessage(data.message);
      setRegistration(initialRegistration);
    } catch {
      setError("No fue posible conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (event) => {
    event?.preventDefault();
    if (!resendEmail.trim()) {
      setError("Ingresa el correo de la cuenta.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_URL}/autenticacion/reenviar-verificacion`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo: resendEmail }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setError(getErrorMessage(data, "No fue posible reenviar el correo."));
        return;
      }
      setMessage(data.message);
      setResendOpen(false);
    } catch {
      setError("No fue posible conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "verify") {
    return (
      <main className="auth">
        <section className="auth__card" aria-live="polite">
          <h1 className="auth__title">Verificación de correo</h1>
          {message && <p className="auth__message">{message}</p>}
          {error && <p className="auth__message auth__message--error">{error}</p>}
          <div className="auth__success-actions">
            {verificationExpired && (
              <>
                <label className="auth__field" htmlFor="resend-email">
                  Correo institucional
                  <input
                    id="resend-email"
                    type="email"
                    value={login.correo}
                    onChange={(event) =>
                      setLogin((current) => ({ ...current, correo: event.target.value }))
                    }
                  />
                </label>
                <button className="auth__button" type="button" onClick={() => {
                  setResendEmail(login.correo);
                  setResendOpen(true);
                }} disabled={loading}>
                  Reenviar correo de verificación
                </button>
              </>
            )}
            <button className="auth__button" type="button" onClick={() => changeMode("login")}>
              Ir al inicio de sesión
            </button>
          </div>
        </section>
      </main>
    );
  }

  const isRegistration = mode === "register";
  return (
    <main className="auth">
      <section className="auth__card">
        <h1 className="auth__title">
          {isRegistration ? "Crear cuenta" : "Iniciar sesión"}
        </h1>
        <p className="auth__subtitle">
          Gestión de objetos perdidos de la Universidad del Bío-Bío
        </p>
        {message && <p className="auth__message">{message}</p>}
        {error && <p className="auth__message auth__message--error">{error}</p>}

        {isRegistration ? (
          <form className="auth__form" onSubmit={handleRegistration}>
            <label className="auth__field">
              Nombre completo
              <input required name="nombre" value={registration.nombre} onChange={(event) => setRegistration({ ...registration, nombre: event.target.value })} />
            </label>
            <label className="auth__field">
              RUT
              <input required name="rut" placeholder="12345678-9" value={registration.rut} onChange={(event) => setRegistration({ ...registration, rut: event.target.value })} />
            </label>
            <label className="auth__field">
              Correo institucional
              <input required type="email" name="correo" placeholder="usuario@ubiobio.cl" value={registration.correo} onChange={(event) => setRegistration({ ...registration, correo: event.target.value })} />
            </label>
            <label className="auth__field">
              Contraseña
              <input required minLength="8" type="password" name="password" value={registration.password} onChange={(event) => setRegistration({ ...registration, password: event.target.value })} />
            </label>
            <button className="auth__button" type="submit" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>
        ) : (
          <form className="auth__form" onSubmit={handleLogin}>
            <label className="auth__field">
              Correo institucional
              <input required type="email" autoComplete="email" value={login.correo} onChange={(event) => setLogin({ ...login, correo: event.target.value })} />
            </label>
            <label className="auth__field">
              Contraseña
              <input required type="password" autoComplete="current-password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} />
            </label>
            <button className="auth__button" type="submit" disabled={loading}>
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
            <button
              className="auth__button auth__button--secondary"
              type="button"
              onClick={() => {
                setError("");
                setMessage("");
                setResendEmail(login.correo);
                setResendOpen(true);
              }}
              disabled={loading}
            >
              Reenviar correo de verificación
            </button>
            {resendOpen && (
              <div className="auth__resend">
                <label className="auth__field" htmlFor="login-resend-email">
                  Correo de la cuenta
                  <input
                    id="login-resend-email"
                    required
                    type="email"
                    value={resendEmail}
                    onChange={(event) => setResendEmail(event.target.value)}
                  />
                </label>
                <button className="auth__button" type="button" onClick={handleResend} disabled={loading}>
                  {loading ? "Enviando..." : "Enviar correo"}
                </button>
              </div>
            )}
            {devAuthEnabled && (
              <button
                className="auth__button auth__button--secondary"
                type="button"
                onClick={handleDevAdminLogin}
              >
                Entrar como administrador (prueba)
              </button>
            )}
          </form>
        )}

        <p className="auth__switch">
          {isRegistration ? "¿Ya tienes una cuenta? " : "¿No tienes una cuenta? "}
          <button className="auth__link" type="button" onClick={() => changeMode(isRegistration ? "login" : "register")}>
            {isRegistration ? "Inicia sesión" : "Regístrate"}
          </button>
        </p>
      </section>
    </main>
  );
}
