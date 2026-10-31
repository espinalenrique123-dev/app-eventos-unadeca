/** Pruebas de integración Nivel 2: corren solo dentro de `firebase emulators:exec`. */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/emulator/**/*.test.js'],
  testTimeout: 30000,
};
