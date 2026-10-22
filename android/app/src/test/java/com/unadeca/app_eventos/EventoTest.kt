package com.unadeca.app_eventos

import com.unadeca.app_eventos.logica.AccionBoton
import com.unadeca.app_eventos.logica.ReglasInscripcion
import com.unadeca.app_eventos.models.EstadoEvento
import com.unadeca.app_eventos.models.Evento
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.Instant

/** Pruebas unitarias JUnit de la app Android (Plan de Pruebas, Nivel 1). */
class EventoTest {

    private val evento = Evento(id = "e1", fecha = "2026-11-20", hora = "09:00", cupoMaximo = 2, cuposOcupados = 1)
    private val antes = Instant.parse("2026-10-21T18:00:00Z")
    private val durante = Instant.parse("2026-11-20T15:30:00Z") // 09:30 en Costa Rica

    /** CP-A-01 [RF-07] */
    @Test
    fun cuposLibresNuncaEsNegativo() {
        assertEquals(0, Evento(cupoMaximo = 10, cuposOcupados = 12).cuposLibres)
    }

    /** CP-A-02 [RF-06] */
    @Test
    fun conCupoYAntesDelInicioSePuedeInscribir() {
        assertEquals(AccionBoton.INSCRIBIRSE, ReglasInscripcion.accion(evento, inscrito = false, ahora = antes))
    }

    /** CP-A-03 [RF-07] */
    @Test
    fun cupoLlenoDeshabilitaElBoton() {
        val lleno = evento.copy(cuposOcupados = 2, estado = EstadoEvento.CUPO_LLENO)
        assertEquals(AccionBoton.CUPO_LLENO, ReglasInscripcion.accion(lleno, inscrito = false, ahora = antes))
    }

    /** CP-A-04 [RF-08] */
    @Test
    fun inscritoAntesDelInicioPuedeCancelar() {
        assertEquals(AccionBoton.CANCELAR, ReglasInscripcion.accion(evento, inscrito = true, ahora = antes))
    }

    /** CP-A-05 [RF-08] */
    @Test
    fun inscritoDespuesDelInicioNoPuedeCancelar() {
        assertEquals(AccionBoton.NO_DISPONIBLE, ReglasInscripcion.accion(evento, inscrito = true, ahora = durante))
    }

    /** CP-A-06 [RF-03][RF-06] */
    @Test
    fun eventoCanceladoNoAdmiteInscripcion() {
        val cancelado = evento.copy(estado = EstadoEvento.CANCELADO)
        assertEquals(AccionBoton.NO_DISPONIBLE, ReglasInscripcion.accion(cancelado, inscrito = false, ahora = antes))
    }

    /** CP-A-07 [RF-08] La hora de inicio se interpreta en hora de Costa Rica (UTC-6). */
    @Test
    fun inicioEnHoraDeCostaRica() {
        assertFalse(ReglasInscripcion.haIniciado(evento, Instant.parse("2026-11-20T14:59:00Z")))
        assertTrue(ReglasInscripcion.haIniciado(evento, Instant.parse("2026-11-20T15:00:00Z")))
    }

    /** CP-A-08 [RF-05] Una fecha con formato inválido no rompe la pantalla. */
    @Test
    fun fechaInvalidaNoSeConsideraIniciada() {
        assertFalse(ReglasInscripcion.haIniciado(evento.copy(fecha = "20/11/2026"), antes))
    }
}
