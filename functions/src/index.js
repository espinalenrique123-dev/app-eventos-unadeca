const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { setGlobalOptions } = require('firebase-functions/v2');
const logger = require('firebase-functions/logger');

const EventSubject = require('./observer/EventSubject');
const PushNotificationObserver = require('./observer/PushNotificationObserver');
const { construirNotificacion, debeEnviarRecordatorio, construirRecordatorio } = require('./notifications');

setGlobalOptions({ region: 'us-central1', maxInstances: 5 });
initializeApp();

const db = getFirestore();

// Sujeto con sus observadores (patrón Observer).
const sujeto = new EventSubject();
sujeto.subscribe(new PushNotificationObserver(db, getMessaging(), logger));

/** Se dispara cuando cambia un documento de `events`: avisa cancelaciones y cambios de fecha, hora o lugar. */
exports.alCambiarEvento = onDocumentUpdated('events/{eventId}', async (event) => {
  const antes = event.data.before.data();
  const despues = event.data.after.data();
  const notificacion = construirNotificacion(antes, despues);
  if (!notificacion) return;
  await sujeto.notify({ eventId: event.params.eventId, notificacion });
});

/** Cada hora busca eventos que empiezan en ~24 h y envía el recordatorio una sola vez. */
exports.recordatorio24h = onSchedule({ schedule: 'every 60 minutes', timeZone: 'America/Costa_Rica' }, async () => {
  const snap = await db.collection('events').where('estado', 'in', ['PUBLICADO', 'CUPO_LLENO']).get();
  const ahora = new Date();
  for (const doc of snap.docs) {
    const evento = doc.data();
    if (!debeEnviarRecordatorio(evento, ahora)) continue;
    await sujeto.notify({ eventId: doc.id, notificacion: construirRecordatorio(evento) });
    await doc.ref.update({ recordatorioEnviado: true });
  }
});
