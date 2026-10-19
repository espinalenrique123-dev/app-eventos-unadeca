package com.unadeca.app_eventos

import com.unadeca.app_eventos.models.EstadoEvento
import com.unadeca.app_eventos.models.Evento
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class EventoTest {
    @Test
    fun cuposLibresNuncaEsNegativo() {
        assertEquals(0, Evento(cupoMaximo = 10, cuposOcupados = 12).cuposLibres)
    }

    @Test
    fun soloAdmiteInscripcionSiEstaPublicadoYConCupo() {
        assertTrue(Evento(cupoMaximo = 2, cuposOcupados = 1).admiteInscripcion)
        assertFalse(Evento(cupoMaximo = 2, cuposOcupados = 2, estado = EstadoEvento.CUPO_LLENO).admiteInscripcion)
        assertFalse(Evento(cupoMaximo = 2, cuposOcupados = 0, estado = EstadoEvento.CANCELADO).admiteInscripcion)
    }
}
