package com.unadeca.app_eventos.logica

import com.unadeca.app_eventos.models.EstadoEvento
import com.unadeca.app_eventos.models.Evento
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.time.format.DateTimeParseException

/** Qué debe hacer el botón principal de la pantalla de detalle (Mockup 3). */
enum class AccionBoton { INSCRIBIRSE, CANCELAR, CUPO_LLENO, NO_DISPONIBLE }

/**
 * Reglas de la pantalla de detalle, sin dependencias de Android para poder probarlas con JUnit.
 * Trazabilidad: RF-06 (inscribirse), RF-07 (botón deshabilitado con "Cupo lleno"),
 * RF-08 (cancelar solo antes del inicio).
 * El backend vuelve a validar todo; estas reglas solo evitan mostrar acciones imposibles.
 */
object ReglasInscripcion {

    private val ZONA_COSTA_RICA: ZoneOffset = ZoneOffset.ofHours(-6)

    /** Fecha y hora de inicio del evento en hora de Costa Rica, o null si el formato es inválido. */
    fun inicio(evento: Evento): Instant? = try {
        LocalDateTime.parse("${evento.fecha}T${evento.hora}").toInstant(ZONA_COSTA_RICA)
    } catch (e: DateTimeParseException) {
        null
    }

    fun haIniciado(evento: Evento, ahora: Instant): Boolean {
        val inicio = inicio(evento) ?: return false
        return !inicio.isAfter(ahora)
    }

    fun accion(evento: Evento, inscrito: Boolean, ahora: Instant): AccionBoton {
        val iniciado = haIniciado(evento, ahora)
        val cerrado = evento.estado == EstadoEvento.CANCELADO || evento.estado == EstadoEvento.FINALIZADO
        return when {
            inscrito && !iniciado && evento.estado != EstadoEvento.FINALIZADO -> AccionBoton.CANCELAR
            inscrito || iniciado || cerrado -> AccionBoton.NO_DISPONIBLE
            evento.estado == EstadoEvento.CUPO_LLENO || evento.cuposLibres == 0 -> AccionBoton.CUPO_LLENO
            else -> AccionBoton.INSCRIBIRSE
        }
    }
}
