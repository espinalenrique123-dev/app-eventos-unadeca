package com.unadeca.app_eventos.ui

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.firebase.auth.FirebaseAuth
import com.unadeca.app_eventos.R
import com.unadeca.app_eventos.api.RetrofitClient
import kotlinx.coroutines.launch

/**
 * Pantalla inicial (Sprint 1): muestra la lista de eventos disponibles.
 * Las pantallas de inicio de sesión, detalle e inscripción se implementan en el Sprint 1–2
 * siguiendo los Mockups 1, 2, 3 y 7.
 */
class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        val texto = findViewById<TextView>(R.id.textoEventos)

        if (FirebaseAuth.getInstance().currentUser == null) {
            texto.setText(R.string.sin_sesion)
            return
        }

        lifecycleScope.launch {
            texto.text = try {
                val eventos = RetrofitClient.api.eventos()
                if (eventos.isEmpty()) getString(R.string.sin_eventos)
                else eventos.joinToString("\n\n") { "${it.nombre}\n${it.fecha} ${it.hora} · ${it.lugar}\n${it.cuposLibres} cupos libres" }
            } catch (e: Exception) {
                getString(R.string.error_red)
            }
        }
    }
}
