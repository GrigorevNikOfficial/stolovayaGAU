import { httpClient } from './http-client';
import type {
  CreateServicePayload,
  ServiceListQuery,
  ServiceListResponse,
  ServiceListing,
  UpdateServicePayload,
} from '../types/services';

export const marketplaceApi = {
  getServices: async (
    params?: ServiceListQuery
  ): Promise<ServiceListResponse> => {
    const query = params as Record<string, string | number | boolean | undefined> | undefined;
    return httpClient.get<ServiceListResponse>('/services', { params: query });
  },

  getServiceById: async (id: string): Promise<ServiceListing> => {
    return httpClient.get<ServiceListing>(`/services/${id}`);
  },

  getMyServices: async (): Promise<ServiceListing[]> => {
    return httpClient.get<ServiceListing[]>('/services/mine');
  },

  createService: async (
    payload: CreateServicePayload
  ): Promise<ServiceListing> => {
    return httpClient.post<ServiceListing>('/services', payload);
  },

  updateService: async (
    id: string,
    payload: UpdateServicePayload
  ): Promise<ServiceListing> => {
    return httpClient.put<ServiceListing>(`/services/${id}`, payload);
  },

  toggleServiceStatus: async (
    id: string,
    isActive: boolean
  ): Promise<ServiceListing> => {
    return httpClient.patch<ServiceListing>(`/services/${id}/status`, { isActive });
  },

  deleteService: async (id: string): Promise<void> => {
    await httpClient.delete(`/services/${id}`);
  },
};
