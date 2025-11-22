import React, { useEffect, useState } from 'react';
import {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria
} from '../api/Categorias';
import {
  FolderOpen,
  Plus,
  Edit3,
  Trash2,
  Search,
  AlertTriangle,
  X,
  Loader2,
  Package,
  Tag
} from 'lucide-react';
import '../styles/categorias.css';
import toast from "react-hot-toast";
const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', icono: '' });
  const [editandoId, setEditandoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const iconosDisponibles = [
    { name: 'Tag', component: Tag, label: 'Etiqueta' },
    { name: 'Package', component: Package, label: 'Paquete' },
    { name: 'FolderOpen', component: FolderOpen, label: 'Carpeta' },
    { name: 'Plus', component: Plus, label: 'Más' },
    { name: 'Edit3', component: Edit3, label: 'Editar' },
    { name: 'Search', component: Search, label: 'Buscar' },
  ];

  const obtenerIconoComponente = (nombreIcono) => {
    const iconoEncontrado = iconosDisponibles.find(i => i.name === nombreIcono);
    return iconoEncontrado ? iconoEncontrado.component : Tag;
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await obtenerCategorias();
      setCategorias(data);
    } catch (err) {
      setError('Error al cargar las categorías');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const manejarCambio = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim() || !formData.descripcion.trim()) {
      setError('Nombre y descripción son requeridos');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      if (editandoId) {
        await actualizarCategoria(editandoId, formData);
      } else {
        await crearCategoria(formData);
      }
      
      setFormData({ nombre: '', descripcion: '', icono: '' });
      setEditandoId(null);
      await cargarCategorias();
    } catch (err) {
      setError('Error al guardar la categoría');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const manejarEditar = (categoria) => {
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
      icono: categoria.icono || '',
    });
    setEditandoId(categoria.id);
    setError('');
  };

  const manejarCancelar = () => {
    setFormData({ nombre: '', descripcion: '', icono: '' });
    setEditandoId(null);
    setError('');
  };

const manejarEliminar = (id, nombre) => {
  toast((t) => (
    <div className="toast-confirm-container">
      <span className="toast-confirm-text">
        ¿Eliminar la categoría <b>"{nombre}"</b>?
      </span>
      <div className="toast-confirm-actions">
        <button
          className="btn-confirm btn-danger"
          onClick={async () => {
            toast.dismiss(t.id); // Cerrar confirmación
            try {
              setLoading(true);
              await eliminarCategoria(id);
              toast.success(`Categoría "${nombre}" eliminada correctamente`);
              await cargarCategorias();
            } catch (err) {
              console.error("Error al eliminar la categoría:", err);
              toast.error("Error al eliminar la categoría");
              setError("Error al eliminar la categoría");
            } finally {
              setLoading(false);
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
  ));
};

  const categoriasFiltradas = categorias.filter(categoria =>
    categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    categoria.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="categorias-container">
      <div className="categorias-header">
        <h1 className="categorias-title">
          <FolderOpen className="title-icon" size={36} />
          Gestión de Categorías
        </h1>
        <p className="categorias-subtitle">
          Administra las categorías de tu sistema
        </p>
      </div>

      {error && (
        <div className="error-message">
          <AlertTriangle className="error-icon" size={20} />
          {error}
        </div>
      )}
      <div className="categorias-content">
        <div className="form-section-cate">
          <h2 className="section-title-cate">
            {editandoId ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          
          <form onSubmit={manejarSubmit} className="categoria-form">
            <div className="form-group">
              <label htmlFor="nombre" className="form-label-categorias">
                Nombre *
              </label>
              <input
                id="nombre"
                type="text"
                name="nombre"
                placeholder="Ingresa el nombre de la categoría"
                value={formData.nombre}
                onChange={manejarCambio}
                className="form-input"
                disabled={loading}
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label htmlFor="descripcion" className="form-label">
                Descripción *
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                placeholder="Describe la categoría"
                value={formData.descripcion}
                onChange={manejarCambio}
                className="form-textarea"
                disabled={loading}
                maxLength={200}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="icono" className="form-label">
                Icono
              </label>
              <div className="icono-selector">
                <div className="iconos-grid">
                  {iconosDisponibles.map((icono) => {
                    const IconComponent = icono.component;
                    return (
                      <button
                        key={icono.name}
                        type="button"
                        className={`icono-option ${formData.icono === icono.name ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, icono: icono.name })}
                        title={icono.label}
                        disabled={loading}
                      >
                        <IconComponent size={20} />
                      </button>
                    );
                  })}
                </div>
                {formData.icono && (
                  <div className="icono-preview">
                    <span>Vista previa: </span>
                    {React.createElement(obtenerIconoComponente(formData.icono), { size: 24 })}
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="loading-spinner" size={16} />
                ) : (
                  <>
                    {editandoId ? (
                      <Edit3 className="btn-icon" size={16} />
                    ) : (
                      <Plus className="btn-icon" size={16} />
                    )}
                    {editandoId ? 'Actualizar' : 'Crear'}
                  </>
                )}
              </button>
              
              {editandoId && (
                <button 
                  type="button" 
                  onClick={manejarCancelar}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  <X className="btn-icon" size={16} />
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="list-section">
          <div className="list-header">
            <h2 className="section-title-cate">
              Categorías ({categorias.length})
            </h2>
            
            <div className="search-container">
              <input
                type="text"
                placeholder="Buscar categorías..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <Search className="search-icon" size={16} />
            </div>
          </div>

          {loading && categorias.length === 0 ? (
            <div className="loading-state">
              <Loader2 className="loading-spinner-large" size={48} />
              <p>Cargando categorías...</p>
            </div>
          ) : categoriasFiltradas.length === 0 ? (
            <div className="empty-state">
              <Package className="empty-icon" size={48} />
              <h3>No hay categorías</h3>
              <p>
                {categorias.length === 0 
                  ? 'Comienza creando tu primera categoría'
                  : 'No se encontraron categorías con ese término'
                }
              </p>
            </div>
          ) : (
            <div className="categorias-grid">
              {categoriasFiltradas.map((categoria) => {
                const IconoCategoria = obtenerIconoComponente(categoria.icono);
                return (
                  <div key={categoria.id} className="categoria-card">
                    <div className="card-header">
                      <div className="categoria-icono">
                        <IconoCategoria size={24} />
                      </div>
                      <div className="categoria-info">
                        <h3 className="categoria-nombre">{categoria.nombre}</h3>
                        <p className="categoria-descripcion">{categoria.descripcion}</p>
                      </div>
                    </div>
                    
                    <div className="card-actions">
                      <button
                        onClick={() => manejarEditar(categoria)}
                        className="btn btn-edit"
                        disabled={loading}
                        title="Editar categoría"
                      >
                        <Edit3 className="btn-icon" size={14} />
                        Editar
                      </button>
                      <button
                        onClick={() => manejarEliminar(categoria.id, categoria.nombre)}
                        className="btn btn-delete"
                        disabled={loading}
                        title="Eliminar categoría"
                      >
                        <Trash2 className="btn-icon" size={14} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Categorias;