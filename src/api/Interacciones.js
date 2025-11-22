import axios from 'axios';

const API_URL = '/api/interacciones';

export const manejarErrorApi = (error) => {
  if (error.response) {
    throw new Error(error.response.data.message || 'Error en la petición');
  } else if (error.request) {
    throw new Error('No se pudo conectar con el servidor');
  } else {
    throw new Error('Error al procesar la petición');
  }
};
export const obtenerEstadisticasVideo = async (idVideo) => {
  if (!idVideo) throw new Error('ID de video es requerido');
  return realizarPeticion(`/video/${idVideo}/estadisticas`);
};

export const analizarContenidosVideo = (contenidos) => {
  if (!Array.isArray(contenidos) || contenidos.length === 0) {
    return {
      total: 0,
      activos: 0,
      inactivos: 0,
      obligatorios: 0,
      opcionales: 0,
      puntosTotales: 0,
      tiempoPromedio: 0,
      porTipo: {},
      porcentajeActivos: 0
    };
  }

  const total = contenidos.length;
  const activos = contenidos.filter(c => c.esta_activo).length;
  const inactivos = total - activos;
  const obligatorios = contenidos.filter(c => c.es_obligatorio).length;
  const opcionales = total - obligatorios;
  const puntosTotales = contenidos.reduce((sum, c) => sum + (c.puntos || 0), 0);
  const tiempoPromedio = contenidos.reduce((sum, c) => sum + (c.tiempo_activacion_segundos || 0), 0) / total;

  const porTipo = contenidos.reduce((grupos, contenido) => {
    const tipo = contenido.tipo_interaccion_nombre || 'Desconocido';
    if (!grupos[tipo]) {
      grupos[tipo] = { cantidad: 0, puntos: 0 };
    }
    grupos[tipo].cantidad++;
    grupos[tipo].puntos += contenido.puntos || 0;
    return grupos;
  }, {});

  const porcentajeActivos = Math.round((activos / total) * 100);

  return {
    total,
    activos,
    inactivos,
    obligatorios,
    opcionales,
    puntosTotales,
    tiempoPromedio: Math.round(tiempoPromedio),
    porTipo,
    porcentajeActivos
  };
};
export const obtenerContenidosPorVideo = async (idVideo) => {
  if (!idVideo) throw new Error("ID de video es requerido");

  try {
    const response = await axios.get(`${API_URL}/video/${idVideo}`);
    const respuesta = response.data;

    if (Array.isArray(respuesta)) {
      return respuesta;
    } else if (respuesta && Array.isArray(respuesta.data)) {
      return respuesta.data;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error en obtenerContenidosPorVideo:", error);
    throw error;
  }
};
const manejarRespuesta = (response) => {
  if (response.data.success === false) {
    throw new Error(response.data.message || 'Error en la respuesta del servidor');
  }
  return response.data.data || response.data;
};

export const obtenerInteraccionesPorVideo = async (idVideo) => {
  try {
    if (!idVideo) {
      throw new Error('ID de video es requerido');
    }
    const response = await axios.get(`${API_URL}/video/${idVideo}`);
    return manejarRespuesta(response);
  } catch (error) {
    manejarErrorApi(error);
  }
};

export const crearInteraccion = async (datos) => {
  try {
    if (!datos) throw new Error("Datos de interacción son requeridos");

    const tipo_interaccion = datos.tipo_interaccion?.toLowerCase().trim();
    const { id_video, titulo, tiempo_activacion_segundos, opciones = [] } = datos;

    if (!id_video || !titulo || tiempo_activacion_segundos === undefined || !tipo_interaccion) {
      throw new Error(
        "Faltan campos obligatorios: id_video, titulo, tiempo_activacion_segundos, tipo_interaccion"
      );
    }

    switch (tipo_interaccion) {
      case "pregunta":
      case "cuestionario": {
        if (!Array.isArray(opciones) || opciones.length === 0) {
          throw new Error(`Para ${tipo_interaccion}, se requiere un array de 'opciones' con al menos una opción`);
        }

        const tieneCorrecta = opciones.some(op => op.es_correcta === true);
        if (tipo_interaccion === "cuestionario" && !tieneCorrecta) {
          throw new Error("El cuestionario debe tener al menos una opción correcta");
        }

        opciones.forEach((opcion, index) => {
          if (!opcion.texto_opcion || opcion.es_correcta === undefined) {
            throw new Error(`Opción ${index + 1} incompleta: se requieren texto_opcion y es_correcta`);
          }
        });
        break;
      }

      case "votacion": {
        if (!Array.isArray(opciones) || opciones.length === 0) {
          throw new Error(`Para votación, se requiere un array de 'opciones' con al menos una opción`);
        }

        opciones.forEach((opcion, index) => {
          if (!opcion.texto_opcion) {
            throw new Error(`Opción ${index + 1} incompleta: se requiere 'texto'`);
          }
        });

        datos.opciones = opciones.map((op, index) => ({
          texto: op.texto_opcion,
          explicacion: op.explicacion || '',
          orden: index + 1,
          es_correcta: true
        }));
        break;
      }
      case "calificacion":
        if (datos.puntos === undefined || isNaN(datos.puntos)) {
          throw new Error("Para calificación, se requiere un valor numérico en 'puntos'");
        }
        if (datos.puntos < 0) {
          throw new Error("La calificación no puede ser negativa");
        }
        break;
      case "encuesta": {
        if (!Array.isArray(opciones) || opciones.length === 0) {
          throw new Error(`Para ${tipo_interaccion}, se requiere un array de 'opciones' con al menos una opción`);
        }

        opciones.forEach((opcion, index) => {
          if (!opcion.texto_opcion) {
            throw new Error(`Opción ${index + 1} incompleta: se requiere texto_opcion`);
          }
        });

        datos.opciones = opciones.map(op => ({
          ...op,
          es_correcta: op.es_correcta ?? false
        }));
        break;
      }
      case "completar_espacios": {
        if (!Array.isArray(opciones) || opciones.length === 0) {
          throw new Error(
            "Para completar espacios, se requiere un array de 'opciones' con las palabras a completar"
          );
        }

        opciones.forEach((opcion, index) => {
          if (!opcion.texto_opcion && !opcion.respuesta) {
            throw new Error(
              `Opción ${index + 1} incompleta: se requiere texto_opcion o respuesta`
            );
          }
          if (opcion.posicion === undefined) {
            throw new Error(`Opción ${index + 1} sin 'posicion'`);
          }
        });

        datos.opciones = opciones.map((op, index) => ({
          id: op.id ?? index + 1,
          texto_opcion: op.texto_opcion ?? op.respuesta,
          posicion: op.posicion ?? index,
          es_correcta: op.es_correcta ?? false
        }));

        break;
      }
      case "arrastrar_soltar": {
          if (!Array.isArray(opciones) || opciones.length === 0) {
          throw new Error(
            "Para completar espacios, se requiere un array de 'opciones' con las palabras a completar"
          );
        }

        opciones.forEach((opcion, index) => {
          if (!opcion.texto_opcion && !opcion.respuesta) {
            throw new Error(
              `Opción ${index + 1} incompleta: se requiere texto_opcion o respuesta`
            );
          }
          if (opcion.posicion === undefined) {
            throw new Error(`Opción ${index + 1} sin 'posicion'`);
          }
        });

        datos.opciones = opciones.map((op, index) => ({
          id: op.id ?? index + 1,
          texto_opcion: op.texto_opcion ?? op.respuesta,
          posicion: op.posicion ?? index,
          es_correcta: op.es_correcta ?? false
        }));

        break;
      }


      case "entrada_texto":
        if (!datos.descripcion) {
          throw new Error("Para información, se requiere el campo 'descripcion'");
        }
        break;

      case "navegacion":
        if (!datos.url_destino || !datos.texto_enlace) {
          throw new Error("Para navegación, se requieren: url_destino y texto_enlace");
        }
        break;

      default:
        throw new Error(
          `Tipo de interacción no válido: "${tipo_interaccion}". Tipos válidos: pregunta, encuesta, cuestionario, informacion, navegacion, votacion, completar_espacios`
        );
    }

    const payload = {
      ...datos,
      tipo_interaccion,
      opciones: datos.opciones ?? []
    };

   /*  console.log("=== ENVIANDO PETICIÓN ===");
    console.log("URL completa:", `${API_URL}`);
    console.log("Datos a enviar:", JSON.stringify(payload, null, 2));
 */
    const response = await axios.post(`${API_URL}`, payload);

    return manejarRespuesta(response);
  } catch (error) {
    console.error("Error en crearInteraccion:", error.message);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    }
    manejarErrorApi(error);
  }
};


