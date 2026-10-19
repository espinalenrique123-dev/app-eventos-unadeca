const COLLECTION = 'users';

/** Acceso a la colección `users` (id, nombre, email, rol, activo). */
class UserRepository {
  /** @param {import('../facade/FirebaseFacade')} facade */
  constructor(facade) {
    this.facade = facade;
  }

  findById(id) {
    return this.facade.getDoc(COLLECTION, id);
  }

  findAll() {
    return this.facade.query(COLLECTION, [], ['nombre', 'asc']);
  }

  async save(id, data) {
    await this.facade.setDoc(COLLECTION, id, data);
    return this.findById(id);
  }
}

module.exports = UserRepository;
