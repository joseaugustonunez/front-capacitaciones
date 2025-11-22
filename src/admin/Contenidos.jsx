import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { obtenerVideos } from "../api/Videos";
import {
  analizarContenidosVideo,
  obtenerInteraccionesPorVideo,
  obtenerInteraccionPorId,
  crearInteraccion,
  actualizarInteraccion,
  obtenerProgresoUsuario,
  verificarProgreso,
  obtenerEstadisticasInteraccion,
  reiniciarProgresoUsuario,
  eliminarInteraccion as eliminarInteraccionApi,
  procesarRespuesta as procesarRespuestaApi
} from "../api/Interacciones";
import { obtenerTiposInteraccion } from "../api/TiposInteracciones";
import "../styles/gestionvideos.css";
import "../styles/contenidos.css";
import { Video, AlertTriangle, CheckSquare, CheckSquare as CheckSquareIcon, BarChart, Type, MousePointer, Target, MessageSquare, Star as StarIcon, Users, ArrowLeft } from "lucide-react";
import VideoPlayer from "../components/Admin/VideoPlayer";
import Timeline from "../components/Admin/Timeline";
import InteractionModal from "../components/Admin/InteractionModal";
import ContentEditor from "../components/Admin/ContentEditor";
import Sidebar from "../components/Admin/Sidebar";
import toast from "react-hot-toast";

