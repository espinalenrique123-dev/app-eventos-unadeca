/**
 * Implementación en memoria de FirebaseFacade para pruebas.
 * Tiene la misma interfaz, así los repositorios reales se prueban sin Firebase.
 */
class FakeFacade {
  constructor() {
    this.data = {};
    this.seq = 0;
  }

  col(name) {
    if (!this.data[name]) this.data[name] = new Map();
    return this.data[name];
  }

  async getDoc(collection, id) {
    const doc = this.col(collection).get(id);
    return doc ? { id, ...structuredClone(doc) } : null;
  }

  async addDoc(collection, data) {
    const id = `id${++this.seq}`;
    this.col(collection).set(id, structuredClone(data));
    return id;
  }

  async setDoc(collection, id, data) {
    const prev = this.col(collection).get(id) || {};
    this.col(collection).set(id, { ...prev, ...structuredClone(data) });
  }

  async query(collection, filters = [], orderBy = null) {
    let docs = [...this.col(collection).entries()].map(([id, d]) => ({ id, ...structuredClone(d) }));
    for (const [field, op, value] of filters) {
      if (op === '==') docs = docs.filter((d) => d[field] === value);
      else if (op === 'in') docs = docs.filter((d) => value.includes(d[field]));
      else throw new Error(`Operador no soportado en FakeFacade: ${op}`);
    }
    if (orderBy) {
      const [f, dir] = orderBy;
      docs.sort((a, b) => (a[f] > b[f] ? 1 : a[f] < b[f] ? -1 : 0) * (dir === 'desc' ? -1 : 1));
    }
    return docs;
  }

  /** Transacción simulada: las escrituras se aplican solo si el callback no falla. */
  async runTransaction(fn) {
    const writes = [];
    const result = await fn({
      get: (c, id) => this.getDoc(c, id),
      set: (c, id, d) => writes.push([c, id, d]),
    });
    for (const [c, id, d] of writes) await this.setDoc(c, id, d);
    return result;
  }
}

module.exports = FakeFacade;
