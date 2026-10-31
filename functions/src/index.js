const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { onDocumentUpdated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { setGlobalOptions } = require('firebase-functions/v2');
const logger = require('firebase-functions/logger');

const EventSubject = require('./observer/EventSubject');
const PushNotificationObserver = require('./observer/PushNotificationObserver');
const {
  construirNotificacion,
  debeEnviarRecordatorio,
  construirRecordatorio,
  construirConfirmacion,
  RECORDATORIOS,
} = require('./notifications');

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

/** RF-09: confirma la inscripción solo al estudiante que se inscribió. */
exports.alInscribirse = onDocumentWritten('inscriptions/{inscriptionId}', async (event) => {
  const antes = event.data.before.exists ? event.data.before.data() : null;
  const despues = event.data.after.exists ? event.data.after.data() : null;
  if (!despues) return;
  const evento = (await db.collection('events').doc(despues.eventId).get()).data();
  const notificacion = construirConfirmacion(antes, despues, evento);
  if (!notificacion) return;
  await sujeto.notify({ eventId: despues.eventId, notificacion, tokens: [despues.fcmToken] });
});

/** Busca eventos dentro de la ventana del recordatorio y lo envía una sola vez. */
async function enviarRecordatorios(tipo) {
  const snap = await db.collection('events').where('estado', 'in', ['PUBLICADO', 'CUPO_LLENO']).get();
  const ahora = new Date();
  for (const doc of snap.docs) {
    const evento = doc.data();
    if (!debeEnviarRecordatorio(evento, ahora, tipo)) continue;
    await sujeto.notify({ eventId: doc.id, notificacion: construirRecordatorio(evento, tipo) });
    await doc.ref.update({ [RECORDATORIOS[tipo].bandera]: true });
  }
}

const programa = (schedule) => ({ schedule, timeZone: 'America/Costa_Rica' });

/** RF-10: recordatorio 24 h antes. */
exports.recordatorio24h = onSchedule(programa('every 60 minutes'), () => enviarRecordatorios('24h'));

/** RF-11: recordatorio 1 h antes. */
exports.recordatorio1h = onSchedule(programa('every 15 minutes'), () => enviarRecordatorios('1h'));
