package com.unadeca.app_eventos.ui

import android.content.Intent
import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText
import com.google.firebase.auth.FirebaseAuth
import com.unadeca.app_eventos.R
import com.unadeca.app_eventos.api.ApiErrores
import com.unadeca.app_eventos.api.RetrofitClient
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import retrofit2.HttpException

/**
 * Mockup 1 — Inicio de sesión.
 * RF-15: solo usuarios con cuenta activa acceden. Firebase Auth valida la contraseña
 * y el backend confirma que la cuenta esté activa (GET /users/me).
 */
class LoginActivity : AppCompatActivity() {

    private val auth = FirebaseAuth.getInstance()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (auth.currentUser != null) {
            abrirEventos()
            return
        }
        setContentView(R.layout.activity_login)

        val email = findViewById<TextInputEditText>(R.id.inputEmail)
        val clave = findViewById<TextInputEditText>(R.id.inputPassword)
        val boton = findViewById<MaterialButton>(R.id.botonIngresar)
        val mensaje = findViewById<TextView>(R.id.textoMensaje)

        boton.setOnClickListener {
            val correo = email.text?.toString()?.trim().orEmpty()
            val contrasena = clave.text?.toString().orEmpty()
            if (correo.isEmpty() || contrasena.isEmpty()) {
                mensaje.setText(R.string.login_campos)
                return@setOnClickListener
            }
            boton.isEnabled = false
            mensaje.text = ""
            lifecycleScope.launch {
                try {
                    auth.signInWithEmailAndPassword(correo, contrasena).await()
                    RetrofitClient.api.perfil()
                    abrirEventos()
                } catch (e: HttpException) {
                    auth.signOut()
                    mensaje.text = ApiErrores.mensaje(e, getString(R.string.login_error))
                } catch (e: Exception) {
                    auth.signOut()
                    mensaje.setText(R.string.login_error)
                } finally {
                    boton.isEnabled = true
                }
            }
        }

        findViewById<TextView>(R.id.enlaceRecuperar).setOnClickListener {
            val correo = email.text?.toString()?.trim().orEmpty()
            if (correo.isEmpty()) {
                mensaje.setText(R.string.recuperar_falta_correo)
                return@setOnClickListener
            }
            // Por seguridad se muestra el mismo mensaje exista o no la cuenta.
            auth.sendPasswordResetEmail(correo)
            mensaje.setText(R.string.recuperar_enviado)
        }
    }

    private fun abrirEventos() {
        startActivity(Intent(this, EventosActivity::class.java))
        finish()
    }
}
