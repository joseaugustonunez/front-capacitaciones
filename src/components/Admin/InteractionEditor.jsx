import React from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";

const InteractionEditor = ({
  mostrandoEditor,
  contenidoSeleccionado,
  formData,
  setFormData,
  tiposInteraccion,
  loading,
  error,
  onGuardar,
  onCerrar
}) => {
  if (!mostrandoEditor) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const obtenerTipoSeleccionado = () => {
    return tiposInteraccion.find((t) => t.id == formData.id_tipo_interaccion);
  };

  const tipoSeleccionado = obtenerTipoSeleccionado();

  // Configuración específica por tipo
  const renderConfiguracionTipo = (tipo) => {
    if (!tipo) return null;
    
    switch (tipo.nombre) {
      // --- Cuestionario ---
      case "cuestionario":
        return (
          <div className="config-cuestionario">
            <div className="form-group-contenido">
              <label>Pregunta</label>
              <input
                type="text"
                value={formData.configuracion?.pregunta || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    configuracion: {
                      ...prev.configuracion,
                      pregunta: e.target.value,
                    },
                  }))
                }
                placeholder="¿Cuál es tu pregunta?"
                disabled={loading}
              />
            </div>
            <div className="opciones-lista">
              <label>Opciones de respuesta</label>
              {(formData.configuracion?.opciones || ["", "", "", ""]).map((opcion, index) => (
                <div key={index} className="opcion-item-con">
                  <input
                    type="text"
                    value={opcion}
                    onChange={(e) => {
                      const nuevasOpciones = [...(formData.configuracion?.opciones || ["", "", "", ""])];
                      nuevasOpciones[index] = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        configuracion: {
                          ...prev.configuracion,
                          opciones: nuevasOpciones,
                        },
                      }));
                    }}
                    placeholder={`Opción ${index + 1}`}
                    disabled={loading}
                  />
                  <label className="checkbox-label-vid">
                    <input
                      type="radio"
                      name="respuesta_correcta"
                      checked={formData.configuracion?.respuesta_correcta === index}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          configuracion: {
                            ...prev.configuracion,
                            respuesta_correcta: index,
                          },
                        }))
                      }
                      disabled={loading}
                    />
                    Correcta
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      // --- Encuesta ---
      case "encuesta":
        return (
          <div className="config-encuesta">
            <div className="form-group-contenido">
              <label>Pregunta de la encuesta</label>
              <input
                type="text"
                value={formData.configuracion?.pregunta || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    configuracion: {
                      ...prev.configuracion,
                      pregunta: e.target.value,
                    },
                  }))
                }
                placeholder="¿Qué opinas sobre...?"
                disabled={loading}
              />
            </div>
            <div className="form-group-contenido">
              <label>Tipo de respuesta</label>
              <select
                value={formData.configuracion?.tipo_respuesta || "escala"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    configuracion: {
                      ...prev.configuracion,
                      tipo_respuesta: e.target.value,
                    },
                  }))
                }
                disabled={loading}
              >
                <option value="escala">Escala 1-5</option>
                <option value="opciones">Opción múltiple</option>
                <option value="texto">Texto libre</option>
              </select>
            </div>
          </div>
        );

      // --- Completar espacios ---
      case "completar_espacios":
        return (
          <div className="config-completar-espacios">
            <div className="form-group-contenido">
              <label>Instrucciones</label>
              <textarea
                value={formData.configuracion?.instrucciones || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    configuracion: {
                      ...prev.configuracion,
                      instrucciones: e.target.value,
                    },
                  }))
                }
                placeholder="Escribe las instrucciones"
                rows={2}
                disabled={loading}
              />
            </div>
            <div className="form-group-contenido">
              <label>Oraciones (usa [ ] para marcar espacios en blanco)</label>
              <textarea
                value={formData.configuracion?.oraciones || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    configuracion: {
                      ...prev.configuracion,
                      oraciones: e.target.value,
                    },
                  }))
                }
                placeholder="Ejemplo: La capital de Francia es [París]."
                rows={4}
                disabled={loading}
              />
            </div>
          </div>
        );

      // --- Arrastrar y soltar ---
      case "arrastrar_soltar":
        return (
          <div className="config-arrastrar-soltar">
            <div className="form-group-contenido">
              <label>Instrucciones</label>
              <textarea
                value={formData.configuracion?.instrucciones || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    configuracion: {
                      ...prev.configuracion,
                      instrucciones: e.target.value,
                    },
                  }))
                }
                placeholder="Describe qué debe ordenar o clasificar el usuario"
                rows={2}
                disabled={loading}
              />
            </div>
            <div className="form-group-contenido">
              <label>Elementos</label>
              <textarea
                value={(formData.configuracion?.elementos || []).join("\n")}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    configuracion: {
                      ...prev.configuracion,
                      elementos: e.target.value.split("\n").filter(item => item.trim() !== ""),
                    },
                  }))
                }
                placeholder="Escribe cada elemento en una línea"
                rows={4}
                disabled={loading}
              />
            </div>
          </div>
        );

      // --- Puntos de interacción ---
      case "puntos_interaccion":
        return (
          <div className="config-puntos-interaccion">
            <div className="form-group-contenido">
              <label>Instrucciones</label>
              <textarea
                value={formData.configuracion?.instrucciones || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    configuracion: {
                      ...prev.configuracion,
                      instrucciones: e.target.value,
                    },
                  }))
                }
                placeholder="Explica qué debe hacer el usuario en la imagen"
                rows={2}
                disabled={loading}
              />
            </div>
            <div className="form-group-contenido">
              <label>Imagen</label>
              <input
                type="text"
                value={formData.configuracion?.imagen || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    configuracion: {
                      ...prev.configuracion,
                      imagen: e.target.value,
                    },
                  }))
                }
                placeholder="URL de la imagen"
                disabled={loading}
              />
            </div>
          </div>
        );

      // --- Entrada de texto ---
      case "entrada_texto":
        return (
          <div className="config-texto">
            <div className="form-group-contenido">
              <label>Instrucciones</label>
              <textarea
                value={formData.configuracion?.instrucciones || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    configuracion: {
                      ...prev.configuracion,
                      instrucciones: e.target.value,
                    },
                  }))
                }
                placeholder="Instrucciones para el usuario"
                rows={2}
                disabled={loading}
              />
            </div>
            <div className="form-group-contenido">
              <label>Máximo de caracteres</label>
              <input
                type="number"
                value={formData.configuracion?.max_caracteres || 500}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    configuracion: {
                      ...prev.configuracion,
                      max_caracteres: parseInt(e.target.value) || 500,
                    },
                  }))
                }
                min="1"
                disabled={loading}
              />
            </div>
          </div>
        );

      // --- Calificación ---
      case "calificacion":
        return (
          <div className="config-calificacion">
            <div className="form-group-contenido">
              <label>Pregunta</label>
              <input
                type="text"
                value={formData.configuracion?.pregunta || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    configuracion: {
                      ...prev.configuracion,
                      pregunta: e.target.value,
                    },
                  }))
                }
                placeholder="¿Qué calificación das?"
                disabled={loading}
              />
            </div>
          </div>
        );

      // --- Votación ---
      case "votacion":
  return (
    <div className="config-votacion">
      <div className="form-group-contenido">
        <label>Pregunta de la votación</label>
        <textarea
          value={formData.configuracion?.pregunta || ""}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              configuracion: {
                ...prev.configuracion,
                pregunta: e.target.value,
              },
            }))
          }
          placeholder="¿Por cuál opción votas?"
          rows={2} // Puedes ajustar el número de filas visibles
          disabled={loading}
        />
      </div>
      <div className="form-group-contenido">
        <label>Opciones</label>
        <textarea
          value={(formData.configuracion?.opciones || []).join("\n")}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              configuracion: {
                ...prev.configuracion,
                opciones: e.target.value.split("\n").filter(item => item.trim() !== ""),
              },
            }))
          }
          placeholder="Escribe cada opción en una línea"
          rows={4}
          disabled={loading}
        />
      </div>
    </div>
  );

      default:
        return (
          <div className="config-general">
            <p>Configuración básica para {tipo.descripcion}</p>
          </div>
        );
    }
  };

  return (
    <div className="editor-overlay">
      <div className="editor-contenedor">
        <div className="editor-header">
          <h2>
            {contenidoSeleccionado
              ? `Editar interacción en ${formatTime(contenidoSeleccionado.tiempo)}`
              : "Nueva interacción"}
          </h2>
          <button className="btn-cerrar" onClick={onCerrar} disabled={loading}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="error-message">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="editor-formulario">
          <div className="form-group">
            <label>Tipo de interacción</label>
            <select
              value={formData.id_tipo_interaccion || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  id_tipo_interaccion: parseInt(e.target.value),
                  configuracion: {}, // Reset config when type changes
                }))
              }
              disabled={loading}
            >
              <option value="">Selecciona un tipo</option>
              {tiposInteraccion.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre} - {tipo.descripcion}
                </option>
              ))}
            </select>
          </div>

          {tipoSeleccionado && renderConfiguracionTipo(tipoSeleccionado)}

          <div className="editor-acciones">
            <button
              type="button"
              className="btn btn-secundario"
              onClick={onCerrar}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primario"
              onClick={onGuardar}
              disabled={loading || !formData.id_tipo_interaccion}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  Guardando...
                </>
              ) : (
                "Guardar interacción"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractionEditor;