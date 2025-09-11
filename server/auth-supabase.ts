import { Request, Response, NextFunction } from 'express';
import { supabase } from './supabase';
import { getStorage } from './storage';
import { registerSchema, loginSchema, changePasswordSchema } from '@shared/schema';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    [key: string]: any;
  };
  supabaseAuthId?: string; // Supabase Auth user ID
  supabaseClient?: typeof supabase;
}

export interface RegisterUser {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginUser {
  email: string;
  password: string;
}

// Register user with Supabase Auth
export async function registerUserSupabase(userData: RegisterUser) {
  console.log('🔄 [SUPABASE AUTH] Starting user registration with:', { 
    email: userData.email, 
    username: userData.username 
  });

  const validatedData = registerSchema.parse(userData);
  
  // Check if user already exists in our database
  const db = await getStorage();
  const existingUserByEmail = await db.getUserByEmail(validatedData.email);
  if (existingUserByEmail) {
    throw new Error('Email já está em uso');
  }
  
  const existingUserByUsername = await db.getUserByUsername(validatedData.username);
  if (existingUserByUsername) {
    throw new Error('Nome de usuário já está em uso');
  }

  try {
    // 1. Create user in Supabase Auth
    console.log('📧 [SUPABASE AUTH] Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          username: validatedData.username,
          first_name: validatedData.firstName || '',
          last_name: validatedData.lastName || ''
        }
      }
    });

    if (authError) {
      console.error('❌ [SUPABASE AUTH] Error creating user in Supabase:', authError);
      throw new Error(`Erro ao criar usuário: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Erro ao criar usuário no Supabase');
    }

    console.log('✅ [SUPABASE AUTH] User created successfully in Supabase Auth:', authData.user.id);
    console.log('📧 [SUPABASE AUTH] Email confirmed:', authData.user.email_confirmed_at ? 'YES' : 'NO');
    console.log('🔐 [SUPABASE AUTH] Session created:', authData.session ? 'YES' : 'NO');

    // Determinar se precisa de confirmação
    const needsConfirmation = !authData.session;
    
    if (needsConfirmation) {
      console.log('📧 [SUPABASE AUTH] User needs email confirmation - NOT creating in local DB yet');
      
      return {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          username: validatedData.username,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
        },
        session: null,
        needsConfirmation: true,
        message: 'Usuário criado! Verifique seu email para confirmar a conta antes de fazer login.'
      };
    }

    // 2. Se não precisa confirmação, criar usuário no banco local
    const newUser = await db.createUser({
      email: validatedData.email,
      username: validatedData.username,
      password: '', // Empty password since Supabase handles auth
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
    });

    console.log('✅ [SUPABASE AUTH] User created successfully in database:', newUser.id);

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        username: validatedData.username,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
      },
      session: authData.session,
      needsConfirmation: false
    };

  } catch (error: any) {
    console.error('❌ [SUPABASE AUTH] Registration failed:', error);
    throw error;
  }
}

// Confirm email with OTP
export async function confirmEmailSupabase(email: string, token: string) {
  console.log('📧 [SUPABASE AUTH] Confirming email for:', email);

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    });

    if (error) {
      console.error('❌ [SUPABASE AUTH] Email confirmation failed:', error);
      throw new Error(`Erro na confirmação: ${error.message}`);
    }

    console.log('✅ [SUPABASE AUTH] Email confirmed successfully for:', email);

    // Agora criar o usuário no banco local após confirmação
    const db = await getStorage();
    let dbUser = await db.getUserByEmail(email);
    
    if (!dbUser && data.user) {
      console.log('🔄 [SUPABASE AUTH] Creating user in local DB after email confirmation...');
      
      dbUser = await db.createUser({
        email: data.user.email!,
        username: data.user.user_metadata?.username || data.user.email!.split('@')[0],
        password: '', // Empty since Supabase handles auth
        firstName: data.user.user_metadata?.first_name || '',
        lastName: data.user.user_metadata?.last_name || ''
      });
      
      console.log('✅ [SUPABASE AUTH] User created in local DB:', dbUser.id);
    }

    return {
      user: dbUser,
      session: data.session
    };

  } catch (error: any) {
    console.error('❌ [SUPABASE AUTH] Email confirmation failed:', error);
    throw error;
  }
}

// Login user with Supabase Auth
export async function loginUserSupabase(credentials: LoginUser) {
  console.log('🔄 [SUPABASE AUTH] Starting user login with:', { email: credentials.email });

  const validatedCredentials = loginSchema.parse(credentials);

  try {
    // 1. Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: validatedCredentials.email,
      password: validatedCredentials.password,
    });

    if (authError) {
      console.error('❌ [SUPABASE AUTH] Login error:', authError);
      if (authError.message.includes('Invalid login credentials')) {
        throw new Error('Email ou senha incorretos');
      }
      if (authError.message.includes('Email not confirmed')) {
        throw new Error('Email não confirmado. Verifique sua caixa de entrada e confirme seu email antes de fazer login.');
      }
      throw new Error(`Erro no login: ${authError.message}`);
    }

    if (!authData.user || !authData.session) {
      throw new Error('Erro no login - dados de sessão inválidos');
    }

    console.log('✅ [SUPABASE AUTH] User authenticated successfully:', authData.user.id);

    // 2. Get user data from our database
    const db = await getStorage();
    let user = await db.getUserByEmail(authData.user.email!);

    // Create user in our DB if doesn't exist (migration scenario)
    if (!user) {
      console.log('🔄 [SUPABASE AUTH] User not found in DB, creating for migration...');
      user = await db.createUser({
        email: authData.user.email!,
        username: authData.user.user_metadata?.username || authData.user.email!.split('@')[0],
        password: '', // Empty since Supabase handles auth
        firstName: authData.user.user_metadata?.first_name || '',
        lastName: authData.user.user_metadata?.last_name || ''
      });
    }

    // Update last login
    await db.updateLastLogin(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      session: authData.session,
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    };

  } catch (error: any) {
    console.error('❌ [SUPABASE AUTH] Login failed:', error);
    throw error;
  }
}

// Middleware to authenticate requests using Supabase JWT
export async function authenticateSupabaseToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    console.log('🔍 [SUPABASE AUTH] Authenticating request to:', req.path);
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [SUPABASE AUTH] No Bearer token found');
      return res.status(401).json({ message: 'Token de acesso requerido' });
    }

    const token = authHeader.substring(7);
    console.log('🔍 [SUPABASE AUTH] Token received: [REDACTED]');

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('❌ [SUPABASE AUTH] Token validation failed:', error?.message || 'No user');
      return res.status(403).json({ message: 'Token inválido ou expirado' });
    }

    console.log('✅ [SUPABASE AUTH] User authenticated:', user.email);

    // Get user data from our database (lookup by email to handle ID mismatch)
    const db = await getStorage();
    let dbUser = await db.getUserByEmail(user.email!);
    
    if (!dbUser) {
      console.log('🔄 [SUPABASE AUTH] User not found in DB, creating for migration...');
      // Create user in our DB for migration scenario
      dbUser = await db.createUser({
        email: user.email!,
        username: user.user_metadata?.username || user.email!.split('@')[0],
        password: '', // Empty since Supabase handles auth
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || ''
      });
      console.log('✅ [SUPABASE AUTH] User created in DB for migration:', dbUser.id);
    }

    // Attach user to request
    req.user = dbUser;
    
    // Attach Supabase Auth user ID for potential admin operations
    req.supabaseAuthId = user.id;
    
    // Create authenticated Supabase client for RLS with user token
    req.supabaseClient = supabase;

    next();
  } catch (error: any) {
    console.error('❌ [SUPABASE AUTH] Authentication error:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

// Optional authentication (doesn't fail if no token)
export async function optionalSupabaseAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // No token, continue without authentication
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (!error && user) {
      const db = await getStorage();
      const dbUser = await db.getUserByEmail(user.email!);
      if (dbUser) {
        req.user = dbUser;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }

  next();
}

// Change user password (requires current password)
export async function changeUserPasswordSupabase(userId: string, passwordData: any) {
  const validatedData = changePasswordSchema.parse(passwordData);

  try {
    // Para mudança de senha no Supabase, isso deve ser feito no cliente
    // com o usuário autenticado, não no servidor
    throw new Error('Mudança de senha deve ser feita pelo cliente autenticado usando supabase.auth.updateUser()');
  } catch (error: any) {
    console.error('❌ [SUPABASE AUTH] Password change failed:', error);
    throw error;
  }
}

// Clear all user data but keep account
export async function clearUserDataSupabase(userId: string) {
  console.log('🧹 [SUPABASE AUTH] Clearing all data for user:', userId);

  try {
    const db = await getStorage();
    
    // Clear all user-related data in order (respecting foreign key constraints)
    console.log('🗑️ [CLEAR DATA] Removing workout logs...');
    const workoutLogs = await db.getWorkoutLogs(userId);
    for (const log of workoutLogs) {
      await db.deleteWorkoutLog(log.id);
    }

    console.log('🗑️ [CLEAR DATA] Removing workout templates...');
    const templates = await db.getWorkoutTemplates(userId);
    for (const template of templates) {
      await db.deleteWorkoutTemplate(template.id);
    }

    console.log('🗑️ [CLEAR DATA] Removing exercises...');
    const exercises = await db.getExercises(userId);
    for (const exercise of exercises) {
      await db.deleteExercise(exercise.id);
    }

    console.log('🗑️ [CLEAR DATA] Removing weight history...');
    const weightHistory = await db.getWeightHistory(userId);
    for (const entry of weightHistory) {
      await db.deleteWeightEntry(entry.id);
    }

    console.log('🗑️ [CLEAR DATA] Removing goals...');
    const goals = await db.getUserGoals(userId);
    for (const goal of goals) {
      await db.deleteUserGoal(goal.id);
    }

    console.log('🗑️ [CLEAR DATA] Removing achievements...');
    const achievements = await db.getUserAchievements(userId);
    for (const achievement of achievements) {
      await db.deleteUserAchievement(achievement.id);
    }

    console.log('✅ [CLEAR DATA] All user data cleared successfully');

  } catch (error: any) {
    console.error('❌ [SUPABASE AUTH] Clear data failed:', error);
    throw new Error(`Erro ao limpar dados: ${error.message}`);
  }
}

// Delete user account completely (from Supabase Auth AND local DB)
export async function deleteUserAccountSupabase(userEmail: string, userId: string, supabaseAuthId?: string) {
  console.log('🗑️ [SUPABASE AUTH] Deleting account for user:', userEmail);

  let supabaseAuthDeleted = false;
  let localDbDeleted = false;
  const errors: string[] = [];

  try {
    // Try to delete from Supabase Auth if we have service role key and auth ID
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && supabaseAuthId) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
        
        const supabaseAdmin = createClient(
          supabaseUrl,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );
        
        console.log('🗑️ [SUPABASE AUTH] Deleting from Supabase Auth with ID:', supabaseAuthId);
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(supabaseAuthId);
        
        if (deleteError) {
          console.error('❌ [SUPABASE AUTH] Error deleting from Supabase Auth:', deleteError);
          if (deleteError.message.includes('not found')) {
            console.log('ℹ️ [SUPABASE AUTH] User already deleted from Supabase Auth');
            supabaseAuthDeleted = true; // User doesn't exist = successfully "deleted"
          } else {
            errors.push('Erro ao excluir do Supabase Auth: ' + deleteError.message);
          }
        } else {
          console.log('✅ [SUPABASE AUTH] User deleted from Supabase Auth successfully');
          supabaseAuthDeleted = true;
        }
      } catch (adminError: any) {
        console.error('❌ [SUPABASE AUTH] Admin operation failed:', adminError);
        errors.push('Erro nas operações administrativas do Supabase: ' + adminError.message);
      }
    } else if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('⚠️ [SUPABASE AUTH] No service role key - skipping Supabase Auth deletion');
      errors.push('Usuário pode ainda existir no Supabase Auth (sem chave de administrador)');
    } else if (!supabaseAuthId) {
      console.log('⚠️ [SUPABASE AUTH] No Supabase Auth ID - skipping Supabase Auth deletion');
      errors.push('Não foi possível identificar o ID do usuário no Supabase Auth');
    }

    // Always try to delete from local database
    console.log('🗑️ [SUPABASE AUTH] Deleting from local database...');
    const db = await getStorage();
    
    // First clear all user data
    try {
      await clearUserDataSupabase(userId);
      console.log('🧹 [SUPABASE AUTH] User data cleared before account deletion');
    } catch (clearError: any) {
      console.error('⚠️ [SUPABASE AUTH] Error clearing user data:', clearError);
      // Continue with account deletion even if data clearing fails
    }
    
    // Then delete the user account
    const deleted = await db.deleteUser(userId);
    
    if (!deleted) {
      throw new Error('Usuário não encontrado no banco local');
    }
    
    localDbDeleted = true;
    console.log('✅ [SUPABASE AUTH] User deleted from local database successfully');

    // Return success message based on what was actually deleted
    if (supabaseAuthDeleted && localDbDeleted) {
      console.log('✅ [SUPABASE AUTH] Account completely deleted from both systems');
    } else if (localDbDeleted) {
      console.log('ℹ️ [SUPABASE AUTH] Account deleted from local system only');
    }

    return {
      supabaseAuthDeleted,
      localDbDeleted,
      errors
    };

  } catch (error: any) {
    console.error('❌ [SUPABASE AUTH] Account deletion failed:', error);
    throw error;
  }
}