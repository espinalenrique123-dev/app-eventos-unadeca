import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function RecuperarContrasena() {
  const { recuperar } = useAuth();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    // Por seguridad se muestra el mismo mensaje exista o no la cuenta.
    try {
      await recuperar(email.trim());
    } catch {
      /* se ignora a propósito */
    }
    setEnviado(true);
  };

  return (
    <div className="tarjeta-login">
      <h1>Recuperar contraseña</h1>
      {enviado ? (
        <p>Si el correo está registrado, recibirá un enlace para restablecer su contraseña.</p>
      ) : (
        <form onSubmit={enviar}>
          <label>
            Correo electrónico
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <button type="submit">Enviar enlace</button>
        </form>
      )}
      <Link to="/login">Volver al inicio de sesión</Link>
    </div>
  );
}
