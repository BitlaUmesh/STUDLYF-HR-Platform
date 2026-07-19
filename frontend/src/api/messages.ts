import { apiClient } from './client';

export interface Message {
  id: string;
  hrId: string;
  studentId: string;
  content: string;
  isRead: boolean;
  sentAt: string;
}

export interface Conversation {
  student: { id: string; name: string; avatarUrl?: string | null };
  lastMessage: Message;
  unreadCount: number;
}

export const messagesApi = {
  conversations: () => apiClient.get<Conversation[]>('/messages/conversations'),
  thread: (studentId: string) => apiClient.get<Message[]>(`/messages/${studentId}`),
  send: (studentId: string, content: string) =>
    apiClient.post<Message>('/messages', { studentId, content }),
  markRead: (id: string) => apiClient.patch(`/messages/${id}/read`),
};
