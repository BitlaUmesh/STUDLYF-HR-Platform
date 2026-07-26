import { create } from 'zustand';
import { authApi, type HRUser } from '../api/auth';

interface AuthState {
  user: HRUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: { fullName: string; email: string; password: string; companyName: string }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: HRUser | null) => void;
  /** Call this on pages that Google OAuth redirects to (e.g. /dashboard?token=...) */
  pickupTokenFromUrl: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  error: null,

  init: async () => {
    set({ status: 'loading' });
    try {
      const { data } = await authApi.me();
      set({ user: data, status: 'authenticated', error: null });
    } catch {
      set({ user: null, status: 'unauthenticated' });
    }
  },

  /** Reads ?token= from the current URL, stores it, then calls /auth/me */
  pickupTokenFromUrl: async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return false;

    // Store the token so the Axios interceptor attaches it as Bearer header
    localStorage.setItem('auth_token', token);

    // Remove token from URL bar (replace state so back-button doesn't replay it)
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);

    try {
      set({ status: 'loading' });
      const { data } = await authApi.me();
      set({ user: data, status: 'authenticated', error: null });
      return true;
    } catch {
      localStorage.removeItem('auth_token');
      set({ user: null, status: 'unauthenticated' });
      return false;
    }
  },

  login: async (email, password) => {
    set({ status: 'loading', error: null });
    try {
      await authApi.login({ email, password });
      const { data } = await authApi.me();
      set({ user: data, status: 'authenticated' });
    } catch (err: any) {
      set({ status: 'unauthenticated', error: err?.response?.data?.error || 'Login failed' });
      throw err;
    }
  },

  signup: async (payload) => {
    set({ status: 'loading', error: null });
    try {
      await authApi.signup(payload);
      await authApi.login({ email: payload.email, password: payload.password });
      const { data } = await authApi.me();
      set({ user: data, status: 'authenticated' });
    } catch (err: any) {
      set({ status: 'unauthenticated', error: err?.response?.data?.error || 'Signup failed' });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('auth_token');
      set({ user: null, status: 'unauthenticated' });
    }
  },

  setUser: (user) => set({ user }),
}));

// Global listener: if the API client's refresh flow fails, force logout state.
window.addEventListener('auth:logout', () => {
  useAuthStore.setState({ user: null, status: 'unauthenticated' });
});
