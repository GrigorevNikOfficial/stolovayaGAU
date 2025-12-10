import { httpClient } from './http-client';
import type {
  AdminAnalyticsResponse,
  AnalyticsModuleId,
  AnalyticsRangeOption,
} from '../types/analytics';

type GetAdminAnalyticsParams = {
  module?: AnalyticsModuleId;
  range?: AnalyticsRangeOption;
};

export const analyticsApi = {
  getAdminAnalytics: async (params?: GetAdminAnalyticsParams): Promise<AdminAnalyticsResponse> => {
    return httpClient.get<AdminAnalyticsResponse>('/analytics/admin', {
      params,
    });
  },
};
