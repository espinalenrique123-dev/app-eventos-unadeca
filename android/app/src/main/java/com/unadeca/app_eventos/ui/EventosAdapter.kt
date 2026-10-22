package com.unadeca.app_eventos.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.unadeca.app_eventos.R
import com.unadeca.app_eventos.models.EstadoEvento
import com.unadeca.app_eventos.models.Evento

/** Tarjetas de la lista de eventos (Mockup 2, RF-04). */
class EventosAdapter(private val alTocar: (Evento) -> Unit) : RecyclerView.Adapter<EventosAdapter.Tarjeta>() {

    private var eventos: List<Evento> = emptyList()

    fun mostrar(lista: List<Evento>) {
        eventos = lista
        @Suppress("NotifyDataSetChanged")
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Tarjeta =
        Tarjeta(LayoutInflater.from(parent.context).inflate(R.layout.item_evento, parent, false))

    override fun getItemCount() = eventos.size

    override fun onBindViewHolder(holder: Tarjeta, position: Int) = holder.mostrar(eventos[position])

    inner class Tarjeta(vista: View) : RecyclerView.ViewHolder(vista) {
        private val nombre: TextView = vista.findViewById(R.id.textoNombre)
        private val fechaLugar: TextView = vista.findViewById(R.id.textoFechaLugar)
        private val categoria: TextView = vista.findViewById(R.id.textoCategoria)
        private val cupos: TextView = vista.findViewById(R.id.textoCupos)

        fun mostrar(evento: Evento) {
            val ctx = itemView.context
            nombre.text = evento.nombre
            fechaLugar.text = ctx.getString(R.string.fecha_hora_lugar, evento.fecha, evento.hora, evento.lugar)
            categoria.text = evento.categoria
            cupos.text = if (evento.estado == EstadoEvento.CUPO_LLENO || evento.cuposLibres == 0) {
                ctx.getString(R.string.cupo_lleno)
            } else {
                ctx.getString(R.string.cupos_libres, evento.cuposLibres)
            }
            itemView.setOnClickListener { alTocar(evento) }
        }
    }
}
