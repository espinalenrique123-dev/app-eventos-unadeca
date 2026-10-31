/**
 * Integración con las reglas de seguridad de Firestore (firebase/firestore.rules).
 * Simula a los clientes (web y Android) que acceden directo a Firestore con su sesión.
 */
const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');

let env;

beforeAll(async () => {
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  env = await initializeTestEnvironment({
    projectId: 'demo-reglas-app-eventos',
    firestore: { host, port: Number(port), rules: fs.readFileSync(path.join(__dirname, '../../../firebase/firestore.rules'), 'utf8') },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc('events/e1').set({ nombre: 'Feria', estado: 'PUBLICADO' });
    await db.doc('users/ana').set({ nombre: 'Ana', rol: 'estudiante' });
    await db.doc('users/luis').set({ nombre: 'Luis', rol: 'estudiante' });
    await db.doc('inscriptions/e1_ana').set({ eventId: 'e1', userId: 'ana', estado: 'ACTIVA' });
    await db.doc('inscriptions/e1_luis').set({ eventId: 'e1', userId: 'luis', estado: 'ACTIVA' });
    await db.doc('attendance/e1_ana').set({ asistio: true });
  });
});

afterAll(() => env.cleanup());

const ana = () => env.authenticatedContext('ana').firestore();
const anonimo = () => env.unauthenticatedContext().firestore();

describe('Reglas de seguridad de Firestore (RNF Seguridad)', () => {
  test('CP-E-12 [RF-04][RNF-Seguridad] los eventos se leen solo con sesión iniciada', async () => {
    await assertSucceeds(ana().doc('events/e1').get());
    await assertFails(anonimo().doc('events/e1').get());
  });

  test('CP-E-13 [RNF-Seguridad] ningún cliente puede crear ni modificar eventos directamente (todo pasa por el backend)', async () => {
    await assertFails(ana().doc('events/e1').update({ cuposOcupados: 0 }));
    await assertFails(ana().collection('events').add({ nombre: 'falso' }));
  });

  test('CP-E-14 [RF-17][RNF-Seguridad] cada estudiante lee solo su perfil y sus inscripciones', async () => {
    await assertSucceeds(ana().doc('users/ana').get());
    await assertFails(ana().doc('users/luis').get());
    await assertSucceeds(ana().doc('inscriptions/e1_ana').get());
    await assertFails(ana().doc('inscriptions/e1_luis').get());
  });

  test('CP-E-15 [RF-06][RNF-Seguridad] un estudiante no puede inscribirse ni cambiar su rol saltándose el backend', async () => {
    await assertFails(ana().doc('inscriptions/e1_ana').set({ estado: 'ACTIVA' }));
    await assertFails(ana().doc('users/ana').update({ rol: 'administrador' }));
  });

  test('CP-E-16 [RF-12][RNF-Seguridad] la asistencia y las colecciones no declaradas están cerradas', async () => {
    await assertFails(ana().doc('attendance/e1_ana').get());
    await assertFails(ana().doc('otra/x').set({ a: 1 }));
  });
});
