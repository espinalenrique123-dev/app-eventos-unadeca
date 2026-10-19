module.exports = ({ userService, inscriptionService, eventService }) => ({
  perfil: async (req, res) => res.json(req.user),
  actualizarPerfil: async (req, res) => res.json(await userService.actualizarPerfil(req.user.id, req.body)),
  misInscripciones: async (req, res) => res.json(await inscriptionService.misInscripciones(req.user)),

  // Administrador
  listar: async (req, res) => res.json(await userService.listar()),
  cambiarRol: async (req, res) => res.json(await userService.cambiarRol(req.user, req.params.id, req.body?.rol)),
  cambiarActivo: async (req, res) =>
    res.json(await userService.cambiarActivo(req.user, req.params.id, req.body?.activo)),
  reporteGlobal: async (req, res) => res.json(await eventService.reporteGlobal()),
});
