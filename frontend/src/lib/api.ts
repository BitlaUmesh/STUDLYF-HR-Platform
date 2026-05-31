export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

export async function fetchAPI(
  endpoint: string,
  options: RequestInit = {}
) {
  const url =
    `${API_URL.replace(/\/$/, "")}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (
    !(options.body instanceof FormData) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] =
      "application/json";
  }

  const config: RequestInit = {
    ...options,
    headers,
    // REMOVE credentials include
  };

  const response = await fetch(
    url,
    config
  );

  const data =
    await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail ||
      `HTTP ${response.status}`
    );
  }

  return data;
}