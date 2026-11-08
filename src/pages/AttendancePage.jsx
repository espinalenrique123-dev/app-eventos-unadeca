import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchUserRegistrationDetails } from '../api';
import PhoneStatusBar from '../components/PhoneStatusBar';

export default function AttendancePage({ events = [], onSave }) {
  const { id } = useParams();
  const event = useMemo(
    () => events.find((item) => item.id === Number(id)) || null,
    [events, id]
  );

  const registrations = useMemo(
    () => (Array.isArray(event?.registrations) ? event.registrations : []),
    [event]
  );
  const [attendance, setAttendance] = useState(event?.attendance || {});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [studentDetails, setStudentDetails] = useState({});
  const [namesError, setNamesError] = useState('');

  useEffect(() => {
    setAttendance(event?.attendance || {});
  }, [event]);

  useEffect(() => {
    let isCurrent = true;
    setStudentDetails({});
    setNamesError('');

    fetchUserRegistrationDetails(registrations)
      .then((details) => {
        if (isCurrent) setStudentDetails(details);
      })
      .catch((nameError) => {
        if (isCurrent) {
          setNamesError(nameError.message || 'No se pudieron cargar los datos de los estudiantes.');
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [event, registrations]);

  const presentCount = registrations.filter((email) => attendance[email] === true).length;
  const totalCount = registrations.length;
  const absentCount = totalCount - presentCount;
  const reportDate = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(new Date());

  const toggleStudent = (email) => {
    setAttendance((prev) => ({ ...prev, [email]: !prev[email] }));
    setError('');
    setNotice('');
  };

  const handleSave = async () => {
    if (!event || !onSave) return;
    setIsSaving(true);
    setError('');
    setNotice('');

    try {
      await onSave(event.id, attendance);
      setNotice('Asistencia guardada en Firebase.');
    } catch (saveError) {
      setError(saveError.message || 'No se pudo guardar la asistencia.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '28 jul 2026';
    const date = new Date(`${dateString}T00:00:00Z`);
    const day = date.getUTCDate();
    const month = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(date);
    return `${day} ${month} ${date.getUTCFullYear()}`;
  };

  return (
    <main className="attendance-shell">
      <article className="attendance-card">
        <header className="attendance-header">
          <PhoneStatusBar variant="detail" />

          <div className="attendance-topbar">
            <Link to="/dashboard" className="detail-back" aria-label="Volver">&lt;</Link>
            <span>Registro de asistencia</span>
          </div>
        </header>

        <section className="attendance-body">
          <h2 className="attendance-report-title">Reporte del evento</h2>
          <h1>{event?.title || 'Evento no encontrado'}</h1>
          <p className="attendance-subtitle">
            {event ? `${formatDate(event.date)} — ${event.location}` : 'Vuelve al dashboard y selecciona un evento.'}
          </p>

          <p className="attendance-report-date">Generado el {reportDate}</p>

          <div className="attendance-summary">
            <span className="summary-pill present">Presentes: {presentCount} de {totalCount}</span>
            <span className="summary-pill absent">Ausentes: {absentCount}</span>
          </div>

          <button
            type="button"
            className="attendance-report-btn"
            onClick={() => window.print()}
            disabled={!event}
          >
            Imprimir / guardar PDF
          </button>

          <div className="attendance-table-header">
            <span>Estudiante</span>
            <span>Asistencia</span>
          </div>

          <div className="attendance-list">
            {registrations.map((email) => (
              <div className="attendance-row" key={email}>
                <div className="student-block">
                  <span className="student-name">
                    {studentDetails[email.toLowerCase()]?.name || 'Nombre no disponible'}
                  </span>
                  {studentDetails[email.toLowerCase()]?.phone && (
                    <small>Teléfono: {studentDetails[email.toLowerCase()].phone}</small>
                  )}
                  {studentDetails[email.toLowerCase()]?.contactEmail && (
                    <small>Correo de contacto: {studentDetails[email.toLowerCase()].contactEmail}</small>
                  )}
                  <small>{attendance[email] === true ? 'Presente' : 'Ausente'}</small>
                </div>

                <button
                  type="button"
                  className={`toggle-switch ${attendance[email] ? 'active' : ''}`}
                  onClick={() => toggleStudent(email)}
                  aria-label={attendance[email] ? 'Marcar ausente' : 'Marcar presente'}
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            ))}
            {registrations.length === 0 && <p className="attendance-note">Todavía no hay inscripciones para este evento.</p>}
          </div>

          {error && <p className="error-message no-print" role="alert">{error}</p>}
          {namesError && <p className="error-message no-print" role="alert">{namesError}</p>}
          {notice && <p className="success-message no-print" role="status">{notice}</p>}

          <button type="button" className="primary-btn attendance-save no-print" onClick={handleSave} disabled={isSaving || !event}>
            {isSaving ? 'Guardando...' : 'Guardar registro de asistencia'}
          </button>

          <p className="attendance-note no-print">Los cambios se guardan en Firestore al pulsar Guardar.</p>
        </section>
      </article>
    </main>
  );
}
