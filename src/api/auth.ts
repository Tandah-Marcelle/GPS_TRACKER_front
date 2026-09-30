import api from './axios';
import type { AuthResponse, User } from '../types';

export const authApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', { username, password });
    return data;
  },
  me: async (): Promise<User> => {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },
};
