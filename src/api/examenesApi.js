import axios from 'axios';

const API_URL = '/api/examenes';

// === EXÁMENES ===
export const obtenerExamenes = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const obtenerExamenPorId = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const crearExamen = async (datos) => {
  const response = await axios.post(API_URL, datos);
  return response.data;
};

export const actualizarExamen = async (id, datos) => {
  const response = await axios.put(`${API_URL}/${id}`, datos);
  return response.data;
};

export const eliminarExamen = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

// === PREGUNTAS ===
export const obtenerPreguntasPorExamen = async (id_examen) => {
  const response = await axios.get(`${API_URL}/preguntas/examen/${id_examen}`);
  return response.data;
};

export const crearPregunta = async (datos) => {
  const response = await axios.post(`${API_URL}/preguntas`, datos);
  return response.data;
};

// === OPCIONES ===
export const obtenerOpcionesPorPregunta = async (id_pregunta) => {
  const response = await axios.get(`${API_URL}/opciones/pregunta/${id_pregunta}`);
  return response.data;
};

export const crearOpcion = async (datos) => {
  const response = await axios.post(`${API_URL}/opciones`, datos);
  return response.data;
};

export const actualizarOpcion = async (id, datos) => {
  const response = await axios.put(`${API_URL}/opciones/${id}`, datos);
  return response.data;
};

export const eliminarOpcion = async (id) => {
  const response = await axios.delete(`${API_URL}/opciones/${id}`);
  return response.data;
};

// === RESPUESTAS ===
export const registrarRespuestas = async (datos) => {
  const response = await axios.post(`${API_URL}/respuestas`, datos);
  return response.data;
};

export const obtenerRespuestasPorUsuarioYExamen = async (id_usuario, id_examen) => {
  const response = await axios.get(`${API_URL}/respuestas/${id_usuario}/${id_examen}`);
  return response.data;
};

// === INTENTOS ===
export const registrarIntento = async (datos) => {
  const response = await axios.post(`${API_URL}/intentos`, datos);
  return response.data;
};

export const obtenerIntentosPorUsuarioYExamen = async (id_usuario, id_examen) => {
  const response = await axios.get(`${API_URL}/intentos/${id_usuario}/${id_examen}`);
  return response.data;
};
