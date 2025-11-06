export interface User {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  mail?: string;
  password: string;
  role: 'user' | 'admin';
  created_at?: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string; // ДОБАВИЛИ EMAIL
  password: string;
  role: 'user' | 'admin';
}

export interface UpdateUserRequest {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string; // ДОБАВИЛИ EMAIL
  password: string;
  role: 'user' | 'admin';
}

// Адаптеры для преобразования данных
export const adaptUserFromBackend = (backendUser: any): User => ({
  id: backendUser.id,
  first_name: backendUser.first_name,
  last_name: backendUser.last_name,
  phone: backendUser.phone,
  mail: backendUser.mail,
  password: backendUser.password || '',
  role: backendUser.role || 'user',
  created_at: backendUser.created_at,
});

export const adaptUserToBackend = (frontendUser: CreateUserRequest): any => ({
  first_name: frontendUser.firstName,
  last_name: frontendUser.lastName,
  phone: frontendUser.phone,
  mail: frontendUser.email || '', // ИСПОЛЬЗУЕМ EMAIL ИЗ ФОРМЫ
  password: frontendUser.password,
});
