import React, { useState, useEffect } from "react";
import { Target, CheckSquare, BarChart, Type, MousePointer, MessageSquare, Star as StarIcon, Users, AlertCircle } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
const InteractionModal = ({
  interaccionActiva,
  respuestaUsuario,
  setRespuestaUsuario,
  procesarRespuesta,
  saltarInteraccion,
  obtenerTipoInteraccion,
  validarRespuesta,
  formatTime,
  loading,
}) => {
  const [intentoEnvio, setIntentoEnvio] = useState(false);
  const [userData, setUserData] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [palabrasCompletar, setPalabrasCompletar] = useState({});
  const [resultadoRespuesta, setResultadoRespuesta] = useState(null);

  useEffect(() => {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      try {
        const parsedData = JSON.parse(userDataString);
        setUserData(parsedData);
      } catch (error) {
        setValidationError("Error de autenticación");
      }
    }
  }, []);

  const inicializarTiempoRespuesta = () => {
    if (interaccionActiva && interaccionActiva.id) {
      const tiempoInicio = Date.now();
      sessionStorage.setItem(`interaction_start_${interaccionActiva.id}`, tiempoInicio.toString());
    }
  };

  const calcularTiempoRespuesta = () => {
    const tiempoInicio = sessionStorage.getItem(`interaction_start_${interaccionActiva.id}`);
    if (tiempoInicio) {
      const tiempoActual = Date.now();
      const tiempoTranscurrido = Math.floor((tiempoActual - parseInt(tiempoInicio)) / 1000);
      return tiempoTranscurrido;
    }

    return 10;
  };

  const obtenerNumeroIntento = () => {
    const intentosKey = `interaction_attempts_${userData.id}_${interaccionActiva.id}`;
    const intentosActuales = localStorage.getItem(intentosKey) || "0";
    const numeroIntento = parseInt(intentosActuales) + 1;

    localStorage.setItem(intentosKey, numeroIntento.toString());

    return numeroIntento;
  };

  const formatearDatosRespuesta = () => {
    if (!tipo) return respuestaUsuario;

    switch (tipo.nombre) {
      case "calificacion":
        return {
          opciones_seleccionadas: respuestaUsuario.opciones_seleccionadas || []
        };

      case "cuestionario":
      case "votacion":
        return {
          opciones_seleccionadas: respuestaUsuario.opciones_seleccionadas || []
        };

      case "entrada_texto":
        return {
          texto: respuestaUsuario.texto?.trim() || ""
        };

      case "completar_espacios":
        return {
          opciones_seleccionadas: Array(
            interaccionActiva.descripcion.split("[]").length - 1
          )
            .fill(null)
            .map((_, i) =>
              typeof respuestaUsuario.opciones_seleccionadas?.[i] === "number"
                ? respuestaUsuario.opciones_seleccionadas[i]
                : null
            ),
        };

      default:
        return respuestaUsuario;
    }
  };

