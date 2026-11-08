import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import {
  createEvent as createEventRequest,
  deleteEventRequest,
  fetchEvents,
  logoutUser as logoutUserRequest,
  registerEvent as registerEventRequest,
  saveAttendance as saveAttendanceRequest,
  updateUserProfile as updateUserProfileRequest,
  updateEvent as updateEventRequest
} from './api';
import { seedEvents } from './data/events';
import { isFirebaseReady } from './firebase';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EventDetailPage from './pages/EventDetailPage';
import EventFormPage from './pages/EventFormPage';
import AttendancePage from './pages/AttendancePage';
import ManagerPage from './pages/ManagerPage';
import MyEventsPage from './pages/MyEventsPage';
import ProfilePage from './pages/ProfilePage';

const USER_KEY = 'app-eventos-user';
const EVENTS_KEY = 'app-eventos-events';
const ADMIN_ROLES = ['admin', 'administrador'];

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function readEvents() {
  const storedEvents = readStorage(EVENTS_KEY, null);
  if (!Array.isArray(storedEvents)) return seedEvents();

  const oldSample = [
    [1, 'Conferencia de Tecnología', '2026-10-15', 'Bogotá', 'Tecnología', 250, 120000],
    [2, 'Festival de Música Universitaria', '2026-11-02', 'Medellín', 'Cultura', 500, 95000],
    [3, 'Workshop de Diseño UX', '2026-11-18', 'Cali', 'Diseño', 80, 150000]
  ];
  const storedSignature = storedEvents
    .map(({ id, title, date, location, category, capacity, price }) =>
      [id, title, date, location, category, capacity, price]
    )
    .sort((first, second) => first[0] - second[0]);
  const hasOldSample = JSON.stringify(storedSignature) === JSON.stringify(oldSample);

  return hasOldSample ? seedEvents() : storedEvents;
}

