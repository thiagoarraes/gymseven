import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User as AppUser } from '@shared/schema';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: { username: string; firstName?: string; lastName?: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has a stored auth token
    const checkAuthToken = async () => {
      const token = localStorage.getItem('auth-token');
      if (token) {
        try {
          // Verify token with backend
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            setUser(result.user);
            console.log('✅ Auto-login successful:', result.user?.email);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('auth-token');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('auth-token');
        }
      }
      setLoading(false);
    };

    checkAuthToken();
  }, []);


  const signUp = async (email: string, password: string, userData: { username: string; firstName?: string; lastName?: string }) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar conta');
      }

      const result = await response.json();
      console.log('✅ Registration successful:', result.user?.email);
      
      // Store the token and set user data
      if (result.token) {
        localStorage.setItem('auth-token', result.token);
        setUser(result.user);
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Email ou senha incorretos');
      }

      const result = await response.json();
      console.log('✅ Login successful:', result.user?.email);
      
      // Store the token and set user data
      if (result.token) {
        localStorage.setItem('auth-token', result.token);
        setUser(result.user);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Remove token from localStorage
      localStorage.removeItem('auth-token');
      
      console.log('Logging out user');
      setUser(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Erro ao fazer logout');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('🔄 Solicitando reset de senha para:', email);
      
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao enviar email de recuperação');
      }
      
      console.log('✅ Password reset email sent to:', email);
    } catch (error: any) {
      console.error('❌ Reset password error:', error);
      throw new Error(error.message || 'Erro ao enviar email de recuperação');
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}