const { EstadoEvento, EstadoInscripcion } = require('../models/enums');
const { badRequest, conflict } = require('../utils/errors');
const { eventoGestionable } = require('./permisos');

/** Trazabilidad: RF-12 (registrar asistencia y consultarla). */
class AttendanceService {
  constructor({ attendanceRepo, inscriptionRepo, eventRepo }) {
    this.attendanceRepo = attendanceRepo;
    this.inscriptionRepo = inscriptionRepo;
    this.eventRepo = eventRepo;
  }

  /** El coordinador marca si un estudiante inscrito asistió o no. */
  async registrar(usuario, eventId, { userId, asistio } = {}) {
    if (typeof userId !== 'string' || !userId) throw badRequest('"userId" es obligatorio');
    if (typeof asistio !== 'boolean') throw badRequest('"asistio" debe ser true o false');

    const evento = await eventoGestionable(this.eventRepo, usuario, eventId);
    if (evento.estado === EstadoEvento.CANCELADO) throw conflict('El evento está cancelado');

    const inscripcion = await this.inscriptionRepo.findById(eventId, userId);
    if (!inscripcion || inscripcion.estado !== EstadoInscripcion.ACTIVA) {
      throw conflict('El estudiante no tiene una inscripción activa en este evento');
    }
    return this.attendanceRepo.registrar(eventId, userId, asistio, usuario.id);
  }

  async listar(usuario, eventId) {
    await eventoGestionable(this.eventRepo, usuario, eventId);
    return this.attendanceRepo.findByEvent(eventId);
  }
}

module.exports = AttendanceService;
