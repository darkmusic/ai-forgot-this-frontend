let csrfToken: string | null = null;
let csrfHeaderName: string | null = null;

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
  } catch (e) {
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

  // Same-origin; cookies are sent automatically. If you moved to another origin, add: credentials: "include"
  let res = await fetch(input, init);

  // If CSRF was invalid/rotated, refetch token and retry once
  if (res.status === 403 && !isSafeMethod(method)) {
    csrfToken = null;
    csrfHeaderName = null;
    await primeCsrf();
    init.headers = {
      ...(init.headers || {}),
      [csrfHeaderName ?? "X-XSRF-TOKEN"]: csrfToken ?? "",
    };
    res = await fetch(input, init);
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
