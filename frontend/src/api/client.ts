import axios from 'axios';

const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Hostinger backend default URL
const DEFAULT_PROD_API_URL = 'https://olivedrab-chimpanzee-507172.hostingersite.com/api';

function resolveApiBaseUrl(): string {
  if (isLocalhost) {
    return 'http://localhost:3001/api';
  }

  const envUrl = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_URL ||
    DEFAULT_PROD_API_URL
  ).trim();

  // If envUrl is relative (e.g. '/api'), return as-is
  if (envUrl.startsWith('/')) {
    return envUrl;
  }

  // Ensure full http/https URLs end with /api
  const cleaned = envUrl.replace(/\/+$/, '');
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
}

export const API_BASE_URL = resolveApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send httpOnly cookies (access_token / refresh_token)
  headers: { 'Content-Type': 'application/json' },
});

// Attach Authorization Bearer header if available in localStorage
apiClient.interceptors.request.use((config) => {
  if (isBrowser) {
    const token = localStorage.getItem('auth_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

function flushQueue() {
  pendingQueue.forEach((cb) => cb());
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (response) => {
    // Save token if returned by auth endpoints
    if (isBrowser && response.data?.token && typeof response.data.token === 'string') {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response;
  },
  async (error) => {
    const original = error.config;

    // Don't try to refresh on the auth endpoints themselves
    const isAuthRoute =
      original?.url?.includes('/auth/login') ||
      original?.url?.includes('/auth/signup') ||
      original?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true;

      if (isRefreshing) {
        // wait for the in-flight refresh to finish, then retry
        return new Promise((resolve) => {
          pendingQueue.push(() => resolve(apiClient(original)));
        });
      }

      isRefreshing = true;
      try {
        const { data } = await apiClient.post('/auth/refresh');
        if (isBrowser && data?.token) {
          localStorage.setItem('auth_token', data.token);
        }
        isRefreshing = false;
        flushQueue();
        return apiClient(original);
      } catch {
        isRefreshing = false;
        flushQueue();
        if (isBrowser) {
          localStorage.removeItem('auth_token');
        }
        // Refresh failed silently — dispatch logout
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(new Error('Session expired. Please sign in again.'));
      }
    }

    return Promise.reject(error);
  }
);

/** Extracts a readable message from a backend error response (zod issues or plain error string) */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  let message = fallback;

  if (axios.isAxiosError(err)) {
    const data = err.response?.data as any;
    if (data) {
      if (typeof data.error === 'string') {
        message = data.error;
      } else if (Array.isArray(data.error)) {
        message = data.error.map((i: any) => i.message).join(', ');
      }
    } else if (err.message) {
      message = err.message;
    }
  } else if (err instanceof Error) {
    message = err.message;
  }

  // Filter out raw Prisma / internal database technical stack traces
  if (
    message.includes('prisma') ||
    message.includes('PrismaClient') ||
    message.includes('invocation') ||
    message.includes('gitHubStats') ||
    message.includes('hackathonProjects') ||
    message.includes('Unknown field') ||
    message.startsWith('Invalid `')
  ) {
    return 'Unable to process request at this time. Please try again.';
  }

  return message;
}
