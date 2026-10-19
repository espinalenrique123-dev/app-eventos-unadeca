const { buildTestContext } = require('../helpers/buildTestContext');
const { Rol } = require('../../src/models/enums');

describe('AttendanceService', () => {
  let ctx;
  let evento;
  beforeEach(async () => {
    ctx = buildTestContext();
    evento = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id);
  });

  test('registra la asistencia de un estudiante inscrito', async () => {
    const a = await ctx.services.attendanceService.registrar(ctx.usuarios.coord, evento.id, { userId: 'est1', asistio: true });
    expect(a).toMatchObject({ eventId: evento.id, userId: 'est1', asistio: true, registradoPor: 'coord1' });
  });

  test('rechaza estudiantes no inscritos (409)', async () => {
    await expect(
      ctx.services.attendanceService.registrar(ctx.usuarios.coord, evento.id, { userId: 'est2', asistio: true }),
    ).rejects.toMatchObject({ status: 409 });
  });

  test('valida que asistio sea booleano (400)', async () => {
    await expect(
      ctx.services.attendanceService.registrar(ctx.usuarios.coord, evento.id, { userId: 'est1', asistio: 'si' }),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe('UserService', () => {
  let ctx;
  beforeEach(() => {
    ctx = buildTestContext();
  });

  test('un usuario nuevo se crea como estudiante activo', async () => {
    const u = await ctx.services.userService.obtenerOCrearPerfil({ uid: 'nuevo', email: 'n@unadeca.net', name: 'Nuevo' });
    expect(u).toMatchObject({ rol: Rol.ESTUDIANTE, activo: true, nombre: 'Nuevo' });
  });

  test('actualizarPerfil solo cambia el nombre, nunca el rol', async () => {
    const u = await ctx.services.userService.actualizarPerfil('est1', { nombre: 'Ana María', rol: 'administrador' });
    expect(u).toMatchObject({ nombre: 'Ana María', rol: Rol.ESTUDIANTE });
  });

  test('el administrador cambia roles, pero no el suyo propio', async () => {
    const u = await ctx.services.userService.cambiarRol(ctx.usuarios.admin, 'est1', Rol.COORDINADOR);
    expect(u.rol).toBe(Rol.COORDINADOR);
    await expect(ctx.services.userService.cambiarRol(ctx.usuarios.admin, 'admin1', Rol.ESTUDIANTE)).rejects.toMatchObject({ status: 403 });
  });

  test('rechaza roles inválidos', async () => {
    await expect(ctx.services.userService.cambiarRol(ctx.usuarios.admin, 'est1', 'superusuario')).rejects.toMatchObject({ status: 400 });
  });
});
