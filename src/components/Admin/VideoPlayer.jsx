import React, {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from "lucide-react";

const VideoPlayer = forwardRef(
  (
    {
      urlVideo,
      currentTime = 0,
      setCurrentTime,
      duration = 0,
      setDuration,
      isPlaying = false,
      setIsPlaying,
      isMuted = false,
      setIsMuted,
      isFullscreen = false,
      setIsFullscreen,
      playbackRate = 1,
      setPlaybackRate,
      seekTo,
      formatTime,
    },
    ref
  ) => {
    const videoRef = useRef(null);
    const [volume, setVolume] = useState(0.7);
    const [localIsMuted, setLocalIsMuted] = useState(isMuted);
    const [localPlaybackRate, setLocalPlaybackRate] = useState(playbackRate);
    const [localIsFullscreen, setLocalIsFullscreen] = useState(isFullscreen);

    const handleSeekTo = (time) => {
      const safeTime = Math.max(0, Math.min(time, duration || 0));

      if (seekTo && typeof seekTo === "function") {
        seekTo(safeTime);
      } else if (videoRef.current) {
        try {
          videoRef.current.currentTime = safeTime;
          setCurrentTime?.(safeTime);
          console.log(`VideoPlayer: seek exitoso a ${safeTime}s`);
        } catch (error) {
          console.error("VideoPlayer: Error en seek:", error);
        }
      }
    };

    useImperativeHandle(ref, () => ({
      play: () => {
        videoRef.current?.play();
        setIsPlaying?.(true);
      },
      pause: () => {
        videoRef.current?.pause();
        setIsPlaying?.(false);
      },
      togglePlay: () => {
        if (isPlaying) {
          videoRef.current?.pause();
          setIsPlaying?.(false);
        } else {
          videoRef.current?.play();
          setIsPlaying?.(true);
        }
      },

      seekTo: handleSeekTo,
      getVideoElement: () => videoRef.current,

      getCurrentTime: () => videoRef.current?.currentTime || 0,

      forceSeek: (time) => {
        const safeTime = Math.max(0, Math.min(time, duration || 0));
        if (videoRef.current) {
          const wasPlaying = !videoRef.current.paused;
          videoRef.current.pause();

          videoRef.current.currentTime = safeTime;
          setCurrentTime?.(safeTime);
          if (wasPlaying) {
            setTimeout(() => {
              videoRef.current?.play();
            }, 100);
          }

          console.log(`VideoPlayer: forceSeek a ${safeTime}s exitoso`);
        }
      },
      setVolume: (vol) => {
        const safeVolume = Math.max(0, Math.min(1, vol));
        setVolume(safeVolume);
        if (videoRef.current) {
          videoRef.current.volume = safeVolume;
        }
      },
      toggleMute: () => {
        const newMuted = !localIsMuted;
        setLocalIsMuted(newMuted);
        setIsMuted?.(newMuted);

        if (videoRef.current) {
          videoRef.current.muted = newMuted;
        }
      },
    }));

    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.muted = localIsMuted;
      }
    }, [localIsMuted]);

    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.playbackRate = localPlaybackRate;
      }
    }, [localPlaybackRate]);

    const togglePlay = () => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying?.(false);
        } else {
          videoRef.current.play();
          setIsPlaying?.(true);
        }
      }
    };

    const handleTimeUpdate = () => {
      if (videoRef.current) {
        setCurrentTime?.(videoRef.current.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (videoRef.current) {
        setDuration?.(videoRef.current.duration);
        if (isFinite(volume)) {
          videoRef.current.volume = volume;
        } else {
          const defaultVolume = 0.7;
          setVolume(defaultVolume);
          videoRef.current.volume = defaultVolume;
        }
        videoRef.current.muted = localIsMuted;
        videoRef.current.playbackRate = localPlaybackRate;
      }
    };

    const skipForward = () => {
      if (videoRef.current) {
        const newTime = Math.min(currentTime + 10, duration);
        handleSeekTo(newTime);
      }
    };

    const skipBackward = () => {
      if (videoRef.current) {
        const newTime = Math.max(currentTime - 10, 0);
        handleSeekTo(newTime);
      }
    };

    const handleVolumeChange = (newVolume) => {
      const safeVolume = Math.max(0, Math.min(1, newVolume));
      setVolume(safeVolume);

      if (videoRef.current) {
        videoRef.current.volume = safeVolume;

        if (safeVolume === 0 && !localIsMuted) {
          setLocalIsMuted(true);
          setIsMuted?.(true);
        } else if (safeVolume > 0 && localIsMuted) {
          setLocalIsMuted(false);
          setIsMuted?.(false);
        }
      }
    };

    const toggleMute = () => {
      const newMuted = !localIsMuted;
      setLocalIsMuted(newMuted);
      setIsMuted?.(newMuted);

      if (videoRef.current) {
        videoRef.current.muted = newMuted;
      }
    };

    const changePlaybackRate = (rate) => {
      setLocalPlaybackRate(rate);
      setPlaybackRate?.(rate);
    };

    const toggleFullscreen = () => {
      const videoContainer = videoRef.current?.parentElement;
      const newFullscreenState = !localIsFullscreen;

      setLocalIsFullscreen(newFullscreenState);
      setIsFullscreen?.(newFullscreenState);

      if (!document.fullscreenElement && newFullscreenState) {
        videoContainer
          ?.requestFullscreen()
          .catch((err) =>
            console.error("Error al entrar en pantalla completa:", err)
          );
      } else if (document.fullscreenElement && !newFullscreenState) {
        document
          .exitFullscreen()
          .catch((err) =>
            console.error("Error al salir de pantalla completa:", err)
          );
      }
    };

    useEffect(() => {
      const handleFullscreenChange = () => {
        const isCurrentlyFullscreen = !!document.fullscreenElement;
        setLocalIsFullscreen(isCurrentlyFullscreen);
        setIsFullscreen?.(isCurrentlyFullscreen);
      };

      document.addEventListener("fullscreenchange", handleFullscreenChange);
      return () => {
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange
        );
      };
    }, [setIsFullscreen]);

    const defaultFormatTime = (seconds) => {
      if (isNaN(seconds)) return "0:00";
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    const formatTimeFunction = formatTime || defaultFormatTime;

    return (
      <div className="video-player-con">
        {urlVideo ? (
          <div className={`video-container-con ${!isPlaying ? "paused" : ""}`}>
            <video
              ref={videoRef}
              src={
                urlVideo?.startsWith("http")
                  ? urlVideo
                  : `https://capacitacionback.sistemasudh.com ${urlVideo}`
              }
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying?.(true)}
              onPause={() => setIsPlaying?.(false)}
              onEnded={() => setIsPlaying?.(false)}
              style={{ width: "100%", height: "100%" }}
            />
            <div className="video-controls-custom">
              <div className="controls-row">
                <button
                  onClick={skipBackward}
                  className="control-btn"
                  title="Retroceder 10 segundos"
                >
                  <SkipBack size={20} />
                </button>
                <button
                  onClick={togglePlay}
                  className="play-btn-custom"
                  title={isPlaying ? "Pausar" : "Reproducir"}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button
                  onClick={skipForward}
                  className="control-btn"
                  title="Avanzar 10 segundos"
                >
                  <SkipForward size={20} />
                </button>
                <div className="time-display-custom">
                  {formatTimeFunction(currentTime)} /{" "}
                  {formatTimeFunction(duration)}
                </div>
                <div className="volume-control">
                  <button
                    onClick={toggleMute}
                    className="control-btn"
                    title={localIsMuted ? "Activar sonido" : "Silenciar"}
                  >
                    {localIsMuted || volume === 0 ? (
                      <VolumeX size={20} />
                    ) : (
                      <Volume2 size={20} />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) =>
                      handleVolumeChange(parseFloat(e.target.value))
                    }
                    className="volume-slider"
                    title="Ajustar volumen"
                  />
                </div>
                <div className="playback-speed">
                  <select
                    value={localPlaybackRate}
                    onChange={(e) =>
                      changePlaybackRate(parseFloat(e.target.value))
                    }
                    className="speed-selector"
                    title="Velocidad de reproducción"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>
                </div>
                <button
                  onClick={toggleFullscreen}
                  className="control-btn"
                  title={
                    localIsFullscreen
                      ? "Salir de pantalla completa"
                      : "Pantalla completa"
                  }
                >
                  {localIsFullscreen ? (
                    <Minimize size={20} />
                  ) : (
                    <Maximize size={20} />
                  )}
                </button>
              </div>
              <div className="video-progress-bar">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={(e) => handleSeekTo(parseFloat(e.target.value))}
                  className="progress-slider"
                  title="Barra de progreso"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="video-placeholder">
            <Play size={64} style={{ opacity: 0.3 }} />
            <p>No hay video seleccionado</p>
            <p>URL de ejemplo: https://www.w3schools.com/html/mov_bbb.mp4</p>
          </div>
        )}
      </div>
    );
  }
);

export default VideoPlayer;
