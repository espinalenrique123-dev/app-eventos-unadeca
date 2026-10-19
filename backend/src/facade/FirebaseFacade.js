const { FieldValue } = require('firebase-admin/firestore');

/**
 * Patrón Facade (DEDS): interfaz simple sobre Firestore y Firebase Auth.
 * Los repositorios solo conocen esta fachada, nunca el SDK directamente,
 * así se puede cambiar o simular la capa de datos sin tocar la lógica de negocio.
 */
class FirebaseFacade {
  /** @param {import('../config/FirebaseConfig')} config */
  constructor(config) {
    this.db = config.firestore;
    this.authClient = config.auth;
  }

  // ---------- Firestore ----------
  async getDoc(collection, id) {
    const snap = await this.db.collection(collection).doc(id).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  }

  async addDoc(collection, data) {
    const ref = await this.db.collection(collection).add({ ...data, createdAt: FieldValue.serverTimestamp() });
    return ref.id;
  }

  async setDoc(collection, id, data, { merge = true } = {}) {
    await this.db.collection(collection).doc(id).set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge });
  }

  /**
   * Consulta simple. filters: [[campo, operador, valor], ...]
   * orderBy: [campo, 'asc'|'desc'] (opcional)
   */
  async query(collection, filters = [], orderBy = null, limit = 500) {
    let q = this.db.collection(collection);
    for (const [field, op, value] of filters) q = q.where(field, op, value);
    if (orderBy) q = q.orderBy(orderBy[0], orderBy[1] || 'asc');
    const snap = await q.limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  /**
   * Ejecuta una transacción. El callback recibe un objeto con get/set
   * sobre (colección, id) para no exponer el SDK a los repositorios.
   */
  async runTransaction(fn) {
    return this.db.runTransaction(async (tx) => {
      const api = {
        get: async (collection, id) => {
          const snap = await tx.get(this.db.collection(collection).doc(id));
          return snap.exists ? { id: snap.id, ...snap.data() } : null;
        },
        set: (collection, id, data) => {
          tx.set(this.db.collection(collection).doc(id), { ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        },
      };
      return fn(api);
    });
  }

  // ---------- Auth ----------
  verifyIdToken(token) {
    return this.authClient.verifyIdToken(token, true);
  }
}

module.exports = FirebaseFacade;
