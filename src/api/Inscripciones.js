import axios from 'axios';


const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const API_URL = `${backendUrl}/api/inscripciones`;


export const obtenerCursosInscritosConDetalles = async () => {
  try {
    const usuario = JSON.parse(localStorage.getItem('userData'));

    if (!usuario?.id) {
      throw new Error('No hay usuario logueado');
    }

    const response = await axios.get(`${API_URL}/usuario/${usuario.id}/cursos`);
    return response.data;
  } catch (error) {
    console.error(
      'Error al obtener cursos inscritos con detalles:',
      error.response?.data || error.message
    );
    throw error;
  }
};


export const inscribirUsuario = async (cursoId) => {
  try {
    const usuario = JSON.parse(localStorage.getItem('userData'));

    if (!usuario) {
      throw new Error('No hay usuario logueado');
    }

    const datos = {
      id_usuario: Number(usuario.id),
      id_curso: Number(cursoId),
    };

    console.log("📌 Datos que se enviarán al backend:", datos);

    const response = await axios.post(API_URL, datos);
    return response.data;
  } catch (error) {
    console.error('Error al inscribir usuario:', error.response?.data || error.message);
    throw error;
  }
};

export const obtenerInscripcionesUsuario = async () => {
  try {
    const usuario = JSON.parse(localStorage.getItem('userData'));

    if (!usuario) {
      throw new Error('No hay usuario logueado');
    }

    const response = await axios.get(`${API_URL}/usuario/${usuario.id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener inscripciones:', error.response?.data || error.message);
    throw error;
  }
};

export const obtenerInscripciones = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const obtenerInscripcionPorId = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const obtenerInscripcionesPorUsuario = async (id_usuario) => {
  const response = await axios.get(`${API_URL}/usuario/${id_usuario}`);
  return response.data;
};

export const crearInscripcion = async (datos) => {
  const response = await axios.post(API_URL, datos);
  return response.data;
};

export const actualizarInscripcion = async (id, datos) => {
  const response = await axios.put(`${API_URL}/${id}`, datos);
  return response.data;
};

export const eliminarInscripcion = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
