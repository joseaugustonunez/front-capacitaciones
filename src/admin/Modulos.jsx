import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/modulos.css";
import {
  obtenerVideosExternos,
  obtenerVideoExternoPorUUID,
} from "../api/Externos";
import {
  crearVideo,
  obtenerVideos,
  eliminarVideo,
  cambiarVistaPrevia,
  duplicarVideo,
  actualizarVideo,
  crearEstadoInicialVideo,
  formatearDuracion,
  formatearFecha,
  TIPOS_VIDEO,
  ORDENAMIENTO_OPCIONES,
} from "../api/Videos";
import {
  eliminarModuloFisico,
  actualizarModulo,
  crearModulo,
  obtenerVideosPorModulo,
} from "../api/Modulos";
import { crearArchivo, actualizarArchivo } from "../api/Archivos";
import { obtenerCursoConModulos } from "../api/Cursos";
import {
  crearExamen,
  crearPregunta,
  crearOpcion,
  obtenerExamenes,
  obtenerPreguntasPorExamen,
  obtenerOpcionesPorPregunta,
  actualizarOpcion,
  eliminarOpcion,
} from "../api/examenesApi"; // ⬅️ agregado actualizarOpcion, eliminarOpcion
import {
  Plus,
  Video,
  Edit,
  Trash2,
  X,
  Save,
  User,
  BookOpen,
  Clock,
  BarChart2,
  CheckCheck,
  FileUp,
  SquareChartGantt,
  XCircle,
  ArrowLeft,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

function Modulos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalModulo, setModalModulo] = useState({
    visible: false,
    datos: null,
    esEdicion: false,
  });
  const [modalVideo, setModalVideo] = useState({
    visible: false,
    datos: null,
    esEdicion: false,
  });
  const [modalMaterial, setModalMaterial] = useState({
    visible: false,
    datos: null,
    esEdicion: false,
  });
  const [modalFormulario, setModalFormulario] = useState({
    visible: false,
    datos: null,
    esEdicion: false,
  });
  const [videosModulos, setVideosModulos] = useState({});
  const [materialesModulos, setMaterialesModulos] = useState({});
  const [examenesModulos, setExamenesModulos] = useState({}); // ⬅️ estado para exámenes por módulo
  const [videosExternos, setVideosExternos] = useState([]);
  const [videoSeleccionado, setVideoSeleccionado] = useState("");

  useEffect(() => {
    const fetchCurso = async () => {
      try {
        const data = await obtenerCursoConModulos(id);
        setCurso(data);
        // Cargar videos para cada módulo
        if (data.modulos) {
          await cargarVideosModulos(data.modulos);
          await cargarMaterialesModulos(data.modulos);
          await cargarExamenesModulos(data.modulos); // ⬅️ cargar exámenes también
        }
      } catch (error) {
        console.error("Error al cargar el curso:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurso();
  }, [id]);

  useEffect(() => {
    const cargarVideosExternos = async () => {
      try {
        const data = await obtenerVideosExternos();
        setVideosExternos(data?.data || []);
      } catch (error) {
        console.error("Error al cargar videos externos:", error);
        setVideosExternos([]);
      }
    };
    cargarVideosExternos();
  }, []);

  const cargarVideosModulos = async (modulos) => {
    const videosMap = {};
    for (const modulo of modulos) {
      try {
        const response = await obtenerVideosPorModulo(modulo.id);
        videosMap[modulo.id] = response.success ? response.data : [];
      } catch (error) {
        console.error(`Error al cargar videos del módulo ${modulo.id}:`, error);
        videosMap[modulo.id] = [];
      }
    }
    setVideosModulos(videosMap);
  };

  const cargarMaterialesModulos = async (modulos) => {
    const materialesMap = {};
    try {
      // Si tienes una API para obtener archivos por módulo, úsala.
      // Aquí se asume que existe endpoint: /api/archivos/modulo/:id (ver propuesta anterior)
      for (const modulo of modulos) {
        try {
          const res = await axios.get(
            `${
              import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"
            }/api/archivos/modulo/${modulo.id}`
          );
          materialesMap[modulo.id] = res.data || [];
        } catch (err) {
          console.error(`Error cargando materiales módulo ${modulo.id}:`, err);
          materialesMap[modulo.id] = [];
        }
      }
    } catch (err) {
      console.error("Error en cargarMaterialesModulos:", err);
    }
    setMaterialesModulos(materialesMap);
  };

  const cargarExamenesModulos = async (modulos) => {
    try {
      const todos = await obtenerExamenes();
      const map = {};
      for (const modulo of modulos) {
        map[modulo.id] = (todos || []).filter(
          (e) => Number(e.id_modulo) === Number(modulo.id)
        );
      }
      setExamenesModulos(map);
    } catch (err) {
      console.error("Error cargando examenes por módulo:", err);
      setExamenesModulos({});
    }
  };

  // Editar examen: carga preguntas/opciones y abre modal en modo edición
  const handleEditarExamen = async (exam) => {
    try {
      const preguntas = await obtenerPreguntasPorExamen(exam.id);
      const preguntasConOpciones = await Promise.all(
        (preguntas || []).map(async (p) => {
          const opciones = await obtenerOpcionesPorPregunta(p.id);
          return {
            idTemp: p.id,
            id: p.id,
            texto: p.texto,
            opciones: (opciones || []).map((o) => ({
              idTempOpt: o.id,
              id: o.id,
              texto: o.texto,
              es_correcta: !!o.es_correcta,
            })),
          };
        })
      );

      setModalFormulario({
        visible: true,
        datos: {
          id: exam.id,
          titulo: exam.titulo || "",
          id_modulo: exam.id_modulo,
          intentos_permitidos: exam.intentos_permitidos || 1,
          opcionesEliminadas: [], // ⬅️ inicializar lista de eliminadas
          preguntas:
            preguntasConOpciones.length > 0
              ? preguntasConOpciones
              : [
                  {
                    idTemp: Date.now(),
                    texto: "",
                    opciones: [
                      { idTempOpt: 1, texto: "", es_correcta: true },
                      { idTempOpt: 2, texto: "", es_correcta: false },
                    ],
                  },
                ],
        },
        esEdicion: true,
      });
    } catch (err) {
      console.error("Error cargando examen para editar:", err);
      toast.error("Error al cargar examen para edición");
    }
  };

  // Eliminar examen con confirmación
  const handleEliminarExamen = (exam) => {
    toast(
      (t) => (
        <div className="toast-confirm-container">
          <span className="toast-confirm-text">
            ¿Eliminar el examen "{exam.titulo}"?
          </span>
          <div className="toast-confirm-actions">
            <button
              className="btn-confirm btn-danger"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await axios.delete(
                    `${
                      import.meta.env.VITE_BACKEND_URL ||
                      "http://localhost:3000"
                    }/api/examenes/${exam.id}`
                  );
                  const data = await obtenerCursoConModulos(id);
                  setCurso(data);
                  if (data.modulos) {
                    await cargarVideosModulos(data.modulos);
                    await cargarMaterialesModulos(data.modulos);
                    await cargarExamenesModulos(data.modulos);
                  }
                  toast.success("Examen eliminado correctamente");
                } catch (err) {
                  console.error("Error eliminando examen:", err);
                  toast.error("Error al eliminar examen");
                }
              }}
            >
              Sí
            </button>
            <button
              className="btn-confirm btn-success"
              onClick={() => toast.dismiss(t.id)}
            >
              No
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };

  const handleAgregarModulo = () => {
    setModalModulo({
      visible: true,
      datos: {
        titulo: "",
        descripcion: "",
        indice_orden: curso.modulos ? curso.modulos.length + 1 : 1,
        esta_activo: 1,
      },
      esEdicion: false,
    });
  };
  const handleAgregarFormulario = () => {
    if (!curso.modulos || curso.modulos.length === 0) {
      toast.error("Primero debes crear al menos un módulo");
      return;
    }
    setModalFormulario({
      visible: true,
      datos: {
        titulo: "",
        id_modulo: curso.modulos?.[0]?.id || null, // asigna módulo por defecto
        // Nota: no incluimos indice_orden/tiempo en el payload porque la tabla 'examenes' no los tiene
        intentos_permitidos: 1,
        opcionesEliminadas: [], // ⬅️ inicializar lista de eliminadas
        preguntas: [
          {
            idTemp: Date.now(),
            texto: "",
            opciones: [
              { idTempOpt: 1, texto: "", es_correcta: true }, // por defecto la primera es correcta
              { idTempOpt: 2, texto: "", es_correcta: false },
            ],
          },
        ],
      },
      esEdicion: false,
    });
  };

  const handleAgregarVideo = () => {
    if (!curso.modulos || curso.modulos.length === 0) {
      toast.error("Primero debes crear al menos un módulo");
      return;
    }
    setModalVideo({
      visible: true,
      datos: {
        titulo: "",
        descripcion: "",
        duracion_segundos: "",
        indice_orden: 1,
        es_vista_previa: 0,
        id_modulo: curso.modulos[0].id,
      },
      esEdicion: false,
    });
  };
  const handleAgregarMaterial = () => {
    if (!curso.modulos || curso.modulos.length === 0) {
      toast.error("Primero debes crear al menos un módulo");
      return;
    }
    setModalMaterial({
      visible: true,
      datos: {
        nombre_archivo: "", // <--- usar nombre_archivo (coincide con el input y guardarArchivo)
        descripcion: "",
        duracion_segundos: "",
        indice_orden: 1,
        es_vista_previa: 0,
        id_modulo: curso.modulos[0].id,
        archivo: null,
      },
      esEdicion: false,
    });
  };

  const handleEditarModulo = (modulo) => {
    setModalModulo({
      visible: true,
      datos: { ...modulo },
      esEdicion: true,
    });
  };

  const handleEliminarModulo = (moduloId) => {
    toast(
      (t) => (
        <div className="toast-confirm-container">
          <span className="toast-confirm-text">
            ¿Eliminar este módulo permanentemente?
          </span>
          <div className="toast-confirm-actions">
            <button
              className="btn-confirm btn-danger"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await eliminarModuloFisico(moduloId);
                  const data = await obtenerCursoConModulos(id);
                  setCurso(data);
                  if (data.modulos) {
                    await cargarVideosModulos(data.modulos);
                    await cargarMaterialesModulos(data.modulos);
                  }
                  toast.success("Módulo eliminado permanentemente");
                } catch (error) {
                  console.error("Error al eliminar módulo:", error);
                  toast.error("Error al eliminar el módulo");
                }
              }}
            >
              Sí
            </button>
            <button
              className="btn-confirm btn-success"
              onClick={() => toast.dismiss(t.id)}
            >
              No
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };

  const handleEditarVideo = (video) => {
    setModalVideo({
      visible: true,
      datos: {
        id: video.id,
        id_modulo: video.id_modulo
          ? Number(video.id_modulo)
          : curso.modulos?.[0]?.id ?? null, // 👈 Asegurar id_modulo
        titulo: video.titulo || "",
        descripcion: video.descripcion || "",
        duracion_segundos: video.duracion_segundos
          ? Number(video.duracion_segundos)
          : 0,
        indice_orden: video.indice_orden ? Number(video.indice_orden) : 1,
        es_vista_previa: video.es_vista_previa ? 1 : 0,
        archivo: null,
      },
      esEdicion: true,
    });
  };

  const handleEliminarVideo = (videoId) => {
    toast(
      (t) => (
        <div className="toast-confirm-container">
          <span className="toast-confirm-text">¿Eliminar este video?</span>
          <div className="toast-confirm-actions">
            <button
              className="btn-confirm btn-danger"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await eliminarVideo(videoId); // <--- tu función API
                  toast.success("Video eliminado correctamente");

                  // Recarga datos
                  const data = await obtenerCursoConModulos(id);
                  setCurso(data);
                  if (data.modulos) {
                    await cargarVideosModulos(data.modulos);
                    await cargarMaterialesModulos(data.modulos);
                  }
                } catch (error) {
                  console.error("Error al eliminar el video:", error);
                  toast.error("Error al eliminar el video");
                }
              }}
            >
              Sí
            </button>
            <button
              className="btn-confirm btn-success"
              onClick={() => toast.dismiss(t.id)}
            >
              No
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };
  const guardarArchivo = async () => {
    try {
      const datos = modalMaterial.datos;
      const formData = new FormData();
      formData.append("id_modulo", datos.id_modulo);
      formData.append(
        "nombre_archivo",
        datos.nombre_archivo || datos.archivo?.name || ""
      );
      formData.append("descripcion", datos.descripcion || "");
      // Si usuario subió archivo, campo 'archivo'
      if (datos.archivo) {
        formData.append("archivo", datos.archivo);
      } else if (datos.url_archivo) {
        formData.append("url_archivo", datos.url_archivo);
      }

      if (modalMaterial.esEdicion && datos.id) {
        await actualizarArchivo(datos.id, formData);
        toast.success("Archivo actualizado correctamente");
      } else {
        await crearArchivo(formData);
        toast.success("Archivo creado correctamente");
      }

      // Recargar curso y lista de módulos/videos y materiales
      const data = await obtenerCursoConModulos(id);
      setCurso(data);
      if (data.modulos) {
        await cargarVideosModulos(data.modulos);
        await cargarMaterialesModulos(data.modulos);
      }

      setModalMaterial({ visible: false, datos: null, esEdicion: false });
    } catch (error) {
      console.error("Error al guardar archivo:", error);
      toast.error("Error al guardar el archivo");
    }
  };

  const guardarModulo = async () => {
    try {
      if (modalModulo.esEdicion) {
        await actualizarModulo(modalModulo.datos.id, modalModulo.datos);
        toast.success("Módulo actualizado correctamente");
      } else {
        await crearModulo({ ...modalModulo.datos, id_curso: parseInt(id) });
        toast.success("Módulo creado correctamente");
      }
      const data = await obtenerCursoConModulos(id);
      setCurso(data);
      if (data.modulos) {
        await cargarVideosModulos(data.modulos);
        await cargarMaterialesModulos(data.modulos);
      }
      setModalModulo({ visible: false, datos: null, esEdicion: false });
    } catch (error) {
      console.error("Error al guardar módulo:", error);
      toast.error("Error al guardar el módulo");
    }
  };
  const guardarVideo = async () => {
    try {
      const datos = modalVideo.datos;
      const formData = new FormData();

      formData.append("id_modulo", datos.id_modulo);
      formData.append("titulo", datos.titulo);
      formData.append("descripcion", datos.descripcion);
      formData.append("duracion_segundos", datos.duracion_segundos || 0);
      formData.append("indice_orden", datos.indice_orden);
      formData.append("es_vista_previa", Number(datos.es_vista_previa));

      // Prioridad: archivo > video externo
      if (datos.archivo) {
        formData.append("video", datos.archivo);
      } else if (videoSeleccionado) {
        // Aquí enviamos solo la URL del video externo
        const videoExterno = videosExternos.find(
          (v) => v.uuid === videoSeleccionado
        );
        if (videoExterno) {
          formData.append("url_video", videoExterno.link); // <-- depende de tu API, puede ser videoExterno.link
          formData.append("url_miniatura", videoExterno.miniatura || ""); // opcional
        }
      }

      if (modalVideo.esEdicion) {
        // Actualizar video existente (archivo o link)
        await actualizarVideo(datos.id, formData);
        toast.success("Video actualizado correctamente");
      } else {
        // Crear nuevo video usando tu función crearVideo
        await crearVideo(formData); // <- ahora usamos tu función
        toast.success("Video creado correctamente");
      }

      // Recarga los datos
      const data = await obtenerCursoConModulos(id);
      setCurso(data);
      if (data.modulos) {
        await cargarVideosModulos(data.modulos);
        await cargarMaterialesModulos(data.modulos);
      }
      setModalVideo({ visible: false, datos: null, esEdicion: false });
      setVideoSeleccionado(""); // Reset selección externa
    } catch (error) {
      console.error("Error al guardar video:", error);
      toast.error("Error al guardar el video");
    }
  };

  const guardarExamen = async () => {
    try {
      const datos = modalFormulario.datos;

      // Validaciones mínimas
      if (!datos.titulo || !datos.titulo.trim()) {
        toast.error("El título del examen es obligatorio");
        return;
      }
      if (!datos.id_modulo) {
        toast.error("Selecciona un módulo para el examen");
        return;
      }
      // Validar preguntas/opciones básicas
      if (!datos.preguntas || datos.preguntas.length === 0) {
        toast.error("Agrega al menos una pregunta");
        return;
      }
      for (const p of datos.preguntas) {
        if (!p.texto || !p.texto.trim()) {
          toast.error("Cada pregunta necesita texto");
          return;
        }
        if (!p.opciones || p.opciones.length < 2) {
          toast.error("Cada pregunta debe tener al menos 2 opciones");
          return;
        }
        if (!p.opciones.some((o) => o.es_correcta)) {
          toast.error("Cada pregunta debe tener al menos una opción correcta");
          return;
        }
      }

      // Payload reducido a los campos que realmente maneja la tabla 'examenes'
      const payload = {
        titulo: datos.titulo.trim(),
        id_modulo: Number(datos.id_modulo),
        intentos_permitidos: datos.intentos_permitidos
          ? Number(datos.intentos_permitidos)
          : 1,
      };

      // Si es edición, actualizar metadatos; si no, crear
      let resultado;
      if (modalFormulario.esEdicion && datos.id) {
        // actualizar solo metadatos (si tu backend tiene PUT /api/examenes/:id)
        const res = await axios.put(
          `${
            import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"
          }/api/examenes/${datos.id}`,
          payload
        );
        resultado = res.data;
        toast.success("Examen actualizado correctamente");
      } else {
        // Crear examen
        resultado = await crearExamen(payload);
        toast.success("Examen creado correctamente");
      }

      // Crear preguntas y opciones en la API
      if (
        !modalFormulario.esEdicion &&
        resultado?.id &&
        datos.preguntas &&
        datos.preguntas.length > 0
      ) {
        // Sólo creamos preguntas/opciones al crear examen nuevo.
        for (const p of datos.preguntas) {
          const preguntaPayload = {
            id_examen: resultado.id,
            texto: p.texto.trim(),
          };
          const preguntaCreada = await crearPregunta(preguntaPayload);
          const id_pregunta = preguntaCreada?.id;
          if (id_pregunta && p.opciones) {
            for (const o of p.opciones) {
              const opcionPayload = {
                id_pregunta,
                texto: o.texto.trim(),
                es_correcta: o.es_correcta ? 1 : 0,
              };
              await crearOpcion(opcionPayload);
            }
          }
        }
      } else if (modalFormulario.esEdicion && datos.id) {
        // Edición: actualizar preguntas y opciones
        for (const p of datos.preguntas) {
          let idPregunta = p.id; // si pregunta existente viene con id
          if (!idPregunta) {
            // crear nueva pregunta
            const rp = await crearPregunta({
              id_examen: datos.id,
              texto: p.texto,
            });
            idPregunta = rp.id;
          } else {
            // si implementas actualizarPregunta => actualizarla aquí
            // await actualizarPregunta(idPregunta, { texto: p.texto });
          }

          // procesar opciones de la pregunta
          for (const o of p.opciones) {
            if (o.id) {
              // opción existente => actualizar
              await actualizarOpcion(o.id, {
                texto: o.texto,
                es_correcta: o.es_correcta ? 1 : 0,
              });
            } else {
              // opción nueva => crear
              await crearOpcion({
                id_pregunta: idPregunta,
                texto: o.texto,
                es_correcta: o.es_correcta ? 1 : 0,
              });
            }
          }
        }
      }

      // 3) procesar eliminaciones si acumulaste ids
      if (datos.opcionesEliminadas && datos.opcionesEliminadas.length) {
        for (const idOp of datos.opcionesEliminadas) {
          await eliminarOpcion(idOp);
        }
      }

      // Recargar datos del curso y listas relacionadas
      const data = await obtenerCursoConModulos(id);
      setCurso(data);
      if (data.modulos) {
        await cargarVideosModulos(data.modulos);
        await cargarMaterialesModulos(data.modulos);
        await cargarExamenesModulos(data.modulos); // ⬅️ recargar exámenes para mostrar en UI
      }

      // Cerrar modal
      setModalFormulario({ visible: false, datos: null, esEdicion: false });

      // Nota: no redirigimos a editar porque la ruta puede no existir en tu app.
    } catch (error) {
      console.error("Error al guardar examen:", error);
      toast.error("Error al crear el examen");
    }
  };

  useEffect(() => {
    if (videoSeleccionado) {
      const videoExterno = videosExternos.find(
        (v) => v.uuid === videoSeleccionado
      );
      if (videoExterno && videoExterno.link) {
        const videoTag = document.createElement("video");
        videoTag.preload = "metadata";
        videoTag.onloadedmetadata = function () {
          setModalVideo((prev) => ({
            ...prev,
            datos: {
              ...prev.datos,
              duracion_segundos: Math.floor(videoTag.duration),
              archivo: null, // Asegura que no se guarde el archivo local
            },
          }));
        };
        videoTag.onerror = function () {
          setModalVideo((prev) => ({
            ...prev,
            datos: {
              ...prev.datos,
              duracion_segundos: 0,
              archivo: null,
            },
          }));
        };
        videoTag.src = videoExterno.link;
      }
    }
  }, [videoSeleccionado, videosExternos]);

  // === Funciones para manejar preguntas y opciones en el modal de formulario ===
  // marcar una única opción correcta (radio)
  const marcarOpcionCorrecta = (idTemp, idTempOpt) => {
    setModalFormulario((prev) => ({
      ...prev,
      datos: {
        ...prev.datos,
        preguntas: (prev.datos?.preguntas || []).map((p) =>
          p.idTemp === idTemp
            ? {
                ...p,
                opciones: (p.opciones || []).map((o) => ({
                  ...o,
                  es_correcta: o.idTempOpt === idTempOpt,
                })),
              }
            : p
        ),
      },
    }));
  };

  const agregarPregunta = () => {
    setModalFormulario((prev) => ({
      ...prev,
      datos: {
        ...prev.datos,
        preguntas: [
          ...(prev.datos?.preguntas || []),
          {
            idTemp: Date.now() + Math.random(),
            texto: "",
            opciones: [
              { idTempOpt: Date.now() + 1, texto: "", es_correcta: false },
              { idTempOpt: Date.now() + 2, texto: "", es_correcta: false },
            ],
          },
        ],
      },
    }));
  };

  const eliminarPregunta = (idTemp) => {
    setModalFormulario((prev) => ({
      ...prev,
      datos: {
        ...prev.datos,
        preguntas: (prev.datos?.preguntas || []).filter(
          (p) => p.idTemp !== idTemp
        ),
      },
    }));
  };

  const actualizarTextoPregunta = (idTemp, texto) => {
    setModalFormulario((prev) => ({
      ...prev,
      datos: {
        ...prev.datos,
        preguntas: (prev.datos?.preguntas || []).map((p) =>
          p.idTemp === idTemp ? { ...p, texto } : p
        ),
      },
    }));
  };

  const agregarOpcion = (idTemp) => {
    setModalFormulario((prev) => ({
      ...prev,
      datos: {
        ...prev.datos,
        preguntas: (prev.datos?.preguntas || []).map((p) =>
          p.idTemp === idTemp
            ? {
                ...p,
                opciones: [
                  ...(p.opciones || []),
                  {
                    idTempOpt: Date.now() + Math.random(),
                    texto: "",
                    es_correcta: false,
                  },
                ],
              }
            : p
        ),
      },
    }));
  };

  const eliminarOpcion = (idTemp, idTempOpt) => {
    setModalFormulario((prev) => {
      const pregunta = (prev.datos?.preguntas || []).find(
        (p) => p.idTemp === idTemp
      );
      const opcionToRemove = pregunta?.opciones?.find(
        (o) => o.idTempOpt === idTempOpt
      );
      const nuevasPreguntas = (prev.datos?.preguntas || []).map((p) =>
        p.idTemp === idTemp
          ? {
              ...p,
              opciones: (p.opciones || []).filter(
                (o) => o.idTempOpt !== idTempOpt
              ),
            }
          : p
      );

      const prevEliminadas = prev.datos?.opcionesEliminadas || [];
      const nuevasEliminadas =
        opcionToRemove && opcionToRemove.id
          ? [...prevEliminadas, opcionToRemove.id]
          : prevEliminadas;

      return {
        ...prev,
        datos: {
          ...prev.datos,
          preguntas: nuevasPreguntas,
          opcionesEliminadas: nuevasEliminadas,
        },
      };
    });
  };

  const actualizarTextoOpcion = (idTemp, idTempOpt, texto) => {
    setModalFormulario((prev) => ({
      ...prev,
      datos: {
        ...prev.datos,
        preguntas: (prev.datos?.preguntas || []).map((p) =>
          p.idTemp === idTemp
            ? {
                ...p,
                opciones: (p.opciones || []).map((o) =>
                  o.idTempOpt === idTempOpt ? { ...o, texto } : o
                ),
              }
            : p
        ),
      },
    }));
  };

  const toggleOpcionCorrecta = (idTemp, idTempOpt) => {
    setModalFormulario((prev) => ({
      ...prev,
      datos: {
        ...prev.datos,
        preguntas: (prev.datos?.preguntas || []).map((p) =>
          p.idTemp === idTemp
            ? {
                ...p,
                opciones: (p.opciones || []).map((o) =>
                  o.idTempOpt === idTempOpt
                    ? { ...o, es_correcta: !o.es_correcta }
                    : o
                ),
              }
            : p
        ),
      },
    }));
  };

  if (loading) return <div className="modulos-loading">Cargando curso...</div>;
  if (!curso)
    return <div className="modulos-error">No se encontró el curso.</div>;

  return (
    <div className="modulos-detalle">
      {/* Botón de vuelta */}
      <button className="modulos-btn-volver" onClick={() => navigate("/curso")}>
        <ArrowLeft size={18} style={{ marginRight: 8 }} />
        Volver a cursos
      </button>
      {/* Card del curso */}
      <div className="modulos-curso-card">
        <div className="modulos-curso-header">
          <img
            src={`https://capacitacionback.sistemasudh.com${curso.url_miniatura}`}
            alt={curso.titulo}
            className="modulos-curso-imagen"
          />
          <div className="modulos-curso-info">
            <h2 className="modulos-curso-titulo">{curso.titulo}</h2>
            <p className="modulos-curso-descripcion-corta">
              {curso.descripcion_corta}
            </p>
            <p className="modulos-curso-descripcion">{curso.descripcion}</p>
            <div className="modulos-curso-meta">
              <span>
                <User size={16} style={{ marginRight: 4 }} />{" "}
                {curso.instructor_nombre}
              </span>
              <span>
                <BookOpen size={16} style={{ marginRight: 4 }} />{" "}
                {curso.categoria_nombre}
              </span>
              <span>
                <Clock size={16} style={{ marginRight: 4 }} />{" "}
                {curso.duracion_horas} horas
              </span>
              <span>
                <BarChart2 size={16} style={{ marginRight: 4 }} />{" "}
                {curso.nivel_dificultad}
              </span>
              <span>
                {" "}
                <CheckCheck size={16} style={{ marginRight: 4 }} />
                {curso.estado}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card de módulos */}
      <div className="modulos-gestion-card">
        <div className="modulos-acciones">
          <button
            className="modulos-btn-agregar-modulo"
            onClick={handleAgregarModulo}
          >
            <Plus size={18} />
            Agregar módulo
          </button>
          <button
            className="modulos-btn-agregar-video"
            onClick={handleAgregarVideo}
          >
            <Video size={18} />
            Agregar video
          </button>
          <button
            className="modulos-btn-agregar-video"
            onClick={handleAgregarMaterial}
          >
            <FileUp size={18} />
            Agregar Material
          </button>
          <button
            className="modulos-btn-agregar-video"
            onClick={handleAgregarFormulario}
          >
            <SquareChartGantt size={18} />
            Agregar Formulario
          </button>
        </div>

        <div className="modulos-lista-container">
          <h3 className="modulos-lista-titulo">Módulos</h3>
          <div className="modulos-lista">
            {curso.modulos?.map((modulo) => (
              <div key={modulo.id} className="modulos-item">
                <div className="modulos-item-content">
                  <div className="modulos-item-info">
                    <h4 className="modulos-item-titulo">
                      {modulo.indice_orden}. {modulo.titulo}
                    </h4>
                    <p className="modulos-item-descripcion">
                      {modulo.descripcion}
                    </p>
                  </div>
                  <div className="modulos-item-acciones">
                    <button
                      className="modulos-btn-editar"
                      onClick={() => handleEditarModulo(modulo)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="modulos-btn-eliminar"
                      onClick={() => handleEliminarModulo(modulo.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Videos del módulo */}
                <div className="modulos-videos-lista">
                  {videosModulos[modulo.id] &&
                  videosModulos[modulo.id].length > 0 ? (
                    videosModulos[modulo.id].map((video) => (
                      <div
                        key={video.id}
                        className="modulos-video-item modulos-video-clickable"
                        onClick={() =>
                          navigate(`/video/${video.id}/contenidos`)
                        }
                        style={{ cursor: "pointer" }}
                        title="Ir al editor de contenido"
                      >
                        <div className="modulos-video-content">
                          <div className="modulos-video-info">
                            <span className="modulos-video-titulo">
                              {video.titulo}
                            </span>
                            <span className="modulos-video-duracion">
                              {Math.floor(video.duracion_segundos / 60)}:
                              {(video.duracion_segundos % 60)
                                .toString()
                                .padStart(2, "0")}
                            </span>
                          </div>
                          <div className="modulos-video-meta">
                            {video.es_vista_previa ? (
                              <span className="modulos-video-preview">
                                Vista previa
                              </span>
                            ) : null}
                            <span className="modulos-video-orden">
                              Orden: {video.indice_orden}
                            </span>
                          </div>
                        </div>
                        <div className="modulos-video-acciones">
                          <button
                            className="modulos-btn-editar"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditarVideo(video);
                            }}
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            className="modulos-btn-eliminar"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEliminarVideo(video.id);
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="modulos-video-vacio">
                      <span>Este módulo no tiene videos.</span>
                    </div>
                  )}
                </div>

                {/* Materiales del módulo */}
                <div className="modulos-materiales-lista">
                  <h5 style={{ marginTop: 12 }}>Materiales</h5>
                  {materialesModulos[modulo.id] &&
                  materialesModulos[modulo.id].length > 0 ? (
                    materialesModulos[modulo.id].map((archivo) => (
                      <div
                        key={archivo.id}
                        className="modulos-video-item modulos-material-clickable"
                        // opcional: abrir detalles al hacer click
                        onClick={() =>
                          window.open(
                            `https://capacitacionback.sistemasudh.com${archivo.url_archivo}`,
                            "_blank"
                          )
                        }
                        style={{ cursor: "pointer" }}
                        title="Abrir / Descargar material"
                      >
                        <div className="modulos-video-content">
                          <div className="modulos-video-info">
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                              }}
                            >
                              <div
                                className="modulos-material-icon"
                                style={{
                                  width: 48,
                                  height: 48,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background: "#f4f6f8",
                                  borderRadius: 8,
                                }}
                              >
                                <FileUp size={22} />
                              </div>
                              <div>
                                <span className="modulos-video-titulo">
                                  {archivo.nombre_archivo}
                                </span>
                                {archivo.descripcion ? (
                                  <div
                                    className="modulos-material-descripcion"
                                    style={{ marginTop: 4 }}
                                  >
                                    <small>{archivo.descripcion}</small>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="modulos-video-acciones">
                          <a
                            href={`https://capacitacionback.sistemasudh.com${archivo.url_archivo}`}
                            target="_blank"
                            rel="noreferrer"
                            className="modulos-material-descarga"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileUp size={14} /> Descargar
                          </a>

                          <button
                            className="modulos-btn-editar"
                            onClick={(e) => {
                              e.stopPropagation();
                              // abrir modal de edición de material
                              setModalMaterial({
                                visible: true,
                                datos: {
                                  id: archivo.id,
                                  id_modulo: archivo.id_modulo,
                                  nombre_archivo: archivo.nombre_archivo,
                                  descripcion: archivo.descripcion,
                                },
                                esEdicion: true,
                              });
                            }}
                            title="Editar material"
                          >
                            <Edit size={15} />
                          </button>

                          <button
                            className="modulos-btn-eliminar"
                            onClick={(e) => {
                              e.stopPropagation();
                              // confirmar y eliminar (puedes reutilizar lógica similar a handleEliminarVideo)
                              toast(
                                (t) => (
                                  <div className="toast-confirm-container">
                                    <span className="toast-confirm-text">
                                      ¿Eliminar este material?
                                    </span>
                                    <div className="toast-confirm-actions">
                                      <button
                                        className="btn-confirm btn-danger"
                                        onClick={async () => {
                                          toast.dismiss(t.id);
                                          try {
                                            await axios.delete(
                                              `${
                                                import.meta.env
                                                  .VITE_BACKEND_URL ||
                                                "http://localhost:3000"
                                              }/api/archivos/${archivo.id}`
                                            );
                                            const data =
                                              await obtenerCursoConModulos(id);
                                            setCurso(data);
                                            if (data.modulos) {
                                              await cargarVideosModulos(
                                                data.modulos
                                              );
                                              await cargarMaterialesModulos(
                                                data.modulos
                                              );
                                            }
                                            toast.success(
                                              "Material eliminado correctamente"
                                            );
                                          } catch (err) {
                                            console.error(err);
                                            toast.error(
                                              "Error al eliminar material"
                                            );
                                          }
                                        }}
                                      >
                                        Sí
                                      </button>
                                      <button
                                        className="btn-confirm btn-success"
                                        onClick={() => toast.dismiss(t.id)}
                                      >
                                        No
                                      </button>
                                    </div>
                                  </div>
                                ),
                                { duration: 5000 }
                              );
                            }}
                            title="Eliminar material"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="modulos-material-vacio">
                      <small>No hay materiales en este módulo.</small>
                    </div>
                  )}

                  {/* Exámenes del módulo */}
                  <h5 style={{ marginTop: 12 }}>Exámenes</h5>
                  {examenesModulos[modulo.id] &&
                  examenesModulos[modulo.id].length > 0 ? (
                    examenesModulos[modulo.id].map((exam) => (
                      <div
                        key={exam.id}
                        className="modulos-video-item modulos-examen-item"
                        style={{
                          cursor: "default",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: 10,
                        }}
                        title={exam.titulo}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "#f4f6f8",
                              borderRadius: 8,
                            }}
                          >
                            <SquareChartGantt size={20} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{exam.titulo}</div>
                            <small style={{ color: "#666" }}>
                              Intentos: {exam.intentos_permitidos ?? 1}
                              {exam.tiempo_minutos
                                ? ` • ${exam.tiempo_minutos} min`
                                : ""}
                            </small>
                          </div>
                        </div>
                        {/* Acciones opcionales: editar/eliminar si tienes endpoints */}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="modulos-btn-editar"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditarExamen(exam);
                            }}
                            title="Editar examen"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="modulos-btn-eliminar"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEliminarExamen(exam);
                            }}
                            title="Eliminar examen"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ marginTop: 8 }}>
                      <small>No hay exámenes en este módulo.</small>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal para Módulo */}
      {modalModulo.visible && (
        <div className="modulos-modal-overlay">
          <div className="modulos-modal">
            <div className="modulos-modal-header">
              <h3>
                {modalModulo.esEdicion ? "Editar Módulo" : "Crear Módulo"}
              </h3>
              <button
                className="modulos-modal-cerrar"
                onClick={() =>
                  setModalModulo({
                    visible: false,
                    datos: null,
                    esEdicion: false,
                  })
                }
              >
                <X size={20} />
              </button>
            </div>
            <div className="modulos-modal-body">
              <div className="modulos-form-group">
                <label>Título:</label>
                <input
                  type="text"
                  value={modalModulo.datos.titulo}
                  onChange={(e) =>
                    setModalModulo({
                      ...modalModulo,
                      datos: { ...modalModulo.datos, titulo: e.target.value },
                    })
                  }
                  className="modulos-form-input"
                />
              </div>
              <div className="modulos-form-group">
                <label>Descripción:</label>
                <textarea
                  value={modalModulo.datos.descripcion}
                  onChange={(e) =>
                    setModalModulo({
                      ...modalModulo,
                      datos: {
                        ...modalModulo.datos,
                        descripcion: e.target.value,
                      },
                    })
                  }
                  className="modulos-form-textarea"
                  rows="3"
                />
              </div>
              <div className="modulos-form-group">
                <label>Orden:</label>
                <input
                  type="number"
                  value={modalModulo.datos.indice_orden}
                  onChange={(e) =>
                    setModalModulo({
                      ...modalModulo,
                      datos: {
                        ...modalModulo.datos,
                        indice_orden: parseInt(e.target.value),
                      },
                    })
                  }
                  className="modulos-form-input"
                  min="1"
                />
              </div>
              <div className="modulos-form-group modulos-form-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={modalModulo.datos.esta_activo === 1}
                    onChange={(e) =>
                      setModalModulo({
                        ...modalModulo,
                        datos: {
                          ...modalModulo.datos,
                          esta_activo: e.target.checked ? 1 : 0,
                        },
                      })
                    }
                  />
                  ¿Está activo?
                </label>
              </div>
            </div>
            <div className="modulos-modal-footer">
              <button
                className="modulos-btn-cancelar"
                onClick={() =>
                  setModalModulo({
                    visible: false,
                    datos: null,
                    esEdicion: false,
                  })
                }
              >
                Cancelar
              </button>
              <button className="modulos-btn-guardar" onClick={guardarModulo}>
                <Save size={16} />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Video */}
      {modalVideo.visible && (
        <div className="modulos-modal-overlay">
          <div className="modulos-modal">
            <div className="modulos-modal-header">
              <h3>{modalVideo.esEdicion ? "Editar Video" : "Crear Video"}</h3>
              <button
                className="modulos-modal-cerrar"
                onClick={() =>
                  setModalVideo({
                    visible: false,
                    datos: null,
                    esEdicion: false,
                  })
                }
              >
                <X size={20} />
              </button>
            </div>
            <div className="modulos-modal-body">
              <div className="modulos-form-group">
                <label>Módulo:</label>
                <select
                  value={modalVideo.datos.id_modulo}
                  onChange={(e) =>
                    setModalVideo({
                      ...modalVideo,
                      datos: {
                        ...modalVideo.datos,
                        id_modulo: parseInt(e.target.value),
                      },
                    })
                  }
                  className="modulos-form-select"
                >
                  {curso.modulos?.map((modulo) => (
                    <option key={modulo.id} value={modulo.id}>
                      {modulo.indice_orden}. {modulo.titulo}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modulos-form-group">
                <label>Título:</label>
                <input
                  type="text"
                  value={modalVideo.datos.titulo}
                  onChange={(e) =>
                    setModalVideo({
                      ...modalVideo,
                      datos: { ...modalVideo.datos, titulo: e.target.value },
                    })
                  }
                  className="modulos-form-input"
                />
              </div>
              <div className="modulos-form-group">
                <label>Descripción:</label>
                <textarea
                  value={modalVideo.datos.descripcion}
                  onChange={(e) =>
                    setModalVideo({
                      ...modalVideo,
                      datos: {
                        ...modalVideo.datos,
                        descripcion: e.target.value,
                      },
                    })
                  }
                  className="modulos-form-textarea"
                  rows="3"
                />
              </div>
              <div
                className="modulos-form-group"
                style={{ display: "flex", alignItems: "center", gap: 16 }}
              >
                <div style={{ flex: 1 }}>
                  <label>Video:</label>
                  <label htmlFor="video-upload">Subir Video</label>
                  <input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    className="modulos-form-input-upload"
                    onChange={async (e) => {
                      const archivo = e.target.files[0];
                      if (archivo) {
                        if (archivo.size > 500 * 1024 * 1024) {
                          // 500MB
                          toast.error(
                            "El archivo es demasiado grande (máx 500 MB)"
                          );
                          e.target.value = ""; // Limpia el input
                          return;
                        }
                        const videoTag = document.createElement("video");
                        videoTag.preload = "metadata";
                        videoTag.onloadedmetadata = function () {
                          setModalVideo((prev) => ({
                            ...prev,
                            datos: {
                              ...prev.datos,
                              archivo,
                              duracion_segundos: Math.floor(videoTag.duration),
                            },
                          }));
                        };
                        videoTag.src = URL.createObjectURL(archivo);
                      }
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block" }}>
                    Seleccionar de galería:
                  </label>
                  <select
                    className="modulos-form-select"
                    value={videoSeleccionado}
                    onChange={(e) => setVideoSeleccionado(e.target.value)}
                  >
                    <option value="">Selecciona un video externo</option>
                    {videosExternos.map((video) => (
                      <option key={video.uuid} value={video.uuid}>
                        {video.titulo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modulos-form-group">
                <label>Duración (segundos):</label>
                <input
                  type="number"
                  value={modalVideo.datos.duracion_segundos}
                  onChange={(e) =>
                    setModalVideo({
                      ...modalVideo,
                      datos: {
                        ...modalVideo.datos,
                        duracion_segundos: parseInt(e.target.value),
                      },
                    })
                  }
                  className="modulos-form-input"
                  min="0"
                  disabled
                />
              </div>
              <div className="modulos-form-group">
                <label>Orden:</label>
                <input
                  type="number"
                  value={modalVideo.datos.indice_orden}
                  onChange={(e) =>
                    setModalVideo({
                      ...modalVideo,
                      datos: {
                        ...modalVideo.datos,
                        indice_orden: parseInt(e.target.value),
                      },
                    })
                  }
                  className="modulos-form-input"
                  min="1"
                />
              </div>
              <div className="modulos-form-group modulos-form-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={Number(modalVideo.datos.es_vista_previa) === 1}
                    onChange={(e) =>
                      setModalVideo((prev) => ({
                        ...prev,
                        datos: {
                          ...prev.datos,
                          es_vista_previa: e.target.checked ? 1 : 0,
                        },
                      }))
                    }
                  />
                  Es vista previa
                </label>
              </div>
            </div>
            <div className="modulos-modal-footer">
              <button
                className="modulos-btn-cancelar"
                onClick={() =>
                  setModalVideo({
                    visible: false,
                    datos: null,
                    esEdicion: false,
                  })
                }
              >
                Cancelar
              </button>
              <button className="modulos-btn-guardar" onClick={guardarVideo}>
                <Save size={16} />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalMaterial.visible && (
        <div className="modulos-modal-overlay">
          <div className="modulos-modal">
            {/* HEADER */}
            <div className="modulos-modal-header">
              <h3>
                {modalMaterial.esEdicion
                  ? "Editar Archivo"
                  : "Subir Nuevo Archivo"}
              </h3>
              <button
                className="modulos-modal-cerrar"
                onClick={() =>
                  setModalMaterial({
                    visible: false,
                    datos: null,
                    esEdicion: false,
                  })
                }
              >
                <X size={20} />
              </button>
            </div>

            {/* BODY */}
            <div className="modulos-modal-body">
              {/* Seleccionar módulo */}
              <div className="modulos-form-group">
                <label>Módulo:</label>
                <select
                  value={modalMaterial.datos.id_modulo}
                  onChange={(e) =>
                    setModalMaterial({
                      ...modalMaterial,
                      datos: {
                        ...modalMaterial.datos,
                        id_modulo: parseInt(e.target.value),
                      },
                    })
                  }
                  className="modulos-form-select"
                >
                  {curso.modulos?.map((modulo) => (
                    <option key={modulo.id} value={modulo.id}>
                      {modulo.indice_orden}. {modulo.titulo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre del archivo */}
              <div className="modulos-form-group">
                <label>Nombre del archivo:</label>
                <input
                  type="text"
                  value={modalMaterial.datos.nombre_archivo}
                  onChange={(e) =>
                    setModalMaterial({
                      ...modalMaterial,
                      datos: {
                        ...modalMaterial.datos,
                        nombre_archivo: e.target.value,
                      },
                    })
                  }
                  className="modulos-form-input"
                  placeholder="Ejemplo: Guía de estudio - Semana 1"
                />
              </div>

              {/* Descripción */}
              <div className="modulos-form-group">
                <label>Descripción:</label>
                <textarea
                  value={modalMaterial.datos.descripcion}
                  onChange={(e) =>
                    setModalMaterial({
                      ...modalMaterial,
                      datos: {
                        ...modalMaterial.datos,
                        descripcion: e.target.value,
                      },
                    })
                  }
                  className="modulos-form-textarea"
                  rows="3"
                  placeholder="Breve descripción del material..."
                />
              </div>

              {/* Subir archivo */}
              <div
                className="modulos-form-group"
                style={{ display: "flex", alignItems: "center", gap: 16 }}
              >
                <label>Material:</label>
                <label htmlFor="archivo-upload">Subir Material</label>
                <input
                  id="archivo-upload"
                  type="file"
                  accept="*/*"
                  className="modulos-form-input-upload"
                  onChange={(e) => {
                    const archivo = e.target.files[0];
                    if (archivo) {
                      if (archivo.size > 500 * 1024 * 1024) {
                        toast.error(
                          "El archivo es demasiado grande (máx 500 MB)"
                        );
                        e.target.value = "";
                        return;
                      }
                      setModalMaterial((prev) => ({
                        ...prev,
                        datos: { ...prev.datos, archivo },
                      }));
                    }
                  }}
                />
              </div>

              {/* Vista previa */}
              {modalMaterial.datos.archivo && (
                <div className="mt-2 text-sm text-gray-500">
                  Archivo seleccionado:{" "}
                  <strong>{modalMaterial.datos.archivo.name}</strong>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="modulos-modal-footer">
              <button
                className="modulos-btn-cancelar"
                onClick={() =>
                  setModalMaterial({
                    visible: false,
                    datos: null,
                    esEdicion: false,
                  })
                }
              >
                Cancelar
              </button>
              <button className="modulos-btn-guardar" onClick={guardarArchivo}>
                <Save size={16} />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalFormulario.visible && (
        <div className="modulos-modal-overlay">
          <div className="modulos-modal">
            <div className="modulos-modal-header">
              <h3>
                {modalFormulario.esEdicion
                  ? "Editar Formulario"
                  : "Crear Formulario"}
              </h3>
              <button
                className="modulos-modal-cerrar"
                onClick={() =>
                  setModalFormulario({
                    visible: false,
                    datos: null,
                    esEdicion: false,
                  })
                }
              >
                <X size={20} />
              </button>
            </div>
            <div className="modulos-modal-body">
              <div className="modulos-form-group">
                <label>Módulo:</label>
                <select
                  value={modalFormulario.datos.id_modulo}
                  onChange={(e) =>
                    setModalFormulario({
                      ...modalFormulario,
                      datos: {
                        ...modalFormulario.datos,
                        id_modulo: parseInt(e.target.value),
                      },
                    })
                  }
                  className="modulos-form-select"
                >
                  {curso.modulos?.map((modulo) => (
                    <option key={modulo.id} value={modulo.id}>
                      {modulo.indice_orden}. {modulo.titulo}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modulos-form-group">
                <label>Título:</label>
                <input
                  type="text"
                  value={modalFormulario.datos.titulo}
                  onChange={(e) =>
                    setModalFormulario({
                      ...modalFormulario,
                      datos: {
                        ...modalFormulario.datos,
                        titulo: e.target.value,
                      },
                    })
                  }
                  className="modulos-form-input"
                />
              </div>

              <div className="modulos-form-group">
                <label>Intentos permitidos:</label>
                <input
                  type="number"
                  value={modalFormulario.datos.intentos_permitidos || 1}
                  onChange={(e) =>
                    setModalFormulario({
                      ...modalFormulario,
                      datos: {
                        ...modalFormulario.datos,
                        intentos_permitidos: parseInt(e.target.value) || 1,
                      },
                    })
                  }
                  className="modulos-form-input"
                  min="1"
                />
              </div>

              {/* Descripción: REMOVIDO */}
              {/* NUEVAS PREGUNTAS */}
              <div style={{ marginTop: 8 }}>
                <h4>Preguntas</h4>
                {(modalFormulario.datos.preguntas || []).map((pregunta) => (
                  <div
                    key={pregunta.idTemp}
                    style={{
                      border: "1px solid #e5e7eb",
                      padding: 10,
                      borderRadius: 6,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <strong>Pregunta</strong>
                      <div>
                        <button
                          className="modulos-btn-eliminar"
                          onClick={() => eliminarPregunta(pregunta.idTemp)}
                          title="Eliminar pregunta"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <input
                        type="text"
                        placeholder="Texto de la pregunta"
                        value={pregunta.texto}
                        onChange={(e) =>
                          actualizarTextoPregunta(
                            pregunta.idTemp,
                            e.target.value
                          )
                        }
                        className="modulos-form-input"
                      />
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <strong>Opciones</strong>
                      {pregunta.opciones.map((opcion) => (
                        <div
                          key={opcion.idTempOpt}
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            marginTop: 6,
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Texto de la opción"
                            value={opcion.texto}
                            onChange={(e) =>
                              actualizarTextoOpcion(
                                pregunta.idTemp,
                                opcion.idTempOpt,
                                e.target.value
                              )
                            }
                            className="modulos-form-input"
                          />
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <input
                              type="radio"
                              name={`correcta-${pregunta.idTemp}`}
                              checked={!!opcion.es_correcta}
                              onChange={() =>
                                marcarOpcionCorrecta(
                                  pregunta.idTemp,
                                  opcion.idTempOpt
                                )
                              }
                            />
                            Correcta
                          </label>
                          <button
                            className="modulos-btn-eliminar"
                            onClick={() =>
                              eliminarOpcion(pregunta.idTemp, opcion.idTempOpt)
                            }
                            title="Eliminar opción"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      ))}
                      <div style={{ marginTop: 8 }}>
                        <button
                          className="modulos-btn-agregar-video"
                          onClick={() => agregarOpcion(pregunta.idTemp)}
                        >
                          Agregar opción
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: 8 }}>
                  <button
                    className="modulos-btn-agregar-video"
                    onClick={agregarPregunta}
                  >
                    Agregar pregunta
                  </button>
                </div>
              </div>
            </div>
            <div className="modulos-modal-footer">
              <button
                className="modulos-btn-cancelar"
                onClick={() =>
                  setModalFormulario({
                    visible: false,
                    datos: null,
                    esEdicion: false,
                  })
                }
              >
                Cancelar
              </button>
              <button className="modulos-btn-guardar" onClick={guardarExamen}>
                <Save size={16} />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Modulos;
