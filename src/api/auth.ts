import api from './axios';
import type { AuthResponse, User } from '../types';

export const authApi = {
  register: async (data: { username: string; email: string; password: string; fullName: string; role?: string }) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  verifyOtp: async (email: string, otp: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/verify-otp', { email, otp });
    return data;
  },
  login: async (username: string, password: string) => {
    const { data } = await api.post('/auth/login', { username, password });
    return data;
  },
  verifyLoginOtp: async (email: string, otp: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/verify-login-otp', { email, otp });
    return data;
  },
  me: async (): Promise<User> => {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },
};
