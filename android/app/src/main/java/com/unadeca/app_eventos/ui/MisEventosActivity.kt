package com.unadeca.app_eventos.ui

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.appbar.MaterialToolbar
import com.google.firebase.auth.FirebaseAuth
import com.unadeca.app_eventos.R
import com.unadeca.app_eventos.api.ApiErrores
import com.unadeca.app_eventos.api.RetrofitClient
import com.unadeca.app_eventos.logica.MisEventos
import kotlinx.coroutines.launch
import retrofit2.HttpException
import java.time.Instant

/**
 * "Mis eventos" (Estudiante) — RF-17: historial de inscripciones,
 * primero los eventos próximos y después los realizados o cancelados.
 */
class MisEventosActivity : AppCompatActivity() {

    private val adapter = MisEventosAdapter { item ->
        startActivity(DetalleEventoActivity.intent(this, item.inscripcion.eventId))
    }
    private lateinit var progreso: ProgressBar
    private lateinit var mensaje: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (FirebaseAuth.getInstance().currentUser == null) {
            finish()
            return
        }
        setContentView(R.layout.activity_mis_eventos)
        findViewById<MaterialToolbar>(R.id.barra).setNavigationOnClickListener { finish() }
        progreso = findViewById(R.id.progreso)
        mensaje = findViewById(R.id.textoMensaje)
        findViewById<RecyclerView>(R.id.listaMisEventos).apply {
            layoutManager = LinearLayoutManager(this@MisEventosActivity)
            adapter = this@MisEventosActivity.adapter
        }
    }

    override fun onResume() {
        super.onResume()
        if (::progreso.isInitialized) cargar()
    }

    private fun cargar() {
        progreso.visibility = View.VISIBLE
        mensaje.visibility = View.GONE
        lifecycleScope.launch {
            try {
                val items = MisEventos.organizar(RetrofitClient.api.misInscripciones(), Instant.now())
                adapter.mostrar(items)
                if (items.isEmpty()) mostrarMensaje(getString(R.string.mis_eventos_vacio))
            } catch (e: HttpException) {
                mostrarMensaje(ApiErrores.mensaje(e, getString(R.string.error_red)))
            } catch (e: Exception) {
                mostrarMensaje(getString(R.string.error_red))
            } finally {
                progreso.visibility = View.GONE
            }
        }
    }

    private fun mostrarMensaje(texto: String) {
        mensaje.text = texto
        mensaje.visibility = View.VISIBLE
    }

    companion object {
        fun intent(ctx: Context) = Intent(ctx, MisEventosActivity::class.java)
    }
}
