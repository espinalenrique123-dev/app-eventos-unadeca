const { EstadoEvento, EstadoInscripcion, Rol } = require('../models/enums');
const { validarEvento, estadoSegunCupos } = require('../models/Event');
const { badRequest, conflict, notFound } = require('../utils/errors');
const { eventoGestionable } = require('./permisos');

const CERRADOS = [EstadoEvento.CANCELADO, EstadoEvento.FINALIZADO];

/**
 * Gestión de eventos.
 * Trazabilidad: RF-01 (crear), RF-02 (editar), RF-03 (eliminar/cancelar), RF-04 (lista por fecha),
 * RF-05 (detalle), RF-14 (reporte de asistencia), RNF Seguridad (solo el coordinador del evento o el administrador).
 */
class EventService {
  constructor({ eventRepo, inscriptionRepo, attendanceRepo }) {
    this.eventRepo = eventRepo;
    this.inscriptionRepo = inscriptionRepo;
    this.attendanceRepo = attendanceRepo;
  }

  /** RF-04: eventos disponibles para el estudiante, ordenados por fecha. */
  listarVisibles() {
    return this.eventRepo.findVisibles();
  }

  /** Panel de eventos: el coordinador ve los suyos; el administrador ve todos. */
  listarGestionables(usuario) {
    return usuario.rol === Rol.ADMINISTRADOR
      ? this.eventRepo.findAll()
      : this.eventRepo.findByCoordinador(usuario.id);
  }

  /** RF-05: detalle completo de un evento. */
  async obtener(id) {
    const evento = await this.eventRepo.findById(id);
    if (!evento) throw notFound('Evento no encontrado');
    return evento;
  }

  /** RF-01: crea un evento publicado, sin inscritos, asignado al coordinador. */
  async crear(usuario, input) {
    const datos = validarEvento(input);
    return this.eventRepo.create({
      ...datos,
      cuposOcupados: 0,
      estado: EstadoEvento.PUBLICADO,
      coordinadorId: usuario.id,
    });
  }

  /** RF-02: edita un evento publicado y recalcula su estado según los cupos (RF-07). */
  async actualizar(usuario, id, input) {
    const evento = await eventoGestionable(this.eventRepo, usuario, id);
    if (CERRADOS.includes(evento.estado)) throw conflict('No se puede editar un evento cancelado o finalizado');
    const cambios = validarEvento(input, { parcial: true });
    if (Object.keys(cambios).length === 0) throw badRequest('No se enviaron cambios');
    if (cambios.cupoMaximo !== undefined && cambios.cupoMaximo < evento.cuposOcupados) {
      throw badRequest(`El cupo máximo no puede ser menor que los ${evento.cuposOcupados} inscritos actuales`);
    }
    const actualizado = { ...evento, ...cambios };
    return this.eventRepo.update(id, { ...cambios, estado: estadoSegunCupos(actualizado) });
  }

  /**
   * RF-03: "eliminar" se implementa como cancelación lógica (estado CANCELADO) para conservar
   * el historial de inscripciones y poder avisar a los inscritos (Cloud Function alCambiarEvento).
   */
  async cancelar(usuario, id) {
    const evento = await eventoGestionable(this.eventRepo, usuario, id);
    if (CERRADOS.includes(evento.estado)) throw conflict('El evento ya está cancelado o finalizado');
    return this.eventRepo.update(id, { estado: EstadoEvento.CANCELADO });
  }

  async finalizar(usuario, id) {
    const evento = await eventoGestionable(this.eventRepo, usuario, id);
    if (CERRADOS.includes(evento.estado)) throw conflict('El evento ya está cancelado o finalizado');
    return this.eventRepo.update(id, { estado: EstadoEvento.FINALIZADO });
  }

  /** RF-14: reporte de un evento con inscritos, cancelaciones y asistencia. */
  async reporte(usuario, id) {
    const evento = await eventoGestionable(this.eventRepo, usuario, id);
    const [inscripciones, asistencias] = await Promise.all([
      this.inscriptionRepo.findByEvent(id),
      this.attendanceRepo.findByEvent(id),
    ]);
    const activas = inscripciones.filter((i) => i.estado === EstadoInscripcion.ACTIVA).length;
    const presentes = asistencias.filter((a) => a.asistio).length;
    return {
      eventId: id,
      nombre: evento.nombre,
      estado: evento.estado,
      cupoMaximo: evento.cupoMaximo,
      inscritosActivos: activas,
      inscripcionesCanceladas: inscripciones.length - activas,
      presentes,
      ausentes: asistencias.length - presentes,
      porcentajeAsistencia: activas ? Math.round((presentes / activas) * 100) : 0,
    };
  }

  /** RF-14 (extensión): reporte global para el administrador. */
  async reporteGlobal() {
    const eventos = await this.eventRepo.findAll();
    const porEstado = Object.fromEntries(Object.values(EstadoEvento).map((e) => [e, 0]));
    let cupos = 0;
    let ocupados = 0;
    for (const e of eventos) {
      porEstado[e.estado] = (porEstado[e.estado] || 0) + 1;
      cupos += e.cupoMaximo || 0;
      ocupados += e.cuposOcupados || 0;
    }
    return {
      totalEventos: eventos.length,
      porEstado,
      cuposTotales: cupos,
      cuposOcupados: ocupados,
      porcentajeOcupacion: cupos ? Math.round((ocupados / cupos) * 100) : 0,
    };
  }
}

module.exports = EventService;
