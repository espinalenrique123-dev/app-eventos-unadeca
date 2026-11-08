import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatEventDate } from '../data/events';
import { requestNotificationPermission, showEnrollmentNotification } from '../notifications';
import PhoneStatusBar from '../components/PhoneStatusBar';

export default function EventDetailPage({ events, user, onEnroll }) {
  const { id } = useParams();
  const event = events.find((item) => item.id === Number(id));
  const [registered, setRegistered] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const alreadyRegistered = Array.isArray(event?.registrations)
    && event.registrations.some((email) => String(email).toLowerCase() === String(user?.email || '').toLowerCase());

  if (!event) {
    return (
      <main className="event-detail-shell empty-state">
        <div className="event-detail-card">
          <h2>Evento no encontrado</h2>
          <Link to="/dashboard" className="primary-btn detail-link">
            Volver al dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (registered) {
    const registrations = Array.isArray(event.registrations) ? event.registrations : [];
    const registeredCount = registrations.length;
    const totalCapacity = Number(event.capacity || 0) + registeredCount;

    return (
      <main className="event-detail-shell confirmation-shell">
        <article className="event-detail-card confirmation-card">
          <header className="event-detail-header confirmation-header">
            <PhoneStatusBar variant="detail" />
            <Link to="/dashboard" className="detail-back">&lt; {event.title}</Link>
          </header>

          <section className="confirmation-body">
            <div className="confirmation-checkwrap">
              <div className="confirmation-check">V</div>
            </div>

            <h2>Inscripción confirmada!</h2>
            <p className="confirmation-subtitle">
              Tu inscripción quedó guardada correctamente.
            </p>

            <div className="confirmation-summary">
              <h3>Resumen de tu inscripción</h3>
              <div className="confirmation-summary-row">
                <span>Nombre:</span>
                <strong>{form.name}</strong>
              </div>
              <div className="confirmation-summary-row">
                <span>Correo de contacto:</span>
                <strong>{form.email}</strong>
              </div>
              <div className="confirmation-summary-row">
                <span>Teléfono:</span>
                <strong>{form.phone}</strong>
              </div>
              <div className="confirmation-summary-row">
                <span>Fecha:</span>
                <strong>{event.detailDate || formatEventDate(event)}</strong>
              </div>
              <div className="confirmation-summary-row">
                <span>Hora:</span>
                <strong>{event.detailTime || [event.time, event.endTime].filter(Boolean).join(' - ') || 'No especificada'}</strong>
              </div>
              <div className="confirmation-summary-row">
                <span>Lugar:</span>
                <strong>{event.detailLocation || event.location}</strong>
              </div>
              <div className="confirmation-summary-row">
                <span>Inscripción:</span>
                <strong>{registeredCount} de {totalCapacity}</strong>
              </div>
            </div>

            <div className="confirmation-actions">
              <Link to="/mis-eventos" className="primary-btn confirmation-primary">
                Ver mis eventos
              </Link>
              <Link to="/dashboard" className="primary-btn confirmation-secondary">
                Volver a la lista de eventos
              </Link>
            </div>
          </section>
        </article>
      </main>
    );
  }

  return (
    <main className="event-detail-shell">
      <article className="event-detail-card">
        <header className="event-detail-header">
          <PhoneStatusBar variant="detail" />
          <Link to="/dashboard" className="detail-back">&lt; Volver</Link>
          <h1>{event.title}</h1>
          {event.coordinator && <p className="detail-coordinator">Coordinador: {event.coordinator}</p>}
          <div className="detail-badges">
            <span className="detail-category">{event.category}</span>
            <span className={`detail-capacity ${event.capacity === 0 ? 'full' : ''}`}>
              {event.capacity === 0 ? 'CUPO LLENO' : `${event.capacity} cupos libres`}
            </span>
          </div>
        </header>

        <div className="event-image-placeholder" role="img" aria-label="Imagen del evento">
          Imagen del evento
        </div>

        <section className="event-detail-content">
          <div className="event-information">
            <div className="event-information-row">
              <span>Fecha</span>
              <strong>{event.detailDate || formatEventDate(event)}</strong>
            </div>
            <div className="event-information-row">
              <span>Hora</span>
              <strong>{event.detailTime || event.time}</strong>
            </div>
            <div className="event-information-row">
              <span>Lugar</span>
              <strong>{event.detailLocation || event.location}</strong>
            </div>
            <div className="event-information-row last-row">
              <span>Tipo</span>
              <strong>{event.detailType || event.category}</strong>
            </div>
          </div>

          <div className="event-description">
            <h2>Descripcion</h2>
            <p>{event.capacity === 0 ? 'CUPO LLENO' : `${event.capacity} cupos libres`}</p>
          </div>
        </section>

        <footer className="event-detail-footer">
          {alreadyRegistered ? (
            <p className="event-registration-notice">Ya estás inscrito en este evento.</p>
          ) : showRegistrationForm ? (
              <form
                className="event-registration-form"
                onSubmit={async (submitEvent) => {
                  submitEvent.preventDefault();
                  setIsRegistering(true);
                  setError('');
                  const notificationPermission = requestNotificationPermission();
                  try {
                    const result = await onEnroll(event.id, form);
                    setRegistered(true);
                    await notificationPermission;
                    if (!result.alreadyRegistered) await showEnrollmentNotification(event);
                  } catch (registrationError) {
                    setError(registrationError.message || 'No se pudo completar la inscripción.');
                  } finally {
                    setIsRegistering(false);
                  }
                }}
              >
                <label>
                  Nombre completo
                  <input
                    type="text"
                    value={form.name}
                    onChange={(inputEvent) => setForm((current) => ({ ...current, name: inputEvent.target.value }))}
                    autoComplete="name"
                    maxLength="80"
                    required
                  />
                </label>
                <label>
                  Correo de contacto
                  <input
                    type="email"
                    value={form.email}
                    onChange={(inputEvent) => setForm((current) => ({ ...current, email: inputEvent.target.value }))}
                    autoComplete="email"
                    maxLength="254"
                    required
                  />
                </label>
                <label>
                  Teléfono
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(inputEvent) => setForm((current) => ({ ...current, phone: inputEvent.target.value }))}
                    autoComplete="tel"
                    maxLength="25"
                    required
                  />
                </label>
                {error && <p className="error-message" role="alert">{error}</p>}
                <button type="submit" disabled={isRegistering || Number(event.capacity) === 0}>
                  {isRegistering ? 'Inscribiendo...' : 'Confirmar inscripción'}
                </button>
                <button type="button" className="event-registration-cancel" onClick={() => setShowRegistrationForm(false)}>
                  Cancelar
                </button>
              </form>
            ) : (
              <button
                type="button"
                disabled={Number(event.capacity) === 0}
                onClick={() => setShowRegistrationForm(true)}
              >
                {Number(event.capacity) === 0 ? 'Cupo lleno' : 'Inscribirme al evento'}
              </button>
          )}
          {!alreadyRegistered && !showRegistrationForm && (
            <p>{registered ? 'Tu registro se realizó correctamente.' : 'Cupos limitados. Confirmación inmediata al inscribirse.'}</p>
          )}
        </footer>
      </article>
    </main>
  );
}
