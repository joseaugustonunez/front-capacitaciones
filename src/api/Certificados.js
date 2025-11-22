import axios from "axios";

const API_URL = "/api/certificados";

export const obtenerCertificadosUsuario = async (idUsuario) => {
  try {
    const response = await axios.get(`${API_URL}/usuario/${idUsuario}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo certificados del usuario:', error);
    throw new Error(error.response?.data?.error || 'Error al obtener certificados');
  }
};

export const obtenerCertificadoPorCodigo = async (codigo) => {
  try {
    const response = await axios.get(`${API_URL}/codigo/${codigo}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo certificado por código:', error);
    throw new Error(error.response?.data?.error || 'Certificado no encontrado');
  }
};

export const generarCertificado = async (datos) => {
  try {
    const response = await axios.post(`${API_URL}/generar`, datos);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Error al generar certificado');
  }
};

export const generarCertificadosAutomaticos = async (idUsuario) => {
  try {
    const response = await axios.post(`${API_URL}/generar-automaticos/${idUsuario}`, {});
    
    console.log('✅ Certificados automáticos:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error generando certificados automáticos:', error);
    throw new Error(error.response?.data?.error || 'Error al generar certificados automáticos');
  }
};

export const descargarCertificado = async (filename, nombrePersonalizado = null) => {
  try {
    const response = await axios.get(`${API_URL}/descargar/${filename}`, {
      responseType: "blob", 
      timeout: 60000, 
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", nombrePersonalizado || filename);
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('✅ Certificado descargado:', filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('❌ Error descargando certificado:', error);
    throw new Error(error.response?.data?.error || 'Error al descargar certificado');
  }
};

export const verificarCertificado = async (codigo) => {
  try {
    const certificado = await obtenerCertificadoPorCodigo(codigo);
    
    const esValido = certificado.es_valido === 1;
    const fechaVencimiento = new Date(certificado.fecha_vencimiento);
    const hoy = new Date();
    const noVencido = fechaVencimiento > hoy;
    
    return {
      certificado,
      esValido,
      noVencido,
      validezCompleta: esValido && noVencido,
      mensaje: esValido && noVencido 
        ? 'Certificado válido' 
        : !esValido 
        ? 'Certificado inválido' 
        : 'Certificado vencido'
    };
  } catch (error) {
    throw error;
  }
};

export const obtenerUrlPdf = (urlPdf) => {
  const baseUrl = API_URL.replace('/api/certificados', '');
  return `${baseUrl}${urlPdf}`;
};

export const previsualizarCertificado = (urlPdf) => {
  const urlCompleta = obtenerUrlPdf(urlPdf);
  window.open(urlCompleta, '_blank', 'width=800,height=600');
};

export const actualizarEstadoCertificado = async (codigo, nuevoEstado) => {
  try {
    const response = await axios.put(`${API_URL}/estado/${codigo}`, 
      { es_valido: nuevoEstado }, 
  
    );
    return response.data;
  } catch (error) {
    console.error('❌ Error actualizando estado:', error);
    throw new Error(error.response?.data?.error || 'Error al actualizar certificado');
  }
};

export const eliminarCertificado = async (codigo) => {
  try {
    const response = await axios.delete(`${API_URL}/eliminar/${codigo}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error eliminando certificado:', error);
    throw new Error(error.response?.data?.error || 'Error al eliminar certificado');
  }
};

export const validarDatosCertificado = (datos) => {
  const errores = [];
  
  if (!datos.id_usuario || datos.id_usuario <= 0) {
    errores.push('ID de usuario inválido');
  }
  
  if (!datos.id_curso || datos.id_curso <= 0) {
    errores.push('ID de curso inválido');
  }
  
  if (!datos.codigo_certificado || datos.codigo_certificado.trim().length === 0) {
    errores.push('Código de certificado requerido');
  }
  
  if (!datos.fecha_vencimiento) {
    errores.push('Fecha de vencimiento requerida');
  } else {
    const fecha = new Date(datos.fecha_vencimiento);
    if (fecha <= new Date()) {
      errores.push('Fecha de vencimiento debe ser futura');
    }
  }
  
  return {
    esValido: errores.length === 0,
    errores
  };
};

export const generarCodigoCertificado = (idUsuario, idCurso) => {
  const timestamp = Date.now();
  return `CERT-${idUsuario}-${idCurso}-${timestamp}`;
};

export const calcularFechaVencimiento = (aniosValidez = 1) => {
  const fecha = new Date();
  fecha.setFullYear(fecha.getFullYear() + aniosValidez);
  return fecha.toISOString().split('T')[0];
};

export const generarCertificadoCompleto = async (idUsuario, idCurso, opcionesPersonalizadas = {}) => {
  try {
    const datos = {
      id_usuario: idUsuario,
      id_curso: idCurso,
      codigo_certificado: opcionesPersonalizadas.codigo || generarCodigoCertificado(idUsuario, idCurso),
      fecha_vencimiento: opcionesPersonalizadas.fechaVencimiento || calcularFechaVencimiento(),
    };
    
    const validacion = validarDatosCertificado(datos);
    if (!validacion.esValido) {
      throw new Error(`Datos inválidos: ${validacion.errores.join(', ')}`);
    }
    
    const resultado = await generarCertificado(datos);
    
    return {
      ...resultado,
      datos_utilizados: datos
    };
    
  } catch (error) {
    console.error('❌ Error en generación completa:', error);
    throw error;
  }
};

const CertificadoService = {
  obtenerCertificadosUsuario,
  obtenerCertificadoPorCodigo,
  generarCertificado,
  generarCertificadosAutomaticos,
  descargarCertificado,
  verificarCertificado,
  obtenerUrlPdf,
  previsualizarCertificado,
  actualizarEstadoCertificado,
  eliminarCertificado,
  validarDatosCertificado,
  generarCodigoCertificado,
  calcularFechaVencimiento,
  generarCertificadoCompleto
};

export default CertificadoService;