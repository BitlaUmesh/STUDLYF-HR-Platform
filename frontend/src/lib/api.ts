export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

function findErrorMessage(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = findErrorMessage(item);
      if (message) return message;
    }
    return undefined;
  }

  if (value && typeof value === "object") {
    const payload = value as Record<string, unknown>;
    return (
      findErrorMessage(payload.message) ||
      findErrorMessage(payload.error) ||
      findErrorMessage(payload.detail)
    );
  }

  return undefined;
}

export function getApiErrorMessage(
  payload: unknown,
  fallback: string
): string {
  if (payload && typeof payload === "object") {
    const errorPayload = payload as Record<string, unknown>;
    return (
      findErrorMessage(errorPayload.error) ||
      findErrorMessage(errorPayload.detail) ||
      findErrorMessage(errorPayload.message) ||
      fallback
    );
  }

  return findErrorMessage(payload) || fallback;
}

// Prevents infinite refresh loops (e.g. refresh token itself is expired)
let isRefreshing = false;

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing) return false;
  isRefreshing = true;
  try {
    const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    isRefreshing = false;
  }
}

export async function fetchAPI(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = `${API_URL.replace(/\/$/, "")}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const doFetch = () =>
    fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

  let response = await doFetch();

  // Auto-refresh: if we get a 401 and it's not the refresh endpoint itself,
  // try refreshing the access token and replay the request once.
  if (
    response.status === 401 &&
    !endpoint.includes("/auth/refresh") &&
    !endpoint.includes("/auth/login")
  ) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      response = await doFetch();
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, `HTTP ${response.status}`));
  }

  return data;
}

export interface SendEmailPayload {
  to_email: string;
  subject: string;
  html_content: string;
}

export async function sendDocumentEmail(documentId: string, payload: SendEmailPayload) {
  return fetchAPI(`/api/documents/${documentId}/send`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
