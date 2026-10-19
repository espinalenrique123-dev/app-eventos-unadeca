import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';

const VACIO = { nombre: '', descripcion: '', fecha: '', hora: '', lugar: '', categoria: 'Académico', cupoMaximo: 30 };
const CATEGORIAS = ['Académico', 'Cultural', 'Deportivo', 'Espiritual', 'Social'];

/** Crear evento (/eventos/nuevo) y Editar evento (/eventos/:id/editar). */
export default function FormularioEvento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.evento(id)
      .then((e) => setForm(Object.fromEntries(Object.keys(VACIO).map((k) => [k, e[k] ?? VACIO[k]]))))
      .catch((e) => setError(e.message));
  }, [id]);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      const datos = { ...form, cupoMaximo: Number(form.cupoMaximo) };
      if (id) await api.editarEvento(id, datos);
      else await api.crearEvento(datos);
      navigate('/eventos');
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="formulario" onSubmit={guardar}>
      <h2>{id ? 'Editar evento' : 'Crear nuevo evento'}</h2>
      <label>Nombre del evento *<input name="nombre" value={form.nombre} onChange={cambiar} required maxLength={150} /></label>
      <label>Descripción *<textarea name="descripcion" value={form.descripcion} onChange={cambiar} required maxLength={500} /></label>
      <div className="fila">
        <label>Fecha *<input type="date" name="fecha" value={form.fecha} onChange={cambiar} required /></label>
        <label>Hora *<input type="time" name="hora" value={form.hora} onChange={cambiar} required /></label>
      </div>
      <label>Lugar *<input name="lugar" value={form.lugar} onChange={cambiar} required maxLength={150} /></label>
      <div className="fila">
        <label>Categoría *
          <select name="categoria" value={form.categoria} onChange={cambiar}>
            {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Cupo máximo *<input type="number" name="cupoMaximo" min={1} max={10000} value={form.cupoMaximo} onChange={cambiar} required /></label>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="fila">
        <button type="button" className="secundario" onClick={() => navigate('/eventos')}>Volver</button>
        <button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  );
}
