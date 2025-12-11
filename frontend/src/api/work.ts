import { httpClient } from './http-client';
import type { WorkItem } from '../types/work';

export const workApi = {
  list(params?: { view?: 'all' | 'mine' }): Promise<{ items: WorkItem[] }> {
    return httpClient.get('/work', { params });
  },
  create(payload: { title: string; description: string; location?: string; salaryText?: string }): Promise<{ item: WorkItem }> {
    return httpClient.post('/work', payload);
  },
  apply(id: string, payload: { message?: string }): Promise<{ item: WorkItem }> {
    return httpClient.post(`/work/${id}/apply`, payload);
  },
  respond(id: string, userId: string, action: 'accept' | 'decline'): Promise<{ item: WorkItem }> {
    return httpClient.post(`/work/${id}/respond/${userId}`, { action });
  },
  detail(id: string): Promise<{ item: WorkItem }> {
    return httpClient.get(`/work/${id}`);
  },
};