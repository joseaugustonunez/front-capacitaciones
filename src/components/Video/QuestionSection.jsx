import React from "react";
import { MessageCircle } from "lucide-react";

const QuestionSection = () => {
  return (
    <div className="question-section-vidu">
      <MessageCircle className="question-icon" />
      <input
        type="text"
        placeholder="¿Tienes preguntas sobre la clase? Obtén respuesta inmediata"
        className="question-input-vidu"
      />
      <button className="question-btn">Preguntar</button>
    </div>
  );
};

export default QuestionSection;