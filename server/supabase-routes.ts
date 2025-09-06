import type { Express } from "express";
import { supabase } from "./supabase-client";
import { registerUser, registerUserWithOTP, verifyOTPAndRegister, loginUser, logoutUser, resetPassword, getUserProfile, authenticateToken, type AuthRequest } from "./supabase-auth";

export function registerSupabaseAuthRoutes(app: Express) {
  // Register with OTP
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, username, firstName, lastName } = req.body;

      if (!email || !username) {
        return res.status(400).json({ message: "Email e nome de usuário são obrigatórios" });
      }

      const result = await registerUserWithOTP(email, { username, firstName, lastName });
      
      res.status(201).json({
        message: "Código de verificação enviado! Verifique seu email e digite o código de 6 dígitos.",
        success: result.success,
        email: email
      });
    } catch (error: any) {
      console.error('❌ Register error details:', error);
      
      if (error.message.includes('User already registered')) {
        res.status(409).json({ message: 'Este email já está cadastrado' });
      } else if (error.message.includes('Invalid email')) {
        res.status(400).json({ message: 'Email inválido' });
      } else {
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  // Verify OTP and complete registration
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, token, password, username, firstName, lastName } = req.body;

      if (!email || !token || !password) {
        return res.status(400).json({ message: "Email, código e senha são obrigatórios" });
      }

      if (token.length !== 6) {
        return res.status(400).json({ message: "O código deve ter 6 dígitos" });
      }

      const result = await verifyOTPAndRegister(email, token, password, { username, firstName, lastName });
      
      res.status(201).json({
        message: "Conta criada e verificada com sucesso!",
        user: result.user,
        session: result.session,
        access_token: result.session?.access_token
      });
    } catch (error: any) {
      console.error('❌ OTP verification error:', error);
      
      if (error.message.includes('Token has expired')) {
        res.status(400).json({ message: 'Código expirado. Solicite um novo código.' });
      } else if (error.message.includes('Invalid token')) {
        res.status(400).json({ message: 'Código inválido. Verifique os 6 dígitos.' });
      } else if (error.message.includes('Password should be at least')) {
        res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres' });
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

  // Change password
  app.post("/api/auth/change-password", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Senha atual e nova senha são obrigatórias" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "A nova senha deve ter pelo menos 6 caracteres" });
      }

      // First verify current password by attempting to sign in with it
      if (!supabase) {
        return res.status(500).json({ message: "Supabase não configurado" });
      }
      
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: req.user.email!,
        password: currentPassword
      });

      if (verifyError) {
        return res.status(400).json({ message: "Senha atual incorreta" });
      }

      // Update password using admin privileges
      if (!supabase) {
        return res.status(500).json({ message: "Supabase não configurado" });
      }
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        req.user.id,
        { password: newPassword }
      );

      if (updateError) {
        console.error('❌ Password update error:', updateError);
        return res.status(500).json({ message: "Erro ao atualizar senha" });
      }

      console.log('✅ Password changed successfully for user:', req.user.email);
      res.json({ message: "Senha alterada com sucesso!" });
    } catch (error: any) {
      console.error('❌ Change password error:', error);
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
        // Delete all user data using direct Supabase queries
        console.log('🗑️ Deletando todos os dados do usuário via Supabase...');
        
        // First get workout log IDs to delete sets
        const { data: workoutLogIds } = await storage.supabase
          .from('workoutLogs')
          .select('id')
          .eq('user_id', userId);

        if (workoutLogIds && workoutLogIds.length > 0) {
          const logIds = workoutLogIds.map((log: any) => log.id);
          
          // Delete workout log sets
          const { error: setsError } = await storage.supabase
            .from('workoutLogSets')
            .delete()
            .in('workoutLogId', logIds);
            
          if (setsError) {
            console.error('❌ Erro ao deletar workout sets:', setsError);
          }
        }

        // Get template IDs to delete template exercises
        const { data: templateIds } = await storage.supabase
          .from('workoutTemplates')
          .select('id')
          .eq('user_id', userId);

        if (templateIds && templateIds.length > 0) {
          const tempIds = templateIds.map((template: any) => template.id);
          
          // Delete workout template exercises
          const { error: templateExError } = await storage.supabase
            .from('workoutTemplateExercises')
            .delete()
            .in('templateId', tempIds);
            
          if (templateExError) {
            console.error('❌ Erro ao deletar template exercises:', templateExError);
          }
        }

        // Delete all user data directly by user_id (only existing tables)
        const deletions = [
          { table: 'workoutLogs', name: 'workout logs' },
          { table: 'workoutTemplates', name: 'templates' },
          { table: 'exercises', name: 'exercises' }
        ];

        for (const deletion of deletions) {
          const { error } = await storage.supabase
            .from(deletion.table)
            .delete()
            .eq('user_id', userId);
            
          if (error) {
            console.error(`❌ Erro ao deletar ${deletion.name}:`, error);
          } else {
            console.log(`✅ ${deletion.name} deletados com sucesso`);
          }
        }

        // Step 1: Delete from Supabase Auth first (this is the source of truth)
        console.log('🗑️ Deletando conta do Supabase Auth...');
        const { error: authDeleteError } = await storage.supabase.auth.admin.deleteUser(userId);
        
        if (authDeleteError) {
          console.error('❌ Erro ao deletar do Supabase Auth:', authDeleteError.message);
          throw new Error(`Falha ao deletar conta do Supabase Auth: ${authDeleteError.message}`);
        }
        console.log('✅ Conta do Supabase Auth deletada com sucesso');

        // Step 2: Delete user record from users table (synchronize with Auth deletion)
        console.log('🗑️ Sincronizando: deletando registro da tabela users...');
        const { error: userDeleteError } = await storage.supabase
          .from('users')
          .delete()
          .eq('id', userId);
          
        if (userDeleteError) {
          console.error('❌ Erro ao sincronizar exclusão na tabela users:', userDeleteError);
          // This is more serious now - we have a desync between Auth and database
          console.error('⚠️ ATENÇÃO: Desincronização detectada - usuário removido do Auth mas permanece na tabela users');
        } else {
          console.log('✅ Sincronização completa: usuário removido da tabela users');
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