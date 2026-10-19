const { EstadoEvento, EstadoInscripcion, Rol } = require('../models/enums');
const { estadoSegunCupos } = require('../models/Event');
const { badRequest, conflict, forbidden, notFound } = require('../utils/errors');
const { eventoGestionable } = require('./permisos');

class InscriptionService {
  constructor({ inscriptionRepo, eventRepo, userRepo }) {
    this.inscriptionRepo = inscriptionRepo;
    this.eventRepo = eventRepo;
    this.userRepo = userRepo;
  }

  /**
   * Inscribe al estudiante. La validación de cupos ocurre dentro de una
   * transacción para que dos inscripciones simultáneas no superen el cupo.
   */
  async inscribir(usuario, eventId, fcmToken) {
    if (usuario.rol !== Rol.ESTUDIANTE) throw forbidden('Solo los estudiantes pueden inscribirse');
    if (fcmToken !== undefined && fcmToken !== null && typeof fcmToken !== 'string') {
      throw badRequest('"fcmToken" debe ser texto');
    }

    return this.inscriptionRepo.transaccion(eventId, usuario.id, (evento, existente) => {
      if (!evento) throw notFound('Evento no encontrado');
      if (existente && existente.estado === EstadoInscripcion.ACTIVA) {
        throw conflict('Ya está inscrito en este evento');
      }
      if (evento.estado === EstadoEvento.CUPO_LLENO || evento.cuposOcupados >= evento.cupoMaximo) {
        throw conflict('El evento no tiene cupos disponibles');
      }
      if (evento.estado !== EstadoEvento.PUBLICADO) throw conflict('El evento no admite inscripciones');

      const cuposOcupados = evento.cuposOcupados + 1;
      return {
        evento: { cuposOcupados, estado: estadoSegunCupos({ ...evento, cuposOcupados }) },
        inscripcion: {
          eventId,
          userId: usuario.id,
          estado: EstadoInscripcion.ACTIVA,
          fcmToken: fcmToken || null,
          fecha: new Date().toISOString(),
        },
      };
    });
  }

  /** Cancela la inscripción del propio estudiante y libera el cupo. */
  async cancelar(usuario, eventId) {
    return this.inscriptionRepo.transaccion(eventId, usuario.id, (evento, existente) => {
      if (!evento) throw notFound('Evento no encontrado');
      if (!existente || existente.estado !== EstadoInscripcion.ACTIVA) {
        throw notFound('No tiene una inscripción activa en este evento');
      }
      if (evento.estado === EstadoEvento.FINALIZADO) throw conflict('El evento ya finalizó');

      const cuposOcupados = Math.max(0, evento.cuposOcupados - 1);
      return {
        evento: { cuposOcupados, estado: estadoSegunCupos({ ...evento, cuposOcupados }) },
        inscripcion: { ...existente, estado: EstadoInscripcion.CANCELADA },
      };
    });
  }

  misInscripciones(usuario) {
    return this.inscriptionRepo.findByUser(usuario.id);
  }

  /** Lista de inscritos activos de un evento (solo su coordinador o un administrador). */
  async inscritos(usuario, eventId) {
    await eventoGestionable(this.eventRepo, usuario, eventId);
    const activas = await this.inscriptionRepo.findByEvent(eventId, EstadoInscripcion.ACTIVA);
    const usuarios = await Promise.all(activas.map((i) => this.userRepo.findById(i.userId)));
    return activas.map((i, k) => ({
      userId: i.userId,
      nombre: usuarios[k]?.nombre ?? '(sin nombre)',
      email: usuarios[k]?.email ?? '',
      fecha: i.fecha,
    }));
  }
}

module.exports = InscriptionService;
