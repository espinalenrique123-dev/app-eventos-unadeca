const { Rol } = require('../models/enums');
const { forbidden, notFound } = require('../utils/errors');

/** Un coordinador solo gestiona sus propios eventos; el administrador gestiona todos. */
function puedeGestionar(usuario, evento) {
  if (usuario.rol === Rol.ADMINISTRADOR) return true;
  return usuario.rol === Rol.COORDINADOR && evento.coordinadorId === usuario.id;
}

/** Devuelve el evento si existe y el usuario puede gestionarlo; si no, lanza el error que corresponde. */
async function eventoGestionable(eventRepo, usuario, eventId) {
  const evento = await eventRepo.findById(eventId);
  if (!evento) throw notFound('Evento no encontrado');
  if (!puedeGestionar(usuario, evento)) throw forbidden('Solo el coordinador del evento puede gestionarlo');
  return evento;
}

module.exports = { puedeGestionar, eventoGestionable };
