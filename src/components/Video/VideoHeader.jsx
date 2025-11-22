import React from "react";
import {
  BookOpen,
  Eye,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";

const VideoHeader = ({
  currentVideo,
  currentModule,
  courseData,
  moduleVideos,
  getCurrentVideoIndex,
  goBackToCourse,
  goToNextVideo,
}) => {
  return (
    <div className="video-header-vidu">
      <div className="course-info">
        <div className="course-nav">
          <button onClick={goBackToCourse} className="back-btn">
            <ChevronLeft size={20} />
            Volver al curso
          </button>
        </div>
        <div className="course-badge">
          <BookOpen className="course-icon" />
          <span>
            Clase {getCurrentVideoIndex()} de {moduleVideos.length} •
            {currentModule?.title || courseData?.title || "Módulo"}
          </span>
        </div>
        <h1 className="course-title-vidu">{currentVideo.title}</h1>
        {currentVideo.description && (
          <p className="video-description">{currentVideo.description}</p>
        )}
      </div>
      <div className="header-actions">
        <button className="btn-secondary-vid" onClick={goBackToCourse}>
          <Eye size={16} />
          Ver clases
        </button>
        {getCurrentVideoIndex() < moduleVideos.length && (
          <button className="btn-primary-vid" onClick={goToNextVideo}>
            Siguiente clase
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoHeader;