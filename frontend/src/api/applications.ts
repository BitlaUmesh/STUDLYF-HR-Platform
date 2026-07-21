import { apiClient } from './client';
import type { GitHubStats, HackathonProject } from './students';

export type ApplicationStatus = 'invited' | 'reviewing' | 'questions_sent' | 'offered' | 'rejected';

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'invited',
  'reviewing',
  'questions_sent',
  'offered',
  'rejected',
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  invited: 'Invited',
  reviewing: 'Reviewing',
  questions_sent: 'Questions Sent',
  offered: 'Offered',
  rejected: 'Rejected',
};

export interface ApplicationStudent {
  id: string;
  name: string;
  email: string;
  bio?: string | null;
  skills: string[];
  avatarUrl?: string | null;
  githubUsername?: string | null;
  githubStats?: GitHubStats | null;
}

export interface MeetingSummary {
  id: string;
  status: string;
  scheduledAt?: string | null;
  calendlyEventUrl?: string | null;
}

export interface Application {
  id: string;
  hrId: string;
  studentId: string;
  status: ApplicationStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  student: ApplicationStudent;
  meeting?: MeetingSummary | null;
}

export interface ScreeningResponseDetail {
  id: string;
  answer?: string | null;
  submittedAt: string;
  question: { id: string; question: string };
}

export interface ApplicationDetail extends Omit<Application, 'student'> {
  student: ApplicationStudent & { projects: HackathonProject[] };
  responses: ScreeningResponseDetail[];
  meeting?: (MeetingSummary & { title?: string }) | null;
}

export const applicationsApi = {
  invite: (studentId: string) => apiClient.post<Application>(`/applications/invite/${studentId}`),
  list: (status?: ApplicationStatus) =>
    apiClient.get<Application[]>('/applications', { params: status ? { status } : {} }),
  getById: (id: string) => apiClient.get<ApplicationDetail>(`/applications/${id}`),
  updateStatus: (id: string, status: ApplicationStatus, notes?: string) =>
    apiClient.patch<Application>(`/applications/${id}/status`, { status, notes }),
  suggested: (id: string) =>
    apiClient.get<{ suggested: any[] }>(`/applications/${id}/suggested`),
};
