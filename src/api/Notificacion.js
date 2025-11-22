import axios from 'axios';

const API_URL = '/api/notificaciones';

export const crearNotificacion = async (datos) => {
  const response = await axios.post(API_URL, datos);
  return response.data;
};

export const obtenerNotificacionesPorUsuario = async (id_usuario) => {
  try {
    const response = await axios.get(`${API_URL}/usuario/${id_usuario}`);
    return response.data; 
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    return {
      mensaje: "Error al cargar notificaciones",
      data: null
    };
  }
};
export const obtenerNotificacionPorId = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const marcarNotificacionComoLeida = async (id) => {
  const response = await axios.put(`${API_URL}/leer/${id}`);
  return response.data;
};

export const marcarTodasComoLeidas = async (id_usuario) => {
  const response = await axios.put(`${API_URL}/leer-todas/${id_usuario}`);
  return response.data;
};

export const eliminarNotificacion = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
