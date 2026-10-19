import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useCarga } from '../../components/useCarga';

const ETIQUETA = { PUBLICADO: 'Publicado', CUPO_LLENO: 'Cupo lleno', CANCELADO: 'Cancelado', FINALIZADO: 'Finalizado' };

export default function ListaEventos() {
  const { datos: eventos, error, cargando, recargar, setError } = useCarga(() => api.eventosGestionables());

  const accion = async (fn, confirmar) => {
    if (!window.confirm(confirmar)) return;
    try {
      await fn();
      await recargar();
    } catch (e) {
      setError(e.message);
    }
  };

  const total = eventos?.length ?? 0;
  const activos = eventos?.filter((e) => e.estado === 'PUBLICADO').length ?? 0;
  const llenos = eventos?.filter((e) => e.estado === 'CUPO_LLENO').length ?? 0;

  return (
    <>
      <div className="encabezado">
        <h2>Panel de eventos</h2>
        <Link className="boton" to="/eventos/nuevo">+ Crear nuevo evento</Link>
      </div>
      <div className="stats">
        <div><b>{total}</b>Total</div>
        <div><b>{activos}</b>Activos</div>
        <div><b>{llenos}</b>Llenos</div>
      </div>
      {error && <p className="error">{error}</p>}
      {cargando ? <p>Cargando…</p> : total === 0 ? <p>Todavía no hay eventos.</p> : (
        <table>
          <thead>
            <tr><th>Evento</th><th>Fecha</th><th>Cupos</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {eventos.map((e) => {
              const abierto = e.estado === 'PUBLICADO' || e.estado === 'CUPO_LLENO';
              return (
                <tr key={e.id}>
                  <td>{e.nombre}<br /><small>{e.lugar}</small></td>
                  <td>{e.fecha} {e.hora}</td>
                  <td>{e.cuposOcupados}/{e.cupoMaximo}</td>
                  <td><span className={`estado ${e.estado}`}>{ETIQUETA[e.estado]}</span></td>
                  <td className="acciones">
                    {abierto && <Link to={`/eventos/${e.id}/editar`}>Editar</Link>}
                    <Link to={`/eventos/${e.id}/inscritos`}>Inscritos</Link>
                    <Link to={`/eventos/${e.id}/asistencia`}>Asistencia</Link>
                    <Link to={`/eventos/${e.id}/reporte`}>Reporte</Link>
                    {abierto && (
                      <button className="enlace" onClick={() => accion(() => api.finalizarEvento(e.id), `¿Marcar "${e.nombre}" como finalizado?`)}>Finalizar</button>
                    )}
                    {abierto && (
                      <button className="enlace peligro" onClick={() => accion(() => api.cancelarEvento(e.id), `¿Cancelar "${e.nombre}"? Se avisará a los inscritos.`)}>Cancelar</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
