import axios from "axios";

const API_URL = "/api/progresos";

const getUsuario = () => {
  const userStr = localStorage.getItem('userData');
  if (!userStr) throw new Error("Usuario no autenticado (localStorage vacío)");
  
  const user = JSON.parse(userStr);
  if (!user?.id) throw new Error("Usuario no autenticado (sin id)");
  
  return user;
};

export const obtenerProgresos = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const obtenerProgresoPorId = async (id) => {
  if (!id) throw new Error("Se requiere un ID de progreso");
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const obtenerProgresoVideo = async (idVideo) => {
  try {
    const usuario = getUsuario();
    if (!idVideo) throw new Error("Se requiere el ID del video");
    
    const response = await axios.get(`${API_URL}/usuario/${usuario.id}/video/${idVideo}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener progreso del video:", error);
    return { success: false, data: null };
  }
};

export const obtenerProgresosUsuario = async () => {
  try {
    const usuario = getUsuario();
    const response = await axios.get(`${API_URL}/usuario/${usuario.id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener progresos del usuario:", error);
    return { success: false, data: [] };
  }
};

export const crearProgreso = async (datos) => {
  try {
    const usuario = getUsuario();
    
    if (!datos?.id_video) throw new Error("Se requiere el ID del video");
    
    const payload = {
      id_usuario: usuario.id,
      id_video: datos.id_video,
      segundos_vistos: datos.segundos_vistos || 0,
      completado: datos.completado ? 1 : 0,
      ultima_visualizacion: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
    
    const response = await axios.post(API_URL, payload);
    return response.data;
  } catch (error) {
    console.error("Error al crear progreso:", error);
    throw error;
  }
};

export const actualizarProgreso = async (id, datos) => {
  try {
    if (!id) throw new Error("Se requiere un ID de progreso para actualizar");
    
    const usuario = getUsuario();
    
    if (!datos?.id_video) throw new Error("Se requiere el ID del video");
    
    const payload = {
      id_usuario: usuario.id,
      id_video: datos.id_video,
      segundos_vistos: datos.segundos_vistos || 0,
      completado: datos.completado ? 1 : 0,
      ultima_visualizacion: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
    
    const response = await axios.put(`${API_URL}/${id}`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar progreso:", error);
    throw error;
  }
};

export const eliminarProgreso = async (id) => {
  if (!id) throw new Error("Se requiere un ID de progreso para eliminar");
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};