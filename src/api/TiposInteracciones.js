import axios from 'axios';

const API_URL = '/api/tipos-interaccion';

export const obtenerTiposInteraccion = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const obtenerTipoInteraccionPorId = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const crearTipoInteraccion = async (datos) => {
  const response = await axios.post(API_URL, datos);
  return response.data;
};

export const actualizarTipoInteraccion = async (id, datos) => {
  const response = await axios.put(`${API_URL}/${id}`, datos);
  return response.data;
};

export const eliminarTipoInteraccion = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
