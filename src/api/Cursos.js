
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const API_URL = `${backendUrl}/api/cursos`;

export const obtenerVideosPorCurso = async (idCurso) => {
  const res = await axios.get(`${API_URL}/${idCurso}/videos`);
  return res.data;
};
const manejarRespuesta = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

const realizarPeticion = async (url, options = {}) => {
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  try {
    const response = await fetch(
      `${API_URL}${url}`,
      { ...options, headers }
    );
    return await manejarRespuesta(response);
  } catch (error) {
    console.error(`Error en petición a ${url}:`, error);
    throw error;
  }
};
export const obtenerAvanceCursos = async (idUsuario) => {
  const response = await fetch(`${API_URL}/usuarios/${idUsuario}/cursos/avance`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
};
export const obtenerCursosPublicados = async (filtros = {}) => {
  try {
    const params = new URLSearchParams();
    
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '' && value !== 'todos') {
        params.append(key, value);
      }
    });
    
    const queryString = params.toString();
    const url = queryString ? `/publicados?${queryString}` : '/publicados';
    
    
    return realizarPeticion(url);
  } catch (error) {
    console.error('Error en obtenerCursosPublicados:', error);
    throw error;
  }
};

export const obtenerCursos = async (filtros = {}) => {
  const params = new URLSearchParams();
  
  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, value);
    }
  });

  const queryString = params.toString();
  const url = queryString ? `/?${queryString}` : '/';
  
  return realizarPeticion(url);
};
export const obtenerCursoConModulos = async (id) => {
  if (!id) throw new Error("ID de curso es requerido");
  return realizarPeticion(`/${id}/modulos`);
};
export const obtenerCurso = async (id) => {
  if (!id) throw new Error('ID de curso es requerido');
  return realizarPeticion(`/${id}`);
};

export const crearCurso = async (curso) => {
  if (!curso) throw new Error('Datos del curso son requeridos');

  const esFormData = curso instanceof FormData;

  return realizarPeticion('/', {
    method: 'POST',
    body: esFormData ? curso : JSON.stringify(curso),
  });
};

export async function actualizarCurso(id, datos, esMultipart = false) {
  return realizarPeticion(`/${id}`, {
    method: 'PUT',
    body: datos,
    headers: esMultipart ? {} : { 'Content-Type': 'application/json' },
  });
}

export const eliminarCurso = async (id) => {
  if (!id) throw new Error('ID de curso es requerido');
  return realizarPeticion(`/${id}`, {
    method: 'DELETE',
  });
};

export const cambiarEstadoCurso = async (id, estado) => {
  if (!id) throw new Error('ID de curso es requerido');
  if (!estado) throw new Error('Estado es requerido');
  
  const estadosValidos = ['borrador', 'publicado', 'archivado'];
  if (!estadosValidos.includes(estado)) {
    throw new Error(`Estado inválido. Opciones válidas: ${estadosValidos.join(', ')}`);
  }
  
  return realizarPeticion(`/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
};

export const obtenerCursosPorInstructor = async (idInstructor) => {
  if (!idInstructor) throw new Error('ID de instructor es requerido');
  return realizarPeticion(`/instructor/${idInstructor}`);
};

export const obtenerCursosPorCategoria = async (idCategoria) => {
  if (!idCategoria) throw new Error('ID de categoría es requerido');
  return realizarPeticion(`/categoria/${idCategoria}`);
};

export const obtenerEstadisticasCursos = async () => {
  return realizarPeticion('/admin/estadisticas');
};

export const validarDatosCurso = (curso) => {
  const errores = [];
  
  if (!curso.titulo || !curso.titulo.trim()) {
    errores.push('El título es obligatorio');
  }
  
  if (!curso.id_instructor || isNaN(parseInt(curso.id_instructor))) {
    errores.push('ID de instructor válido es obligatorio');
  }
  
  if (!curso.id_categoria || isNaN(parseInt(curso.id_categoria))) {
    errores.push('ID de categoría válido es obligatorio');
  }
  
  const nivelesValidos = ['principiante', 'intermedio', 'avanzado'];
  if (curso.nivel_dificultad && !nivelesValidos.includes(curso.nivel_dificultad)) {
    errores.push(`Nivel de dificultad inválido. Opciones válidas: ${nivelesValidos.join(', ')}`);
  }
  
  const estadosValidos = ['borrador', 'publicado', 'archivado'];
  if (curso.estado && !estadosValidos.includes(curso.estado)) {
    errores.push(`Estado inválido. Opciones válidas: ${estadosValidos.join(', ')}`);
  }
  
  if (curso.duracion_horas && (isNaN(parseInt(curso.duracion_horas)) || parseInt(curso.duracion_horas) < 0)) {
    errores.push('La duración en horas debe ser un número positivo');
  }
  
  if (curso.url_miniatura && curso.url_miniatura.length > 500) {
    errores.push('La URL de la miniatura es demasiado larga (máximo 500 caracteres)');
  }
  
  if (curso.titulo && curso.titulo.length > 200) {
    errores.push('El título es demasiado largo (máximo 200 caracteres)');
  }
  
  if (curso.descripcion_corta && curso.descripcion_corta.length > 500) {
    errores.push('La descripción corta es demasiado larga (máximo 500 caracteres)');
  }
  
  return errores;
};

export const NIVELES_DIFICULTAD = [
  { value: 'principiante', label: 'Principiante', color: '#10B981' },
  { value: 'intermedio', label: 'Intermedio', color: '#F59E0B' },
  { value: 'avanzado', label: 'Avanzado', color: '#EF4444' }
];

export const ESTADOS_CURSO = [
  { value: 'borrador', label: 'Borrador', color: '#6B7280' },
  { value: 'publicado', label: 'Publicado', color: '#10B981' },
  { value: 'archivado', label: 'Archivado', color: '#EF4444' }
];

export const obtenerColorNivel = (nivel) => {
  const nivelObj = NIVELES_DIFICULTAD.find(n => n.value === nivel);
  return nivelObj ? nivelObj.color : '#6B7280';
};

export const obtenerColorEstado = (estado) => {
  const estadoObj = ESTADOS_CURSO.find(e => e.value === estado);
  return estadoObj ? estadoObj.color : '#6B7280';
};

export const formatearDuracion = (horas) => {
  if (!horas || horas === 0) return 'Sin especificar';
  if (horas === 1) return '1 hora';
  if (horas < 10) return `${horas} horas`;
  return `${horas}h`;
};

export const formatearFecha = (fecha) => {
  if (!fecha) return 'Sin fecha';
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};