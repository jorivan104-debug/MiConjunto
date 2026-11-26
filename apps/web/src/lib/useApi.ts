'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

/** Carga datos de la API con estado de carga, error y recarga. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(!!path);

  const recargar = useCallback(async () => {
    if (!path) return;
    setCargando(true);
    try {
      setData(await api<T>(path));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [path]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { data, error, cargando, recargar, setData };
}
