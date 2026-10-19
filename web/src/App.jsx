import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/publico/Login.jsx';
import RecuperarContrasena from './pages/publico/RecuperarContrasena.jsx';
import ListaEventos from './pages/coordinador/ListaEventos.jsx';
import FormularioEvento from './pages/coordinador/FormularioEvento.jsx';
import VerInscritos from './pages/coordinador/VerInscritos.jsx';
import RegistrarAsistencia from './pages/coordinador/RegistrarAsistencia.jsx';
import GenerarReporte from './pages/coordinador/GenerarReporte.jsx';
import GestionUsuarios from './pages/administrador/GestionUsuarios.jsx';
import ReportesGlobales from './pages/administrador/ReportesGlobales.jsx';
import Perfil from './pages/Perfil.jsx';

const GESTORES = ['coordinador', 'administrador'];

/** Protege una ruta según el rol del usuario. */
function Protegida({ roles, children }) {
  const { perfil, cargando } = useAuth();
  if (cargando) return <p className="centro">Cargando…</p>;
  if (!perfil) return <Navigate to="/login" replace />;
  if (!GESTORES.includes(perfil.rol)) {
    return (
      <p className="centro">
        La webapp es para coordinadores y administradores. Los estudiantes usan la app Android.
      </p>
    );
  }
  if (roles && !roles.includes(perfil.rol)) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { perfil } = useAuth();
  const inicio = perfil?.rol === 'administrador' ? '/admin/usuarios' : '/eventos';

  return (
    <Routes>
      {/* Acceso público */}
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar" element={<RecuperarContrasena />} />

      {/* Área coordinador */}
      <Route path="/eventos" element={<Protegida><ListaEventos /></Protegida>} />
      <Route path="/eventos/nuevo" element={<Protegida><FormularioEvento /></Protegida>} />
      <Route path="/eventos/:id/editar" element={<Protegida><FormularioEvento /></Protegida>} />
      <Route path="/eventos/:id/inscritos" element={<Protegida><VerInscritos /></Protegida>} />
      <Route path="/eventos/:id/asistencia" element={<Protegida><RegistrarAsistencia /></Protegida>} />
      <Route path="/eventos/:id/reporte" element={<Protegida><GenerarReporte /></Protegida>} />

      {/* Área administrador */}
      <Route path="/admin/usuarios" element={<Protegida roles={['administrador']}><GestionUsuarios /></Protegida>} />
      <Route path="/admin/reportes" element={<Protegida roles={['administrador']}><ReportesGlobales /></Protegida>} />

      <Route path="/perfil" element={<Protegida><Perfil /></Protegida>} />
      <Route path="*" element={<Navigate to={perfil ? inicio : '/login'} replace />} />
    </Routes>
  );
}
