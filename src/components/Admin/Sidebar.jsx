import React from "react";
import { 
  Target, Edit3, Eye, EyeOff, Trash2, AlertTriangle, Loader2, 
  CheckSquare, BarChart, Type, MousePointer, Star, Vote, 
  AlignLeft, MessageSquare, Users
} from "lucide-react";

const colorMap = {
  1: { icon: CheckSquare, color: "#84CC16", nombre: "Opción Múltiple" },
  2: { icon: BarChart, color: "#10B981", nombre: "Encuesta" },
  3: { icon: AlignLeft, color: "#3B82F6", nombre: "Completar Espacios" },
  4: { icon: MousePointer, color: "#8B5CF6", nombre: "Arrastrar y Soltar" },
  5: { icon: Target, color: "#EF4444", nombre: "Puntos de Interacción" },
  6: { icon: Type, color: "#EF4444", nombre: "Entrada de Texto" },
  7: { icon: Star, color: "#F97316", nombre: "Calificación" },
  8: { icon: Users, color: "#10B981", nombre: "Votación" },
};

const Sidebar = ({ 
  contenidos, 
  stats, 
  loadingContenidos, 
  editarContenido, 
  toggleEstadoContenido, 
  eliminarInteraccion, 
  loading, 
  formatTime,
  tiposInteraccion
}) => {
  
  const obtenerTipoPorId = (idTipo) => {
    const tipoPorId = colorMap[idTipo];
    if (tipoPorId) return tipoPorId;
    
    if (tiposInteraccion && tiposInteraccion.length > 0) {
      const tipoEncontrado = tiposInteraccion.find(tipo => tipo.id === idTipo);
      if (tipoEncontrado) {
        return {
          icon: CheckSquare,
          color: "#6B7280",
          nombre: tipoEncontrado.nombre || `Tipo ${idTipo}`
        };
      }
    }
    
    return {
      icon: Target,
      color: "#6B7280",
      nombre: `Tipo ${idTipo}`
    };
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>
          Interacciones ({contenidos.length})
          {loadingContenidos && <Loader2 size={16} className="spin ml-2" />}
        </h3>
        <div className="stats-bar">
          <div className="stat-item-con">
            <div className="stat-number">{stats?.activos || 0}</div>
            <div className="stat-label-con">Activas</div>
          </div>
          <div className="stat-item-con">
            <div className="stat-number">{stats?.obligatorios || 0}</div>
            <div className="stat-label-con">Obligatorias</div>
          </div>
          <div className="stat-item-con">
            <div className="stat-number">{stats?.puntosTotales || 0}</div>
            <div className="stat-label-con">Puntos</div>
          </div>
        </div>
      </div>

      <div className="contenidos-list">
        {loadingContenidos ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <Loader2 size={32} className="spin" />
            <p>Cargando interacciones...</p>
          </div>
        ) : contenidos.length > 0 ? (
          contenidos
            .sort((a, b) => a.tiempo_activacion_segundos - b.tiempo_activacion_segundos)
            .map((contenido) => {
              const tipoInfo = obtenerTipoPorId(contenido.id_tipo_interaccion);
              const IconoTipo = tipoInfo.icon;

              return (
                <div
                  key={contenido.id}
                  className={`contenido-item-con ${!contenido.esta_activo ? "inactive" : ""}`}
                  style={{ borderLeftColor: tipoInfo.color }}
                  onClick={() => editarContenido(contenido)}
                >
                  <div className="contenido-header">
                    <IconoTipo size={16} style={{ color: tipoInfo.color }} />
                    <span className="contenido-tiempo">
                      {formatTime(contenido.tiempo_activacion_segundos)}
                    </span>
                    {contenido.es_obligatorio && (
                      <AlertTriangle size={12} color="#EF4444" />
                    )}
                  </div>
                  <h4 className="contenido-titulo">{contenido.titulo || "Sin título"}</h4>
                  <div className="contenido-meta">
                    <span>{tipoInfo.nombre}</span>
                    <span>{contenido.puntos || 0} pts</span>
                    {!contenido.esta_activo && <span>Inactivo</span>}
                  </div>
                  <div
                    className="contenido-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                   <button
                      className="btn-small"
                      onClick={() => editarContenido(contenido)}
                      disabled={loading}
                    >
                      <Edit3 size={12} />
                      Editar
                    </button>
                    <button
                      className={`btn-small ${contenido.esta_activo ? "btn-warning" : "btn-success"}`}
                      onClick={() => toggleEstadoContenido(contenido)}
                      disabled={loading}
                    >
                      {contenido.esta_activo ? (
                        <EyeOff size={12} />
                      ) : (
                        <Eye size={12} />
                      )}
                      {contenido.esta_activo ? "Desactivar" : "Activar"}
                    </button> 
                    <button
                      className="btn-small btn-danger"
                      onClick={() => eliminarInteraccion(contenido.id)}
                      disabled={loading}
                    >
                      <Trash2 size={12} />
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })
        ) : (
          <div style={{ textAlign: "center", color: "#999", padding: "2rem" }}>
            <Target size={48} style={{ opacity: 0.3 }} />
            <p>No hay interacciones</p>
            <p>Haz clic en el timeline para agregar una</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;