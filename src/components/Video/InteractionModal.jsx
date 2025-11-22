// src/components/Video/InteractionModal.js
import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const InteractionModal = ({
    currentInteraction,
    handleInteractionAnswer,
    closeInteractionModal,
    interactionResult,
    usuarioId // ⚡ se debe pasar desde el componente padre
}) => {
    const [textoRespuesta, setTextoRespuesta] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [espaciosRespuestas, setEspaciosRespuestas] = useState({});
    const [respuestaUsuario, setRespuestaUsuario] = useState(null); // ⚡ Para drag & drop

    useEffect(() => {
        if (currentInteraction) {
            setTextoRespuesta("");
            setIsSubmitting(false);
            setEspaciosRespuestas({});
            setRespuestaUsuario(null); // ⚡ Reset drag & drop state
        }
    }, [currentInteraction]);

    if (!currentInteraction) return null;

   const handleSubmit = async () => {
        if (currentInteraction.id_tipo_interaccion === 6 && !textoRespuesta.trim()) return;

        setIsSubmitting(true);

        try {
            if (currentInteraction.id_tipo_interaccion === 6) {
                // Respuesta abierta
                await handleInteractionAnswer({
                    texto: textoRespuesta,
                    es_correcta: true
                });
            } else if (currentInteraction.id_tipo_interaccion === 3) {
                // Completar espacios
                const espaciosRequeridos = currentInteraction.descripcion.split("[]").length - 1;
                const espaciosCompletados = Array(espaciosRequeridos)
                    .fill(null)
                    .map((_, index) => espaciosRespuestas[index] || "");

                // Verificar espacios completos
                if (espaciosCompletados.some(texto => !texto.trim())) {
                    alert("Por favor completa todos los espacios");
                    setIsSubmitting(false);
                    return;
                }

                // Mapear a IDs
                const opcionesSeleccionadas = espaciosCompletados.map(texto => {
                    const opcion = currentInteraction.opciones.find(
                        opt => opt.texto_opcion.toLowerCase() === texto.toLowerCase().trim()
                    );
                    return opcion?.id || null;
                });

                // Verificar opciones válidas
                if (opcionesSeleccionadas.some(id => id === null)) {
                    alert("Por favor usa solo las opciones disponibles");
                    setIsSubmitting(false);
                    return;
                }

                console.log("📤 Enviando respuesta:", { opciones_seleccionadas: opcionesSeleccionadas });
                
                try {
                    await handleInteractionAnswer({
                        opciones_seleccionadas: opcionesSeleccionadas
                    });
                } catch (error) {
                    console.error("Error al enviar respuesta:", error);
                    throw error;
                }
            } else if (currentInteraction.id_tipo_interaccion === 4) {
                // ⚡ Arrastrar y soltar
                console.group('📦 Debug Drag & Drop');
                console.log('Estado actual:', {
                    respuestaUsuario,
                    currentInteraction
                });

                if (!respuestaUsuario?.opciones_seleccionadas) {
                    console.warn('❌ No hay opciones seleccionadas');
                    console.groupEnd();
                    alert("Por favor completa todos los espacios");
                    setIsSubmitting(false);
                    return;
                }

                // Verificar que todos los espacios estén completos
                const espaciosRequeridos = currentInteraction.descripcion.split("[]").length - 1;
                console.log('Espacios requeridos:', espaciosRequeridos);
                console.log('Opciones seleccionadas:', respuestaUsuario.opciones_seleccionadas);

                const espaciosCompletos = respuestaUsuario.opciones_seleccionadas
                    .slice(0, espaciosRequeridos)
                    .every(opcion => opcion !== null && opcion !== undefined);

                console.log('¿Espacios completos?:', espaciosCompletos);

                if (!espaciosCompletos) {
                    console.warn('❌ Hay espacios sin completar');
                    console.groupEnd();
                    alert("Por favor completa todos los espacios");
                    setIsSubmitting(false);
                    return;
                }

                // Limpiar el array para enviar solo los IDs necesarios
                const opcionesLimpias = respuestaUsuario.opciones_seleccionadas
                    .slice(0, espaciosRequeridos)
                    .filter(id => id !== null && id !== undefined);

                const respuestaFinal = {
                    opciones_seleccionadas: opcionesLimpias
                };

                console.log('Respuesta final:', {
                    opcionesOriginales: respuestaUsuario.opciones_seleccionadas,
                    opcionesLimpias,
                    respuestaFinal,
                    datosJSON: JSON.stringify(respuestaFinal)
                });

                console.groupEnd();
                
                try {
                    console.log('📤 Enviando respuesta drag & drop:', respuestaFinal);
                    await handleInteractionAnswer(respuestaFinal);
                } catch (error) {
                    console.error("❌ Error al enviar respuesta drag & drop:", error);
                    throw error;
                }
            }
        } catch (error) {
            console.error("❌ Error en handleSubmit:", error);
        } finally {
            // Asegurarnos de resetear el estado de envío
            setTimeout(() => {
                setIsSubmitting(false);
            }, 500);
        }
    };

    const handleOptionClick = async (option) => {
        setIsSubmitting(true);

        try {
            // Enviar opción directamente sin procesar
            await handleInteractionAnswer(option);
        } catch (error) {
            console.error("❌ Error en handleOptionClick:", error);
            setIsSubmitting(false);
        }
    };

    // ⚡ Función para manejar drag & drop
    const onDragEnd = (result) => {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;
        const opcionId = parseInt(draggableId.replace("opcion-", ""), 10);

        let nuevasRespuestas = {
            ...(respuestaUsuario || {}),
            opciones_seleccionadas: [...(respuestaUsuario?.opciones_seleccionadas || [])],
        };

        // ⚡ Si viene del banco de opciones → lo colocamos en el espacio
        if (source.droppableId === "banco-opciones" && destination.droppableId.startsWith("espacio-")) {
            const espacioIndex = parseInt(destination.droppableId.replace("espacio-", ""), 10);
            nuevasRespuestas.opciones_seleccionadas[espacioIndex] = opcionId;
        }

        // ⚡ Si se mueve de un espacio a otro
        if (source.droppableId.startsWith("espacio-") && destination.droppableId.startsWith("espacio-")) {
            const fromIndex = parseInt(source.droppableId.replace("espacio-", ""), 10);
            const toIndex = parseInt(destination.droppableId.replace("espacio-", ""), 10);
            const idMovido = nuevasRespuestas.opciones_seleccionadas[fromIndex];

            nuevasRespuestas.opciones_seleccionadas[fromIndex] = null;
            nuevasRespuestas.opciones_seleccionadas[toIndex] = idMovido;
        }

        // ⚡ Si se devuelve del espacio al banco de opciones
        if (source.droppableId.startsWith("espacio-") && destination.droppableId === "banco-opciones") {
            const espacioIndex = parseInt(source.droppableId.replace("espacio-", ""), 10);
            nuevasRespuestas.opciones_seleccionadas[espacioIndex] = null;
        }

        setRespuestaUsuario(nuevasRespuestas);
    };

    const renderMensaje = () => {
        if (!interactionResult?.showMessage) return null;

        return (
            <div
                className={`interaction-message ${interactionResult.isCorrect ? "success" : "error"}`}
            >
                {interactionResult.message}
            </div>
        );
    };

    const renderContenido = () => {
        if (interactionResult?.showMessage) {
            return null;
        }

        // 📝 Respuesta abierta
        if (currentInteraction.id_tipo_interaccion === 6) {
            return (
                <div className="interaction-text">
                    <textarea
                        className="entrada-texto"
                        value={textoRespuesta}
                        onChange={(e) => setTextoRespuesta(e.target.value)}
                        placeholder="Escribe tu respuesta aquí..."
                        disabled={isSubmitting}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                    />
                    <button
                        className="interaction-submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !textoRespuesta.trim()}
                    >
                        {isSubmitting ? "Enviando..." : "Enviar"}
                    </button>
                </div>
            );
        }

        // 📝 Completar espacios (input)
        if (currentInteraction.id_tipo_interaccion === 3) {
            return (
                <div className="completar-espacios-content">
                    <div className="texto-a-completar">
                        {currentInteraction.descripcion?.split("[]").map((parte, index) => (
                            <React.Fragment key={index}>
                                {parte}
                                {index < currentInteraction.descripcion.split("[]").length - 1 && (
                                    <input
                                        type="text"
                                        className={`input-espacio ${espaciosRespuestas[index] ? "has-value" : ""}`}
                                        value={espaciosRespuestas[index] || ""}
                                        onChange={(e) => {
                                            const valorIngresado = e.target.value;
                                            console.log(`✍️ Input ${index}:`, valorIngresado);

                                            setEspaciosRespuestas((prev) => ({
                                                ...prev,
                                                [index]: valorIngresado
                                            }));
                                        }}
                                        placeholder="Escribe aquí"
                                        disabled={isSubmitting}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {currentInteraction.opciones && (
                        <div className="palabras-guia">
                            <p>Opciones disponibles:</p>
                            <div className="palabras-lista">
                                {currentInteraction.opciones.map((opcion) => {
                                    const estaUsada = Object.values(espaciosRespuestas).some(
                                        (texto) =>
                                            texto.toLowerCase() === opcion.texto_opcion.toLowerCase()
                                    );
                                    return (
                                        <span
                                            key={opcion.id}
                                            className={`palabra-guia ${estaUsada ? "usado" : ""}`}
                                        >
                                            {opcion.texto_opcion}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <button
                        className="interaction-submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Enviando..." : "Enviar"}
                    </button>
                </div>
            );
        }

        // ⚡ Arrastrar y soltar (drag & drop)
        if (currentInteraction.id_tipo_interaccion === 4) {
            return (
                <div className="completar-espacios-content">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="texto-a-completar">
                            {currentInteraction.descripcion?.split("[]").map((parte, index) => (
                                <React.Fragment key={index}>
                                    {parte}
                                    {index < currentInteraction.descripcion.split("[]").length - 1 && (
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
                                                                const opcionSeleccionada = currentInteraction.opciones.find(
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

                        {currentInteraction.opciones && (
                            <Droppable droppableId="banco-opciones" direction="horizontal">
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="palabras-lista"
                                    >
                                        {currentInteraction.opciones
                                            // 🔑 Mostrar solo opciones que no estén ya en espacios
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

                    <button
                        className="interaction-submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Enviando..." : "Enviar"}
                    </button>
                </div>
            );
        }

        // 📝 Selección de opciones (default)
        return (
            <div className="interaction-options">
                {currentInteraction.opciones?.map((option) => (
                    <button
                        key={option.id}
                        className="interaction-option"
                        onClick={() => handleOptionClick(option)}
                        disabled={isSubmitting}
                    >
                        {option.texto_opcion}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="interaction-modal-overlay">
            <div className="interaction-modal">
                <div className="interaction-header">
                    <h3>{currentInteraction.titulo}</h3>
                    {!currentInteraction.es_obligatorio &&
                        !isSubmitting &&
                        !interactionResult?.showMessage && (
                            <button
                                className="interaction-close"
                                onClick={closeInteractionModal}
                            >
                                ×
                            </button>
                        )}
                </div>

                <div className="interaction-content">
                    <p className="interaction-description">
                        {currentInteraction.descripcion}
                    </p>

                    {renderMensaje()}
                    {renderContenido()}

                    <div className="interaction-footer">
                        <span className="interaction-points">
                            {currentInteraction.puntos} puntos
                        </span>
                        {currentInteraction.es_obligatorio && (
                            <span className="interaction-required">
                                * Respuesta obligatoria
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InteractionModal;