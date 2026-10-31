package com.unadeca.app_eventos.logica

import com.unadeca.app_eventos.models.EstadoEvento
import com.unadeca.app_eventos.models.EstadoInscripcion
import com.unadeca.app_eventos.models.Evento
import com.unadeca.app_eventos.models.Inscripcion
import java.time.Instant

/** Cómo se muestra cada inscripción en "Mis eventos". */
enum class EtiquetaMiEvento { PROXIMO, REALIZADO, INSCRIPCION_CANCELADA, EVENTO_CANCELADO }

data class MiEvento(val inscripcion: Inscripcion, val etiqueta: EtiquetaMiEvento)

/**
 * RF-17: "Mis eventos". Sin dependencias de Android para probarlo con JUnit.
 * Primero los próximos (el más cercano arriba) y después el historial (el más reciente arriba).
 */
object MisEventos {

    fun organizar(inscripciones: List<Inscripcion>, ahora: Instant): List<MiEvento> {
        val conEvento = inscripciones.filter { it.evento != null }
        val etiquetadas = conEvento.map { MiEvento(it, etiqueta(it, ahora)) }
        val (proximos, historial) = etiquetadas.partition { it.etiqueta == EtiquetaMiEvento.PROXIMO }
        return proximos.sortedBy { inicio(it.inscripcion) } +
            historial.sortedByDescending { inicio(it.inscripcion) }
    }

    fun etiqueta(inscripcion: Inscripcion, ahora: Instant): EtiquetaMiEvento {
        val evento = inscripcion.evento ?: return EtiquetaMiEvento.REALIZADO
        return when {
            evento.estado == EstadoEvento.CANCELADO -> EtiquetaMiEvento.EVENTO_CANCELADO
            inscripcion.estado == EstadoInscripcion.CANCELADA -> EtiquetaMiEvento.INSCRIPCION_CANCELADA
            evento.estado == EstadoEvento.FINALIZADO -> EtiquetaMiEvento.REALIZADO
            haIniciado(inscripcion, ahora) -> EtiquetaMiEvento.REALIZADO
            else -> EtiquetaMiEvento.PROXIMO
        }
    }

    private fun comoEvento(i: Inscripcion) =
        Evento(fecha = i.evento?.fecha.orEmpty(), hora = i.evento?.hora.orEmpty())

    private fun inicio(i: Inscripcion): Instant = ReglasInscripcion.inicio(comoEvento(i)) ?: Instant.EPOCH

    private fun haIniciado(i: Inscripcion, ahora: Instant) = ReglasInscripcion.haIniciado(comoEvento(i), ahora)
}

/** RF-18: el chip "Todas" equivale a no enviar categoría a la API. */
object FiltroCategoria {
    const val TODAS = "Todas"
    fun paraApi(seleccion: String?): String? = seleccion?.takeUnless { it.isBlank() || it == TODAS }
}
