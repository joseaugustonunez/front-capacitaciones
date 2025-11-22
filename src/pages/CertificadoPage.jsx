import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // 👈 Agrega esto
import {
  Eye,
  Download,
  ExternalLink,
  Calendar,
  User,
  Award,
  Clock,
  Loader2,
  CheckCircle,
} from "lucide-react";
import "../styles/certificado.css";
import { obtenerCertificadosUsuario } from "../api/Certificados";

const CertificadoPage = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); // 👈 Agrega esto
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  // Función para obtener el usuario autenticado
  const getCurrentUser = () => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  };

  // Cargar certificados al montar
  useEffect(() => {
    const loadCertificates = async () => {
      try {
        setLoading(true);
        setError(null);
        const currentUser = getCurrentUser();
        if (!currentUser) throw new Error("No hay usuario autenticado");
        setUser(currentUser);
        const userCertificates = await obtenerCertificadosUsuario(
          currentUser.id
        );
        setCertificates(userCertificates || []);
      } catch (err) {
        console.error("Error al cargar certificados:", err);
        setError(err.message || "Error al cargar los certificados");
      } finally {
        setLoading(false);
      }
    };
    loadCertificates();
  }, []);

  // Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "Fecha no válida";
    }
  };

  // Estado del certificado
  const getCertificateStatus = (cert) => {
    if (!cert.es_valido) return { status: "Inválido", color: "text-red-500" };
    if (cert.fecha_vencimiento) {
      const expiryDate = new Date(cert.fecha_vencimiento);
      const today = new Date();
      if (expiryDate < today) {
        return { status: "Vencido", color: "text-red-500" };
      } else if (
        expiryDate.getTime() - today.getTime() <
        30 * 24 * 60 * 60 * 1000
      ) {
        return { status: "Próximo a vencer", color: "text-yellow-500" };
      }
    }
    return { status: "Válido", color: "text-green-500" };
  };

  // Descargar certificado
  const handleDownloadCertificate = async (certificate) => {
    if (certificate.url_pdf) {
      const url = `${backendUrl}/uploads${certificate.url_pdf}`;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Error en la descarga");
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `certificado_${certificate.codigo_certificado}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error("Error al descargar:", error);
        alert("Error al descargar el certificado");
      }
    } else {
      alert("URL del certificado no disponible");
    }
  };

  // Ver certificado
  const handleViewCertificate = (certificate) => {
    if (certificate.url_pdf) {
      window.open(`${backendUrl}/uploads${certificate.url_pdf}`, "_blank");
    } else {
      alert("URL del certificado no disponible");
    }
  };

  // Compartir certificado
  const handleShareCertificate = (certificate) => {
    if (navigator.share) {
      navigator.share({
        title: `Certificado: ${certificate.titulo_curso}`,
        text: `He completado el curso "${certificate.titulo_curso}" y obtenido mi certificado.`,
        url: certificate.url_pdf || window.location.href,
      });
    } else {
      const shareText = `He completado el curso "${certificate.titulo_curso}" y obtenido mi certificado. Código: ${certificate.codigo_certificado}`;
      navigator.clipboard
        .writeText(shareText)
        .then(() => alert("Información copiada al portapapeles"))
        .catch(() => alert("No se pudo compartir el certificado"));
    }
  };

  // Loader y error
  if (loading) {
    return (
      <div className="loader-container">
        <span className="loader"></span>
      </div>
    );
  }

  return (
    <div className="certificates-container-modern">
      <div className="header-section">
        <div className="header-content">
          <h1 className="title-modern">
            <span className="title-gradient">Mis Certificaciones</span>
          </h1>
          <p className="subtitle-modern">
            Certificados profesionales y cursos completados
            {user && <span className="user-info"> - {user.nombre}</span>}
          </p>
        </div>

        <div className="header-actions">
          <div className="stats-card">
            <div className="stat-item">
              <Award size={24} />
              <span className="stat-number">{certificates.length}</span>
              <span className="stat-label">Certificados</span>
            </div>
            <div className="stat-item">
              <CheckCircle size={24} />
              <span className="stat-number">
                {certificates.filter((cert) => cert.es_valido).length}
              </span>
              <span className="stat-label">Válidos</span>
            </div>
          </div>
        </div>
      </div>

      <div className="certificates-list-modern">
        {certificates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No tienes cursos terminados</h3>
            <p>Explora nuestro catálogo y comienza a aprender</p>
            <button
              className="browse-btn"
              onClick={() => navigate("/miscursos")}
            >
              Explorar Cursos
            </button>
          </div>
        ) : (
          certificates.map((cert, index) => {
            const status = getCertificateStatus(cert);
            return (
              <div
                key={cert.id}
                className="certificate-card-horizontal-modern"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Certificate Image Section */}
                <div className="cert-image-section-horizontal">
                  <div className="image-container-horizontal">
                    <img
                      src="./img/certi.png"
                      alt={`Certificado de ${cert.titulo_curso}`}
                      className="cert-image-horizontal"
                    />
                    <div className="image-overlay-horizontal">
                      <div className="category-badge-horizontal bg-gradient-to-r">
                        <Award size={14} />
                        Certificado
                      </div>
                      <div className="status-indicator-horizontal">
                        <div
                          className={`status-dot-horizontal ${
                            cert.es_valido ? "valid" : "invalid"
                          }`}
                        ></div>
                        <span className={status.color}>{status.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="card-content-horizontal-modern">
                  <div className="content-top">
                    <div className="institution-header-horizontal">
                      <span className="institution-name-horizontal">
                        Certificado Profesional
                      </span>
                      <div className="code-badge-horizontal">
                        <span title="Código del certificado">
                          #{cert.codigo_certificado}
                        </span>
                      </div>
                    </div>

                    <h3 className="cert-title-horizontal-modern">
                      {cert.titulo_curso}
                    </h3>

                    <p className="cert-subtitle-horizontal-modern">
                      Certificado otorgado a {cert.nombre_usuario}{" "}
                      {cert.apellido_usuario}
                    </p>

                    <div className="cert-meta-horizontal-modern">
                      <div className="meta-item-horizontal">
                        <Calendar size={14} />
                        <span>Emitido: {formatDate(cert.fecha_emision)}</span>
                      </div>
                      {cert.fecha_vencimiento && (
                        <div className="meta-item-horizontal">
                          <Clock size={14} />
                          <span>
                            Vence: {formatDate(cert.fecha_vencimiento)}
                          </span>
                        </div>
                      )}
                      <div className="meta-item-horizontal">
                        <User size={14} />
                        <span>ID Usuario: {cert.id_usuario}</span>
                      </div>
                    </div>

                    <div className="cert-additional-info">
                      <div className="info-row">
                        <span className="info-label">ID Curso:</span>
                        <span className="info-value">{cert.id_curso}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Estado:</span>
                        <span className={`info-value ${status.color}`}>
                          {cert.es_valido ? "✓ Válido" : "✗ No válido"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="card-actions-horizontal-modern">
                    <button
                      className="btn-horizontal-modern btn-primary-horizontal-modern"
                      onClick={() => handleViewCertificate(cert)}
                      disabled={!cert.url_pdf}
                    >
                      <Eye size={16} />
                      Ver Certificado
                    </button>

                    <button
                      className="btn-horizontal-modern btn-secondary-horizontal-modern"
                      onClick={() => handleDownloadCertificate(cert)}
                      disabled={!cert.url_pdf}
                    >
                      <Download size={16} />
                      Descargar
                    </button>

                    <button
                      className="btn-horizontal-modern btn-icon-horizontal-modern"
                      onClick={() => handleShareCertificate(cert)}
                      title="Compartir certificado"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="floating-orb-horizontal orb-1-horizontal"></div>
                <div className="floating-orb-horizontal orb-2-horizontal"></div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CertificadoPage;
