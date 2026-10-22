const FakeFacade = require('./FakeFacade');
const UserRepository = require('../../src/repositories/UserRepository');
const EventRepository = require('../../src/repositories/EventRepository');
const { InscriptionRepository } = require('../../src/repositories/InscriptionRepository');
const AttendanceRepository = require('../../src/repositories/AttendanceRepository');
const UserService = require('../../src/services/UserService');
const EventService = require('../../src/services/EventService');
const InscriptionService = require('../../src/services/InscriptionService');
const AttendanceService = require('../../src/services/AttendanceService');
const { Rol } = require('../../src/models/enums');

/** Hora fija de las pruebas: así los resultados no dependen del día en que se ejecutan. */
const AHORA = new Date('2026-10-21T12:00:00-06:00');

/**
 * Arma servicios y repositorios reales sobre la fachada en memoria.
 * @param {{ahora?: Date}} [opciones]  permite simular otra hora actual (RF-08: "antes del inicio")
 */
function buildTestContext({ ahora = AHORA } = {}) {
  const facade = new FakeFacade();
  const reloj = { ahora };
  const repos = {
    userRepo: new UserRepository(facade),
    eventRepo: new EventRepository(facade),
    inscriptionRepo: new InscriptionRepository(facade),
    attendanceRepo: new AttendanceRepository(facade),
  };
  const services = {
    userService: new UserService(repos),
    eventService: new EventService(repos),
    inscriptionService: new InscriptionService({ ...repos, reloj: () => reloj.ahora }),
    attendanceService: new AttendanceService(repos),
  };

  const usuarios = {
    admin: { id: 'admin1', nombre: 'Admin', email: 'admin@unadeca.net', rol: Rol.ADMINISTRADOR, activo: true },
    coord: { id: 'coord1', nombre: 'Carlos Molina', email: 'coord@unadeca.net', rol: Rol.COORDINADOR, activo: true },
    coord2: { id: 'coord2', nombre: 'Otra Coordinadora', email: 'coord2@unadeca.net', rol: Rol.COORDINADOR, activo: true },
    est: { id: 'est1', nombre: 'Ana Estudiante', email: 'ana@unadeca.net', rol: Rol.ESTUDIANTE, activo: true },
    est2: { id: 'est2', nombre: 'Luis Estudiante', email: 'luis@unadeca.net', rol: Rol.ESTUDIANTE, activo: true },
  };
  for (const u of Object.values(usuarios)) {
    const { id, ...rest } = u;
    facade.col('users').set(id, rest);
  }

  const eventoBase = {
    nombre: 'Feria Tecnológica 2026',
    descripcion: 'Exposición de proyectos de Ingeniería de Sistemas',
    fecha: '2026-11-20',
    hora: '09:00',
    lugar: 'Auditorio principal',
    categoria: 'Académico',
    cupoMaximo: 2,
  };

  return { facade, repos, services, usuarios, eventoBase, reloj };
}

module.exports = { buildTestContext, AHORA };
