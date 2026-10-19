package com.unadeca.app_eventos.models

/** Enumeraciones del DEDS (mismos valores que el backend). */
enum class EstadoEvento { PUBLICADO, CUPO_LLENO, CANCELADO, FINALIZADO }

enum class EstadoInscripcion { ACTIVA, CANCELADA }

/** Documento de la colección `events`. */
data class Evento(
    val id: String = "",
    val nombre: String = "",
    val descripcion: String = "",
    val fecha: String = "",
    val hora: String = "",
    val lugar: String = "",
    val categoria: String = "",
    val cupoMaximo: Int = 0,
    val cuposOcupados: Int = 0,
    val estado: EstadoEvento = EstadoEvento.PUBLICADO,
) {
    val cuposLibres: Int get() = (cupoMaximo - cuposOcupados).coerceAtLeast(0)
    val admiteInscripcion: Boolean get() = estado == EstadoEvento.PUBLICADO && cuposLibres > 0
}

/** Documento de la colección `inscriptions` (id = {eventId}_{userId}). */
data class Inscripcion(
    val id: String = "",
    val eventId: String = "",
    val userId: String = "",
    val estado: EstadoInscripcion = EstadoInscripcion.ACTIVA,
    val fecha: String = "",
)

/** Documento de la colección `users`. */
data class Usuario(
    val id: String = "",
    val nombre: String = "",
    val email: String = "",
    val rol: String = "estudiante",
    val activo: Boolean = true,
)

data class SolicitudInscripcion(val fcmToken: String?)
