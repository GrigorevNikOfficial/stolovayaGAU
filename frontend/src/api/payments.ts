import { httpClient } from './http-client';
import type { TransactionListResponse } from '../types/services';

export const paymentsApi = {
  getTransactions: async (params?: {
    scope?: 'customer' | 'provider';
    limit?: number;
  }): Promise<TransactionListResponse> => {
    return httpClient.get<TransactionListResponse>(
      '/payments/transactions',
      { params }
    );
  },
};
