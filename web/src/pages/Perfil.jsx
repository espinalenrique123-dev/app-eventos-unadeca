import { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';

export default function Perfil() {
  const { perfil, refrescarPerfil } = useAuth();
  const [nombre, setNombre] = useState(perfil.nombre);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const guardar = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');
    try {
      await api.actualizarPerfil(nombre);
      await refrescarPerfil();
      setMensaje('Perfil actualizado.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="formulario" onSubmit={guardar}>
      <h2>Perfil</h2>
      <label>Nombre<input value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={100} /></label>
      <label>Correo<input value={perfil.email} disabled /></label>
      <label>Rol<input value={perfil.rol} disabled /></label>
      {mensaje && <p className="ok">{mensaje}</p>}
      {error && <p className="error">{error}</p>}
      <button type="submit">Guardar cambios</button>
    </form>
  );
}
