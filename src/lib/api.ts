let csrfToken: string | null = null;
let csrfHeaderName: string | null = null;
const BASE_URL: string | undefined = import.meta.env?.VITE_TOMCAT_SERVER_URL;

function resolveUrl(input: string): string {
  // If an absolute URL is provided, use it. Otherwise, prefix with BASE_URL when set.
  try {
    // new URL throws if relative and no base provided
    const parsed = new URL(input);
    return parsed.toString();
  } catch {
    if (BASE_URL && input.startsWith('/')) return BASE_URL.replace(/\/$/, '') + input;
    return input;
  }
}

const isSafeMethod = (m?: string) => {
  const method = (m ?? "GET").toUpperCase();
  return method === "GET" || method === "HEAD" || method === "OPTIONS" || method === "TRACE";
};

/** Call once on app start (or lazily before first unsafe call). */
export async function primeCsrf(): Promise<void> {
  // If already cached, skip
  if (csrfToken && csrfHeaderName) return;

  try {
    const res = await fetch("/api/csrf", { method: "GET", credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch CSRF token");
    const data = await res.json();
    csrfToken = data.token;
    csrfHeaderName = data.headerName;
  } catch {
    // fall back to cookie (for legacy compatibility, if needed)
    csrfToken = null;
    csrfHeaderName = "X-XSRF-TOKEN";
  }
}

/** Wrap fetch to add CSRF token for unsafe methods. Retries once on 403 (token rotation). */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();

  if (!isSafeMethod(method)) {
    if (!csrfToken || !csrfHeaderName) {
      await primeCsrf();
    }
    init.headers = {
      ...(init.headers || {}),
      [csrfHeaderName ?? "X-XSRF-TOKEN"]: csrfToken ?? "",
    };
  }

  // Always include credentials so session cookies flow in both same-origin and cross-origin dev.
  if (!init.credentials) init.credentials = 'include';

  const url = resolveUrl(input);
  let res = await fetch(url, init);

  // If CSRF was invalid/rotated, refetch token and retry once
  if (res.status === 403 && !isSafeMethod(method)) {
    csrfToken = null;
    csrfHeaderName = null;
    await primeCsrf();
    init.headers = {
      ...(init.headers || {}),
      [csrfHeaderName ?? "X-XSRF-TOKEN"]: csrfToken ?? "",
    };
    const retryUrl = resolveUrl(input);
    res = await fetch(retryUrl, init);
  }
  return res;
}

/** Perform login once; subsequent calls reuse the session. */
export async function login(username: string, password: string): Promise<boolean> {
  await primeCsrf(); // ensure token exists for the login POST

  const body = new URLSearchParams({ username, password }).toString();
  const res = await apiFetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  // Spring's default formLogin issues a 302 to "/". If you kept that default, treat 200/302 as success.
  // If you customized successHandler to return 200, res.ok will be true.
  const ok = res.ok || res.status === 302;
  // After login, Spring may rotate the CSRF token; refresh cache.
  csrfToken = null;
  csrfHeaderName = null;
  await primeCsrf();
  return ok;
}

export async function logout(): Promise<void> {
  await primeCsrf();
  await apiFetch("/api/logout", {
    method: "POST" ,
    credentials: 'include'
  });

  csrfToken = null;
  csrfHeaderName = null;
}

/** Convenience JSON helpers */
export async function getJson<T>(url: string): Promise<T> {
  const r = await apiFetch(url);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

export async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const r = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

export async function putJson<T>(url: string, payload: unknown): Promise<T> {
  const r = await apiFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

export async function deleteOk(url: string): Promise<boolean> {
  const r = await apiFetch(url, { method: 'DELETE' });
  return r.ok;
}
