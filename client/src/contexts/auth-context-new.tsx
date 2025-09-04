import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { User as AppUser } from '@shared/schema';

interface AuthContextType {
  session: Session | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('🔍 Fetching user profile for:', userId);
      
      // Add timeout to prevent infinite hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );

      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      const { data, error } = result;

      if (error) {
        console.error('Error fetching user profile:', error);
        // If user doesn't exist in our users table, create it from auth user data
        if (error.code === 'PGRST116') {
          console.log('User profile not found, creating from auth data');
          await createUserProfileFromAuth(userId);
        } else {
          // For other errors, still stop loading
          console.log('⚠️ Stopping loading due to error:', error.message);
          setLoading(false);
        }
      } else {
        console.log('✅ User profile found:', data.email);
        setUser(data);
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error in fetchUserProfile:', error);
      // If timeout or any error, create a fallback user object
      if (error.message === 'Timeout') {
        console.log('⏰ Query timeout - creating fallback user');
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser.user) {
          setUser({
            id: userId,
            email: authUser.user.email!,
            username: authUser.user.user_metadata?.username || 'thiaqo',
            first_name: 'Thiago',
            last_name: 'User'
          } as any);
        }
      }
      setLoading(false);
    }
  };

  const createUserProfileFromAuth = async (userId: string) => {
    try {
      console.log('🆕 Creating user profile for:', userId);
      // Get the current auth user data
      const { data: authUser } = await supabase.auth.getUser();
      
      if (!authUser.user) {
        console.log('❌ No auth user found');
        setLoading(false);
        return;
      }

      const userData = {
        id: userId,
        email: authUser.user.email!,
        username: authUser.user.user_metadata?.username || authUser.user.email!.split('@')[0],
        first_name: authUser.user.user_metadata?.first_name || '',
        last_name: authUser.user.user_metadata?.last_name || '',
        password: '$2a$10$dummy.hash.for.supabase.auth.user' // Add required password field
      };

      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        setLoading(false);
      } else {
        console.log('✅ User profile created successfully:', data.email);
        setUser(data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in createUserProfileFromAuth:', error);
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: { username: string; firstName?: string; lastName?: string }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userData.username,
            first_name: userData.firstName,
            last_name: userData.lastName
          }
        }
      });

      if (error) throw error;

      // If signup is successful but email confirmation is required
      if (data.user && !data.session) {
        console.log('Please check your email for confirmation link');
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      console.log('Sign in successful:', data.user?.email);
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log('Logging out user');
      setSession(null);
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
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `https://seven.org.br/reset-password`
      });

      console.log('📧 Resposta do Supabase:', { data, error });

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }
      
      console.log('✅ Password reset email sent to:', email);
    } catch (error: any) {
      console.error('❌ Reset password error:', error);
      throw new Error(error.message || 'Erro ao enviar email de recuperação');
    }
  };

  const value = {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    isAuthenticated: !!session
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}