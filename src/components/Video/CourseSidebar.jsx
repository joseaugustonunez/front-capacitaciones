import React from "react";
import {
  Layers,
  TrendingUp,
  CheckCircle,
  Clock,
  FileText,
  BookOpen,
  User,
} from "lucide-react";

const CourseSidebar = ({
  currentModule,
  moduleVideos,
  currentVideo,
  courseData,
  handleVideoChange,
}) => {
  return (
    <div className="course-sidebar-vidu">
      <div className="sidebar-header-vid">
        <Layers className="sidebar-icon" />
        <h3>Contenido del módulo</h3>
      </div>

      <div className="content-section-vidu">
        <div className="section-header-vidu">
          <TrendingUp className="section-icon" />
          <span>{currentModule?.title || "Módulo actual"}</span>
        </div>

        <div className="lessons-list">
          {moduleVideos.map((video, index) => (
            <div
              key={video.id}
              className={`lesson-item ${
                video.id === currentVideo.id ? "current" : ""
              } ${video.completed ? "completed" : ""}`}
              onClick={() => handleVideoChange(video.id)}
              style={{ cursor: "pointer" }}
            >
              <div className="lesson-number">{video.order}</div>
              <div className="lesson-info-vidu">
                <div className="lesson-title-vidu">{video.title}</div>
                <div className="lesson-meta-vidu">
                  <Clock size={14} />
                  <span>{video.duration}</span>
                  {video.isPreview && (
                    <span className="preview-badge">Vista Previa</span>
                  )}
                </div>
              </div>
              <div className="lesson-status">
                {video.completed && <CheckCircle className="completed-icon" />}
                {video.id === currentVideo.id && (
                  <div className="current-indicator" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {currentVideo.transcription && (
        <div className="content-section-vidu">
          <div className="section-header-vidu">
            <FileText className="section-icon" />
            <span>Transcripción</span>
          </div>
          <div className="transcription-content">
            <p>{currentVideo.transcription}</p>
          </div>
        </div>
      )}

      {courseData && (
        <div className="course-info-section-vidu">
          <div className="course-info-header-vidu">
            <BookOpen className="course-info-icon-vidu" />
            <h4>Información del curso</h4>
          </div>
          <div className="course-info-content">
            <p className="course-info-title-vidu">{courseData.title}</p>
            <div className="course-info-stats-vidu">
              <div className="course-stat-vidu">
                <Clock size={14} />
                <span>{courseData.duration}</span>
              </div>
              <div className="course-stat-vidu">
                <User size={14} />
                <span>{courseData.instructor}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseSidebar;
