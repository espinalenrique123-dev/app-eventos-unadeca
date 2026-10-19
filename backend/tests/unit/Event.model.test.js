const { validarEvento, estadoSegunCupos } = require('../../src/models/Event');
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

describe('validarEvento', () => {
  test('acepta un evento completo y convierte cupoMaximo a número', () => {
    const r = validarEvento(valido);
    expect(r.cupoMaximo).toBe(80);
  });

  test('ignora campos no permitidos (no se puede inyectar estado ni cupos)', () => {
    const r = validarEvento({ ...valido, estado: 'FINALIZADO', cuposOcupados: 999, coordinadorId: 'x' });
    expect(r).not.toHaveProperty('estado');
    expect(r).not.toHaveProperty('cuposOcupados');
    expect(r).not.toHaveProperty('coordinadorId');
  });

  test.each([
    ['nombre', ''],
    ['fecha', '01/12/2026'],
    ['hora', '25:00'],
    ['cupoMaximo', 0],
    ['cupoMaximo', 2.5],
  ])('rechaza %s = %p', (campo, valor) => {
    expect(() => validarEvento({ ...valido, [campo]: valor })).toThrow();
  });

  test('en modo parcial solo valida los campos enviados', () => {
    expect(validarEvento({ lugar: 'Capilla' }, { parcial: true })).toEqual({ lugar: 'Capilla' });
  });
});

describe('estadoSegunCupos', () => {
  test('marca CUPO_LLENO cuando se llena', () => {
    expect(estadoSegunCupos({ estado: EstadoEvento.PUBLICADO, cupoMaximo: 2, cuposOcupados: 2 })).toBe(EstadoEvento.CUPO_LLENO);
  });
  test('vuelve a PUBLICADO cuando se libera un cupo', () => {
    expect(estadoSegunCupos({ estado: EstadoEvento.CUPO_LLENO, cupoMaximo: 2, cuposOcupados: 1 })).toBe(EstadoEvento.PUBLICADO);
  });
  test('no cambia un evento CANCELADO', () => {
    expect(estadoSegunCupos({ estado: EstadoEvento.CANCELADO, cupoMaximo: 2, cuposOcupados: 0 })).toBe(EstadoEvento.CANCELADO);
  });
});
