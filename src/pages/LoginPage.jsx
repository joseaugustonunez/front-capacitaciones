import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import { toast } from "react-hot-toast";
import { loginUsuario } from "../api/Usuarios";
const LoginComponent = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Redirige si ya está autenticado
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Puedes redirigir según el rol si lo necesitas
      const userData = JSON.parse(localStorage.getItem("userData"));
      if (userData?.rol === "admin" || userData?.rol === 1) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/cursos", { replace: true });
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await loginUsuario({
        correo_electronico: loginData.email,
        contrasena: loginData.password,
      });

      toast.success(res.mensaje || "Sesión iniciada correctamente");

      // Guarda el token
      localStorage.setItem("token", res.token);

      // Guarda los datos del usuario
      localStorage.setItem("userData", JSON.stringify(res.usuario));

      // Verifica el rol y redirige
      if (res.usuario.rol === "admin" || res.usuario.rol === 1) {
        navigate("/admin"); // ruta para el panel del administrador
      } else {
        navigate("/cursos"); // ruta para usuarios normales
      }
    } catch (error) {
      toast.error(error.response?.data?.mensaje || "Error al iniciar sesión");
      console.error("Error al iniciar sesión:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="auth-wrapper">
        {/* Columna Izquierda - Bienvenida */}
        <div className="auth-left">
          <div className="decorative-circle circle-1"></div>
          <div className="decorative-circle circle-2"></div>

          <div className="welcome-content">
            <div className="logo-container">
              <img
                src="./img/logo-region.png"
                alt="Logo"
                className="logo-image"
              />
            </div>

            <h1>¡Bienvenido de vuelta!</h1>
            <p className="welcome-subtitle">Nos alegra verte otra vez</p>

            <div className="features">
              <p className="features-description">
                Accede a tu cuenta para continuar con tu experiencia
                personalizada
              </p>
              <div className="features-list">
                <span className="feature-dot"></span>
                <span>Seguro</span>
                <span className="feature-dot"></span>
                <span>Rápido</span>
                <span className="feature-dot"></span>
                <span>Confiable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha - Formulario */}
        <div className="auth-right">
          <div className="form-container">
            {/* Header del formulario */}
            <div className="form-header">
              <h2>Iniciar Sesión</h2>
              <p>Ingresa tus credenciales para continuar</p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleLogin} className="auth-form">
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
                    value={loginData.email}
                    onChange={(e) =>
                      setLoginData({ ...loginData, email: e.target.value })
                    }
                    placeholder="tu@email.com"
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
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
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

              {/* Olvidé mi contraseña */}
              <div className="forgot-password">
                <a href="/recuperar">¿Olvidaste tu contraseña?</a>
              </div>

              {/* Botón de login */}
              <button
                type="submit"
                disabled={isLoading}
                className={`login-button ${isLoading ? "loading" : ""}`}
              >
                {isLoading ? (
                  <>
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar</span>
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

              {/* Registro */}
              <div className="register-link">
                <p>
                  ¿No tienes una cuenta? <a href="/registro">Regístrate aquí</a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;
