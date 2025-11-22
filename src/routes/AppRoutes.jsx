// routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import RegistroPage from "../pages/RegistroPage";
import CursosPage from "../pages/CursosPage";
import VideosPage from "../pages/VideosPage";
import PerfilPage from "../pages/PerfilPage";
import CertificadoPage from "../pages/CertificadoPage";
import AyudaPage from "../pages/AyudaPage";
import CursoDetallePage from "../pages/CursoDetallePage";
import Categorias from "../admin/Categorias";
import Modulos from "../admin/Modulos";
import Cursos from "../admin/Cursos";
import Layout from "../components/Loyout";
import InicioAdmin from "../admin/InicioAdmin";
import CursosInscritosPage from "../pages/CursosInscritosPage";
import ProtectedRoute from "./ProtectedRoute";
import RecuperarContrasena from "../pages/RecuperarPage";
import RestablecerContrasena from "../pages/CambiarPage";
import ContenidosPage from "../admin/Contenidos";
import ExamenPage from "../pages/ExamenPage";
const handleLessonStart = (moduleId, lessonId) => {
  console.log(`Iniciando lección ${lessonId} del módulo ${moduleId}`);
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Rutas sin Layout (Login y Registro) */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroPage />} />
      <Route path="/recuperar" element={<RecuperarContrasena />} />
      <Route path="/restablecer/:token" element={<RestablecerContrasena />} />

      {/* Rutas con Layout (Header + Footer) */}
      <Route element={<Layout />}>
        {/* Rutas de administración protegidas */}
        <Route
          path="/categoria"
          element={
            <ProtectedRoute adminOnly>
              <Categorias />
            </ProtectedRoute>
          }
        />
        <Route path="/examen/realizar/:id" element={<ExamenPage />} />
        <Route
          path="/modulos"
          element={
            <ProtectedRoute adminOnly>
              <Modulos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/modulos/:id"
          element={
            <ProtectedRoute adminOnly>
              <Modulos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/curso"
          element={
            <ProtectedRoute adminOnly>
              <Cursos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/video/:id/contenidos"
          element={
            <ProtectedRoute adminOnly>
              <ContenidosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <InicioAdmin />
            </ProtectedRoute>
          }
        />

        {/* Rutas públicas */}
        <Route
          path="/cursos"
          element={
            <ProtectedRoute userOnly>
              <CursosPage />
            </ProtectedRoute>
          }
        />
        <Route path="/videos" element={<VideosPage />} />
        <Route
          path="/certificados"
          element={
            <ProtectedRoute userOnly>
              <CertificadoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ayuda"
          element={
            <ProtectedRoute userOnly>
              <AyudaPage />
            </ProtectedRoute>
          }
        />
        <Route path="/miscursos" element={<CursosInscritosPage />} />
        <Route
          path="/curso/:cursoId"
          element={
            <ProtectedRoute userOnly>
              <CursoDetallePage onLessonStart={handleLessonStart} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/videos/:moduleId/:lessonId"
          element={
            <ProtectedRoute userOnly>
              <VideosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/videos/:moduleId"
          element={
            <ProtectedRoute userOnly>
              <VideosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <PerfilPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
