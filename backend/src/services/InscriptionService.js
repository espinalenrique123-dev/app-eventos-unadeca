const { EstadoEvento, EstadoInscripcion, Rol } = require('../models/enums');
const { estadoSegunCupos, haIniciado } = require('../models/Event');
const { badRequest, conflict, forbidden, notFound } = require('../utils/errors');
const { eventoGestionable } = require('./permisos');

/**
 * Inscripciones de estudiantes.
 * Trazabilidad: RF-06 (inscribirse), RF-07 (cupo lleno), RF-08 (cancelar antes del inicio),
 * RF-13 (lista de inscritos), RF-17 (historial), RNF Seguridad (control de acceso por rol).
 */
class InscriptionService {
  /**
   * @param {object} deps
   * @param {() => Date} [deps.reloj]  fuente de la hora actual (se inyecta en las pruebas)
   */
  constructor({ inscriptionRepo, eventRepo, userRepo, reloj = () => new Date() }) {
    this.inscriptionRepo = inscriptionRepo;
    this.eventRepo = eventRepo;
    this.userRepo = userRepo;
    this.reloj = reloj;
  }

  /**
   * RF-06 / RF-07: inscribe al estudiante. La validación de cupos ocurre dentro de una
   * transacción para que dos inscripciones simultáneas no superen el cupo.
   */
  async inscribir(usuario, eventId, fcmToken) {
    if (usuario.rol !== Rol.ESTUDIANTE) throw forbidden('Solo los estudiantes pueden inscribirse');
    if (fcmToken !== undefined && fcmToken !== null && typeof fcmToken !== 'string') {
      throw badRequest('"fcmToken" debe ser texto');
    }
    const ahora = this.reloj();

    return this.inscriptionRepo.transaccion(eventId, usuario.id, (evento, existente) => {
      if (!evento) throw notFound('Evento no encontrado');
      if (existente && existente.estado === EstadoInscripcion.ACTIVA) {
        throw conflict('Ya está inscrito en este evento');
      }
      if (evento.estado === EstadoEvento.CUPO_LLENO || evento.cuposOcupados >= evento.cupoMaximo) {
        throw conflict('Cupo lleno'); // RF-07: mismo mensaje que muestra la app
      }
      if (evento.estado !== EstadoEvento.PUBLICADO) throw conflict('El evento no admite inscripciones');
      if (haIniciado(evento, ahora)) throw conflict('El evento ya inició');

      const cuposOcupados = evento.cuposOcupados + 1;
      return {
        evento: { cuposOcupados, estado: estadoSegunCupos({ ...evento, cuposOcupados }) },
        inscripcion: {
          eventId,
          userId: usuario.id,
          estado: EstadoInscripcion.ACTIVA,
          fcmToken: fcmToken || null,
          fecha: ahora.toISOString(),
        },
      };
    });
  }

  /** RF-08: cancela la inscripción del propio estudiante antes del inicio y libera el cupo. */
  async cancelar(usuario, eventId) {
    const ahora = this.reloj();
    return this.inscriptionRepo.transaccion(eventId, usuario.id, (evento, existente) => {
      if (!evento) throw notFound('Evento no encontrado');
      if (!existente || existente.estado !== EstadoInscripcion.ACTIVA) {
        throw notFound('No tiene una inscripción activa en este evento');
      }
      if (evento.estado === EstadoEvento.FINALIZADO || haIniciado(evento, ahora)) {
        throw conflict('Solo se puede cancelar antes del inicio del evento');
      }

      const cuposOcupados = Math.max(0, evento.cuposOcupados - 1);
      return {
        evento: { cuposOcupados, estado: estadoSegunCupos({ ...evento, cuposOcupados }) },
        inscripcion: { ...existente, estado: EstadoInscripcion.CANCELADA },
      };
    });
  }

  /** RF-17: historial de inscripciones del estudiante. */
  misInscripciones(usuario) {
    return this.inscriptionRepo.findByUser(usuario.id);
  }

  /** RF-13: lista de inscritos activos de un evento (solo su coordinador o un administrador). */
  async inscritos(usuario, eventId) {
    await eventoGestionable(this.eventRepo, usuario, eventId);
    const activas = await this.inscriptionRepo.findByEvent(eventId, EstadoInscripcion.ACTIVA);
    const usuarios = await Promise.all(activas.map((i) => this.userRepo.findById(i.userId)));
    return activas.map((i, k) => ({
      userId: i.userId,
      nombre: usuarios[k]?.nombre ?? '(sin nombre)',
      email: usuarios[k]?.email ?? '',
      estado: i.estado,
      fecha: i.fecha,
    }));
  }
}

module.exports = InscriptionService;
