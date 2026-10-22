const { buildTestContext } = require('../helpers/buildTestContext');
const { EstadoEvento, EstadoInscripcion } = require('../../src/models/enums');

describe('InscriptionService (RF-06, RF-07, RF-08, RF-13)', () => {
  let ctx;
  let evento;
  beforeEach(async () => {
    ctx = buildTestContext();
    evento = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase); // cupoMaximo = 2
  });

  test('CP-U-24 [RF-06] inscribir: crea la inscripción con id {eventId}_{userId} y ocupa un cupo', async () => {
    const i = await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id, 'token-fcm');
    expect(i).toMatchObject({ id: `${evento.id}_est1`, estado: EstadoInscripcion.ACTIVA, fcmToken: 'token-fcm' });
    expect((await ctx.repos.eventRepo.findById(evento.id)).cuposOcupados).toBe(1);
  });

  test('CP-U-25 [RF-06] inscribir: no permite inscribirse dos veces (409)', async () => {
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id);
    await expect(ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id)).rejects.toMatchObject({ status: 409 });
  });

  test('CP-U-26 [RF-07] al llenarse el cupo el evento pasa a CUPO_LLENO y rechaza con "Cupo lleno"', async () => {
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est2, evento.id);
    expect((await ctx.repos.eventRepo.findById(evento.id)).estado).toBe(EstadoEvento.CUPO_LLENO);

    const otro = { ...ctx.usuarios.est, id: 'est3' };
    await expect(ctx.services.inscriptionService.inscribir(otro, evento.id)).rejects.toMatchObject({
      status: 409,
      message: 'Cupo lleno',
    });
  });

  test('CP-U-27 [RF-06][RNF-Seguridad] un coordinador no puede inscribirse (403)', async () => {
    await expect(ctx.services.inscriptionService.inscribir(ctx.usuarios.coord, evento.id)).rejects.toMatchObject({ status: 403 });
  });

  test('CP-U-28 [RF-06][RF-03] no permite inscribirse en un evento eliminado (cancelado)', async () => {
    await ctx.services.eventService.cancelar(ctx.usuarios.coord, evento.id);
    await expect(ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id)).rejects.toMatchObject({ status: 409 });
  });

  test('CP-U-29 [RF-06] no permite inscribirse en un evento que ya inició', async () => {
    ctx.reloj.ahora = new Date('2026-11-20T09:30:00-06:00');
    await expect(ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id)).rejects.toMatchObject({ status: 409 });
  });

  test('CP-U-30 [RF-06] evento inexistente responde 404 y no escribe nada', async () => {
    await expect(ctx.services.inscriptionService.inscribir(ctx.usuarios.est, 'no-existe')).rejects.toMatchObject({ status: 404 });
    expect(await ctx.repos.inscriptionRepo.findById('no-existe', 'est1')).toBeNull();
  });

  test('CP-U-31 [RF-08] cancelar: libera el cupo y el evento vuelve a PUBLICADO', async () => {
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est2, evento.id);
    const i = await ctx.services.inscriptionService.cancelar(ctx.usuarios.est, evento.id);
    expect(i.estado).toBe(EstadoInscripcion.CANCELADA);
    expect(await ctx.repos.eventRepo.findById(evento.id)).toMatchObject({ cuposOcupados: 1, estado: EstadoEvento.PUBLICADO });
  });

  test('CP-U-32 [RF-08] cancelar después del inicio del evento no está permitido (409)', async () => {
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id);
    ctx.reloj.ahora = new Date('2026-11-20T10:00:00-06:00');
    await expect(ctx.services.inscriptionService.cancelar(ctx.usuarios.est, evento.id)).rejects.toMatchObject({ status: 409 });
  });

  test('CP-U-33 [RF-08] cancelar sin inscripción activa responde 404', async () => {
    await expect(ctx.services.inscriptionService.cancelar(ctx.usuarios.est, evento.id)).rejects.toMatchObject({ status: 404 });
  });

  test('CP-U-34 [RF-06][RF-08] se puede volver a inscribir después de cancelar', async () => {
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id);
    await ctx.services.inscriptionService.cancelar(ctx.usuarios.est, evento.id);
    const i = await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id);
    expect(i.estado).toBe(EstadoInscripcion.ACTIVA);
  });

  test('CP-U-35 [RF-13][RNF-Seguridad] el coordinador ve nombre y estado de los inscritos; otro coordinador no', async () => {
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id);
    const lista = await ctx.services.inscriptionService.inscritos(ctx.usuarios.coord, evento.id);
    expect(lista).toEqual([expect.objectContaining({ userId: 'est1', nombre: 'Ana Estudiante', estado: 'ACTIVA' })]);
    await expect(ctx.services.inscriptionService.inscritos(ctx.usuarios.coord2, evento.id)).rejects.toMatchObject({ status: 403 });
  });

  test('CP-U-36 [RF-17] historial: el estudiante ve sus inscripciones activas y canceladas', async () => {
    const otro = await ctx.services.eventService.crear(ctx.usuarios.coord, { ...ctx.eventoBase, nombre: 'Otro' });
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, otro.id);
    await ctx.services.inscriptionService.cancelar(ctx.usuarios.est, otro.id);
    const h = await ctx.services.inscriptionService.misInscripciones(ctx.usuarios.est);
    expect(h.map((i) => i.estado).sort()).toEqual(['ACTIVA', 'CANCELADA']);
  });
});
