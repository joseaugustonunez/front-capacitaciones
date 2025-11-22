import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  BookOpen,
  TrendingUp,
  Award,
  Calendar,
  Clock,
} from "lucide-react";
import "../styles/inicioAdmin.css";
import {
  obtenerTotales,
  totalInscritos,
  matriculasCertificadosPorMes,
  obtenerProgresoUsuario,
  obtenerProcesoCurso,
} from "../api/Estadisticas";

const InicioAdmin = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("mensual");
  const [cursosInscritos, setCursosInscritos] = useState([]);
  const [progresoUsuarios, setProgresoUsuarios] = useState([]);
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    total_estudiantes: 0,
    total_cursos: 0,
    total_certificados: 0,
    tasa_finalizacion: 0,
  });
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroCurso, setFiltroCurso] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("all"); // all | high | medium | low

  useEffect(() => {
    const fetchEstadisticas = async () => {
      try {
        const data = await obtenerTotales();
        setEstadisticas(data);
      } catch (error) {
        console.error("Error al obtener estadísticas:", error);
      }
    };

    const fetchCursosInscritos = async () => {
      try {
        const data = await totalInscritos();
        const paleta = ["#1db178", "#a2e4cc", "#157a58", "#1d6eb1", "#f8f8f8"];
        const cursosConColor = data.map((curso, index) => ({
          ...curso,
          color: paleta[index % paleta.length],
        }));
        setCursosInscritos(cursosConColor);
      } catch (error) {
        console.error("Error al obtener cursos con inscritos:", error);
      }
    };

    const fetchEnrollment = async () => {
      try {
        const data = await matriculasCertificadosPorMes();
        setEnrollmentData(data);
      } catch (error) {
        console.error("Error al obtener matrículas y certificados:", error);
      }
    };

    const fetchProgresoUsuarios = async () => {
      try {
        const data = await obtenerProgresoUsuario();
        setProgresoUsuarios(data);
      } catch (error) {
        console.error("Error al obtener progreso de usuarios:", error);
      }
    };

    const fetchProgresoCurso = async () => {
      try {
        const data = await obtenerProcesoCurso(); // tu endpoint
        const transformed = data.map((curso) => {
          const total = curso.completaron + curso.no_completaron;
          return {
            curso: curso.curso,
            completado:
              total > 0 ? Math.round((curso.completaron / total) * 100) : 0,
            abandonado:
              total > 0 ? Math.round((curso.no_completaron / total) * 100) : 0,
          };
        });
        setProgressData(transformed);
      } catch (error) {
        console.error("Error al obtener progreso por curso:", error);
      }
    };

    fetchEstadisticas();
    fetchCursosInscritos();
    fetchEnrollment();
    fetchProgresoUsuarios();
    fetchProgresoCurso(); // <-- llamamos a la nueva función
  }, []);

  // Filtrado memoizado para la lista de progreso por usuario
  const filteredProgresoUsuarios = useMemo(() => {
    return progresoUsuarios.filter((item) => {
      const nombreMatch = filtroNombre
        ? (item.nombre_completo || "")
            .toString()
            .toLowerCase()
            .includes(filtroNombre.toLowerCase())
        : true;

      const cursoMatch = filtroCurso
        ? (item.nombre_curso || "")
            .toString()
            .toLowerCase()
            .includes(filtroCurso.toLowerCase())
        : true;

      const porcentaje = Number(item.porcentaje_avance ?? 0);
      let estadoMatch = true;
      if (filtroEstado === "high") estadoMatch = porcentaje >= 80;
      else if (filtroEstado === "medium")
        estadoMatch = porcentaje >= 50 && porcentaje < 80;
      else if (filtroEstado === "low") estadoMatch = porcentaje < 50;

      return nombreMatch && cursoMatch && estadoMatch;
    });
  }, [progresoUsuarios, filtroNombre, filtroCurso, filtroEstado]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard de Cursos en Línea</h1>
        <div className="period-selector">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-select"
          >
            <option value="semanal">Esta Semana</option>
            <option value="mensual">Este Mes</option>
            <option value="trimestral">Último Trimestre</option>
            <option value="anual">Este Año</option>
          </select>
        </div>
      </div>

      {/* Tarjetas de estadísticas principales */}
      <div className="stats-grid">
        {/* Total Alumnos */}
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: "#1db178" }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Alumnos</h3>
            <div className="stat-value">
              <span className="value">{estadisticas.total_estudiantes}</span>
              <span className="change positive">Alumnos</span>
            </div>
          </div>
        </div>

        {/* Cursos Activos */}
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: "#1d6eb1" }}>
            <BookOpen size={24} />
          </div>
          <div className="stat-content">
            <h3>Cursos Activos</h3>
            <div className="stat-value">
              <span className="value">{estadisticas.total_cursos}</span>
              <span className="change positive">Activos</span>
            </div>
          </div>
        </div>

        {/* Certificados */}
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: "#157a58" }}>
            <Award size={24} />
          </div>
          <div className="stat-content">
            <h3>Certificados</h3>
            <div className="stat-value">
              <span className="value">{estadisticas.total_certificados}</span>
              <span className="change positive">Certificados</span>
            </div>
          </div>
        </div>

        {/* Tasa de Finalización */}
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: "#1db178" }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Tasa de Finalización</h3>
            <div className="stat-value">
              <span className="value">{estadisticas.tasa_finalizacion}%</span>
              <span className="change positive">Total</span>
            </div>
          </div>
        </div>
      </div>
      {/* Gráficos principales */}
      <div className="charts-row">
        {/* Gráfico de matrículas y certificaciones */}
        <div className="chart-container large">
          <h2>Matrículas y Certificaciones</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={enrollmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="alumnos" fill="#1db178" name="Total de Alumnos" />
              <Bar dataKey="certificados" fill="#1d6eb1" name="Certificados" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico circular de popularidad de cursos */}
        <div className="chart-container">
          <h2>Popularidad de Cursos</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={cursosInscritos}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="total_inscritos"
                label={({
                  cx,
                  cy,
                  midAngle,
                  innerRadius,
                  outerRadius,
                  percent,
                  nombre_curso,
                  total_inscritos,
                }) => {
                  const RADIAN = Math.PI / 180;
                  // Calcular posición desplazada hacia afuera del sector
                  const radius = outerRadius + 30; // más grande = más lejos del círculo
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);

                  // Dividir nombre si es muy largo
                  const maxLength = 12;
                  const firstLine =
                    nombre_curso.length > maxLength
                      ? nombre_curso.substring(0, maxLength)
                      : nombre_curso;
                  const secondLine =
                    nombre_curso.length > maxLength
                      ? nombre_curso.substring(maxLength)
                      : "";

                  return (
                    <text
                      x={x}
                      y={y}
                      textAnchor={x > cx ? "start" : "end"} // cambia la alineación según el lado
                      dominantBaseline="central"
                      fontSize={14} // más grande
                    >
                      <tspan x={x}>{firstLine}</tspan>
                      {secondLine && (
                        <tspan x={x} dy="1.2em">
                          {secondLine}
                        </tspan>
                      )}
                      <tspan x={x} dy="1.2em">
                        ({total_inscritos}) {(percent * 100).toFixed(0)}%
                      </tspan>
                    </text>
                  );
                }}
              >
                {cursosInscritos.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>

              <Tooltip
                formatter={(value) => [`${value} inscritos`, "Inscritos"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Segunda fila de gráficos */}
      <div className="charts-row">
        {/* Progreso por curso mejorado */}
        <div
          className="chart-container"
          style={{ height: "400px", minWidth: "300px" }}
        >
          <h2>Progreso por Curso</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={progressData}
              layout="vertical"
              margin={{ bottom: 60 }} // reducimos left en móviles
              barGap={10}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
              />
              <YAxis
                dataKey="curso"
                type="category"
                width={200}
                tick={{ fontSize: 14 }}
              />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Bar
                dataKey="completado"
                fill="#1db178"
                name="Completado %"
                radius={[10, 10, 10, 10]}
              />
              <Bar
                dataKey="abandonado"
                fill="#157a58"
                name="Abandonado %"
                radius={[10, 10, 10, 10]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lista de estudiantes recientes */}
        <div className="chart-container">
          <h2>Progreso por Usuario</h2>
          {/* Filtros rápidos */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #dfeff2",
                minWidth: 180,
              }}
            />
            <input
              type="text"
              placeholder="Buscar por curso..."
              value={filtroCurso}
              onChange={(e) => setFiltroCurso(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #dfeff2",
                minWidth: 180,
              }}
            />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #dfeff2",
              }}
            >
              <option value="all">Todos los estados</option>
              <option value="high">Alto (≥80%)</option>
              <option value="medium">Medio (50-79%)</option>
              <option value="low">Bajo (&lt;50%)</option>
            </select>
            <button
              onClick={() => {
                setFiltroNombre("");
                setFiltroCurso("");
                setFiltroEstado("all");
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                background: "#1db178",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Limpiar
            </button>
          </div>

          <div className="recent-students">
            {filteredProgresoUsuarios.map((item, index) => (
              <div key={index} className="student-item">
                <div className="student-info">
                  <span className="student-name">{item.nombre_completo}</span>
                  <span className="student-course">{item.nombre_curso}</span>
                </div>
                <div className="student-progress">
                  <div className="progress-bar-dash">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${item.porcentaje_avance}%`,
                        backgroundColor:
                          item.porcentaje_avance >= 80
                            ? "#1db178"
                            : item.porcentaje_avance >= 50
                            ? "#1d6eb1"
                            : "#157a58",
                      }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {item.porcentaje_avance}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer con información adicional */}
      <div className="dashboard-footer">
        <div className="footer-stats">
          <div className="footer-stat">
            <Calendar size={20} />
            <span>Última actualización: {new Date().toLocaleDateString()}</span>
          </div>
          <div className="footer-stat">
            <Clock size={20} />
            <span>Tiempo promedio de curso: 6.5 horas</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InicioAdmin;
