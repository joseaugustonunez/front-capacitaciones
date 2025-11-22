import React, { useEffect, useState } from "react";
import {
  X, Loader2, AlertTriangle, CheckSquare, BarChart, Type,
  MousePointer, Target, MessageSquare, Star as StarIcon,
  Users, Plus, Trash2, Image, Sliders, Calendar, FileText,AlignLeft
} from "lucide-react";

const ESCALAS_LIKERT = {
  calidad: [
    { texto_opcion: "Malo", es_correcta: true, posicion: 1 },
    { texto_opcion: "Regular", es_correcta: true, posicion: 2 },
    { texto_opcion: "Aceptable", es_correcta: true, posicion: 3 },
    { texto_opcion: "Muy bueno", es_correcta: true, posicion: 4 },
    { texto_opcion: "Excelente", es_correcta: true, posicion: 5 }
  ],
  satisfaccion: [
    { texto_opcion: "Muy insatisfecho", es_correcta: true, posicion: 1 },
    { texto_opcion: "Insatisfecho", es_correcta: true, posicion: 2 },
    { texto_opcion: "Neutral", es_correcta: true, posicion: 3 },
    { texto_opcion: "Satisfecho", es_correcta: true, posicion: 4 },
    { texto_opcion: "Muy satisfecho", es_correcta: true, posicion: 5 }
  ],
  desempeno: [
    { texto_opcion: "Muy bajo", es_correcta: true, posicion: 1 },
    { texto_opcion: "Bajo", es_correcta: true, posicion: 2 },
    { texto_opcion: "Regular", es_correcta: true, posicion: 3 },
    { texto_opcion: "Bueno", es_correcta: true, posicion: 4 },
    { texto_opcion: "Excelente", es_correcta: true, posicion: 5 }
  ],
  frecuencia: [
    { texto_opcion: "Nunca", es_correcta: true, posicion: 1 },
    { texto_opcion: "Rara vez", es_correcta: true, posicion: 2 },
    { texto_opcion: "A veces", es_correcta: true, posicion: 3 },
    { texto_opcion: "Frecuentemente", es_correcta: true, posicion: 4 },
    { texto_opcion: "Siempre", es_correcta: true, posicion: 5 }
  ],
  acuerdo: [
    { texto_opcion: "Totalmente en desacuerdo", es_correcta: true, posicion: 1 },
    { texto_opcion: "En desacuerdo", es_correcta: true, posicion: 2 },
    { texto_opcion: "Neutral", es_correcta: true, posicion: 3 },
    { texto_opcion: "De acuerdo", es_correcta: true, posicion: 4 },
    { texto_opcion: "Totalmente de acuerdo", es_correcta: true, posicion: 5 }
  ]
};

