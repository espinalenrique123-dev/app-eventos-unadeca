package com.unadeca.app_eventos.ui

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.button.MaterialButton
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.snackbar.Snackbar
import com.google.firebase.messaging.FirebaseMessaging
import com.unadeca.app_eventos.R
import com.unadeca.app_eventos.api.ApiErrores
import com.unadeca.app_eventos.api.RetrofitClient
import com.unadeca.app_eventos.logica.AccionBoton
import com.unadeca.app_eventos.logica.ReglasInscripcion
import com.unadeca.app_eventos.models.EstadoInscripcion
import com.unadeca.app_eventos.models.Evento
import com.unadeca.app_eventos.models.SolicitudInscripcion
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import retrofit2.HttpException
import java.time.Instant

/**
 * Mockup 3 — Detalle del evento (Estudiante).
 * RF-05 (detalle completo), RF-06 (inscribirse: lista → detalle → botón, dos pasos),
 * RF-07 (botón deshabilitado con "Cupo lleno"), RF-08 (cancelar antes del inicio).
 */
class DetalleEventoActivity : AppCompatActivity() {

    private lateinit var eventId: String
    private lateinit var boton: MaterialButton
    private lateinit var progreso: ProgressBar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        eventId = intent.getStringExtra(EXTRA_ID) ?: run {
            finish()
            return
        }
        setContentView(R.layout.activity_detalle)
        findViewById<MaterialToolbar>(R.id.barra).setNavigationOnClickListener { finish() }
        boton = findViewById(R.id.botonAccion)
        progreso = findViewById(R.id.progreso)
        cargar()
    }

    private fun cargar() {
        progreso.visibility = View.VISIBLE
        boton.isEnabled = false
        lifecycleScope.launch {
            try {
                val evento = RetrofitClient.api.evento(eventId)
                val inscrito = RetrofitClient.api.misInscripciones()
                    .any { it.eventId == eventId && it.estado == EstadoInscripcion.ACTIVA }
                mostrar(evento, inscrito)
            } catch (e: HttpException) {
                avisar(ApiErrores.mensaje(e, getString(R.string.error_red)))
            } catch (e: Exception) {
                avisar(getString(R.string.error_red))
            } finally {
                progreso.visibility = View.GONE
            }
        }
    }

    private fun mostrar(evento: Evento, inscrito: Boolean) {
        findViewById<TextView>(R.id.textoNombre).text = evento.nombre
        findViewById<TextView>(R.id.textoCategoria).text = evento.categoria
        findViewById<TextView>(R.id.textoDescripcion).text = evento.descripcion
        findViewById<TextView>(R.id.textoFecha).text = getString(R.string.detalle_fecha, evento.fecha, evento.hora)
        findViewById<TextView>(R.id.textoLugar).text = getString(R.string.detalle_lugar, evento.lugar)
        findViewById<TextView>(R.id.textoCupos).text =
            getString(R.string.detalle_cupos, evento.cuposOcupados, evento.cupoMaximo)

        when (ReglasInscripcion.accion(evento, inscrito, Instant.now())) {
            AccionBoton.INSCRIBIRSE -> configurarBoton(R.string.inscribirme, true) { inscribirse() }
            AccionBoton.CANCELAR -> configurarBoton(R.string.cancelar_inscripcion, true) { confirmarCancelacion() }
            AccionBoton.CUPO_LLENO -> configurarBoton(R.string.cupo_lleno, false, null)
            AccionBoton.NO_DISPONIBLE -> configurarBoton(R.string.no_disponible, false, null)
        }
    }

    private fun configurarBoton(texto: Int, habilitado: Boolean, accion: (() -> Unit)?) {
        boton.setText(texto)
        boton.isEnabled = habilitado
        boton.setOnClickListener { accion?.invoke() }
    }

    private fun inscribirse() {
        boton.isEnabled = false
        lifecycleScope.launch {
            try {
                // El token FCM permite enviar los avisos del evento (RF-09/10/11, Sprint 2).
                val token = try {
                    FirebaseMessaging.getInstance().token.await()
                } catch (e: Exception) {
                    null
                }
                RetrofitClient.api.inscribirse(eventId, SolicitudInscripcion(token))
                avisar(getString(R.string.inscripcion_confirmada))
            } catch (e: HttpException) {
                avisar(ApiErrores.mensaje(e, getString(R.string.error_red)))
            } catch (e: Exception) {
                avisar(getString(R.string.error_red))
            }
            cargar()
        }
    }

    private fun confirmarCancelacion() {
        MaterialAlertDialogBuilder(this)
            .setTitle(R.string.cancelar_titulo)
            .setMessage(R.string.cancelar_mensaje)
            .setNegativeButton(R.string.volver, null)
            .setPositiveButton(R.string.cancelar_inscripcion) { _, _ -> cancelar() }
            .show()
    }

    private fun cancelar() {
        boton.isEnabled = false
        lifecycleScope.launch {
            try {
                RetrofitClient.api.cancelarInscripcion(eventId)
                avisar(getString(R.string.inscripcion_cancelada))
            } catch (e: HttpException) {
                avisar(ApiErrores.mensaje(e, getString(R.string.error_red)))
            } catch (e: Exception) {
                avisar(getString(R.string.error_red))
            }
            cargar()
        }
    }

    private fun avisar(texto: String) {
        Snackbar.make(boton, texto, Snackbar.LENGTH_LONG).show()
    }

    companion object {
        private const val EXTRA_ID = "eventId"
        fun intent(ctx: Context, eventId: String): Intent =
            Intent(ctx, DetalleEventoActivity::class.java).putExtra(EXTRA_ID, eventId)
    }
}