export const procesarRespuesta = async (datos) => {
  try {
    if (!datos) {
      throw new Error('Datos de respuesta son requeridos');
    }

    const { id_usuario, id_contenido_interactivo, datos_respuesta } = datos;
    if (!id_usuario || !id_contenido_interactivo || !datos_respuesta) {
      throw new Error('Faltan campos obligatorios: id_usuario, id_contenido_interactivo, datos_respuesta');
    }


    const response = await axios.post(`${API_URL}/responder`, datos, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });


    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;

  } catch (error) {
    console.error("❌ Error en procesarRespuesta:", error);

    if (error.response) {
      console.error("❌ Error response status:", error.response.status);
      console.error("❌ Error response data:", error.response.data);
    } else if (error.request) {
      console.error("❌ Error request:", error.request);
    } else {
      console.error("❌ Error message:", error.message);
    }

    const errorManejado = manejarErrorApi(error);
    console.error("❌ Error manejado:", errorManejado);

    throw errorManejado;
  }
};


export const obtenerProgresoUsuario = async (idUsuario, idVideo) => {
  try {
    if (!idUsuario || !idVideo) {
      throw new Error('ID de usuario e ID de video son requeridos');
    }
    const response = await axios.get(`${API_URL}/progreso/${idUsuario}/${idVideo}`);
    return manejarRespuesta(response);
  } catch (error) {
    manejarErrorApi(error);
  }
};

