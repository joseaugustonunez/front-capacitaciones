import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { registrarUsuario } from "../api/Usuarios";
import "../styles/registro.css";
const RegistroComponent = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    dni: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await registrarUsuario({
        dni: formData.dni, // ✅ Agregado aquí
        nombre: formData.nombre,
        apellido: formData.apellido,
        correo_electronico: formData.email,
        contrasena: formData.password,
      });

      toast.success("Usuario registrado correctamente");
      setFormData({
        nombre: "",
        apellido: "",
        email: "",
        dni: "",
        password: "",
      });
    } catch (error) {
      console.error("Error en el registro:", error);
      toast.error(
        "Error al registrar: " +
          (error?.response?.data?.mensaje ||
            error?.message ||
            "Intenta nuevamente")
      );
    } finally {
      setIsLoading(false);
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="registro-container">
      <div className="auth-wrapper">
        {/* Columna Izquierda - Bienvenida */}
        <div className="auth-left">
          <div className="decorative-circle circle-1"></div>
          <div className="decorative-circle circle-2"></div>

          <div className="welcome-content">
            <div className="logo-container">
              <img
                src="../public/img/logo-region.png"
                alt="Logo"
                className="logo-image"
              />
            </div>

            <h1>¡Únete a nosotros!</h1>
            <p className="welcome-subtitle">Crea tu cuenta y comienza</p>

            <div className="features">
              <p className="features-description">
                Únete a miles de usuarios que ya disfrutan de nuestra plataforma
              </p>
              <div className="features-list">
                <span className="feature-dot"></span>
                <span>Gratis</span>
                <span className="feature-dot"></span>
                <span>Fácil</span>
                <span className="feature-dot"></span>
                <span>Rápido</span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha - Formulario */}
        <div className="auth-right">
          <div className="form-container">
            {/* Header del formulario */}
            <div className="form-header">
              <h2>Registrarse</h2>
              <p>Completa tus datos para crear tu cuenta</p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleRegister} className="auth-form">
              {/* Campo Nombre */}
              <div className="input-group">
                <label>Nombres</label>
                <div className="input-wrapper">
                  <svg
                    className="input-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Nombres"
                    required
                  />
                </div>
              </div>
              {/* Campo Apellido */}
              <div className="input-group">
                <label>Apellidos</label>
                <div className="input-wrapper">
                  <svg
                    className="input-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    placeholder="Apellidos"
                    required
                  />
                </div>
              </div>

              {/* Campo Email */}
              <div className="input-group">
                <label>Correo electrónico</label>
                <div className="input-wrapper">
                  <svg
                    className="input-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>
              <div className="input-group">
                <label>DNI</label>
                <div className="input-wrapper">
                  <svg
                    className="input-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {/* Borde de la tarjeta */}
                    <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                    {/* Foto / usuario */}
                    <circle cx="8" cy="10" r="2" />
                    <path d="M6 14c0-1.5 4-1.5 4 0" />
                    {/* Líneas del texto del DNI */}
                    <line x1="14" y1="9" x2="20" y2="9" />
                    <line x1="14" y1="13" x2="20" y2="13" />
                    <line x1="14" y1="17" x2="18" y2="17" />
                  </svg>

                  <input
                    type="text"
                    name="dni"
                    value={formData.dni}
                    onChange={handleInputChange}
                    placeholder="Ingresa tu DNI"
                    maxLength={8}
                    pattern="\d{8}"
                    required
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="input-group">
                <label>Contraseña</label>
                <div className="input-wrapper">
                  <svg
                    className="input-icon"
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
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="password-toggle"
                  >
                    {showPassword ? (
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Términos y condiciones */}
              <div className="terms-checkbox">
                <label className="checkbox-label-reg">
                  <input type="checkbox" required />
                  <span className="checkmark"></span>
                  Acepto los <a href="/terms">términos y condiciones</a>
                </label>
              </div>

              {/* Botón de registro */}
              <button
                type="submit"
                disabled={isLoading}
                className={`register-button ${isLoading ? "loading" : ""}`}
              >
                {isLoading ? (
                  <>
                    <span>Creando cuenta...</span>
                  </>
                ) : (
                  <>
                    <span>Crear cuenta</span>
                    <svg
                      className="button-arrow"
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

              {/* Login */}
              <div className="login-link">
                <p>
                  ¿Ya tienes una cuenta? <a href="/">Inicia sesión aquí</a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroComponent;
