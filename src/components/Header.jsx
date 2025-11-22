import React, { useState, useEffect } from "react";
import {
  Bell,
  User,
  Menu,
  X,
  ChevronDown,
  GraduationCap,
  Settings,
  LogOut,
  BookOpen,
  Award,
  HelpCircle,
  Sun,
  Moon,
} from "lucide-react";
import "../styles/header.css";
import {
  crearNotificacion,
  obtenerNotificacionesPorUsuario,
  marcarNotificacionComoLeida,
  eliminarNotificacion
} from "../api/Notificacion";
import { useNavigate, useLocation } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeLink, setActiveLink] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const savedUserData = localStorage.getItem("userData");
    if (savedUserData) {
      const user = JSON.parse(savedUserData);
      setUserName(user.nombre);
      setUserRole(user.rol);
      setUserId(user.id || user._id);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      loadNotifications();
    }
  }, [userId]);

  useEffect(() => {
    const currentItem = navigationItems.find(item => location.pathname.startsWith(item.href));
    if (currentItem) {
      setActiveLink(currentItem.name);
    }
  }, [location.pathname]);

const loadNotifications = async () => {
  try {
    setLoadingNotifications(true);
    const response = await obtenerNotificacionesPorUsuario(userId);

    let notificacionesArray = [];

    if (Array.isArray(response.data)) {
      notificacionesArray = response.data;
    } else if (response.data && typeof response.data === "object") {
      notificacionesArray = [response.data];
    }

    const notificacionesMapeadas = notificacionesArray.map((notif) => ({
      _id: notif.id || notif._id,
      usuarioId: notif.id_usuario,
      mensaje: notif.mensaje,
      tipo: notif.tipo,
      leida: notif.esta_leida === 1 || notif.esta_leida === true,
      fechaCreacion: notif.fecha_creacion,
      titulo: notif.titulo,
    }));

    setNotifications(notificacionesMapeadas);
  } catch (error) {
    console.error("Error al cargar notificaciones:", error);
    setNotifications([]);
  } finally {
    setLoadingNotifications(false);
  }
};


  const markAsRead = async (notificationId) => {
    try {
      await marcarNotificacionComoLeida(notificationId);
      setNotifications(notifications.map(notif =>
        notif._id === notificationId ? { ...notif, leida: true } : notif
      ));
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await eliminarNotificacion(notificationId);
      setNotifications(notifications.filter(notif => notif._id !== notificationId));
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
    }
  };

  const createNotification = async () => {
    try {
      const nuevaNotificacion = {
        usuarioId: userId,
        mensaje: "Esta es una notificación de prueba",
        tipo: "info"
      };
      await crearNotificacion(nuevaNotificacion);
      loadNotifications();
    } catch (error) {
      console.error("Error al crear notificación:", error);
    }
  };

  const getUnreadNotificationsCount = () => {
    if (!Array.isArray(notifications)) return 0;
    return notifications.filter(n => !n.leida).length;
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else if (prefersDark) {
      setIsDarkMode(true);
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".user-profile-container") &&
        !event.target.closest(".notification-container")
      ) {
        setIsProfileOpen(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    navigate("/");
  };

  const toggleProfile = (e) => {
    e.stopPropagation();
    setIsProfileOpen(!isProfileOpen);
    setShowNotifications(false);
  };

  const toggleNotifications = (e) => {
    e.stopPropagation();
    setShowNotifications(!showNotifications);
    setIsProfileOpen(false);
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode ? "dark" : "light";
    setIsDarkMode(!isDarkMode);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleLinkClick = (linkName) => {
    setActiveLink(linkName);
    setIsMenuOpen(false);
  };

  const navigationItems =
    userRole === "admin"
      ? [
        {
          name: "Inicio",
          href: "/admin",
          icon: <GraduationCap size={16} />,
        },
        {
          name: "Categorias",
          href: "/categoria",
          icon: <GraduationCap size={16} />,
        },
        { name: "Cursos", href: "/curso", icon: <User size={16} /> },
      
      ]
      : [
        {
          name: "Inicio",
          href: "/cursos",
          icon: <GraduationCap size={16} />,
        },
        { name: "Mi Progreso", href: "/miscursos", icon: <Award size={16} /> },
        {
          name: "Certificados",
          href: "/certificados",
          icon: <Award size={16} />,
        },
        { name: "Ayuda", href: "/ayuda", icon: <HelpCircle size={16} /> },
      ];
const NotificationDropdown = () => (
  <div className="notification-dropdown">
    <div className="notification-header">
      <h3>Notificaciones</h3>
      <span className="notification-count">{notifications.length}</span>
    </div>
    <div className="notification-list">
      {loadingNotifications ? (
        <div className="notification-loading">Cargando notificaciones...</div>
      ) : notifications.length === 0 ? (
        <div className="notification-empty">No hay notificaciones</div>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification._id}
            className={`notification-item ${notification.tipo || "info"} ${
              notification.leida ? "read" : "unread"
            }`}
            onClick={() => markAsRead(notification._id)}
          >
            <button
              className="notification-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                deleteNotification(notification._id);
              }}
            >
              ✖
            </button>

            <div className="notification-content">
              {notification.titulo && <h4>{notification.titulo}</h4>}
              <p>{notification.mensaje || "Notificación sin mensaje"}</p>
              <span className="notification-time">
                {notification.fechaCreacion
                  ? new Date(notification.fechaCreacion).toLocaleDateString()
                  : "Fecha no disponible"}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
    <div className="notification-footer">
      <button className="view-all-btn">Ver todas</button>
    </div>
  </div>
);

  const ProfileDropdown = () => (
    <div className="profile-dropdown">
      <div className="profile-info">
        <div className="profile-avatar-large">
          <User size={24} />
        </div>
        <div className="profile-details">
          <h4>{userName}</h4>
          <p>{userRole}</p>
        </div>
      </div>
      <div className="profile-menu">
        <a href="/perfil" className="profile-menu-item">
          <User size={16} />
          <span>Mi Perfil</span>
        </a>
        <div className="profile-divider"></div>
        <button className="profile-menu-item logout" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <header className={`header ${isScrolled ? "scrolled" : ""}`}>
      <div className="header-container">
        <div className="logo">
          <img
            src="../public/img/logg.png"
            alt="Logo"
            className="logo-icon"
            width={28}
            height={28}
          />
          <h1>EduCORE</h1>
        </div>

        <nav className={`nav ${isMenuOpen ? "nav-open" : ""}`}>
          <ul className="nav-list">
            {navigationItems.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  className={`nav-link ${location.pathname.startsWith(item.href) ? "active" : ""}`}
                  onClick={() => handleLinkClick(item.name)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="user-actions">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Cambiar a modo ${isDarkMode ? "claro" : "oscuro"}`}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="notification-container">
            <button className="notification-btn" onClick={toggleNotifications}>
              <Bell size={20} className="notification-icon" />
              {getUnreadNotificationsCount() > 0 && (
                <span className="notification-badge">
                  {getUnreadNotificationsCount()}
                </span>
              )}
            </button>
            {showNotifications && <NotificationDropdown />}
          </div>

          <div className="user-profile-container">
            <div className="user-profile" onClick={toggleProfile}>
              <div className="profile-avatar">
                <User size={20} />
              </div>
              <span className="username">{userName}</span>
              <ChevronDown
                size={16}
                className={`profile-chevron ${isProfileOpen ? "rotated" : ""}`}
              />
            </div>
            {isProfileOpen && <ProfileDropdown />}
          </div>
        </div>

        <button
          className={`mobile-menu-btn ${isMenuOpen ? "active" : ""}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <div className="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;