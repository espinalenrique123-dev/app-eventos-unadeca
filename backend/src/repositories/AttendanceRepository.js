const COLLECTION = 'attendance';

/** Acceso a la colección `attendance` (eventId, userId, asistio, fechaRegistro). */
class AttendanceRepository {
  /** @param {import('../facade/FirebaseFacade')} facade */
  constructor(facade) {
    this.facade = facade;
  }

  async registrar(eventId, userId, asistio, registradoPor) {
    const id = `${eventId}_${userId}`;
    await this.facade.setDoc(COLLECTION, id, {
      eventId,
      userId,
      asistio,
      registradoPor,
      fechaRegistro: new Date().toISOString(),
    });
    return this.facade.getDoc(COLLECTION, id);
  }

  findByEvent(eventId) {
    return this.facade.query(COLLECTION, [['eventId', '==', eventId]]);
  }
}

module.exports = AttendanceRepository;
