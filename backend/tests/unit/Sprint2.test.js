const { buildTestContext } = require('../helpers/buildTestContext');
const { Rol } = require('../../src/models/enums');

/** Sprint 2 — RF-18 (filtro por categoría), RF-16 (crear cuentas) y RF-14 (reporte CSV). */

async function conEventos(ctx) {
  const { eventService } = ctx.services;
  const { coord } = ctx.usuarios;
  await eventService.crear(coord, { ...ctx.eventoBase, nombre: 'Feria', categoria: 'Académico' });
  await eventService.crear(coord, { ...ctx.eventoBase, nombre: 'Concierto', categoria: 'Cultural', fecha: '2026-11-10' });
  await eventService.crear(coord, { ...ctx.eventoBase, nombre: 'Torneo', categoria: 'Deportivo', fecha: '2026-11-15' });
}

describe('EventService — filtro por categoría (RF-18)', () => {
  test('CP-U-45 [RF-18] sin categoría devuelve todos los eventos visibles', async () => {
    const ctx = buildTestContext();
    await conEventos(ctx);
    expect(await ctx.services.eventService.listarVisibles()).toHaveLength(3);
  });

  test('CP-U-46 [RF-18] filtra por categoría sin importar mayúsculas ni tildes', async () => {
    const ctx = buildTestContext();
    await conEventos(ctx);
    const r = await ctx.services.eventService.listarVisibles({ categoria: 'academico' });
    expect(r.map((e) => e.nombre)).toEqual(['Feria']);
  });

  test('CP-U-47 [RF-18] una categoría sin eventos devuelve una lista vacía', async () => {
    const ctx = buildTestContext();
    await conEventos(ctx);
    expect(await ctx.services.eventService.listarVisibles({ categoria: 'Religioso' })).toEqual([]);
  });

  test('CP-U-48 [RF-18] el filtro no muestra eventos cancelados', async () => {
    const ctx = buildTestContext();
    await conEventos(ctx);
    const [feria] = await ctx.services.eventService.listarVisibles({ categoria: 'Académico' });
    await ctx.services.eventService.cancelar(ctx.usuarios.coord, feria.id);
    expect(await ctx.services.eventService.listarVisibles({ categoria: 'Académico' })).toEqual([]);
  });

  test('CP-U-49 [RF-18] categorías disponibles, sin repetir y en orden alfabético', async () => {
    const ctx = buildTestContext();
    await conEventos(ctx);
    expect(await ctx.services.eventService.categorias()).toEqual(['Académico', 'Cultural', 'Deportivo']);
  });

  test('CP-U-50 [RF-18][RNF-Seguridad] rechaza una categoría que no es texto o es demasiado larga', async () => {
    const ctx = buildTestContext();
    await expect(ctx.services.eventService.listarVisibles({ categoria: ['x'] })).rejects.toMatchObject({ status: 400 });
    await expect(ctx.services.eventService.listarVisibles({ categoria: 'x'.repeat(101) })).rejects.toMatchObject({ status: 400 });
  });
});

describe('UserService — creación de cuentas (RF-16)', () => {
  const nueva = { nombre: 'María Coordinadora', email: 'Maria@unadeca.net', rol: Rol.COORDINADOR };

  test('CP-U-51 [RF-16] crea la cuenta con su rol y devuelve un enlace para definir la contraseña', async () => {
    const ctx = buildTestContext();
    const r = await ctx.services.userService.crearCuenta(nueva);
    expect(r.usuario).toMatchObject({ nombre: 'María Coordinadora', email: 'maria@unadeca.net', rol: Rol.COORDINADOR, activo: true });
    expect(r.enlaceContrasena).toContain('maria%40unadeca.net');
    expect(r).not.toHaveProperty('password');
  });

  test('CP-U-52 [RF-16][RNF-Seguridad] solo acepta correos institucionales @unadeca.net', async () => {
    const ctx = buildTestContext();
    await expect(ctx.services.userService.crearCuenta({ ...nueva, email: 'maria@gmail.com' })).rejects.toMatchObject({ status: 400 });
    expect(ctx.authGateway.cuentas.size).toBe(0);
  });

  test('CP-U-53 [RF-16] rechaza un rol inválido o un nombre vacío', async () => {
    const ctx = buildTestContext();
    await expect(ctx.services.userService.crearCuenta({ ...nueva, rol: 'superusuario' })).rejects.toMatchObject({ status: 400 });
    await expect(ctx.services.userService.crearCuenta({ ...nueva, nombre: '  ' })).rejects.toMatchObject({ status: 400 });
  });

  test('CP-U-54 [RF-16] un correo ya registrado responde 409', async () => {
    const ctx = buildTestContext();
    await ctx.services.userService.crearCuenta(nueva);
    await expect(ctx.services.userService.crearCuenta(nueva)).rejects.toMatchObject({ status: 409 });
  });
});

describe('EventService — reporte CSV (RF-14)', () => {
  test('CP-U-55 [RF-14] el CSV tiene los mismos datos que el reporte', async () => {
    const ctx = buildTestContext();
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, e.id, 'tok');
    const csv = await ctx.services.eventService.reporteCsv(ctx.usuarios.coord, e.id);
    expect(csv).toContain('"Evento","Feria Tecnológica 2026"');
    expect(csv).toContain('"Inscritos activos","1"');
  });

  test('CP-U-56 [RF-14][RNF-Seguridad] neutraliza fórmulas y escapa comillas (inyección CSV)', async () => {
    const ctx = buildTestContext();
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, { ...ctx.eventoBase, nombre: '=HYPERLINK("x")' });
    const csv = await ctx.services.eventService.reporteCsv(ctx.usuarios.coord, e.id);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
  });

  test('CP-U-57 [RF-14][RNF-Seguridad] otro coordinador no puede descargar el reporte', async () => {
    const ctx = buildTestContext();
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    await expect(ctx.services.eventService.reporteCsv(ctx.usuarios.coord2, e.id)).rejects.toMatchObject({ status: 403 });
  });
});

describe('InscriptionService — "Mis eventos" (RF-17)', () => {
  test('CP-U-58 [RF-17][RNF-Seguridad] cada inscripción trae el resumen del evento y no expone el token FCM', async () => {
    const ctx = buildTestContext();
    const e = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, e.id, 'token-secreto');
    const [i] = await ctx.services.inscriptionService.misInscripciones(ctx.usuarios.est);
    expect(i.evento).toMatchObject({ nombre: 'Feria Tecnológica 2026', fecha: '2026-11-20', lugar: 'Auditorio principal' });
    expect(i).not.toHaveProperty('fcmToken');
  });
});
