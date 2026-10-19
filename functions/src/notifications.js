/**
 * Lógica pura (sin Firebase) para decidir qué notificar. Se prueba con Jest.
 */

const CAMPOS_RELEVANTES = { fecha: 'la fecha', hora: 'la hora', lugar: 'el lugar' };
const ZONA_COSTA_RICA = '-06:00';

/**
 * Compara el evento antes y después del cambio y devuelve la notificación
 * para los inscritos, o null si el cambio no les interesa.
 */
function construirNotificacion(antes, despues) {
  if (!antes || !despues) return null;

  if (antes.estado !== 'CANCELADO' && despues.estado === 'CANCELADO') {
    return {
      tipo: 'CANCELADO',
      titulo: 'Evento cancelado',
      cuerpo: `"${despues.nombre}" fue cancelado.`,
    };
  }

  const cambiados = Object.keys(CAMPOS_RELEVANTES).filter((c) => antes[c] !== despues[c]);
  if (cambiados.length && despues.estado !== 'CANCELADO' && despues.estado !== 'FINALIZADO') {
    const lista = cambiados.map((c) => CAMPOS_RELEVANTES[c]).join(', ');
    return {
      tipo: 'MODIFICADO',
      titulo: 'Cambio en un evento',
      cuerpo: `Cambió ${lista} de "${despues.nombre}": ${despues.fecha} ${despues.hora}, ${despues.lugar}.`,
    };
  }
  return null;
}

/** Fecha y hora de inicio del evento (hora de Costa Rica, UTC-6 sin horario de verano). */
function inicioEvento(evento) {
  return new Date(`${evento.fecha}T${evento.hora}:00${ZONA_COSTA_RICA}`);
}

/**
 * ¿Corresponde enviar el recordatorio de 24 h? Ventana [23 h, 25 h) antes del inicio,
 * para que una ejecución cada hora no se salte ningún evento.
 */
function debeEnviarRecordatorio(evento, ahora = new Date()) {
  if (evento.recordatorioEnviado) return false;
  if (!['PUBLICADO', 'CUPO_LLENO'].includes(evento.estado)) return false;
  const horas = (inicioEvento(evento) - ahora) / 36e5;
  return horas >= 23 && horas < 25;
}

function construirRecordatorio(evento) {
  return {
    tipo: 'RECORDATORIO',
    titulo: 'Tu evento es mañana',
    cuerpo: `"${evento.nombre}" empieza mañana a las ${evento.hora} en ${evento.lugar}.`,
  };
}

module.exports = { construirNotificacion, debeEnviarRecordatorio, construirRecordatorio, inicioEvento };
