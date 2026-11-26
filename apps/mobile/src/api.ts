import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

/** URL de la API. En el emulador de Android, 10.0.2.2 apunta al computador. */
export const API_URL: string = (Constants.expoConfig?.extra as any)?.apiUrl ?? 'http://localhost:4000/api';

let token: string | null = null;
export const sesion = {
  async cargar() {
    token = await SecureStore.getItemAsync('ph_token');
    return token;
  },
  async guardar(t: string) {
    token = t;
    await SecureStore.setItemAsync('ph_token', t);
  },
  async cerrar() {
    token = null;
    await SecureStore.deleteItemAsync('ph_token');
  },
};

export async function api<T = any>(path: string, body?: unknown, method?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_URL}${path}`, { method: method ?? (body !== undefined ? 'POST' : 'GET'), headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  const texto = await res.text();
  const data = texto ? JSON.parse(texto) : null;
  if (!res.ok) throw new Error(Array.isArray(data?.message) ? data.message.join('. ') : data?.message ?? 'Ocurrió un error');
  return data as T;
}

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
export const pesos = (v: number) => cop.format(v ?? 0);
export const fecha = (d: string) => new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
export const hora = (d: string) => new Date(d).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
