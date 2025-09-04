import type { Express } from "express";
import { registerUser, loginUser, logoutUser, resetPassword, getUserProfile, authenticateToken, type AuthRequest } from "./supabase-auth";

export function registerSupabaseAuthRoutes(app: Express) {
  // Register with Supabase Auth
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, username, firstName, lastName } = req.body;

      if (!email || !password || !username) {
        return res.status(400).json({ message: "Email, senha e nome de usuário são obrigatórios" });
      }

      const result = await registerUser(email, password, { username, firstName, lastName });
      
      res.status(201).json({
        message: "Conta criada com sucesso! Verifique seu email para ativar a conta.",
        user: result.user,
        session: result.session
      });
    } catch (error: any) {
      console.error('❌ Register error details:', error);
      
      if (error.message.includes('User already registered')) {
        res.status(409).json({ message: 'Este email já está cadastrado' });
      } else if (error.message.includes('Password should be at least')) {
        res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres' });
      } else if (error.message.includes('Invalid email')) {
        res.status(400).json({ message: 'Email inválido' });
      } else {
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  // Login with Supabase Auth
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      console.log('🔐 Supabase login attempt:', { email });
      const result = await loginUser(email, password);
      
      console.log('✅ Supabase login successful:', result.user.email);
      res.json({
        message: "Login realizado com sucesso!",
        user: result.user,
        session: result.session,
        access_token: result.session.access_token
      });
    } catch (error: any) {
      console.error('❌ Supabase login error:', error);
      
      if (error.message.includes('Invalid login credentials')) {
        res.status(401).json({ message: 'Credenciais inválidas' });
      } else if (error.message.includes('Email not confirmed')) {
        res.status(401).json({ message: 'Email não confirmado. Verifique sua caixa de entrada.' });
      } else {
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  // Get user profile
  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      res.json({ 
        user: req.user,
        isAuthenticated: true
      });
    } catch (error) {
      console.error('❌ Get user error:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Logout
  app.post("/api/auth/logout", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        await logoutUser(token);
      }

      res.json({ message: "Logout realizado com sucesso" });
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Reset password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      await resetPassword(email);
      
      res.json({ 
        message: "Email de redefinição de senha enviado. Verifique sua caixa de entrada." 
      });
    } catch (error: any) {
      console.error('❌ Reset password error:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Delete account and all user data
  app.delete("/api/auth/delete-account", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const userId = req.user.id;
      
      console.log(`🗑️ Iniciando exclusão completa da conta para usuário: ${userId}`);

      // Get storage instance directly from supabase-storage
      const { SupabaseStorage } = await import("./supabase-storage");
      const storage = new SupabaseStorage();

      // Delete all user data in sequence
      try {
        // Delete all user data using Supabase cascade delete
        console.log('🗑️ Deletando todos os dados do usuário via Supabase...');
        
        // Delete workout log sets (will cascade delete from workoutLogs)
        const { error: setsError } = await storage.supabase
          .from('workoutLogSets')
          .delete()
          .in('workoutLogId', 
            storage.supabase
              .from('workoutLogs')
              .select('id')
              .eq('user_id', userId)
          );
          
        if (setsError) {
          console.error('❌ Erro ao deletar workout sets:', setsError);
        }

        // Delete workout logs
        const { error: logsError } = await storage.supabase
          .from('workoutLogs')
          .delete()
          .eq('user_id', userId);
          
        if (logsError) {
          console.error('❌ Erro ao deletar workout logs:', logsError);
        }

        // Delete workout template exercises
        const { error: templateExError } = await storage.supabase
          .from('workoutTemplateExercises')
          .delete()
          .in('templateId', 
            storage.supabase
              .from('workoutTemplates')
              .select('id')
              .eq('user_id', userId)
          );
          
        if (templateExError) {
          console.error('❌ Erro ao deletar template exercises:', templateExError);
        }

        // Delete workout templates
        const { error: templatesError } = await storage.supabase
          .from('workoutTemplates')
          .delete()
          .eq('user_id', userId);
          
        if (templatesError) {
          console.error('❌ Erro ao deletar templates:', templatesError);
        }

        // Delete user exercises
        const { error: exercisesError } = await storage.supabase
          .from('exercises')
          .delete()
          .eq('user_id', userId);
          
        if (exercisesError) {
          console.error('❌ Erro ao deletar exercises:', exercisesError);
        }

        // Delete weight history
        const { error: weightError } = await storage.supabase
          .from('weightHistory')
          .delete()
          .eq('user_id', userId);
          
        if (weightError) {
          console.error('❌ Erro ao deletar weight history:', weightError);
        }

        // Delete user goals
        const { error: goalsError } = await storage.supabase
          .from('userGoals')
          .delete()
          .eq('user_id', userId);
          
        if (goalsError) {
          console.error('❌ Erro ao deletar goals:', goalsError);
        }

        // Delete user achievements
        const { error: achievementsError } = await storage.supabase
          .from('userAchievements')
          .delete()
          .eq('user_id', userId);
          
        if (achievementsError) {
          console.error('❌ Erro ao deletar achievements:', achievementsError);
        }

        // Delete user preferences
        const { error: prefsError } = await storage.supabase
          .from('userPreferences')
          .delete()
          .eq('user_id', userId);
          
        if (prefsError) {
          console.error('❌ Erro ao deletar preferences:', prefsError);
        }

        // Delete user record from database
        console.log('🗑️ Deletando registro do usuário...');
        await storage.deleteUser(userId);

        // Delete the user from Supabase Auth using admin API
        console.log('🗑️ Deletando conta do Supabase Auth...');
        const { error: authDeleteError } = await storage.supabase.auth.admin.deleteUser(userId);
        
        if (authDeleteError) {
          console.error('❌ Erro ao deletar do Supabase Auth:', authDeleteError.message);
          // Continue anyway - data was already deleted from our database
        } else {
          console.log('✅ Conta do Supabase Auth deletada com sucesso');
        }

        console.log('✅ Todos os dados do usuário foram excluídos com sucesso');

        res.json({ 
          message: "Conta e todos os dados foram excluídos permanentemente" 
        });
      } catch (deleteError: any) {
        console.error('❌ Erro ao deletar dados do usuário:', deleteError);
        throw new Error(`Erro ao deletar dados: ${deleteError.message}`);
      }
    } catch (error: any) {
      console.error('❌ Delete account error:', error);
      res.status(500).json({ 
        message: error.message || "Erro interno do servidor ao excluir conta" 
      });
    }
  });

  console.log('✅ Supabase Auth routes registered');
}