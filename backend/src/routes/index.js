const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { Rol } = require('../models/enums');
const eventControllerFactory = require('../controllers/eventController');
const userControllerFactory = require('../controllers/userController');

/** Express 4 no captura errores de funciones async: este envoltorio los pasa a next(). */
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function buildRouter(services, verifyIdToken) {
  const router = express.Router();
  const ev = eventControllerFactory(services);
  const us = userControllerFactory(services);

  const gestores = requireRole(Rol.COORDINADOR, Rol.ADMINISTRADOR);
  const soloAdmin = requireRole(Rol.ADMINISTRADOR);

  router.use(authenticate({ verifyIdToken, userService: services.userService }));

  // Perfil
  router.get('/users/me', h(us.perfil));
  router.put('/users/me', h(us.actualizarPerfil));
  router.get('/users/me/inscriptions', h(us.misInscripciones));

  // Eventos (lectura para cualquier usuario autenticado)
  router.get('/events', h(ev.listarVisibles));
  router.get('/events/manage', gestores, h(ev.listarGestionables));
  router.get('/events/:id', h(ev.obtener));

  // Gestión de eventos (coordinador del evento o administrador)
  router.post('/events', gestores, h(ev.crear));
  router.put('/events/:id', gestores, h(ev.actualizar));
  router.post('/events/:id/cancel', gestores, h(ev.cancelar));
  router.post('/events/:id/finish', gestores, h(ev.finalizar));
  router.get('/events/:id/report', gestores, h(ev.reporte));
  router.get('/events/:id/inscriptions', gestores, h(ev.inscritos));
  router.get('/events/:id/attendance', gestores, h(ev.asistencia));
  router.post('/events/:id/attendance', gestores, h(ev.registrarAsistencia));

  // Inscripción del estudiante
  router.post('/events/:id/inscriptions', h(ev.inscribir));
  router.delete('/events/:id/inscriptions/me', h(ev.cancelarInscripcion));

  // Administración
  router.get('/admin/users', soloAdmin, h(us.listar));
  router.put('/admin/users/:id/role', soloAdmin, h(us.cambiarRol));
  router.put('/admin/users/:id/active', soloAdmin, h(us.cambiarActivo));
  router.get('/admin/reports', soloAdmin, h(us.reporteGlobal));

  return router;
}

module.exports = { buildRouter };
