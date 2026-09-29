/**
 * The single place the browser talks to the Django API.
 *
 * Three things every call needs and must not have to think about:
 *
 *  - the session cookie, so `credentials: "include"` is always on;
 *  - the CSRF token, read from the cookie the backend sets and echoed back in
 *    a header on any state-changing request;
 *  - one way to turn a failure into an `ApiError` the UI can render.
 *
 * No secret, key or merchant credential belongs in this file or anywhere else
 * in the frontend. Anything prefixed `NEXT_PUBLIC_` is shipped to the browser
 * in the bundle, so only the public API base URL may live here.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "") ??
  "http://localhost:8000";

const CSRF_COOKIE = "csrftoken";
const CSRF_HEADER = "X-CSRFToken";

/** A failed API call, with the backend's own validation messages intact. */
export class ApiError extends Error {
  readonly status: number;
  /** Field name to message, e.g. `{ password: ["too short"] }`. */
  readonly fields: Record<string, string[]>;

  constructor(status: number, message: string, fields: Record<string, string[]> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }

  /** True when the caller simply is not signed in. */
  get isUnauthenticated(): boolean {
    return this.status === 403 || this.status === 401;
  }

  get isValidation(): boolean {
    return this.status === 400;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }

  /** The first message for a field, for single-line form errors. */
  fieldError(name: string): string | undefined {
    return this.fields[name]?.[0];
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(
    new RegExp(`(^|;\\s*)${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Django rotates the CSRF token on login, so a value cached before signing in
 * goes stale. The client therefore reads the cookie from the document on every
 * write rather than keeping one in memory, and `forgetCsrfToken` exists for
 * callers that want to be explicit about a session change.
 */
export function forgetCsrfToken(): void {
  // Nothing is cached: the token always comes from the cookie jar, which the
  // browser owns. This hook stays so sign-in and sign-out have a single
  // obvious place to note the rotation.
}

async function ensureCsrfCookie(): Promise<string | null> {
  const existing = readCookie(CSRF_COOKIE);
  if (existing) return existing;

  await fetch(`${API_BASE_URL}/api/auth/csrf/`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  }).catch(() => undefined);

  return readCookie(CSRF_COOKIE);
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Skip the CSRF cookie round-trip when the caller already knows it is valid. */
  skipCsrf?: boolean;
}

async function parseError(response: Response): Promise<ApiError> {
  let message = `درخواست با خطا مواجه شد (${response.status}).`;
  const fields: Record<string, string[]> = {};

  try {
    const data = await response.json();

    if (typeof data === "string") {
      message = data;
    } else if (data && typeof data === "object") {
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          fields[key] = value.map(String);
        } else if (typeof value === "string") {
          fields[key] = [value];
        }
      }
      if (data.detail) {
        message = String(data.detail);
      } else {
        const first = Object.values(fields)[0]?.[0];
        if (first) message = first;
      }
    }
  } catch {
    // A non-JSON body (a proxy error page, say) keeps the default message.
  }

  return new ApiError(response.status, message, fields);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = { Accept: "application/json" };

  let csrfToken: string | null = null;
  if (!SAFE_METHODS.has(method) && !options.skipCsrf) {
    csrfToken = await ensureCsrfCookie();
    if (csrfToken) headers[CSRF_HEADER] = csrfToken;
  }

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: "include",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(
      0,
      "ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.",
    );
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
};

/** Warms the CSRF cookie up front so the first write does not pay for it. */
export async function primeCsrf(): Promise<void> {
  await ensureCsrfCookie();
}
