const { validarEvento, estadoSegunCupos, haIniciado } = require('../../src/models/Event');
const { EstadoEvento } = require('../../src/models/enums');

const valido = {
  nombre: 'Noche Cultural',
  descripcion: 'Presentaciones artísticas',
  fecha: '2026-12-01',
  hora: '18:30',
  lugar: 'Gimnasio',
  categoria: 'Cultural',
  cupoMaximo: '80',
};

describe('Modelo Evento — validación (RF-01, RF-02)', () => {
  test('CP-U-01 [RF-01] acepta un evento completo y convierte cupoMaximo a número', () => {
    expect(validarEvento(valido).cupoMaximo).toBe(80);
  });

  test('CP-U-02 [RF-01][RNF-Seguridad] ignora campos no permitidos (no se puede inyectar estado ni cupos)', () => {
    const r = validarEvento({ ...valido, estado: 'FINALIZADO', cuposOcupados: 999, coordinadorId: 'x' });
    expect(r).not.toHaveProperty('estado');
    expect(r).not.toHaveProperty('cuposOcupados');
    expect(r).not.toHaveProperty('coordinadorId');
  });

  test.each([
    ['nombre', ''],
    ['nombre', '   '],
    ['nombre', 'x'.repeat(501)],
    ['fecha', '01/12/2026'],
    ['hora', '25:00'],
    ['cupoMaximo', 0],
    ['cupoMaximo', 2.5],
  ])('CP-U-03 [RF-01] rechaza campos inválidos: %s = %p', (campo, valor) => {
    expect(() => validarEvento({ ...valido, [campo]: valor })).toThrow();
  });

  test('CP-U-04 [RF-02] en una edición solo valida los campos enviados', () => {
    expect(validarEvento({ lugar: 'Capilla' }, { parcial: true })).toEqual({ lugar: 'Capilla' });
  });
});

describe('Modelo Evento — estado por cupos (RF-07)', () => {
  test('CP-U-05 [RF-07] marca CUPO_LLENO cuando se llena', () => {
    expect(estadoSegunCupos({ estado: EstadoEvento.PUBLICADO, cupoMaximo: 2, cuposOcupados: 2 })).toBe(EstadoEvento.CUPO_LLENO);
  });
  test('CP-U-06 [RF-07][RF-08] vuelve a PUBLICADO cuando se libera un cupo', () => {
    expect(estadoSegunCupos({ estado: EstadoEvento.CUPO_LLENO, cupoMaximo: 2, cuposOcupados: 1 })).toBe(EstadoEvento.PUBLICADO);
  });
  test('CP-U-07 [RF-03] no cambia el estado de un evento CANCELADO', () => {
    expect(estadoSegunCupos({ estado: EstadoEvento.CANCELADO, cupoMaximo: 2, cuposOcupados: 0 })).toBe(EstadoEvento.CANCELADO);
  });
});

describe('Modelo Evento — inicio del evento (RF-06, RF-08)', () => {
  const evento = { fecha: '2026-11-20', hora: '09:00' };
  test('CP-U-08 [RF-08] un evento futuro no ha iniciado', () => {
    expect(haIniciado(evento, new Date('2026-11-20T08:59:00-06:00'))).toBe(false);
  });
  test('CP-U-09 [RF-08] a la hora de inicio (hora de Costa Rica) ya se considera iniciado', () => {
    expect(haIniciado(evento, new Date('2026-11-20T15:00:00Z'))).toBe(true);
  });
});
