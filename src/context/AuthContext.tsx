import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ email: string; message: string; devOtp?: string }>;
  verifyLoginOtp: (email: string, otp: string) => Promise<void>;
  register: (data: { username: string; email: string; password: string; fullName: string; role?: string }) => Promise<{ email: string; devOtp?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem('accessToken');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const me = await authApi.me();
        setUser(me);
        localStorage.setItem('user', JSON.stringify(me));
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (identifier: string, password: string) => {
    const data = await authApi.login(identifier, password);
    // backend returns { message, email, devOtp? } - the JWT is only issued after OTP verification
    return { email: data.email, message: data.message, devOtp: data.devOtp };
  };

  const verifyLoginOtp = async (email: string, otp: string) => {
    const data = await authApi.verifyLoginOtp(email, otp);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.accessToken);
    setUser(data.user);
  };

  const register = async (data: { username: string; email: string; password: string; fullName: string; role?: string }) => {
    const res = await authApi.register(data);
    return { email: res.email, devOtp: res.devOtp };
  };

  const verifyOtp = async (email: string, otp: string) => {
    const data = await authApi.verifyOtp(email, otp);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.accessToken);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, verifyLoginOtp, register, verifyOtp, logout, isAuthenticated: !!user && !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
