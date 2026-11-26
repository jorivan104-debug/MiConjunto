export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

const TOKEN = 'ph_token';
export const tokenStore = {
  get: () => (typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN)),
  set: (t: string) => window.localStorage.setItem(TOKEN, t),
  clear: () => window.localStorage.removeItem(TOKEN),
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const t = tokenStore.get();
  if (t) headers.Authorization = `Bearer ${t}`;
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }
  const res = await fetch(`${API_URL}${path}`, { method: opts.method ?? (body ? 'POST' : 'GET'), headers, body });
  if (res.status === 401 && typeof window !== 'undefined' && !path.startsWith('/auth/login')) {
    tokenStore.clear();
    window.location.href = '/login';
  }
  const texto = await res.text();
  const data = texto ? JSON.parse(texto) : null;
  if (!res.ok) {
    const msg = Array.isArray(data?.message) ? data.message.join('. ') : data?.message ?? 'Ocurrió un error';
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

/** Descarga un archivo protegido y lo abre en una pestaña nueva. */
export async function abrirArchivo(path: string) {
  const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${tokenStore.get()}` } });
  if (!res.ok) throw new ApiError(res.status, 'No se pudo abrir el archivo');
  const url = URL.createObjectURL(await res.blob());
  window.open(url, '_blank');
}
