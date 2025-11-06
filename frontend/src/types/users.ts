export interface User {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  role: 'user' | 'admin';
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  role: 'user' | 'admin';
}

export interface UpdateUserRequest {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  role: 'user' | 'admin';
}
