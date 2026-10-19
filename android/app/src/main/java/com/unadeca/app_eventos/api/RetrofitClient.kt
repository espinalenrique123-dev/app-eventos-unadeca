package com.unadeca.app_eventos.api

import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.FirebaseAuth
import com.unadeca.app_eventos.BuildConfig
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Cliente HTTP único de la app. Agrega a cada petición el ID token de Firebase Auth
 * del usuario ("Authorization: Bearer <token>"); el backend lo verifica.
 */
object RetrofitClient {

    /** OkHttp ejecuta los interceptores fuera del hilo principal, por eso se puede esperar el token. */
    private val tokenInterceptor = Interceptor { chain ->
        val user = FirebaseAuth.getInstance().currentUser
        val request = if (user != null) {
            val token = Tasks.await(user.getIdToken(false), 10, TimeUnit.SECONDS).token
            chain.request().newBuilder().header("Authorization", "Bearer $token").build()
        } else {
            chain.request()
        }
        chain.proceed(request)
    }

    val api: ApiService by lazy {
        val client = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .addInterceptor(tokenInterceptor)
            .build()

        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
