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
import com.google.android.material.chip.Chip
import com.google.android.material.chip.ChipGroup
import com.google.firebase.auth.FirebaseAuth
import com.unadeca.app_eventos.R
import com.unadeca.app_eventos.api.ApiErrores
import com.unadeca.app_eventos.api.RetrofitClient
import com.unadeca.app_eventos.logica.FiltroCategoria
import kotlinx.coroutines.launch
import retrofit2.HttpException

/**
 * Mockup 2 — Lista de eventos (Estudiante).
 * RF-04: eventos disponibles ordenados por fecha (el backend los entrega ordenados).
 * RF-18: filtro por categoría con chips; RF-17: acceso a "Mis eventos" desde el menú.
 */
class EventosActivity : AppCompatActivity() {

    private val adapter = EventosAdapter { evento ->
        startActivity(DetalleEventoActivity.intent(this, evento.id))
    }
    private lateinit var progreso: ProgressBar
    private lateinit var mensaje: TextView
    private lateinit var grupoCategorias: ChipGroup
    private var categoriaSeleccionada: String? = null
    private var categoriasCargadas = false
    private var construyendoChips = false

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
            when (item.itemId) {
                R.id.accionMisEventos -> {
                    startActivity(MisEventosActivity.intent(this))
                    true
                }
                R.id.accionSalir -> {
                    FirebaseAuth.getInstance().signOut()
                    volverAlLogin()
                    true
                }
                else -> false
            }
        }

        progreso = findViewById(R.id.progreso)
        mensaje = findViewById(R.id.textoMensaje)
        grupoCategorias = findViewById(R.id.grupoCategorias)
        grupoCategorias.setOnCheckedStateChangeListener { grupo, ids ->
            if (construyendoChips) return@setOnCheckedStateChangeListener
            val chip = ids.firstOrNull()?.let { grupo.findViewById<Chip>(it) }
            categoriaSeleccionada = FiltroCategoria.paraApi(chip?.text?.toString())
            cargar()
        }
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
                if (!categoriasCargadas) cargarCategorias()
                val eventos = RetrofitClient.api.eventos(categoriaSeleccionada)
                adapter.mostrar(eventos)
                if (eventos.isEmpty()) {
                    val vacio = if (categoriaSeleccionada == null) R.string.sin_eventos else R.string.sin_eventos_categoria
                    mostrarMensaje(getString(vacio))
                }
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

    /** RF-18: un chip por categoría, más "Todas" seleccionado al inicio. */
    private suspend fun cargarCategorias() {
        val categorias = RetrofitClient.api.categorias()
        categoriasCargadas = true
        construyendoChips = true
        grupoCategorias.removeAllViews()
        (listOf(getString(R.string.categoria_todas)) + categorias).forEachIndexed { i, nombre ->
            val chip = Chip(this).apply {
                id = View.generateViewId()
                text = nombre
                isCheckable = true
                isChecked = i == 0
            }
            grupoCategorias.addView(chip)
        }
        construyendoChips = false
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