const ContenidosPage = () => {
  const { id } = useParams();
  const [videos, setVideos] = useState([]);
  const [videoSeleccionado, setVideoSeleccionado] = useState(null);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [errorVideos, setErrorVideos] = useState(null);

  const interactionTimeoutRef = useRef(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const storedUserData = localStorage.getItem("userData");
  const userData = storedUserData ? JSON.parse(storedUserData) : null;
  const idUsuario = userData?.id || null;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [contenidos, setContenidos] = useState([]);
  const [contenidoSeleccionado, setContenidoSeleccionado] = useState(null);
  const [mostrandoEditor, setMostrandoEditor] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [interaccionActiva, setInteraccionActiva] = useState(null);
  const [respuestaUsuario, setRespuestaUsuario] = useState({});
  const [interaccionesCompletadas, setInteraccionesCompletadas] = useState(new Set());
  const [progresoUsuario, setProgresoUsuario] = useState(null);
  const [respuestaProcesada, setRespuestaProcesada] = useState(null);
  const [mostrarRetroalimentacion, setMostrarRetroalimentacion] = useState(false);
  const [inicioRespuesta, setInicioRespuesta] = useState(null);
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    tiempo_activacion_segundos: 0,
    id_tipo_interaccion: "",
    puntos: 0,
    es_obligatorio: false,
    esta_activo: true,
    configuracion: {},
    opciones: []
  });
  const [loading, setLoading] = useState(false);
  const [loadingContenidos, setLoadingContenidos] = useState(true);
  const [loadingProgreso, setLoadingProgreso] = useState(false);
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [tiposInteraccion, setTiposInteraccion] = useState([]);
  const ultimaInteraccionMostradaRef = useRef(null);

  const colorMap = {
    cuestionario: { icon: CheckSquareIcon, color: "#3B82F6" },
    opcion_multiple: { icon: CheckSquareIcon, color: "#3B82F6" },
    encuesta: { icon: BarChart, color: "#10B981" },
    completar_espacios: { icon: Type, color: "#8B5CF6" },
    arrastrar_soltar: { icon: MousePointer, color: "#F59E0B" },
    puntos_interaccion: { icon: Target, color: "#EF4444" },
    entrada_texto: { icon: MessageSquare, color: "#06B6D4" },
    calificacion: { icon: StarIcon, color: "#F97316" },
    votacion: { icon: Users, color: "#84CC16" },
  };

  useEffect(() => {
    setLoadingVideos(true);
    obtenerVideos()
      .then(data => {
        const videosArray = data?.data || data?.videos || data || [];
        setVideos(videosArray);
        if (id) {
          const vid = videosArray.find(v => v.id.toString() === id);
          setVideoSeleccionado(vid || null);
        } else {
          setVideoSeleccionado(videosArray[0] || null);
        }
      })
      .catch(() => setVideos([]))
      .finally(() => setLoadingVideos(false));
  }, [id]);

  useEffect(() => {
    const cargarTiposInteraccion = async () => {
      try {
        const tipos = await obtenerTiposInteraccion();
        const tiposConEstilo = tipos.map(tipo => ({
          ...tipo,
          icon: colorMap[tipo.nombre]?.icon || CheckSquareIcon,
          color: colorMap[tipo.nombre]?.color || "#000000",
        }));
        setTiposInteraccion(tiposConEstilo);
      } catch (error) {
        setError(`Error al cargar tipos de interacción: ${error.message}`);
      }
    };
    cargarTiposInteraccion();
  }, []);

  useEffect(() => {
    if (videoSeleccionado?.id) {
      cargarContenidos();
      if (idUsuario) {
        cargarProgresoUsuario();
      }
    }
  }, [videoSeleccionado?.id, idUsuario]);

  useEffect(() => {
    if (interaccionActiva) {
      setInicioRespuesta(Date.now());
    }
  }, [interaccionActiva]);

  const tiempo_respuesta = inicioRespuesta
    ? Math.floor((Date.now() - inicioRespuesta) / 1000)
    : 0;

  useEffect(() => {
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    if (isPlaying && contenidos.length > 0 && !interaccionActiva) {
      interactionTimeoutRef.current = setTimeout(async () => {
        try {
          const contenidosActivos = contenidos.filter(c => c.esta_activo);
          const interaccionPendiente = contenidosActivos.find(
            contenido =>
              Math.abs(currentTime - contenido.tiempo_activacion_segundos) < 0.5 &&
              !interaccionesCompletadas.has(contenido.id) &&
              ultimaInteraccionMostradaRef.current !== contenido.id
          );
          if (interaccionPendiente) {
            ultimaInteraccionMostradaRef.current = interaccionPendiente.id;
            setInteraccionActiva(interaccionPendiente);
            setTimeout(() => {
              setIsPlaying(false);
              if (videoRef.current && typeof videoRef.current.pause === "function") {
                videoRef.current.pause();
              }
            }, 300);
            try {
              const progreso = await verificarProgreso(idUsuario, videoSeleccionado.id, currentTime);
              if (!progreso.puede_continuar) {
                const tiempoSeguro = Math.max(0, Math.min(progreso.tiempo_retroceso, duration || 0));
                setCurrentTime(tiempoSeguro);
                if (videoRef.current) {
                  if (typeof videoRef.current.seekTo === "function") {
                    videoRef.current.seekTo(tiempoSeguro);
                  } else if (videoRef.current.currentTime !== undefined) {
                    videoRef.current.currentTime = tiempoSeguro;
                  }
                }
                setTimeout(() => {
                  setIsPlaying(true);
                }, 100);
                mostrarMensaje("Debes completar las interacciones anteriores antes de continuar", true);
                return;
              }
            } catch (error) { }
          }
        } catch (error) { }
      }, 100);
    }
    return () => {
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, [currentTime, isPlaying, contenidos, interaccionActiva, interaccionesCompletadas, idUsuario, videoSeleccionado?.id, duration]);

  const validarRespuesta = () => {
    if (!interaccionActiva) return false;
    const tipo = obtenerTipoInteraccion(interaccionActiva.id_tipo_interaccion);
    switch (tipo?.nombre) {
      case "cuestionario":
      case "opcion_multiple":
      case "votacion":
      case "seleccion_multiple":
        return (
          Array.isArray(respuestaUsuario.opciones_seleccionadas) &&
          respuestaUsuario.opciones_seleccionadas.length > 0
        );
      case "entrada_texto":
        return (
          respuestaUsuario.texto &&
          respuestaUsuario.texto.trim().length > 0
        );
      case "encuesta":
        return (
          respuestaUsuario.rating !== undefined ||
          (respuestaUsuario.opinion &&
            respuestaUsuario.opinion.trim().length > 0)
        );
      case "calificacion":
        return Array.isArray(respuestaUsuario.opciones_seleccionadas) &&
          respuestaUsuario.opciones_seleccionadas.length > 0;
      case "completar_espacios": {
        if (
          !Array.isArray(respuestaUsuario.opciones_seleccionadas) ||
          respuestaUsuario.opciones_seleccionadas.length === 0
        ) {
          return false;
        }
        const correctas = interaccionActiva.opciones
          .filter((o) => o.es_correcta)
          .map((o) => o.id);
        const seleccionadas = respuestaUsuario.opciones_seleccionadas.filter(
          (id) => typeof id === "number"
        );
        return (
          seleccionadas.length === correctas.length &&
          seleccionadas.every((id) => correctas.includes(id))
        );
      }
      default:
        return true;
    }
  };

  const cargarContenidos = async () => {
    if (!videoSeleccionado?.id) return;
    setLoadingContenidos(true);
    setError("");
    try {
      const response = await obtenerInteraccionesPorVideo(videoSeleccionado.id);
      setContenidos(response || []);
      setEstadisticas(analizarContenidosVideo(response || []));
    } catch (error) {
      setError(`Error al cargar contenidos: ${error.message}`);
      setContenidos([]);
    } finally {
      setLoadingContenidos(false);
    }
  };

const eliminarInteraccion = async (id) => {
  toast.custom((t) => (
    <div className={`toast-confirm ${t.visible ? "show" : "hide"}`}>
      <p className="toast-confirm-text">
        ¿Eliminar esta interacción permanentemente?
      </p>
      <div className="toast-confirm-actions">
        <button
          className="btn-confirm btn-danger"
          onClick={async () => {
            toast.dismiss(t.id);
            try {
              const result = await eliminarInteraccionApi(id);
              if (result?.success) {
                setContenidos((prev) => prev.filter((c) => c.id !== id));
                toast.success("Interacción eliminada correctamente");
              } else {
                toast.error("Error: " + (result?.message || "No se pudo eliminar"));
              }
            } catch (error) {
              toast.error("Error interno del servidor");
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



  const cargarProgresoUsuario = async () => {
    if (!idUsuario || !videoSeleccionado?.id) return;
    setLoadingProgreso(true);
    try {
      const progreso = await obtenerProgresoUsuario(idUsuario, videoSeleccionado.id);
      setProgresoUsuario(progreso);
      if (progreso && progreso.progreso) {
        const completadas = new Set(
          progreso.progreso
            .filter(p => p.completada && p.es_correcta)
            .map(p => p.id_contenido_interactivo)
        );
        setInteraccionesCompletadas(completadas);
      }
    } catch (error) {
      setError(`Error al cargar progreso: ${error.message}`);
    } finally {
      setLoadingProgreso(false);
    }
  };

  const mostrarMensaje = (mensaje, esError = false) => {
    if (esError) {
      setError(mensaje);
      setMensajeExito("");
    } else {
      setMensajeExito(mensaje);
      setError("");
    }
    setTimeout(() => {
      setError("");
      setMensajeExito("");
    }, 5000);
  };

  const procesarRespuestaUsuario = async () => {
    try {
      setLoading(true);
      if (!validarRespuesta() && interaccionActiva.es_obligatorio) {
        mostrarMensaje("Debes completar esta interacción para continuar", true);
        setLoading(false);
        return;
      }
      const tipoInteraccion = obtenerTipoInteraccion(interaccionActiva.id_tipo_interaccion);
      if (!tipoInteraccion) {
        throw new Error(`Tipo de interacción no encontrado para ID: ${interaccionActiva.id_tipo_interaccion}`);
      }
      let datosRespuesta = {};
      switch (tipoInteraccion.nombre) {
        case "cuestionario":
        case "opcion_multiple":
        case "votacion":
          if (!respuestaUsuario.opciones_seleccionadas?.length) {
            throw new Error("No hay opciones seleccionadas para cuestionario/votación");
          }
          datosRespuesta = { opciones_seleccionadas: respuestaUsuario.opciones_seleccionadas };
          break;
        case "seleccion_multiple":
          datosRespuesta = { opciones_seleccionadas: respuestaUsuario.opciones_seleccionadas || [] };
          break;
        case "entrada_texto":
          if (!respuestaUsuario.texto?.trim()) {
            throw new Error("No hay texto ingresado para entrada_texto");
          }
          datosRespuesta = { texto: respuestaUsuario.texto.trim() };
          break;
        case "arrastrar_soltar": {
          const opcionesValidas = (respuestaUsuario.opciones_seleccionadas || [])
            .filter((id) => typeof id === "number" && !isNaN(id));
          if (!opcionesValidas.length) {
            throw new Error("Debes arrastrar y soltar al menos una opción");
          }
          datosRespuesta = { opciones_seleccionadas: opcionesValidas };
          break;
        }
        case "encuesta":
          datosRespuesta = { rating: respuestaUsuario.rating, opinion: respuestaUsuario.opinion || "" };
          break;
        case "calificacion":
          if (!respuestaUsuario.opciones_seleccionadas?.length) {
            throw new Error("No hay opción seleccionada para calificación");
          }
          datosRespuesta = {
            opciones_seleccionadas: respuestaUsuario.opciones_seleccionadas
          };
          break;
        case "completar_espacios":
          const opcionesValidas = (respuestaUsuario.opciones_seleccionadas || []).filter((id) => typeof id === "number");
          if (!opcionesValidas.length) {
            throw new Error("No hay opciones válidas seleccionadas para completar_espacios");
          }
          datosRespuesta = { opciones_seleccionadas: opcionesValidas };
          break;
        default:
          datosRespuesta = respuestaUsuario;
      }
      const requestData = {
        id_usuario: idUsuario,
        id_contenido_interactivo: interaccionActiva.id,
        datos_respuesta: datosRespuesta,
        tiempo_respuesta_segundos: tiempo_respuesta || 10
      };
      if (!requestData.id_usuario) throw new Error("ID de usuario no válido");
      if (!requestData.id_contenido_interactivo) throw new Error("ID de contenido interactivo no válido");
      if (!Object.keys(requestData.datos_respuesta).length) throw new Error("Datos de respuesta vacíos");
      const serverResponse = await procesarRespuestaApi(requestData);
      let evaluacion, puntos_obtenidos, numero_intento, debe_retroceder, tiempo_retroceso;
      if (serverResponse.success !== undefined) {
        if (!serverResponse.success) {
          const errorMsg = serverResponse.message || serverResponse.error || "Error desconocido del servidor";
          throw new Error(`Error del servidor: ${errorMsg}`);
        }
        const data = serverResponse.data || {};
        evaluacion = data.evaluacion;
        puntos_obtenidos = data.puntos_obtenidos ?? 0;
        numero_intento = data.numero_intento ?? 1;
        debe_retroceder = data.debe_retroceder ?? false;
        tiempo_retroceso = data.tiempo_retroceso ?? null;
      } else {
        evaluacion = serverResponse.evaluacion;
        puntos_obtenidos = serverResponse.puntos_obtenidos ?? 0;
        numero_intento = serverResponse.numero_intento ?? 1;
        debe_retroceder = serverResponse.debe_retroceder ?? false;
        tiempo_retroceso = serverResponse.tiempo_retroceso ?? null;
      }
      if (!evaluacion) throw new Error("No se recibió evaluación del servidor");
      setRespuestaProcesada({
        esCorrecta: evaluacion.es_correcta,
        retroalimentacion: evaluacion.retroalimentacion || (evaluacion.es_correcta ? "¡Correcto!" : "Incorrecto"),
        puntos: puntos_obtenidos
      });
      setMostrarRetroalimentacion(true);
      setIsPlaying(false);
      if (videoRef.current?.pause) videoRef.current.pause();
      if (evaluacion.es_correcta) {
        setInteraccionesCompletadas((prev) => new Set([...prev, interaccionActiva.id]));
        setTimeout(() => {
          setInteraccionActiva(null);
          setRespuestaUsuario({});
          setMostrarRetroalimentacion(false);
          setRespuestaProcesada(null);
          setIsPlaying(true);
          if (videoRef.current?.play) videoRef.current.play();
        }, 3000);
      } else {
        let tiempoDeRetroceso = 0;
        if (tiempo_retroceso != null && !isNaN(Number(tiempo_retroceso))) {
          tiempoDeRetroceso = Number(tiempo_retroceso);
        } else {
          const interaccionesAnteriores = contenidos
            .filter((c) => c.esta_activo && c.tiempo_activacion_segundos < interaccionActiva.tiempo_activacion_segundos)
            .sort((a, b) => b.tiempo_activacion_segundos - a.tiempo_activacion_segundos);
          if (interaccionesAnteriores.length > 0) {
            const anterior = interaccionesAnteriores[0];
            tiempoDeRetroceso = Math.max(0, anterior.tiempo_activacion_segundos - 0.2);
          } else {
            tiempoDeRetroceso = 0;
          }
        }
        setTimeout(() => {
          const tiempoSeguro = Math.max(0, Math.min(tiempoDeRetroceso, duration || 0));
          setInteraccionActiva(null);
          setRespuestaUsuario({});
          setMostrarRetroalimentacion(false);
          setRespuestaProcesada(null);
          ultimaInteraccionMostradaRef.current = null;
          seekToTimeRobust(tiempoSeguro);
          setTimeout(() => {
            setCurrentTime(tiempoSeguro);
            setTimeout(() => {
              setIsPlaying(true);
              if (videoRef.current?.play) {
                videoRef.current.play();
              }
            }, 200);
          }, 300);
          mostrarMensaje(
            tiempoDeRetroceso === 0 ? "Respuesta incorrecta. Volviendo al inicio." : "Respuesta incorrecta. Regresando a la interacción anterior.",
            true
          );
        }, 3000);
      }
      if (idUsuario && videoSeleccionado?.id) {
        await cargarProgresoUsuario();
      }
    } catch (error) {
      let mensajeError = "Error procesando respuesta: ";
      if (error.response?.data?.message) mensajeError += error.response.data.message;
      else if (error.response?.data?.error) mensajeError += error.response.data.error;
      else mensajeError += error.message;
      setRespuestaProcesada({ esCorrecta: false, retroalimentacion: mensajeError, puntos: 0 });
      setMostrarRetroalimentacion(true);
      setTimeout(() => {
        setMostrarRetroalimentacion(false);
        setRespuestaProcesada(null);
        setInteraccionActiva(null);
        setRespuestaUsuario({});
        setIsPlaying(true);
        if (videoRef.current?.play) videoRef.current.play();
      }, 4000);
    } finally {
      setLoading(false);
    }
  };

  const seekToTimeRobust = (seconds) => {
    const s = Number(seconds) || 0;
    setCurrentTime(s);
    if (!videoRef.current) return;
    const verificarSeek = (tiempoEsperado, intentos = 0) => {
      if (intentos > 5) return;
      setTimeout(() => {
        let tiempoActual = null;
        if (videoRef.current?.getCurrentTime) {
          tiempoActual = videoRef.current.getCurrentTime();
        } else if (videoRef.current?.currentTime !== undefined) {
          tiempoActual = videoRef.current.currentTime;
        }
        if (tiempoActual !== null && Math.abs(tiempoActual - tiempoEsperado) > 0.5) {
          realizarSeek(s);
          verificarSeek(tiempoEsperado, intentos + 1);
        }
      }, 200);
    };
    const realizarSeek = (tiempo) => {
      try {
        if (typeof videoRef.current.seekTo === "function") {
          videoRef.current.seekTo(tiempo, "seconds");
          return;
        }
        if (typeof videoRef.current.getInternalPlayer === "function") {
          const internal = videoRef.current.getInternalPlayer();
          if (internal) {
            if (typeof internal.seekTo === "function") {
              internal.seekTo(tiempo);
              return;
            }
            if ("currentTime" in internal) {
              internal.currentTime = tiempo;
              return;
            }
          }
        }
        if ("currentTime" in videoRef.current) {
          videoRef.current.currentTime = tiempo;
          return;
        }
      } catch (err) { }
    };
    realizarSeek(s);
    verificarSeek(s);
  };

  const saltarInteraccion = () => {
    if (interaccionActiva && !interaccionActiva.es_obligatorio) {
      setInteraccionesCompletadas(prev => new Set([...prev, interaccionActiva.id]));
      setInteraccionActiva(null);
      setRespuestaUsuario({});
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const agregarInteraccionEnTiempo = async (tiempo) => {
    setFormData({
      titulo: "",
      descripcion: "",
      tiempo_activacion_segundos: Math.floor(tiempo),
      id_tipo_interaccion: tiposInteraccion.length > 0 ? tiposInteraccion[0].id : "",
      puntos: 0,
      es_obligatorio: false,
      esta_activo: true,
      configuracion: {},
      opciones: [],
    });
    setMostrandoEditor(true);
    setContenidoSeleccionado(null);
  };

  const editarContenido = async (contenido) => {
    let contenidoCompleto = contenido;
    if (contenido.id && (!contenido.configuracion || Object.keys(contenido.configuracion).length === 0)) {
      try {
        contenidoCompleto = await obtenerInteraccionPorId(contenido.id);
      } catch (error) {
        contenidoCompleto = contenido;
      }
    }
    setFormData({
      titulo: contenidoCompleto.titulo || "",
      descripcion: contenidoCompleto.descripcion || "",
      tiempo_activacion_segundos: contenidoCompleto.tiempo_activacion_segundos || 0,
      id_tipo_interaccion: contenidoCompleto.id_tipo_interaccion || "",
      puntos: contenidoCompleto.puntos || 0,
      es_obligatorio: contenidoCompleto.es_obligatorio || false,
      esta_activo: contenidoCompleto.esta_activo !== false,
      configuracion: contenidoCompleto.configuracion || {},
      opciones: contenidoCompleto.opciones || [],
    });
    setContenidoSeleccionado(contenidoCompleto);
    setMostrandoEditor(true);
  };

  const guardarContenido = async (datosTransformados = null) => {
    if (!videoSeleccionado?.id) {
      mostrarMensaje("ID de video es requerido", true);
      return;
    }
    let datosCompletos;
    if (datosTransformados) {
      datosCompletos = datosTransformados;
    } else {
      if (!formData.id_tipo_interaccion) {
        mostrarMensaje("Debe seleccionar un tipo de interacción", true);
        return;
      }
      const tipoSeleccionado = tiposInteraccion.find(t => t.id === formData.id_tipo_interaccion);
      if (!tipoSeleccionado) {
        mostrarMensaje("Tipo de interacción no válido", true);
        return;
      }
      datosCompletos = {
        id_video: videoSeleccionado.id,
        tipo_interaccion: tipoSeleccionado.nombre,
        titulo: formData.titulo?.trim(),
        descripcion: formData.descripcion?.trim(),
        tiempo_activacion_segundos: formData.tiempo_activacion_segundos || 0,
        configuracion: {
          mostrar_inmediato: formData.configuracion?.mostrar_inmediato || false,
          intentos_maximos: formData.configuracion?.intentos_maximos || 1
        },
        es_obligatorio: !!formData.es_obligatorio,
        puntos: formData.puntos || 0
      };
      if (datosCompletos.tipo_interaccion === "calificacion") {
        const escala = formData.configuracion?.escala || 5;
        const minLabel = formData.configuracion?.etiquetas?.min || "Malo";
        const maxLabel = formData.configuracion?.etiquetas?.max || "Excelente";
        datosCompletos.opciones = generarOpcionesCalificacion(escala, minLabel, maxLabel);
      }
      if (tipoSeleccionado.nombre === "votacion" && formData.configuracion?.opciones) {
        datosCompletos.opciones = formData.configuracion.opciones.map(op => ({
          texto_opcion: op.texto_opcion || "",
          explicacion: op.explicacion || ""
        }));
      } else if (tipoSeleccionado.nombre === "cuestionario" && formData.configuracion?.opciones) {
        datosCompletos.opciones = formData.configuracion.opciones
          .map((texto, index) => ({
            texto_opcion: texto || "",
            es_correcta: formData.configuracion?.respuesta_correcta === index,
            explicacion: ""
          }))
          .filter(op => op.texto_opcion.trim());
      }
    }
    if (!datosCompletos.titulo) {
      mostrarMensaje("El título es obligatorio", true);
      return;
    }
    const erroresValidacion = [];
    if (datosCompletos.tipo_interaccion === "votacion") {
      if (!datosCompletos.opciones || datosCompletos.opciones.length < 2) {
        erroresValidacion.push("Debe tener al menos 2 opciones para votación");
      }
      if (datosCompletos.opciones && datosCompletos.opciones.some(op => !op.texto_opcion?.trim())) {
        erroresValidacion.push("Todas las opciones deben tener texto");
      }
    }
    if (datosCompletos.tipo_interaccion === "cuestionario") {
      if (!datosCompletos.opciones || datosCompletos.opciones.length < 2) {
        erroresValidacion.push("Debe tener al menos 2 opciones para cuestionario");
      }
      if (datosCompletos.opciones && !datosCompletos.opciones.some(op => op.es_correcta)) {
        erroresValidacion.push("Debe marcar al menos una opción como correcta");
      }
    }
    if (erroresValidacion.length > 0) {
      mostrarMensaje(erroresValidacion.join(", "), true);
      return;
    }
    setLoading(true);
    setError("");
    try {
      let response;
      if (contenidoSeleccionado) {
        response = await actualizarInteraccion(contenidoSeleccionado.id, datosCompletos);
        mostrarMensaje("Interacción actualizada exitosamente");
      } else {
        response = await crearInteraccion(datosCompletos);
        mostrarMensaje("Interacción creada exitosamente");
      }
      await cargarContenidos();
      if (idUsuario) {
        await cargarProgresoUsuario();
      }
      setMostrandoEditor(false);
      setContenidoSeleccionado(null);
      setFormData({
        titulo: "",
        descripcion: "",
        tiempo_activacion_segundos: 0,
        id_tipo_interaccion: "",
        puntos: 0,
        es_obligatorio: false,
        esta_activo: true,
        configuracion: {},
        opciones: [],
      });
    } catch (error) {
      mostrarMensaje(`Error al guardar: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const toggleEstadoContenido = async (contenido) => {
    const nuevoEstado = !contenido.esta_activo;
    try {
      await actualizarInteraccion(contenido.id, { ...contenido, esta_activo: nuevoEstado });
      mostrarMensaje(nuevoEstado ? "Interacción activada" : "Interacción desactivada");
      setContenidos((prev) =>
        prev.map((c) => c.id === contenido.id ? { ...c, esta_activo: nuevoEstado } : c)
      );
    } catch (error) {
      mostrarMensaje(`Error al cambiar estado: ${error.message}`, true);
    }
  };

  const obtenerTipoInteraccion = (idTipo) => {
    return tiposInteraccion.find((t) => t.id === idTipo);
  };

  const reiniciarInteracciones = async () => {
    if (!idUsuario || !videoSeleccionado?.id) {
      setInteraccionesCompletadas(new Set());
      mostrarMensaje("Interacciones reiniciadas - se pueden volver a mostrar");
      return;
    }
    setLoadingProgreso(true);
    try {
      await reiniciarProgresoUsuario(idUsuario, videoSeleccionado.id);
      setInteraccionesCompletadas(new Set());
      setProgresoUsuario(null);
      mostrarMensaje("Progreso del usuario reiniciado exitosamente");
      await cargarProgresoUsuario();
    } catch (error) {
      setInteraccionesCompletadas(new Set());
      mostrarMensaje("Interacciones reiniciadas localmente");
    } finally {
      setLoadingProgreso(false);
    }
  };

  const obtenerEstadisticasInteraccionDetallada = async (idInteraccion) => {
    try {
      const estadisticasDetalladas = await obtenerEstadisticasInteraccion(idInteraccion);
      return estadisticasDetalladas;
    } catch (error) {
      return null;
    }
  };

  const stats = estadisticas || analizarContenidosVideo(contenidos);

  return (
    <div className="gestion-videos-container">
      <button
        className="modulos-btn-volver"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={18} style={{ marginRight: 8 }} />
        Volver a Modulos
      </button>
      {!loadingVideos && videos.length === 0 && <p>No hay videos disponibles.</p>}
      {videoSeleccionado && videoSeleccionado.url_video && (
        <div className="contenidos-container">
          <div className="video-editor-container-con">
            <div className="editor-header-con">
              <h1>Editor de Video Interactivo</h1>
              <div className="header-info-con">
                {videoSeleccionado.titulo && <span className="video-name-con">{videoSeleccionado.titulo}</span>}
                {progresoUsuario && (
                  <div className="progreso-info">
                    <span className="progreso-texto">
                      Progreso: {progresoUsuario.estadisticas?.completadas || 0}/{progresoUsuario.estadisticas?.total_interacciones || 0}
                      ({progresoUsuario.estadisticas?.puntos_totales || 0} pts)
                    </span>
                  </div>
                )}
              </div>
            </div>
            {error && (
              <div className="error-message">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}
            {mensajeExito && (
              <div className="success-message">
                <CheckSquare size={16} />
                {mensajeExito}
              </div>
            )}
            {mostrarRetroalimentacion && respuestaProcesada && (
              <div className="feedback-modal">
                <div className="feedback-content">
                  <div className={`feedback-header ${respuestaProcesada.esCorrecta ? 'correct' : 'incorrect'}`}>
                    {respuestaProcesada.esCorrecta ? '✅ ¡Correcto!' : '❌ Incorrecto'}
                  </div>
                  <div className="feedback-body">
                    <p>{respuestaProcesada.retroalimentacion}</p>
                    {respuestaProcesada.puntos > 0 && (
                      <p className="points">Puntos obtenidos: {respuestaProcesada.puntos}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="video-section-con">
              <VideoPlayer
                ref={videoRef}
                urlVideo={videoSeleccionado.url_video}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                duration={duration}
                setDuration={setDuration}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                formatTime={formatTime}
              />
              <Sidebar
                contenidos={contenidos}
                eliminarInteraccion={eliminarInteraccion}
                stats={stats}
                loadingContenidos={loadingContenidos}
                editarContenido={editarContenido}
                toggleEstadoContenido={toggleEstadoContenido}
                loading={loading}
                tiposInteraccion={tiposInteraccion}
                formatTime={formatTime}
                progresoUsuario={progresoUsuario}
                obtenerEstadisticasDetalladas={obtenerEstadisticasInteraccionDetallada}
              />
            </div>
            <Timeline
              contenidos={contenidos}
              duration={duration}
              currentTime={currentTime}
              agregarInteraccionEnTiempo={agregarInteraccionEnTiempo}
              editarContenido={editarContenido}
              tiposInteraccion={tiposInteraccion}
              interaccionesCompletadas={interaccionesCompletadas}
              formatTime={formatTime}
            />
            <ContentEditor
              mostrandoEditor={mostrandoEditor}
              cerrarEditor={() => setMostrandoEditor(false)}
              formData={{
                ...formData,
                id_video: videoSeleccionado.id
              }}
              setFormData={setFormData}
              contenidoSeleccionado={contenidoSeleccionado}
              guardarContenido={guardarContenido}
              loading={loading}
              error={error}
              tiposInteraccion={tiposInteraccion}
              obtenerTipoInteraccion={obtenerTipoInteraccion}
            />
            <InteractionModal
              interaccionActiva={interaccionActiva}
              respuestaUsuario={respuestaUsuario}
              setRespuestaUsuario={setRespuestaUsuario}
              procesarRespuesta={procesarRespuestaUsuario}
              saltarInteraccion={saltarInteraccion}
              obtenerTipoInteraccion={obtenerTipoInteraccion}
              validarRespuesta={validarRespuesta}
              formatTime={formatTime}
              loading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ContenidosPage;