import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PhoneStatusBar from '../components/PhoneStatusBar';

const initialForm = {
  title: '',
  category: 'Academico',
  date: '',
  location: '',
  capacity: 50,
  price: 0,
  description: ''
};

export default function EventFormPage({ events, onSave }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const existingEvent = events?.find((event) => event.id === Number(id));

  const [form, setForm] = useState(existingEvent || initialForm);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(existingEvent || initialForm);
  }, [existingEvent]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      await onSave({
        ...form,
        id: existingEvent ? existingEvent.id : Date.now(),
        capacity: Number(form.capacity),
        price: Number(form.price)
      });
      navigate('/dashboard');
    } catch (saveError) {
      setError(saveError.message || 'No se pudo guardar el evento.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="form-shell create-event-shell">
      <div className="create-event-card">
        <header className="create-event-header">
          <PhoneStatusBar variant="detail" />
          <div className="create-event-topbar">
            <button type="button" className="back-arrow" onClick={() => navigate('/dashboard')} aria-label="Volver">
              &lt;
            </button>
            <span>Crear nuevo evento</span>
          </div>
        </header>

        <div className="create-event-step">Paso 2 de 3 - Información del evento</div>

        <form onSubmit={handleSubmit} className="create-event-form">
          <label className="field-group">
            <span>Nombre del evento <span className="required">*</span></span>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ej: Feria Tecnologica 2026"
              required
            />
          </label>

          <label className="field-group">
            <span>Descripción <span className="required">*</span></span>
            <textarea
              name="description"
              rows="4"
              value={form.description}
              onChange={handleChange}
              placeholder=""
            />
          </label>

          <div className="field-grid two-cols">
            <label className="field-group">
              <span>Categoría <span className="required">*</span></span>
              <select name="category" value={form.category} onChange={handleChange}>
                <option value="Academico">Seleccionar</option>
                <option value="Academico">Academico</option>
                <option value="Cultural">Cultural</option>
                <option value="Deportivo">Deportivo</option>
              </select>
            </label>

            <label className="field-group">
              <span>Fecha <span className="required">*</span></span>
              <input type="date" name="date" value={form.date} onChange={handleChange} required />
            </label>
          </div>

          <div className="field-grid two-cols">
            <label className="field-group">
              <span>Hora inicio <span className="required">*</span></span>
              <input type="time" name="time" value={form.time || ''} onChange={handleChange} required />
            </label>

            <label className="field-group">
              <span>Hora fin <span className="required">*</span></span>
              <input type="time" name="endTime" value={form.endTime || ''} onChange={handleChange} required />
            </label>
          </div>

          <label className="field-group">
            <span>Lugar / Ubicación <span className="required">*</span></span>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Ej: Auditorio principal, UNADECA"
              required
            />
          </label>

          <label className="field-group">
            <span>Cupo maximo <span className="required">*</span></span>
            <input
              type="number"
              name="capacity"
              min="0"
              value={form.capacity}
              onChange={handleChange}
              placeholder="Ej: 50"
              required
            />
          </label>

          <small className="mandatory-note">* Todos los campos marcados son obligatorios</small>
          {error && <p className="error-message" role="alert">{error}</p>}

          <div className="create-event-actions">
            <button type="submit" className="primary-btn create-main-button" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Publicar evento'}
            </button>
            <button type="button" className="ghost-btn create-cancel-button" onClick={() => navigate('/dashboard')}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
