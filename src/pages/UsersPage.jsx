import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createManagedUser,
  fetchManagedUsers,
  sendManagedUserPasswordReset
} from '../api';
import PhoneStatusBar from '../components/PhoneStatusBar';

const EMPTY_FORM = {
  name: '',
  email: '',
  role: 'estudiante'
};

const ROLE_LABELS = {
  estudiante: 'Estudiante',
  coordinador: 'Coordinador',
  administrador: 'Administrador',
  admin: 'Administrador',
  manager: 'Coordinador',
  student: 'Estudiante'
};

export default function UsersPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [warning, setWarning] = useState('');

  const refreshUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      setUsers(await fetchManagedUsers());
    } catch (loadError) {
      if (loadError?.code === 'functions/permission-denied') {
        navigate('/dashboard', { replace: true });
        return;
      }
      if (loadError?.code === 'functions/unauthenticated') {
        navigate('/login', { replace: true });
        return;
      }
      setError(loadError.message || 'No se pudieron cargar los usuarios.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
    setNotice('');
    setWarning('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setWarning('');
    setIsSubmitting(true);

    try {
      const createdUser = await createManagedUser(form);
      setForm(EMPTY_FORM);
      setNotice(
        `Cuenta creada para ${createdUser.email} con el rol ${ROLE_LABELS[createdUser.role] || createdUser.role}.`
      );

      try {
        await sendManagedUserPasswordReset(createdUser.email);
        setNotice((current) => `${current} Se envió un correo para definir su contraseña.`);
      } catch (resetError) {
        setWarning(
          `La cuenta ya se creó, pero no se pudo enviar el correo de contraseña: ${resetError.message}`
        );
      }

      try {
        setUsers(await fetchManagedUsers());
      } catch (loadError) {
        setWarning((current) => (
          current
            ? `${current} Además, no se pudo actualizar la lista: ${loadError.message}`
            : `Cuenta creada, pero no se pudo actualizar la lista: ${loadError.message}`
        ));
      }
    } catch (createError) {
      setError(createError.message || 'No se pudo crear la cuenta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="users-shell">
      <section className="users-panel">
        <header className="manager-header-bar">
          <PhoneStatusBar variant="detail" />
          <div className="manager-topbar">
            <Link to="/dashboard" className="manager-back-link" aria-label="Volver al dashboard">&lt;</Link>
            <div className="manager-icon" aria-hidden="true">♙</div>
            <div className="manager-title-wrap">
              <h1>Gestión de usuarios</h1>
              <p>Administración</p>
            </div>
          </div>
        </header>

        <section className="users-content">
          <form className="users-form" onSubmit={handleSubmit}>
            <h2>Crear cuenta</h2>
            <label className="field-group">
              <span>Nombre completo</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </label>

            <label className="field-group">
              <span>Correo institucional</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="nombre@unadeca.net"
                pattern="^[^@\s]+@unadeca\.net$"
                title="Usa un correo que termine en @unadeca.net."
                autoComplete="email"
                required
              />
            </label>

            <label className="field-group">
              <span>Rol</span>
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="estudiante">Estudiante</option>
                <option value="administrador">Administrador</option>
              </select>
            </label>

            <p className="users-form-note">
              Se enviará un correo para que la persona defina su contraseña.
            </p>
            {error && <p className="error-message" role="alert">{error}</p>}
            {notice && <p className="success-message" role="status">{notice}</p>}
            {warning && <p className="error-message" role="alert">{warning}</p>}

            <button type="submit" className="primary-btn users-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <section className="users-list-section">
            <div className="users-list-heading">
              <h2>Usuarios existentes</h2>
              <button type="button" className="manager-link" onClick={refreshUsers} disabled={isLoading}>
                {isLoading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>

            {isLoading && <p className="users-empty">Cargando usuarios...</p>}
            {!isLoading && users.length === 0 && !error && (
              <p className="users-empty">No hay usuarios para mostrar.</p>
            )}

            {!isLoading && users.length > 0 && (
              <div className="users-table-wrap">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Rol</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.uid}>
                        <td>{user.name || '—'}</td>
                        <td>{user.email || '—'}</td>
                        <td>{ROLE_LABELS[user.role] || user.role}</td>
                        <td>
                          <span className={`users-status ${user.active ? 'active' : 'inactive'}`}>
                            {user.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}
