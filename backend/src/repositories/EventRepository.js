const { EstadoEvento } = require('../models/enums');

const COLLECTION = 'events';

/**
 * Acceso a la colección `events`
 * (id, nombre, descripcion, fecha, hora, lugar, categoria, cupoMaximo, cuposOcupados, estado).
 */
class EventRepository {
  /** @param {import('../facade/FirebaseFacade')} facade */
  constructor(facade) {
    this.facade = facade;
  }

  findById(id) {
    return this.facade.getDoc(COLLECTION, id);
  }

  /** Eventos visibles para estudiantes: publicados o con cupo lleno. */
  findVisibles() {
    return this.facade.query(
      COLLECTION,
      [['estado', 'in', [EstadoEvento.PUBLICADO, EstadoEvento.CUPO_LLENO]]],
      ['fecha', 'asc'],
    );
  }

  findByCoordinador(coordinadorId) {
    return this.facade.query(COLLECTION, [['coordinadorId', '==', coordinadorId]], ['fecha', 'asc']);
  }

  findAll() {
    return this.facade.query(COLLECTION, [], ['fecha', 'asc']);
  }

  async create(data) {
    const id = await this.facade.addDoc(COLLECTION, data);
    return this.findById(id);
  }

  async update(id, data) {
    await this.facade.setDoc(COLLECTION, id, data);
    return this.findById(id);
  }
}

module.exports = EventRepository;
