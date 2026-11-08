import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, resetPassword } from '../api';
import PhoneStatusBar from '../components/PhoneStatusBar';

const EMPTY_USER = {
  name: '',
  email: '',
  password: ''
};

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_USER);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setNotice('');
  };

  const handlePasswordReset = async () => {
    const email = form.email.trim().toLowerCase();
    setError('');
    setNotice('');

    if (!email) {
      setError('Escribe tu correo electrónico primero.');
      return;
    }

    try {
      await resetPassword(email);
      setNotice(
        'Si ese correo está registrado, recibirás un enlace para restablecer la contraseña. Revisa también correo no deseado.'
      );
    } catch (requestError) {
      setError(requestError.message || 'No se pudo enviar el correo de recuperación');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const email = form.email.trim().toLowerCase();
    const password = form.password;
    setIsSubmitting(true);
    setError('');

    try {
      if (isRegistering) {
        const response = await registerUser(form.name.trim(), email, password);
        onLogin({
          uid: response.user.uid,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
          token: response.token
        });
        navigate('/dashboard');
        return;
      }

      const response = await loginUser(email, password);
      onLogin({
        uid: response.user.uid,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
        contactEmail: response.user.contactEmail,
        phone: response.user.phone,
        token: response.token
      });
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.message || 'No se pudo completar el inicio de sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-shell">
      <div className="login-card">
        <PhoneStatusBar />

        <div className="login-header">
          <div className="icon-circle">+</div>
          <h2>UNADECA</h2>
          <p>App de Eventos y Actividades</p>
        </div>

        <div className="login-body">
          <h3>{isRegistering ? 'Crear cuenta' : 'Bienvenido'}</h3>

          <form onSubmit={handleSubmit} className="form-box">
            {isRegistering && (
              <label>
                Nombre completo
                <input
                  type="text"
                  name="name"
                  value={form.name || ''}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  required
                />
              </label>
            )}

            <label>
              Correo electrónico
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="nombre@unadeca.edu.co"
                required
              />
            </label>

            <label>
              Contraseña
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                minLength="6"
                required
              />
            </label>

            {!isRegistering && (
              <button type="button" className="forgot-password-btn" onClick={handlePasswordReset}>
                Olvidé mi contraseña
              </button>
            )}

            {error && <p className="error-message">{error}</p>}
            {notice && <p className="success-message" role="status">{notice}</p>}

            <button type="submit" className="primary-btn login-btn" disabled={isSubmitting}>
              {isSubmitting
                ? (isRegistering ? 'Creando cuenta...' : 'Ingresando...')
                : (isRegistering ? 'Crear cuenta' : 'Iniciar sesión')}
            </button>
          </form>

          <button
            type="button"
            className="register-toggle"
            onClick={() => {
              setIsRegistering((current) => !current);
              setError('');
              setNotice('');
            }}
          >
            {isRegistering ? 'Ya tengo una cuenta' : 'Crear una cuenta'}
          </button>
          <p className="access-note">Solo acceso para personal y estudiantes UNADECA</p>
        </div>

        <footer className="login-footer">UNADECA 2026 - Sistema de Eventos</footer>
      </div>
    </main>
  );
}
