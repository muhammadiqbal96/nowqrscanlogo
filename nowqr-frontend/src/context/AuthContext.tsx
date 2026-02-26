import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi } from '@/lib/api';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  business_name: string | null;
  email: string;
  plan: 'free' | 'creator' | 'agency';
  credits: number;
  avatar: string | null;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    first_name: string;
    last_name: string;
    business_name?: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setAuthFromToken: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('nowqr_token')
  );
  const [isLoading, setIsLoading] = useState(true);

  const saveAuth = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('nowqr_token', authToken);
    localStorage.setItem('nowqr_user', JSON.stringify(userData));
  };

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('nowqr_token');
    localStorage.removeItem('nowqr_user');
  };

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.me();
      setUser(response.data.user);
      localStorage.setItem('nowqr_user', JSON.stringify(response.data.user));
    } catch {
      clearAuth();
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await authApi.me();
          setUser(response.data.user);
        } catch {
          clearAuth();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    saveAuth(response.data.user, response.data.token);
  };

  const register = async (data: {
    first_name: string;
    last_name: string;
    business_name?: string;
    email: string;
    password: string;
  }) => {
    const response = await authApi.register(data);
    saveAuth(response.data.user, response.data.token);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors on logout
    }
    clearAuth();
  };

  const loginWithGoogle = async () => {
    try {
      const response = await authApi.googleRedirect();
      window.location.href = response.data.url;
    } catch (error) {
      throw new Error('Failed to initiate Google login');
    }
  };

  const setAuthFromToken = async (newToken: string) => {
    localStorage.setItem('nowqr_token', newToken);
    setToken(newToken);
    try {
      const response = await authApi.me();
      saveAuth(response.data.user, newToken);
    } catch {
      clearAuth();
      throw new Error('Invalid token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        loginWithGoogle,
        refreshUser,
        setAuthFromToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
