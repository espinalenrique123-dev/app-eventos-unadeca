const { buildTestContext } = require('../helpers/buildTestContext');
const { EstadoEvento } = require('../../src/models/enums');

describe('EventService (RF-01 a RF-05, RF-14)', () => {
  let ctx;
  beforeEach(() => {
    ctx = buildTestContext();
  });

  test('CP-U-10 [RF-01] crear: el evento nace PUBLICADO, sin inscritos y asignado al coordinador', async () => {
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    expect(e).toMatchObject({ estado: EstadoEvento.PUBLICADO, cuposOcupados: 0, coordinadorId: 'coord1' });
  });

  test('CP-U-11 [RF-01][RF-04] el evento creado queda visible para los estudiantes', async () => {
    await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    const visibles = await ctx.services.eventService.listarVisibles();
    expect(visibles.map((e) => e.nombre)).toEqual(['Feria Tecnológica 2026']);
  });

  test('CP-U-12 [RF-02][RNF-Seguridad] editar: otro coordinador no puede editar el evento (403)', async () => {
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    await expect(
      ctx.services.eventService.actualizar(ctx.usuarios.coord2, e.id, { lugar: 'Capilla' }),
    ).rejects.toMatchObject({ status: 403 });
  });

  test('CP-U-13 [RF-02] editar: el cambio se refleja al consultar el evento', async () => {
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    await ctx.services.eventService.actualizar(ctx.usuarios.coord, e.id, { lugar: 'Capilla' });
    expect((await ctx.services.eventService.obtener(e.id)).lugar).toBe('Capilla');
  });

  test('CP-U-14 [RF-02][RNF-Seguridad] editar: el administrador puede editar cualquier evento', async () => {
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    const r = await ctx.services.eventService.actualizar(ctx.usuarios.admin, e.id, { lugar: 'Capilla' });
    expect(r.lugar).toBe('Capilla');
  });

  test('CP-U-15 [RF-02][RF-07] editar: no permite bajar el cupo por debajo de los inscritos', async () => {
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, e.id);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est2, e.id);
    await expect(
      ctx.services.eventService.actualizar(ctx.usuarios.coord, e.id, { cupoMaximo: 1 }),
    ).rejects.toMatchObject({ status: 400 });
  });

  test('CP-U-16 [RF-02][RF-07] editar: subir el cupo de un evento lleno lo vuelve a PUBLICADO', async () => {
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, e.id);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est2, e.id);
    const r = await ctx.services.eventService.actualizar(ctx.usuarios.coord, e.id, { cupoMaximo: 5 });
    expect(r.estado).toBe(EstadoEvento.PUBLICADO);
  });

  test('CP-U-17 [RF-03] eliminar: el evento pasa a CANCELADO y no se puede cancelar dos veces', async () => {
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    const r = await ctx.services.eventService.cancelar(ctx.usuarios.coord, e.id);
    expect(r.estado).toBe(EstadoEvento.CANCELADO);
    await expect(ctx.services.eventService.cancelar(ctx.usuarios.coord, e.id)).rejects.toMatchObject({ status: 409 });
  });

  test('CP-U-18 [RF-03][RF-04] un evento eliminado desaparece de la lista del estudiante', async () => {
    const a = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    await ctx.services.eventService.crear(ctx.usuarios.coord, { ...ctx.eventoBase, nombre: 'Otro' });
    await ctx.services.eventService.cancelar(ctx.usuarios.coord, a.id);
    const visibles = await ctx.services.eventService.listarVisibles();
    expect(visibles.map((e) => e.nombre)).toEqual(['Otro']);
  });

  test('CP-U-19 [RF-04] la lista de eventos está ordenada por fecha', async () => {
    await ctx.services.eventService.crear(ctx.usuarios.coord, { ...ctx.eventoBase, nombre: 'Diciembre', fecha: '2026-12-05' });
    await ctx.services.eventService.crear(ctx.usuarios.coord, { ...ctx.eventoBase, nombre: 'Noviembre', fecha: '2026-11-02' });
    const visibles = await ctx.services.eventService.listarVisibles();
    expect(visibles.map((e) => e.nombre)).toEqual(['Noviembre', 'Diciembre']);
  });

  test('CP-U-20 [RF-05] detalle: devuelve toda la información del evento', async () => {
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    const d = await ctx.services.eventService.obtener(e.id);
    expect(d).toMatchObject({ ...ctx.eventoBase, cuposOcupados: 0, estado: EstadoEvento.PUBLICADO });
  });

  test('CP-U-21 [RF-05] detalle: evento inexistente responde 404', async () => {
    await expect(ctx.services.eventService.obtener('no-existe')).rejects.toMatchObject({ status: 404 });
  });

  test('CP-U-22 [RF-14] reporte: calcula inscritos, presentes y porcentaje de asistencia', async () => {
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, e.id);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est2, e.id);
    await ctx.services.attendanceService.registrar(ctx.usuarios.coord, e.id, { userId: 'est1', asistio: true });
    await ctx.services.attendanceService.registrar(ctx.usuarios.coord, e.id, { userId: 'est2', asistio: false });
    const r = await ctx.services.eventService.reporte(ctx.usuarios.coord, e.id);
    expect(r).toMatchObject({ inscritosActivos: 2, presentes: 1, ausentes: 1, porcentajeAsistencia: 50 });
  });

  test('CP-U-23 [RF-14] reporte global: cuenta eventos por estado y ocupación', async () => {
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, e.id);
    const r = await ctx.services.eventService.reporteGlobal();
    expect(r).toMatchObject({ totalEventos: 1, cuposTotales: 2, cuposOcupados: 1, porcentajeOcupacion: 50 });
    expect(r.porEstado.PUBLICADO).toBe(1);
  });
});
