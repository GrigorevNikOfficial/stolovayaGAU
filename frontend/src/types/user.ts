// types/user.ts
export interface RegisterRequest {
  first_name: string;
  last_name: string;
  phone: string;
  mail: string; // Используем mail как в бэкенде
  password: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  mail?: string; // Используем mail как в бэкенде
}

export interface User {
  _id: string;
  first_name: string;
  last_name: string;
  phone: string;
  mail: string; // Используем mail как в бэкенде
  role: 'user' | 'admin' | 'canteenManager' | 'cateenManager' | 'storeManager';
  balance: number;
  created_at: string;
  updated_at?: string;
  avatar?: {
    key: string;
    url: string;
  };
}

export interface UserPreview {
  _id: string;
  first_name: string;
  last_name: string;
  role: User['role'];
  avatar: {
    key: string;
    url: string;
  };
}
