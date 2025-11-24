// types/user.ts
export interface RegisterRequest {
  first_name: string;
  last_name: string;
  phone: string;
  mail: string;
  password: string;
  role?: 'user' | 'admin' | 'canteenManager' | 'storeManager';
  point_id?: string; // НОВОЕ: ID точки для менеджеров
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  mail?: string;
}

export interface CreateEmployeeRequest {
  first_name: string;
  last_name: string;
  phone: string;
  mail: string;
  password: string;
  role: 'user' | 'admin' | 'canteenManager' | 'storeManager';
  point_id?: string; // НОВОЕ: ID точки для менеджеров
}

export interface UpdateEmployeeRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  mail?: string;
  role?: 'user' | 'admin' | 'canteenManager' | 'storeManager';
  point_id?: string; // НОВОЕ: ID точки для менеджеров
}

export interface User {
  _id: string;
  first_name: string;
  last_name: string;
  phone: string;
  mail: string;
  role: 'user' | 'admin' | 'canteenManager' | 'storeManager';
  balance: number;
  point_id?: string; // НОВОЕ: ID привязанной точки
  point_info?: {
    // НОВОЕ: информация о точке
    _id: string;
    name: string;
    type: 'canteen' | 'store';
    location: string;
  };
  created_at: string;
  updated_at?: string;
  avatar?: {
    key: string;
    url: string;
  };
}
