import { useState } from 'react';
import { api } from '../../services/api';

const ROLES = ['estudiante', 'coordinador', 'administrador'];
const VACIO = { nombre: '', email: '', rol: 'coordinador' };

/**
 * RF-16: el administrador crea una cuenta institucional con su rol.
 * La cuenta se crea sin contraseña; se muestra una sola vez el enlace
 * para que la persona defina la suya.
 */
export default function CrearCuenta({ alCrear }) {
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [creada, setCreada] = useState(null);

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setCreada(null);
    if (!/^[^\s@]+@unadeca\.net$/i.test(form.email.trim())) {
      setError('El correo debe ser institucional (@unadeca.net)');
      return;
    }
    setEnviando(true);
    try {
      const r = await api.crearCuenta(form);
      setCreada(r);
      setForm(VACIO);
      await alCrear?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="tarjeta">
      <h3>Crear cuenta</h3>
      <form onSubmit={enviar}>
        <label>Nombre completo
          <input value={form.nombre} onChange={cambiar('nombre')} maxLength={100} required />
        </label>
        <label>Correo institucional
          <input type="email" value={form.email} onChange={cambiar('email')} placeholder="nombre@unadeca.net" required />
        </label>
        <label>Rol
          <select value={form.rol} onChange={cambiar('rol')}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <button type="submit" disabled={enviando}>{enviando ? 'Creando…' : 'Crear cuenta'}</button>
      </form>
      {error && <p className="error">{error}</p>}
      {creada && (
        <div className="aviso">
          <p>Cuenta creada para <b>{creada.usuario.email}</b> con rol <b>{creada.usuario.rol}</b>.</p>
          <p>Envíele este enlace por el correo institucional para que defina su contraseña.
            Se muestra una sola vez y no debe compartirse con nadie más:</p>
          <input readOnly value={creada.enlaceContrasena} onFocus={(e) => e.target.select()} />
          <button type="button" className="secundario"
            onClick={() => navigator.clipboard.writeText(creada.enlaceContrasena)}>Copiar enlace</button>
        </div>
      )}
    </section>
  );
}
