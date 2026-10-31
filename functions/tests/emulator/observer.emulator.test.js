/**
 * Integración del patrón Observer con Firestore real (emulador):
 * el observador consulta las inscripciones guardadas y envía por FCM (simulado: FCM no tiene emulador).
 */
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const EventSubject = require('../../src/observer/EventSubject');
const PushNotificationObserver = require('../../src/observer/PushNotificationObserver');
const { construirConfirmacion } = require('../../src/notifications');

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Ejecutar dentro de firebase emulators:exec');

initializeApp({ projectId: 'demo-functions-app-eventos' });
const db = getFirestore();

const fcm = () => ({ sendEachForMulticast: jest.fn(async ({ tokens }) => ({ successCount: tokens.length, failureCount: 0 })) });
const logger = { info: jest.fn(), warn: jest.fn() };

beforeEach(async () => {
  const docs = await db.collection('inscriptions').listDocuments();
  await Promise.all(docs.map((d) => d.delete()));
  await db.doc('inscriptions/e1_ana').set({ eventId: 'e1', userId: 'ana', estado: 'ACTIVA', fcmToken: 'tok-ana' });
  await db.doc('inscriptions/e1_luis').set({ eventId: 'e1', userId: 'luis', estado: 'ACTIVA', fcmToken: 'tok-luis' });
  await db.doc('inscriptions/e1_eva').set({ eventId: 'e1', userId: 'eva', estado: 'CANCELADA', fcmToken: 'tok-eva' });
  await db.doc('inscriptions/e2_ana').set({ eventId: 'e2', userId: 'ana', estado: 'ACTIVA', fcmToken: 'tok-ana' });
});

describe('Observer + Firestore (emulador)', () => {
  test('CP-E-17 [RF-02][RF-03] un cambio en el evento avisa solo a los inscritos ACTIVOS de ese evento', async () => {
    const messaging = fcm();
    const sujeto = new EventSubject();
    sujeto.subscribe(new PushNotificationObserver(db, messaging, logger));
    await sujeto.notify({ eventId: 'e1', notificacion: { tipo: 'CANCELADO', titulo: 't', cuerpo: 'c' } });
    const { tokens } = messaging.sendEachForMulticast.mock.calls[0][0];
    expect(tokens.sort()).toEqual(['tok-ana', 'tok-luis']);
  });

  test('CP-E-18 [RF-09] la confirmación de inscripción llega solo al estudiante que se inscribió', async () => {
    const messaging = fcm();
    const obs = new PushNotificationObserver(db, messaging, logger);
    const insc = (await db.doc('inscriptions/e1_ana').get()).data();
    const n = construirConfirmacion(null, insc, { nombre: 'Feria', fecha: '2027-03-20', hora: '09:00', lugar: 'Auditorio' });
    await obs.update({ eventId: 'e1', notificacion: n, tokens: [insc.fcmToken] });
    expect(messaging.sendEachForMulticast).toHaveBeenCalledTimes(1);
    expect(messaging.sendEachForMulticast.mock.calls[0][0].tokens).toEqual(['tok-ana']);
  });
});
