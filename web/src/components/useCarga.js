import { useCallback, useEffect, useState } from 'react';

/** Carga datos asíncronos con estados de carga y error. */
export function useCarga(fn, deps = []) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setDatos(await fn());
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, deps);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { datos, error, cargando, recargar, setError };
}