export const verificarProgreso = async (idUsuario, idVideo, tiempoActual) => {
  try {
    if (!idUsuario || !idVideo || tiempoActual === undefined) {
      throw new Error('ID de usuario, ID de video y tiempo actual son requeridos');
    }

    const response = await axios.get(`${API_URL}/verificar-progreso`, {
      params: {
        id_usuario: idUsuario,
        id_video: idVideo,
        tiempo_actual: tiempoActual
      }
    });

    return manejarRespuesta(response);
  } catch (error) {
    const errorManejado = manejarErrorApi(error);
    throw errorManejado;
  }
};

export const obtenerEstadisticasInteraccion = async (idInteraccion) => {
  try {
    if (!idInteraccion) {
      throw new Error('ID de interacción es requerido');
    }
    const response = await axios.get(`${API_URL}/estadisticas/${idInteraccion}`);
    return manejarRespuesta(response);
  } catch (error) {
    manejarErrorApi(error);
  }
};

export const obtenerInteraccionPorId = async (id) => {
  try {
    if (!id) {
      throw new Error('ID de interacción es requerido');
    }
    const response = await axios.get(`${API_URL}/${id}`);
    return manejarRespuesta(response);
  } catch (error) {
    manejarErrorApi(error);
  }
};

export const actualizarInteraccion = async (id, datos) => {
  try {
    if (!id) {
      throw new Error('ID de interacción es requerido');
    }
    if (!datos || Object.keys(datos).length === 0) {
      throw new Error('Datos a actualizar son requeridos');
    }
    const response = await axios.put(`${API_URL}/${id}`, datos);
    return manejarRespuesta(response);
  } catch (error) {
    manejarErrorApi(error);
  }
};

export const eliminarInteraccion = async (id) => {
  try {
    if (!id) {
      throw new Error('ID de interacción es requerido');
    }
    const response = await axios.delete(`${API_URL}/${id}`);
    return manejarRespuesta(response);
  } catch (error) {
    manejarErrorApi(error);
  }
};


