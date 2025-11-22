import React, { useState } from "react";
import "../styles/restablecer.css";
import { useParams } from "react-router-dom";
import { resetearContrasenaConToken } from "../api/Usuarios";
const RestablecerContrasena = () => {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // ✅ Estados que faltaban
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);
    try {
      await resetearContrasenaConToken(token, password);
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      alert("Error al restablecer la contraseña. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="restablecer-container">
      <div className="restablecer-wrapper">
        {/* Columna Izquierda - Mensaje motivacional */}
        <div className="restablecer-left">
          <div className="restablecer-circle circle-1"></div>
          <div className="restablecer-circle circle-2"></div>

          <div className="restablecer-content">
            <div className="restablecer-logo-container">
              <img
                src="../public/img/logo-region.png"
                alt="Logo"
                className="restablecer-logo-image"
              />
            </div>

            <h1>Restablecer Contraseña</h1>
            <p className="restablecer-subtitle">
              Crea una nueva contraseña segura para tu cuenta
            </p>

            <div className="restablecer-features">
              <p className="restablecer-features-description">
                Asegúrate de que tu nueva contraseña sea segura y fácil de recordar
              </p>
              <div className="restablecer-features-list">
                <span className="restablecer-feature-dot"></span>
                <span>Mínimo 8 caracteres</span>
                <span className="restablecer-feature-dot"></span>
                <span>Letras y números</span>
                <span className="restablecer-feature-dot"></span>
                <span>Fácil de recordar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha - Formulario */}
        <div className="restablecer-right">
          <div className="restablecer-form-container">
            {/* Header del formulario */}
            <div className="restablecer-form-header">
              <h2>Nueva Contraseña</h2>
              <p>Ingresa y confirma tu nueva contraseña</p>
            </div>

            {/* Mensaje de confirmación */}
            {isSubmitted ? (
              <div className="restablecer-success">
                <svg className="restablecer-success-icon" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <h3>¡Contraseña restablecida!</h3>
                <p>Tu contraseña ha sido cambiada exitosamente.</p>
                <button 
                  className="restablecer-login-button"
                  onClick={() => window.location.href = "/"}
                >
                  Iniciar Sesión
                </button>
              </div>
            ) : (
              /* Formulario */
              <form className="restablecer-form" onSubmit={handleSubmit}>
                {/* Campo Nueva Contraseña */}
                <div className="restablecer-input-group">
                  <label>Nueva Contraseña</label>
                  <div className="restablecer-input-wrapper">
                    <svg
                      className="restablecer-input-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingresa tu nueva contraseña"
                      required
                      disabled={isLoading}
                      minLength="8"
                    />
                    <button 
                      type="button"
                      className="restablecer-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {showPassword ? (
                          <>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </>
                        ) : (
                          <>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Campo Confirmar Contraseña */}
                <div className="restablecer-input-group">
                  <label>Confirmar Contraseña</label>
                  <div className="restablecer-input-wrapper">
                    <svg
                      className="restablecer-input-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirma tu nueva contraseña"
                      required
                      disabled={isLoading}
                    />
                    <button 
                      type="button"
                      className="restablecer-password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {showConfirmPassword ? (
                          <>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </>
                        ) : (
                          <>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Botón de restablecer */}
                <button 
                  type="submit" 
                  className={`restablecer-button ${isLoading ? 'restablecer-loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="restablecer-spinner"></div>
                  ) : (
                    <>
                      <span>Restablecer Contraseña</span>
                      <svg
                        className="restablecer-button-arrow"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </>
                  )}
                </button>

                {/* Volver al login */}
                <div className="restablecer-login-link">
                  <p>
                    ¿Ya tienes cuenta? <a href="/">Inicia sesión aquí</a>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestablecerContrasena;