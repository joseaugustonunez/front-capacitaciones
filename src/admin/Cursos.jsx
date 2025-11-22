import React, { useEffect, useState } from "react";
import {
  obtenerCursos,
  crearCurso,
  actualizarCurso,
  eliminarCurso,
  validarDatosCurso,
  NIVELES_DIFICULTAD,
  ESTADOS_CURSO,
  formatearDuracion,
  formatearFecha,
  obtenerColorNivel,
  obtenerColorEstado,
} from "../api/Cursos";
import { obtenerCategorias } from "../api/Categorias";
import { obtenerInstructores } from "../api/Usuarios";
import {
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Search,
  AlertTriangle,
  X,
  Loader2,
  GraduationCap,
  Clock,
  User,
  Tag,
  Filter,
  Calendar,
  Image,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/cursosAdmin.css";
import toast from "react-hot-toast";

const Cursos = () => {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [instructores, setInstructores] = useState([]);
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    descripcion_corta: "",
    id_instructor: "",
    id_categoria: "",
    url_miniatura: "",
    duracion_horas: "",
    nivel_dificultad: "principiante",
    estado: "borrador",
  });
  const [editandoId, setEditandoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filtros, setFiltros] = useState({
    categoria: "",
    nivel: "",
    estado: "",
    instructor: "",
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [cursosResponse, categoriasData, instructoresData] =
        await Promise.all([
          obtenerCursos(),
          obtenerCategorias(),
          obtenerInstructores(),
        ]);

      const cursosArray = Array.isArray(cursosResponse.cursos)
        ? cursosResponse.cursos
        : [];
      setCursos(cursosArray);
      setCategorias(categoriasData);
      setInstructores(instructoresData);
    } catch (error) {
      console.error("Error al cargar los datos:", error);
    }
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const manejarCambioFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();

    const erroresValidacion = validarDatosCurso(formData);
    if (erroresValidacion.length > 0) {
      setError(erroresValidacion.join(", "));
      return;
    }

    try {
      setLoading(true);
      setError("");

      const form = new FormData();

      form.append("titulo", formData.titulo);
      form.append("descripcion", formData.descripcion || "");
      form.append("descripcion_corta", formData.descripcion_corta || "");
      form.append("id_instructor", formData.id_instructor);
      form.append("id_categoria", formData.id_categoria);
      form.append("duracion_horas", formData.duracion_horas || 0);
      form.append("nivel_dificultad", formData.nivel_dificultad);
      form.append("estado", formData.estado);

      if (formData.miniatura) {
        form.append("imagen", formData.miniatura); // clave "imagen" debe coincidir con la de multer
      }

      if (editandoId) {
        await actualizarCurso(editandoId, form, true); // true = multipart
      } else {
        await crearCurso(form, true);
      }

      resetearFormulario();
      await cargarDatos();
    } catch (err) {
      const errorMsg = err.message || "Error al guardar el curso";
      setError(errorMsg);
      console.error("Error en manejarSubmit:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetearFormulario = () => {
    setFormData({
      titulo: "",
      descripcion: "",
      descripcion_corta: "",
      id_instructor: "",
      id_categoria: "",
      url_miniatura: "",
      duracion_horas: "",
      nivel_dificultad: "principiante",
      estado: "borrador",
    });
    setEditandoId(null);
    setError("");
  };

  const manejarEditar = (curso) => {
    setFormData({
      titulo: curso.titulo,
      descripcion: curso.descripcion || "",
      descripcion_corta: curso.descripcion_corta || "",
      id_instructor: curso.id_instructor.toString(),
      id_categoria: curso.id_categoria.toString(),
      url_miniatura: curso.url_miniatura || "",
      duracion_horas: curso.duracion_horas
        ? curso.duracion_horas.toString()
        : "",
      nivel_dificultad: curso.nivel_dificultad,
      estado: curso.estado,
    });
    setEditandoId(curso.id);
    setError("");
  };

  const manejarCancelar = () => {
    resetearFormulario();
  };

  const manejarEliminar = (id, titulo) => {
    toast((t) => (
      <div className="toast-confirm-container">
        <span className="toast-confirm-text">
          ¿Eliminar el curso <b>"{titulo}"</b>?
        </span>
        <div className="toast-confirm-actions">
          <button
            className="btn-confirm btn-danger"
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                setLoading(true);
                await eliminarCurso(id);
                toast.success(`Curso "${titulo}" eliminado correctamente`);
                await cargarDatos();
              } catch (err) {
                console.error("Error al eliminar el curso:", err);
                toast.error("Error al eliminar el curso");
                setError("Error al eliminar el curso");
              } finally {
                setLoading(false);
              }
            }}
          >
            Sí
          </button>
          <button
            className="btn-confirm btn-success"
            onClick={() => toast.dismiss(t.id)}
          >
            No
          </button>
        </div>
      </div>
    ));
  };

  const limpiarFiltros = () => {
    setFiltros({
      categoria: "",
      nivel: "",
      estado: "",
      instructor: "",
    });
    setSearchTerm("");
  };

  // Filtrado de cursos con protección adicional
  const cursosFiltrados = Array.isArray(cursos)
    ? cursos.filter((curso) => {
        if (!curso) return false;

        const coincideBusqueda =
          curso.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          curso.descripcion_corta
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase());

        const coincideCategoria =
          !filtros.categoria ||
          curso.id_categoria?.toString() === filtros.categoria;
        const coincideNivel =
          !filtros.nivel || curso.nivel_dificultad === filtros.nivel;
        const coincideEstado =
          !filtros.estado || curso.estado === filtros.estado;
        const coincideInstructor =
          !filtros.instructor ||
          curso.id_instructor?.toString() === filtros.instructor;

        return (
          coincideBusqueda &&
          coincideCategoria &&
          coincideNivel &&
          coincideEstado &&
          coincideInstructor
        );
      })
    : [];

  const obtenerNombreCategoria = (id) => {
    if (!Array.isArray(categorias) || !id) return "Sin categoría";
    const categoria = categorias.find((c) => c.id === id);
    return categoria ? categoria.nombre : "Sin categoría";
  };

  const obtenerNombreInstructor = (id) => {
    if (!Array.isArray(instructores) || !id) return "Sin instructor";
    const instructor = instructores.find((i) => i.id === id);
    return instructor
      ? `${instructor.nombre} ${instructor.apellido}`
      : "Sin instructor";
  };

  return (
    <div className="cursos-container">
      {/* Header */}
      <div className="cursos-header">
        <h1 className="cursos-title">
          <BookOpen className="title-icon" size={36} />
          Gestión de Cursos
        </h1>
        <p className="cursos-subtitle">
          Administra todos los cursos de tu plataforma
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <AlertTriangle className="error-icon" size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="cursos-content">
        {/* Formulario */}
        <div className="form-section-cur">
          <h2 className="section-title-cur">
            {editandoId ? "Editar Curso" : "Nuevo Curso"}
          </h2>

          <form onSubmit={manejarSubmit} className="curso-form">
            {/* Título y Duración */}
            <div className="form-row">
              <div className="form-group-curad">
                <label htmlFor="titulo" className="form-label-curad">
                  Título *
                </label>
                <input
                  id="titulo"
                  type="text"
                  name="titulo"
                  placeholder="Título del curso"
                  value={formData.titulo}
                  onChange={manejarCambio}
                  className="form-input"
                  disabled={loading}
                  maxLength={200}
                  required
                />
              </div>

              <div className="form-group-curad">
                <label htmlFor="duracion_horas" className="form-label-curad">
                  Duración (horas)
                </label>
                <input
                  id="duracion_horas"
                  type="number"
                  name="duracion_horas"
                  placeholder="Ej: 40"
                  value={formData.duracion_horas}
                  onChange={manejarCambio}
                  className="form-input"
                  disabled={loading}
                  min="1"
                  max="500"
                />
              </div>
            </div>

            {/* Descripción corta */}
            <div className="form-group-curad">
              <label htmlFor="descripcion_corta" className="form-label-curad">
                Descripción corta *
              </label>
              <textarea
                id="descripcion_corta"
                name="descripcion_corta"
                placeholder="Breve descripción del curso"
                value={formData.descripcion_corta}
                onChange={manejarCambio}
                className="form-textarea"
                disabled={loading}
                maxLength={500}
                rows={2}
                required
              />
            </div>

            {/* Descripción completa */}
            <div className="form-group-curad">
              <label htmlFor="descripcion" className="form-label-curad">
                Descripción completa
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                placeholder="Descripción detallada del curso"
                value={formData.descripcion}
                onChange={manejarCambio}
                className="form-textarea"
                disabled={loading}
                rows={4}
              />
            </div>

            {/* Instructor y Categoría */}
            <div className="form-row">
              <div className="form-group-curad">
                <label htmlFor="id_instructor" className="form-label-curad">
                  Instructor *
                </label>
                <select
                  id="id_instructor"
                  name="id_instructor"
                  value={formData.id_instructor}
                  onChange={manejarCambio}
                  className="form-select"
                  disabled={loading}
                  required
                >
                  <option value="">Seleccionar instructor</option>
                  {instructores.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.nombre} {instructor.apellido}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group-curad">
                <label htmlFor="id_categoria" className="form-label-curad">
                  Categoría *
                </label>
                <select
                  id="id_categoria"
                  name="id_categoria"
                  value={formData.id_categoria}
                  onChange={manejarCambio}
                  className="form-select"
                  disabled={loading}
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Nivel y Estado */}
            <div className="form-row">
              <div className="form-group-curad">
                <label htmlFor="nivel_dificultad" className="form-label-curad">
                  Nivel de dificultad
                </label>
                <select
                  id="nivel_dificultad"
                  name="nivel_dificultad"
                  value={formData.nivel_dificultad}
                  onChange={manejarCambio}
                  className="form-select"
                  disabled={loading}
                >
                  {NIVELES_DIFICULTAD.map((nivel) => (
                    <option key={nivel.value} value={nivel.value}>
                      {nivel.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group-curad">
                <label htmlFor="estado" className="form-label-curad">
                  Estado
                </label>
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={manejarCambio}
                  className="form-select"
                  disabled={loading}
                >
                  {ESTADOS_CURSO.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* URL Miniatura */}
            <div className="form-group-curad">
              <label htmlFor="miniatura" className="file-input-label">
                Subir Imagen
              </label>
              <input
                id="miniatura"
                type="file"
                name="miniatura"
                accept="image/*"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    miniatura: e.target.files[0],
                  }))
                }
                className="hidden-input"
                disabled={loading}
              />
            </div>

            {/* Botones del formulario */}
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="loading-spinner" size={16} />
                ) : (
                  <>
                    {editandoId ? (
                      <Edit3 className="btn-icon" size={16} />
                    ) : (
                      <Plus className="btn-icon" size={16} />
                    )}
                    {editandoId ? "Actualizar" : "Crear"}
                  </>
                )}
              </button>

              {editandoId && (
                <button
                  type="button"
                  onClick={manejarCancelar}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  <X className="btn-icon" size={16} />
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista de cursos */}
        <div className="list-section-curad">
          <div className="list-header-curad">
            <h2 className="section-title-cur">Cursos ({cursos.length})</h2>

            <div className="filters-container-curad">
              {/* Buscador */}
              <div className="search-container-curad">
                <input
                  type="text"
                  placeholder="Buscar cursos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input-curad"
                />
                <Search className="search-icon" size={16} />
              </div>

              {/* Filtros */}
              <div className="filters-grid">
                <select
                  name="categoria"
                  value={filtros.categoria}
                  onChange={manejarCambioFiltro}
                  className="filter-select"
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>

                <select
                  name="nivel"
                  value={filtros.nivel}
                  onChange={manejarCambioFiltro}
                  className="filter-select"
                >
                  <option value="">Todos los niveles</option>
                  {NIVELES_DIFICULTAD.map((nivel) => (
                    <option key={nivel.value} value={nivel.value}>
                      {nivel.label}
                    </option>
                  ))}
                </select>

                <select
                  name="estado"
                  value={filtros.estado}
                  onChange={manejarCambioFiltro}
                  className="filter-select"
                >
                  <option value="">Todos los estados</option>
                  {ESTADOS_CURSO.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>

                <select
                  name="instructor"
                  value={filtros.instructor}
                  onChange={manejarCambioFiltro}
                  className="filter-select"
                >
                  <option value="">Todos los instructores</option>
                  {instructores.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.nombre} {instructor.apellido}
                    </option>
                  ))}
                </select>

                <button
                  onClick={limpiarFiltros}
                  className="btn btn-outline"
                  disabled={loading}
                >
                  <Filter className="btn-icon" size={14} />
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          {/* Estados de la lista */}
          {loading && cursos.length === 0 ? (
            <div className="loading-state">
              <Loader2 className="loading-spinner-large" size={48} />
              <p>Cargando cursos...</p>
            </div>
          ) : cursosFiltrados.length === 0 ? (
            <div className="empty-state">
              <GraduationCap className="empty-icon" size={48} />
              <h3>No hay cursos</h3>
              <p>
                {cursos.length === 0
                  ? "Comienza creando tu primer curso"
                  : "No se encontraron cursos con los filtros aplicados"}
              </p>
            </div>
          ) : (
            <div className="cursos-grid">
              {cursosFiltrados.map((curso) => (
                <div key={curso.id} className="curso-card">
                  {/* Imagen del curso */}
                  <div className="card-image">
                    {curso.url_miniatura ? (
                      <img
                        src={`https://capacitacionback.sistemasudh.com${curso.url_miniatura}`}
                        alt={curso.titulo}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="card-image-placeholder"
                      style={{ display: curso.url_miniatura ? "none" : "flex" }}
                    >
                      <Image size={24} />
                    </div>
                  </div>

                  {/* Contenido del curso */}
                  <div className="card-content">
                    <div className="card-header">
                      <h3 className="curso-titulo">{curso.titulo}</h3>
                      <div className="curso-badges">
                        <span
                          className="badge badge-nivel"
                          style={{
                            backgroundColor: obtenerColorNivel(
                              curso.nivel_dificultad
                            ),
                          }}
                        >
                          {
                            NIVELES_DIFICULTAD.find(
                              (n) => n.value === curso.nivel_dificultad
                            )?.label
                          }
                        </span>
                        <span
                          className="badge badge-estado"
                          style={{
                            backgroundColor: obtenerColorEstado(curso.estado),
                          }}
                        >
                          {
                            ESTADOS_CURSO.find((e) => e.value === curso.estado)
                              ?.label
                          }
                        </span>
                      </div>
                    </div>

                    {curso.descripcion_corta && (
                      <p className="curso-descripcion">
                        {curso.descripcion_corta}
                      </p>
                    )}

                    {/* Metadatos del curso */}
                    <div className="curso-meta">
                      <div className="meta-item">
                        <User className="meta-icon" size={14} />
                        <span>
                          {obtenerNombreInstructor(curso.id_instructor)}
                        </span>
                      </div>
                      <div className="meta-item">
                        <Tag className="meta-icon" size={14} />
                        <span>
                          {obtenerNombreCategoria(curso.id_categoria)}
                        </span>
                      </div>
                      {curso.duracion_horas && (
                        <div className="meta-item">
                          <Clock className="meta-icon" size={14} />
                          <span>{formatearDuracion(curso.duracion_horas)}</span>
                        </div>
                      )}
                      <div className="meta-item">
                        <Calendar className="meta-icon" size={14} />
                        <span>{formatearFecha(curso.fecha_creacion)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones del curso */}
                  <div className="card-actions-curad">
                    <button
                      onClick={() => manejarEditar(curso)}
                      className="btn btn-edit"
                      disabled={loading}
                      title="Editar curso"
                    >
                      <Edit3 className="btn-icon" size={14} />
                      Editar
                    </button>
                    <button
                      onClick={() => manejarEliminar(curso.id, curso.titulo)}
                      className="btn btn-delete"
                      disabled={loading}
                      title="Eliminar curso"
                    >
                      <Trash2 className="btn-icon" size={14} />
                      Eliminar
                    </button>
                    <button
                      onClick={() => navigate(`/modulos/${curso.id}`)}
                      className="btn btn-admin"
                      title="Administrar módulos"
                    >
                      <BookOpen className="btn-icon" size={14} />
                      Administrar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cursos;
