const admin = require('firebase-admin');

/**
 * Patrón Singleton (DEDS): una sola inicialización de Firebase Admin por proceso.
 *
 * Las credenciales NO se escriben en el código. firebase-admin las toma de:
 *  - GOOGLE_APPLICATION_CREDENTIALS (ruta a la clave de la cuenta de servicio), o
 *  - las credenciales por defecto del entorno (Cloud Run / Cloud Functions), o
 *  - el emulador si FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST están definidos.
 */
class FirebaseConfig {
  static #instance = null;

  #app;

  constructor() {
    if (FirebaseConfig.#instance) {
      throw new Error('Use FirebaseConfig.getInstance()');
    }
    this.#app = admin.apps.length
      ? admin.app()
      : admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
  }

  static getInstance() {
    if (!FirebaseConfig.#instance) {
      FirebaseConfig.#instance = new FirebaseConfig();
    }
    return FirebaseConfig.#instance;
  }

  get firestore() {
    return this.#app.firestore();
  }

  get auth() {
    return this.#app.auth();
  }

  get messaging() {
    return this.#app.messaging();
  }
}

module.exports = FirebaseConfig;
