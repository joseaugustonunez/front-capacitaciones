
const API_URL = '/api/videos';


const manejarRespuesta = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
  }
  return response.json();
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

export const obtenerVideos = async (filtros = {}) => {
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
  } else if (respuesta && Array.isArray(respuesta.videos)) {
    return respuesta.videos;
  } else if (respuesta && Array.isArray(respuesta.data)) {
    return respuesta.data;
  } else {
    return [];
  }
};
export const obtenerVideosPorCurso = async (idCurso) => {
  try {
    const response = await axios.get(`${API_URL}/curso/${idCurso}`);
    return response.data;
  } catch (error) {
    return [];
  }
};
export const obtenerVideo = async (id) => {
  if (!id) throw new Error("ID de video es requerido");
  const response = await fetch(`${id}`);
  return await response.json();
};
export const crearVideo = async (video) => {
  if (!video) throw new Error('Datos del video son requeridos');
  
  if (video instanceof FormData) {
    const resp = await fetch(`${API_URL}/`, {
      method: 'POST',
      body: video,
    });
    if (!resp.ok) {
      const errorData = await resp.text();
      throw new Error(`Error ${resp.status}: ${errorData}`);
    }
    return await resp.json();
  }

  return realizarPeticion('/', {
    method: 'POST',
    body: JSON.stringify(video),
  });
};



export const actualizarVideo = async (id, datos) => {
  if (!id) throw new Error("ID de video es requerido");

  try {
    let opciones = { method: "PUT" };

    if (datos instanceof FormData) {
      opciones.body = datos; 
    } else {
      opciones.headers = { "Content-Type": "application/json" };
      opciones.body = JSON.stringify(datos);
    }

    const resp = await fetch(`${API_URL}/${id}`, opciones);

    if (!resp.ok) {
      const errorData = await resp.text();
      throw new Error(`Error ${resp.status}: ${errorData}`);
    }

    return await resp.json();
  } catch (err) {
    throw err;
  }
};

export const eliminarVideo = async (id) => {
  if (!id) throw new Error('ID de video es requerido');
  return realizarPeticion(`/${id}`, {
    method: 'DELETE',
  });
};

export const obtenerVideosPorModulo = async (idModulo, incluirVistasPrevia = true) => {
  if (!idModulo) throw new Error('ID de módulo es requerido');
  const url = `/modulo/${idModulo}?incluir_vistas_previa=${incluirVistasPrevia}`;
  return realizarPeticion(url);
};

export const buscarVideos = async (textoBusqueda, idModulo = null, limite = 50) => {
  if (!textoBusqueda || !textoBusqueda.trim()) {
    throw new Error('Texto de búsqueda es requerido');
  }
  
  const params = new URLSearchParams({
    q: textoBusqueda.trim(),
    limite: limite
  });
  
  if (idModulo) {
    params.append('id_modulo', idModulo);
  }
  
  return realizarPeticion(`/search/buscar?${params.toString()}`);
};

export const obtenerVistasPrevia = async () => {
  return realizarPeticion('/preview/listar');
};

export const cambiarVistaPrevia = async (id, esVistaPrevia) => {
  if (!id) throw new Error('ID de video es requerido');
  if (esVistaPrevia === undefined) throw new Error('Estado de vista previa es requerido');
  
  return realizarPeticion(`/${id}/vista-previa`, {
    method: 'PUT',
    body: JSON.stringify({ es_vista_previa: esVistaPrevia }),
  });
};

export const reordenarVideos = async (videos) => {
  if (!videos || !Array.isArray(videos)) {
    throw new Error('Array de videos es requerido');
  }
  
  videos.forEach((video, index) => {
    if (!video.id || video.orden === undefined) {
      throw new Error(`Video en posición ${index} debe tener id y orden`);
    }
  });
  
  return realizarPeticion('/actions/reordenar', {
    method: 'PUT',
    body: JSON.stringify({ videos }),
  });
};

