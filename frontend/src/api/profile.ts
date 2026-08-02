import { apiClient } from './client';

export interface CompanyBranding {
  id: string;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  letterheadUrl?: string | null;
  signatureUrl?: string | null;
  sealUrl?: string | null;
}

export interface FullProfile {
  id: string;
  fullName: string;
  email: string;
  companyName: string;
  profilePhoto?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  designation?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companyWebsite?: string | null;
  defaultFont: string;
  defaultBorderColor: string;
  defaultLineSpacing: string;
  defaultLetterSpacing: string;
  branding?: CompanyBranding | null;
  createdAt: string;
}

export interface DashboardMetrics {
  documentsCreated: number;
  recentExports: number;
  activeTemplates: number;
  timeSaved: string;
}

export interface EmailSettings {
  hasGoogleConnected: boolean;
  hasCustomSmtp: boolean;
  isConfigured: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFrom: string;
  isPassSet: boolean;
}

export interface UpdateSmtpPayload {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
}

export const profileApi = {
  get: () => apiClient.get<FullProfile>('/profile'),
  update: (payload: Partial<FullProfile>) => apiClient.put<FullProfile>('/profile', payload),
  updateBranding: (payload: Partial<CompanyBranding>) =>
    apiClient.put<CompanyBranding>('/profile/branding', payload),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiClient.post<{ message: string }>('/auth/change-password', payload),
  getEmailSettings: () => apiClient.get<EmailSettings>('/profile/email-settings'),
  updateEmailSettings: (payload: UpdateSmtpPayload) =>
    apiClient.put<EmailSettings>('/profile/email-settings', payload),
};

export const dashboardApi = {
  metrics: () => apiClient.get<DashboardMetrics>('/dashboard/metrics'),
  recentDocuments: () => apiClient.get('/dashboard/recent-documents'),
};
