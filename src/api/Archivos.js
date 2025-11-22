import axios from 'axios';
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export const obtenerArchivos = async () => {
  const response = await axios.get(`${backendUrl}/api/archivos`);
  return response.data;
};
export const obtenerArchivoPorId = async (id) => {
  const response = await axios.get(`${backendUrl}/api/archivos/${id}`);
  return response.data;
};
export const obtenerArchivosPorModulo = async (id_modulo) => {
  const response = await axios.get(`${backendUrl}/api/archivos/modulo/${id_modulo}`);
  return response.data;
};
export const crearArchivo = async (formData) => {
  return axios.post(`${backendUrl}/api/archivos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data);
};
export const actualizarArchivo = async (id, formDataOrObject) => {
  // si es FormData (subes archivo) -> mantén multipart
  if (formDataOrObject instanceof FormData) {
    return axios.put(`${backendUrl}/api/archivos/${id}`, formDataOrObject, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data);
  }
  // si es objeto simple -> enviar JSON
  return axios.put(`${backendUrl}/api/archivos/${id}`, formDataOrObject).then(r => r.data);
};
export const eliminarArchivo = async (id) => {
  const response = await axios.delete(`${backendUrl}/api/archivos/${id}`);
  return response.data;
};
