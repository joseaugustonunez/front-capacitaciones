import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/ExamenPage.css";
import {
  obtenerExamenPorId,
  obtenerPreguntasPorExamen,
  obtenerOpcionesPorPregunta,
  registrarRespuestas,
  registrarIntento,
  obtenerIntentosPorUsuarioYExamen, // <-- agregado
} from "../api/examenesApi";

// React Icons
import {
  FiArrowLeft,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
  FiSend,
} from "react-icons/fi";
import { HiOutlineCheckCircle } from "react-icons/hi";
import { IoTrophyOutline, IoBookOutline, IoTimeOutline } from "react-icons/io5";

export default function ExamenPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [examen, setExamen] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Nuevos estados para intentos y mejor puntaje
  const [intentos, setIntentos] = useState([]);
  const [mejorPuntaje, setMejorPuntaje] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const ex = await obtenerExamenPorId(id).catch(() => null);
        const p = await obtenerPreguntasPorExamen(id).catch(() => []);

        const preguntasConOpciones = await Promise.all(
          (p || []).map(async (pq) => {
            let opciones = [];
            if (Array.isArray(pq.opciones) && pq.opciones.length > 0) {
              opciones = pq.opciones;
            } else {
              opciones = await obtenerOpcionesPorPregunta(pq.id).catch(
                () => []
              );
            }

            // Determinar index de la opción correcta si existe (varias formas comunes)
            const correctaIdx = opciones.findIndex(
              (op) =>
                op?.es_correcta === 1 ||
                op?.es_correcta === true ||
                op?.correcta === 1 ||
                op?.correcta === true ||
                op?.esCorrecta === true ||
                op?.is_correct === true ||
                op?.es_correcta === "1"
            );

            return {
              ...pq,
              opciones: opciones || [],
              // si no existiera ninguna marca, queda undefined
              correctaIndex: correctaIdx !== -1 ? correctaIdx : undefined,
            };
          })
        );

        setExamen(ex || null);
        setPreguntas(preguntasConOpciones);

        // Si hay usuario autenticado, cargar intentos previos
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const id_usuario = userData?.id || userData?.id_usuario || null;
        if (id_usuario) {
          await fetchIntentos(id_usuario, id);
        }
      } catch (err) {
        console.error("Error cargando examen:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  // Función para obtener intentos del backend y calcular mejor puntaje
  const fetchIntentos = async (id_usuario, id_examen) => {
    try {
      const res = await obtenerIntentosPorUsuarioYExamen(
        id_usuario,
        id_examen
      ).catch(() => []);
      // estructura esperada: array de intentos con { intento_num, puntaje_total, fecha, ... }
      const lista = Array.isArray(res) ? res : [];
      setIntentos(lista);
      if (lista.length > 0) {
        const mejores = lista.reduce((max, it) => {
          const val = Number(it.puntaje_total ?? it.puntaje ?? 0);
          return val > max ? val : max;
        }, -Infinity);
        setMejorPuntaje(Number.isFinite(mejores) ? mejores : null);
      } else {
        setMejorPuntaje(null);
      }
    } catch (e) {
      console.warn("No se pudieron cargar intentos:", e);
      setIntentos([]);
      setMejorPuntaje(null);
    }
  };

  useEffect(() => {
    if (!loading && !result) {
      const timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [loading, result]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelect = (pregId, optionId) => {
    setAnswers((s) => ({ ...s, [pregId]: optionId }));
  };

  const getProgressPercentage = () => {
    const answered = Object.keys(answers).length;
    return preguntas.length ? (answered / preguntas.length) * 100 : 0;
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const unanswered = preguntas.filter(
      (p) => typeof answers[p.id] === "undefined"
    );

    if (unanswered.length > 0) {
      const ok = window.confirm(
        `Tienes ${unanswered.length} pregunta(s) sin responder. ¿Deseas enviar el examen de todos modos?`
      );
      if (!ok) return;
    }

    setSubmitting(true);
    try {
      // Calcular correctas, puntaje obtenido por pregunta y puntaje máximo
      let correct = 0;
      let puntosObtenidos = 0;
      let puntosMaximos = 0;

      preguntas.forEach((p) => {
        const puntajePregunta =
          typeof p.puntaje !== "undefined" ? Number(p.puntaje) : 1;
        puntosMaximos += puntajePregunta;

        const selectedOptionId = answers[p.id];
        if (!selectedOptionId) return;
        const opciones = p.opciones || [];
        const selected = opciones.find(
          (o) => Number(o.id) === Number(selectedOptionId)
        );
        if (selected) {
          const isCorrect =
            selected?.es_correcta === 1 ||
            selected?.es_correcta === true ||
            selected?.es_correcta === "1" ||
            selected?.correcta === 1 ||
            selected?.correcta === true ||
            selected?.is_correct === true;
          if (isCorrect) {
            correct++;
            puntosObtenidos += puntajePregunta;
          }
        }
      });

      const total = preguntas.length;
      const percent = puntosMaximos
        ? Math.round((puntosObtenidos / puntosMaximos) * 100)
        : 0;
      setResult({ correct, total, percent, puntosObtenidos, puntosMaximos });

      try {
        // intentar obtener id de usuario desde localStorage (si aplica)
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const id_usuario = userData?.id || userData?.id_usuario || null;

        // Construir payload con id_opcion y puntaje por respuesta
        const respuestasPayload = Object.entries(answers).map(
          ([pregId, optId]) => {
            const pregunta = preguntas.find(
              (p) => Number(p.id) === Number(pregId)
            );
            const opcion = pregunta?.opciones?.find(
              (o) => Number(o.id) === Number(optId)
            );
            const puntaje_obtenido = opcion
              ? opcion.es_correcta === 1 ||
                opcion.es_correcta === true ||
                opcion.es_correcta === "1"
                ? 1
                : 0
              : 0;
            return {
              id_pregunta: Number(pregId),
              id_opcion: Number(optId),
              puntaje_obtenido,
            };
          }
        );

        const payload = {
          id_examen: Number(id),
          respuestas: respuestasPayload,
          ...(id_usuario ? { id_usuario } : {}),
        };

        if (id_usuario) {
          await registrarRespuestas(payload).catch(() => null);

          const intentoPayload = {
            id_examen: Number(id),
            // Guardar puntaje en puntos (suma de puntajes por pregunta)
            puntaje_total:
              typeof puntosObtenidos !== "undefined"
                ? Number(puntosObtenidos)
                : 0,
            id_usuario,
          };
          await registrarIntento(intentoPayload).catch(() => null);

          // refrescar intentos y mejor puntaje luego de registrar
          await fetchIntentos(id_usuario, id);
        } else {
          console.warn(
            "Usuario no autenticado: no se guardarán respuestas ni intentos en backend"
          );
        }
      } catch (e) {
        console.warn("No se pudo registrar resultado en backend:", e);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="exam-loading">
        <div className="loading-spinner"></div>
        <p>Cargando examen...</p>
      </div>
    );
  }

  if (!examen) {
    return (
      <div className="exam-error">
        <div className="error-icon">
          <FiAlertCircle size={72} />
        </div>
        <h2>Examen no encontrado</h2>
        <p>No se pudo cargar el examen solicitado</p>
        <button className="btn-primary" onClick={() => navigate(-1)}>
          <FiArrowLeft />
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="exam-page">
      {!result ? (
        <>
          <div className="exam-header">
            <div className="exam-header-content">
              <button className="btn-back" onClick={() => navigate(-1)}>
                <FiArrowLeft size={18} />
                Volver
              </button>
              <div className="exam-info">
                <h1 className="exam-title">{examen.titulo || "Examen"}</h1>
                {examen.descripcion && (
                  <p className="exam-description">{examen.descripcion}</p>
                )}
              </div>
            </div>

            <div className="exam-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <FiFileText />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Preguntas</span>
                  <span className="stat-value">{preguntas.length}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FiClock />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Tiempo</span>
                  <span className="stat-value">{formatTime(timeElapsed)}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FiCheckCircle />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Respondidas</span>
                  <span className="stat-value">
                    {Object.keys(answers).length}/{preguntas.length}
                  </span>
                </div>
              </div>

              {/* Nuevo: intentos y mejor puntaje */}
              <div className="stat-card">
                <div className="stat-icon">
                  <FiSend />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Intentos</span>
                  <span className="stat-value">{intentos.length}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FiCheckCircle />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Mejor Puntaje</span>
                  <span className="stat-value">
                    {mejorPuntaje !== null
                      ? Number(mejorPuntaje).toFixed(2)
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
              <span className="progress-text">
                {Math.round(getProgressPercentage())}% completado
              </span>
            </div>
          </div>

          <div className="exam-content">
            <div className="questions-container">
              {preguntas.map((preg, pi) => {
                const isAnswered = typeof answers[preg.id] !== "undefined";

                return (
                  <div
                    key={preg.id || pi}
                    className={`question-card ${isAnswered ? "answered" : ""}`}
                  >
                    <div className="question-header">
                      <span className="question-number">
                        <IoBookOutline size={16} />
                        Pregunta {pi + 1}
                      </span>
                      {isAnswered && (
                        <span className="answered-badge">
                          <HiOutlineCheckCircle size={16} />
                          Respondida
                        </span>
                      )}
                    </div>

                    <h3 className="question-text">{preg.texto}</h3>

                    <div className="options-container">
                      {(preg.opciones || []).map((opt, oi) => (
                        <label
                          key={opt?.id ?? oi}
                          className={`option-label ${
                            answers[preg.id] === (opt?.id ?? oi)
                              ? "selected"
                              : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name={`preg-${preg.id}`}
                            checked={
                              Number(answers[preg.id]) === Number(opt?.id ?? oi)
                            }
                            onChange={() =>
                              handleSelect(preg.id, opt?.id ?? oi)
                            }
                            className="option-radio"
                          />
                          <span className="option-indicator">
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span className="option-text">
                            {opt.texto ?? opt}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="exam-actions">
              <button
                className="btn-submit-examen"
                onClick={handleSubmit}
                disabled={submitting || preguntas.length === 0}
              >
                {submitting ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <FiSend size={20} />
                    Finalizar Examen
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="exam-result">
          <div className="result-card">
            <div className="result-icon">
              {result.percent >= 70 ? (
                <IoTrophyOutline style={{ color: "#1db178" }} />
              ) : result.percent >= 50 ? (
                <IoBookOutline style={{ color: "#1d6eb1" }} />
              ) : (
                <FiAlertCircle style={{ color: "#f59e0b" }} />
              )}
            </div>

            <h2 className="result-title">
              {result.percent >= 70
                ? "¡Excelente trabajo!"
                : result.percent >= 50
                ? "Buen intento"
                : "Sigue practicando"}
            </h2>

            <div className="result-score">
              <div className="score-circle">
                <svg className="score-ring" viewBox="0 0 120 120">
                  <defs>
                    <linearGradient
                      id="gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#1db178" />
                      <stop offset="100%" stopColor="#1d6eb1" />
                    </linearGradient>
                  </defs>
                  <circle className="score-ring-bg" cx="60" cy="60" r="54" />
                  <circle
                    className="score-ring-fill"
                    cx="60"
                    cy="60"
                    r="54"
                    style={{
                      strokeDasharray: `${
                        (result.percent / 100) * 339.292
                      } 339.292`,
                    }}
                  />
                </svg>
                <div className="score-value">
                  <span className="score-percent">{result.percent}</span>
                  <span className="score-symbol">%</span>
                </div>
              </div>
            </div>

            <div className="result-details">
              <div className="result-stat">
                <span className="result-stat-label">
                  <FiCheckCircle
                    style={{ display: "inline", marginRight: 6 }}
                  />
                  Correctas
                </span>
                <span className="result-stat-value">
                  {result.correct} / {result.total}
                </span>
              </div>

              <div className="result-stat">
                <span className="result-stat-label">
                  <IoTimeOutline
                    style={{ display: "inline", marginRight: 6 }}
                  />
                  Tiempo Total
                </span>
                <span className="result-stat-value">
                  {formatTime(timeElapsed)}
                </span>
              </div>

              <div className="result-stat">
                <span className="result-stat-label">Puntaje obtenido</span>
                <span className="result-stat-value">
                  {typeof result.puntosObtenidos !== "undefined"
                    ? `${result.puntosObtenidos} / ${result.puntosMaximos}`
                    : "-"}
                </span>
              </div>
            </div>

            {/* Listado de intentos previos */}
            <div style={{ marginTop: 18, width: "100%" }}>
              <h4>Intentos previos</h4>
              {intentos.length > 0 ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {intentos
                    .slice()
                    .sort((a, b) => (b.intento_num || 0) - (a.intento_num || 0))
                    .map((it, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          background: "#fafafa",
                          borderRadius: 8,
                          border: "1px solid #eee",
                        }}
                      >
                        <div>
                          Intento #{it.intento_num ?? idx + 1}
                          <div style={{ fontSize: 12, color: "#666" }}>
                            {it.fecha || it.created_at
                              ? new Date(
                                  it.fecha || it.created_at
                                ).toLocaleString()
                              : ""}
                          </div>
                        </div>
                        <div style={{ fontWeight: 700 }}>
                          {it.puntaje_total ?? it.puntaje ?? 0}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div style={{ color: "#666" }}>No hay intentos registrados</div>
              )}
            </div>

            <div className="result-actions">
              <button className="btn-primary" onClick={() => navigate(-1)}>
                <FiArrowLeft />
                Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
