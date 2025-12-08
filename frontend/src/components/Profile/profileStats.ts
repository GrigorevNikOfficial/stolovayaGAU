export type ProfileStats = {
  requestsAsCustomer: number;
  requestsAsProvider: number;
  activeRequests: number;
  completedRequests: number;
  servicesPublished: number;
  lastServiceUpdatedAt: string | null;
};

export const defaultProfileStats: ProfileStats = {
  requestsAsCustomer: 0,
  requestsAsProvider: 0,
  activeRequests: 0,
  completedRequests: 0,
  servicesPublished: 0,
  lastServiceUpdatedAt: null,
};
