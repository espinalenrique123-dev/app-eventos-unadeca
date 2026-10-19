const FirebaseConfig = require('./config/FirebaseConfig');
const FirebaseFacade = require('./facade/FirebaseFacade');
const UserRepository = require('./repositories/UserRepository');
const EventRepository = require('./repositories/EventRepository');
const { InscriptionRepository } = require('./repositories/InscriptionRepository');
const AttendanceRepository = require('./repositories/AttendanceRepository');
const UserService = require('./services/UserService');
const EventService = require('./services/EventService');
const InscriptionService = require('./services/InscriptionService');
const AttendanceService = require('./services/AttendanceService');

/** Arma las capas con Firebase real: Config (Singleton) → Facade → Repositorios → Servicios. */
function buildContainer() {
  const facade = new FirebaseFacade(FirebaseConfig.getInstance());

  const repos = {
    userRepo: new UserRepository(facade),
    eventRepo: new EventRepository(facade),
    inscriptionRepo: new InscriptionRepository(facade),
    attendanceRepo: new AttendanceRepository(facade),
  };

  const services = {
    userService: new UserService(repos),
    eventService: new EventService(repos),
    inscriptionService: new InscriptionService(repos),
    attendanceService: new AttendanceService(repos),
  };

  return { services, verifyIdToken: (t) => facade.verifyIdToken(t) };
}

module.exports = { buildContainer };
