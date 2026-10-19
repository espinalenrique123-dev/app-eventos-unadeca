const COLLECTION = 'inscriptions';
const EVENTS = 'events';

/** El id de una inscripción es {eventId}_{userId}: evita inscripciones duplicadas. */
const inscriptionId = (eventId, userId) => `${eventId}_${userId}`;

/**
 * Acceso a la colección `inscriptions`
 * (id = {eventId}_{userId}, eventId, userId, estado, fcmToken, fecha).
 */
class InscriptionRepository {
  /** @param {import('../facade/FirebaseFacade')} facade */
  constructor(facade) {
    this.facade = facade;
  }

  findById(eventId, userId) {
    return this.facade.getDoc(COLLECTION, inscriptionId(eventId, userId));
  }

  findByEvent(eventId, estado) {
    const filters = [['eventId', '==', eventId]];
    if (estado) filters.push(['estado', '==', estado]);
    return this.facade.query(COLLECTION, filters);
  }

  findByUser(userId) {
    return this.facade.query(COLLECTION, [['userId', '==', userId]]);
  }

  /**
   * Lee el evento y la inscripción dentro de una transacción y aplica la
   * decisión de la capa de negocio de forma atómica (evita sobrecupo).
   *
   * @param {string} eventId
   * @param {string} userId
   * @param {(evento: object|null, inscripcion: object|null) => {evento: object, inscripcion: object}} decidir
   */
  transaccion(eventId, userId, decidir) {
    const id = inscriptionId(eventId, userId);
    return this.facade.runTransaction(async (tx) => {
      const evento = await tx.get(EVENTS, eventId);
      const inscripcion = await tx.get(COLLECTION, id);
      const resultado = decidir(evento, inscripcion);
      tx.set(EVENTS, eventId, resultado.evento);
      tx.set(COLLECTION, id, resultado.inscripcion);
      return { id, ...resultado.inscripcion };
    });
  }
}

module.exports = { InscriptionRepository, inscriptionId };
