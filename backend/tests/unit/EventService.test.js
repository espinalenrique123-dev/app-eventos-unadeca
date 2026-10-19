const { buildTestContext } = require('../helpers/buildTestContext');
const { EstadoEvento } = require('../../src/models/enums');

describe('EventService', () => {
  let ctx;
  beforeEach(() => {
    ctx = buildTestContext();
  });

  test('crear: el evento nace PUBLICADO, sin inscritos y asignado al coordinador', async () => {
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    expect(e).toMatchObject({ estado: EstadoEvento.PUBLICADO, cuposOcupados: 0, coordinadorId: 'coord1' });
  });

  test('actualizar: otro coordinador no puede editar el evento (403)', async () => {
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    await expect(
      ctx.services.eventService.actualizar(ctx.usuarios.coord2, e.id, { lugar: 'Capilla' }),
    ).rejects.toMatchObject({ status: 403 });
  });

  test('actualizar: el administrador sí puede editar cualquier evento', async () => {
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    const r = await ctx.services.eventService.actualizar(ctx.usuarios.admin, e.id, { lugar: 'Capilla' });
    expect(r.lugar).toBe('Capilla');
  });

  test('actualizar: no permite bajar el cupo por debajo de los inscritos', async () => {
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, e.id);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est2, e.id);
    await expect(
      ctx.services.eventService.actualizar(ctx.usuarios.coord, e.id, { cupoMaximo: 1 }),
    ).rejects.toMatchObject({ status: 400 });
  });

  test('actualizar: subir el cupo de un evento lleno lo vuelve a PUBLICADO', async () => {
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, e.id);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est2, e.id);
    const r = await ctx.services.eventService.actualizar(ctx.usuarios.coord, e.id, { cupoMaximo: 5 });
    expect(r.estado).toBe(EstadoEvento.PUBLICADO);
  });

  test('cancelar: cambia el estado y no se puede cancelar dos veces', async () => {
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    const r = await ctx.services.eventService.cancelar(ctx.usuarios.coord, e.id);
    expect(r.estado).toBe(EstadoEvento.CANCELADO);
    await expect(ctx.services.eventService.cancelar(ctx.usuarios.coord, e.id)).rejects.toMatchObject({ status: 409 });
  });

  test('listarVisibles: no muestra eventos cancelados', async () => {
    const a = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    await ctx.services.eventService.crear(ctx.usuarios.coord, { ...ctx.eventoBase, nombre: 'Otro' });
    await ctx.services.eventService.cancelar(ctx.usuarios.coord, a.id);
    const visibles = await ctx.services.eventService.listarVisibles();
    expect(visibles.map((e) => e.nombre)).toEqual(['Otro']);
  });

  test('reporte: calcula inscritos, presentes y porcentaje de asistencia', async () => {
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, e.id);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est2, e.id);
    await ctx.services.attendanceService.registrar(ctx.usuarios.coord, e.id, { userId: 'est1', asistio: true });
    await ctx.services.attendanceService.registrar(ctx.usuarios.coord, e.id, { userId: 'est2', asistio: false });
    const r = await ctx.services.eventService.reporte(ctx.usuarios.coord, e.id);
    expect(r).toMatchObject({ inscritosActivos: 2, presentes: 1, ausentes: 1, porcentajeAsistencia: 50 });
  });

  test('reporteGlobal: cuenta eventos por estado y ocupación', async () => {
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, e.id);
    const r = await ctx.services.eventService.reporteGlobal();
    expect(r).toMatchObject({ totalEventos: 1, cuposTotales: 2, cuposOcupados: 1, porcentajeOcupacion: 50 });
    expect(r.porEstado.PUBLICADO).toBe(1);
  });
});
