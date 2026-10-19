/**
 * Patrón Observer (DEDS) — Sujeto.
 * Cuando cambia un evento, el sujeto avisa a todos los observadores suscritos.
 * Agregar un canal nuevo (correo, SMS…) es solo suscribir otro observador.
 */
class EventSubject {
  constructor() {
    this.observers = [];
  }

  subscribe(observer) {
    if (typeof observer.update !== 'function') {
      throw new TypeError('El observador debe implementar update(cambio)');
    }
    this.observers.push(observer);
  }

  unsubscribe(observer) {
    this.observers = this.observers.filter((o) => o !== observer);
  }

  /** Notifica a todos; si un observador falla, los demás igual reciben el aviso. */
  async notify(cambio) {
    const resultados = await Promise.allSettled(this.observers.map((o) => o.update(cambio)));
    return resultados;
  }
}

module.exports = EventSubject;
