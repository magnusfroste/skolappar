import { useMutation } from '@tanstack/react-query';
import { api, adminApi } from '@/lib/api';

export interface AppSuggestion {
  url: string;
  email: string;
  title?: string;
  description?: string;
  note?: string;
  /** Honeypot – stays empty for people. */
  website?: string;
  /** The box "I have read and accept the terms" – the server refuses a submission without it. */
  accept_terms: boolean;
}

/** "Tipsa om en app": anyone can suggest an app; it waits for review. */
export function useSubmitSuggestion() {
  return useMutation({
    mutationFn: (data: AppSuggestion) => api.post<{ ok: boolean }>('/api/submissions', { ...data }),
  });
}

/** Admin: upload an image file; returns its URL (/images/…). */
export function useUploadAppImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const { url } = await adminApi.post<{ url: string }>('/api/admin/upload', file);
      return url;
    },
  });
}
