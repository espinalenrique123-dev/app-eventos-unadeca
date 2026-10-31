package com.unadeca.app_eventos

import com.unadeca.app_eventos.logica.EtiquetaMiEvento
import com.unadeca.app_eventos.logica.FiltroCategoria
import com.unadeca.app_eventos.logica.MisEventos
import com.unadeca.app_eventos.models.EstadoEvento
import com.unadeca.app_eventos.models.EstadoInscripcion
import com.unadeca.app_eventos.models.Inscripcion
import com.unadeca.app_eventos.models.ResumenEvento
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.time.Instant

/** Sprint 2 — "Mis eventos" (RF-17) y filtro por categoría (RF-18). */
class MisEventosTest {

    private val ahora = Instant.parse("2026-11-01T18:00:00Z") // 12:00 en Costa Rica

    private fun insc(
        id: String,
        fecha: String,
        estado: EstadoInscripcion = EstadoInscripcion.ACTIVA,
        estadoEvento: EstadoEvento = EstadoEvento.PUBLICADO,
    ) = Inscripcion(
        id = id,
        eventId = id,
        estado = estado,
        evento = ResumenEvento(nombre = id, fecha = fecha, hora = "09:00", lugar = "Auditorio", estado = estadoEvento),
    )

    @Test
    fun `CP-A-09 RF-17 los proximos van primero y el mas cercano arriba`() {
        val r = MisEventos.organizar(
            listOf(insc("pasado", "2026-10-20"), insc("lejano", "2026-12-01"), insc("cercano", "2026-11-05")),
            ahora,
        )
        assertEquals(listOf("cercano", "lejano", "pasado"), r.map { it.inscripcion.id })
        assertEquals(EtiquetaMiEvento.REALIZADO, r.last().etiqueta)
    }

    @Test
    fun `CP-A-10 RF-17 etiqueta inscripciones y eventos cancelados`() {
        assertEquals(
            EtiquetaMiEvento.INSCRIPCION_CANCELADA,
            MisEventos.etiqueta(insc("a", "2026-11-05", estado = EstadoInscripcion.CANCELADA), ahora),
        )
        assertEquals(
            EtiquetaMiEvento.EVENTO_CANCELADO,
            MisEventos.etiqueta(insc("b", "2026-11-05", estadoEvento = EstadoEvento.CANCELADO), ahora),
        )
    }

    @Test
    fun `CP-A-11 RF-17 ignora inscripciones sin datos del evento`() {
        val r = MisEventos.organizar(listOf(Inscripcion(id = "x"), insc("ok", "2026-11-05")), ahora)
        assertEquals(listOf("ok"), r.map { it.inscripcion.id })
    }

    @Test
    fun `CP-A-12 RF-18 el chip Todas no envia categoria a la API`() {
        assertNull(FiltroCategoria.paraApi(FiltroCategoria.TODAS))
        assertNull(FiltroCategoria.paraApi(null))
        assertEquals("Cultural", FiltroCategoria.paraApi("Cultural"))
    }
}
