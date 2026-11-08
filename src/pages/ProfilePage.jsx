import { useState } from 'react';
import { Link } from 'react-router-dom';
import PhoneStatusBar from '../components/PhoneStatusBar';

const ROLE_LABELS = {
  admin: 'Administrador',
  administrador: 'Administrador',
  coordinador: 'Coordinador',
  manager: 'Coordinador',
  estudiante: 'Estudiante',
  student: 'Estudiante'
};

export default function ProfilePage({ user, onUpdateProfile }) {
  const [formName, setFormName] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const role = ROLE_LABELS[user?.role] || user?.role || 'No asignado';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSaving(true);

    try {
      await onUpdateProfile({
        name: formName,
        contactEmail: formContactEmail,
        phone: formPhone
      });
      setNotice('Tu información de contacto se actualizó correctamente.');
    } catch (saveError) {
      setError(saveError.message || 'No se pudo actualizar tu perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="profile-shell">
      <section className="profile-panel">
        <PhoneStatusBar />
        <header className="profile-header">
          <Link to="/dashboard" className="profile-back-link" aria-label="Volver a eventos">
            &lt;
          </Link>
          <h1>Mi perfil</h1>
        </header>

        <div className="profile-content">
          <div className="profile-avatar" aria-hidden="true">E</div>
          <h2 className="profile-name">Perfil de estudiante</h2>
          <p className="profile-subtitle">Completa tus datos de contacto</p>

          <div className="profile-edit-form">
            <dl className="profile-details">
              <div className="profile-detail-row">
                <dt>Nombre completo</dt>
                <dd>
                  <input
                    className="profile-edit-input"
                    type="text"
                    value={formName}
                    placeholder="Escribe tu nombre completo"
                    onChange={(event) => {
                      setFormName(event.target.value);
                      setError('');
                      setNotice('');
                    }}
                    maxLength={80}
                    autoComplete="name"
                    aria-label="Nombre completo"
                    required
                  />
                </dd>
              </div>
              <div className="profile-detail-row">
                <dt>Correo de contacto</dt>
                <dd>
                  <input
                    className="profile-edit-input"
                    type="email"
                    value={formContactEmail}
                    placeholder="correo@ejemplo.com"
                    onChange={(event) => {
                      setFormContactEmail(event.target.value);
                      setError('');
                      setNotice('');
                    }}
                    maxLength={254}
                    autoComplete="email"
                    aria-label="Correo de contacto"
                    required
                  />
                </dd>
              </div>
              <div className="profile-detail-row">
                <dt>Teléfono</dt>
                <dd>
                  <input
                    className="profile-edit-input"
                    type="tel"
                    value={formPhone}
                    placeholder="+506 0000-0000"
                    onChange={(event) => {
                      setFormPhone(event.target.value);
                      setError('');
                      setNotice('');
                    }}
                    maxLength={25}
                    autoComplete="tel"
                    aria-label="Teléfono"
                    required
                  />
                </dd>
              </div>
              <div className="profile-detail-row">
                <dt>Rol</dt>
                <dd>
                  {role}
                  <small className="profile-readonly-note">El rol lo administra la universidad.</small>
                </dd>
              </div>
            </dl>
            <button type="button" className="profile-save-btn" disabled={isSaving} onClick={handleSubmit}>
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>

          {error && <p className="profile-message error-message" role="alert">{error}</p>}
          {notice && <p className="profile-message success-message" role="status">{notice}</p>}

          <Link to="/dashboard" className="profile-return-btn">
            Volver a eventos
          </Link>
        </div>
      </section>
    </main>
  );
}
