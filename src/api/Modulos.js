
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const API_URL = `${backendUrl}/api/modulos`;

const manejarRespuesta = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
  }
  return response.json();
};
export const obtenerVideosPorModulo = async (id) => {
  if (!id) throw new Error("El ID del módulo es requerido");

  try {
    const response = await fetch(`${API_URL}/${id}/videos`);
    if (!response.ok) {
      if (response.status === 404) {
        return { success: true, data: [] };
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    if (!(error.message && error.message.includes("404"))) {
      console.error("❌ Error en obtenerVideosPorModulo:", error);
    }
    return { success: true, data: [] };
  }
};
const realizarPeticion = async (url, options = {}) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_URL}${url}`, config);
    return await manejarRespuesta(response);
  } catch (error) {
    console.error(`Error en petición a ${url}:`, error);
    throw error;
  }
};
export const obtenerAvancePorUsuario = async (idUsuario) => {
  const respuesta = await realizarPeticion(`/usuarios/${idUsuario}/avance-cursos`);

  if (Array.isArray(respuesta)) {
    return respuesta;
  } else if (respuesta && Array.isArray(respuesta.data)) {
    return respuesta.data;
  } else {
    return [];
  }
};
export const obtenerModulos = async (filtros = {}) => {
  const params = new URLSearchParams();

  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, value);
    }
  });

  const queryString = params.toString();
  const url = queryString ? `/?${queryString}` : '/';

  const respuesta = await realizarPeticion(url);

  if (Array.isArray(respuesta)) {
    return respuesta;
  } else if (respuesta && Array.isArray(respuesta.modulos)) {
    return respuesta.modulos;
  } else if (respuesta && Array.isArray(respuesta.data)) {
    return respuesta.data;
  } else {
    return [];
  }
};

export const obtenerModulo = async (id) => {
  if (!id) throw new Error('ID de módulo es requerido');
  return realizarPeticion(`/${id}`);
};

export const crearModulo = async (modulo) => {
  if (!modulo) throw new Error('Datos del módulo son requeridos');
  
  return realizarPeticion('/', {
    method: 'POST',
    body: JSON.stringify(modulo),
  });
};

export const actualizarModulo = async (id, datos) => {
  if (!id) throw new Error('ID de módulo es requerido');
  
  return realizarPeticion(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
};

export const eliminarModulo = async (id) => {
  if (!id) throw new Error('ID de módulo es requerido');
  return realizarPeticion(`/${id}`, {
    method: 'DELETE',
  });
};

export const eliminarModuloFisico = async (id) => {
  if (!id) throw new Error('ID de módulo es requerido');
  return realizarPeticion(`/${id}/fisico`, {
    method: 'DELETE',
  });
};

export const obtenerModulosPorCurso = async (idCurso) => {
  if (!idCurso) throw new Error('ID de curso es requerido');
  return realizarPeticion(`/curso/${idCurso}`);
};

export const obtenerModulosActivos = async () => {
  return realizarPeticion('/activos');
};

export const obtenerModulosInactivos = async () => {
  return realizarPeticion('/inactivos');
};

export const cambiarEstadoModulo = async (id, esta_activo) => {
  if (!id) throw new Error('ID de módulo es requerido');
  if (esta_activo === undefined) throw new Error('Estado es requerido');
  
  return realizarPeticion(`/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ esta_activo }),
  });
};

export const reordenarModulos = async (modulos) => {
  if (!modulos || !Array.isArray(modulos)) {
    throw new Error('Array de módulos es requerido');
  }
  
  modulos.forEach((modulo, index) => {
    if (!modulo.id || modulo.orden === undefined) {
      throw new Error(`Módulo en posición ${index} debe tener id y orden`);
    }
  });
  
  return realizarPeticion('/reordenar', {
    method: 'PUT',
    body: JSON.stringify({ modulos }),
  });
};

