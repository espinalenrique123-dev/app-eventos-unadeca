/**
 * Controladores de eventos: solo traducen HTTP ↔ servicios.
 * La lógica de negocio vive en los servicios.
 */
module.exports = ({ eventService, inscriptionService, attendanceService }) => ({
  listarVisibles: async (req, res) => res.json(await eventService.listarVisibles({ categoria: req.query.categoria })),
  categorias: async (req, res) => res.json(await eventService.categorias()),
  listarGestionables: async (req, res) => res.json(await eventService.listarGestionables(req.user)),
  obtener: async (req, res) => res.json(await eventService.obtener(req.params.id)),
  crear: async (req, res) => res.status(201).json(await eventService.crear(req.user, req.body)),
  actualizar: async (req, res) => res.json(await eventService.actualizar(req.user, req.params.id, req.body)),
  cancelar: async (req, res) => res.json(await eventService.cancelar(req.user, req.params.id)),
  finalizar: async (req, res) => res.json(await eventService.finalizar(req.user, req.params.id)),
  reporte: async (req, res) => res.json(await eventService.reporte(req.user, req.params.id)),
  reporteCsv: async (req, res) => {
    const csv = await eventService.reporteCsv(req.user, req.params.id);
    res.type('text/csv; charset=utf-8').attachment(`reporte-${req.params.id}.csv`).send(`\uFEFF${csv}`);
  },

  inscribir: async (req, res) =>
    res.status(201).json(await inscriptionService.inscribir(req.user, req.params.id, req.body?.fcmToken)),
  cancelarInscripcion: async (req, res) => res.json(await inscriptionService.cancelar(req.user, req.params.id)),
  inscritos: async (req, res) => res.json(await inscriptionService.inscritos(req.user, req.params.id)),

  registrarAsistencia: async (req, res) =>
    res.status(201).json(await attendanceService.registrar(req.user, req.params.id, req.body)),
  asistencia: async (req, res) => res.json(await attendanceService.listar(req.user, req.params.id)),
});
