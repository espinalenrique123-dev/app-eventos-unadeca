const { buildTestContext } = require('../helpers/buildTestContext');
const { EstadoEvento, EstadoInscripcion } = require('../../src/models/enums');

describe('InscriptionService', () => {
  let ctx;
  let evento;
  beforeEach(async () => {
    ctx = buildTestContext();
    evento = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase); // cupoMaximo = 2
  });

  test('inscribir: crea la inscripción con id {eventId}_{userId} y ocupa un cupo', async () => {
    const i = await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id, 'token-fcm');
    expect(i).toMatchObject({ id: `${evento.id}_est1`, estado: EstadoInscripcion.ACTIVA, fcmToken: 'token-fcm' });
    const e = await ctx.repos.eventRepo.findById(evento.id);
    expect(e.cuposOcupados).toBe(1);
  });

  test('inscribir: no permite inscribirse dos veces (409)', async () => {
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id);
    await expect(ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id)).rejects.toMatchObject({ status: 409 });
  });

  test('inscribir: al llenar el cupo el evento pasa a CUPO_LLENO y rechaza más inscripciones', async () => {
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est2, evento.id);
    const e = await ctx.repos.eventRepo.findById(evento.id);
    expect(e.estado).toBe(EstadoEvento.CUPO_LLENO);

    const otro = { ...ctx.usuarios.est, id: 'est3' };
    await expect(ctx.services.inscriptionService.inscribir(otro, evento.id)).rejects.toMatchObject({ status: 409 });
  });

  test('inscribir: un coordinador no puede inscribirse (403)', async () => {
    await expect(ctx.services.inscriptionService.inscribir(ctx.usuarios.coord, evento.id)).rejects.toMatchObject({ status: 403 });
  });

  test('inscribir: no permite inscribirse en un evento cancelado', async () => {
    await ctx.services.eventService.cancelar(ctx.usuarios.coord, evento.id);
    await expect(ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id)).rejects.toMatchObject({ status: 409 });
  });

  test('inscribir: evento inexistente (404) y sin escribir nada', async () => {
    await expect(ctx.services.inscriptionService.inscribir(ctx.usuarios.est, 'no-existe')).rejects.toMatchObject({ status: 404 });
    expect(await ctx.repos.inscriptionRepo.findById('no-existe', 'est1')).toBeNull();
  });

  test('cancelar: libera el cupo y el evento vuelve a PUBLICADO', async () => {
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est2, evento.id);
    const i = await ctx.services.inscriptionService.cancelar(ctx.usuarios.est, evento.id);
    expect(i.estado).toBe(EstadoInscripcion.CANCELADA);
    const e = await ctx.repos.eventRepo.findById(evento.id);
    expect(e).toMatchObject({ cuposOcupados: 1, estado: EstadoEvento.PUBLICADO });
  });

  test('cancelar: sin inscripción activa responde 404', async () => {
    await expect(ctx.services.inscriptionService.cancelar(ctx.usuarios.est, evento.id)).rejects.toMatchObject({ status: 404 });
  });

  test('se puede volver a inscribir después de cancelar', async () => {
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id);
    await ctx.services.inscriptionService.cancelar(ctx.usuarios.est, evento.id);
    const i = await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id);
    expect(i.estado).toBe(EstadoInscripcion.ACTIVA);
  });

  test('inscritos: el coordinador del evento ve nombre y correo; otro coordinador no', async () => {
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id);
    const lista = await ctx.services.inscriptionService.inscritos(ctx.usuarios.coord, evento.id);
    expect(lista).toEqual([expect.objectContaining({ userId: 'est1', nombre: 'Ana Estudiante' })]);
    await expect(ctx.services.inscriptionService.inscritos(ctx.usuarios.coord2, evento.id)).rejects.toMatchObject({ status: 403 });
  });
});
