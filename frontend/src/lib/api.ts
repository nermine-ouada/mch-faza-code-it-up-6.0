const TOKEN_KEY = "sandy_lab_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Base path: empty uses same-origin + Vite proxy `/api` → backend */
export function apiBase(): string {
  return import.meta.env.VITE_API_BASE ?? "";
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const url = `${apiBase()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401) {
    setToken(null);
  }
  return res;
}

function formatErrorBody(status: number, text: string): string {
  if (!text) return `HTTP ${status}`;
  try {
    const j = JSON.parse(text) as { detail?: unknown };
    if (typeof j.detail === "string") return j.detail;
    if (Array.isArray(j.detail)) {
      return j.detail
        .map((d: { msg?: string; loc?: unknown[] }) => d.msg || JSON.stringify(d))
        .join("; ");
    }
  } catch {
    /* ignore */
  }
  return text;
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  const text = await res.text();
  if (!res.ok) {
    throw new ApiError(formatErrorBody(res.status, text), res.status, text);
  }
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
