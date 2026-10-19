const request = require('supertest');
const { createApp } = require('../../src/app');
const { buildTestContext } = require('../helpers/buildTestContext');

/**
 * Pruebas de integración de la API completa (rutas → middleware → servicios → repositorios)
 * con un verificador de tokens falso: el token "uid-<id>" representa al usuario <id>.
 */
function setup() {
  const ctx = buildTestContext();
  const verifyIdToken = async (token) => {
    if (!token.startsWith('uid-')) throw new Error('token inválido');
    const uid = token.slice(4);
    return { uid, email: `${uid}@unadeca.net`, name: uid };
  };
  const app = createApp({ services: ctx.services, verifyIdToken });
  const as = (id) => ({ Authorization: `Bearer uid-${id}` });
  return { ctx, app, as };
}

describe('API', () => {
  test('GET /health responde sin autenticación', async () => {
    const { app } = setup();
    const r = await request(app).get('/health');
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('OK');
  });

  test('las rutas /api exigen token (401)', async () => {
    const { app } = setup();
    expect((await request(app).get('/api/events')).status).toBe(401);
    expect((await request(app).get('/api/events').set({ Authorization: 'Bearer malo' })).status).toBe(401);
  });

  test('un estudiante no puede crear eventos (403)', async () => {
    const { app, ctx, as } = setup();
    const r = await request(app).post('/api/events').set(as('est1')).send(ctx.eventoBase);
    expect(r.status).toBe(403);
  });

  test('flujo completo: coordinador crea, estudiante se inscribe, coordinador ve inscritos y registra asistencia', async () => {
    const { app, ctx, as } = setup();

    const creado = await request(app).post('/api/events').set(as('coord1')).send(ctx.eventoBase);
    expect(creado.status).toBe(201);
    const id = creado.body.id;

    const lista = await request(app).get('/api/events').set(as('est1'));
    expect(lista.body).toHaveLength(1);

    const insc = await request(app).post(`/api/events/${id}/inscriptions`).set(as('est1')).send({ fcmToken: 'tok' });
    expect(insc.status).toBe(201);

    const inscritos = await request(app).get(`/api/events/${id}/inscriptions`).set(as('coord1'));
    expect(inscritos.body.map((i) => i.userId)).toEqual(['est1']);

    const asis = await request(app).post(`/api/events/${id}/attendance`).set(as('coord1')).send({ userId: 'est1', asistio: true });
    expect(asis.status).toBe(201);

    const rep = await request(app).get(`/api/events/${id}/report`).set(as('coord1'));
    expect(rep.body).toMatchObject({ inscritosActivos: 1, presentes: 1, porcentajeAsistencia: 100 });
  });

  test('usuario nuevo: GET /api/users/me lo crea como estudiante', async () => {
    const { app, as } = setup();
    const r = await request(app).get('/api/users/me').set(as('nuevo'));
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ id: 'nuevo', rol: 'estudiante' });
  });

  test('PUT /api/users/me no permite escalar el rol', async () => {
    const { app, as } = setup();
    const r = await request(app).put('/api/users/me').set(as('est1')).send({ nombre: 'Ana', rol: 'administrador' });
    expect(r.body.rol).toBe('estudiante');
  });

  test('rutas /api/admin solo para administrador', async () => {
    const { app, as } = setup();
    expect((await request(app).get('/api/admin/users').set(as('coord1'))).status).toBe(403);
    expect((await request(app).get('/api/admin/users').set(as('admin1'))).status).toBe(200);
    const rol = await request(app).put('/api/admin/users/est1/role').set(as('admin1')).send({ rol: 'coordinador' });
    expect(rol.body.rol).toBe('coordinador');
  });

  test('una cuenta desactivada no puede usar la API (403)', async () => {
    const { app, as } = setup();
    await request(app).put('/api/admin/users/est1/active').set(as('admin1')).send({ activo: false });
    expect((await request(app).get('/api/events').set(as('est1'))).status).toBe(403);
  });

  test('JSON inválido responde 400 y rutas inexistentes 404', async () => {
    const { app, as } = setup();
    const bad = await request(app).post('/api/events').set({ ...as('coord1'), 'Content-Type': 'application/json' }).send('{malo');
    expect(bad.status).toBe(400);
    expect((await request(app).get('/no-existe')).status).toBe(404);
  });
});
