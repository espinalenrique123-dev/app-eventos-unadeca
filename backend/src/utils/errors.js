/**
 * Error de aplicación con código HTTP. Los servicios lanzan AppError y el
 * manejador global de Express lo convierte en una respuesta JSON.
 */
class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}

const badRequest = (msg) => new AppError(400, msg);
const unauthorized = (msg = 'No autenticado') => new AppError(401, msg);
const forbidden = (msg = 'No tiene permiso para esta acción') => new AppError(403, msg);
const notFound = (msg = 'Recurso no encontrado') => new AppError(404, msg);
const conflict = (msg) => new AppError(409, msg);

module.exports = { AppError, badRequest, unauthorized, forbidden, notFound, conflict };
