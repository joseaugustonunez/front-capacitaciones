import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import {
  Clock,
  Users,
  BookOpen,
  Star,
  Award,
  PlayCircle,
  CheckCircle,
  Search,
  LogIn,
  TrendingUp, 
} from "lucide-react";
import "../styles/cursos.css";
import { obtenerCursosPublicados } from "../api/Cursos";
import { inscribirUsuario, obtenerInscripcionesPorUsuario } from "../api/Inscripciones";
import { obtenerCategorias } from "../api/Categorias";
import toast from "react-hot-toast";

const CursosPage = () => {
  const navigate = useNavigate();

  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [cursosInscritos, setCursosInscritos] = useState(new Set());
  const [cursos, setCursos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [animacionVisible, setAnimacionVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [runTutorial, setRunTutorial] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  // Pasos del tutorial para Driver.js
  const tutorialPasos = [
    {
      element: ".search-input-cursos",
      popover: {
        title: "Buscar cursos",
        description: "Aquí puedes buscar cursos por título, descripción o etiquetas.",
        position: "bottom",
      },
    },
    {
      element: ".filters-section-cursos",
      popover: {
        title: "Filtrar cursos",
        description: "Filtra los cursos por categorías para encontrar más rápido.",
        position: "bottom",
      },
    },
    {
      element: ".courses-grid-cursos",
      popover: {
        title: "Listado de cursos",
        description: "Aquí verás todos los cursos disponibles.",
        position: "top",
      },
    },
    {
      element: ".enroll-btn",
      popover: {
        title: "Inscribirse",
        description: "Haz clic aquí para inscribirte gratis en un curso.",
        position: "top",
      },
    },
  ];

  // Función para iniciar el tutorial
  const iniciarTutorial = () => {
    const driverObj = driver({ 
      showProgress: true,
      steps: tutorialPasos.map(paso => ({
        element: paso.element,
        popover: {
          title: paso.popover.title,
          description: paso.popover.description,
          side: paso.popover.position === "bottom" ? "bottom" : paso.popover.position === "top" ? "top" : "left",
        }
      }))
    });
    driverObj.drive();
  };

  const cargarCursos = useCallback(async (filtros = {}) => {
    try {
      setLoading(true);
      
      const filtrosBackend = {};
      
      if (filtros.categoria && filtros.categoria !== "todos") {
        filtrosBackend.categoria = filtros.categoria;
      }
      
      if (filtros.busqueda && filtros.busqueda.trim()) {
        filtrosBackend.busqueda = filtros.busqueda.trim();
      }

      const data = await obtenerCursosPublicados(filtrosBackend);
      
      setCursos(
        Array.isArray(data)
          ? data.map((curso) => ({
              id: curso.id,
              titulo: curso.titulo,
              descripcion: curso.descripcion,
              imagen: curso.url_miniatura.startsWith("http")
                ? curso.url_miniatura
                : `${backendUrl}${curso.url_miniatura}`,
              rating: curso.rating || 4.5,
              nivel: curso.nivel_dificultad,
              instructor: curso.instructor_nombre,
              total_modulos: curso.total_modulos || 0,
              duracion: `${curso.duracion_horas} horas`,
              lecciones: curso.lecciones || 10,
              fechaInicio: curso.fecha_creacion || new Date().toISOString(),
              tags: curso.tags || [],
              categoria: curso.categoria_nombre,
              id_categoria: curso.id_categoria,
            }))
          : []
      );
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCursos([]);
      toast.error("Error al cargar los cursos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setAnimacionVisible(true);
  }, []);

  useEffect(() => {
    cargarCursos();
  }, [cargarCursos]);

  useEffect(() => {
    cargarCursos({
      categoria: filtroCategoria,
      busqueda: busqueda,
    });
  }, [filtroCategoria, cargarCursos]);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      cargarCursos({
        categoria: filtroCategoria,
        busqueda: busqueda,
      });
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [busqueda, filtroCategoria, cargarCursos]);

  useEffect(() => {
    obtenerCategorias()
      .then((data) => {
        setCategorias([
          { id: "todos", nombre: "Todos los Cursos", icono: BookOpen },
          ...(Array.isArray(data)
            ? data.map((cat) => ({
                id: cat.id.toString(),
                nombre: cat.nombre,
                icono: getIconComponent(cat.icono),
                descripcion: cat.descripcion,
              }))
            : []),
        ]);
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        setCategorias([
          { id: "todos", nombre: "Todos los Cursos", icono: BookOpen },
        ]);
      })
      .finally(() => setLoadingCategorias(false));
  }, []);

  useEffect(() => {
    const cargarInscripciones = async () => {
      try {
        const usuario = JSON.parse(localStorage.getItem("userData"));
        if (!usuario) return;

        const inscripciones = await obtenerInscripcionesPorUsuario(usuario.id);
        const cursosIds = new Set(inscripciones.map((insc) => insc.id_curso));
        setCursosInscritos(cursosIds);
      } catch (error) {
        console.error("Error al cargar inscripciones", error);
      }
    };

    cargarInscripciones();
  }, []);

  const getIconComponent = (iconName) => {
    const iconMap = {
      BookOpen: BookOpen,
      TrendingUp: TrendingUp,
      Award: Award,
      Users: Users,
      PlayCircle: PlayCircle,
    };
    return iconMap[iconName] || BookOpen;
  };

  const handleCategoriaChange = (categoriaId) => {
    setFiltroCategoria(categoriaId);
  };

  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
  };

  const manejarInscripcion = async (cursoId) => {
    try {
      await inscribirUsuario(cursoId);
      toast.success("Te has inscrito correctamente 🎉");

      setCursos((prevCursos) =>
        prevCursos.map((curso) =>
          curso.id === cursoId ? { ...curso, inscrito: true } : curso
        )
      );

      setCursosInscritos((prev) => new Set(prev).add(cursoId));
    } catch (error) {
      console.error("Error al inscribirse:", error);
      toast.error("Hubo un error al inscribirte 😞");
    }
  };

  const manejarIngresarCurso = (cursoId) => {
    navigate(`/curso/${cursoId}`);
  };

  const getNivelClass = (nivel) => {
    switch (nivel) {
      case "principiante":
        return "level-beginner";
      case "intermedio":
        return "level-intermediate";
      case "avanzado":
        return "level-advanced";
      default:
        return "level-default";
    }
  };
  if (!Array.isArray(cursos) && !loading) {
    return (
      <div className="no-results">
        <BookOpen className="no-results-icon-cursos" />
        <h3 className="no-results-title">Error al cargar cursos</h3>
        <p className="no-results-description">
          No se pudieron cargar los cursos. Por favor, intenta de nuevo más tarde.
        </p>
      </div>
    );
  }

  return (
    <div className="cursos-page">


      <header className="hero-header-cursos">
        <div className="hero-overlay-cursos"></div>
        <div className="hero-pattern-cursos"></div>
        <div className={`hero-content-cursos ${animacionVisible ? "visible" : ""}`}>
          <div className="hero-badge-cursos">
            <Award className="hero-badge-icon-cursos-cursos" />
            <span>Certificados Gratuitos</span>
          </div>
          <h1 className="hero-title-cursos">
            Capacítate con
            <span className="hero-title-gradient-cursos">nosotros y crece.</span>
          </h1>
          <p className="hero-subtitle-cursos">
            Desarrolla nuevas habilidades con nuestros cursos especializados
            totalmente gratuitos
          </p>

          <div className="search-container-cursos">
            <div className="search-input-wrapper-cursos">
              <Search className="search-icon-cursos" />
              <input
                type="text"
                placeholder="Buscar cursos..."
                value={busqueda}
                onChange={handleBusquedaChange}
                className="search-input-cursos"
              />
              {loading && busqueda && (
                <div className="search-loading">Buscando...</div>
              )}
            </div>
          </div>

          <div className="hero-stats-cursos filters-section-cursos">
            {categorias.map((categoria) => {
              const IconoCategoria = categoria.icono;
              const isActive = filtroCategoria === categoria.id;
              return (
                <button
                  key={categoria.id}
                  className={`hero-stat-cursos ${isActive ? "active" : ""}`}
                  onClick={() => handleCategoriaChange(categoria.id)}
                  disabled={loading}
                >
                  <IconoCategoria className="filter-btn-icon-cursos-cursos" />
                  <span>{categoria.nombre}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <section className="courses-section-cursos">
        {loading ? (
          <div className="loading-container">
            <p>Cargando cursos...</p>
          </div>
        ) : (
          <div className="courses-grid-cursos">
            {cursos.map((curso, index) => (
              <article
                key={curso.id}
                className={`course-card-cursos ${animacionVisible ? "animate-in" : ""}`}
                style={{
                  animationDelay: `${index * 100}ms`,
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.7)), url(${curso.imagen})`
                }}
              >
                <div className="course-image-container">
                  <div className="course-image-overlay"></div>
                  <div className="course-rating">
                    <Star className="rating-star" />
                    <span>{curso.rating}</span>
                  </div>
                  <div className={`course-level-cursos ${getNivelClass(curso.nivel)}`}>
                    {curso.nivel}
                  </div>
                </div>
                <div className="course-content-cursos">
                  <div className="course-header-cursos">
                    <h3 className="course-title-cursos">{curso.titulo}</h3>
                    <span className="course-free-badge-cursos">GRATIS</span>
                  </div>

                  <div className="course-stats-cursos">
                    <div className="course-stat-cursos">
                      <Clock className="stat-icon-cursos" />
                      <span>{curso.duracion}</span>
                    </div>
                    <div className="course-stat-cursos">
                      <PlayCircle className="stat-icon-cursos" />
                      <span>{curso.total_modulos} Modulos</span>
                    </div>
                  </div>

                  <div className="course-tags">
                    {Array.isArray(curso.tags) &&
                      curso.tags.map((tag) => (
                        <span key={tag} className="course-tag">
                          {tag}
                        </span>
                      ))}
                  </div>

                  <div className="course-buttons">
                    {!cursosInscritos.has(curso.id) ? (
                      <button
                        className="enroll-btn available"
                        onClick={() => manejarInscripcion(curso.id)}
                      >
                        <span>Inscribirse Gratis</span>
                        <PlayCircle className="btn-icon-cursos" />
                      </button>
                    ) : (
                      <div className="enrolled-buttons">
                        <button className="enroll-btn enrolled">
                          <CheckCircle className="btn-icon-cursos" />
                          <span>Inscrito</span>
                        </button>
                        <button
                          className="access-btn-cursos"
                          onClick={() => manejarIngresarCurso(curso.id)}
                        >
                          <LogIn className="btn-icon-cursos" />
                          <span>Ver Módulos</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {cursos.length === 0 && !loading && (
          <div className="no-results">
            <BookOpen className="no-results-icon-cursos" />
            <h3 className="no-results-title">No se encontraron cursos</h3>
            <p className="no-results-description">
              {busqueda 
                ? `No hay cursos que coincidan con "${busqueda}"`
                : "Intenta con una búsqueda diferente o cambia el filtro de categoría."
              }
            </p>
          </div>
        )}
      </section>

      <section className="benefits-section">
        <div className="benefits-container">
          <h3 className="benefits-title">¿Por qué elegir nuestros cursos?</h3>
          <p className="benefits-subtitle">
            Únete a miles de estudiantes que ya han transformado su carrera profesional
          </p>
          <div className="benefits-grid">
            {[
              {
                icono: BookOpen,
                titulo: "Contenido Premium",
                descripcion: "Cursos diseñados por expertos de la industria con contenido actualizado y práctico",
              },
              {
                icono: Users,
                titulo: "Comunidad Global",
                descripcion: "Conecta con estudiantes y profesionales de todo el mundo, comparte experiencias",
              },
              {
                icono: Award,
                titulo: "Certificación Oficial",
                descripcion: "Obtén certificados reconocidos por la industria al completar exitosamente los cursos",
              },
            ].map((beneficio, index) => {
              const IconoBeneficio = beneficio.icono;
              return (
                <div key={index} className="benefit-card">
                  <div className="benefit-icon-cursos">
                    <IconoBeneficio className="benefit-icon-cursos-svg" />
                  </div>
                  <h4 className="benefit-title">{beneficio.titulo}</h4>
                  <p className="benefit-description">{beneficio.descripcion}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Botón flotante para tutorial */}
      <button 
        className="tutorial-btn-float"
        onClick={iniciarTutorial}
        title="Iniciar tutorial guiado"
      >
        <span>?</span>
      </button>
    </div>
  );
};

export default CursosPage;