export const duplicarVideo = async (id, nuevoTitulo = null) => {
  if (!id) throw new Error('ID de video es requerido');
  
  const body = nuevoTitulo ? { nuevo_titulo: nuevoTitulo } : {};
  
  return realizarPeticion(`/${id}/duplicar`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export const actualizarTranscripcion = async (id, transcripcion) => {
  if (!id) throw new Error('ID de video es requerido');
  
  return realizarPeticion(`/${id}/transcripcion`, {
    method: 'PUT',
    body: JSON.stringify({ transcripcion }),
  });
};

export const obtenerEstadisticasGenerales = async () => {
  return realizarPeticion('/stats/generales');
};

export const obtenerEstadisticasModulo = async (idModulo) => {
  if (!idModulo) throw new Error('ID de módulo es requerido');
  return realizarPeticion(`/stats/modulo/${idModulo}`);
};

export const validarDatosVideo = (video) => {
  const errores = [];
  
  if (!video.titulo || !video.titulo.trim()) {
    errores.push('El título es obligatorio');
  }
  
  if (!video.id_modulo || isNaN(parseInt(video.id_modulo))) {
    errores.push('ID de módulo válido es obligatorio');
  }
  
  if (!video.url_video || !video.url_video.trim()) {
    errores.push('La URL del video es obligatoria');
  }
  
  if (video.indice_orden !== undefined && (isNaN(parseInt(video.indice_orden)) || parseInt(video.indice_orden) < 0)) {
    errores.push('El índice de orden debe ser un número positivo');
  }
  
  if (video.duracion_segundos !== undefined && (isNaN(parseInt(video.duracion_segundos)) || parseInt(video.duracion_segundos) < 0)) {
    errores.push('La duración debe ser un número positivo');
  }
  
  if (video.titulo && video.titulo.length > 200) {
    errores.push('El título es demasiado largo (máximo 200 caracteres)');
  }
  
  if (video.url_video && video.url_video.length > 500) {
    errores.push('La URL del video es demasiado larga (máximo 500 caracteres)');
  }
  
  if (video.url_miniatura && video.url_miniatura.length > 500) {
    errores.push('La URL de la miniatura es demasiado larga (máximo 500 caracteres)');
  }
  
  if (video.url_video && !isValidUrl(video.url_video)) {
    errores.push('La URL del video no tiene un formato válido');
  }
  
  if (video.url_miniatura && !isValidUrl(video.url_miniatura)) {
    errores.push('La URL de la miniatura no tiene un formato válido');
  }
  
  return errores;
};

const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

export const obtenerSiguienteOrden = async (idModulo) => {
  if (!idModulo) throw new Error('ID de módulo es requerido');
  
  try {
    const videos = await obtenerVideosPorModulo(idModulo);
    if (!videos.data || videos.data.length === 0) {
      return 1;
    }
    
    const maxOrden = Math.max(...videos.data.map(v => v.indice_orden || 0));
    return maxOrden + 1;
  } catch (error) {
    console.warn('Error obteniendo siguiente orden, usando 1 por defecto:', error);
    return 1;
  }
};

export const moverVideo = async (idVideo, nuevaPosicion, videosDelModulo) => {
  if (!idVideo || nuevaPosicion === undefined || !Array.isArray(videosDelModulo)) {
    throw new Error('Parámetros requeridos: idVideo, nuevaPosicion, videosDelModulo');
  }
  
  const videosReordenados = [...videosDelModulo];
  const videoIndex = videosReordenados.findIndex(v => v.id === idVideo);
  
  if (videoIndex === -1) {
    throw new Error('Video no encontrado en la lista');
  }
  
  const [videoMovido] = videosReordenados.splice(videoIndex, 1);
  
  videosReordenados.splice(nuevaPosicion, 0, videoMovido);
  
  const videosParaReordenar = videosReordenados.map((video, index) => ({
    id: video.id,
    orden: index + 1
  }));
  
  return reordenarVideos(videosParaReordenar);
};

export const intercambiarVideos = async (idVideo1, idVideo2, videosDelModulo) => {
  if (!idVideo1 || !idVideo2 || !Array.isArray(videosDelModulo)) {
    throw new Error('Parámetros requeridos: idVideo1, idVideo2, videosDelModulo');
  }
  
  const video1 = videosDelModulo.find(v => v.id === idVideo1);
  const video2 = videosDelModulo.find(v => v.id === idVideo2);
  
  if (!video1 || !video2) {
    throw new Error('Uno o ambos videos no encontrados');
  }
  
  const videosParaReordenar = [
    { id: idVideo1, orden: video2.indice_orden },
    { id: idVideo2, orden: video1.indice_orden }
  ];
  
  return reordenarVideos(videosParaReordenar);
};

export const TIPOS_VIDEO = [
  { value: false, label: 'Video normal', color: '#3B82F6', icon: '🎥' },
  { value: true, label: 'Vista previa', color: '#10B981', icon: '👁️' }
];

export const ORDENAMIENTO_OPCIONES = [
  { value: 'indice_orden', label: 'Por orden', icon: '🔢' },
  { value: 'titulo', label: 'Por título', icon: '📝' },
  { value: 'duracion_segundos', label: 'Por duración', icon: '⏱️' },
  { value: 'fecha_creacion', label: 'Por fecha de creación', icon: '📅' },
  { value: 'fecha_actualizacion', label: 'Por última actualización', icon: '🔄' }
];

export const FILTROS_BUSQUEDA = [
  { value: 'todo', label: 'Todo el contenido', icon: '🔍' },
  { value: 'titulo', label: 'Solo título', icon: '📝' },
  { value: 'descripcion', label: 'Solo descripción', icon: '📄' },
  { value: 'transcripcion', label: 'Solo transcripción', icon: '💬' }
];

export const obtenerColorTipoVideo = (esVistaPrevia) => {
  const tipoObj = TIPOS_VIDEO.find(t => t.value === esVistaPrevia);
  return tipoObj ? tipoObj.color : '#6B7280';
};

export const obtenerIconoTipoVideo = (esVistaPrevia) => {
  const tipoObj = TIPOS_VIDEO.find(t => t.value === esVistaPrevia);
  return tipoObj ? tipoObj.icon : '❓';
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

export const formatearDuracion = (segundos) => {
  if (!segundos || segundos <= 0) return '0:00';
  
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;
  
  if (horas > 0) {
    return `${horas}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  } else {
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  }
};

export const formatearDuracionLarga = (segundos) => {
  if (!segundos || segundos <= 0) return '0 segundos';
  
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;
  
  const partes = [];
  if (horas > 0) partes.push(`${horas}h`);
  if (minutos > 0) partes.push(`${minutos}m`);
  if (segs > 0) partes.push(`${segs}s`);
  
  return partes.join(' ') || '0s';
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

export const obtenerProgresoVideos = (videos) => {
  if (!Array.isArray(videos) || videos.length === 0) {
    return { 
      total: 0, 
      normales: 0, 
      vistasPrevia: 0, 
      duracionTotal: 0,
      porcentajeVistasPrevia: 0 
    };
  }
  
  const total = videos.length;
  const vistasPrevia = videos.filter(v => v.es_vista_previa).length;
  const normales = total - vistasPrevia;
  const duracionTotal = videos.reduce((sum, v) => sum + (v.duracion_segundos || 0), 0);
  const porcentajeVistasPrevia = Math.round((vistasPrevia / total) * 100);
  
  return { total, normales, vistasPrevia, duracionTotal, porcentajeVistasPrevia };
};

export const agruparVideosPorModulo = (videos) => {
  if (!Array.isArray(videos)) return {};
  
  return videos.reduce((grupos, video) => {
    const moduloId = video.id_modulo;
    if (!grupos[moduloId]) {
      grupos[moduloId] = {
        modulo: video.nombre_modulo || `Módulo ${moduloId}`,
        curso: video.nombre_curso || 'Sin curso',
        videos: []
      };
    }
    grupos[moduloId].videos.push(video);
    return grupos;
  }, {});
};

export const ordenarVideos = (videos, criterio = 'indice_orden', direccion = 'asc') => {
  if (!Array.isArray(videos)) return [];
  
  return [...videos].sort((a, b) => {
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

export const filtrarVideos = (videos, filtros = {}) => {
  if (!Array.isArray(videos)) return [];
  
  return videos.filter(video => {
    if (filtros.idModulo && video.id_modulo !== filtros.idModulo) {
      return false;
    }
    
    if (filtros.esVistaPrevia !== undefined && video.es_vista_previa !== filtros.esVistaPrevia) {
      return false;
    }
    
    if (filtros.duracionMinima && (video.duracion_segundos || 0) < filtros.duracionMinima) {
      return false;
    }
    
    if (filtros.duracionMaxima && (video.duracion_segundos || 0) > filtros.duracionMaxima) {
      return false;
    }
    
    if (filtros.texto) {
      const texto = filtros.texto.toLowerCase();
      const titulo = (video.titulo || '').toLowerCase();
      const descripcion = (video.descripcion || '').toLowerCase();
      const transcripcion = (video.transcripcion || '').toLowerCase();
      
      if (!titulo.includes(texto) && !descripcion.includes(texto) && !transcripcion.includes(texto)) {
        return false;
      }
    }
    
    return true;
  });
};

export const crearEstadoInicialVideo = (idModulo = null) => ({
  id_modulo: idModulo,
  titulo: '',
  descripcion: '',
  url_video: '',
  url_miniatura: '',
  duracion_segundos: 0,
  indice_orden: null,
  es_vista_previa: false,
  transcripcion: ''
});

export const validarFormularioVideo = (video, todosLosVideos = []) => {
  const errores = validarDatosVideo(video);
  
  const videosDelMismoModulo = todosLosVideos.filter(v => 
    v.id_modulo === video.id_modulo && v.id !== video.id
  );
  
  const tituloExiste = videosDelMismoModulo.some(v => 
    v.titulo.toLowerCase().trim() === video.titulo.toLowerCase().trim()
  );
  
  if (tituloExiste) {
    errores.push('Ya existe un video con este título en el módulo');
  }
  
  return errores;
};

export const extraerIdYoutube = (url) => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export const extraerIdVimeo = (url) => {
  const regex = /(?:vimeo\.com\/)(\d+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export const obtenerUrlMiniatura = (urlVideo) => {
  const youtubeId = extraerIdYoutube(urlVideo);
  if (youtubeId) {
    return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
  }
  
  const vimeoId = extraerIdVimeo(urlVideo);
  if (vimeoId) {
    
    return `https://vumbnail.com/${vimeoId}.jpg`;
  }
  
  return null;
};

export const obtenerUrlEmbed = (urlVideo) => {
  const youtubeId = extraerIdYoutube(urlVideo);
  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}`;
  }
  
  const vimeoId = extraerIdVimeo(urlVideo);
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}`;
  }
  
  return urlVideo;
};

export const calcularEstadisticasModulo = (videos) => {
  if (!Array.isArray(videos) || videos.length === 0) {
    return {
      totalVideos: 0,
      duracionTotal: 0,
      duracionPromedio: 0,
      vistasPrevia: 0,
      videosNormales: 0
    };
  }
  
  const totalVideos = videos.length;
  const duracionTotal = videos.reduce((sum, v) => sum + (v.duracion_segundos || 0), 0);
  const duracionPromedio = Math.round(duracionTotal / totalVideos);
  const vistasPrevia = videos.filter(v => v.es_vista_previa).length;
  const videosNormales = totalVideos - vistasPrevia;
  
  return {
    totalVideos,
    duracionTotal,
    duracionPromedio,
    vistasPrevia,
    videosNormales
  };
};

export const obtenerVideoMasLargo = (videos) => {
  if (!Array.isArray(videos) || videos.length === 0) return null;
  
  return videos.reduce((masLargo, video) => {
    const duracionActual = video.duracion_segundos || 0;
    const duracionMasLarga = masLargo?.duracion_segundos || 0;
    return duracionActual > duracionMasLarga ? video : masLargo;
  }, null);
};

export const obtenerVideoMasCorto = (videos) => {
  if (!Array.isArray(videos) || videos.length === 0) return null;
  
  return videos.reduce((masCorto, video) => {
    const duracionActual = video.duracion_segundos || 0;
    const duracionMasCorta = masCorto?.duracion_segundos || Infinity;
    return duracionActual < duracionMasCorta ? video : masCorto;
  }, null);
};