export const duplicarModulo = async (id, nuevoTitulo = null) => {
  if (!id) throw new Error('ID de módulo es requerido');
  
  const body = nuevoTitulo ? { nuevo_titulo: nuevoTitulo } : {};
  
  return realizarPeticion(`/${id}/duplicar`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export const obtenerEstadisticasModulos = async (idCurso) => {
  if (!idCurso) throw new Error('ID de curso es requerido');
  return realizarPeticion(`/curso/${idCurso}/estadisticas`);
};

export const validarDatosModulo = (modulo) => {
  const errores = [];
  
  if (!modulo.titulo || !modulo.titulo.trim()) {
    errores.push('El título es obligatorio');
  }
  
  if (!modulo.id_curso || isNaN(parseInt(modulo.id_curso))) {
    errores.push('ID de curso válido es obligatorio');
  }
  
  if (modulo.indice_orden !== undefined && (isNaN(parseInt(modulo.indice_orden)) || parseInt(modulo.indice_orden) < 0)) {
    errores.push('El índice de orden debe ser un número positivo');
  }
  
  if (modulo.titulo && modulo.titulo.length > 200) {
    errores.push('El título es demasiado largo (máximo 200 caracteres)');
  }
  
  if (modulo.descripcion && modulo.descripcion.length > 65535) {
    errores.push('La descripción es demasiado larga');
  }
  
  return errores;
};

export const obtenerSiguienteOrden = async (idCurso) => {
  if (!idCurso) throw new Error('ID de curso es requerido');
  
  try {
    const modulos = await obtenerModulosPorCurso(idCurso);
    if (!modulos.modulos || modulos.modulos.length === 0) {
      return 1;
    }
    
    const maxOrden = Math.max(...modulos.modulos.map(m => m.indice_orden || 0));
    return maxOrden + 1;
  } catch (error) {
    console.warn('Error obteniendo siguiente orden, usando 1 por defecto:', error);
    return 1;
  }
};

export const moverModulo = async (idModulo, nuevaPosicion, modulosDelCurso) => {
  if (!idModulo || nuevaPosicion === undefined || !Array.isArray(modulosDelCurso)) {
    throw new Error('Parámetros requeridos: idModulo, nuevaPosicion, modulosDelCurso');
  }
  
  const modulosReordenados = [...modulosDelCurso];
  const moduloIndex = modulosReordenados.findIndex(m => m.id === idModulo);
  
  if (moduloIndex === -1) {
    throw new Error('Módulo no encontrado en la lista');
  }
  
  const [moduloMovido] = modulosReordenados.splice(moduloIndex, 1);
  
  modulosReordenados.splice(nuevaPosicion, 0, moduloMovido);
  
  const modulosParaReordenar = modulosReordenados.map((modulo, index) => ({
    id: modulo.id,
    orden: index + 1
  }));
  
  return reordenarModulos(modulosParaReordenar);
};

export const intercambiarModulos = async (idModulo1, idModulo2, modulosDelCurso) => {
  if (!idModulo1 || !idModulo2 || !Array.isArray(modulosDelCurso)) {
    throw new Error('Parámetros requeridos: idModulo1, idModulo2, modulosDelCurso');
  }
  
  const modulo1 = modulosDelCurso.find(m => m.id === idModulo1);
  const modulo2 = modulosDelCurso.find(m => m.id === idModulo2);
  
  if (!modulo1 || !modulo2) {
    throw new Error('Uno o ambos módulos no encontrados');
  }
  
  const modulosParaReordenar = [
    { id: idModulo1, orden: modulo2.indice_orden },
    { id: idModulo2, orden: modulo1.indice_orden }
  ];
  
  return reordenarModulos(modulosParaReordenar);
};

export const ESTADOS_MODULO = [
  { value: true, label: 'Activo', color: '#10B981', icon: '✅' },
  { value: false, label: 'Inactivo', color: '#EF4444', icon: '❌' }
];

export const ORDENAMIENTO_OPCIONES = [
  { value: 'indice_orden', label: 'Por orden', icon: '🔢' },
  { value: 'titulo', label: 'Por título', icon: '📝' },
  { value: 'fecha_creacion', label: 'Por fecha de creación', icon: '📅' },
  { value: 'fecha_actualizacion', label: 'Por última actualización', icon: '🔄' }
];

export const obtenerColorEstado = (esta_activo) => {
  const estadoObj = ESTADOS_MODULO.find(e => e.value === esta_activo);
  return estadoObj ? estadoObj.color : '#6B7280';
};

export const obtenerIconoEstado = (esta_activo) => {
  const estadoObj = ESTADOS_MODULO.find(e => e.value === esta_activo);
  return estadoObj ? estadoObj.icon : '❓';
};

export const formatearTitulo = (titulo, maxLength = 50) => {
  if (!titulo) return 'Sin título';
  if (titulo.length <= maxLength) return titulo;
  return `${titulo.substring(0, maxLength)}...`;
};

export const formatearDescripcion = (descripcion, maxLength = 100) => {
  if (!descripcion) return 'Sin descripción';
  if (descripcion.length <= maxLength) return descripcion;
  return `${descripcion.substring(0, maxLength)}...`;
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

export const obtenerProgresoModulos = (modulos) => {
  if (!Array.isArray(modulos) || modulos.length === 0) {
    return { total: 0, activos: 0, inactivos: 0, porcentaje: 0 };
  }
  
  const total = modulos.length;
  const activos = modulos.filter(m => m.esta_activo).length;
  const inactivos = total - activos;
  const porcentaje = Math.round((activos / total) * 100);
  
  return { total, activos, inactivos, porcentaje };
};

export const agruparModulosPorCurso = (modulos) => {
  if (!Array.isArray(modulos)) return {};
  
  return modulos.reduce((grupos, modulo) => {
    const cursoId = modulo.id_curso;
    if (!grupos[cursoId]) {
      grupos[cursoId] = {
        curso: modulo.nombre_curso || `Curso ${cursoId}`,
        modulos: []
      };
    }
    grupos[cursoId].modulos.push(modulo);
    return grupos;
  }, {});
};

export const ordenarModulos = (modulos, criterio = 'indice_orden', direccion = 'asc') => {
  if (!Array.isArray(modulos)) return [];
  
  return [...modulos].sort((a, b) => {
    let valorA = a[criterio];
    let valorB = b[criterio];
    
    if (valorA == null) valorA = '';
    if (valorB == null) valorB = '';
    
    if (typeof valorA === 'string') valorA = valorA.toLowerCase();
    if (typeof valorB === 'string') valorB = valorB.toLowerCase();
    
    let resultado = 0;
    if (valorA < valorB) resultado = -1;
    if (valorA > valorB) resultado = 1;
    
    return direccion === 'desc' ? -resultado : resultado;
  });
};

export const crearEstadoInicialModulo = (idCurso = null) => ({
  id_curso: idCurso,
  titulo: '',
  descripcion: '',
  indice_orden: null,
  esta_activo: true
});

export const validarFormularioModulo = (modulo, todosLosModulos = []) => {
  const errores = validarDatosModulo(modulo);
  
  const modulosDelMismoCurso = todosLosModulos.filter(m => 
    m.id_curso === modulo.id_curso && m.id !== modulo.id
  );
  
  const tituloExiste = modulosDelMismoCurso.some(m => 
    m.titulo.toLowerCase().trim() === modulo.titulo.toLowerCase().trim()
  );
  
  if (tituloExiste) {
    errores.push('Ya existe un módulo con este título en el curso');
  }
  
  return errores;
};