import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useCarga } from '../../components/useCarga';

export default function GenerarReporte() {
  const { id } = useParams();
  const { datos: r, error, cargando } = useCarga(() => api.reporte(id), [id]);
  const [errorCsv, setErrorCsv] = useState('');

  const descargarCsv = async () => {
    setErrorCsv('');
    try {
      await api.descargarReporteCsv(id);
    } catch (e) {
      setErrorCsv(e.message);
    }
  };

  return (
    <>
      <Link to="/eventos">← Volver</Link>
      <h2>Reporte del evento {r && `— ${r.nombre}`}</h2>
      {error && <p className="error">{error}</p>}
      {cargando ? <p>Cargando…</p> : (
        <>
          <div className="stats">
            <div><b>{r.inscritosActivos}/{r.cupoMaximo}</b>Inscritos</div>
            <div><b>{r.presentes}</b>Presentes</div>
            <div><b>{r.ausentes}</b>Ausentes</div>
            <div><b>{r.porcentajeAsistencia}%</b>Asistencia</div>
          </div>
          <p>Inscripciones canceladas: {r.inscripcionesCanceladas} · Estado: {r.estado}</p>
          <button onClick={() => window.print()}>Imprimir / guardar PDF</button>{' '}
          <button className="secundario" onClick={descargarCsv}>Descargar CSV (Excel)</button>
          {errorCsv && <p className="error">{errorCsv}</p>}
        </>
      )}
    </>
  );
}