export default function App() {
  const [user, setUser] = useState(() => readStorage(USER_KEY, null));
  const [events, setEvents] = useState(readEvents);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');
  const [eventsReloadKey, setEventsReloadKey] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    let active = true;

    if (!user) {
      setEventsLoading(false);
      return () => {
        active = false;
      };
    }

    setEventsLoading(true);
    setEventsError('');

    const loadEvents = async () => {
      try {
        const apiEvents = await fetchEvents();
        if (active && Array.isArray(apiEvents)) {
          setEvents(apiEvents);
          localStorage.setItem(EVENTS_KEY, JSON.stringify(apiEvents));
        }
      } catch (error) {
        console.error('No se pudieron cargar los eventos:', error);
        if (active) {
          setEventsError(error.message || 'No se pudieron cargar los eventos de Firebase.');
          if (isFirebaseReady) {
            setEvents([]);
            localStorage.setItem(EVENTS_KEY, JSON.stringify([]));
          }
        }
      } finally {
        if (active) setEventsLoading(false);
      }
    };

    loadEvents();
    return () => {
      active = false;
    };
  }, [user, eventsReloadKey]);

  const saveEvent = async (event) => {
    const payload = {
      ...event,
      id: Number(event.id) || Date.now(),
      capacity: Number(event.capacity),
      price: Number(event.price)
    };
    const exists = events.some((item) => item.id === payload.id);

    if (exists) {
      await updateEventRequest(payload.id, payload);
    } else {
      await createEventRequest(payload);
    }

    setEvents((prev) => {
      const nextEvents = exists
        ? prev.map((item) => (item.id === payload.id ? payload : item))
        : [payload, ...prev];
      localStorage.setItem(EVENTS_KEY, JSON.stringify(nextEvents));
      return nextEvents;
    });
  };

  const deleteEvent = async (id) => {
    const eventId = Number(id);

    await deleteEventRequest(eventId);

    setEvents((prev) => {
      const nextEvents = prev.filter((event) => event.id !== eventId);
      localStorage.setItem(EVENTS_KEY, JSON.stringify(nextEvents));
      return nextEvents;
    });
  };

  const registerEvent = async (id, registration) => {
    const eventId = Number(id);
    const registeredUser = {
      ...registration,
      authEmail: user?.email || '',
      uid: user?.uid || ''
    };
    const result = await registerEventRequest(eventId, registeredUser);

    if (!result.alreadyRegistered) {
      setUser((currentUser) => (
        currentUser
          ? {
            ...currentUser,
            name: registeredUser.name,
            phone: registeredUser.phone,
            contactEmail: registeredUser.email
          }
          : currentUser
      ));
      setEvents((prev) => {
        const nextEvents = prev.map((event) => (
          event.id === eventId
            ? { ...event, capacity: result.capacity, registrations: result.registrations }
            : event
        ));
        localStorage.setItem(EVENTS_KEY, JSON.stringify(nextEvents));
        return nextEvents;
      });
    }

    return result;
  };

  const saveAttendance = async (id, attendance) => {
    await saveAttendanceRequest(id, attendance);
    setEvents((prev) => {
      const nextEvents = prev.map((event) => (
        event.id === Number(id) ? { ...event, attendance } : event
      ));
      localStorage.setItem(EVENTS_KEY, JSON.stringify(nextEvents));
      return nextEvents;
    });
  };

  const updateUserProfile = async (profile) => {
    if (!user?.uid) {
      throw new Error('No se encontró el usuario de la sesión.');
    }

    const savedProfile = await updateUserProfileRequest(user.uid, profile);
    setUser((currentUser) => (
      currentUser ? { ...currentUser, ...savedProfile } : currentUser
    ));
  };

  const logout = async () => {
    try {
      await logoutUserRequest();
    } catch (error) {
      console.error('No se pudo cerrar la sesión de Firebase:', error);
      return;
    }
    setIsMobileMenuOpen(false);
    setUser(null);
  };

  const showNav = user || window.location.pathname !== '/';
  const isAdmin = ADMIN_ROLES.includes(user?.role);

  return (
    <>
      {showNav && (
        <header className="topbar">
          <div className="container">
            <Link to={user ? '/dashboard' : '/login'} className="brand">
              UNADECA Eventos
            </Link>

            <button
              type="button"
              className="mobile-menu-toggle"
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="primary-navigation"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
            >
              <span aria-hidden="true">{isMobileMenuOpen ? '×' : '☰'}</span>
            </button>

            <nav id="primary-navigation" className={isMobileMenuOpen ? 'is-open' : ''}>
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                  <Link to="/mis-eventos" onClick={() => setIsMobileMenuOpen(false)}>Mis eventos</Link>
                  {isAdmin && (
                    <>
                      <Link to="/eventos/nuevo" onClick={() => setIsMobileMenuOpen(false)}>Nuevo evento</Link>
                      <Link to="/coordinador" onClick={() => setIsMobileMenuOpen(false)}>Panel de eventos</Link>
                    </>
                  )}
                  <button type="button" className="logout-btn" onClick={logout}>
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>Iniciar sesión</Link>
              )}
            </nav>
          </div>
        </header>
      )}

      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={<LoginPage onLogin={setUser} />}
        />
        <Route
          path="/dashboard"
          element={user ? (
            <DashboardPage
              user={user}
              events={events}
              onDelete={deleteEvent}
              eventsLoading={eventsLoading}
              eventsError={eventsError}
              onRetry={() => setEventsReloadKey((key) => key + 1)}
            />
          ) : <Navigate to="/login" replace />}
        />
        <Route
          path="/perfil"
          element={user ? (
            <ProfilePage
              user={user}
              onUpdateProfile={updateUserProfile}
            />
          ) : <Navigate to="/login" replace />}
        />
        <Route
          path="/mis-eventos"
          element={user ? <MyEventsPage user={user} events={events} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/eventos/nuevo"
          element={isAdmin ? <EventFormPage events={events} onSave={saveEvent} /> : <Navigate to={user ? '/dashboard' : '/login'} replace />}
        />
        <Route
          path="/eventos/editar/:id"
          element={isAdmin ? <EventFormPage events={events} onSave={saveEvent} /> : <Navigate to={user ? '/dashboard' : '/login'} replace />}
        />
        <Route
          path="/eventos/:id"
          element={user ? <EventDetailPage events={events} user={user} onEnroll={registerEvent} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/asistencia/:id"
          element={isAdmin ? <AttendancePage events={events} onSave={saveAttendance} /> : <Navigate to={user ? '/dashboard' : '/login'} replace />}
        />
        <Route
          path="/coordinador"
          element={isAdmin ? (
            <ManagerPage
              events={events}
              onDelete={deleteEvent}
              eventsLoading={eventsLoading}
              eventsError={eventsError}
              onRetry={() => setEventsReloadKey((key) => key + 1)}
            />
          ) : <Navigate to={user ? '/dashboard' : '/login'} replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
