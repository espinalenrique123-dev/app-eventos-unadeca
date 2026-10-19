/**
 * Enumeraciones del dominio (DEDS — diagrama de clases de diseño).
 * Se congelan para que no puedan modificarse en tiempo de ejecución.
 */

const EstadoEvento = Object.freeze({
  PUBLICADO: 'PUBLICADO',
  CUPO_LLENO: 'CUPO_LLENO',
  CANCELADO: 'CANCELADO',
  FINALIZADO: 'FINALIZADO',
});

const EstadoInscripcion = Object.freeze({
  ACTIVA: 'ACTIVA',
  CANCELADA: 'CANCELADA',
});

const Rol = Object.freeze({
  ESTUDIANTE: 'estudiante',
  COORDINADOR: 'coordinador',
  ADMINISTRADOR: 'administrador',
});

module.exports = { EstadoEvento, EstadoInscripcion, Rol };
