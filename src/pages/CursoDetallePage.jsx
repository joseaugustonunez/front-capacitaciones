import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Play,
  Clock,
  CheckCircle,
  Lock,
  BookOpen,
  Award,
  Users,
  Star,
  ChevronRight,
  Shield,
  Notebook,
  AlertTriangle,
  FileText,
  Clipboard,
} from "lucide-react";
import "../styles/cursoDetalle.css";
import { toast } from "react-hot-toast"; // <- agregado
import {
  obtenerModulosPorCurso,
  obtenerAvancePorUsuario,
} from "../api/Modulos";
import { obtenerAvanceCursos } from "../api/Cursos";
import { generarCertificado } from "../api/Certificados";
import { obtenerArchivosPorModulo } from "../api/Archivos";
import {
  obtenerExamenes,
  obtenerIntentosPorUsuarioYExamen,
} from "../api/examenesApi";
const BACKEND_ORIGIN =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function CursoDetallePage({ onLessonStart }) {
  const { cursoId } = useParams();
  const navigate = useNavigate();
  const [expandedModule, setExpandedModule] = useState(null);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moduleProgress, setModuleProgress] = useState(new Map());
  const [avance, setAvance] = useState(0);
  const [materialesPorModulo, setMaterialesPorModulo] = useState({});
  const [examenesPorModulo, setExamenesPorModulo] = useState({});
  const [certificateGenerated, setCertificateGenerated] = useState(false); // Added to prevent duplicate certificate generation

  // Move helper functions above useEffect hooks
  const getModuleProgress = (module) => {
    if (module.progress !== undefined) {
      return module.progress;
    }
    return moduleProgress.get(module.id) || 0;
  };

  const getTotalProgress = () => {
    if (!courseData || courseData.modules.length === 0) return 0;
    let totalProgress = 0;
    let moduleCount = 0;
    courseData.modules.forEach((module) => {
      const progress = getModuleProgress(module);
      totalProgress += progress;
      moduleCount++;
    });
    const average = moduleCount > 0 ? totalProgress / moduleCount : 0;
    return Math.round(average);
  };

  const calculateModuleDuration = (videos) => {
    const totalSeconds = videos.reduce(
      (total, video) => total + (video.duracion_segundos || 0),
      0
    );
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, "0")}:00`;
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const buildFileUrl = (url) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    const cleaned = url.replace(/\\/g, "/").replace(/^\/+/, "/");
    return `${BACKEND_ORIGIN}${encodeURI(cleaned)}`;
  };

  useEffect(() => {
    if (!courseData || !moduleProgress.size || !cursoId || certificateGenerated)
      return;

    const totalProgress = getTotalProgress();
    const userData = JSON.parse(localStorage.getItem("userData"));
    const idUsuario = userData?.id;

    if (Math.round(totalProgress) >= 100 && idUsuario && cursoId) {
      const timer = setTimeout(async () => {
        try {
          const result = await generarCertificado({
            id_usuario: idUsuario,
            id_curso: cursoId,
          });
          console.log("✅ Certificado generado exitosamente:", result);
          setCertificateGenerated(true);
        } catch (error) {
          console.error("❌ Error al generar el certificado:", error);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [moduleProgress, cursoId, courseData, certificateGenerated]);
  useEffect(() => {
    const fetchAvance = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("userData"));
        const idUsuario = userData?.id;
        const response = await obtenerAvanceCursos(idUsuario, cursoId);
        if (response && response.length > 0) {
          const cursoUsuario = response.find(
            (item) =>
              item.id_usuario === parseInt(idUsuario) &&
              item.id_curso === parseInt(cursoId)
          );
          if (cursoUsuario) {
            setAvance(parseFloat(cursoUsuario.porcentaje_avance));
          }
        }
      } catch (error) {
        console.error("Error al obtener el avance:", error);
      }
    };
    if (cursoId) fetchAvance();
  }, [cursoId]);

  // Existing useEffect for fetching course data
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!cursoId) return;
      setLoading(true);
      try {
        const data = await obtenerModulosPorCurso(cursoId);
        const transformedData = {
          id: data.id || cursoId,
          title: data.titulo || "Curso",
          description: data.descripcion || "Descripción del curso",
          shortDescription: data.descripcion_corta || "",
          instructor: data.instructor_nombre_completo || "Instructor",
          duration: `${data.duracion_horas || 0}:00:00`,
          certificate: true,
          rating: 4.5,
          students: 1250,
          level: data.nivel_dificultad || "intermedio",
          thumbnail: data.url_miniatura || "",
          total_inscritos: data.total_inscritos,
          modules: Array.isArray(data.modulos)
            ? data.modulos.map((module, index) => ({
                id: module.id,
                title: module.titulo,
                description: module.descripcion,
                duration: calculateModuleDuration(module.videos || []),
                videos: (module.videos || []).length,
                completed: false,
                locked: index > 0,
                lessons: Array.isArray(module.videos)
                  ? module.videos.map((video, videoIndex) => ({
                      id: video.id,
                      title: video.titulo,
                      description: video.descripcion,
                      duration: formatDuration(video.duracion_segundos || 600),
                      completed: false,
                      current: index === 0 && videoIndex === 0,
                      videoUrl:
                        video.url_video ||
                        "https://www.w3schools.com/html/mov_bbb.mp4",
                      thumbnailUrl: video.url_miniatura || "",
                      transcription: video.transcripcion || "",
                      isPreview: video.es_vista_previa === 1,
                      order: video.indice_orden || videoIndex + 1,
                      quiz: {
                        question:
                          "¿Has entendido el contenido de esta lección?",
                        options: [
                          "Sí, perfectamente",
                          "Necesito repasar",
                          "No está claro",
                          "Quiero más ejemplos",
                        ],
                        correct: 0,
                      },
                    }))
                  : [],
              }))
            : [],
        };

        const usuarioData = localStorage.getItem("userData");
        if (usuarioData) {
          const usuario = JSON.parse(usuarioData);
          try {
            const avanceResponse = await obtenerAvancePorUsuario(usuario.id);
            if (Array.isArray(avanceResponse)) {
              const progressMap = new Map();
              avanceResponse.forEach((item) => {
                const porcentaje = parseFloat(item.porcentaje_avance) || 0;
                progressMap.set(item.id_modulo, porcentaje);
              });
              setModuleProgress(progressMap);
              transformedData.modules = transformedData.modules.map(
                (mod, index) => {
                  const porcentaje = progressMap.get(mod.id) || 0;
                  const modCompleted = porcentaje >= 100;
                  let shouldBeUnlocked = index === 0;
                  if (index > 0) {
                    const previousModule = transformedData.modules[index - 1];
                    const previousProgress =
                      progressMap.get(previousModule.id) || 0;
                    shouldBeUnlocked = previousProgress >= 100;
                  }
                  return {
                    ...mod,
                    completed: modCompleted,
                    locked: !shouldBeUnlocked,
                    progress: porcentaje,
                    lessons: mod.lessons.map((lesson) => ({
                      ...lesson,
                      completed: modCompleted,
                    })),
                  };
                }
              );
              const firstUnlockedModule = transformedData.modules.find(
                (mod) => !mod.locked
              );
              if (firstUnlockedModule) {
                setExpandedModule(firstUnlockedModule.id);
              }
            } else {
              console.log(
                " La respuesta no es un array válido:",
                avanceResponse
              );
            }
          } catch (progressError) {
            console.error(" Error obteniendo progreso:", progressError);
          }
        } else {
          console.log(" No hay datos de usuario en localStorage");
        }
        setCourseData(transformedData);
      } catch (err) {
        console.error("Error fetching course modules:", err);
        setError("No se pudieron cargar los módulos del curso");
      } finally {
        setLoading(false);
      }
    };
    fetchCourseData();
  }, [cursoId]);

  useEffect(() => {
    const cargarRecursos = async () => {
      if (!courseData || !Array.isArray(courseData.modules)) return;
      const matMap = {};
      const examMap = {};
      try {
        const todosExamenes = await obtenerExamenes();
        const usuario = JSON.parse(localStorage.getItem("userData") || "{}");
        const idUsuario = usuario?.id || usuario?.id_usuario || null;

        for (const mod of courseData.modules) {
          try {
            const mats = await obtenerArchivosPorModulo(mod.id);
            matMap[mod.id] = mats || [];
          } catch (err) {
            console.error(
              `Error cargando archivos para módulo ${mod.id}:`,
              err
            );
            matMap[mod.id] = [];
          }

          // obtener exámenes del módulo
          const examsForModule = (todosExamenes || []).filter(
            (e) => Number(e.id_modulo) === Number(mod.id)
          );

          // enriquecer con intentos del usuario si existe
          if (idUsuario && examsForModule.length > 0) {
            const enriched = await Promise.all(
              examsForModule.map(async (exam) => {
                try {
                  const intentos = await obtenerIntentosPorUsuarioYExamen(
                    idUsuario,
                    exam.id
                  ).catch(() => []);
                  const listaIntentos = Array.isArray(intentos) ? intentos : [];
                  const count = listaIntentos.length;
                  const best =
                    listaIntentos.length > 0
                      ? Math.max(
                          ...listaIntentos.map((it) =>
                            Number(it.puntaje_total ?? it.puntaje ?? 0)
                          )
                        )
                      : null;
                  return {
                    ...exam,
                    user_intentos: listaIntentos,
                    user_intentos_count: count,
                    user_best_score: best,
                  };
                } catch (err) {
                  console.warn(
                    "Error cargando intentos para examen",
                    exam.id,
                    err
                  );
                  return {
                    ...exam,
                    user_intentos: [],
                    user_intentos_count: 0,
                    user_best_score: null,
                  };
                }
              })
            );
            examMap[mod.id] = enriched;
          } else {
            // sin usuario autenticado o sin exámenes: inicializar campos
            examMap[mod.id] = examsForModule.map((exam) => ({
              ...exam,
              user_intentos: [],
              user_intentos_count: 0,
              user_best_score: null,
            }));
          }
        }

        // debug: mostrar resumen corto en consola (verifica que mats no esté vacío)
        console.log(
          "materialesPorModulo cargados:",
          Object.keys(matMap).map((k) => ({
            modulo: k,
            count: (matMap[k] || []).length,
          }))
        );
      } catch (err) {
        // si falla obtenerExamenes, inicializar vacíos y seguir
        for (const mod of courseData.modules) {
          matMap[mod.id] = matMap[mod.id] || [];
          examMap[mod.id] = examMap[mod.id] || [];
        }
      }
      setMaterialesPorModulo(matMap);
      setExamenesPorModulo(examMap);
      try {
        if (courseData && Array.isArray(courseData.modules)) {
          const updatedModules = courseData.modules.map((mod, idx) => {
            if (idx === 0) {
              const porcentaje = moduleProgress.get(mod.id) || 0;
              const modCompleted = porcentaje >= 100;
              return {
                ...mod,
                locked: false,
                progress: porcentaje,
                completed: modCompleted,
                lessons: mod.lessons.map((l) => ({
                  ...l,
                  completed: modCompleted,
                })),
              };
            }

            const previousModule = courseData.modules[idx - 1];
            const previousProgress = moduleProgress.get(previousModule.id) || 0;

            const prevExams = examMap[previousModule.id] || [];

            let shouldBeUnlocked = false;
            if (prevExams.length > 0) {
              const obligatoryExams = prevExams.filter(
                (e) =>
                  Number(e.es_obligatorio) === 1 || e.es_obligatorio === true
              );

              if (obligatoryExams.length > 0) {
                // Requerir nota mínima en todos los obligatorios
                const allPassed = obligatoryExams.every((e) => {
                  const best = e.user_best_score;
                  const min = Number(e.puntaje_minimo_aprobacion ?? 0);
                  return (
                    best !== null && best !== undefined && Number(best) >= min
                  );
                });
                shouldBeUnlocked = allPassed;
              } else {
                // No hay obligatorios pero sí exámenes: requerir al menos un intento
                const anyAttempt = prevExams.some(
                  (e) =>
                    Number(e.user_intentos_count ?? 0) > 0 ||
                    (e.user_best_score !== null &&
                      e.user_best_score !== undefined)
                );
                shouldBeUnlocked = anyAttempt;
              }
            } else {
              // No hay exámenes en el módulo previo: usar progreso
              shouldBeUnlocked = previousProgress >= 100;
            }

            const porcentaje = moduleProgress.get(mod.id) || 0;
            const modCompleted = porcentaje >= 100;
            return {
              ...mod,
              locked: !shouldBeUnlocked,
              progress: porcentaje,
              completed: modCompleted,
              lessons: mod.lessons.map((l) => ({
                ...l,
                completed: modCompleted,
              })),
            };
          });

          // Evitar re-render infinito: comparar flags clave antes de setState
          const prevSimple = courseData.modules.map((m) => ({
            id: m.id,
            locked: !!m.locked,
            progress: m.progress || 0,
            completed: !!m.completed,
          }));
          const nextSimple = updatedModules.map((m) => ({
            id: m.id,
            locked: !!m.locked,
            progress: m.progress || 0,
            completed: !!m.completed,
          }));
          const equal =
            JSON.stringify(prevSimple) === JSON.stringify(nextSimple);
          if (!equal) {
            setCourseData((prev) => ({ ...prev, modules: updatedModules }));
            const firstUnlockedModule = updatedModules.find((m) => !m.locked);
            if (firstUnlockedModule) setExpandedModule(firstUnlockedModule.id);
          }
        }
      } catch (err) {
        console.warn("Error calculando desbloqueo por nota mínima:", err);
      }
    };

    cargarRecursos();
  }, [courseData]);

  if (loading) {
    return (
      <div className="training-container">
        <div className="loading-container">
          <p>Cargando módulos del curso...</p>
        </div>
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div className="training-container">
        <div className="error-container">
          <BookOpen className="error-icon" />
          <h3>Error al cargar el curso</h3>
          <p>{error || "No se pudo encontrar el curso solicitado"}</p>
        </div>
      </div>
    );
  }

  const handleModuleClick = (moduleId) => {
    const module = courseData.modules.find((m) => m.id === moduleId);
    if (!module.locked) {
      setExpandedModule(expandedModule === moduleId ? null : moduleId);
    }
  };

  // Función modificada para navegar a la vista de videos
  const handleLessonClick = (moduleId, lessonId) => {
    // Navegar a la ruta de videos with los parámetros necesarios
    navigate(`/videos/${moduleId}/${lessonId}`, {
      state: {
        courseData: courseData,
        moduleId: moduleId,
        lessonId: lessonId,
      },
    });

    // También llamar el callback si existe para compatibilidad
    if (onLessonStart) {
      onLessonStart(moduleId, lessonId);
    }
  };

  const getModuleIconClass = (module) => {
    const progress = getModuleProgress(module);
    if (progress >= 100) return "completed";
    if (module.locked) return "locked";
    if (progress > 0) return "in-progress";
    return "not-started";
  };

  const getLessonNumberClass = (moduleId, lesson) => {
    if (completedLessons.has(`${moduleId}-${lesson.id}`)) return "completed";
    if (lesson.current) return "current";
    return "default";
  };

  const getDifficultyBadgeClass = (level) => {
    switch (level) {
      case "basico":
        return "badge-easy";
      case "intermedio":
        return "badge-medium";
      case "avanzado":
        return "badge-hard";
      default:
        return "badge-medium";
    }
  };

  const handleStartExam = (exam) => {
    // Validar intentos permitidos vs usados (si estos campos existen)
    const intentosPermitidos = Number(exam?.intentos_permitidos ?? 1);
    const intentosUsados = Number(exam?.user_intentos_count ?? 0);

    if (intentosUsados >= intentosPermitidos) {
      // Mostrar toast usando react-hot-toast y no navegar al examen
      toast.error("Has agotado tus intentos para este cuestionario.", {
        duration: 4000,
        position: "bottom-right",
      });
      return;
    }

    // Ruta de ejemplo — ajusta según tu router para realizar examen
    navigate(`/examen/realizar/${exam.id}`);
  };

  return (
    <div className="training-container">
      {/* Header */}
      <div className="training-header">
        <div className="header-content">
          <div className="header-flex">
            <div className="header-main">
              <div className="header-title-section">
                <div className="header-icon">
                  <Notebook />
                </div>
                <div>
                  <h1 className="main-title">{courseData.title}</h1>
                  <p className="subtitle">Certificación </p>
                  <div
                    className={`difficulty-badge ${getDifficultyBadgeClass(
                      courseData.level
                    )}`}
                  >
                    {courseData.level.charAt(0).toUpperCase() +
                      courseData.level.slice(1)}
                  </div>
                  <div className="description-container">
                    <p className="description">
                      {courseData.description || courseData.shortDescription}
                    </p>
                  </div>
                </div>
              </div>

              <div className="header-stats">
                <div className="stat-item-detalle">
                  <BookOpen className="stat-icon-detalle" />
                  <span>{courseData.modules.length} módulos </span>
                </div>
                <div className="stat-item-detalle">
                  <Clock className="stat-icon-detalle" />
                  <span>{courseData.duration}</span>
                </div>
                <div className="stat-item-detalle">
                  <Users className="stat-icon-detalle" />
                  <span>{courseData.total_inscritos} estudiantes</span>
                </div>
                <div className="stat-item-detalle">
                  <Star className="star-icon" />
                  <span>{courseData.rating} rating</span>
                </div>
              </div>
            </div>

            {/* Progress Card */}
            <div className="progress-card">
              <div className="progress-center">
                <div className="progress-percentage">{avance}%</div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-detalle-in"
                    style={{ width: `${avance}%` }}
                  ></div>
                </div>
                <p className="progress-text">Progreso completado</p>
              </div>

              {courseData.certificate && (
                <div className="certificate-badge">
                  <Award className="certificate-icon" />
                  <span className="certificate-text">
                    Certificación incluida
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        {/* Instructor Info */}
        <div className="instructor-card">
          <div className="instructor-flex">
            <div className="instructor-avatar">
              {courseData.instructor
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="instructor-info">
              <h3>Instructor</h3>
              <p className="instructor-name">{courseData.instructor}</p>
              <p className="instructor-title">Especialista certificado</p>
            </div>
            <div className="instructor-certification">
              <Shield className="certification-icon" />
              <span>Instructor Certificado</span>
            </div>
          </div>
        </div>

        {/* Modules List */}
        <div className="modules-section">
          <h2 className="modules-title">Contenido del Curso</h2>

          <div className="modules-list">
            {courseData.modules.map((module, index) => {
              const progress = getModuleProgress(module);
              const isExpanded = expandedModule === module.id;
              const iconClass = getModuleIconClass(module);

              return (
                <div key={module.id} className="module-card">
                  {/* Module Header */}
                  <div
                    className={`module-header ${module.locked ? "locked" : ""}`}
                    onClick={() => handleModuleClick(module.id)}
                  >
                    <div className="module-header-flex">
                      <div className="module-info-flex">
                        {/* Module Icon */}
                        <div className={`module-icon ${iconClass}`}>
                          {module.locked ? (
                            <Lock />
                          ) : progress >= 100 ? (
                            <CheckCircle />
                          ) : (
                            `${index + 1}`
                          )}
                        </div>

                        <div className="module-content">
                          <h3 className="module-title">{module.title}</h3>
                          <p className="module-description">
                            {module.description}
                          </p>

                          <div className="module-stats">
                            <span>{module.videos} videos interactivos</span>
                            <span>{module.duration}</span>
                            {!module.locked && module.lessons.length > 0 && (
                              <span>{Math.round(progress)}% completado</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progress and Arrow */}
                      <div className="module-progress-section">
                        {!module.locked && module.lessons.length > 0 && (
                          <div className="module-progress-bar">
                            <div className="progress-bar-container">
                              <div
                                className="progress-bar-detalle"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {!module.locked && module.lessons.length > 0 && (
                          <ChevronRight
                            className={`chevron-icon ${
                              isExpanded ? "expanded" : ""
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Module Content */}
                  {isExpanded && !module.locked && (
                    <div className="module-lessons">
                      <div className="lessons-container">
                        {module.lessons.length > 0 ? (
                          module.lessons.map((lesson, lessonIndex) => {
                            const isCompleted =
                              lesson.completed ||
                              completedLessons.has(`${module.id}-${lesson.id}`);
                            const isCurrent = lesson.current && !isCompleted;
                            const numberClass = getLessonNumberClass(
                              module.id,
                              lesson
                            );

                            return (
                              <div
                                key={lesson.id}
                                className={`lesson-item ${
                                  isCurrent ? "current" : ""
                                } ${isCompleted ? "completed" : ""}`}
                                onClick={() =>
                                  handleLessonClick(module.id, lesson.id)
                                }
                              >
                                <div className="lesson-info">
                                  <div
                                    className={`lesson-number ${numberClass}`}
                                  >
                                    {isCompleted ? (
                                      <CheckCircle />
                                    ) : isCurrent ? (
                                      <Play />
                                    ) : (
                                      lesson.order || lessonIndex + 1
                                    )}
                                  </div>
                                  <div
                                    className={`lesson-details ${
                                      isCurrent ? "current" : ""
                                    }`}
                                  >
                                    <h4>{lesson.title}</h4>
                                    {lesson.description && (
                                      <p className="lesson-description">
                                        {lesson.description}
                                      </p>
                                    )}
                                    <div className="lesson-meta">
                                      <div className="lesson-meta-item">
                                        <Clock />
                                        {lesson.duration}
                                      </div>
                                      <div className="lesson-meta-item">
                                        <Play />
                                        Video + Quiz
                                      </div>
                                      {lesson.isPreview && (
                                        <div className="lesson-meta-item preview">
                                          Vista Previa
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="lesson-actions">
                                  {isCompleted && (
                                    <span className="lesson-status">
                                      Completado
                                    </span>
                                  )}
                                  <button
                                    className={`lesson-button ${
                                      isCompleted ? "secondary" : "primary"
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleLessonClick(module.id, lesson.id);
                                    }}
                                  >
                                    {isCompleted
                                      ? "Revisar"
                                      : isCurrent
                                      ? "Continuar"
                                      : "Iniciar"}
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="no-lessons">
                            <p>Este módulo no tiene videos disponibles aún.</p>
                          </div>
                        )}
                      </div>

                      {/* --- Materiales y Cuestionarios (vista usuario) --- */}
                      {(() => {
                        const materials = materialesPorModulo[module.id] || [];
                        const exams = examenesPorModulo[module.id] || [];
                        const hasResources =
                          materials.length > 0 || exams.length > 0;
                        if (!hasResources) return null;

                        return (
                          <div
                            className="module-resources"
                            style={{
                              marginTop: 16,
                              padding: 12,
                              borderTop: "1px solid #eee",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 12,
                                flexWrap: "wrap",
                              }}
                            >
                              <h4 style={{ margin: 0 }}>Materiales</h4>
                              <small style={{ color: "#666" }}>
                                {materials.length} archivos
                              </small>
                            </div>

                            <div style={{ marginTop: 8 }}>
                              {materials.length > 0 && (
                                <div
                                  className="lessons-container"
                                  style={{ padding: 0 }}
                                >
                                  {materials.map((archivo, i) => (
                                    <div
                                      key={archivo.id || `mat-${i}`}
                                      className="lesson-item resource-card material-card"
                                      onClick={() =>
                                        archivo.url_archivo &&
                                        window.open(
                                          buildFileUrl(archivo.url_archivo),
                                          "_blank"
                                        )
                                      }
                                      title="Abrir material"
                                      role="link"
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (
                                          e.key === "Enter" ||
                                          e.key === " "
                                        ) {
                                          e.preventDefault();
                                          archivo.url_archivo &&
                                            window.open(
                                              buildFileUrl(archivo.url_archivo),
                                              "_blank"
                                            );
                                        }
                                      }}
                                    >
                                      <div className="lesson-info">
                                        <div className="lesson-number default">
                                          <FileText size={16} />
                                        </div>

                                        <div className="lesson-details">
                                          <h4 className="resource-title">
                                            {archivo.nombre_archivo ||
                                              "Material"}
                                          </h4>
                                          {archivo.descripcion && (
                                            <p
                                              className="lesson-description"
                                              style={{ margin: 4 }}
                                            >
                                              {archivo.descripcion}
                                            </p>
                                          )}
                                          <div className="lesson-meta">
                                            {archivo.tamano && (
                                              <div className="lesson-meta-item">
                                                {archivo.tamano}
                                              </div>
                                            )}
                                            {archivo.created_at && (
                                              <div className="lesson-meta-item">
                                                •{" "}
                                                {new Date(
                                                  archivo.created_at
                                                ).toLocaleDateString()}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div
                                        className="lesson-actions"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <a
                                          className="lesson-button secondary"
                                          href={
                                            archivo.url_archivo
                                              ? buildFileUrl(
                                                  archivo.url_archivo
                                                )
                                              : "#"
                                          }
                                          target="_blank"
                                          rel="noreferrer"
                                          download
                                        >
                                          Descargar
                                        </a>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {exams.length > 0 && (
                                <>
                                  <div
                                    style={{
                                      marginTop: 12,
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                    }}
                                  >
                                    <h4 style={{ margin: 0 }}>Cuestionarios</h4>
                                    <small style={{ color: "#666" }}>
                                      {exams.length} cuestionarios
                                    </small>
                                  </div>

                                  <div style={{ marginTop: 8 }}>
                                    <div
                                      className="lessons-container"
                                      style={{ padding: 0 }}
                                    >
                                      {exams.map((exam, i) => {
                                        const moduleCompleted =
                                          getModuleProgress(module) >= 100;
                                        return (
                                          <div
                                            key={exam.id || `exam-${i}`}
                                            className={`lesson-item resource-card exam-card ${
                                              moduleCompleted ? "" : "disabled"
                                            }`}
                                            title={
                                              moduleCompleted
                                                ? "Iniciar cuestionario"
                                                : "Completa el módulo para habilitar el examen"
                                            }
                                            role={
                                              moduleCompleted
                                                ? "button"
                                                : "presentation"
                                            }
                                            tabIndex={moduleCompleted ? 0 : -1}
                                            onClick={() => {
                                              if (moduleCompleted)
                                                return handleStartExam(exam);
                                              toast.error(
                                                "Completa el módulo (último video) para habilitar este examen"
                                              );
                                            }}
                                            onKeyDown={(e) => {
                                              if (!moduleCompleted) return;
                                              if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                              ) {
                                                e.preventDefault();
                                                handleStartExam(exam);
                                              }
                                            }}
                                          >
                                            <div className="lesson-info">
                                              <div className="lesson-number default">
                                                <Clipboard size={16} />
                                              </div>

                                              <div className="lesson-details">
                                                <h4>
                                                  {exam.titulo ||
                                                    `Cuestionario ${i + 1}`}
                                                </h4>
                                                <div className="lesson-meta">
                                                  <div className="lesson-meta-item">
                                                    Intentos permitidos:{" "}
                                                    {exam.intentos_permitidos ??
                                                      1}
                                                  </div>
                                                  <div className="lesson-meta-item">
                                                    Tus intentos:{" "}
                                                    {exam.user_intentos_count ??
                                                      0}
                                                  </div>
                                                  <div className="lesson-meta-item">
                                                    Mejor nota:{" "}
                                                    {exam.user_best_score !==
                                                    null
                                                      ? `${Number(
                                                          exam.user_best_score
                                                        ).toFixed(2)}`
                                                      : "—"}
                                                  </div>
                                                  {exam.tiempo_minutos && (
                                                    <div className="lesson-meta-item">
                                                      • {exam.tiempo_minutos}{" "}
                                                      min
                                                    </div>
                                                  )}
                                                  {!moduleCompleted && (
                                                    <div
                                                      className="lesson-meta-item"
                                                      style={{
                                                        color: "#f59e0b",
                                                      }}
                                                    >
                                                      Completa el módulo para
                                                      habilitar este examen
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>

                                            <div
                                              className="lesson-actions"
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                            >
                                              <button
                                                className="lesson-button primary"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (moduleCompleted)
                                                    handleStartExam(exam);
                                                  else
                                                    toast.error(
                                                      "Completa el módulo (último video) para habilitar este examen"
                                                    );
                                                }}
                                                disabled={!moduleCompleted}
                                              >
                                                Iniciar
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive Features Info */}
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon primary">
              <Play />
            </div>
            <h3 className="feature-title">Videos Interactivos</h3>
            <p className="feature-description">
              Contenido audiovisual con controles avanzados y evaluaciones
              integradas durante la reproducción.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon accent">
              <CheckCircle />
            </div>
            <h3 className="feature-title">Evaluaciones en Tiempo Real</h3>
            <p className="feature-description">
              Cuestionarios que aparecen automáticamente durante los videos para
              reforzar el aprendizaje.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon secondary">
              <Award />
            </div>
            <h3 className="feature-title">Progreso Detallado</h3>
            <p className="feature-description">
              Seguimiento completo de tu avance con desbloqueo progresivo de
              contenido y certificación final.
            </p>
          </div>
        </div>

        {/* Warning Note */}
        <div className="warning-note">
          <div className="warning-content">
            <AlertTriangle className="warning-icon" />
            <div className="warning-text">
              <p className="warning-title">Capacitación Interactiva:</p>
              <p className="warning-description">
                Cada lección incluye videos con evaluaciones integradas que
                aparecen automáticamente. Debes completar tanto el video como el
                cuestionario para avanzar al siguiente contenido. Los módulos se
                desbloquean progresivamente conforme completes el anterior.
              </p>
            </div>
          </div>
        </div>

        {/* Start/Continue Button */}
        {courseData.modules.length > 0 && (
          <div className="start-section">
            {getTotalProgress() === 0 &&
            courseData.modules[0].lessons.length > 0 ? (
              <button
                onClick={() =>
                  handleLessonClick(
                    courseData.modules[0].id,
                    courseData.modules[0].lessons[0].id
                  )
                }
                className="start-button"
              >
                <Play />
                Comenzar Capacitación Interactiva
              </button>
            ) : (
              getTotalProgress() > 0 &&
              getTotalProgress() < 100 && (
                <button
                  onClick={() => {
                    // Encontrar el primer módulo no completado
                    const nextModule = courseData.modules.find((mod) => {
                      const progress = getModuleProgress(mod);
                      return progress < 100 && !mod.locked;
                    });

                    if (nextModule && nextModule.lessons.length > 0) {
                      handleLessonClick(
                        nextModule.id,
                        nextModule.lessons[0].id
                      );
                    }
                  }}
                  className="start-button"
                >
                  <Play />
                  Continuar Capacitación
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
