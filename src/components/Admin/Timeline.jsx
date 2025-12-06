import React, { useRef } from "react";
import {
  Target,
  CheckSquare,
  BarChart,
  Type,
  MousePointer,
  MessageSquare,
  Star,
  Users,
  AlignLeft,
} from "lucide-react";

const tipoMap = {
  1: { icon: CheckSquare, color: "#84CC16", nombre: "Opción Múltiple" },
  2: { icon: AlignLeft, color: "#3B82F6", nombre: "Completar Espacios" },
  3: { icon: MousePointer, color: "#8B5CF6", nombre: "Arrastrar y Soltar" },
  4: { icon: Type, color: "#EF4444", nombre: "Entrada de Texto" },
  5: { icon: Star, color: "#F97316", nombre: "Calificación" },
  6: { icon: Users, color: "#10B981", nombre: "Votación" },
  7: { icon: BarChart, color: "#10B981", nombre: "Encuesta" },
  8: { icon: Target, color: "#EF4444", nombre: "Puntos de Interacción" },
};
const Timeline = ({
  contenidos,
  duration,
  currentTime,
  seekTo,
  agregarInteraccionEnTiempo,
  editarContenido,
  interaccionesCompletadas,
  formatTime,
  tiposInteraccion,
}) => {
  const timelineRef = useRef(null);

  const obtenerTipoPorId = (idTipo) => {
    const tipoLocal = tipoMap[idTipo];
    if (tipoLocal) return tipoLocal;

    if (tiposInteraccion && tiposInteraccion.length > 0) {
      const tipoEncontrado = tiposInteraccion.find(
        (tipo) => tipo.id === idTipo
      );
      if (tipoEncontrado) {
        const icono = tipoMap[tipoEncontrado.id]?.icon || Target;
        return {
          icon: icono,
          color: tipoEncontrado.color || "#6B7280",
          nombre: tipoEncontrado.nombre || `Tipo ${idTipo}`,
        };
      }
    }

    return {
      icon: Target,
      color: "#6B7280",
      nombre: `Tipo ${idTipo}`,
    };
  };

  return (
    <div className="timeline-section">
      <h3>Timeline de Interacciones</h3>
      <div className="timeline-container" ref={timelineRef}>
        <div className="timeline-track">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <div
              className="progress-handle"
              style={{ left: `${(currentTime / duration) * 100}%` }}
              onMouseDown={(e) => {
                const rect =
                  e.currentTarget.parentElement.getBoundingClientRect();
                const handleMouseMove = (e) => {
                  const x = e.clientX - rect.left;
                  const percentage = Math.max(0, Math.min(1, x / rect.width));
                  seekTo(percentage * duration);
                };
                const handleMouseUp = () => {
                  document.removeEventListener("mousemove", handleMouseMove);
                  document.removeEventListener("mouseup", handleMouseUp);
                };
                document.addEventListener("mousemove", handleMouseMove);
                document.addEventListener("mouseup", handleMouseUp);
              }}
            />
          </div>
          <div className="time-markers">
            {Array.from({ length: Math.ceil(duration / 30) }, (_, i) => (
              <div
                key={i}
                className="time-marker"
                style={{ left: `${((i * 30) / duration) * 100}%` }}
              >
                <span>{formatTime(i * 30)}</span>
              </div>
            ))}
          </div>
          <div className="interactions-track">
            {[...contenidos]
              .sort(
                (a, b) =>
                  a.tiempo_activacion_segundos - b.tiempo_activacion_segundos
              )
              .map((contenido) => {
                const tipo = obtenerTipoPorId(contenido.id_tipo_interaccion);
                const IconoTipo = tipo.icon;
                const position =
                  (contenido.tiempo_activacion_segundos / duration) * 100;
                const estaCompletada = interaccionesCompletadas.has(
                  contenido.id
                );

                return (
                  <div
                    key={contenido.id}
                    className={`interaction-marker ${
                      !contenido.esta_activo ? "inactive" : ""
                    } ${estaCompletada ? "completed" : ""}`}
                    style={{
                      left: `${position}%`,
                      backgroundColor: tipo.color,
                      opacity: estaCompletada ? 0.6 : 1,
                    }}
                    onClick={() => {
                      seekTo(contenido.tiempo_activacion_segundos);
                      editarContenido(contenido);
                    }}
                    title={`${contenido.titulo} - ${tipo.nombre} - ${formatTime(
                      contenido.tiempo_activacion_segundos
                    )} ${estaCompletada ? "(Completada)" : ""}`}
                  >
                    <IconoTipo size={12} color="#ffffff" />
                    {contenido.es_obligatorio && (
                      <div className="obligatorio-indicator">!</div>
                    )}
                    {estaCompletada && (
                      <div className="completed-indicator">✓</div>
                    )}
                  </div>
                );
              })}
          </div>
          <div
            className="timeline-clickable-con"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percentage = x / rect.width;
              const tiempo = percentage * duration;
              agregarInteraccionEnTiempo(tiempo);
            }}
          />
        </div>
      </div>

      <div className="timeline-help">
        Haz clic en cualquier punto del timeline para agregar una nueva
        interacción
      </div>
    </div>
  );
};

export default Timeline;
