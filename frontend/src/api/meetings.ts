import { apiClient } from './client';

export interface Meeting {
  id: string;
  hrId: string;
  applicationId?: string | null;
  title: string;
  description?: string | null;
  scheduledAt?: string | null;
  calendlyEventUrl?: string | null;
  status: 'scheduled' | 'rescheduled' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  application?: {
    student: { id: string; name: string; email: string; avatarUrl?: string | null };
  } | null;
}

export interface CreateMeetingPayload {
  applicationId: string;
  title: string;
  duration?: number;
  startTime?: string;
  description?: string;
}

export const meetingsApi = {
  list: () => apiClient.get<Meeting[]>('/meetings'),
  create: (payload: CreateMeetingPayload) => apiClient.post<Meeting>('/meetings', payload),
  reschedule: (id: string, startTime: string) => apiClient.patch<Meeting>(`/meetings/${id}/reschedule`, { startTime }),
  cancel: (id: string) => apiClient.delete(`/meetings/${id}`),
};
