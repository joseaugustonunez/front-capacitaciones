import React, { useState } from 'react';
import { HelpCircle, MessageSquare, Send, User, Mail, AlertTriangle } from 'lucide-react';
import '../styles/ayuda.css';
import { enviarCorreo } from "../api/Email";

const AyudaPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    description: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitted(true);

    try {
      const data = await enviarCorreo(formData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitted(false);
      setFormData({
        name: "",
        email: "",
        category: "",
        subject: "",
        description: "",
      });
    }
  };
  const categories = [
    { value: '', label: 'Selecciona una categoría' },
    { value: 'Problema técnico', label: 'Problema técnico' },
    { value: 'Cuenta de Usuario', label: 'Cuenta de Usuario' },
    { value: 'Solicitud de funcionalidad', label: 'Solicitud de funcionalidad' },
    { value: 'Reporte de error', label: 'Reporte de error' },
    { value: 'Otro', label: 'Otro' }
  ];
  const faqItems = [
    {
      question: "¿Cómo puedo restablecer mi contraseña?",
      answer: "Ve a la página de inicio de sesión y haz clic en '¿Olvidaste tu contraseña?'"
    },
    {
      question: "¿Cómo contacto al soporte?",
      answer: "Puedes usar este formulario o enviar un email a soporte@empresa.com"
    },
    {
      question: "¿Cuánto tiempo tardan en responder?",
      answer: "Normalmente respondemos en 24-48 horas hábiles"
    }
  ];

  return (
    <div className="help-page">
      <header className="header-ayuda">
        <HelpCircle className="header-icon" size={48} />
        <h1>Centro de Ayuda</h1>
        <p>¿Necesitas ayuda? Reporta tu problema y te ayudaremos</p>
      </header>

      <div className="main-container">
        <section className="faq-section">
          <h2>
            <MessageSquare size={24} />
            Preguntas Frecuentes
          </h2>

          <div className="faq-list">
            {faqItems.map((item, index) => (
              <div key={index} className="faq-item">
                <h3 className="faq-question">{item.question}</h3>
                <p className="faq-answer">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="form-section">
          <h2>
            <AlertTriangle size={24} />
            Reportar Problema
          </h2>

          {isSubmitted && (
            <div className="success-message">
              ¡Gracias! Tu reporte ha sido enviado
            </div>
          )}

          <div className="contact-form">
            <div className="form-group">
              <label className="form-label">
                <User size={16} />
                Nombre *
              </label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Tu nombre completo"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Mail size={16} />
                Email *
              </label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Categoría *</label>
              <select
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Asunto *</label>
              <input
                type="text"
                name="subject"
                className="form-input"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Breve descripción del problema"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descripción *</label>
              <textarea
                name="description"
                className="form-textarea"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe tu problema con detalle..."
                rows="5"
                required
              />
            </div>

            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={isSubmitted}
            >
              <Send size={18} />
              {isSubmitted ? 'Enviando...' : 'Enviar Reporte'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AyudaPage;