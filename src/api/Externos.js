import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
const API_URL = `${backendUrl}/api/videos-externos`;

// Obtener todos los videos externos
export const obtenerVideosExternos = async () => {
  const { data } = await axios.get(API_URL);
  return Array.isArray(data) ? data : (data?.data || []);
};

// Obtener un video por UUID
export const obtenerVideoExternoPorUUID = async (uuid) => {
  const { data } = await axios.get(`${API_URL}/${uuid}`);
  return data;
};
