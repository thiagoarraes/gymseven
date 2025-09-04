import { supabase } from './supabase-client';
import { getStorage } from './storage';
import { type Request, type Response, type NextFunction } from 'express';

// Helper function to sync user from Supabase Auth to users table using service role
async function syncUserFromAuthToDatabase(
  userId: string, 
  email: string, 
  userData: { username: string; firstName?: string; lastName?: string }
) {
  try {
    // Use service role client to bypass RLS policies
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingUser) {
      console.log('✅ User already exists in database');
      return;
    }

    // Check if username is already taken and make it unique
    const { data: usernameExists } = await supabase
      .from('users')
      .select('username')
      .eq('username', userData.username)
      .single();

    const finalUsername = usernameExists ? 
      `${userData.username}_${userId.slice(-6)}` : 
      userData.username;

    // Create user in database with service role (bypasses RLS)
    // Only insert essential fields to avoid schema cache issues
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId, // Use the same ID from Supabase Auth
        email: email,
        username: finalUsername,
        password: 'supabase_managed', // Placeholder
        first_name: userData.firstName || '',
        last_name: userData.lastName || ''
        // Let all other fields use their database defaults
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Service role user creation error:', error);
      throw new Error(`Database sync error: ${error.message}`);
    }

    console.log('✅ User synced to database using service role:', data.id);
    return data;
  } catch (error: any) {
    console.error('❌ syncUserFromAuthToDatabase error:', error);
    throw error;
  }
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    user_metadata?: any;
  };
}

// Middleware to verify Supabase Auth JWT and ensure user exists in users table
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Token de acesso necessário' });
    }

    // Verify JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({ message: 'Token inválido ou expirado - faça login novamente' });
    }

    // Check if user exists in local users table
    const db = await getStorage();
    let dbUser = await db.getUser(user.id);

    if (!dbUser) {
      // User exists in Supabase Auth but not in local users table
      // This might happen after manual cleanup or desynchronization
      console.log('⚠️ User exists in Auth but not in users table:', user.id, user.email);
      console.log('🔄 Attempting to sync user data from Auth to users table...');
      
      try {
        // Use service role to bypass RLS and create the user
        await syncUserFromAuthToDatabase(user.id, user.email!, {
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
          firstName: user.user_metadata?.first_name || user.user_metadata?.firstName || '',
          lastName: user.user_metadata?.last_name || user.user_metadata?.lastName || ''
        });
        
        // Try to get the user again after sync
        dbUser = await db.getUser(user.id);
        if (dbUser) {
          console.log('✅ User successfully synced to database:', dbUser.id);
        }
      } catch (syncError: any) {
        console.error('❌ Failed to sync user to database:', syncError.message);
        // Continue with authentication even if sync fails
        // This prevents blocking user access due to DB sync issues
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

// Register user with OTP
export async function registerUserWithOTP(email: string, userData: {
  username: string;
  firstName?: string;
  lastName?: string;
}) {
  try {
    // Send OTP to email using Supabase Auth
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: {
          username: userData.username,
          first_name: userData.firstName,
          last_name: userData.lastName,
          is_registration: true // Custom flag to identify registration
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('✅ OTP sent successfully to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ OTP registration error:', error);
    throw error;
  }
}

// Verify OTP and complete registration
export async function verifyOTPAndRegister(email: string, token: string, password: string, userData: {
  username: string;
  firstName?: string;
  lastName?: string;
}) {
  try {
    // Verify OTP
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Falha na verificação do código');
    }

    // Set password after OTP verification
    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError) {
      console.warn('Password update failed:', updateError.message);
    }

    // Sync user to database table (this is crucial for proper data consistency)
    console.log('🔄 Syncing user to database after OTP verification...');
    try {
      await syncUserFromAuthToDatabase(data.user.id, email, {
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName
      });
      console.log('✅ User synchronized to database successfully');
    } catch (syncError: any) {
      console.error('❌ Failed to sync user to database:', syncError.message);
      // Don't throw error here - user is registered in Auth, sync can be done later
      console.log('⚠️ User registered in Auth but not synced to database - will sync on first login');
    }

    console.log('✅ OTP verified and user registered:', email);
    return {
      user: data.user,
      session: data.session
    };
  } catch (error) {
    console.error('❌ OTP verification error:', error);
    throw error;
  }
}

// Keep original function for backward compatibility but redirect to OTP
export async function registerUser(email: string, password: string, userData: {
  username: string;
  firstName?: string;
  lastName?: string;
}) {
  // Redirect to OTP registration
  return registerUserWithOTP(email, userData);
}

// Login user with Supabase Auth
export async function loginUser(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('Credenciais inválidas');
    }

    console.log('✅ User logged in successfully:', email);
    return {
      user: data.user,
      session: data.session
    };
  } catch (error) {
    console.error('❌ Login error:', error);
    throw error;
  }
}

// Logout user
export async function logoutUser(token: string) {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }

    console.log('✅ User logged out successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Logout error:', error);
    throw error;
  }
}

// Reset password
export async function resetPassword(email: string) {
  try {
    console.log('🔍 Starting password reset process for:', email);
    
    // Check if user exists in our users table first
    const db = await getStorage();
    console.log('🗄️ Got storage instance');
    
    const userExists = await db.getUserByEmail(email);
    console.log('👤 Database user query result:', userExists ? 'User found' : 'User not found');
    console.log('📊 Full user data:', JSON.stringify(userExists, null, 2));
    
    if (!userExists) {
      // User doesn't exist in our database - account was deleted
      console.log('❌ User not found in database, throwing error');
      throw new Error('Nenhuma conta encontrada com este email');
    }

    console.log('✅ User found in database, proceeding with Supabase reset');
    
    // User exists in our database, proceed with password reset
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.BASE_URL || 'http://localhost:5000'}/reset-password`
    });

    if (error) {
      console.log('❌ Supabase reset password error:', error.message);
      // If Supabase also says user doesn't exist, it was deleted
      if (error.message.includes('User not found') || error.message.includes('not found')) {
        throw new Error('Nenhuma conta encontrada com este email');
      }
      throw new Error(error.message);
    }

    console.log('✅ Password reset email sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Password reset error:', error);
    throw error;
  }
}

// Get user profile
export async function getUserProfile(token: string) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error('Usuário não encontrado');
    }

    return user;
  } catch (error) {
    console.error('❌ Get user profile error:', error);
    throw error;
  }
}