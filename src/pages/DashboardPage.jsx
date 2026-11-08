import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatEventDate } from '../data/events';
import PhoneStatusBar from '../components/PhoneStatusBar';

export default function DashboardPage({ user, events, eventsLoading, eventsError, onRetry }) {
  const categories = ['Todos', 'Academico', 'Cultural', 'Deportivo'];
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  const accentByCategory = {
    Academico: 'academico',
    Cultural: 'cultural',
    Deportivo: 'deportivo',
    default: 'default'
  };

  const visibleEvents = events.filter((event) => {
    const matchesSearch = `${event.title} ${event.location}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    return matchesSearch && (activeCategory === 'Todos' || event.category === activeCategory);
  });

  return (
    <main className="events-shell">
      <div className="mobile-card">
        <PhoneStatusBar />

        <header className="events-header">
          <h1>Eventos disponibles</h1>
          <Link
            to="/perfil"
            className="avatar"
            aria-label="Abrir mi perfil"
            title="Mi perfil"
          >
            {(user?.name || user?.email || 'U').trim().charAt(0).toUpperCase()}
          </Link>
        </header>

        <div className="search-row">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar eventos..."
          />
          <button type="button" className="filter-btn">filtro</button>
        </div>

        <div className="chip-row">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`chip ${activeCategory === category ? 'active' : ''}`}
              aria-pressed={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <section className="event-list-panel">
          {eventsLoading && <p className="empty-events" role="status">Cargando eventos...</p>}
          {eventsError && (
            <div className="error-message" role="alert">
              <p>{eventsError}</p>
              <button type="button" onClick={onRetry}>Volver a intentar</button>
            </div>
          )}
          {visibleEvents.map((event) => {
            const accent = accentByCategory[event.category] || accentByCategory.default;

            return (
              <article key={event.id} className={`event-card ${accent}`}>
                <div className="event-accent" />
                <div className="event-content">
                  <span className="event-tag">{event.category}</span>
                  <h3>{event.title}</h3>
                  <p>Fecha: {formatEventDate(event)}</p>
                  <p>Lugar: {event.location}</p>
                  <p className={`event-availability ${event.capacity === 0 ? 'full' : 'available'}`}>
                    {event.capacity === 0 ? 'CUPO LLENO' : `${event.capacity} cupos disponibles`}
                  </p>

                  <div className="event-footer">
                    <Link to={`/eventos/${event.id}`} className="detail-link">Ver detalle <span>&gt;</span></Link>
                  </div>
                </div>
              </article>
            );
          })}
          {!eventsLoading && !eventsError && visibleEvents.length === 0 && (
            <p className="empty-events">No hay eventos para mostrar.</p>
          )}
        </section>
      </div>
    </main>
  );
}
