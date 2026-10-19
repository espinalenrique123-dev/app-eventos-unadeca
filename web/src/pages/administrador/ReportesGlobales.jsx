import { api } from '../../services/api';
import { useCarga } from '../../components/useCarga';

const ETIQUETA = { PUBLICADO: 'Publicados', CUPO_LLENO: 'Cupo lleno', CANCELADO: 'Cancelados', FINALIZADO: 'Finalizados' };

export default function ReportesGlobales() {
  const { datos: r, error, cargando } = useCarga(() => api.reporteGlobal());

  return (
    <>
      <h2>Reportes globales</h2>
      {error && <p className="error">{error}</p>}
      {cargando ? <p>Cargando…</p> : (
        <>
          <div className="stats">
            <div><b>{r.totalEventos}</b>Eventos</div>
            <div><b>{r.cuposOcupados}/{r.cuposTotales}</b>Cupos ocupados</div>
            <div><b>{r.porcentajeOcupacion}%</b>Ocupación</div>
          </div>
          <table>
            <thead><tr><th>Estado</th><th>Cantidad</th></tr></thead>
            <tbody>
              {Object.entries(r.porEstado).map(([estado, n]) => (
                <tr key={estado}><td>{ETIQUETA[estado] || estado}</td><td>{n}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
