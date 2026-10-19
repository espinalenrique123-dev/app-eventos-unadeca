require('dotenv').config();
const { createApp } = require('./app');
const { buildContainer } = require('./container');

const PORT = Number(process.env.PORT) || 3000;

const { services, verifyIdToken } = buildContainer();
const app = createApp({ services, verifyIdToken, corsOrigin: process.env.CORS_ORIGIN });

app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT} (API en /api)`);
});
