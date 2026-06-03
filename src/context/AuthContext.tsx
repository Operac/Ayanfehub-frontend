import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

// Axios baseURL + withCredentials are set in main.tsx from VITE_API_BASE_URL
axios.defaults.withCredentials = true;

interface User {
  id: string;
  email: string | null;
  phone?: string;
  fullName?: string | null;
  role: 'ADMIN' | 'CUSTOMER' | 'VENDOR' | 'ARTISAN';
}

interface LoginCredentials {
  /** Either phone or email must be provided */
  phone?: string;
  email?: string;
  password: string;
}

interface RegisterCredentials {
  phone: string;   // required by backend
  email?: string;
  password: string;
  fullName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginCredentials) => Promise<void>;
  register: (data: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      const { data } = await axios.get('/auth/session');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const { data } = await axios.post('/auth/login', credentials);
    setUser(data.user);
  };

  const register = async (credentials: RegisterCredentials) => {
    const { data } = await axios.post('/auth/register', credentials);
    setUser(data.user);
  };

  const logout = async () => {
    await axios.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
