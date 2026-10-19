const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { buildRouter } = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

/**
 * Crea la aplicación Express. Recibe las dependencias por parámetro
 * (inyección de dependencias) para poder probarla sin Firebase real.
 */
function createApp({ services, verifyIdToken, corsOrigin = 'http://localhost:5173' }) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: corsOrigin.split(',').map((o) => o.trim()) }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));
  app.use('/api', buildRouter(services, verifyIdToken));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
