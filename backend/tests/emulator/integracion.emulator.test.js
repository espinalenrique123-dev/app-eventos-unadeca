/**
 * Pruebas de integración — Nivel 2 del Plan de Pruebas.
 * Usan las capas REALES (FirebaseConfig → FirebaseFacade → Repositorios → Servicios → API)
 * contra los emuladores oficiales de Firestore y Auth, con un proyecto "demo-" sin credenciales.
 * Se ejecutan con:  firebase emulators:exec --project demo-app-eventos --only firestore,auth "npm run test:emulator"
 */
const request = require('supertest');
const FirebaseConfig = require('../../src/config/FirebaseConfig');
const { buildContainer } = require('../../src/container');
const { createApp } = require('../../src/app');
const { Rol, EstadoEvento } = require('../../src/models/enums');

const PROJECT = process.env.GCLOUD_PROJECT || 'demo-app-eventos';
const FIRESTORE = process.env.FIRESTORE_EMULATOR_HOST;
const AUTH = process.env.FIREBASE_AUTH_EMULATOR_HOST;

if (!FIRESTORE || !AUTH) {
  throw new Error('Estas pruebas deben ejecutarse dentro de firebase emulators:exec');
}

const { services, verifyIdToken } = buildContainer();
const db = FirebaseConfig.getInstance().firestore;
const app = createApp({ services, verifyIdToken });

const eventoBase = {
  nombre: 'Feria Tecnológica 2026',
  descripcion: 'Exposición de proyectos',
  fecha: '2027-03-20',
  hora: '09:00',
  lugar: 'Auditorio principal',
  categoria: 'Académico',
  cupoMaximo: 1,
};

