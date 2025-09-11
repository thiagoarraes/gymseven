import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setIsVisible(true);

    // Check if we're in a password reset session
    const checkSession = async () => {
      try {
        // Check if there's a code parameter in the URL (Supabase recovery flow)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        
        // Handle code-based recovery (newer Supabase flow)
        if (code) {
          console.log('🔄 Exchanging code for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('❌ Code exchange error:', error);
            setError('Link de recuperação inválido ou expirado');
            return;
          }
          
          if (data.session) {
            console.log('✅ Valid recovery session established');
            return;
          }
        }
        
        // Handle hash-based recovery (legacy flow)
        if (accessToken && refreshToken) {
          console.log('🔄 Setting session from hash parameters...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('❌ Session set error:', error);
            setError('Link de recuperação inválido ou expirado');
            return;
          }
          
          if (data.session) {
            console.log('✅ Valid recovery session established');
            return;
          }
        }
        
        // Check existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          setError('Link de recuperação inválido ou expirado');
          return;
        }

        if (!session) {
          setError('Link de recuperação inválido ou expirado. Certifique-se de que você clicou no link correto do email.');
          return;
        }

        console.log('✅ Valid reset session found');
      } catch (error) {
        console.error('❌ Session check error:', error);
        setError('Erro ao verificar sessão de recuperação');
      }
    };

    checkSession();
  }, []);

  // Clear error when user starts typing
  useEffect(() => {
    const subscription = form.watch(() => {
      if (error) {
        setError('');
      }
    });
    return () => subscription.unsubscribe();
  }, [form, error]);

  const onSubmit = async (data: ResetPasswordData) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔄 Updating password with Supabase...');
      
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) {
        console.error('❌ Password update error:', error);
        setError(error.message || 'Erro ao alterar senha');
        return;
      }

      console.log('✅ Password updated successfully');
      setSuccess(true);
      
      toast({
        title: "Senha alterada!",
        description: "Sua senha foi alterada com sucesso.",
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error: any) {
      console.error('❌ Reset password error:', error);
      setError(error.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-6">
        <div className={`w-full max-w-md transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <Card className="glass-card border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-xl shadow-2xl">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">Senha Alterada!</CardTitle>
              <CardDescription className="text-slate-300 text-base">
                Sua senha foi alterada com sucesso
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 text-center">
              <div className="space-y-4">
                <p className="text-slate-400 text-sm leading-relaxed">
                  Você será redirecionado para a página de login em alguns segundos.
                </p>
                <p className="text-slate-500 text-xs">
                  Ou clique no botão abaixo para ir agora.
                </p>
              </div>

              <Button 
                onClick={() => navigate('/login')}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                Ir para Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-6">
      <div className={`w-full max-w-md transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        {/* Mobile Logo */}
        <div className={`text-center mb-8 transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`} style={{transitionDelay: '200ms'}}>
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl transition-all duration-700 ease-out hover:scale-110 hover:rotate-3 ${
            isVisible ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-12'
          }`} style={{transitionDelay: '100ms'}}>
            <Dumbbell className="w-8 h-8 text-white transition-transform duration-300 hover:rotate-12" />
          </div>
          <h1 className={`text-2xl font-bold text-white transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`} style={{transitionDelay: '300ms'}}>GymSeven</h1>
        </div>

        <Card className={`glass-card border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-xl shadow-2xl transition-all duration-1000 ease-out hover:shadow-3xl hover:bg-slate-800/50 ${
          isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
        }`} style={{transitionDelay: '400ms'}}>
          <CardHeader className="text-center space-y-4 pb-6">
            <div>
              <CardTitle className="text-3xl font-bold text-white tracking-tight">Nova Senha</CardTitle>
              <CardDescription className="text-slate-300 text-base mt-2">
                Digite sua nova senha
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className={`flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg transition-all duration-700 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`} style={{transitionDelay: '500ms'}}>
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className={`transition-all duration-700 ease-out ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`} style={{transitionDelay: '600ms'}}>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200 font-medium">Nova Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Digite sua nova senha"
                              className="h-12 pl-10 pr-12 bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                              data-testid="input-new-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors duration-200"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400 text-sm mt-1" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className={`transition-all duration-700 ease-out ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`} style={{transitionDelay: '700ms'}}>
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200 font-medium">Confirmar Nova Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                            <Input
                              {...field}
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirme sua nova senha"
                              className="h-12 pl-10 pr-12 bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                              data-testid="input-confirm-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors duration-200"
                            >
                              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400 text-sm mt-1" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className={`transition-all duration-700 ease-out ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`} style={{transitionDelay: '800ms'}}>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed"
                    data-testid="button-submit"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        Alterando senha...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Alterar Senha
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}