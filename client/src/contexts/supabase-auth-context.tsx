import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, supabasePromise } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: { username: string; firstName?: string; lastName?: string }) => Promise<void>;
  signUpWithOTP: (email: string, userData: { username: string; firstName?: string; lastName?: string }) => Promise<void>;
  verifyOTP: (email: string, token: string, password: string, userData: { username: string; firstName?: string; lastName?: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfile?: (data: any) => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        // Wait for Supabase to be initialized
        const supabaseClient = supabase || await supabasePromise;
        
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Failed to get initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Setup auth listener after initialization
    const setupListener = async () => {
      try {
        const supabaseClient = supabase || await supabasePromise;
        
        // Listen for auth changes
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email ?? 'no user');
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
          }
        );

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Failed to setup auth listener:', error);
      }
    };

    const cleanup = setupListener();
    
    return () => {
      cleanup.then(unsubscribe => unsubscribe?.());
    };
  }, []);

  const signUp = async (email: string, password: string, userData: { username: string; firstName?: string; lastName?: string }) => {
    // Redirect to OTP registration for backward compatibility
    await signUpWithOTP(email, userData);
  };

  const signUpWithOTP = async (email: string, userData: { username: string; firstName?: string; lastName?: string }) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao enviar código OTP');
      }

      console.log('✅ OTP enviado com sucesso para:', email);
    } catch (error: any) {
      console.error('❌ Erro no envio do OTP:', error.message);
      throw new Error(error.message || 'Erro ao enviar código de verificação');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (email: string, token: string, password: string, userData: { username: string; firstName?: string; lastName?: string }) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          token,
          password,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro na verificação do código');
      }

      console.log('✅ OTP verificado e conta criada para:', email);

      // The session will be updated automatically via onAuthStateChange
    } catch (error: any) {
      console.error('❌ Erro na verificação do OTP:', error.message);
      throw new Error(error.message || 'Erro ao verificar código');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const supabaseClient = supabase || await supabasePromise;
      
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Supabase signin error:', error.message);
        throw new Error(error.message);
      }

      if (!data.user || !data.session) {
        throw new Error('Falha no login - dados não retornados');
      }

      console.log('✅ Login realizado com sucesso para:', email);
    } catch (error: any) {
      const errorMessage = error?.message || 'Erro desconhecido no login';
      console.error('❌ Erro no login:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Clear local state first to prevent UI issues
      setUser(null);
      setSession(null);
      
      // Attempt to sign out from Supabase
      const supabaseClient = supabase || await supabasePromise;
      const { error } = await supabaseClient.auth.signOut();
      
      // Don't throw on session missing errors - just log them
      if (error) {
        if (error.message.includes('session missing') || error.message.includes('Auth session missing')) {
          console.log('⚠️ Sessão já estava inválida, logout local realizado');
        } else {
          console.error('❌ Erro no logout:', error.message);
          // Still don't throw - we've already cleared local state
        }
      } else {
        console.log('✅ Logout realizado com sucesso');
      }
    } catch (error: any) {
      console.error('❌ Erro no logout:', error.message);
      // Don't throw - we've already cleared the local state
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('❌ Supabase reset password error:', error.message);
        throw new Error(error.message);
      }

      console.log('✅ Email de redefinição enviado para:', email);
    } catch (error: any) {
      const errorMessage = error?.message || 'Erro ao enviar email de redefinição';
      console.error('❌ Erro ao redefinir senha:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteAccount = async () => {
    setLoading(true);
    try {
      // Delete all user data from our backend (this will also delete the user from Supabase)
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao deletar dados do usuário');
      }

      // Sign out the user
      await supabase.auth.signOut();
      
      console.log('✅ Conta excluída com sucesso');
      
      // Don't redirect immediately - let the UI component handle it after showing success message
    } catch (error: any) {
      const errorMessage = error?.message || 'Erro ao excluir conta';
      console.error('❌ Erro ao excluir conta:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao alterar senha');
      }

      console.log('✅ Password changed successfully');
      
      // Refresh the session after password change to prevent auth errors
      try {
        const supabaseClient = supabase || await supabasePromise;
        const { data, error } = await supabaseClient.auth.refreshSession();
        if (error) {
          console.warn('⚠️ Session refresh failed, but password was changed:', error.message);
        } else if (data.session) {
          console.log('✅ Session refreshed after password change');
        }
      } catch (refreshError) {
        console.warn('⚠️ Session refresh error:', refreshError);
        // Don't throw - the password was successfully changed
      }
    } catch (error: any) {
      console.error('❌ Change password error:', error.message);
      throw new Error(error.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: any) => {
    // Implementation for updating profile if not already present
    console.log('Update profile called with:', data);
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signUpWithOTP,
    verifyOTP,
    signIn,
    signOut,
    resetPassword,
    changePassword,
    deleteAccount,
    updateProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}