import { httpClient } from './http-client';
import type {
  CreateTopUpRequestPayload,
  ProcessTopUpRequestPayload,
  TopUpRequest,
  TopUpRequestStatus,
} from '../types/topup';

export const topUpsApi = {
  createRequest: async (
    payload: CreateTopUpRequestPayload
  ): Promise<{ message: string; request: TopUpRequest }> => {
    return await httpClient.post('/topups', payload);
  },

  getMyRequests: async (): Promise<{ requests: TopUpRequest[] }> => {
    return await httpClient.get('/topups/my');
  },

  getAllRequests: async (params?: {
    status?: TopUpRequestStatus;
  }): Promise<{ requests: TopUpRequest[] }> => {
    return await httpClient.get('/topups', { params });
  },

  processRequest: async (
    payload: ProcessTopUpRequestPayload
  ): Promise<{
    message: string;
    request: TopUpRequest;
    user_balance?: number | null;
  }> => {
    const { id, ...data } = payload;
    return await httpClient.put(`/topups/${id}`, data);
  },
};
