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
 * Recordatorios. Cada uno tiene su ventana (en horas antes del inicio) y su bandera
 * para no enviarse dos veces. La ventana es más ancha que la frecuencia de la tarea
 * programada, así ninguna ejecución se salta un evento.
 *  - 24h (RF-10): ventana [23 h, 25 h), la tarea corre cada 60 min.
 *  - 1h  (RF-11): ventana [45 min, 75 min), la tarea corre cada 15 min.
 */
const RECORDATORIOS = Object.freeze({
  '24h': { desde: 23, hasta: 25, bandera: 'recordatorioEnviado' },
  '1h': { desde: 0.75, hasta: 1.25, bandera: 'recordatorio1hEnviado' },
});

function debeEnviarRecordatorio(evento, ahora = new Date(), tipo = '24h') {
  const r = RECORDATORIOS[tipo];
  if (!r) throw new RangeError(`Tipo de recordatorio desconocido: ${tipo}`);
  if (evento[r.bandera]) return false;
  if (!['PUBLICADO', 'CUPO_LLENO'].includes(evento.estado)) return false;
  const horas = (inicioEvento(evento) - ahora) / 36e5;
  return horas >= r.desde && horas < r.hasta;
}

function construirRecordatorio(evento, tipo = '24h') {
  if (tipo === '1h') {
    return {
      tipo: 'RECORDATORIO_1H',
      titulo: 'Tu evento empieza en una hora',
      cuerpo: `"${evento.nombre}" empieza a las ${evento.hora} en ${evento.lugar}.`,
    };
  }
  return {
    tipo: 'RECORDATORIO',
    titulo: 'Tu evento es mañana',
    cuerpo: `"${evento.nombre}" empieza mañana a las ${evento.hora} en ${evento.lugar}.`,
  };
}

/**
 * RF-09: confirmación al estudiante cuando su inscripción queda ACTIVA,
 * ya sea nueva o reactivada después de cancelarla. Devuelve null en otro caso.
 */
function construirConfirmacion(antes, despues, evento) {
  if (!despues || despues.estado !== 'ACTIVA') return null;
  if (antes && antes.estado === 'ACTIVA') return null;
  if (!despues.fcmToken || !evento) return null;
  return {
    tipo: 'INSCRIPCION_CONFIRMADA',
    titulo: 'Inscripción confirmada',
    cuerpo: `Quedaste inscrito en "${evento.nombre}" el ${evento.fecha} a las ${evento.hora}, ${evento.lugar}.`,
  };
}

module.exports = {
  construirNotificacion,
  debeEnviarRecordatorio,
  construirRecordatorio,
  construirConfirmacion,
  inicioEvento,
  RECORDATORIOS,
};
