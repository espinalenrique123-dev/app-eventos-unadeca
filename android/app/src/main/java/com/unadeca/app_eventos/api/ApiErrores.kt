package com.unadeca.app_eventos.api

import org.json.JSONObject
import retrofit2.HttpException

/** Extrae el mensaje que envía el backend en {"error": "..."}; si no hay, usa el mensaje por defecto. */
object ApiErrores {
    fun mensaje(e: HttpException, porDefecto: String): String {
        val cuerpo = try {
            e.response()?.errorBody()?.string()
        } catch (ex: Exception) {
            null
        } ?: return porDefecto
        return try {
            JSONObject(cuerpo).optString("error", porDefecto).ifBlank { porDefecto }
        } catch (ex: Exception) {
            porDefecto
        }
    }

    /** 401: sesión vencida · 403: cuenta desactivada o sin permiso. */
    fun esDeSesion(e: HttpException) = e.code() == 401 || e.code() == 403
}
