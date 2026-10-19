import { Link, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useCarga } from '../../components/useCarga';

export default function RegistrarAsistencia() {
  const { id } = useParams();
  const { datos, error, cargando, recargar, setError } = useCarga(async () => {
    const [evento, inscritos, asistencia] = await Promise.all([api.evento(id), api.inscritos(id), api.asistencia(id)]);
    const marcas = Object.fromEntries(asistencia.map((a) => [a.userId, a.asistio]));
    return { evento, inscritos, marcas };
  }, [id]);

  const marcar = async (userId, asistio) => {
    try {
      await api.registrarAsistencia(id, userId, asistio);
      await recargar();
    } catch (e) {
      setError(e.message);
    }
  };

  const presentes = datos ? Object.values(datos.marcas).filter(Boolean).length : 0;

  return (
    <>
      <Link to="/eventos">← Volver</Link>
      <h2>Registro de asistencia {datos && `— ${datos.evento.nombre}`}</h2>
      {datos && <p>Presentes: {presentes} de {datos.inscritos.length}</p>}
      {error && <p className="error">{error}</p>}
      {cargando ? <p>Cargando…</p> : (
        <table>
          <thead><tr><th>Estudiante</th><th>Asistencia</th></tr></thead>
          <tbody>
            {datos.inscritos.map((i) => {
              const m = datos.marcas[i.userId];
              return (
                <tr key={i.userId}>
                  <td>{i.nombre}<br /><small>{i.email}</small></td>
                  <td className="acciones">
                    <button className={m === true ? '' : 'secundario'} onClick={() => marcar(i.userId, true)}>Presente</button>
                    <button className={m === false ? 'peligro' : 'secundario'} onClick={() => marcar(i.userId, false)}>Ausente</button>
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
