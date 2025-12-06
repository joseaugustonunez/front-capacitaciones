import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { obtenerVideosPorModulo } from "../api/Videos";
import {
  obtenerProgresoVideo,
  crearProgreso,
  actualizarProgreso,
} from "../api/Progresos";
import {
  obtenerContenidosPorVideo,
  procesarRespuesta,
} from "../api/Interacciones";
import VideoHeader from "../components/Video/VideoHeader";
import VideoPlayer from "../components/Video/VideoPlayer";
import ForumComponent from "../components/Video/ForumComponent";
import CourseSidebar from "../components/Video/CourseSidebar";
import { obtenerArchivosPorModulo } from "../api/Archivos";
import {
  obtenerExamenes,
  obtenerIntentosPorUsuarioYExamen,
} from "../api/examenesApi";
import "../styles/videos.css";

const VideosPage = () => {
  const { moduleId, lessonId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  // Evitar plays concurrentes / tracking de promesa
  const isAttemptingPlayRef = useRef(false);
  const playPromiseRef = useRef(null);
  const [maxTimeWatched, setMaxTimeWatched] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  const [courseData, setCourseData] = useState(null);
  const [moduleVideos, setModuleVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [currentModule, setCurrentModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoProgress, setVideoProgress] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [allVideoProgress, setAllVideoProgress] = useState({});
  const [learningMode, setLearningMode] = useState(false);
  const [interactiveContent, setInteractiveContent] = useState([]);
  const [currentInteraction, setCurrentInteraction] = useState(null);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [interactionAnswered, setInteractionAnswered] = useState({});
  const [intentosPorInteraccion, setIntentosPorInteraccion] = useState({});
  const [interactionResult, setInteractionResult] = useState({
    isCorrect: null,
    targetTime: null,
    showMessage: false,
  });
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!currentVideo?.id) {
      return;
    }

    if (typeof obtenerContenidosPorVideo !== "function") {
      console.error("obtenerContenidosPorVideo no es una función");
      return;
    }

    obtenerContenidosPorVideo(currentVideo.id)
      .then((res) => {
        const result = res?.data ? res.data : res;

        if (Array.isArray(result)) {
          setInteractiveContent(result);
          return;
        }

        if (result && result.success && Array.isArray(result.data)) {
          setInteractiveContent(result.data);
          return;
        }

        setInteractiveContent([]);
      })
      .catch((err) => {
        console.error("Error cargando contenido interactivo:", err);
        setInteractiveContent([]);
      });
  }, [currentVideo?.id]);

  const saveVideoProgress = async (seconds) => {
    try {
      if (!currentVideo?.id || !duration || duration === 0) {
        return;
      }

      const videoDuration = Math.floor(duration);

      // 👉 Usamos round para evitar perder el último segundo
      let newSeconds = Math.round(seconds);

      // Si llega al final, forzamos el valor al total de duración
      if (newSeconds >= videoDuration - 1) {
        newSeconds = videoDuration;
      }

      if (newSeconds < 0 || newSeconds > videoDuration) {
        return;
      }

      if (newSeconds > maxTimeWatched) {
        setMaxTimeWatched(newSeconds);
      }

      // ✅ Ahora sí marcará 100% al llegar al último segundo
      const completionThreshold = Math.max(
        videoDuration - 1,
        videoDuration * 0.99
      );
      const isCompleted = newSeconds >= completionThreshold ? 1 : 0;

      const userData = JSON.parse(localStorage.getItem("userData"));
      const id_usuario = userData?.id;

      if (!id_usuario) {
        console.error("No se encontró el id del usuario logueado");
        return;
      }

      const progressData = {
        id_usuario,
        id_video: currentVideo.id,
        segundos_vistos: newSeconds,
        completado: isCompleted,
      };

      if (!videoProgress) {
        const res = await crearProgreso(progressData);
        if (res && res.success) {
          setVideoProgress(res.data);
        }
      } else {
        const res = await actualizarProgreso(videoProgress.id, progressData);
        if (res && res.success) {
          setVideoProgress((prev) => ({
            ...prev,
            segundos_vistos: newSeconds,
            completado: isCompleted,
          }));
        }
      }
    } catch (error) {
      console.error("Error guardando progreso:", error);
    }
  };

  // ============================
  // Reemplazo: versión optimizada
  // ============================
  // Último progreso guardado y timeouts (refs)
  const lastSavedProgress = useRef(0);
  const saveTimeoutRef = useRef(null);

  const saveVideoProgressOptimized = useCallback(
    async (seconds, forceComplete = false) => {
      try {
        if (!currentVideo?.id || !duration || duration === 0) return;

        const videoDuration = Math.floor(duration);
        let newSeconds = Math.round(seconds);

        // Límite
        if (newSeconds < 0) newSeconds = 0;
        if (newSeconds > videoDuration) newSeconds = videoDuration;

        // Evitar guardados redundantes (umbral 2s)
        if (
          Math.abs(newSeconds - lastSavedProgress.current) < 2 &&
          !forceComplete
        ) {
          return;
        }

        if (newSeconds > maxTimeWatched) {
          setMaxTimeWatched(newSeconds);
        }

        const completionThreshold = videoDuration - 1;
        const isCompleted =
          forceComplete || newSeconds >= completionThreshold ? 1 : 0;

        const userData = JSON.parse(localStorage.getItem("userData"));
        const id_usuario = userData?.id;
        if (!id_usuario) return;

        const progressData = {
          id_usuario,
          id_video: currentVideo.id,
          segundos_vistos: newSeconds,
          completado: isCompleted,
        };

        if (!videoProgress) {
          const res = await crearProgreso(progressData);
          if (res?.success) {
            setVideoProgress(res.data);
            lastSavedProgress.current = newSeconds;
          }
        } else {
          const res = await actualizarProgreso(videoProgress.id, progressData);
          if (res?.success) {
            setVideoProgress((prev) => ({
              ...prev,
              segundos_vistos: newSeconds,
              completado: isCompleted,
            }));
            lastSavedProgress.current = newSeconds;
          }
        }
      } catch (error) {
        console.error("Error guardando progreso optimizado:", error);
      }
    },
    [currentVideo?.id, duration, videoProgress, maxTimeWatched]
  );

  // =========================================
  // Reemplazo: manejo y envío de interacciones
  // =========================================
  const [isProcessingInteraction, setIsProcessingInteraction] = useState(false);

  const handleInteractionAnswerOptimized = useCallback(
    async (selectedOption) => {
      if (isProcessingInteraction || !currentInteraction) return;

      setIsProcessingInteraction(true);

      try {
        const interactionId = currentInteraction.id;
        const userData = JSON.parse(localStorage.getItem("userData"));
        const id_usuario = userData?.id;
        if (!id_usuario) {
          setIsProcessingInteraction(false);
          return;
        }

        let datos_respuesta;

        if (currentInteraction.id_tipo_interaccion === 6) {
          datos_respuesta = { texto: selectedOption.texto };
        } else if ([3, 4].includes(currentInteraction.id_tipo_interaccion)) {
          datos_respuesta = {
            opciones_seleccionadas: selectedOption.opciones_seleccionadas,
          };
        } else {
          datos_respuesta = { opciones_seleccionadas: [selectedOption.id] };
        }

        const respuestaData = {
          id_usuario,
          id_contenido_interactivo: interactionId,
          datos_respuesta,
          puntos_obtenidos: currentInteraction.puntos,
          numero_intento: (intentosPorInteraccion[interactionId] || 0) + 1,
          tiempo_respuesta_segundos: Math.floor(currentTime),
          fecha_envio: new Date().toISOString().slice(0, 19).replace("T", " "),
        };

        const response = await procesarRespuesta(respuestaData);
        const responseData = response?.data || response;

        if (!responseData?.evaluacion) {
          throw new Error("No se recibió evaluación");
        }

        const esCorrecta = responseData.evaluacion.es_correcta === true;

        setIntentosPorInteraccion((prev) => ({
          ...prev,
          [interactionId]: respuestaData.numero_intento,
        }));

        setInteractionAnswered((prev) => ({
          ...prev,
          [interactionId]: {
            answered: true,
            correct: esCorrecta,
            timestamp: Date.now(),
            selectedOption,
          },
        }));

        if (esCorrecta) {
          // Cerrar modal y continuar
          setShowInteractionModal(false);
          setCurrentInteraction(null);

          setTimeout(async () => {
            if (videoRef.current) {
              try {
                await playVideoSafely();
                setIsPlaying(true);
              } catch (err) {
                console.error(
                  "Error al reproducir tras interacción correcta:",
                  err
                );
                setIsPlaying(false);
              }
            }
            setIsProcessingInteraction(false);
          }, 300);
        } else {
          // incorrecta -> retroceso
          let targetTime = 0;
          if (
            responseData.tiempo_retroceso !== null &&
            responseData.tiempo_retroceso !== undefined
          ) {
            targetTime = responseData.tiempo_retroceso;
          } else if (responseData.debe_retroceder) {
            const previousCorrect = interactiveContent
              .filter(
                (ic) =>
                  ic.tiempo_activacion_segundos <
                    currentInteraction.tiempo_activacion_segundos &&
                  interactionAnswered[ic.id]?.correct
              )
              .sort(
                (a, b) =>
                  b.tiempo_activacion_segundos - a.tiempo_activacion_segundos
              )[0];
            targetTime = previousCorrect?.tiempo_activacion_segundos || 0;
          }

          setShowInteractionModal(false);
          setCurrentInteraction(null);

          setTimeout(() => {
            if (!videoRef.current) {
              setIsProcessingInteraction(false);
              return;
            }

            videoRef.current.currentTime = targetTime;
            setCurrentTime(targetTime);

            if (targetTime < maxTimeWatched) {
              setMaxTimeWatched(targetTime);
            }

            const onSeeked = async () => {
              videoRef.current.removeEventListener("seeked", onSeeked);
              try {
                await playVideoSafely();
                setIsPlaying(true);
              } catch (err) {
                console.error(
                  "Error al reproducir después de retroceder:",
                  err
                );
              }
              setIsProcessingInteraction(false);
            };

            videoRef.current.addEventListener("seeked", onSeeked);
          }, 500);
        }
      } catch (error) {
        console.error("Error procesando interacción optimizada:", error);
        setIsProcessingInteraction(false);
      }
    },
    [
      currentInteraction,
      currentTime,
      interactiveContent,
      interactionAnswered,
      maxTimeWatched,
      intentosPorInteraccion,
      isProcessingInteraction,
    ]
  );

  // Alias para seguir usando en JSX
  const handleInteractionAnswer = handleInteractionAnswerOptimized;

  // =========================================
  // Reemplazo: detección optimizada de interacciones
  // =========================================
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo || showInteractionModal) return;

    const checkInteractions = () => {
      const newTime = video.currentTime;
      setCurrentTime(newTime);

      if (newTime > maxTimeWatched && !videoProgress?.completado) {
        setMaxTimeWatched(newTime);
      }

      if (isProcessingInteraction) return;

      const activeInteraction = interactiveContent.find((interaction) => {
        const activationTime = interaction.tiempo_activacion_segundos;
        const timeMatch = Math.abs(newTime - activationTime) < 0.5;
        const notAnswered = !interactionAnswered[interaction.id]?.correct;

        return timeMatch && notAnswered;
      });

      if (activeInteraction) {
        video.pause();
        setIsPlaying(false);
        setCurrentInteraction(activeInteraction);
        setShowInteractionModal(true);
      }
    };

    video.addEventListener("timeupdate", checkInteractions);
    return () => video.removeEventListener("timeupdate", checkInteractions);
  }, [
    currentVideo,
    interactiveContent,
    interactionAnswered,
    showInteractionModal,
    maxTimeWatched,
    videoProgress,
    isProcessingInteraction,
  ]);

  // =========================================
  // Reemplazo: guardado automático de progreso
  // =========================================
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo) return;

    const saveProgress = () => {
      const current = Math.floor(video.currentTime);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveVideoProgressOptimized(current);
      }, 3000);
    };

    const handlePause = () => {
      saveVideoProgressOptimized(Math.floor(video.currentTime));
    };

    const handleEnded = () => {
      saveVideoProgressOptimized(Math.floor(video.duration || 0), true);
    };

    video.addEventListener("timeupdate", saveProgress);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      video.removeEventListener("timeupdate", saveProgress);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, [currentVideo, saveVideoProgressOptimized]);

  // =========================================
  // Reemplazo: restaurar progreso al cargar
  // =========================================
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoProgress) return;

    const restoreProgress = () => {
      if (videoProgress.segundos_vistos > 0 && video.currentTime < 1) {
        video.currentTime = videoProgress.segundos_vistos;
        setMaxTimeWatched(videoProgress.segundos_vistos);
      }
    };

    if (video.readyState >= 2) {
      restoreProgress();
    } else {
      video.addEventListener("loadedmetadata", restoreProgress, { once: true });
    }

    return () => {
      video.removeEventListener("loadedmetadata", restoreProgress);
    };
  }, [videoProgress]);

  useEffect(() => {
    if (moduleId) {
      setLoading(true);

      if (location.state) {
        setCourseData(location.state.courseData);
        const module = location.state.courseData.modules.find(
          (m) => m.id == moduleId
        );
        setCurrentModule(module);
      }

      obtenerVideosPorModulo(moduleId)
        .then(async (response) => {
          if (response.success && Array.isArray(response.data)) {
            const transformedVideos = response.data.map((video, index) => ({
              id: video.id,
              title: video.titulo,
              description: video.descripcion,
              duration: formatDurationFromSeconds(video.duracion_segundos),
              completed: false,
              current: video.id == lessonId,
              videoUrl: video.url_video?.startsWith("http")
                ? video.url_video
                : `${backendUrl}${video.url_video}`,
              thumbnailUrl: `${backendUrl}${video.url_miniatura}`,
              transcription: video.transcripcion,
              isPreview: video.es_vista_previa,
              order: video.indice_orden || index + 1,
              moduleId: video.id_modulo,
              isLocked: false,
            }));

            transformedVideos.sort((a, b) => a.order - b.order);

            const progressPromises = transformedVideos.map((video) =>
              obtenerProgresoVideo(video.id)
                .then((res) => ({
                  videoId: video.id,
                  progress: res.success && res.data ? res.data : null,
                }))
                .catch(() => ({ videoId: video.id, progress: null }))
            );

            const allProgress = await Promise.all(progressPromises);
            const progressMap = {};

            allProgress.forEach(({ videoId, progress }) => {
              progressMap[videoId] = progress;
            });

            setAllVideoProgress(progressMap);

            const videosWithProgress = transformedVideos.map((video, index) => {
              const progress = progressMap[video.id];
              const isCompleted = progress?.completado || false;

              let isLocked = false;
              if (index > 0) {
                const previousVideo = transformedVideos[index - 1];
                const previousProgress = progressMap[previousVideo.id];
                isLocked = !previousProgress?.completado;
              }

              return {
                ...video,
                completed: isCompleted,
                isLocked: isLocked,
              };
            });

            setModuleVideos(videosWithProgress);

            const currentVideoData =
              videosWithProgress.find((v) => v.id == lessonId) ||
              videosWithProgress[0];
            setCurrentVideo(currentVideoData);
          } else {
            setError("No se pudieron cargar los videos del módulo");
          }
        })
        .catch((err) => {
          console.error("Error fetching module videos:", err);
          setError("Error al cargar los videos del módulo");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [moduleId, lessonId, location.state]);

  const formatDurationFromSeconds = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!currentVideo?.id) {
      return;
    }

    const loadVideoProgress = async () => {
      try {
        const response = await obtenerProgresoVideo(currentVideo.id);

        if (response && response.success && response.data) {
          setVideoProgress(response.data);
          setMaxTimeWatched(response.data.segundos_vistos || 0);
        } else {
          setVideoProgress(null);
          setMaxTimeWatched(0);
        }
      } catch (error) {
        console.error("Error cargando progreso del video:", error);
        setVideoProgress(null);
        setMaxTimeWatched(0);
      }
    };

    loadVideoProgress();
  }, [currentVideo?.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo) return;

    const updateTime = () => {
      const newTime = video.currentTime;
      setCurrentTime(newTime);

      if (newTime > maxTimeWatched && !videoProgress?.completado) {
        setMaxTimeWatched(newTime);
      }

      if (!currentInteraction || !showInteractionModal) {
        interactiveContent.forEach((interaction) => {
          const activationTime = interaction.tiempo_activacion_segundos;
          const interactionId = interaction.id;

          const timeMatch = Math.abs(newTime - activationTime) < 0.5;
          const notAnsweredCorrectly =
            !interactionAnswered[interactionId]?.correct;

          if (timeMatch && notAnsweredCorrectly && !currentInteraction) {
            console.log(
              "🔔 Activando interacción:",
              interactionId,
              "en tiempo:",
              activationTime
            );
            setCurrentInteraction(interaction);
            setShowInteractionModal(true);

            video.pause();
            setIsPlaying(false);
          }
        });
      } else {
        if (video.paused === false) {
          video.pause();
          setIsPlaying(false);
        }
      }
    };

    const updateDuration = () => {
      setDuration(video.duration || 0);

      if (videoProgress?.segundos_vistos > 0 && video.currentTime === 0) {
        setTimeout(() => {
          video.currentTime = videoProgress.segundos_vistos;
        }, 100);
      }

      if (videoProgress?.completado === 1) {
        setMaxTimeWatched(video.duration || 0);
      }
    };

    const handlePlay = () => {
      if (!currentInteraction || !showInteractionModal) {
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    };

    const handlePause = () => setIsPlaying(false);

    const handleError = (e) => {
      const vid = e?.currentTarget || videoRef.current;
      const mediaError = vid?.error;
      if (mediaError) {
        // mediaError.code: 1=MEDIA_ERR_ABORTED,2=MEDIA_ERR_NETWORK,3=MEDIA_ERR_DECODE,4=MEDIA_ERR_SRC_NOT_SUPPORTED
        const code = mediaError.code;
        let msg = "Error desconocido del reproductor de video.";
        if (code === 1) msg = "Media abortada por el usuario.";
        else if (code === 2)
          msg = "Error de red al cargar el video (revisa Network).";
        else if (code === 3)
          msg = "Error de decodificación (codec no soportado).";
        else if (code === 4)
          msg = "Fuente no soportada o no encontrada (revisa URL/CORS).";
        console.error("Error en el video:", code, msg, mediaError);
      } else {
        console.error("Error en el video (evento):", e);
      }
    };

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDuration);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("error", handleError);

    video.volume = volume;
    video.muted = isMuted;
    video.playbackRate = playbackRate;

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("error", handleError);
    };
  }, [
    currentVideo,
    volume,
    isMuted,
    playbackRate,
    videoProgress,
    maxTimeWatched,
    interactiveContent,
    interactionAnswered,
    currentInteraction,
    showInteractionModal,
  ]);

  const findLastCorrectInteraction = () => {
    if (!currentInteraction) return null;

    const previousInteractions = interactiveContent
      .filter(
        (ic) =>
          ic.tiempo_activacion_segundos <
          currentInteraction.tiempo_activacion_segundos
      )
      .sort(
        (a, b) => b.tiempo_activacion_segundos - a.tiempo_activacion_segundos
      );

    for (const interaction of previousInteractions) {
      const answerData = interactionAnswered[interaction.id];
      if (answerData && answerData.answered && answerData.correct) {
        return interaction;
      }
    }

    return null;
  };
  const redirectToLastCorrectInteraction = (targetTime) => {
    console.log("🔄 Iniciando redirección a tiempo:", targetTime);

    if (!videoRef.current) {
      console.error("❌ No hay referencia al video");
      return;
    }

    const video = videoRef.current;
    const redirectTime = Number(targetTime) || 0;

    try {
      video.pause();
    } catch (e) {
      console.error("Error pausando:", e);
    }
    setIsPlaying(false);

    const performRedirect = (time) => {
      console.log("📍 Ejecutando redirección a:", time);

      video.currentTime = time;
      setCurrentTime(time);

      if (time < maxTimeWatched && !videoProgress?.completado) {
        setMaxTimeWatched(time);
        console.log("⏪ Actualizando maxTimeWatched a:", time);
      }

      const attemptPlay = async () => {
        try {
          console.log("▶️ Intentando reproducir desde:", time);
          await playVideoSafely(video);
          setIsPlaying(true);
          console.log("✅ Reproducción exitosa desde:", time);
        } catch (error) {
          console.error("❌ Error al reproducir:", error);
          setIsPlaying(false);

          setTimeout(async () => {
            try {
              await playVideoSafely();
              setIsPlaying(true);
              console.log("✅ Reproducción exitosa en segundo intento");
            } catch (e) {
              console.error("❌ Error en segundo intento:", e);
              setIsPlaying(false);
            }
          }, 500);
        }
      };

      if (Math.abs(video.currentTime - time) < 0.5) {
        setTimeout(attemptPlay, 200);
      } else {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          console.log("✅ Seeking completado");
          setTimeout(attemptPlay, 200);
        };

        video.addEventListener("seeked", onSeeked);

        setTimeout(() => {
          video.removeEventListener("seeked", onSeeked);
          attemptPlay();
        }, 1000);
      }
    };

    if (redirectTime === 0) {
      console.log("🔄 Reiniciando video al inicio");
      performRedirect(0);
      return;
    }

    if (video.readyState >= 1) {
      setTimeout(() => performRedirect(redirectTime), 100);
    } else {
      console.log("⏳ Esperando que el video esté listo...");
      const onLoadedMetadata = () => {
        video.removeEventListener("loadedmetadata", onLoadedMetadata);
        console.log("✅ Video listo, ejecutando redirección");
        setTimeout(() => performRedirect(redirectTime), 100);
      };

      video.addEventListener("loadedmetadata", onLoadedMetadata);

      setTimeout(() => {
        video.removeEventListener("loadedmetadata", onLoadedMetadata);
        performRedirect(redirectTime);
      }, 2000);
    }
  };
  const handleCorrectAnswer = (
    interactionId,
    selectedOption,
    numeroIntento
  ) => {
    setInteractionAnswered((prev) => ({
      ...prev,
      [interactionId]: {
        answered: true,
        correct: true,
        selectedOption,
        intento: numeroIntento,
        timestamp: new Date().toISOString(),
      },
    }));

    setInteractionResult({
      isCorrect: true,
      showMessage: true,
      message: "¡Correcto! Continuemos.",
    });

    setTimeout(() => {
      setShowInteractionModal(false);
      setCurrentInteraction(null);
      if (videoRef.current && !isPlaying) {
        continueVideoFromCurrentPosition();
      }
    }, 1500);
  };

  const handleIncorrectAnswer = () => {
    setInteractionResult({
      isCorrect: false,
      showMessage: true,
      message: "Respuesta incorrecta. Regresando al punto anterior.",
    });

    const lastCorrectInteraction = findLastCorrectInteraction();
    const targetTime = lastCorrectInteraction
      ? lastCorrectInteraction.tiempo_activacion_segundos
      : 0;

    setTimeout(() => {
      redirectToLastCorrectInteraction(targetTime);
    }, 2500);
  };
  const continueVideoFromCurrentPosition = async () => {
    if (!videoRef.current) return;

    try {
      console.log("▶️ Continuando video desde:", videoRef.current.currentTime);
      await playVideoSafely();
      console.log("✅ Video continuando correctamente");
    } catch (error) {
      console.error("❌ Error al continuar video:", error);
      setIsPlaying(false);
    }
  };
  const continueVideo = () => {
    if (videoRef.current && !isPlaying) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const closeInteractionModal = () => {
    console.log("🚪 closeInteractionModal llamado");

    if (!currentInteraction?.es_obligatorio) {
      console.log("✅ Cerrando modal (no obligatorio)");

      setShowInteractionModal(false);
      setCurrentInteraction(null);
      setInteractionResult({
        isCorrect: null,
        showMessage: false,
        message: "",
      });

      console.log("🧹 Estados de modal limpiados");
    } else {
      console.log("❌ No se puede cerrar modal (es obligatorio)");
    }
  };

  // Helper: reproducir video manejando AbortError y evitando plays concurrentes
  const playVideoSafely = useCallback(async (video = videoRef.current) => {
    if (!video) return false;
    // Si ya hay un intento de reproducción en curso, reuse la promesa
    if (isAttemptingPlayRef.current && playPromiseRef.current) {
      try {
        await playPromiseRef.current;
        setIsPlaying(!video.paused);
        return !video.paused;
      } catch {
        setIsPlaying(false);
        return false;
      }
    }

    try {
      isAttemptingPlayRef.current = true;
      const playPromise = video.play();
      playPromiseRef.current = playPromise;
      if (playPromise !== undefined) {
        await playPromise;
      }
      setIsPlaying(!video.paused);
      return !video.paused;
    } catch (err) {
      // Ignorar AbortError (play fue interrumpido por pause/seek)
      if (
        err &&
        (err.name === "AbortError" || /interrupted/i.test(err.message))
      ) {
        console.debug("play() interrumpido (AbortError) - ignorando");
        setIsPlaying(false);
        return false;
      }
      console.error("Error al reproducir el video:", err);
      setIsPlaying(false);
      return false;
    } finally {
      isAttemptingPlayRef.current = false;
      playPromiseRef.current = null;
    }
  }, []);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) {
      console.error("No hay referencia al video para toggle play");
      return;
    }

    if (currentInteraction && showInteractionModal) {
      console.log("No se puede reproducir: hay una interacción activa");
      return;
    }

    try {
      if (isPlaying) {
        // pause no devuelve promesa -> no usar await
        video.pause();
        setIsPlaying(false);
        console.log("Video pausado manualmente");
      } else {
        await playVideoSafely(video);
        console.log("Video reproducido/manualmente (intento)");
      }
    } catch (error) {
      // playVideoSafely ya maneja errores; esto es por seguridad
      console.error("Error en togglePlay:", error);
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleProgressClick = (e) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;

    if (newTime <= maxTimeWatched || videoProgress?.completado === 1) {
      video.currentTime = Math.max(0, Math.min(newTime, duration));
    } else {
      video.currentTime = maxTimeWatched;
    }
  };

  const skipTime = (seconds) => {
    const video = videoRef.current;
    if (!video) return;

    let newTime = video.currentTime + seconds;

    if (seconds > 0) {
      if (videoProgress?.completado === 1) {
        newTime = Math.min(newTime, duration);
      } else {
        newTime = Math.min(newTime, maxTimeWatched);
      }
    } else {
      newTime = Math.max(0, newTime);
    }

    video.currentTime = newTime;
  };

  const changePlaybackRate = (rate) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleVideoChange = (videoId) => {
    const video = moduleVideos.find((v) => v.id === videoId);
    if (video) {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }

      setCurrentVideo(video);
      setCurrentTime(0);
      setVideoProgress(null);

      setInteractiveContent([]);
      setCurrentInteraction(null);
      setShowInteractionModal(false);
      setInteractionAnswered({});

      navigate(`/videos/${moduleId}/${videoId}`, {
        replace: true,
        state: location.state,
      });
    }
  };

  const toggleFullscreen = () => {
    const container = document.querySelector(".video-wrapper");

    if (!document.fullscreenElement) {
      container?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const goToNextVideo = () => {
    const currentIndex = moduleVideos.findIndex(
      (v) => v.id === currentVideo.id
    );
    if (currentIndex < moduleVideos.length - 1) {
      const nextVideo = moduleVideos[currentIndex + 1];
      handleVideoChange(nextVideo.id);
    }
  };

  const goBackToCourse = () => {
    if (courseData) {
      navigate(`/curso/${courseData.id}`);
    } else {
      navigate(-1);
    }
  };

  const getCurrentVideoIndex = () => {
    return moduleVideos.findIndex((v) => v.id === currentVideo.id) + 1;
  };

  if (loading) {
    return (
      <div className="video-player-container-vidu">
        <div className="loading-container">
          <p>Cargando videos del módulo...</p>
        </div>
      </div>
    );
  }

  if (error || !currentVideo) {
    return (
      <div className="video-player-container-vidu">
        <div className="error-container">
          <h3>Error al cargar el video</h3>
          <p>{error || "No se pudo encontrar el video solicitado"}</p>
          <button onClick={goBackToCourse} className="btn-primary">
            Volver al curso
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-player-container-vidu">
      <div className="video-player-wrapper">
        <VideoHeader
          currentVideo={currentVideo}
          currentModule={currentModule}
          courseData={courseData}
          moduleVideos={moduleVideos}
          getCurrentVideoIndex={getCurrentVideoIndex}
          goBackToCourse={goBackToCourse}
          goToNextVideo={goToNextVideo}
        />

        <div className="video-content-vidu">
          <div className="video-player-vid">
            <VideoPlayer
              videoRef={videoRef}
              progressRef={progressRef}
              currentVideo={currentVideo}
              isPlaying={isPlaying}
              showControls={showControls}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              isMuted={isMuted}
              playbackRate={playbackRate}
              showSettings={showSettings}
              isFullscreen={isFullscreen}
              interactiveContent={interactiveContent}
              showInteractionModal={showInteractionModal}
              currentInteraction={currentInteraction}
              setShowControls={setShowControls}
              togglePlay={togglePlay}
              toggleMute={toggleMute}
              handleVolumeChange={handleVolumeChange}
              handleProgressClick={handleProgressClick}
              skipTime={skipTime}
              changePlaybackRate={changePlaybackRate}
              setShowSettings={setShowSettings}
              toggleFullscreen={toggleFullscreen}
              formatTime={formatTime}
              handleInteractionAnswer={handleInteractionAnswer}
              closeInteractionModal={closeInteractionModal}
            />

            <ForumComponent
              videoId={currentVideo?.id}
              usuarioActual={JSON.parse(localStorage.getItem("userData"))}
            />
          </div>

          <CourseSidebar
            currentModule={currentModule}
            moduleVideos={moduleVideos}
            currentVideo={currentVideo}
            courseData={courseData}
            handleVideoChange={handleVideoChange}
          />
        </div>
      </div>
    </div>
  );
};

export default VideosPage;
