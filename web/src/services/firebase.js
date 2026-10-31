import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';

// La configuración web de Firebase identifica el proyecto (no es una credencial),
// pero igual se lee de variables de entorno para no fijarla en el código.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigurado = Boolean(config.apiKey);

// Si falta la configuración no se inicializa (Firebase lanzaría un error al cargar).
export const auth = firebaseConfigurado ? getAuth(initializeApp(config)) : null;

// Desarrollo y pruebas: con VITE_AUTH_EMULATOR_HOST la webapp usa el emulador de Auth
// en lugar del proyecto real (no requiere credenciales ni toca datos reales).
if (auth && import.meta.env.VITE_AUTH_EMULATOR_HOST) {
  connectAuthEmulator(auth, `http://${import.meta.env.VITE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
}
