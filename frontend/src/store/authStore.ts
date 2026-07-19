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
      set({ user: null, status: 'unauthenticated' });
    }
  },

  setUser: (user) => set({ user }),
}));

// Global listener: if the API client's refresh flow fails, force logout state.
window.addEventListener('auth:logout', () => {
  useAuthStore.setState({ user: null, status: 'unauthenticated' });
});
