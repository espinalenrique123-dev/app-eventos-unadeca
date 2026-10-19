import { Link, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useCarga } from '../../components/useCarga';

export default function VerInscritos() {
  const { id } = useParams();
  const { datos, error, cargando } = useCarga(
    async () => ({ evento: await api.evento(id), inscritos: await api.inscritos(id) }),
    [id],
  );

  return (
    <>
      <Link to="/eventos">← Volver</Link>
      <h2>Lista de inscritos {datos && `— ${datos.evento.nombre}`}</h2>
      {error && <p className="error">{error}</p>}
      {cargando ? <p>Cargando…</p> : datos.inscritos.length === 0 ? <p>No hay estudiantes inscritos.</p> : (
        <table>
          <thead><tr><th>#</th><th>Estudiante</th><th>Correo</th><th>Fecha de inscripción</th></tr></thead>
          <tbody>
            {datos.inscritos.map((i, k) => (
              <tr key={i.userId}>
                <td>{k + 1}</td><td>{i.nombre}</td><td>{i.email}</td>
                <td>{new Date(i.fecha).toLocaleString('es-CR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
