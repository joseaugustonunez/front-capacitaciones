import axios from 'axios';
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const API_URL = `${backendUrl}/api/estadisticas`;

// Totales generales (sin filtros)
export const obtenerTotales = async () => {
  const response = await axios.get(`${API_URL}/totales`);
  return response.data;
};

// Inscritos por curso (con filtros opcionales)
export const totalInscritos = async (filtros = {}) => {
  const response = await axios.get(`${API_URL}/inscritos`, { params: filtros });
  return response.data;
};

// Matrículas y certificados por mes
export const matriculasCertificadosPorMes = async (filtros = {}) => {
  const response = await axios.get(`${API_URL}/matriculas-certificados`, { params: filtros });
  return response.data; 
};

// Progreso de usuarios (puede filtrar DNI, nombre, curso, estado, mes)
export const obtenerProgresoUsuario = async (filtros = {}) => {
  const response = await axios.get(`${API_URL}/progreso-usuarios`, { params: filtros });
  return response.data;
};

// Resumen del proceso por curso (curso / estado / mes)
export const obtenerProcesoCurso = async (filtros = {}) => {
  const response = await axios.get(`${API_URL}/proceso-curso`, { params: filtros });
  return response.data;
};
