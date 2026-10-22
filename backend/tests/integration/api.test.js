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

describe('API REST — integración (Supertest)', () => {
  test('CP-I-01 GET /health responde sin autenticación', async () => {
    const { app } = setup();
    const r = await request(app).get('/health');
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('OK');
  });

  test('CP-I-02 [RF-15] las rutas /api exigen un token válido (401)', async () => {
    const { app } = setup();
    expect((await request(app).get('/api/events')).status).toBe(401);
    expect((await request(app).get('/api/events').set({ Authorization: 'Bearer malo' })).status).toBe(401);
  });

  test('CP-I-03 [RF-01][RNF-Seguridad] un estudiante no puede crear eventos (403)', async () => {
    const { app, ctx, as } = setup();
    const r = await request(app).post('/api/events').set(as('est1')).send(ctx.eventoBase);
    expect(r.status).toBe(403);
  });

  test('CP-I-04 [RF-01][RF-04][RF-05][RF-06][RF-13] flujo: el coordinador crea, el estudiante ve el detalle y se inscribe, el coordinador ve los inscritos', async () => {
    const { app, ctx, as } = setup();

    const creado = await request(app).post('/api/events').set(as('coord1')).send(ctx.eventoBase);
    expect(creado.status).toBe(201);
    const id = creado.body.id;

    expect((await request(app).get('/api/events').set(as('est1'))).body).toHaveLength(1);
    expect((await request(app).get(`/api/events/${id}`).set(as('est1'))).body.nombre).toBe(ctx.eventoBase.nombre);

    const insc = await request(app).post(`/api/events/${id}/inscriptions`).set(as('est1')).send({ fcmToken: 'tok' });
    expect(insc.status).toBe(201);

    const inscritos = await request(app).get(`/api/events/${id}/inscriptions`).set(as('coord1'));
    expect(inscritos.body.map((i) => i.userId)).toEqual(['est1']);
  });

  test('CP-I-05 [RF-02][RF-03] el coordinador edita y luego elimina (cancela) su evento', async () => {
    const { app, ctx, as } = setup();
    const { body: e } = await request(app).post('/api/events').set(as('coord1')).send(ctx.eventoBase);
    const edit = await request(app).put(`/api/events/${e.id}`).set(as('coord1')).send({ lugar: 'Capilla' });
    expect(edit.body.lugar).toBe('Capilla');
    const canc = await request(app).post(`/api/events/${e.id}/cancel`).set(as('coord1'));
    expect(canc.body.estado).toBe('CANCELADO');
    expect((await request(app).get('/api/events').set(as('est1'))).body).toHaveLength(0);
  });

  test('CP-I-06 [RF-07] la API responde 409 "Cupo lleno" cuando no quedan cupos', async () => {
    const { app, ctx, as } = setup();
    const { body: e } = await request(app).post('/api/events').set(as('coord1')).send({ ...ctx.eventoBase, cupoMaximo: 1 });
    await request(app).post(`/api/events/${e.id}/inscriptions`).set(as('est1')).send({});
    await ctx.repos.userRepo.save('est2', { nombre: 'Luis', rol: 'estudiante', activo: true });
    const r = await request(app).post(`/api/events/${e.id}/inscriptions`).set(as('est2')).send({});
    expect(r.status).toBe(409);
    expect(r.body.error).toBe('Cupo lleno');
  });

  test('CP-I-07 [RF-08] el estudiante cancela su inscripción y el cupo queda libre', async () => {
    const { app, ctx, as } = setup();
    const { body: e } = await request(app).post('/api/events').set(as('coord1')).send(ctx.eventoBase);
    await request(app).post(`/api/events/${e.id}/inscriptions`).set(as('est1')).send({});
    const r = await request(app).delete(`/api/events/${e.id}/inscriptions/me`).set(as('est1'));
    expect(r.body.estado).toBe('CANCELADA');
    expect((await request(app).get(`/api/events/${e.id}`).set(as('est1'))).body.cuposOcupados).toBe(0);
  });

  test('CP-I-08 [RF-12][RF-14] el coordinador registra la asistencia y genera el reporte', async () => {
    const { app, ctx, as } = setup();
    const { body: e } = await request(app).post('/api/events').set(as('coord1')).send(ctx.eventoBase);
    await request(app).post(`/api/events/${e.id}/inscriptions`).set(as('est1')).send({});
    const asis = await request(app).post(`/api/events/${e.id}/attendance`).set(as('coord1')).send({ userId: 'est1', asistio: true });
    expect(asis.status).toBe(201);
    const rep = await request(app).get(`/api/events/${e.id}/report`).set(as('coord1'));
    expect(rep.body).toMatchObject({ inscritosActivos: 1, presentes: 1, porcentajeAsistencia: 100 });
  });

  test('CP-I-09 [RF-15] primer inicio de sesión: GET /api/users/me crea el perfil como estudiante', async () => {
    const { app, as } = setup();
    const r = await request(app).get('/api/users/me').set(as('nuevo'));
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ id: 'nuevo', rol: 'estudiante' });
  });

  test('CP-I-10 [RNF-Seguridad] PUT /api/users/me no permite escalar el rol', async () => {
    const { app, as } = setup();
    const r = await request(app).put('/api/users/me').set(as('est1')).send({ nombre: 'Ana', rol: 'administrador' });
    expect(r.body.rol).toBe('estudiante');
  });

  test('CP-I-11 [RF-16][RNF-Seguridad] las rutas /api/admin son solo para el administrador', async () => {
    const { app, as } = setup();
    expect((await request(app).get('/api/admin/users').set(as('coord1'))).status).toBe(403);
    expect((await request(app).get('/api/admin/users').set(as('admin1'))).status).toBe(200);
    const rol = await request(app).put('/api/admin/users/est1/role').set(as('admin1')).send({ rol: 'coordinador' });
    expect(rol.body.rol).toBe('coordinador');
  });

  test('CP-I-12 [RF-15][RF-16] una cuenta desactivada no puede usar la API (403)', async () => {
    const { app, as } = setup();
    await request(app).put('/api/admin/users/est1/active').set(as('admin1')).send({ activo: false });
    expect((await request(app).get('/api/events').set(as('est1'))).status).toBe(403);
  });

  test('CP-I-13 [RNF-Seguridad] JSON inválido responde 400 y una ruta inexistente 404, sin exponer detalles internos', async () => {
    const { app, as } = setup();
    const bad = await request(app)
      .post('/api/events')
      .set({ ...as('coord1'), 'Content-Type': 'application/json' })
      .send('{malo');
    expect(bad.status).toBe(400);
    expect(bad.body).toEqual({ error: 'El cuerpo de la petición no es JSON válido' });
    expect((await request(app).get('/no-existe')).status).toBe(404);
  });

  test('CP-I-14 [RNF-Rendimiento] la lista de eventos responde en menos de 500 ms', async () => {
    const { app, ctx, as } = setup();
    for (let i = 0; i < 50; i++) {
      await ctx.services.eventService.crear(ctx.usuarios.coord, { ...ctx.eventoBase, nombre: `Evento ${i}` });
    }
    const t0 = Date.now();
    const r = await request(app).get('/api/events').set(as('est1'));
    expect(r.body).toHaveLength(50);
    expect(Date.now() - t0).toBeLessThan(500);
  });
});
