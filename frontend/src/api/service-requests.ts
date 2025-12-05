import { httpClient } from './http-client';
import type {
  CreateServiceRequestPayload,
  ServiceRequest,
  ServiceRequestListResponse,
  ServiceRequestQuery,
  UpdateServiceRequestStatusPayload,
} from '../types/services';

export const serviceRequestsApi = {
  createRequest: async (
    payload: CreateServiceRequestPayload
  ): Promise<ServiceRequest> => {
    return httpClient.post<ServiceRequest>('/service-requests', payload);
  },

  getRequests: async (
    params?: ServiceRequestQuery
  ): Promise<ServiceRequestListResponse> => {
    const query = params as Record<string, string | number | boolean | undefined> | undefined;
    return httpClient.get<ServiceRequestListResponse>(
      '/service-requests',
      { params: query }
    );
  },

  getRequestById: async (id: string): Promise<ServiceRequest> => {
    return httpClient.get<ServiceRequest>(`/service-requests/${id}`);
  },

  updateRequestStatus: async (
    id: string,
    payload: UpdateServiceRequestStatusPayload
  ): Promise<ServiceRequest> => {
    return httpClient.patch<ServiceRequest>(`/service-requests/${id}/status`, payload);
  },
};
