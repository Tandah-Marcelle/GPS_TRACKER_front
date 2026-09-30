export type Role = 'STOCK_MANAGER' | 'TECHNICIAN';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}