export const reiniciarProgresoUsuario = async (idUsuario, idVideo) => {
  try {
    if (!idUsuario || !idVideo) {
      throw new Error('ID de usuario e ID de video son requeridos');
    }
    const response = await axios.post(`${API_URL}/reiniciar-progreso`, {
      id_usuario: idUsuario,
      id_video: idVideo
    });
    return manejarRespuesta(response);
  } catch (error) {
    manejarErrorApi(error);
  }
};

export const obtenerEstadisticasVideoInteracciones = async (idVideo) => {
  try {
    if (!idVideo) {
      throw new Error('ID de video es requerido');
    }
    const response = await axios.get(`${API_URL}/estadisticas-video/${idVideo}`);
    return manejarRespuesta(response);
  } catch (error) {
    manejarErrorApi(error);
  }
};

export const obtenerRankingVideo = async (idVideo, limite = 10) => {
  try {
    if (!idVideo) {
      throw new Error('ID de video es requerido');
    }
    const response = await axios.get(`${API_URL}/ranking/${idVideo}`, {
      params: { limite }
    });
    return manejarRespuesta(response);
  } catch (error) {
    manejarErrorApi(error);
  }
};

export const exportarDatosVideo = async (idVideo, formato = 'json') => {
  try {
    if (!idVideo) {
      throw new Error('ID de video es requerido');
    }
    const response = await axios.get(`${API_URL}/exportar/${idVideo}`, {
      params: { formato }
    });

    if (formato === 'csv') {
      return response.data;
    }
    return manejarRespuesta(response);
  } catch (error) {
    manejarErrorApi(error);
  }
};

export const clonarInteracciones = async (idVideoOrigen, idVideoDestino) => {
  try {
    if (!idVideoOrigen || !idVideoDestino) {
      throw new Error('ID de video origen e ID de video destino son requeridos');
    }
    const response = await axios.post(`${API_URL}/clonar`, {
      id_video_origen: idVideoOrigen,
      id_video_destino: idVideoDestino
    });
    return manejarRespuesta(response);
  } catch (error) {
    manejarErrorApi(error);
  }
};

export const obtenerRespuestasUsuarioInteraccion = async (idUsuario, idInteraccion) => {
  try {
    if (!idUsuario || !idInteraccion) {
      throw new Error('ID de usuario e ID de interacción son requeridos');
    }
    const response = await axios.get(`${API_URL}/respuestas/${idUsuario}/${idInteraccion}`);
    return manejarRespuesta(response);
  } catch (error) {
    manejarErrorApi(error);
  }
};


export const validarConfiguracionInteraccion = (tipoInteraccion, configuracion) => {
  const errores = [];

  if (!configuracion) {
    configuracion = {};
  }

  switch (tipoInteraccion) {
    case 'cuestionario':
      if (!configuracion.pregunta || configuracion.pregunta.trim() === '') {
        errores.push('La pregunta es requerida para cuestionarios');
      }
      if (!configuracion.opciones || !Array.isArray(configuracion.opciones) || configuracion.opciones.length < 2) {
        errores.push('Al menos 2 opciones son requeridas para cuestionarios');
      }
      if (configuracion.respuesta_correcta === undefined || configuracion.respuesta_correcta === null) {
        errores.push('Debe especificar la respuesta correcta');
      }
      break;

    case 'opcion_multiple':
      if (!configuracion.pregunta || configuracion.pregunta.trim() === '') {
        errores.push('La pregunta es requerida para opción múltiple');
      }
      break;

    case 'entrada_texto':
      if (configuracion.max_caracteres && configuracion.max_caracteres < 1) {
        errores.push('El máximo de caracteres debe ser mayor a 0');
      }
      break;

    case 'completar_espacios':
      if (!configuracion.oraciones || configuracion.oraciones.trim() === '') {
        errores.push('Las oraciones son requeridas para completar espacios');
      }
      break;

    case 'arrastrar_soltar':
      if (!configuracion.elementos || !Array.isArray(configuracion.elementos) || configuracion.elementos.length < 2) {
        errores.push('Al menos 2 elementos son requeridos para arrastrar y soltar');
      }
      break;

    case 'votacion':
      if (!configuracion.opciones || !Array.isArray(configuracion.opciones) || configuracion.opciones.length < 2) {
        errores.push('Al menos 2 opciones son requeridas para votaciones');
      }
      if (!configuracion.pregunta || configuracion.pregunta.trim() === '') {
        errores.push('La pregunta es requerida para votaciones');
      }
      break;

    case 'encuesta':
      if (!configuracion.pregunta || configuracion.pregunta.trim() === '') {
        errores.push('La pregunta es requerida para encuestas');
      }
      break;

    case 'calificacion':
      if (!configuracion.pregunta || configuracion.pregunta.trim() === '') {
        errores.push('La pregunta es requerida para calificaciones');
      }
      break;

    case 'puntos_interaccion':
      if (!configuracion.instrucciones || configuracion.instrucciones.trim() === '') {
        errores.push('Las instrucciones son requeridas para puntos de interacción');
      }
      break;
  }

  return errores;
};

