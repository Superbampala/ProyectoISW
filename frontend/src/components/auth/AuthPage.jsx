import { useEffect, useState } from "react";
import { API_URL } from "../../api/config";
import "./auth.css";

const initialRegistration = {
  nombre: "",
  rut: "",
  correo: "",
  password: "",
};

function getErrorMessage(data, fallback) {
  if (data?.message) return data.message;
  if (data?.detalles?.length) return data.detalles[0].mensaje;
  return fallback;
}

export default function AuthPage({ initialMessage = "", onAuthenticated }) {
  const searchParams = new URLSearchParams(window.location.search);
  const verificationToken = searchParams.get("token");
  const resetToken = searchParams.get("resetToken");

  const [mode, setMode] = useState(
    resetToken ? "reset" : verificationToken ? "verify" : "login",
  );
  const [login, setLogin] = useState({ correo: "", password: "" });
  const [registration, setRegistration] = useState(initialRegistration);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirmation, setResetPasswordConfirmation] = useState("");
  const [message, setMessage] = useState(
    initialMessage,
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationExpired, setVerificationExpired] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);
  const [resendEmail, setResendEmail] = useState("");

  // VERIFICA AUTOMATICAMENTE EL TOKEN QUE VIENE EN EL ENLACE DEL CORREO
  useEffect(() => {
    if (!verificationToken) return;

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
            setVerificationExpired(true);
            setResendOpen(true);
            setMessage("");
            setError(getErrorMessage(data, "No fue posible verificar el correo."));
          }
          return;
        }
        if (active) {
          setVerificationExpired(false);
          setResendOpen(false);
          setMessage(data.message);
        }
      } catch (requestError) {
        if (active) {
          setVerificationExpired(true);
          setResendOpen(true);
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

  // CAMBIA ENTRE LOGIN, REGISTRO Y VERIFICACION
  const changeMode = (nextMode) => {
    if (nextMode === "login" && resetToken) {
      window.history.replaceState({}, "", "/");
    }
    setMode(nextMode);
    setLoading(false);
    setMessage("");
    setError("");
  };

  // ENVIA CORREO Y CONTRASEÑA PARA INICIAR SESION
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

  // CREA UNA CUENTA Y ESPERA LA VERIFICACION POR CORREO
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

  // SOLICITA UN NUEVO ENLACE DE VERIFICACION
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
  //RECUPERAR CONTRASEÑA
  const handlePasswordRecovery = async (event) => {
    event?.preventDefault();
    if (!recoveryEmail.trim()) {
      setError("Ingresa el correo de la cuenta.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `${API_URL}/autenticacion/recuperar-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo: recoveryEmail }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setError(getErrorMessage(data, "No fue posible solicitar la recuperación."));
        return;
      }
      setMessage(data.message);
      setRecoveryOpen(false);
    } catch {
      setError("No fue posible conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (resetPassword !== resetPasswordConfirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `${API_URL}/autenticacion/restablecer-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: resetToken,
            password: resetPassword,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setError(getErrorMessage(data, "No fue posible restablecer la contraseña."));
        return;
      }

      window.history.replaceState({}, "", "/");
      setResetPassword("");
      setResetPasswordConfirmation("");
      setMode("login");
      setMessage("Contraseña actualizada");
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
          {loading && <p className="auth__message">Verificando correo...</p>}
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
                    value={resendEmail}
                    onChange={(event) => setResendEmail(event.target.value)}
                  />
                </label>
                <button className="auth__button" type="button" onClick={handleResend} disabled={loading}>
                  {loading ? "Enviando..." : "Reenviar correo de verificación"}
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

  if (mode === "reset") {
    return (
      <main className="auth">
        <section className="auth__card">
          <h1 className="auth__title">Restablecer contraseña</h1>
          {message && <p className="auth__message">{message}</p>}
          {error && <p className="auth__message auth__message--error">{error}</p>}
          <form className="auth__form" onSubmit={handleResetPassword}>
            <label className="auth__field">
              Nueva contraseña
              <input
                required
                minLength="8"
                type="password"
                autoComplete="new-password"
                value={resetPassword}
                onChange={(event) => setResetPassword(event.target.value)}
              />
            </label>
            <label className="auth__field">
              Confirmar contraseña
              <input
                required
                minLength="8"
                type="password"
                autoComplete="new-password"
                value={resetPasswordConfirmation}
                onChange={(event) =>
                  setResetPasswordConfirmation(event.target.value)
                }
              />
            </label>
            <button className="auth__button" type="submit" disabled={loading}>
              {loading ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </form>
          <button
            className="auth__link"
            type="button"
            onClick={() => changeMode("login")}
          >
            Volver al inicio de sesión
          </button>
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
                setResendOpen((current) => !current);
                if (!resendOpen) setResendEmail(login.correo);
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
            <button
              className="auth__button auth__button--secondary"
              type="button"
              onClick={() => {
                setError("");
                setMessage("");
                setRecoveryEmail(login.correo);
                setRecoveryOpen((current) => !current);
              }}
              disabled={loading}
            >
              ¿Olvidaste tu contraseña?
            </button>
            {recoveryOpen && (
              <div className="auth__resend">
                <label className="auth__field" htmlFor="password-recovery-email">
                  Correo de la cuenta
                  <input
                    id="password-recovery-email"
                    type="email"
                    value={recoveryEmail}
                    onChange={(event) =>
                      setRecoveryEmail(event.target.value)
                    }
                  />
                </label>
                <button
                  className="auth__button"
                  type="button"
                  onClick={handlePasswordRecovery}
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Enviar enlace"}
                </button>
              </div>
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