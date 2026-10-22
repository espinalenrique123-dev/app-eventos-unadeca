package com.unadeca.app_eventos.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.appbar.MaterialToolbar
import com.google.firebase.auth.FirebaseAuth
import com.unadeca.app_eventos.R
import com.unadeca.app_eventos.api.ApiErrores
import com.unadeca.app_eventos.api.RetrofitClient
import kotlinx.coroutines.launch
import retrofit2.HttpException

/**
 * Mockup 2 — Lista de eventos (Estudiante).
 * RF-04: eventos disponibles ordenados por fecha (el backend los entrega ordenados).
 */
class EventosActivity : AppCompatActivity() {

    private val adapter = EventosAdapter { evento ->
        startActivity(DetalleEventoActivity.intent(this, evento.id))
    }
    private lateinit var progreso: ProgressBar
    private lateinit var mensaje: TextView

    // Android 13+: las notificaciones de los RF-09/10/11 requieren permiso del usuario.
    private val pedirPermiso = registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (FirebaseAuth.getInstance().currentUser == null) {
            volverAlLogin()
            return
        }
        setContentView(R.layout.activity_eventos)

        val barra = findViewById<MaterialToolbar>(R.id.barra)
        barra.inflateMenu(R.menu.menu_eventos)
        barra.setOnMenuItemClickListener { item ->
            if (item.itemId == R.id.accionSalir) {
                FirebaseAuth.getInstance().signOut()
                volverAlLogin()
                true
            } else {
                false
            }
        }

        progreso = findViewById(R.id.progreso)
        mensaje = findViewById(R.id.textoMensaje)
        findViewById<RecyclerView>(R.id.listaEventos).apply {
            layoutManager = LinearLayoutManager(this@EventosActivity)
            adapter = this@EventosActivity.adapter
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            pedirPermiso.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    // Se recarga al volver del detalle para mostrar los cupos actualizados.
    override fun onResume() {
        super.onResume()
        if (::progreso.isInitialized) cargar()
    }

    private fun cargar() {
        progreso.visibility = View.VISIBLE
        mensaje.visibility = View.GONE
        lifecycleScope.launch {
            try {
                val eventos = RetrofitClient.api.eventos()
                adapter.mostrar(eventos)
                if (eventos.isEmpty()) mostrarMensaje(getString(R.string.sin_eventos))
            } catch (e: HttpException) {
                if (ApiErrores.esDeSesion(e)) {
                    FirebaseAuth.getInstance().signOut()
                    volverAlLogin()
                } else {
                    mostrarMensaje(ApiErrores.mensaje(e, getString(R.string.error_red)))
                }
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

    private fun volverAlLogin() {
        startActivity(Intent(this, LoginActivity::class.java))
        finish()
    }
}
