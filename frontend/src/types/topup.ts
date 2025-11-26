export type TopUpRequestStatus = 'pending' | 'approved' | 'rejected';

export interface TopUpRequestUserInfo {
  _id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  role?: string;
  balance?: number;
}

export interface TopUpRequest {
  _id: string;
  user_id: string;
  admin_id?: string;
  amount_requested: number;
  amount_approved: number | null;
  status: TopUpRequestStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  user_info: TopUpRequestUserInfo | null;
  admin_info: TopUpRequestUserInfo | null;
}

export interface CreateTopUpRequestPayload {
  amount: number;
  note?: string;
}

export interface ProcessTopUpRequestPayload {
  id: string;
  status: Exclude<TopUpRequestStatus, 'pending'>;
  amount?: number;
  note?: string;
}
