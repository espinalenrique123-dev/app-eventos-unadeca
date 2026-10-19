const { EstadoEvento } = require('./enums');
const { badRequest } = require('../utils/errors');

const CAMPOS_EDITABLES = ['nombre', 'descripcion', 'fecha', 'hora', 'lugar', 'categoria', 'cupoMaximo'];

const esFechaValida = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const esHoraValida = (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

/**
 * Valida los datos de entrada de un evento y devuelve solo los campos permitidos.
 * @param {object} input  datos recibidos del cliente
 * @param {{parcial?: boolean}} opciones  parcial=true para actualizaciones
 */
function validarEvento(input = {}, { parcial = false } = {}) {
  const data = {};
  for (const campo of CAMPOS_EDITABLES) {
    if (input[campo] !== undefined) data[campo] = input[campo];
  }

  const requeridos = parcial ? Object.keys(data) : CAMPOS_EDITABLES;
  for (const campo of requeridos) {
    if (data[campo] === undefined || data[campo] === null || data[campo] === '') {
      throw badRequest(`El campo "${campo}" es obligatorio`);
    }
  }

  for (const campo of ['nombre', 'descripcion', 'lugar', 'categoria']) {
    if (data[campo] !== undefined) {
      if (typeof data[campo] !== 'string') throw badRequest(`"${campo}" debe ser texto`);
      data[campo] = data[campo].trim();
      if (data[campo].length > 500) throw badRequest(`"${campo}" es demasiado largo`);
    }
  }
  if (data.fecha !== undefined && !esFechaValida(data.fecha)) {
    throw badRequest('"fecha" debe tener el formato AAAA-MM-DD');
  }
  if (data.hora !== undefined && !esHoraValida(data.hora)) {
    throw badRequest('"hora" debe tener el formato HH:mm');
  }
  if (data.cupoMaximo !== undefined) {
    const n = Number(data.cupoMaximo);
    if (!Number.isInteger(n) || n < 1 || n > 10000) {
      throw badRequest('"cupoMaximo" debe ser un número entero entre 1 y 10000');
    }
    data.cupoMaximo = n;
  }
  return data;
}

/** Estado que corresponde según los cupos (no toca eventos cancelados o finalizados). */
function estadoSegunCupos(evento) {
  if (evento.estado === EstadoEvento.CANCELADO || evento.estado === EstadoEvento.FINALIZADO) {
    return evento.estado;
  }
  return evento.cuposOcupados >= evento.cupoMaximo ? EstadoEvento.CUPO_LLENO : EstadoEvento.PUBLICADO;
}

module.exports = { validarEvento, estadoSegunCupos, CAMPOS_EDITABLES };
