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

  console.log('✅ Supabase Auth routes registered');
}