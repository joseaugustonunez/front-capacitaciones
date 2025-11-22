// src/components/MisCursosPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Play, Eye, Clock } from 'lucide-react';
import '../styles/miscursos.css'; // Asegúrate de tener el CSS

const MisCursosPage = ({ inscribedVideos = [] }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulamos un pequeño delay para mostrar el loader (puedes ajustarlo o quitarlo)
    const timer = setTimeout(() => {
      setLoading(false);
    },1000);
    return () => clearTimeout(timer);
  }, []);

  const getProgressColor = (progress) => {
    if (progress === 100) return 'completed';
    if (progress >= 40) return 'in-progress';
    return 'started';
  };

  const getProgressStatus = (progress) => {
    if (progress === 100) return 'Completado';
    if (progress >= 40) return 'En progreso';
    return 'Iniciado';
  };

  const manejarIngresarCurso = (cursoId) => {
    navigate(`/curso/${cursoId}`);
  };

  if (loading) {
    return (
      <div className="loader-container">
        <span className="loader"></span>
      </div>
    );
  }

  return (
    <div className="my-courses-container">
      <div className="content-header-mis">
        <h2 className='title-modern'>
           <span className="title-gradient">Mis Cursos Inscritos</span> 
        </h2>
        <p>Continúa aprendiendo donde lo dejaste</p>
      </div>

      <div className="courses-grid">
        {inscribedVideos.length > 0 ? (
          inscribedVideos.map(video => (
            <div key={video.id} className="course-card">
              <div className="course-thumbnail">
                <img src={video.thumbnail} alt={video.title} />
                <div className="course-overlay">
                  <button className="play-button"
                  onClick={() => manejarIngresarCurso(video.id)}>
                    <Play size={24} fill="white" />
                  </button>
                </div>
                <span className="course-duration">{video.duration}</span>
                <span className={`course-category ${video.category.toLowerCase().replace(/\s+/g, '-')}`}>
                  {video.category}
                </span>
              </div>

              <div className="course-info">
                <h3 className="course-title-mis">{video.title}</h3>
                <p className="course-instructor">Por {video.instructor}</p>

                <div className="course-meta">
                  <div className="meta-item-mis">
                    <Eye size={14} />
                    <span>{video.views} vistas</span>
                  </div>
                  <div className="meta-item-mis">
                    <Clock size={14} />
                    <span>{video.duration}</span>
                  </div>
                </div>

                <div className="progress-section-mis">
                  <div className="progress-info">
                    <span className="progress-text">Progreso: {video.progress}%</span>
                    <span className={`progress-status ${getProgressColor(video.progress)}`}>
                      {getProgressStatus(video.progress)}
                    </span>
                  </div>
                  <div className="progress-bar-mis">
                    <div
                      className={`progress-fill ${getProgressColor(video.progress)}`}
                      style={{ width: `${video.progress}%` }}
                    ></div>
                  </div>
                </div>

                <button className="continue-btn"
                onClick={() => manejarIngresarCurso(video.id)}>
                  Continuar Viendo
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No tienes cursos inscritos</h3>
            <p>Explora nuestro catálogo y comienza a aprender</p>
            <button className="browse-btn">
              Explorar Cursos
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MisCursosPage;
