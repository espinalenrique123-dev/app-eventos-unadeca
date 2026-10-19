/**
 * Patrón Observer (DEDS) — Observador concreto.
 * Envía la notificación por Firebase Cloud Messaging a los estudiantes
 * con inscripción ACTIVA en el evento.
 */
class PushNotificationObserver {
  /**
   * @param {FirebaseFirestore.Firestore} db
   * @param {import('firebase-admin/messaging').Messaging} messaging
   * @param {{info: Function, warn: Function}} logger
   */
  constructor(db, messaging, logger) {
    this.db = db;
    this.messaging = messaging;
    this.logger = logger;
  }

  async tokensDeInscritos(eventId) {
    const snap = await this.db
      .collection('inscriptions')
      .where('eventId', '==', eventId)
      .where('estado', '==', 'ACTIVA')
      .get();
    return [...new Set(snap.docs.map((d) => d.get('fcmToken')).filter(Boolean))];
  }

  /** @param {{eventId: string, notificacion: {tipo: string, titulo: string, cuerpo: string}}} cambio */
  async update({ eventId, notificacion }) {
    const tokens = await this.tokensDeInscritos(eventId);
    if (!tokens.length) return { enviados: 0 };

    let enviados = 0;
    // FCM acepta hasta 500 tokens por envío.
    for (let i = 0; i < tokens.length; i += 500) {
      const res = await this.messaging.sendEachForMulticast({
        tokens: tokens.slice(i, i + 500),
        notification: { title: notificacion.titulo, body: notificacion.cuerpo },
        data: { eventId, tipo: notificacion.tipo },
      });
      enviados += res.successCount;
      if (res.failureCount) this.logger.warn(`FCM: ${res.failureCount} envíos fallidos para ${eventId}`);
    }
    this.logger.info(`FCM: ${enviados} notificaciones "${notificacion.tipo}" para ${eventId}`);
    return { enviados };
  }
}

module.exports = PushNotificationObserver;
