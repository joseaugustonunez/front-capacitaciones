import React, { useState, useEffect } from "react";
import {
  Play,
  User,
  Save,
  Camera,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader,
} from "lucide-react";
import CursosInscritosPage from "../pages/CursosInscritosPage";
import "../styles/perfil.css";
import { obtenerCursosInscritosConDetalles } from "../api/Inscripciones";
import {
  cambiarContrasena,
  subirAvatar,
  obtenerEstadisticas,
} from "../api/Usuarios";

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState("perfil");
  const [userData, setUserData] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [courses, setCourses] = useState([]);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    contrasenaActual: "",
    nuevaContrasena: "",
    confirmarContrasena: "",
  });
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("userData"));
        if (!storedUser) return;

        const res = await obtenerEstadisticas(storedUser.id);

        setUserData((prev) => ({
          ...prev,
          stats: {
            videosInscritos: res.data.cursos_inscritos || 0,
            horasVistas: res.data.horas_vistas || 0,
            certificados: res.data.certificados_obtenidos || 0,
          },
        }));
      } catch (error) {
        console.error("Error al obtener estadísticas:", error);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await obtenerCursosInscritosConDetalles();
        const formatted = data.map((curso) => ({
          id: curso.id,
          title: curso.titulo,
          instructor: curso.instructor_nombre || "Instructor no disponible",
          thumbnail: curso.url_miniatura.startsWith("http")
            ? curso.url_miniatura
            : `https://capacitacionback.sistemasudh.com ${curso.url_miniatura}`,
          duration: `${curso.duracion_horas}h`,
          category: curso.categoria_nombre || "Sin categoría",
          views: curso.vistas || "0",
          progress: parseInt(curso.porcentaje_progreso, 10),
        }));
        setCourses(formatted);
      } catch (error) {
        console.error("Error al obtener cursos inscritos:", error);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    const getUserData = () => {
      try {
        const storedUser = localStorage.getItem("userData");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          return {
            id: user.id,
            nombre: user.nombre || "Usuario",
            apellido: user.apellido || "",
            correo: user.correo || "usuario@ejemplo.com",
            rol: user.rol || "estudiante",
            url_avatar: user.url_avatar,
            coverImage:
              "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=200&fit=crop",
            stats: {
              videosInscritos: 24,
              horasVistas: 156,
              certificados: 8,
            },
          };
        }

        return {
          id: 1,
          nombre: "Usuario",
          apellido: "Invitado",
          correo: "usuario@ejemplo.com",
          rol: "estudiante",
          url_avatar: null,
          coverImage:
            "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=200&fit=crop",
          stats: {
            videosInscritos: 0,
            horasVistas: 0,
            certificados: 0,
          },
        };
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
        return {
          id: 1,
          nombre: "Usuario",
          apellido: "Invitado",
          correo: "usuario@ejemplo.com",
          telefono: "",
          bio: "",
          rol: "estudiante",
          url_avatar: null,
          coverImage:
            "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=200&fit=crop",
          stats: {
            videosInscritos: 0,
            horasVistas: 0,
            certificados: 0,
          },
        };
      }
    };

    const data = getUserData();
    setUserData(data);
    setEditForm(data);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveChanges = () => {
    try {
      localStorage.setItem("userData", JSON.stringify(editForm));
      setUserData(editForm);
      console.log("Datos guardados:", editForm);
      setSuccess("Información personal guardada exitosamente");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error al guardar datos:", error);
      setError("Error al guardar la información");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleSavePassword = async () => {
    if (
      !passwordForm.contrasenaActual ||
      !passwordForm.nuevaContrasena ||
      !passwordForm.confirmarContrasena
    ) {
      setError("Todos los campos son obligatorios");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (passwordForm.nuevaContrasena.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (passwordForm.nuevaContrasena !== passwordForm.confirmarContrasena) {
      setError("Las contraseñas no coinciden");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setError("");
    setIsChangingPassword(true);

    const user = JSON.parse(localStorage.getItem("userData"));

    try {
      const response = await cambiarContrasena(user.id, {
        contrasenaActual: passwordForm.contrasenaActual,
        nuevaContrasena: passwordForm.nuevaContrasena,
        confirmarContrasena: passwordForm.confirmarContrasena,
      });

      if (!response) {
        throw new Error("No se recibió respuesta del servidor");
      }

      setSuccess(response.message || "Contraseña actualizada con éxito");

      setPasswordForm({
        contrasenaActual: "",
        nuevaContrasena: "",
        confirmarContrasena: "",
      });
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);

      if (error.response) {
        setError(
          error.response.data?.message ||
            "Error del servidor al cambiar la contraseña"
        );
      } else if (error.request) {
        setError("No se pudo conectar con el servidor. Verifica tu conexión.");
      } else {
        setError(error.message || "Error inesperado al cambiar la contraseña");
      }
    } finally {
      setIsChangingPassword(false);
      setTimeout(() => {
        setError("");
        setSuccess("");
      }, 3000);
    }
  };
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecciona una imagen válida");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen debe ser menor a 5MB");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setEditForm((prev) => ({
        ...prev,
        url_avatar: event.target.result,
      }));
    };
    reader.readAsDataURL(file);

    try {
      const user = JSON.parse(localStorage.getItem("userData"));
      const response = await subirAvatar(user.id, file);

      if (response && response.url_avatar) {
        setEditForm((prev) => ({
          ...prev,
          url_avatar: `https://capacitacionback.sistemasudh.com ${response.url_avatar}`,
        }));

        const updatedUser = {
          ...user,
          url_avatar: `https://capacitacionback.sistemasudh.com ${response.url_avatar}`,
        };
        localStorage.setItem("userData", JSON.stringify(updatedUser));

        setSuccess("Avatar actualizado correctamente");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      console.error("Error al subir avatar:", error);
      setError(error.response?.data?.mensaje || "Error al subir la imagen");
      setTimeout(() => setError(""), 3000);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const getAvatarImage = () => {
    if (userData?.url_avatar) {
      return userData.url_avatar.startsWith("http")
        ? userData.url_avatar
        : `https://capacitacionback.sistemasudh.com/${userData.url_avatar}`;
    }
    return "/public/img/perfil.png";
  };
  const getFullName = () => {
    if (!userData) return "Cargando...";
    return `${userData.nombre} ${userData.apellido}`.trim();
  };

  if (!userData) {
    return (
      <div className="profile-container">
        <div className="loading-container">
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="cover-image">
          <img src={userData.coverImage} alt="Portada del perfil" />
          <div className="cover-overlay"></div>
        </div>

        <div className="user-info-centered">
          <div className="avatar-container-centered">
            <img
              src={editForm.url_avatar || getAvatarImage()}
              alt="Foto de perfil"
              className="user-avatar-centered"
              onError={(e) => {
                e.target.src = "/public/img/perfil.png";
              }}
            />
            <div className="avatar-badge-centered">
              <User size={16} />
            </div>
          </div>

          <div className="user-details-centered">
            <h1 className="user-name-centered">{getFullName()}</h1>
            <p className="user-email-centered">{userData.correo}</p>
            <span className="user-role-badge">{userData.rol}</span>
          </div>
        </div>

        {userData.rol !== "admin" && (
          <div className="user-stats">
            <div className="stat-item-perfil">
              <span className="stat-number-perfil">
                {userData.stats.videosInscritos}
              </span>
              <span className="stat-label">Cursos Inscritos</span>
            </div>
            <div className="stat-item-perfil">
              <span className="stat-number-perfil">
                {userData.stats.horasVistas}h
              </span>
              <span className="stat-label">Horas Vistas</span>
            </div>
            <div className="stat-item-perfil">
              <span className="stat-number-perfil">
                {userData.stats.certificados}
              </span>
              <span className="stat-label">Certificados</span>
            </div>
          </div>
        )}
      </div>

      <div className="profile-nav">
        <button
          className={`nav-tab ${activeTab === "perfil" ? "active" : ""}`}
          onClick={() => setActiveTab("perfil")}
        >
          <User size={18} />
          Mi Perfil
        </button>
        {/* Solo muestra "Mis Cursos" si NO es admin */}
        {userData.rol !== "admin" && (
          <button
            className={`nav-tab ${activeTab === "cursos" ? "active" : ""}`}
            onClick={() => setActiveTab("cursos")}
          >
            <Play size={18} />
            Mis Cursos
          </button>
        )}
      </div>

      {(error || success) && (
        <div className={`status-message ${error ? "error" : "success"}`}>
          {error ? <XCircle size={20} /> : <CheckCircle size={20} />}
          <span>{error || success}</span>
          <button
            onClick={() => {
              setError("");
              setSuccess("");
            }}
          >
            ×
          </button>
        </div>
      )}

      <div className="profile-content">
        {activeTab === "perfil" && (
          <div className="profile-tab-content">
            <div className="edit-form-container two-column-layout">
              <div className="left-column">
                <div className="avatar-upload-section">
                  <h3>Foto de Perfil</h3>
                  <div className="avatar-upload">
                    <div className="avatar-preview">
                      <img
                        src={editForm.url_avatar || getAvatarImage()}
                        alt="Vista previa del avatar"
                        className="avatar-preview-img"
                      />
                    </div>
                    <div className="avatar-upload-controls">
                      <label className="avatar-upload-btn">
                        <Camera size={18} />
                        Cambiar Foto
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          style={{ display: "none" }}
                        />
                      </label>
                      <p className="avatar-help-text">
                        Formatos permitidos: JPG, PNG. Tamaño máximo: 5MB
                      </p>
                    </div>
                  </div>
                </div>

                <form
                  className="edit-form"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <h3>Información Personal</h3>

                  <div className="form-group-perfil">
                    <label htmlFor="nombre">Nombre</label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={editForm.nombre || ""}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group-perfil">
                    <label htmlFor="apellido">Apellido</label>
                    <input
                      type="text"
                      id="apellido"
                      name="apellido"
                      value={editForm.apellido || ""}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group-perfil">
                    <label htmlFor="correo">Correo Electrónico</label>
                    <input
                      type="email"
                      id="correo"
                      name="correo"
                      value={editForm.correo || ""}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-save"
                      onClick={handleSaveChanges}
                    >
                      <Save size={18} />
                      Guardar Información
                    </button>
                  </div>
                </form>
              </div>

              <div className="right-column">
                <div className="password-section">
                  <div className="password-header">
                    <h3>Cambiar Contraseña</h3>
                  </div>
                  <form
                    className="password-form"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <div className="form-group-perfil">
                      <label htmlFor="currentPassword">Contraseña Actual</label>
                      <div className="password-input-container">
                        <input
                          type={showPassword.current ? "text" : "password"}
                          id="currentPassword"
                          name="contrasenaActual"
                          value={passwordForm.contrasenaActual}
                          onChange={handlePasswordInputChange}
                          className="form-input"
                          required
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => togglePasswordVisibility("current")}
                        >
                          {showPassword.current ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="form-group-perfil">
                      <label htmlFor="newPassword">Nueva Contraseña</label>
                      <div className="password-input-container">
                        <input
                          type={showPassword.new ? "text" : "password"}
                          id="newPassword"
                          name="nuevaContrasena"
                          value={passwordForm.nuevaContrasena}
                          onChange={handlePasswordInputChange}
                          className="form-input"
                          required
                          minLength="6"
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => togglePasswordVisibility("new")}
                        >
                          {showPassword.new ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="form-group-perfil">
                      <label htmlFor="confirmPassword">
                        Confirmar Nueva Contraseña
                      </label>
                      <div className="password-input-container">
                        <input
                          type={showPassword.confirm ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmarContrasena"
                          value={passwordForm.confirmarContrasena}
                          onChange={handlePasswordInputChange}
                          className="form-input"
                          required
                          minLength="6"
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => togglePasswordVisibility("confirm")}
                        >
                          {showPassword.confirm ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-save-password"
                      onClick={handleSavePassword}
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader size={18} className="spinner" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Cambiar Contraseña
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "cursos" && userData.rol !== "admin" && (
          <div className="cursos-tab-content">
            <CursosInscritosPage inscribedVideos={courses} />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
