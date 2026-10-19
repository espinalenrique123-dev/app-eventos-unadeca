package com.unadeca.app_eventos.services

import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.unadeca.app_eventos.R

/**
 * Recibe las notificaciones que envía la Cloud Function (patrón Observer):
 * cancelaciones, cambios de fecha/hora/lugar y recordatorios de 24 h.
 */
class EventosMessagingService : FirebaseMessagingService() {

    // Se comprueba areNotificationsEnabled() antes de notificar.
    @SuppressLint("MissingPermission")
    override fun onMessageReceived(message: RemoteMessage) {
        val titulo = message.notification?.title ?: return
        val cuerpo = message.notification?.body.orEmpty()
        crearCanal()

        val notificacion = NotificationCompat.Builder(this, CANAL)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(titulo)
            .setContentText(cuerpo)
            .setStyle(NotificationCompat.BigTextStyle().bigText(cuerpo))
            .setAutoCancel(true)
            .build()

        // En Android 13+ el usuario debe conceder POST_NOTIFICATIONS; si no, no se muestra.
        if (NotificationManagerCompat.from(this).areNotificationsEnabled()) {
            NotificationManagerCompat.from(this).notify(message.messageId.hashCode(), notificacion)
        }
    }

    /** El token nuevo se envía al backend en la próxima inscripción (campo fcmToken). */
    override fun onNewToken(token: String) {
        getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString(KEY_TOKEN, token).apply()
    }

    private fun crearCanal() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val canal = NotificationChannel(CANAL, getString(R.string.canal_eventos), NotificationManager.IMPORTANCE_DEFAULT)
            getSystemService(NotificationManager::class.java).createNotificationChannel(canal)
        }
    }

    companion object {
        const val CANAL = "eventos"
        const val PREFS = "fcm"
        const val KEY_TOKEN = "token"
    }
}
