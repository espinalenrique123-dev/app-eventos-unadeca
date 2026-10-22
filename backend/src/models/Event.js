const { EstadoEvento } = require('./enums');
const { badRequest } = require('../utils/errors');

const CAMPOS_EDITABLES = ['nombre', 'descripcion', 'fecha', 'hora', 'lugar', 'categoria', 'cupoMaximo'];

const esFechaValida = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const esHoraValida = (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const estaVacio = (v) => v === undefined || v === null || v === '';

/** Validador de texto: obligatorio, sin espacios sobrantes y de 500 caracteres como máximo. */
const texto = (campo) => (v) => {
  if (typeof v !== 'string') throw badRequest(`"${campo}" debe ser texto`);
  const limpio = v.trim();
  if (!limpio) throw badRequest(`El campo "${campo}" es obligatorio`);
  if (limpio.length > 500) throw badRequest(`"${campo}" es demasiado largo`);
  return limpio;
};

/** Un validador por campo (cada uno con complejidad baja, ver métrica del Plan de Pruebas). */
const VALIDADORES = {
  nombre: texto('nombre'),
  descripcion: texto('descripcion'),
  lugar: texto('lugar'),
  categoria: texto('categoria'),
  fecha: (v) => {
    if (!esFechaValida(v)) throw badRequest('"fecha" debe tener el formato AAAA-MM-DD');
    return v;
  },
  hora: (v) => {
    if (!esHoraValida(v)) throw badRequest('"hora" debe tener el formato HH:mm');
    return v;
  },
  cupoMaximo: (v) => {
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > 10000) {
      throw badRequest('"cupoMaximo" debe ser un número entero entre 1 y 10000');
    }
    return n;
  },
};

/**
 * RF-01 / RF-02: valida los datos de un evento (nombre, descripción, fecha, hora,
 * lugar, categoría y cupo máximo) y devuelve solo los campos permitidos.
 * @param {object} input  datos recibidos del cliente
 * @param {{parcial?: boolean}} opciones  parcial=true para actualizaciones (solo los campos enviados)
 */
function validarEvento(input = {}, { parcial = false } = {}) {
  const campos = parcial ? CAMPOS_EDITABLES.filter((c) => input[c] !== undefined) : CAMPOS_EDITABLES;
  const data = {};
  for (const campo of campos) {
    if (estaVacio(input[campo])) throw badRequest(`El campo "${campo}" es obligatorio`);
    data[campo] = VALIDADORES[campo](input[campo]);
  }
  return data;
}

const ZONA_COSTA_RICA = '-06:00'; // UTC-6, sin horario de verano

/** Fecha y hora de inicio del evento en hora de Costa Rica. */
function inicioEvento(evento) {
  return new Date(`${evento.fecha}T${evento.hora}:00${ZONA_COSTA_RICA}`);
}

/** RF-06 / RF-08: un evento que ya empezó no admite inscripciones ni cancelaciones. */
function haIniciado(evento, ahora = new Date()) {
  return inicioEvento(evento) <= ahora;
}

/** RF-07: estado que corresponde según los cupos (no toca eventos cancelados o finalizados). */
function estadoSegunCupos(evento) {
  if (evento.estado === EstadoEvento.CANCELADO || evento.estado === EstadoEvento.FINALIZADO) {
    return evento.estado;
  }
  return evento.cuposOcupados >= evento.cupoMaximo ? EstadoEvento.CUPO_LLENO : EstadoEvento.PUBLICADO;
}

module.exports = { validarEvento, estadoSegunCupos, haIniciado, inicioEvento, CAMPOS_EDITABLES };
