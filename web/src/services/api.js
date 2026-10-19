import { auth } from './firebase';

const BASE = import.meta.env.VITE_API_URL || '/api';

/** Llama al backend enviando el ID token de Firebase Auth del usuario actual. */
async function request(method, path, body) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export const api = {
  perfil: () => request('GET', '/users/me'),
  actualizarPerfil: (nombre) => request('PUT', '/users/me', { nombre }),

  eventosGestionables: () => request('GET', '/events/manage'),
  evento: (id) => request('GET', `/events/${id}`),
  crearEvento: (datos) => request('POST', '/events', datos),
  editarEvento: (id, datos) => request('PUT', `/events/${id}`, datos),
  cancelarEvento: (id) => request('POST', `/events/${id}/cancel`),
  finalizarEvento: (id) => request('POST', `/events/${id}/finish`),
  inscritos: (id) => request('GET', `/events/${id}/inscriptions`),
  asistencia: (id) => request('GET', `/events/${id}/attendance`),
  registrarAsistencia: (id, userId, asistio) => request('POST', `/events/${id}/attendance`, { userId, asistio }),
  reporte: (id) => request('GET', `/events/${id}/report`),

  usuarios: () => request('GET', '/admin/users'),
  cambiarRol: (id, rol) => request('PUT', `/admin/users/${id}/role`, { rol }),
  cambiarActivo: (id, activo) => request('PUT', `/admin/users/${id}/active`, { activo }),
  reporteGlobal: () => request('GET', '/admin/reports'),
};
