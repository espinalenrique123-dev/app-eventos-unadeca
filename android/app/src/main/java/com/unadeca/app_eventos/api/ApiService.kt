package com.unadeca.app_eventos.api

import com.unadeca.app_eventos.models.Evento
import com.unadeca.app_eventos.models.Inscripcion
import com.unadeca.app_eventos.models.SolicitudInscripcion
import com.unadeca.app_eventos.models.Usuario
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

/** Endpoints del backend que usa el estudiante (ver backend/src/routes/index.js). */
interface ApiService {
    @GET("users/me")
    suspend fun perfil(): Usuario

    @GET("users/me/inscriptions")
    suspend fun misInscripciones(): List<Inscripcion>

    @GET("events")
    suspend fun eventos(): List<Evento>

    @GET("events/{id}")
    suspend fun evento(@Path("id") id: String): Evento

    @POST("events/{id}/inscriptions")
    suspend fun inscribirse(@Path("id") id: String, @Body body: SolicitudInscripcion): Inscripcion

    @DELETE("events/{id}/inscriptions/me")
    suspend fun cancelarInscripcion(@Path("id") id: String): Inscripcion
}
