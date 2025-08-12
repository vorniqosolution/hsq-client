import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthResult {
  success: boolean;
  message: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  isLoading: boolean;
  /** NEW: expose sessionExpired so a global popup can read it */
  sessionExpired: boolean;
  /** (optional) if you ever want to manually clear popup */
  clearSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser]                 = useState<User | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const navigate  = useNavigate();
  const location  = useLocation();
  const interceptorId = useRef<number | null>(null);

  // Axios base config
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
  axios.defaults.withCredentials = true;

  // 1) Initial auth check on mount / route change
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await axios.get('/api/auth/me');
        setUser(data.user);
      } catch {
        setUser(null);
        // For initial load (no session), redirect to login *without* popup.
        if (location.pathname !== '/login') navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate, location.pathname]);

  // 2) Attach ONE global interceptor to catch token/session expiry mid‑session
  useEffect(() => {
    if (interceptorId.current !== null) return; // prevent duplicates

    interceptorId.current = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        const status = err?.response?.status;
        const code   = err?.response?.data?.code; // if your API sends a code e.g. 'TOKEN_EXPIRED'

        // Treat 401/419/440 or a custom code as "session expired"
        if (status === 401 || status === 419 || status === 440 || code === 'TOKEN_EXPIRED') {
          setUser(null);
          setSessionExpired(true); // <-- triggers popup
          // Do NOT navigate here; let the popup control the flow.
        }
        return Promise.reject(err);
      }
    );

    return () => {
      if (interceptorId.current !== null) {
        axios.interceptors.response.eject(interceptorId.current);
        interceptorId.current = null;
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      setUser(data.user);
      setSessionExpired(false); // in case popup was visible
      // Redirect based on role
      if (data.user.role === 'admin') {
        navigate('/dashboard');
      } else if (data.user.role === 'receptionist') {
        navigate('/guests');
      } else {
        navigate('/login');
      }
      return { success: true, message: data.message };
    } catch (err: any) {
      const message = err.response?.data?.message || err.message;
      return { success: false, message };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await axios.post('/api/auth/logout');
    } catch {
      // ignore
    } finally {
      setUser(null);
      setSessionExpired(false);
      navigate('/login');
    }
  };

  const clearSessionExpired = () => setSessionExpired(false);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, sessionExpired, clearSessionExpired }}>
      {children}
    </AuthContext.Provider>
  );
};
