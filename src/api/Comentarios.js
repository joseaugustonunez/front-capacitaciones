import axios from 'axios';

const API_URL = '/api/comentarios';

export const crearComentario = async (datos) => {
  const response = await axios.post(API_URL, datos);
  return response.data;
};

export const obtenerComentariosPorVideo = async (id_video) => {
  const response = await axios.get(`${API_URL}/${id_video}`);
  return response.data;
};

export const actualizarComentario = async (id, datos) => {
  const response = await axios.put(`${API_URL}/${id}`, datos);
  return response.data;
};

export const eliminarComentario = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
