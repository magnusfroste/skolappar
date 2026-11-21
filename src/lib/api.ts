// Thin fetch wrapper for the site's own server (/api/…).

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown> | null;
  constructor(status: number, message: string, data: Record<string, unknown> | null = null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

interface RequestOptions {
  method?: string;
  body?: Json | Blob;
  headers?: Record<string, string>;
  admin?: boolean;
}

export async function apiFetch<T = unknown>(path: string, { method = 'GET', body, headers = {}, admin = false }: RequestOptions = {}): Promise<T> {
  const h: Record<string, string> = { Accept: 'application/json', ...headers };
  let payload: BodyInit | undefined;
  if (body instanceof Blob) {
    payload = body;
    h['Content-Type'] = body.type || 'application/octet-stream';
  } else if (body !== undefined) {
    payload = JSON.stringify(body);
    h['Content-Type'] = 'application/json';
  }
  if (admin) {
    const key = getAdminKey();
    if (key) h.Authorization = `Bearer ${key}`;
  }
  const res = await fetch(path, { method, headers: h, body: payload });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    const obj = (data && typeof data === 'object' ? data : null) as Record<string, unknown> | null;
    throw new ApiError(res.status, String(obj?.error ?? res.statusText ?? 'Request failed'), obj);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, headers?: Record<string, string>) => apiFetch<T>(path, { headers }),
  post: <T>(path: string, body?: Json, headers?: Record<string, string>) => apiFetch<T>(path, { method: 'POST', body, headers }),
};

export const adminApi = {
  get: <T>(path: string) => apiFetch<T>(path, { admin: true }),
  post: <T>(path: string, body?: Json | Blob) => apiFetch<T>(path, { method: 'POST', body, admin: true }),
  patch: <T>(path: string, body: Json) => apiFetch<T>(path, { method: 'PATCH', body, admin: true }),
  put: <T>(path: string, body: Json) => apiFetch<T>(path, { method: 'PUT', body, admin: true }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE', admin: true }),
};

// ---------- admin key (kept for this browser tab only) ----------

const ADMIN_KEY_STORAGE = 'skolappar_admin_key';

export function getAdminKey(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_KEY_STORAGE);
  } catch {
    return null;
  }
}

export function setAdminKey(key: string | null) {
  try {
    if (key) sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
    else sessionStorage.removeItem(ADMIN_KEY_STORAGE);
  } catch {
    /* storage unavailable – the key just is not remembered */
  }
}

// ---------- anonymous voter id ----------

const VOTER_STORAGE = 'skolappar_voter_id';
let memoryVoterId: string | null = null;

function randomId() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** A random id for this browser, used to remember (and toggle) its votes. */
export function getVoterId(): string {
  try {
    let id = localStorage.getItem(VOTER_STORAGE);
    if (!id || !/^[A-Za-z0-9_-]{16,128}$/.test(id)) {
      id = randomId();
      localStorage.setItem(VOTER_STORAGE, id);
    }
    return id;
  } catch {
    memoryVoterId = memoryVoterId || randomId();
    return memoryVoterId;
  }
}

export const voterHeaders = () => ({ 'X-Voter-Id': getVoterId() });
