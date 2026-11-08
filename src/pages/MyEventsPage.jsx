import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatEventDate } from '../data/events';
import PhoneStatusBar from '../components/PhoneStatusBar';

const TABS = [
  { key: 'upcoming', label: 'Próximos', status: 'Inscrito', className: 'available' },
  { key: 'past', label: 'Realizados', status: 'Realizado', className: 'done' },
  { key: 'cancelled', label: 'Cancelados', status: 'Cancelado', className: 'full' }
];

const accentByCategory = {
  Academico: 'academico',
  Cultural: 'cultural',
  Deportivo: 'deportivo'
};

function getEventStatus(event, today) {
  if (event.status === 'cancelled') return 'cancelled';
  return event.date < today ? 'past' : 'upcoming';
}

export default function MyEventsPage({ user, events = [] }) {
  const [activeTab, setActiveTab] = useState('upcoming');
  const email = String(user?.email || user?.name || '').toLowerCase();
  const today = new Date().toISOString().slice(0, 10);

  const myEvents = events
    .filter((event) => (event.registrations || []).some((entry) => String(entry).toLowerCase() === email))
    .map((event) => ({ ...event, myStatus: getEventStatus(event, today) }))
    .sort((first, second) => first.date.localeCompare(second.date));

  const currentTab = TABS.find((tab) => tab.key === activeTab);
  const visibleEvents = myEvents.filter((event) => event.myStatus === activeTab);

  return (
    <main className="events-shell">
      <div className="mobile-card my-events-card">
        <PhoneStatusBar />

        <header className="events-header">
          <h1>Mis eventos</h1>
          <Link
            to="/perfil"
            className="avatar"
            aria-label="Abrir mi perfil"
            title="Mi perfil"
          >
            {(user?.name || user?.email || 'U').trim().charAt(0).toUpperCase()}
          </Link>
        </header>

        <div className="chip-row">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`chip ${activeTab === tab.key ? 'active' : ''}`}
              aria-pressed={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label} ({myEvents.filter((event) => event.myStatus === tab.key).length})
            </button>
          ))}
        </div>

        <section className="event-list-panel">
          {visibleEvents.map((event) => (
            <article key={event.id} className={`event-card ${accentByCategory[event.category] || 'default'}`}>
              <div className="event-accent" />
              <div className="event-content">
                <span className="event-tag">{event.category}</span>
                <h3>{event.title}</h3>
                <p>Fecha: {formatEventDate(event)}</p>
                <p>Lugar: {event.location}</p>
                <p className={`event-availability ${currentTab.className}`}>{currentTab.status}</p>

                <div className="event-footer">
                  <Link to={`/eventos/${event.id}`} className="detail-link">Ver detalle <span>&gt;</span></Link>
                </div>
              </div>
            </article>
          ))}
          {visibleEvents.length === 0 && (
            <p className="empty-events">No tienes eventos {currentTab.label.toLowerCase()}.</p>
          )}
        </section>
      </div>
    </main>
  );
}
