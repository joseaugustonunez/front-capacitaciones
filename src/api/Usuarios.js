import axios from 'axios';
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const API_URL = `${backendUrl}/api/usuarios`;

export const registrarUsuario = async (datos) => {
  const response = await axios.post(`${API_URL}/registro`, datos);
  return response.data;
};

export const loginUsuario = async (datos) => {
  
  const response = await axios.post(`${API_URL}/login`, datos);
  return response.data;
};
export const obtenerInstructores = async () => {
  const response = await axios.get(`${API_URL}/instructores`);
  return response.data;
};
export const cambiarContrasena = async (id, data) => {
  const response = await axios.put(`${API_URL}/${id}/contrasena`, data);
  return response.data;
};


export const resetearContrasena = async (datosReset) => {
  const response = await axios.post(`${API_URL}/resetear-contrasena`, datosReset);
  return response.data;
};
export const subirAvatar = async (id, archivo) => {
  const formData = new FormData();
  formData.append('avatar', archivo); 

  const response = await axios.put(
    `${API_URL}/avatar/${id}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );

  return response.data;
};
export const obtenerEstadisticas = (id) => {
  return axios.get(`${API_URL}/${id}/estadisticas`);
};
export const solicitarResetContrasena = async (correo) => {
  const response = await axios.post(`${API_URL}/solicitar-reset`, { correo });
  return response.data;
};

export const resetearContrasenaConToken = async (token, nuevaContrasena) => {
  const response = await axios.post(`${API_URL}/resetear-con-token`, { token, nuevaContrasena });
  return response.data;
};