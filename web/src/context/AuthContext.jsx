import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';
import { api } from '../services/api';

const AuthContext = createContext(null);

/** Estado de sesión compartido por toda la app (Firebase Auth + perfil del backend). */
export function AuthProvider({ children }) {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          setPerfil(null);
          setCargando(false);
          return;
        }
        try {
          setPerfil(await api.perfil());
        } catch {
          setPerfil(null);
        } finally {
          setCargando(false);
        }
      }),
    [],
  );

  const value = {
    perfil,
    cargando,
    login: (email, password) => signInWithEmailAndPassword(auth, email, password),
    logout: () => signOut(auth),
    recuperar: (email) => sendPasswordResetEmail(auth, email),
    refrescarPerfil: async () => setPerfil(await api.perfil()),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
