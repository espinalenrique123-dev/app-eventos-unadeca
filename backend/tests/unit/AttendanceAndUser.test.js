const { buildTestContext } = require('../helpers/buildTestContext');
const { Rol } = require('../../src/models/enums');

describe('AttendanceService (RF-12)', () => {
  let ctx;
  let evento;
  beforeEach(async () => {
    ctx = buildTestContext();
    evento = await ctx.services.eventService.crear(ctx.usuarios.coord, ctx.eventoBase);
    await ctx.services.inscriptionService.inscribir(ctx.usuarios.est, evento.id);
  });

  test('CP-U-37 [RF-12] registra la asistencia de un estudiante inscrito y queda consultable', async () => {
    const a = await ctx.services.attendanceService.registrar(ctx.usuarios.coord, evento.id, { userId: 'est1', asistio: true });
    expect(a).toMatchObject({ eventId: evento.id, userId: 'est1', asistio: true, registradoPor: 'coord1' });
    expect(await ctx.services.attendanceService.listar(ctx.usuarios.coord, evento.id)).toHaveLength(1);
  });

  test('CP-U-38 [RF-12] rechaza estudiantes no inscritos (409)', async () => {
    await expect(
      ctx.services.attendanceService.registrar(ctx.usuarios.coord, evento.id, { userId: 'est2', asistio: true }),
    ).rejects.toMatchObject({ status: 409 });
  });

  test('CP-U-39 [RF-12] valida que "asistio" sea verdadero o falso (400)', async () => {
    await expect(
      ctx.services.attendanceService.registrar(ctx.usuarios.coord, evento.id, { userId: 'est1', asistio: 'si' }),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe('UserService (RF-15, RF-16)', () => {
  let ctx;
  beforeEach(() => {
    ctx = buildTestContext();
  });

  test('CP-U-40 [RF-15] un usuario nuevo se crea como estudiante con cuenta activa', async () => {
    const u = await ctx.services.userService.obtenerOCrearPerfil({ uid: 'nuevo', email: 'n@unadeca.net', name: 'Nuevo' });
    expect(u).toMatchObject({ rol: Rol.ESTUDIANTE, activo: true, nombre: 'Nuevo' });
  });

  test('CP-U-41 [RNF-Seguridad] actualizar perfil solo cambia el nombre, nunca el rol', async () => {
    const u = await ctx.services.userService.actualizarPerfil('est1', { nombre: 'Ana María', rol: 'administrador' });
    expect(u).toMatchObject({ nombre: 'Ana María', rol: Rol.ESTUDIANTE });
  });

  test('CP-U-42 [RF-16] el administrador cambia roles, pero no el suyo propio', async () => {
    const u = await ctx.services.userService.cambiarRol(ctx.usuarios.admin, 'est1', Rol.COORDINADOR);
    expect(u.rol).toBe(Rol.COORDINADOR);
    await expect(ctx.services.userService.cambiarRol(ctx.usuarios.admin, 'admin1', Rol.ESTUDIANTE)).rejects.toMatchObject({ status: 403 });
  });

  test('CP-U-43 [RF-16] rechaza roles inválidos (400)', async () => {
    await expect(ctx.services.userService.cambiarRol(ctx.usuarios.admin, 'est1', 'superusuario')).rejects.toMatchObject({ status: 400 });
  });

  test('CP-U-44 [RF-16] el administrador desactiva una cuenta', async () => {
    const u = await ctx.services.userService.cambiarActivo(ctx.usuarios.admin, 'est1', false);
    expect(u.activo).toBe(false);
  });
});
