// types/point.ts
export interface Point {
  _id: string;
  name: string;
  type: 'canteen' | 'store';
  location: string;
  phone: string;
  isActive: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreatePointRequest {
  name: string;
  type: 'canteen' | 'store';
  location: string;
  phone: string;
  isActive?: boolean;
}

export interface UpdatePointRequest {
  name?: string;
  type?: 'canteen' | 'store';
  location?: string;
  phone?: string;
  isActive?: boolean;
}
