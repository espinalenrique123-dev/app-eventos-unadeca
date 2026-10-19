import { api } from '../../services/api';
import { useCarga } from '../../components/useCarga';
import { useAuth } from '../../context/AuthContext.jsx';

const ROLES = ['estudiante', 'coordinador', 'administrador'];

export default function GestionUsuarios() {
  const { perfil } = useAuth();
  const { datos: usuarios, error, cargando, recargar, setError } = useCarga(() => api.usuarios());

  const ejecutar = async (fn) => {
    try {
      await fn();
      await recargar();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <h2>Gestión de usuarios</h2>
      {error && <p className="error">{error}</p>}
      {cargando ? <p>Cargando…</p> : (
        <table>
          <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th></tr></thead>
          <tbody>
            {usuarios.map((u) => {
              const yo = u.id === perfil.id;
              return (
                <tr key={u.id}>
                  <td>{u.nombre}{yo && ' (usted)'}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.rol} disabled={yo} onChange={(e) => ejecutar(() => api.cambiarRol(u.id, e.target.value))}>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>
                    <button className={u.activo === false ? 'secundario' : ''} disabled={yo}
                      onClick={() => ejecutar(() => api.cambiarActivo(u.id, u.activo === false))}>
                      {u.activo === false ? 'Inactivo — activar' : 'Activo — desactivar'}
                    </button>
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
