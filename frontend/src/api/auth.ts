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
  sendSignupOtp: (email: string) => apiClient.post<{ message: string; email: string }>('/auth/send-signup-otp', { email }),
  verifySignupOtp: (payload: SignupPayload & { otp: string }) =>
    apiClient.post<{ message: string; user: HRUser }>('/auth/verify-signup-otp', payload),
  login: (payload: LoginPayload) =>
    apiClient.post<{ message: string; user: Pick<HRUser, 'id' | 'email' | 'fullName'> }>(
      '/auth/login',
      payload
    ),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get<HRUser>('/auth/me'),
  forgotPasswordOtp: async (email: string) => {
    try {
      return await apiClient.post<{ message: string; email: string }>('/auth/forgot-password-otp', { email });
    } catch (err: any) {
      if (err.response?.status === 404) {
        return await apiClient.post<{ message: string; email: string }>('/auth/forgot-password', { email });
      }
      throw err;
    }
  },
  verifyResetOtp: async (email: string, otp: string) => {
    try {
      return await apiClient.post<{ message: string; valid: boolean }>('/auth/verify-reset-otp', { email, otp });
    } catch (err: any) {
      if (err.response?.status === 404) {
        return await apiClient.post<{ message: string; valid: boolean }>('/auth/verify-otp', { email, otp });
      }
      throw err;
    }
  },
  resetPasswordOtp: async (payload: { email: string; otp: string; newPassword: string }) => {
    try {
      return await apiClient.post<{ message: string }>('/auth/reset-password-otp', payload);
    } catch (err: any) {
      if (err.response?.status === 404) {
        return await apiClient.post<{ message: string }>('/auth/reset-password', payload);
      }
      throw err;
    }
  },
  setGooglePassword: (payload: { email: string; password: string }) =>
    apiClient.post<{ message: string; user: HRUser }>('/auth/set-google-password', payload),
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { token, newPassword }),
};