export const formatearTiempo = (segundos) => {
  if (isNaN(segundos) || segundos < 0) {
    return '00:00';
  }
  const minutos = Math.floor(segundos / 60);
  const segs = Math.floor(segundos % 60);
  return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
};

export const calcularPuntuacionTotal = (respuestas) => {
  if (!Array.isArray(respuestas)) {
    return 0;
  }
  return respuestas.reduce((total, respuesta) => {
    return total + (respuesta.puntos_obtenidos || 0);
  }, 0);
};

export const calcularPorcentajeAciertos = (respuestas) => {
  if (!Array.isArray(respuestas) || respuestas.length === 0) {
    return 0;
  }
  const correctas = respuestas.filter(r => r.es_correcta).length;
  return Math.round((correctas / respuestas.length) * 100);
};

export const obtenerResumenProgreso = (progreso) => {
  if (!progreso || !Array.isArray(progreso.progreso)) {
    return {
      total: 0,
      completadas: 0,
      correctas: 0,
      puntos: 0,
      porcentajeCompletado: 0,
      porcentajeAciertos: 0
    };
  }

  const { progreso: items, estadisticas } = progreso;

  return {
    total: estadisticas?.total_interacciones || items.length,
    completadas: estadisticas?.completadas || items.filter(i => i.completada).length,
    correctas: estadisticas?.correctas || items.filter(i => i.es_correcta).length,
    puntos: estadisticas?.puntos_totales || calcularPuntuacionTotal(items),
    porcentajeCompletado: items.length > 0 ? Math.round((items.filter(i => i.completada).length / items.length) * 100) : 0,
    porcentajeAciertos: calcularPorcentajeAciertos(items)
  };
};

export const validarRespuestaSegunTipo = (tipoInteraccion, respuesta) => {
  if (!respuesta) return false;

  switch (tipoInteraccion) {
    case 'cuestionario':
    case 'opcion_multiple':
      return respuesta.opcion !== undefined ||
        (Array.isArray(respuesta.opciones_seleccionadas) && respuesta.opciones_seleccionadas.length > 0);

    case 'entrada_texto':
      return respuesta.texto && respuesta.texto.trim().length > 0;

    case 'encuesta':
      return respuesta.rating !== undefined ||
        (respuesta.opinion && respuesta.opinion.trim().length > 0);

    case 'calificacion':
      return respuesta.estrellas !== undefined && respuesta.estrellas >= 1;

    case 'completar_espacios':
      return respuesta.respuestas && Object.keys(respuesta.respuestas).length > 0;

    case 'arrastrar_soltar':
      return respuesta.posiciones && Object.keys(respuesta.posiciones).length > 0;

    case 'puntos_interaccion':
      return Array.isArray(respuesta.puntos_clickeados) && respuesta.puntos_clickeados.length > 0;

    case 'votacion':
      return respuesta.opcion_seleccionada !== undefined;

    default:
      return respuesta.completed === true;
  }
};