/** Borra todos los datos de los emuladores entre pruebas (endpoints oficiales del emulador). */
async function limpiar() {
  await fetch(`http://${FIRESTORE}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' });
  await fetch(`http://${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' });
}

/** Crea una cuenta en el emulador de Auth y devuelve un ID token real. */
async function cuenta(email, password = 'clave-de-prueba-123') {
  const r = await fetch(`http://${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await r.json();
  return { uid: data.localId, token: data.idToken };
}

async function usuario(id, rol) {
  const u = { id, nombre: id, email: `${id}@unadeca.net`, rol, activo: true };
  await db.collection('users').doc(id).set(u);
  return u;
}

beforeEach(limpiar);

describe('Integración con Firestore real (emulador)', () => {
  test('CP-E-01 [RNF-Mantenibilidad] Singleton: una sola instancia conectada al emulador sin credenciales', () => {
    expect(FirebaseConfig.getInstance()).toBe(FirebaseConfig.getInstance());
    expect(() => new FirebaseConfig()).toThrow('getInstance');
    expect(FirebaseConfig.opciones({ FIRESTORE_EMULATOR_HOST: 'x' })).not.toHaveProperty('credential');
  });

  test('CP-E-02 [RF-01][RF-05] Facade + repositorio: el evento se guarda en Firestore con estado, cupos y fecha de creación', async () => {
    const coord = await usuario('coord1', Rol.COORDINADOR);
    const e = await services.eventService.crear(coord, eventoBase);
    const doc = (await db.collection('events').doc(e.id).get()).data();
    expect(doc).toMatchObject({ estado: EstadoEvento.PUBLICADO, cuposOcupados: 0, coordinadorId: 'coord1' });
    expect(doc.createdAt).toBeDefined();
  });

  test('CP-E-03 [RF-06][RF-07] transacción real: 5 estudiantes compiten por 1 cupo y solo 1 queda inscrito', async () => {
    const coord = await usuario('coord1', Rol.COORDINADOR);
    const e = await services.eventService.crear(coord, eventoBase);
    const estudiantes = await Promise.all([1, 2, 3, 4, 5].map((n) => usuario(`est${n}`, Rol.ESTUDIANTE)));
    const r = await Promise.allSettled(estudiantes.map((u) => services.inscriptionService.inscribir(u, e.id, 'tok')));
    expect(r.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
    const ev = (await db.collection('events').doc(e.id).get()).data();
    expect(ev).toMatchObject({ cuposOcupados: 1, estado: EstadoEvento.CUPO_LLENO });
    const activas = await db.collection('inscriptions').where('eventId', '==', e.id).where('estado', '==', 'ACTIVA').get();
    expect(activas.size).toBe(1);
  });

  test('CP-E-04 [RF-08][RF-07] cancelar libera el cupo y el evento vuelve a PUBLICADO', async () => {
    const coord = await usuario('coord1', Rol.COORDINADOR);
    const est = await usuario('est1', Rol.ESTUDIANTE);
    const e = await services.eventService.crear(coord, eventoBase);
    await services.inscriptionService.inscribir(est, e.id, 'tok');
    await services.inscriptionService.cancelar(est, e.id);
    const ev = (await db.collection('events').doc(e.id).get()).data();
    expect(ev).toMatchObject({ cuposOcupados: 0, estado: EstadoEvento.PUBLICADO });
  });

  test('CP-E-05 [RF-04][RF-18] la consulta real filtra por estado, ordena por fecha y aplica la categoría', async () => {
    const coord = await usuario('coord1', Rol.COORDINADOR);
    await services.eventService.crear(coord, { ...eventoBase, nombre: 'C', fecha: '2027-03-30', categoria: 'Cultural' });
    await services.eventService.crear(coord, { ...eventoBase, nombre: 'A', fecha: '2027-03-10' });
    const b = await services.eventService.crear(coord, { ...eventoBase, nombre: 'B', fecha: '2027-03-15' });
    await services.eventService.cancelar(coord, b.id);
    expect((await services.eventService.listarVisibles()).map((e) => e.nombre)).toEqual(['A', 'C']);
    expect((await services.eventService.listarVisibles({ categoria: 'cultural' })).map((e) => e.nombre)).toEqual(['C']);
  });

  test('CP-E-06 [RF-14] el reporte combina eventos, inscripciones y asistencia guardados en Firestore', async () => {
    const coord = await usuario('coord1', Rol.COORDINADOR);
    const est = await usuario('est1', Rol.ESTUDIANTE);
    const e = await services.eventService.crear(coord, { ...eventoBase, cupoMaximo: 5 });
    await services.inscriptionService.inscribir(est, e.id, 'tok');
    await services.attendanceService.registrar(coord, e.id, { userId: 'est1', asistio: true });
    expect(await services.eventService.reporte(coord, e.id)).toMatchObject({ inscritosActivos: 1, presentes: 1, porcentajeAsistencia: 100 });
  });
});

describe('Integración con Firebase Auth real (emulador) y la API HTTP', () => {
  test('CP-E-07 [RF-15] un ID token real permite entrar y el primer ingreso crea el perfil como estudiante', async () => {
    const { uid, token } = await cuenta('nuevo@unadeca.net');
    const r = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ id: uid, rol: Rol.ESTUDIANTE });
  });

  test('CP-E-08 [RF-15][RNF-Seguridad] un token alterado se rechaza (401)', async () => {
    const { token } = await cuenta('otro@unadeca.net');
    const r = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token.slice(0, -4)}xxxx`);
    expect(r.status).toBe(401);
  });

  test('CP-E-09 [RF-16] el administrador crea una cuenta en Auth; la persona recibe un enlace y un correo repetido da 409', async () => {
    const admin = await cuenta('admin@unadeca.net');
    await usuario(admin.uid, Rol.ADMINISTRADOR);
    const datos = { nombre: 'María', email: 'maria@unadeca.net', rol: Rol.COORDINADOR };
    const r = await request(app).post('/api/admin/users').set('Authorization', `Bearer ${admin.token}`).send(datos);
    expect(r.status).toBe(201);
    expect(r.body.enlaceContrasena).toContain('oobCode');
    const enAuth = await FirebaseConfig.getInstance().auth.getUserByEmail('maria@unadeca.net');
    expect(enAuth.uid).toBe(r.body.usuario.id);
    const otra = await request(app).post('/api/admin/users').set('Authorization', `Bearer ${admin.token}`).send(datos);
    expect(otra.status).toBe(409);
  });

  test('CP-E-10 [RF-01][RF-06][RF-13][RF-17] flujo completo por HTTP: el coordinador publica, el estudiante se inscribe y lo ve en "Mis eventos"', async () => {
    const coord = await cuenta('coord@unadeca.net');
    await usuario(coord.uid, Rol.COORDINADOR);
    const est = await cuenta('ana@unadeca.net');
    const as = (t) => ({ Authorization: `Bearer ${t}` });

    const { body: e } = await request(app).post('/api/events').set(as(coord.token)).send({ ...eventoBase, cupoMaximo: 10 });
    expect((await request(app).post(`/api/events/${e.id}/inscriptions`).set(as(est.token)).send({ fcmToken: 'tok' })).status).toBe(201);

    const inscritos = await request(app).get(`/api/events/${e.id}/inscriptions`).set(as(coord.token));
    expect(inscritos.body.map((i) => i.userId)).toEqual([est.uid]);

    const mis = await request(app).get('/api/users/me/inscriptions').set(as(est.token));
    expect(mis.body[0]).toMatchObject({ estado: 'ACTIVA', evento: { nombre: eventoBase.nombre } });
    expect(mis.body[0]).not.toHaveProperty('fcmToken');
  });

  test('CP-E-11 [RF-16][RNF-Seguridad] al desactivar una cuenta, su token deja de servir (403)', async () => {
    const admin = await cuenta('admin@unadeca.net');
    await usuario(admin.uid, Rol.ADMINISTRADOR);
    const est = await cuenta('ana@unadeca.net');
    await request(app).get('/api/users/me').set('Authorization', `Bearer ${est.token}`);
    await request(app).put(`/api/admin/users/${est.uid}/active`).set('Authorization', `Bearer ${admin.token}`).send({ activo: false });
    expect((await request(app).get('/api/events').set('Authorization', `Bearer ${est.token}`)).status).toBe(403);
  });
});
