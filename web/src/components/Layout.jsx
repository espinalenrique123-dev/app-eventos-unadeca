import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout({ children }) {
  const { perfil, logout } = useAuth();
  const navigate = useNavigate();
  const esAdmin = perfil?.rol === 'administrador';

  const salir = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="barra">
        <strong>Eventos UNADECA</strong>
        <nav>
          <NavLink to="/eventos">Eventos</NavLink>
          {esAdmin && <NavLink to="/admin/usuarios">Usuarios</NavLink>}
          {esAdmin && <NavLink to="/admin/reportes">Reportes globales</NavLink>}
          <NavLink to="/perfil">Perfil</NavLink>
        </nav>
        <span className="usuario">
          {perfil?.nombre} · {perfil?.rol}
          <button className="secundario" onClick={salir}>Salir</button>
        </span>
      </header>
      <main className="contenido">{children}</main>
    </div>
  );
}
