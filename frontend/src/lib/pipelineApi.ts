// API client for the HR hiring pipeline: applications, screening questions,
// meeting scheduling, and messaging. Same Node/Prisma backend as studentsApi.ts.

import { fetchStudentsAPI } from "./studentsApi";

export type ApplicationStatus =
  | "invited"
  | "reviewing"
  | "questions_sent"
  | "offered"
  | "rejected";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "invited",
  "reviewing",
  "questions_sent",
  "offered",
  "rejected",
];

export interface ApplicationStudentSummary {
  id: string;
  name: string;
  email: string;
  skills: string[];
  avatarUrl: string | null;
  githubUsername: string | null;
}

export interface ApplicationMeetingSummary {
  id: string;
  status: string;
  scheduledAt: string | null;
  calendlyEventUrl: string | null;
}

export interface Application {
  id: string;
  hrId: string;
  studentId: string;
  status: ApplicationStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  student: ApplicationStudentSummary;
  meeting?: ApplicationMeetingSummary | null;
}

export interface ScreeningQuestion {
  id: string;
  hrId: string;
  question: string;
  isTemplate: boolean;
  createdAt: string;
}

export interface ScreeningResponse {
  id: string;
  applicationId: string;
  questionId: string;
  answer: string | null;
  submittedAt: string;
  question: ScreeningQuestion;
}

export interface Meeting {
  id: string;
  hrId: string;
  applicationId: string | null;
  title: string;
  description: string | null;
  scheduledAt: string | null;
  calendlyEventUrl: string | null;
  status: string;
  createdAt: string;
}

export interface Message {
  id: string;
  hrId: string;
  studentId: string;
  content: string;
  isRead: boolean;
  sentAt: string;
}

export interface Conversation {
  student: { id: string; name: string; avatarUrl: string | null };
  lastMessage: Message;
  unreadCount: number;
}

// ── Applications ────────────────────────────────────────────────────────────

export function inviteStudent(studentId: string): Promise<Application> {
  return fetchStudentsAPI(`/api/applications/invite/${studentId}`, { method: "POST" });
}

export function listApplications(status?: ApplicationStatus): Promise<Application[]> {
  const query = status ? `?status=${status}` : "";
  return fetchStudentsAPI(`/api/applications${query}`);
}

export function getApplication(id: string): Promise<Application> {
  return fetchStudentsAPI(`/api/applications/${id}`);
}

export function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  notes?: string
): Promise<Application> {
  return fetchStudentsAPI(`/api/applications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, ...(notes && { notes }) }),
  });
}

// ── Screening Questions ───────────────────────────────────────────────────────

export function listQuestions(): Promise<ScreeningQuestion[]> {
  return fetchStudentsAPI(`/api/questions/`);
}

export function createQuestion(question: string, isTemplate = true): Promise<ScreeningQuestion> {
  return fetchStudentsAPI(`/api/questions/`, {
    method: "POST",
    body: JSON.stringify({ question, isTemplate }),
  });
}

export function deleteQuestion(id: string): Promise<{ message: string }> {
  return fetchStudentsAPI(`/api/questions/${id}`, { method: "DELETE" });
}

export function assignQuestions(
  applicationId: string,
  questionIds: string[]
): Promise<{ message: string }> {
  return fetchStudentsAPI(`/api/questions/assign/${applicationId}`, {
    method: "POST",
    body: JSON.stringify({ questionIds }),
  });
}

export function getResponses(applicationId: string): Promise<ScreeningResponse[]> {
  return fetchStudentsAPI(`/api/questions/responses/${applicationId}`);
}

// ── Meetings ───────────────────────────────────────────────────────────────

export function createMeeting(params: {
  applicationId: string;
  title: string;
  duration?: number;
  startTime?: string;
  description?: string;
}): Promise<Meeting> {
  return fetchStudentsAPI(`/api/meetings`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function cancelMeeting(id: string): Promise<{ message: string }> {
  return fetchStudentsAPI(`/api/meetings/${id}`, { method: "DELETE" });
}

// ── Messages ───────────────────────────────────────────────────────────────

export function sendMessage(studentId: string, content: string): Promise<Message> {
  return fetchStudentsAPI(`/api/messages`, {
    method: "POST",
    body: JSON.stringify({ studentId, content }),
  });
}

export function listConversations(): Promise<Conversation[]> {
  return fetchStudentsAPI(`/api/messages/conversations`);
}

export function getMessages(studentId: string): Promise<Message[]> {
  return fetchStudentsAPI(`/api/messages/${studentId}`);
}
