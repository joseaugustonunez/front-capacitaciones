import axios from 'axios';

const API_URL = '/api/categorias';

export const obtenerCategorias = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};
export const obtenerCategoriaPorId = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};
export const crearCategoria = async (datos) => {
  const response = await axios.post(API_URL, datos);
  return response.data;
};
export const actualizarCategoria = async (id, datos) => {
  const response = await axios.put(`${API_URL}/${id}`, datos);
  return response.data;
};
export const eliminarCategoria = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
