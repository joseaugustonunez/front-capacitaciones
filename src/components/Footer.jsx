import React from "react";
import {
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  GraduationCap,
} from "lucide-react";
import "../styles/footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-container">
          {/* Company Section */}
          <div className="footer-section company">
            <div className="footer-logo">
              <img
                src="./img/logg.png"
                alt="Logo"
                className="footer-logo-icon"
                width={28}
                height={28}
              />
              <h3>EduCORE</h3>
            </div>
            <p className="footer-description">
              Tu plataforma de capacitación líder para impulsar tu desarrollo
              profesional.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4>Enlaces</h4>
            <ul className="footer-links">
              <li>
                <a href="#cursos">Cursos</a>
              </li>
              <li>
                <a href="#certificados">Certificaciones</a>
              </li>
              <li>
                <a href="#ayuda">Ayuda</a>
              </li>
              <li>
                <a href="#contacto">Contacto</a>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div className="footer-section contact">
            <h4>Contacto</h4>
            <div className="contact-info">
              <div className="contact-item">
                <Mail size={14} />
                <span>info@eduplatform.com</span>
              </div>
              <div className="contact-item">
                <Phone size={14} />
                <span>+1 (555) 123-4567</span>
              </div>
            </div>
            <div className="social-links">
              <a href="#" className="social-link">
                <Facebook size={16} />
              </a>
              <a href="#" className="social-link">
                <Twitter size={16} />
              </a>
              <a href="#" className="social-link">
                <Linkedin size={16} />
              </a>
              <a href="#" className="social-link">
                <Youtube size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-container">
          <div className="footer-bottom-content">
            <p>&copy; 2025 EduPlatform. Todos los derechos reservados.</p>
            <div className="footer-bottom-links">
              <a href="#privacidad">Privacidad</a>
              <a href="#terminos">Términos</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