export const prepararDatosRespuesta = (tipoInteraccion, respuestaUsuario) => {
  const datos = { ...respuestaUsuario };

  switch (tipoInteraccion) {
    case 'cuestionario':
      if (datos.opcion !== undefined && !datos.opciones_seleccionadas) {
        datos.opciones_seleccionadas = [datos.opcion];
      }
      break;

    case 'entrada_texto':
      if (datos.texto) {
        datos.texto = datos.texto.trim();
      }
      break;

    case 'completar_espacios':
      if (datos.respuestas) {
        Object.keys(datos.respuestas).forEach(key => {
          if (!datos.respuestas[key] || datos.respuestas[key].trim() === '') {
            delete datos.respuestas[key];
          } else {
            datos.respuestas[key] = datos.respuestas[key].trim();
          }
        });
      }
      break;
  }

  return datos;
};

export const obtenerEstiloTipoInteraccion = (nombreTipo) => {
  const estilos = {
    cuestionario: { color: "#3B82F6", bgColor: "#EBF5FF" },
    opcion_multiple: { color: "#3B82F6", bgColor: "#EBF5FF" },
    encuesta: { color: "#10B981", bgColor: "#ECFDF5" },
    completar_espacios: { color: "#8B5CF6", bgColor: "#F3E8FF" },
    arrastrar_soltar: { color: "#F59E0B", bgColor: "#FFFBEB" },
    puntos_interaccion: { color: "#EF4444", bgColor: "#FEF2F2" },
    entrada_texto: { color: "#06B6D4", bgColor: "#ECFEFF" },
    calificacion: { color: "#F97316", bgColor: "#FFF7ED" },
    votacion: { color: "#84CC16", bgColor: "#F7FEE7" }
  };

  return estilos[nombreTipo] || { color: "#6B7280", bgColor: "#F9FAFB" };
};

export const descargarCSV = async (idVideo, nombreArchivo = null) => {
  try {
    const response = await axios.get(`${API_URL}/exportar/${idVideo}`, {
      params: { formato: 'csv' },
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo || `interacciones_video_${idVideo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    manejarErrorApi(error);
  }
};

export const procesarRespuestaConValidacion = async (datosRespuesta) => {
  try {
    if (!datosRespuesta.id_usuario || !datosRespuesta.id_contenido_interactivo) {
      throw new Error('Datos de usuario e interacción son requeridos');
    }

    if (!datosRespuesta.datos_respuesta) {
      throw new Error('Datos de respuesta son requeridos');
    }

    if (!datosRespuesta.tiempo_respuesta_segundos) {
      datosRespuesta.tiempo_respuesta_segundos = 0;
    }

    return await procesarRespuesta(datosRespuesta);
  } catch (error) {
    manejarErrorApi(error);
  }
};

export const verificarConectividad = async () => {
  try {
    const response = await axios.get(`${API_URL.replace('/interacciones', '')}/health`, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

export default {
  obtenerInteraccionesPorVideo,
  crearInteraccion,
  procesarRespuesta,
  obtenerProgresoUsuario,
  verificarProgreso,
  obtenerEstadisticasInteraccion,
  obtenerInteraccionPorId,
  actualizarInteraccion,
  eliminarInteraccion,

  reiniciarProgresoUsuario,
  obtenerEstadisticasVideoInteracciones,
  obtenerRankingVideo,
  exportarDatosVideo,
  clonarInteracciones,
  obtenerRespuestasUsuarioInteraccion,

  validarConfiguracionInteraccion,
  formatearTiempo,
  calcularPuntuacionTotal,
  calcularPorcentajeAciertos,
  obtenerResumenProgreso,
  validarRespuestaSegunTipo,
  prepararDatosRespuesta,
  obtenerEstiloTipoInteraccion,
  descargarCSV,
  procesarRespuestaConValidacion,
  verificarConectividad,
  manejarErrorApi
};