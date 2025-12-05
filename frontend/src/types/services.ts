export interface ServiceAvailability {
  days: string[];
  timeSlots: Array<{ start: string; end: string }>;
}

export interface ServiceListingOwner {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: { key: string };
}

export interface ServiceListing {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  pricingType: 'fixed' | 'hourly' | 'package';
  tags: string[];
  skills: string[];
  location: string;
  availability: ServiceAvailability;
  rating: number;
  reviewsCount: number;
  views: number;
  completedOrders: number;
  isActive: boolean;
  portfolio: string[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  owner?: ServiceListingOwner;
}

export interface ServiceListPagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface ServiceListResponse {
  data: ServiceListing[];
  pagination: ServiceListPagination;
}

export type ServiceSort = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'rating';

export interface ServiceListQuery {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  pricingType?: 'fixed' | 'hourly' | 'package';
  sort?: ServiceSort;
  page?: number;
  limit?: number;
  includeInactive?: boolean;
  userId?: string;
}

export interface CreateServicePayload {
  title: string;
  description: string;
  category: string;
  price: number;
  pricingType?: 'fixed' | 'hourly' | 'package';
  tags?: string[];
  skills?: string[];
  location?: string;
  availability?: ServiceAvailability;
  portfolio?: string[];
  attachments?: string[];
}

export type UpdateServicePayload = Partial<CreateServicePayload>;

export interface ServiceRequest {
  id: string;
  service?: Pick<ServiceListing, 'id' | 'title' | 'price' | 'category'>;
  customer?: Pick<ServiceListingOwner, 'id' | 'firstName' | 'lastName' | 'role'>;
  provider?: Pick<ServiceListingOwner, 'id' | 'firstName' | 'lastName' | 'role'>;
  price: number;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate?: string;
  dueDate?: string;
  address?: string;
  files: string[];
  chatId?: string;
  transactionId?: string;
  isPaid: boolean;
  paidAt?: string;
  completedAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequestListResponse {
  data: ServiceRequest[];
}

export type ServiceRequestScope = 'customer' | 'provider';

export interface ServiceRequestQuery {
  scope?: ServiceRequestScope;
  status?: ServiceRequest['status'];
  serviceId?: string;
}

export interface CreateServiceRequestPayload {
  serviceId: string;
  message?: string;
}

export interface UpdateServiceRequestStatusPayload {
  status: 'accepted' | 'declined' | 'cancelled' | 'completed';
  reason?: string;
}

export interface TransactionRecord {
  id: string;
  requestId: string;
  serviceId: string;
  customerId: string;
  providerId: string;
  amount: number;
  commissionPercent: number;
  commissionAmount: number;
  payoutAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  type: 'service_payment' | 'refund' | 'payout';
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  service?: Pick<ServiceListing, 'id' | 'title' | 'category'>;
  request?: Pick<ServiceRequest, 'id' | 'status'>;
}

export interface TransactionListResponse {
  data: TransactionRecord[];
}