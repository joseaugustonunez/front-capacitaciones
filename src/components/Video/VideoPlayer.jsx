import React from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
} from "lucide-react";
import InteractionModal from "./InteractionModal";

const VideoPlayer = ({
  videoRef,
  progressRef,
  currentVideo,
  isPlaying,
  showControls,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackRate,
  showSettings,
  isFullscreen,
  interactiveContent = [],
  showInteractionModal,
  currentInteraction,
  setShowControls,
  togglePlay,
  toggleMute,
  handleVolumeChange,
  handleProgressClick,
  skipTime,
  changePlaybackRate,
  setShowSettings,
  toggleFullscreen,
  formatTime,
  handleInteractionAnswer,
  closeInteractionModal,
}) => {
  return (
    <div
      className="video-wrapper"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(true)}
    >
      <video
        ref={videoRef}
        className="video-element"
        src={currentVideo.videoUrl}
        poster={currentVideo.thumbnailUrl}
        onClick={togglePlay}
        controls={false}
        preload="metadata"
        playsInline
        //crossOrigin="anonymous"
      >
        <p>Tu navegador no soporta el elemento de video.</p>
        <p>
          Puedes{" "}
          <a
            href={currentVideo.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            descargar el video
          </a>{" "}
          directamente.
        </p>
      </video>

      {!isPlaying && (
        <div className="play-overlay-vidu" onClick={togglePlay}>
          <div className="play-button-large">
            <Play className="play-icon-large" />
          </div>
        </div>
      )}

      <div className={`video-controls-vidu ${showControls ? "visible" : ""}`}>
        <div className="progress-container">
          <div
            className="progress-bar-vidu"
            ref={progressRef}
            onClick={handleProgressClick}
          >
            <div
              className="progress-fill-vidu"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <div
              className="progress-handle-vidu"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            />
            {interactiveContent &&
              interactiveContent.map((interaction) => {
                if (!duration || duration === 0) return null;
                const position =
                  (interaction.tiempo_activacion_segundos / duration) * 100;
                return (
                  <div
                    key={interaction.id}
                    className="interaction-point"
                    style={{ left: `${position}%` }}
                    title={`${interaction.titulo} - ${interaction.tiempo_activacion_segundos}s`}
                  />
                );
              })}
          </div>
        </div>

        <div className="controls-row-vidu">
          <div className="controls-left">
            <button className="control-btn-vidu" onClick={() => skipTime(-10)}>
              <SkipBack size={20} />
            </button>
            <button className="control-btn-vidu play-btn" onClick={togglePlay}>
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button className="control-btn-vidu" onClick={() => skipTime(10)}>
              <SkipForward size={20} />
            </button>
            <div className="volume-control-vidu">
              <button className="control-btn-vidu" onClick={toggleMute}>
                {isMuted || volume === 0 ? (
                  <VolumeX size={20} />
                ) : (
                  <Volume2 size={20} />
                )}
              </button>
              <input
                type="range"
                className="volume-slider-vidu"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
              />
            </div>
            <div className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="controls-right">
            <div className="settings-dropdown">
              <button
                className="control-btn-vidu"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings size={20} />
              </button>
              {showSettings && (
                <div className="settings-menu">
                  <div className="settings-section">
                    <span className="settings-label">Velocidad</span>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        className={`settings-option ${
                          playbackRate === rate ? "active" : ""
                        }`}
                        onClick={() => changePlaybackRate(rate)}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button className="control-btn-vidu" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>

      {showInteractionModal && currentInteraction && (
        <InteractionModal
          currentInteraction={currentInteraction}
          handleInteractionAnswer={handleInteractionAnswer}
          closeInteractionModal={closeInteractionModal}
        />
      )}
    </div>
  );
};

export default VideoPlayer;