const ContentEditor = ({ mostrandoEditor, cerrarEditor, formData, setFormData, contenidoSeleccionado, guardarContenido, loading, error, tiposInteraccion }) => {
  const [configuracionLocal, setConfiguracionLocal] = useState({});

  // Efecto para inicializar la configuración cuando se abre el editor
  useEffect(() => {
    if (!mostrandoEditor) return;

    let configuracionExistente = contenidoSeleccionado?.configuracion || {};

    // Fusionar opciones externas a la configuración
    if (contenidoSeleccionado) {
      if (Array.isArray(contenidoSeleccionado.opciones)) {
        configuracionExistente = {
          ...configuracionExistente,
          opciones: contenidoSeleccionado.opciones
        };
        // Si es completar_espacios o arrastrar_soltar, también setear espacios
        const tipo = tiposInteraccion.find(t => t.id === contenidoSeleccionado.id_tipo_interaccion);
        if (tipo && ["completar_espacios", "arrastrar_soltar"].includes(tipo.nombre)) {
          configuracionExistente = {
            ...configuracionExistente,
            espacios: contenidoSeleccionado.opciones.map(op => ({
              respuesta: op.texto_opcion || "",
              es_correcta: op.es_correcta || false
            }))
          };
        }
      }
      setConfiguracionLocal(configuracionExistente);
      setFormData(prev => ({
        ...prev,
        configuracion: configuracionExistente
      }));
    } else {
      // Nueva interacción - inicializar configuración por defecto
      if (formData && (!formData.configuracion || Object.keys(formData.configuracion).length === 0)) {
        const configDefault = {
          mostrar_inmediato: false,
          intentos_maximos: 1,
          opciones: [],
          pregunta: ""
        };
        setFormData(prev => ({
          ...prev,
          configuracion: configDefault
        }));
        setConfiguracionLocal(configDefault);
      }
    }

    // Inicializar tipo de interacción si no está definido
    if (formData && !formData.id_tipo_interaccion && tiposInteraccion.length > 0) {
      if (!contenidoSeleccionado) {
        // Solo cambiar automáticamente si es nueva interacción
        cambiarTipoInteraccion(tiposInteraccion[0].id);
      }
    }
  }, [mostrandoEditor, contenidoSeleccionado]);

  // Efecto separado para sincronizar configuración local con formData
  useEffect(() => {
    if (formData && formData.configuracion && mostrandoEditor) {
      setConfiguracionLocal(formData.configuracion);
    }
  }, [formData?.configuracion, mostrandoEditor]);

  // Mapeo de iconos y colores para tipos de interacción
  const obtenerConfiguracionTipo = (nombreTipo) => {
  switch (nombreTipo) {
    case "cuestionario":
      return { icono: CheckSquare, color: "#84CC16" };
    case "entrada_texto":
      return { icono: Type, color: "#EF4444" };
    case "arrastrar_soltar":
      return { icono: MousePointer, color: "#8B5CF6" };
    case "completar_espacios":
      return { icono: AlignLeft, color: "#06B6D4" };
    case "calificacion":
      return { icono: StarIcon, color: "#F97316" };
    case "votacion":
      return { icono: Users, color: "#10B981" };
    default:
      return { icono: Target, color: "#6B7280" };
  }
};

// Función para inicializar la configuración cuando se cambia el tipo
const cambiarTipoInteraccion = (tipoId) => {
  const tipo = tiposInteraccion.find(t => t.id === tipoId);

    if (tipo) {
      let nuevaConfiguracion = {
        mostrar_inmediato: configuracionLocal?.mostrar_inmediato || false,
        intentos_maximos: configuracionLocal?.intentos_maximos || 1
      };


    switch (tipo.nombre) {
      case "cuestionario":
        nuevaConfiguracion = {
          ...nuevaConfiguracion,
          opciones: configuracionLocal?.opciones && Array.isArray(configuracionLocal.opciones)
            ? configuracionLocal.opciones
            : ["", ""],
          respuesta_correcta: configuracionLocal?.respuesta_correcta !== undefined
            ? configuracionLocal.respuesta_correcta
            : null
        };
        break;

      case "votacion":
        nuevaConfiguracion = {
          ...nuevaConfiguracion,
          pregunta: configuracionLocal?.pregunta || "",
          opciones: configuracionLocal?.opciones && Array.isArray(configuracionLocal.opciones)
            ? configuracionLocal.opciones
            : [{ texto_opcion: "", explicacion: "" }, { texto_opcion: "", explicacion: "" }]
        };
        break;

      case "entrada_texto":
        nuevaConfiguracion = {
          ...nuevaConfiguracion,
          pregunta: configuracionLocal?.pregunta || "",
          longitud_maxima: configuracionLocal?.longitud_maxima || 500,
          respuesta_correcta: configuracionLocal?.respuesta_correcta || ""
        };
        break;

      case "completar_espacios":
        nuevaConfiguracion = {
          ...nuevaConfiguracion,
          texto: configuracionLocal?.texto || "",
          espacios: configuracionLocal?.espacios || []
        };
        break;

      case "calificacion":
        nuevaConfiguracion = {
          ...nuevaConfiguracion,
          pregunta: configuracionLocal?.pregunta || "",
          escala: configuracionLocal?.escala || 5,
          etiquetas: configuracionLocal?.etiquetas || { min: "Malo", max: "Excelente" }
        };
        break;

        default:
          nuevaConfiguracion = {
            ...nuevaConfiguracion,
            pregunta: configuracionLocal?.pregunta || ""
          };
      }

      setConfiguracionLocal(nuevaConfiguracion);
      setFormData(prev => ({
        ...prev,
        id_tipo_interaccion: tipoId,
        configuracion: nuevaConfiguracion
      }));
    }
  };

  // Funciones genéricas para manejar opciones (sin cambios)
  const manejarCambioOpcion = (index, campo, valor) => {
    const nuevasOpciones = [...(configuracionLocal?.opciones || [])];

    if (nuevasOpciones.length === 0) {
      nuevasOpciones.push({});
    }

    nuevasOpciones[index] = {
      ...nuevasOpciones[index],
      [campo]: valor
    };

    const nuevaConfiguracion = {
      ...configuracionLocal,
      opciones: nuevasOpciones
    };

    setConfiguracionLocal(nuevaConfiguracion);
    setFormData(prev => ({
      ...prev,
      configuracion: nuevaConfiguracion
    }));
  };

  const agregarOpcion = () => {
    const nuevasOpciones = [...(configuracionLocal?.opciones || [])];
    nuevasOpciones.push({ texto_opcion: "", explicacion: "" });

    const nuevaConfiguracion = {
      ...configuracionLocal,
      opciones: nuevasOpciones
    };

    setConfiguracionLocal(nuevaConfiguracion);
    setFormData(prev => ({
      ...prev,
      configuracion: nuevaConfiguracion
    }));
  };

  const eliminarOpcion = (index) => {
    const nuevasOpciones = [...(configuracionLocal?.opciones || [])];
    if (nuevasOpciones.length > 2) {
      nuevasOpciones.splice(index, 1);

      const nuevaConfiguracion = {
        ...configuracionLocal,
        opciones: nuevasOpciones
      };

      setConfiguracionLocal(nuevaConfiguracion);
      setFormData(prev => ({
        ...prev,
        configuracion: nuevaConfiguracion
      }));
    }
  };

  // Función para marcar respuesta correcta en cuestionario
  const marcarRespuestaCorrectaCuestionario = (index) => {
    const nuevaConfiguracion = {
      ...configuracionLocal,
      respuesta_correcta: index
    };

    setConfiguracionLocal(nuevaConfiguracion);
    setFormData(prev => ({
      ...prev,
      configuracion: nuevaConfiguracion
    }));
  };

  // Función para transformar los datos al formato esperado por la API (sin cambios)
  const transformarDatosParaAPI = () => {
    const tipoSeleccionado = tiposInteraccion.find(
      t => t.id === formData.id_tipo_interaccion
    );

    if (!tipoSeleccionado) {
      console.error("Tipo de interacción no encontrado:", formData.id_tipo_interaccion);
      return null;
    }

    const datos = {
      id_video: formData.id_video,
      tipo_interaccion: tipoSeleccionado.nombre,
      titulo: formData.titulo?.trim() || "",
      descripcion: formData.descripcion?.trim() || "",
      tiempo_activacion_segundos: parseInt(formData.tiempo_activacion_segundos) || 0,
      configuracion: {
        mostrar_inmediato: configuracionLocal?.mostrar_inmediato || false,
        intentos_maximos: parseInt(configuracionLocal?.intentos_maximos) || 1
      },
      es_obligatorio: formData.es_obligatorio || false,
      puntos: parseInt(formData.puntos) || 0,
      esta_activo: formData.esta_activo ?? true
    };

    const tipoNombre = tipoSeleccionado.nombre;

    // Para cuestionario, votación y encuesta
    if (["cuestionario", "votacion"].includes(tipoNombre)) {
      datos.pregunta = configuracionLocal?.pregunta || "";

      if (tipoNombre === "cuestionario") {
        const opcionesOriginales = configuracionLocal?.opciones || [];

        datos.opciones = opcionesOriginales.map((opcion, index) => {
          let texto = "";
          if (typeof opcion === "string") {
            texto = opcion.trim();
          } else if (typeof opcion === "object" && opcion !== null) {
            texto = (opcion?.texto_opcion || "").trim();
          }

          return {
            texto_opcion: texto,
            es_correcta: configuracionLocal?.respuesta_correcta === index,
            explicacion: ""
          };
        });
      } else {
        datos.opciones = (configuracionLocal?.opciones || []).map(opcion => {
          const texto = (opcion.texto_opcion || opcion || "").toString().trim();
          return {
            texto_opcion: texto,
            explicacion: (opcion.explicacion || "").toString().trim()
          };
        });
      }
    }

    // Otros tipos
    if (tipoNombre === "entrada_texto") {
      datos.pregunta = configuracionLocal?.pregunta || "";
      datos.longitud_maxima = configuracionLocal?.longitud_maxima || 500;
      datos.respuesta_correcta = configuracionLocal?.respuesta_correcta || "";
    }

    if (tipoNombre === "calificacion") {
      datos.pregunta = configuracionLocal?.pregunta || "";
      datos.escala = 5;
      datos.opciones = configuracionLocal?.opciones || ESCALAS_LIKERT.calidad;
    }

    if (tipoNombre === "completar_espacios") {
      datos.texto = configuracionLocal?.texto || "";
      datos.opciones = configuracionLocal?.opciones || [];
    }

    if (tipoNombre === "arrastrar_soltar") {
      datos.texto = configuracionLocal?.texto || "";
      datos.opciones = configuracionLocal?.opciones || [];
    }

    if (tipoNombre === "puntos_interaccion") {
      datos.pregunta = configuracionLocal?.pregunta || "";
      datos.imagen_url = configuracionLocal?.imagen_url || "";
      datos.puntos = configuracionLocal?.puntos || [];
    }

    return datos;
  };

  // El resto del código renderConfiguracionTipo permanece igual...
  const renderConfiguracionTipo = () => {
    if (!formData.id_tipo_interaccion) {
      return (
        <div className="config-no-seleccionado">
          <p>Por favor, seleccione un tipo de interacción para configurar.</p>
        </div>
      );
    }

    const tipoSeleccionado = tiposInteraccion.find(t => t.id === formData.id_tipo_interaccion);
    if (!tipoSeleccionado) {
      return (
        <div className="config-no-seleccionado">
          <p>Tipo de interacción no válido.</p>
        </div>
      );
    }

    const tipoNombre = tipoSeleccionado.nombre;
    const configTipo = obtenerConfiguracionTipo(tipoNombre);

    // Configuración común para tipos con opciones
    if (["cuestionario", "votacion"].includes(tipoNombre)) {
      return (
        <div className={`config-${tipoNombre}`}>
          <div className="opciones-lista">
            <div className="opciones-header">
              <label>Opciones de {tipoNombre}</label>
              <button
                type="button"
                className="btn-agregar-opcion"
                onClick={agregarOpcion}
                disabled={loading}
              >
                <Plus size={16} />
                Agregar opción
              </button>
            </div>

            {(configuracionLocal?.opciones || []).map((opcion, index) => (
              <div key={index} className={`opcion-item-${tipoNombre}`}>
                <div className="opcion-inputs">
                  <input
                    type="text"
                    value={tipoNombre === "cuestionario" ? (typeof opcion === 'string' ? opcion : opcion?.texto_opcion || "") : (opcion.texto_opcion || "")}
                    onChange={(e) =>
                      tipoNombre === "cuestionario"
                        ? manejarCambioOpcion(index, "texto_opcion", e.target.value)
                        : manejarCambioOpcion(index, "texto_opcion", e.target.value)
                    }
                    placeholder={`Opción ${index + 1}`}
                    disabled={loading}
                  />

                  {tipoNombre !== "cuestionario" && (
                    <textarea
                      value={opcion.explicacion || ""}
                      onChange={(e) => manejarCambioOpcion(index, "explicacion", e.target.value)}
                      placeholder="Explicación (opcional)"
                      rows={2}
                      disabled={loading}
                    />
                  )}
                </div>
                <div className="opcion-actions">
                  {tipoNombre === "cuestionario" && (
                    <label className="checkbox-label-vid">
                      <input
                        type="radio"
                        name="respuesta_correcta_cuestionario"
                        checked={configuracionLocal?.respuesta_correcta === index}
                        onChange={() => marcarRespuestaCorrectaCuestionario(index)}
                        disabled={loading}
                      />
                      Correcta
                    </label>
                  )}
                  <button
                    type="button"
                    className="btn-eliminar-opcion"
                    onClick={() => eliminarOpcion(index)}
                    disabled={loading || (configuracionLocal?.opciones || []).length <= 2}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

           {(!formData?.opciones || formData.opciones.length === 0) && (
  <div className="sin-opciones">
    <p>No hay opciones configuradas. Agrega opciones si lo deseas.</p>
  </div>
)}
          </div>
        </div>
      );
    }
    // Entrada de texto
    else if (tipoNombre === "entrada_texto") {
      return (
        <div className="config-entrada-texto">
          <div className="form-group-contenido">
            <label>Longitud máxima de respuesta (caracteres)</label>
            <input
              type="number"
              value={configuracionLocal?.longitud_maxima || 500}
              onChange={(e) => {
                const nuevaConfig = { ...configuracionLocal, longitud_maxima: parseInt(e.target.value) || 500 };
                setConfiguracionLocal(nuevaConfig);
                setFormData(prev => ({ ...prev, configuracion: nuevaConfig }));
              }}
              min="1"
              max="2000"
              disabled={loading}
            />
          </div>

          <div className="form-group-contenido">
            <label>Respuesta correcta (opcional, para evaluación automática)</label>
            <input
              type="text"
              value={configuracionLocal?.respuesta_correcta || ""}
              onChange={(e) => {
                const nuevaConfig = { ...configuracionLocal, respuesta_correcta: e.target.value };
                setConfiguracionLocal(nuevaConfig);
                setFormData(prev => ({ ...prev, configuracion: nuevaConfig }));
              }}
              placeholder="Respuesta esperada (opcional)"
              disabled={loading}
            />
          </div>
        </div>
      );
    }

    // Calificación
    else if (tipoNombre === "calificacion") {
      return (
        <div className="config-calificacion">
          <div className="form-group-contenido">
            <label>Tipo de Escala</label>
            <select
              value={configuracionLocal?.tipoEscala || 'calidad'}
              onChange={(e) => {
                const tipoEscala = e.target.value;
                const nuevaConfig = {
                  ...configuracionLocal,
                  tipoEscala,
                  opciones: ESCALAS_LIKERT[tipoEscala]
                };
                setConfiguracionLocal(nuevaConfig);
                setFormData(prev => ({
                  ...prev,
                  configuracion: nuevaConfig
                }));
              }}
              disabled={loading}
            >
              <option value="calidad">Escala de Calidad</option>
              <option value="satisfaccion">Escala de Satisfacción</option>
              <option value="desempeno">Escala de Desempeño</option>
              <option value="frecuencia">Escala de Frecuencia</option>
              <option value="acuerdo">Escala de Acuerdo</option>
            </select>
          </div>

          <div className="opciones-preview">
            <label>Vista previa de la escala:</label>
            <div className="escala-preview">
              {(configuracionLocal?.opciones || ESCALAS_LIKERT.calidad).map((opcion) => (
                <div key={opcion.posicion} className="opcion-preview">
                  {opcion.texto_opcion}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Completar espacios
    else if (tipoNombre === "completar_espacios") {
      const espaciosIniciales = configuracionLocal?.espacios?.length
        ? configuracionLocal.espacios
        : [{ respuesta: "", es_correcta: false }];

      const configConEspacios = { ...configuracionLocal, espacios: espaciosIniciales };

      const actualizarConfiguracion = (nuevosEspacios) => {
        const nuevaConfig = { ...configConEspacios, espacios: nuevosEspacios };
        const opcionesTransformadas = nuevosEspacios.map((e, index) => ({
          texto_opcion: e.respuesta,
          es_correcta: e.es_correcta, 
          posicion: index + 1
        }));
        setConfiguracionLocal(nuevaConfig);
        setFormData(prev => ({
          ...prev,
          configuracion: { ...nuevaConfig, opciones: opcionesTransformadas }
        }));
      };

      return (
        <div className="config-completar-espacios">
          <div className="form-group-contenido">
            <label>Respuestas correctas (opcional, para evaluación automática)</label>
            <div className="respuestas-espacios">
              {configConEspacios.espacios.map((espacio, index) => (
                <div key={index} className="respuesta-espacio">
                  <span>Espacio {index + 1}:</span>
                  <input
                    type="text"
                    value={espacio.respuesta || ""}
                    onChange={(e) => {
                      const nuevosEspacios = [...configConEspacios.espacios];
                      nuevosEspacios[index] = {
                        ...nuevosEspacios[index],
                        respuesta: e.target.value,
                        es_correcta: nuevosEspacios[index]?.es_correcta || false
                      };
                      actualizarConfiguracion(nuevosEspacios);
                    }}
                    placeholder="Respuesta correcta"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className={`btn-correcta ${espacio.es_correcta ? "activo" : ""}`}
                    onClick={() => {
                      const nuevosEspacios = [...configConEspacios.espacios];
                      nuevosEspacios[index] = {
                        ...nuevosEspacios[index],
                        es_correcta: !nuevosEspacios[index]?.es_correcta
                      };
                      actualizarConfiguracion(nuevosEspacios);
                    }}
                    disabled={loading}
                  >
                    {espacio.es_correcta ? "Correcta ✓" : "Marcar correcta"}
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-agregar-espacio"
                onClick={() => {
                  const nuevosEspacios = [...configConEspacios.espacios, { respuesta: "", es_correcta: false }];
                  actualizarConfiguracion(nuevosEspacios);
                }}
                disabled={loading}
              >
                <Plus size={16} />
                Agregar espacio
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Arrastrar y soltar
    else if (tipoNombre === "arrastrar_soltar") {
      const espaciosIniciales = configuracionLocal?.espacios?.length
        ? configuracionLocal.espacios
        : [{ respuesta: "", es_correcta: false }];

      const configConEspacios = { ...configuracionLocal, espacios: espaciosIniciales };

      const actualizarConfiguracion = (nuevosEspacios) => {
        const nuevaConfig = { ...configConEspacios, espacios: nuevosEspacios };
        const opcionesTransformadas = nuevosEspacios.map((e, index) => ({
          texto_opcion: e.respuesta,
          es_correcta: e.es_correcta, 
          posicion: index + 1
        }));
        setConfiguracionLocal(nuevaConfig);
        setFormData(prev => ({
          ...prev,
          configuracion: { ...nuevaConfig, opciones: opcionesTransformadas }
        }));
      };

      return (
        <div className="config-arrastrar-soltar">
          <div className="form-group-contenido">
            <label>Respuestas correctas (opcional, para evaluación automática)</label>
            <div className="respuestas-espacios">
              {configConEspacios.espacios.map((espacio, index) => (
                <div key={index} className="respuesta-espacio">
                  <span>Elemento {index + 1}:</span>
                  <input
                    type="text"
                    value={espacio.respuesta || ""}
                    onChange={(e) => {
                      const nuevosEspacios = [...configConEspacios.espacios];
                      nuevosEspacios[index] = {
                        ...nuevosEspacios[index],
                        respuesta: e.target.value,
                        es_correcta: nuevosEspacios[index]?.es_correcta || false
                      };
                      actualizarConfiguracion(nuevosEspacios);
                    }}
                    placeholder="Texto del elemento"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className={`btn-correcta ${espacio.es_correcta ? "activo" : ""}`}
                    onClick={() => {
                      const nuevosEspacios = [...configConEspacios.espacios];
                      nuevosEspacios[index] = {
                        ...nuevosEspacios[index],
                        es_correcta: !nuevosEspacios[index]?.es_correcta
                      };
                      actualizarConfiguracion(nuevosEspacios);
                    }}
                    disabled={loading}
                  >
                    {espacio.es_correcta ? "Correcto ✓" : "Marcar correcto"}
                  </button>
                  <button
                    type="button"
                    className="btn-eliminar-espacio"
                    onClick={() => {
                      if (configConEspacios.espacios.length > 1) {
                        const nuevosEspacios = [...configConEspacios.espacios];
                        nuevosEspacios.splice(index, 1);
                        actualizarConfiguracion(nuevosEspacios);
                      }
                    }}
                    disabled={loading || configConEspacios.espacios.length <= 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-agregar-espacio"
                onClick={() => {
                  const nuevosEspacios = [...configConEspacios.espacios, { respuesta: "", es_correcta: false }];
                  actualizarConfiguracion(nuevosEspacios);
                }}
                disabled={loading}
              >
                <Plus size={16} />
                Agregar elemento
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Tipo no implementado
    else {
      return (
        <div className="config-no-disponible" style={{ borderLeft: `4px solid ${configTipo.color}` }}>
          <p>La configuración para <strong style={{ color: configTipo.color }}>{tipoSeleccionado.nombre}</strong> estará disponible pronto.</p>
        </div>
      );
    }
  };

  // Obtener el nombre del tipo seleccionado para mostrar
  const obtenerNombreTipoSeleccionado = () => {
    if (!formData.id_tipo_interaccion) return "Ninguno";
    const tipo = tiposInteraccion.find(t => t.id === formData.id_tipo_interaccion);
    return tipo ? tipo.nombre : "Ninguno";
  };

  if (!mostrandoEditor) return null;

  return (
    <div className="editor-overlay">
      <div className="editor-modal">
        <div className="editor-header">
          <h3>
            {contenidoSeleccionado ? "Editar Interacción" : "Nueva Interacción"}
            {formData.tiempo_activacion_segundos > 0 && (
              <span className="tiempo-info">
                Tiempo: {Math.floor(formData.tiempo_activacion_segundos / 60)}:
                {(formData.tiempo_activacion_segundos % 60).toString().padStart(2, '0')}
              </span>
            )}
          </h3>
          <button
            onClick={cerrarEditor}
            className="close-btn"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="error-message">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div className="editor-content">
          <div className="form-group-contenido">
            <label>Tipo de Interacción *</label>
            <div className="tipo-selector">
              {tiposInteraccion.map((tipo) => {
                const configTipo = obtenerConfiguracionTipo(tipo.nombre);
                const IconoTipo = configTipo.icono;

                return (
                  <button
                    key={tipo.id}
                    type="button"
                    className={`tipo-btn ${formData.id_tipo_interaccion == tipo.id ? "selected" : ""}`}
                    onClick={() => cambiarTipoInteraccion(tipo.id)}
                    style={{
                      borderColor: configTipo.color,
                      backgroundColor: formData.id_tipo_interaccion == tipo.id ?
                        `${configTipo.color}20` : 'transparent'
                    }}
                    disabled={loading}
                  >
                    <IconoTipo size={20} style={{ color: configTipo.color }} />
                    <span style={{ color: formData.id_tipo_interaccion == tipo.id ? configTipo.color : '#374151' }}>
                      {tipo.nombre}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="tipo-seleccionado-info">
              Tipo seleccionado: <strong>{obtenerNombreTipoSeleccionado()}</strong>
            </div>
          </div>

          {/* Resto de los campos del formulario permanecen iguales */}
          <div className="form-row">
            <div className="form-group-contenido">
              <label>Título *</label>
              <input
                type="text"
                value={formData.titulo || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
                placeholder="Título de la interacción"
                disabled={loading}
                maxLength={200}
              />
            </div>
            <div className="form-group-contenido">
              <label>Puntos</label>
              <input
                type="number"
                value={formData.puntos || 0}
                onChange={(e) => setFormData((prev) => ({ ...prev, puntos: parseInt(e.target.value) || 0 }))}
                min="0"
                disabled={loading}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group-contenido">
              <label>Tiempo de activación (segundos)</label>
              <input
                type="number"
                value={formData.tiempo_activacion_segundos || 0}
                onChange={(e) => setFormData((prev) => ({ ...prev, tiempo_activacion_segundos: parseInt(e.target.value) || 0 }))}
                min="0"
                disabled={loading}
              />
            </div>
            <div className="form-group-contenido">
              <label>Intentos máximos</label>
              <input
                type="number"
                value={configuracionLocal?.intentos_maximos || 1}
                onChange={(e) => {
                  const nuevaConfig = { ...configuracionLocal, intentos_maximos: parseInt(e.target.value) || 1 };
                  setConfiguracionLocal(nuevaConfig);
                  setFormData(prev => ({ ...prev, configuracion: nuevaConfig }));
                }}
                min="1"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group-contenido">
            <label>Pregunta</label>
            <textarea
              value={formData.descripcion || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Ingrese la pregunta"
              rows={3}
              disabled={loading}
              maxLength={1000}
            />
          </div>

          <div className="tipo-config">
            <h4>
              Configuración específica de{" "}
              <span style={{
                color: obtenerConfiguracionTipo(obtenerNombreTipoSeleccionado()).color
              }}>
                {obtenerNombreTipoSeleccionado()}
              </span>
            </h4>
            {renderConfiguracionTipo()}
          </div>

          <div className="form-options-con">
            <label className="checkbox-label-vid">
              <input
                type="checkbox"
                checked={formData.es_obligatorio || false}
                onChange={(e) => setFormData((prev) => ({ ...prev, es_obligatorio: e.target.checked }))}
                disabled={loading}
              />
              Obligatorio
            </label>
            <label className="checkbox-label-vid">
              <input
                type="checkbox"
                checked={formData.esta_activo !== false}
                onChange={(e) => setFormData((prev) => ({ ...prev, esta_activo: e.target.checked }))}
                disabled={loading}
              />
              Activo
            </label>
            <label className="checkbox-label-vid">
              <input
                type="checkbox"
                checked={configuracionLocal?.mostrar_inmediato || false}
                onChange={(e) => {
                  const nuevaConfig = { ...configuracionLocal, mostrar_inmediato: e.target.checked };
                  setConfiguracionLocal(nuevaConfig);
                  setFormData(prev => ({ ...prev, configuracion: nuevaConfig }));
                }}
                disabled={loading}
              />
              Mostrar inmediatamente
            </label>
          </div>
        </div>

        <div className="editor-actions">
          <button
            onClick={cerrarEditor}
            className="btn-secondary-con"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              const datosTransformados = transformarDatosParaAPI();
              if (datosTransformados) {
                guardarContenido(datosTransformados);
              }
            }}
            className="btn-primary-con"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin" />
                Guardando...
              </>
            ) : contenidoSeleccionado ? (
              "Actualizar"
            ) : (
              "Crear"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentEditor;