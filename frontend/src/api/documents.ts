import { apiClient } from './client';

export type DocumentType = 'OFFER_LETTER' | 'JOINING_LETTER';

export interface DocumentRecord {
  id: string;
  userId: string;
  type: DocumentType;
  title?: string | null;
  status: 'draft' | 'completed' | 'exported' | 'archived';
  lastOpenedAt: string;
  exportCount: number;
  templateId?: string | null;
  candidateDetails: Record<string, any>;
  contentJSON: Record<string, any>;
  brandingId?: string | null;
  exportUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentPayload {
  title?: string;
  type: DocumentType;
  status?: string;
  template_id?: string;
  candidateDetails: Record<string, any>;
  contentJSON: Record<string, any>;
  brandingId?: string;
}

export const documentsApi = {
  list: () => apiClient.get<DocumentRecord[]>('/documents'),
  getById: (id: string) => apiClient.get<DocumentRecord>(`/documents/${id}`),
  create: (payload: CreateDocumentPayload) => apiClient.post<DocumentRecord>('/documents/create', payload),
  update: (id: string, payload: Partial<CreateDocumentPayload>) =>
    apiClient.put<DocumentRecord>(`/documents/update/${id}`, payload),
  remove: (id: string) => apiClient.delete(`/documents/delete/${id}`),
  sendEmail: (id: string, payload: { to_email: string; subject: string; html_content: string }) =>
    apiClient.post(`/documents/${id}/send`, payload),
};
