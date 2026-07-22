import { apiClient } from './client';

export interface HRUser {
  id: string;
  fullName: string;
  email: string;
  companyName: string;
  profilePhoto?: string | null;
  phone?: string | null;
  designation?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  createdAt: string;
}

export interface SignupPayload {
  fullName: string;
  email: string;
  password: string;
  companyName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  signup: (payload: SignupPayload) => apiClient.post<HRUser>('/auth/signup', payload),
  login: (payload: LoginPayload) =>
    apiClient.post<{ message: string; user: Pick<HRUser, 'id' | 'email' | 'fullName'> }>(
      '/auth/login',
      payload
    ),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get<HRUser>('/auth/me'),
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { token, newPassword }),
};
