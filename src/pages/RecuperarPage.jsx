import React, { useState } from "react";
import "../styles/recuperar.css";
import { solicitarResetContrasena } from "../api/Usuarios"; 
import { toast }  from "react-hot-toast";
const RecuperarContrasena = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await solicitarResetContrasena(email);
      setIsSubmitted(true);

      toast.success("¡Hemos enviado las instrucciones a tu correo!");
    } catch (err) {
      console.error(err);

      toast.error("Hubo un error al enviar las instrucciones. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="recuperar-container">
      <div className="recuperar-wrapper">
        <div className="recuperar-left">
          <div className="recuperar-circle circle-1"></div>
          <div className="recuperar-circle circle-2"></div>

          <div className="recuperar-content">
            <div className="recuperar-logo-container">
              <img
                src="../public/img/logo-region.png"
                alt="Logo"
                className="recuperar-logo-image"
              />
            </div>
            <h1>¿Olvidaste tu contraseña?</h1>
            <p className="recuperar-subtitle">
              No te preocupes, te ayudaremos a recuperarla
            </p>
          </div>
        </div>

        <div className="recuperar-right">
          <div className="recuperar-form-container">
            <div className="recuperar-form-header">
              <h2>Recuperar Contraseña</h2>
              <p>Ingresa tu correo electrónico registrado</p>
            </div>

            {isSubmitted ? (
              <div className="recuperar-success">
                <svg className="recuperar-success-icon" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 
                    10 10 10 10-4.48 10-10S17.52 2 
                    12 2zm-2 15l-5-5 1.41-1.41L10 
                    14.17l7.59-7.59L19 8l-9 9z"
                  />
                </svg>
                <h3>¡Instrucciones enviadas!</h3>
                <p>
                  Hemos enviado un correo a <strong>{email}</strong> con las
                  instrucciones para recuperar tu contraseña.
                </p>
                <button
                  className="recuperar-back-button"
                  onClick={() => setIsSubmitted(false)}
                >
                  Volver a intentar
                </button>
              </div>
            ) : (
              <form className="recuperar-form" onSubmit={handleSubmit}>
                <div className="recuperar-input-group">
                  <label>Correo electrónico</label>
                  <div className="recuperar-input-wrapper">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {error && <p className="recuperar-error">{error}</p>}

                <button
                  type="submit"
                  className={`recuperar-button ${
                    isLoading ? "recuperar-loading" : ""
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="recuperar-spinner"></div>
                  ) : (
                    <>
                      <span>Enviar instrucciones</span>
                      <svg
                        className="recuperar-button-arrow"
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

                <div className="recuperar-login-link">
                  <p>
                    ¿Ya la recordaste? <a href="/">Inicia sesión aquí</a>
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

export default RecuperarContrasena;
