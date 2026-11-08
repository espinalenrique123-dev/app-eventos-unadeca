import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatEventDate } from '../data/events';
import PhoneStatusBar from '../components/PhoneStatusBar';

export default function ManagerPage({ events = [], onDelete, eventsLoading, eventsError, onRetry }) {
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const totalCount = events.length;
  const publishedCount = events.filter((event) => Number(event.capacity) > 0).length;
  const fullCount = events.filter((event) => Number(event.capacity) === 0).length;
  const registeredCount = events.reduce(
    (total, event) => total + Number(event.registrations?.length || 0),
    0
  );

  const handleDelete = async (id) => {
    if (window.confirm('¿Deseas eliminar este evento?')) {
      setError('');
      setDeletingId(id);
      try {
        await onDelete(id);
      } catch (deleteError) {
        setError(deleteError.message || 'No se pudo eliminar el evento.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <main className="manager-shell">
      <div className="manager-panel">
        <header className="manager-header-bar">
          <PhoneStatusBar variant="detail" />

          <div className="manager-topbar">
            <Link to="/dashboard" className="manager-back-link" aria-label="Volver al dashboard">&lt;</Link>
            <div className="manager-icon">◫</div>
            <div className="manager-title-wrap">
              <h1>Panel de eventos</h1>
              <p>Administración</p>
            </div>
            <div className="manager-avatar">CM</div>
          </div>
        </header>

        <section className="manager-stats">
          <div className="stat-card blue">
            <strong>{totalCount}</strong>
            <span>Total</span>
          </div>
          <div className="stat-card beige">
            <strong>{publishedCount}</strong>
            <span>Activos</span>
          </div>
          <div className="stat-card red">
            <strong>{registeredCount}</strong>
            <span>Asistentes</span>
          </div>
        </section>

        <div className="manager-create-btn-wrap">
          <Link to="/eventos/nuevo" className="manager-create-btn">+ Crear nuevo evento</Link>
        </div>

        <section className="manager-list-block">
          <h2>Eventos publicados</h2>
          {error && <p className="error-message" role="alert">{error}</p>}
          {eventsError && (
            <div className="error-message" role="alert">
              <p>{eventsError}</p>
              <button type="button" className="manager-link" onClick={onRetry}>Volver a intentar</button>
            </div>
          )}
          {eventsLoading && events.length === 0 && (
            <p className="empty-events" role="status">Cargando eventos...</p>
          )}

          {!eventsLoading && events.map((event) => {
            const isFull = Number(event.capacity) === 0;

            return (
              <article key={event.id} className={`manager-event ${isFull ? 'full' : 'active'}`}>
                <div className="manager-event-accent" />
                <div className="manager-event-content">
                  <h3>{event.title}</h3>
                  <p>Fecha: {formatEventDate(event)} | Cupos: {event.capacity}</p>

                  <div className="manager-event-footer">
                    <span className={`manager-status ${isFull ? 'full-status' : 'published'}`}>
                      {isFull ? 'Cupo lleno' : 'Publicado'}
                    </span>

                    <div className="manager-actions">
                      <Link to={`/eventos/${event.id}`} className="manager-link">Ver</Link>
                      <Link to={`/asistencia/${event.id}`} className="manager-link">Asistencia</Link>
                      <Link to={`/eventos/editar/${event.id}`} className="manager-link">Editar</Link>
                      <button type="button" className="manager-link danger" onClick={() => handleDelete(event.id)} disabled={deletingId === event.id}>
                        {deletingId === event.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {!eventsLoading && !eventsError && events.length === 0 && (
            <p className="empty-events">No hay eventos para mostrar.</p>
          )}
        </section>
      </div>
    </main>
  );
}
