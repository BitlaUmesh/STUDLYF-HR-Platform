import { apiClient } from './client';

export interface ScreeningQuestion {
  id: string;
  hrId: string;
  question: string;
  isTemplate: boolean;
  createdAt: string;
}

export const questionsApi = {
  list: () => apiClient.get<ScreeningQuestion[]>('/questions'),
  create: (question: string, isTemplate = false) =>
    apiClient.post<ScreeningQuestion>('/questions', { question, isTemplate }),
  remove: (id: string) => apiClient.delete(`/questions/${id}`),
  assign: (applicationId: string, questionIds: string[]) =>
    apiClient.post(`/questions/assign/${applicationId}`, { questionIds }),
  responses: (applicationId: string) =>
    apiClient.get(`/questions/responses/${applicationId}`),
};
