package com.unadeca.app_eventos.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.unadeca.app_eventos.R
import com.unadeca.app_eventos.logica.EtiquetaMiEvento
import com.unadeca.app_eventos.logica.MiEvento

/** Tarjetas de "Mis eventos" (RF-17). Reutiliza el diseño de tarjeta de la lista de eventos. */
class MisEventosAdapter(private val alTocar: (MiEvento) -> Unit) : RecyclerView.Adapter<MisEventosAdapter.Tarjeta>() {

    private var items: List<MiEvento> = emptyList()

    fun mostrar(lista: List<MiEvento>) {
        items = lista
        @Suppress("NotifyDataSetChanged")
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Tarjeta =
        Tarjeta(LayoutInflater.from(parent.context).inflate(R.layout.item_evento, parent, false))

    override fun getItemCount() = items.size

    override fun onBindViewHolder(holder: Tarjeta, position: Int) = holder.mostrar(items[position])

    inner class Tarjeta(vista: View) : RecyclerView.ViewHolder(vista) {
        private val nombre: TextView = vista.findViewById(R.id.textoNombre)
        private val fechaLugar: TextView = vista.findViewById(R.id.textoFechaLugar)
        private val categoria: TextView = vista.findViewById(R.id.textoCategoria)
        private val estado: TextView = vista.findViewById(R.id.textoCupos)

        fun mostrar(item: MiEvento) {
            val ctx = itemView.context
            val evento = item.inscripcion.evento ?: return
            nombre.text = evento.nombre
            fechaLugar.text = ctx.getString(R.string.fecha_hora_lugar, evento.fecha, evento.hora, evento.lugar)
            categoria.text = evento.categoria
            estado.text = ctx.getString(
                when (item.etiqueta) {
                    EtiquetaMiEvento.PROXIMO -> R.string.mis_eventos_proximo
                    EtiquetaMiEvento.REALIZADO -> R.string.mis_eventos_realizado
                    EtiquetaMiEvento.INSCRIPCION_CANCELADA -> R.string.mis_eventos_inscripcion_cancelada
                    EtiquetaMiEvento.EVENTO_CANCELADO -> R.string.mis_eventos_evento_cancelado
                },
            )
            itemView.setOnClickListener { alTocar(item) }
        }
    }
}
