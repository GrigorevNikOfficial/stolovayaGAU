import { httpClient } from './http-client';
import type { InternshipItem } from '../types/internship';

export type InternshipFilters = {
  workFormat?: string;
  employmentType?: string;
  minHours?: number;
  maxHours?: number;
  skill?: string;
  view?: 'all' | 'mine';
};

export const internshipsApi = {
  list(filters?: InternshipFilters): Promise<{ items: InternshipItem[] }> {
    return httpClient.get('/internships', { params: filters });
  },
  create(payload: {
    title: string;
    description: string;
    company?: string;
    location?: string;
    workFormat?: string;
    employmentType?: string;
    hoursPerDay?: number;
    expectedSalary?: string;
    skills?: string[];
    experienceLevel?: string;
  }): Promise<{ item: InternshipItem }> {
    return httpClient.post('/internships', payload);
  },
  apply(id: string, payload: { message?: string }): Promise<{ item: InternshipItem }> {
    return httpClient.post(`/internships/${id}/apply`, payload);
  },
  respond(id: string, userId: string, action: 'accept' | 'decline'): Promise<{ item: InternshipItem }> {
    return httpClient.post(`/internships/${id}/respond/${userId}`, { action });
  },
  detail(id: string): Promise<{ item: InternshipItem }> {
    return httpClient.get(`/internships/${id}`);
  },
};