// src/pages/CursosInscritosPage.jsx
import React, { useEffect, useState } from "react";
import MisCursosPage from "../components/MisCursosPage";
import { obtenerCursosInscritosConDetalles } from "../api/Inscripciones";
import { obtenerAvanceCursos } from "../api/Cursos";

const CursosInscritosPage = () => {
  const [courses, setCourses] = useState([]);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // 1. Obtener usuario desde localStorage
        const usuario = JSON.parse(localStorage.getItem("userData"));
        if (!usuario || !usuario.id) {
          console.error("No se encontró usuario en localStorage");
          return;
        }

        const idUsuario = usuario.id;

        // 2. Obtener cursos inscritos
        const dataCursos = await obtenerCursosInscritosConDetalles();

        // 3. Obtener progreso de cursos
        const dataAvance = await obtenerAvanceCursos(idUsuario);

        // 4. Mapear cursos + progreso
        const formatted = dataCursos.map((curso) => {
          const avance = dataAvance.find((a) => a.id_curso === curso.id);
          return {
            id: curso.id,
            title: curso.titulo,
            instructor: curso.instructor_nombre || "Instructor no disponible",
            thumbnail: curso.url_miniatura.startsWith("http")
              ? curso.url_miniatura
              : `${backendUrl}${curso.url_miniatura}`,
            duration: `${curso.duracion_horas}h`,
            category: curso.categoria_nombre || "Sin categoría",
            views: curso.total_inscritos || "0",
            progress: avance ? Math.round(avance.porcentaje_avance) : 0, // 👈 usamos progreso real
          };
        });

        setCourses(formatted);
      } catch (error) {
        console.error("Error al obtener cursos inscritos:", error);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div>
      <MisCursosPage inscribedVideos={courses} />
    </div>
  );
};

export default CursosInscritosPage;
