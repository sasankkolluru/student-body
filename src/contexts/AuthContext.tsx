import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { apiFetch, setAuthToken, clearAuthToken, getAuthToken } from '../lib/api';

type UserRole = 'admin' | 'student' | null;

interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  role: UserRole;
  regdNo?: string;
  employeeId?: string;
  branch?: string;
  stream?: string;
  year?: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  regdNo?: string;
  employeeId?: string;
  branch?: string;
  stream?: string;
  year?: string;
  phone?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
  role: UserRole;
  rememberMe?: boolean;
}

interface AuthContextType {
  user: User | null;
  currentUser: User | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// Keys for localStorage
const AUTH_KEYS = {
  SESSION: 'auth_session',
  REMEMBER_ME: 'remember_me',
} as const;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // These are used in the AuthContext value object below

  // Check for existing session on initial load via backend /auth/me
  // Run only once on mount to avoid route ping-pong and blinking
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        if (!token) return;
        const res = await apiFetch<{ user: User }>('/auth/me');
        if (res?.user) {
          // Only set the user; do NOT auto-navigate here.
          // PublicRoute will redirect off /login or /register automatically when user is set.
          setUser(res.user);
        }
      } catch (err) {
        // On failure, ensure we clear token/session
        clearAuthToken();
        localStorage.removeItem(AUTH_KEYS.SESSION);
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  const login = async ({ email, password, role, rememberMe = false }: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<{ token: string; user: User }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password, role }),
        }
      );
      setAuthToken(res.token);
      setUser(res.user);
      if (rememberMe) localStorage.setItem(AUTH_KEYS.REMEMBER_ME, 'true');
      toast.success(`Welcome back, ${res.user.name}!`);
      const redirectPath = location.state?.from?.pathname || (res.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to log in. Please check your credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    currentUser: user, // Used by components
    isAdmin: user?.role === 'admin', // Used by components
    isAuthenticated: !!user, // Used by components
    loading,
    error,
    login,
    register: async (data: RegisterData) => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<{ token: string; user: User }>(
          '/auth/register',
          {
            method: 'POST',
            body: JSON.stringify({
              name: data.name,
              email: data.email,
              password: data.password,
              role: data.role,
              regdNo: data.regdNo,
              employeeId: data.employeeId,
              branch: data.branch,
              stream: data.stream,
              year: data.year,
              phone: data.phone,
            }),
          }
        );
        setAuthToken(res.token);
        setUser(res.user);
        toast.success(`Welcome to Student Portal, ${res.user.name}!`);
      } catch (err: any) {
        console.error('Registration error:', err);
        setError(err.message || 'Failed to register. Please try again.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    logout: () => {
      setUser(null);
      clearAuthToken();
      localStorage.removeItem(AUTH_KEYS.SESSION);
      sessionStorage.removeItem(AUTH_KEYS.SESSION);
      toast.success('You have been logged out successfully');
      navigate('/login');
    },
    updateProfile: async (data: Partial<User>) => {
      if (!user) return;
      
      try {
        setLoading(true);
        // TODO: Replace with backend profile update endpoint when available
        await new Promise(resolve => setTimeout(resolve, 500));
        const updatedUser: User = { ...user, ...data, updatedAt: new Date().toISOString() };
        setUser(updatedUser);
        
        // Show success message
        toast.success('Profile updated successfully');
        
      } catch (err) {
        console.error('Update profile error:', err);
        setError('Failed to update profile. Please try again.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    resetPassword: async (_email: string) => {
      try {
        setLoading(true);
        // TODO: Implement backend reset password endpoint
        await new Promise(resolve => setTimeout(resolve, 800));
        toast.success('If an account exists, password reset instructions have been sent.');
      } catch (err: any) {
        console.error('Reset password error:', err);
        setError(err.message || 'Failed to reset password. Please try again.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    clearError: () => {
      setError(null);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