const enviarRespuesta = async () => {
  setIntentoEnvio(true);
  setValidationError(null);

  if (!validarRespuestaCompleta()) {
    setValidationError("Por favor, completa la respuesta");
    setIntentoEnvio(false);
    return;
  }

  try {
    const datosFormateados = {
      id_usuario: userData.id,
      id_contenido_interactivo: interaccionActiva.id,
      datos_respuesta: formatearDatosRespuesta(),
      tiempo_respuesta_segundos: calcularTiempoRespuesta()
    };
    const resultado = await procesarRespuesta(datosFormateados);

    // Aquí validas si es correcta o no
    if (resultado && typeof resultado.correcta !== "undefined") {
      setResultadoRespuesta(
        resultado.correcta
          ? "¡Respuesta correcta!"
          : "Respuesta incorrecta"
      );
    } else {
      setResultadoRespuesta("¡Respuesta guardada correctamente!");
    }

    setTimeout(() => {
      setResultadoRespuesta(null);
    }, 2000);

  } catch (error) {
    setValidationError(error.message || "Error al procesar la respuesta");
  } finally {
    setIntentoEnvio(false);
  }
};
  useEffect(() => {
    setIntentoEnvio(false);
    setValidationError(null);
    setRespuestaUsuario({});
    setPalabrasCompletar({});
    setResultadoRespuesta(null);

    inicializarTiempoRespuesta();
  }, [interaccionActiva]);

  useEffect(() => {
    if (interaccionActiva && interaccionActiva.id_tipo_interaccion) {
      const tipo = obtenerTipoInteraccion(interaccionActiva.id_tipo_interaccion);

      if (tipo && tipo.nombre === "completar_espacios") {
        const palabrasIniciales = {};
        (interaccionActiva.espacios || []).forEach((espacio, index) => {
          palabrasIniciales[index] = "";
        });
        setPalabrasCompletar(palabrasIniciales);
      }
    }
  }, [interaccionActiva]);

  useEffect(() => {
    console.log('Estado actual de respuestaUsuario:', respuestaUsuario);
  }, [respuestaUsuario]);

  if (!interaccionActiva) return null;

  const tipo = obtenerTipoInteraccion(interaccionActiva.id_tipo_interaccion);

  const obtenerIcono = (nombreTipo) => {
    const iconos = {
      "cuestionario": CheckSquare,
      "encuesta": BarChart,
      "entrada_texto": Type,
      "arrastrar_soltar": MousePointer,
      "puntos_interaccion": Target,
      "completar_espacios": MessageSquare,
      "calificacion": StarIcon,
      "votacion": Users,
    };
    return iconos[nombreTipo] || Target;
  };

  const IconoTipo = tipo ? obtenerIcono(tipo.nombre) : Target;

  const manejarCambioRespuesta = (nuevosValores) => {
    setRespuestaUsuario(prev => ({ ...prev, ...nuevosValores }));
  };

  const manejarCambioPalabra = (index, valor) => {
    setPalabrasCompletar(prev => {
      const nuevasPalabras = { ...prev, [index]: valor };

      setRespuestaUsuario(prevRespuesta => ({
        ...prevRespuesta,
        palabras: Object.values(nuevasPalabras)
      }));

      return nuevasPalabras;
    });
  };

  const manejarSeleccionVotacion = (opcionId) => {
    setRespuestaUsuario(prev => {
      const opcionesActuales = prev.opciones_seleccionadas || [];

      if (opcionesActuales.includes(opcionId)) {
        return {
          ...prev,
          opciones_seleccionadas: opcionesActuales.filter(id => id !== opcionId)
        };
      } else {
        return {
          ...prev,
          opciones_seleccionadas: [...opcionesActuales, opcionId]
        };
      }
    });
  };
  const obtenerMensajeError = () => {
    if (validationError) return validationError;
    if (!intentoEnvio) return null;

    if (!tipo) return "Tipo de interacción desconocido";

    switch (tipo.nombre) {
      case "cuestionario":
        return !respuestaUsuario.opciones_seleccionadas?.length ? "Por favor, selecciona una opción" : null;
      case "entrada_texto":
        return !respuestaUsuario.texto ? "Por favor, escribe tu respuesta" : null;
      case "votacion":
        const tieneOpciones = Array.isArray(respuestaUsuario.opciones_seleccionadas) && respuestaUsuario.opciones_seleccionadas.length > 0;
        return !tieneOpciones ? "Por favor, selecciona al menos una opción" : null;
      case "completar_espacios":
        const todasCompletadas = Object.values(palabrasCompletar).every(
          (palabra) => palabra.trim() !== ""
        );
        return !todasCompletadas ? "Por favor, completa todos los espacios" : null;
      case "calificacion":
        return !respuestaUsuario.opciones_seleccionadas?.length
          ? "Por favor, selecciona una calificación"
          : null;
      default:
        return "Por favor, completa la interacción";
    }
  };

  const validarRespuestaCompleta = () => {
    if (!tipo) return false;

    switch (tipo.nombre) {
      case "calificacion":
        return Array.isArray(respuestaUsuario.opciones_seleccionadas) &&
          respuestaUsuario.opciones_seleccionadas.length > 0;
      case "cuestionario":
      case "votacion":
        return Array.isArray(respuestaUsuario.opciones_seleccionadas) &&
          respuestaUsuario.opciones_seleccionadas.length > 0;

      case "entrada_texto":
        return !!respuestaUsuario.texto?.trim();

      case "completar_espacios":
        return Object.values(palabrasCompletar).every(palabra => palabra.trim() !== "");

      default:
        return true;
    }
  };

  const renderTextoConEspacios = () => {
    if (!interaccionActiva.texto_base) return null;

    const texto = interaccionActiva.texto_base;
    const espacios = interaccionActiva.espacios || [];

    if (espacios.length === 0) {
      return <p>{texto}</p>;
    }

    const partes = [];
    let ultimoIndice = 0;

    espacios.forEach((espacio, index) => {
      if (espacio.indice_inicio > ultimoIndice) {
        partes.push(
          <span key={`texto-${index}`}>
            {texto.substring(ultimoIndice, espacio.indice_inicio)}
          </span>
        );
      }

      partes.push(
        <input
          key={`input-${index}`}
          type="text"
          value={palabrasCompletar[index] || ""}
          onChange={(e) => manejarCambioPalabra(index, e.target.value)}
          placeholder={`${index + 1}`}
          className="espacio-input"
          disabled={loading}
        />
      );

      ultimoIndice = espacio.indice_fin;
    });

    if (ultimoIndice < texto.length) {
      partes.push(
        <span key="texto-final">
          {texto.substring(ultimoIndice)}
        </span>
      );
    }

    return <div className="texto-con-espacios">{partes}</div>;
  };

  const renderContenidoInteraccion = () => {
    if (!tipo) return null;

    switch (tipo.nombre) {
      case "cuestionario":
        return (
          <div className="cuestionario-content">
            <h4>{interaccionActiva.titulo}</h4>
            <p>{interaccionActiva.descripcion}</p>

            <div className="opciones">
              {(interaccionActiva.opciones || []).map((opcion) => (
                <label key={opcion.id} className="opcion-label">
                  <input
                    type="radio"
                    name="respuesta"
                    value={opcion.id}
                    checked={respuestaUsuario.opciones_seleccionadas?.[0] === opcion.id}
                    onChange={(e) => {
                      const opcionId = parseInt(e.target.value);
                      manejarCambioRespuesta({ opciones_seleccionadas: [opcionId] });
                    }}
                    disabled={loading}
                  />
                  <span className="opcion-texto">{opcion.texto_opcion}</span>
                  {opcion.explicacion && (
                    <span className="opcion-explicacion"> - {opcion.explicacion}</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        );

      case "votacion":
        return (
          <div className="votacion-content">
            <h4>{interaccionActiva.titulo}</h4>
            <p>{interaccionActiva.descripcion}</p>

            <div className="opciones">
              {(interaccionActiva.opciones || []).map((opcion) => (
                <label key={opcion.id} className="opcion-label">
                  <input
                    type="checkbox"
                    value={opcion.id}
                    checked={respuestaUsuario.opciones_seleccionadas?.includes(opcion.id) || false}
                    onChange={() => manejarSeleccionVotacion(opcion.id)}
                    disabled={loading}
                  />
                  <span className="opcion-texto">{opcion.texto_opcion}</span>
                  {opcion.explicacion && (
                    <span className="opcion-explicacion"> - {opcion.explicacion}</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        );
      case "completar_espacios":
        return (
          <div className="completar-espacios-content">
            <h4>{interaccionActiva.titulo}</h4>
            <div className="texto-a-completar">
              {interaccionActiva.descripcion?.split("[]").map((parte, index) => (
                <React.Fragment key={index}>
                  {parte}
                  {index < interaccionActiva.descripcion.split("[]").length - 1 && (
                    <input
                      type="text"
                      className="input-espacio"
                      value={
                        respuestaUsuario?.opciones_seleccionadas_draft?.[index] !== undefined
                          ? respuestaUsuario.opciones_seleccionadas_draft[index]
                          : (
                              interaccionActiva.opciones.find(
                                (o) => o.id === respuestaUsuario?.opciones_seleccionadas?.[index]
                              )?.texto_opcion || ""
                            )
                      }
                      onChange={(e) => {
                        const valorIngresado = e.target.value;
                        const opcionEncontrada = interaccionActiva.opciones.find(
                          (o) =>
                            o.texto_opcion.toLowerCase() ===
                            valorIngresado.trim().toLowerCase()
                        );

                        // Copia el array actual o crea uno nuevo con la longitud correcta
                        let nuevasOpciones = Array(
                          interaccionActiva.descripcion.split("[]").length - 1
                        )
                          .fill(null)
                          .map((_, i) =>
                            i === index && opcionEncontrada
                              ? opcionEncontrada.id
                              : respuestaUsuario?.opciones_seleccionadas?.[i] || null
                          );

                        // Si no hay coincidencia, deja null en esa posición
                        if (!opcionEncontrada) {
                          nuevasOpciones[index] = null;
                        }

                        // Guarda también el draft para mostrar lo que el usuario escribe
                        let nuevosDrafts = {
                          ...(respuestaUsuario?.opciones_seleccionadas_draft || {}),
                        };
                        if (opcionEncontrada) {
                          delete nuevosDrafts[index];
                        } else {
                          nuevosDrafts[index] = valorIngresado;
                        }

                        setRespuestaUsuario({
                          ...(respuestaUsuario || {}),
                          opciones_seleccionadas: nuevasOpciones,
                          opciones_seleccionadas_draft: nuevosDrafts,
                        });
                      }}
                      placeholder="Escribe aquí"
                      disabled={loading}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
            {interaccionActiva.opciones && (
              <div className="palabras-guia">
                <p>Opciones disponibles:</p>
                <div className="palabras-lista">
                  {interaccionActiva.opciones.map((opcion) => (
                    <span key={opcion.id} className="palabra-guia">
                      {opcion.texto_opcion}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case "arrastrar_soltar":
        const onDragEnd = (result) => {
          if (!result.destination) return;

          const { source, destination, draggableId } = result;
          const opcionId = parseInt(draggableId.replace("opcion-", ""), 10);

          let nuevasRespuestas = {
            ...(respuestaUsuario || {}),
            opciones_seleccionadas: [...(respuestaUsuario?.opciones_seleccionadas || [])],
          };

          if (source.droppableId === "banco-opciones" && destination.droppableId.startsWith("espacio-")) {
            const espacioIndex = parseInt(destination.droppableId.replace("espacio-", ""), 10);
            nuevasRespuestas.opciones_seleccionadas[espacioIndex] = opcionId;
          }

          if (source.droppableId.startsWith("espacio-") && destination.droppableId.startsWith("espacio-")) {
            const fromIndex = parseInt(source.droppableId.replace("espacio-", ""), 10);
            const toIndex = parseInt(destination.droppableId.replace("espacio-", ""), 10);
            const idMovido = nuevasRespuestas.opciones_seleccionadas[fromIndex];

            nuevasRespuestas.opciones_seleccionadas[fromIndex] = null;
            nuevasRespuestas.opciones_seleccionadas[toIndex] = idMovido;
          }

          setRespuestaUsuario(nuevasRespuestas);
        };

        return (
          <div className="completar-espacios-content">
            <h4>{interaccionActiva.titulo}</h4>

            <DragDropContext onDragEnd={onDragEnd}>
              <div className="texto-a-completar">
                {interaccionActiva.descripcion?.split("[]").map((parte, index) => (
                  <React.Fragment key={index}>
                    {parte}
                    {index < interaccionActiva.descripcion.split("[]").length - 1 && (
                      <Droppable droppableId={`espacio-${index}`} direction="horizontal">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`espacio-drop ${snapshot.isDraggingOver ? "activo" : ""}`}
                          >
                            {respuestaUsuario?.opciones_seleccionadas?.[index] ? (
                              <Draggable
                                draggableId={`opcion-${respuestaUsuario.opciones_seleccionadas[index]}`}
                                index={0}
                              >
                                {(provided) => {
                                  const opcionSeleccionada = interaccionActiva.opciones.find(
                                    (o) => o.id === respuestaUsuario.opciones_seleccionadas[index]
                                  );
                                  return (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="opcion-draggable seleccionada"
                                    >
                                      {opcionSeleccionada?.texto_opcion}
                                    </div>
                                  );
                                }}
                              </Draggable>
                            ) : (
                              <span className="placeholder">Arrastra aquí</span>
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {interaccionActiva.opciones && (
                <Droppable droppableId="banco-opciones" direction="horizontal">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="palabras-lista"
                    >
                      {interaccionActiva.opciones
                        .filter(
                          (op) => !respuestaUsuario?.opciones_seleccionadas?.includes(op.id)
                        )
                        .map((opcion, index) => (
                          <Draggable
                            key={opcion.id}
                            draggableId={`opcion-${opcion.id}`}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="opcion-draggable"
                              >
                                {opcion.texto_opcion}
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </DragDropContext>
          </div>
        );


      case "entrada_texto":
        return (
          <div className="entrada-texto-content">
            <h4>{interaccionActiva.titulo}</h4>
            <p>{interaccionActiva.descripcion}</p>

            <div className="entrada-texto-wrapper">
              <textarea
                className="entrada-texto"
                value={respuestaUsuario.texto || ""}
                onChange={(e) =>
                  setRespuestaUsuario((prev) => ({
                    ...prev,
                    texto: e.target.value,
                  }))
                }
                placeholder="Escribe tu respuesta aquí..."
                disabled={loading}
              />
            </div>
          </div>
        );
      case "calificacion":
        return (
          <div className="calificacion-content">
            <h4>{interaccionActiva.titulo}</h4>
            <p>{interaccionActiva.descripcion}</p>

            <div className="opciones-calificacion">
              {(interaccionActiva.opciones || []).map((opcion) => (
                <label
                  key={opcion.id}
                  className={`opcion-calificacion ${respuestaUsuario.opciones_seleccionadas?.[0] === opcion.id
                    ? 'seleccionada'
                    : ''
                    }`}
                >
                  <input
                    type="radio"
                    name="calificacion"
                    value={opcion.id}
                    checked={respuestaUsuario.opciones_seleccionadas?.[0] === opcion.id}
                    onChange={(e) => {
                      const opcionId = parseInt(e.target.value);
                      manejarCambioRespuesta({
                        opciones_seleccionadas: [opcionId]
                      });
                    }}
                    disabled={loading}
                  />
                  <span className="opcion-texto">{opcion.texto_opcion}</span>
                  <span className="opcion-valor">{opcion.posicion}</span>
                </label>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="default-content">
            <h4>{interaccionActiva.titulo}</h4>
            <p>{interaccionActiva.descripcion}</p>
            <button
              onClick={() => manejarCambioRespuesta({ completed: true })}
              className="btn-complete"
              disabled={loading}
            >
              {loading ? "Procesando..." : "Completar"}
            </button>
          </div>
        );
    }
  };

  const mensajeError = obtenerMensajeError();
  const esValido = validarRespuestaCompleta();

  return (
    <div className="imodal-overlay">
      <div className="imodal-container">
        <div className="imodal-header">
          <div className="imodal-icon" style={{ color: tipo?.color }}>
            <IconoTipo size={24} />
          </div>
          <div className="imodal-info">
            <h3>{interaccionActiva.titulo}</h3>
            <p>{interaccionActiva.descripcion}</p>
            <div className="imodal-meta">
              <span>Tiempo: {formatTime(interaccionActiva.tiempo_activacion_segundos)}</span>
              <span>{interaccionActiva.puntos} puntos</span>
              {interaccionActiva.es_obligatorio && (
                <span className="imodal-obligatorio">Obligatorio</span>
              )}
            </div>
          </div>
        </div>

        <div className="imodal-content">
          {renderContenidoInteraccion()}
        </div>

        <div className="imodal-actions">
          {mensajeError && (
            <div className="imodal-error">
              <AlertCircle size={16} />
              {mensajeError}
            </div>
          )}

          {resultadoRespuesta && (
            <div
              className={`imodal-resultado ${resultadoRespuesta === "¡Respuesta correcta!" ? "correcta" : "incorrecta"
                }`}
            >
              {resultadoRespuesta}
            </div>
          )}

          <div className="imodal-buttons">
            {!interaccionActiva.es_obligatorio && (
              <button
                onClick={saltarInteraccion}
                className="imodal-btn imodal-btn-skip"
                disabled={loading}
              >
                Saltar
              </button>
            )}
            <button
              onClick={enviarRespuesta}
              className="imodal-btn imodal-btn-primary"
              disabled={loading || !esValido}
            >
              {loading ? "Enviando..." : "Enviar Respuesta"}
            </button>
          </div>
        </div>
      </div>
    </div>

  );
};

export default InteractionModal;