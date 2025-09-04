import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff, Mail, Lock, LogIn, UserPlus, Dumbbell, ArrowRight, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { showSuccess } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/supabase-auth-context';
import { loginSchema, type LoginUser } from '@shared/schema';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [loginError, setLoginError] = useState<string>('');
  const { signIn } = useAuth();
  const [, setLocation] = useLocation();

  const form = useForm<LoginUser>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Clear error when user starts typing
  useEffect(() => {
    const subscription = form.watch(() => {
      if (loginError) {
        setLoginError('');
      }
    });
    return () => subscription.unsubscribe();
  }, [form, loginError]);

  const onSubmit = async (data: LoginUser) => {
    setLoading(true);
    setLoginError(''); // Clear any previous errors
    try {
      await signIn(data.email, data.password);
      showSuccess("Login realizado com sucesso!", "Bem-vindo de volta ao GymSeven");
      setLocation('/');
    } catch (error: any) {
      // Check for specific email not found error
      const errorMessage = error.message || "Email ou senha incorretos";
      setLoginError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex">
      {/* Left side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-slate-800/40"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-32 right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl animate-pulse delay-500"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center p-12 w-full">
          {/* Logo */}
          <div className="w-24 h-24 mb-8 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <Dumbbell className="w-12 h-12 text-white" />
          </div>
          
          {/* Hero Text */}
          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Bem-vindo ao <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">GymSeven</span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              Sua jornada fitness começa aqui. Transforme seus treinos em conquistas.
            </p>
            <div className="flex items-center justify-center space-x-8 pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">7+</div>
                <div className="text-sm text-slate-400">Grupos Musculares</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">∞</div>
                <div className="text-sm text-slate-400">Possibilidades</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">24/7</div>
                <div className="text-sm text-slate-400">Progresso</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center" style={{ paddingTop: '80px', paddingBottom: '130px', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div className={`w-full max-w-md transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {/* Mobile Logo */}
          <div className={`lg:hidden text-center mb-8 transition-all duration-1000 ease-out ${
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
                <CardTitle className="text-3xl font-bold text-white tracking-tight">Entrar</CardTitle>
                <CardDescription className="text-slate-300 text-lg mt-2">
                  Continue sua jornada fitness
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className={`transition-all duration-700 ease-out ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`} style={{transitionDelay: '600ms'}}>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 font-medium">Email</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors duration-300 group-focus-within:text-blue-400" />
                              <Input
                                {...field}
                                type="email"
                                placeholder="seu@email.com"
                                className="pl-12 h-12 bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-400/50 focus:ring-blue-400/20 rounded-xl transition-all duration-300 hover:bg-slate-800/70 focus:scale-[1.02]"
                                disabled={loading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className={`transition-all duration-700 ease-out ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`} style={{transitionDelay: '700ms'}}>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 font-medium">Senha</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors duration-300 group-focus-within:text-blue-400" />
                              <Input
                                {...field}
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Sua senha"
                                className="pl-12 pr-12 h-12 bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-400/50 focus:ring-blue-400/20 rounded-xl transition-all duration-300 hover:bg-slate-800/70 focus:scale-[1.02]"
                                disabled={loading}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-300 hover:scale-110"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={loading}
                              >
                                {showPassword ? <EyeOff className="w-4 h-4 transition-transform duration-300" /> : <Eye className="w-4 h-4 transition-transform duration-300" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Error Alert */}
                  {loginError && (
                    <div className={`bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-xl p-4 mb-4 backdrop-blur-sm transition-all duration-500 ease-out ${
                      loginError ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-red-300 mb-1">
                            {loginError.includes('não está cadastrado') ? 'Email Não Encontrado' : 'Falha no Login'}
                          </h3>
                          <p className="text-sm text-red-200/80 leading-relaxed">
                            {loginError}
                          </p>
                          {loginError.includes('não está cadastrado') ? (
                            <div className="mt-3 pt-3 border-t border-red-400/20">
                              <p className="text-xs text-red-200/70 mb-2">Deseja criar uma conta nova?</p>
                              <Link to="/register" className="text-xs text-blue-300 hover:text-blue-200 underline transition-colors">
                                Criar conta gratuita →
                              </Link>
                            </div>
                          ) : (
                            <p className="text-xs text-red-200/60 mt-2">
                              Verifique se o email e senha estão corretos e tente novamente.
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setLoginError('')}
                          className="flex-shrink-0 p-1 hover:bg-red-500/20 rounded-lg transition-colors duration-200"
                        >
                          <X className="w-4 h-4 text-red-400 hover:text-red-300" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={`transition-all duration-700 ease-out ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`} style={{transitionDelay: '800ms'}}>
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                      disabled={loading}
                    >
                    {loading ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Entrando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-3">
                        <LogIn className="w-5 h-5" />
                        <span>Entrar na Conta</span>
                      </div>
                    )}
                    </Button>
                  </div>
                </form>
              </Form>

              {/* Forgot Password Link */}
              <div className={`text-center transition-all duration-700 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`} style={{transitionDelay: '900ms'}}>
                <Link href="/forgot-password">
                  <Button 
                    variant="ghost" 
                    className="group relative text-slate-400 hover:text-blue-400 font-medium text-sm px-4 py-2 h-auto transition-all duration-300 hover:scale-105 hover:bg-blue-500/10 rounded-lg border border-transparent hover:border-blue-500/20 backdrop-blur-sm"
                  >
                    <span className="relative z-10 transition-all duration-300 group-hover:text-blue-300">
                      Esqueci minha senha
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg"></div>
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-lg blur-sm"></div>
                  </Button>
                </Link>
              </div>

              {/* Simple section divider with more spacing */}
              <div className="mt-12 mb-12 text-center">
                <p className="text-slate-400 text-sm font-medium mb-2">
                  Não tem uma conta ainda?
                </p>
              </div>

              {/* Register Button with improved design */}
              <Link href="/register">
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-slate-600/40 bg-gradient-to-r from-slate-800/30 to-slate-700/30 text-slate-200 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-600/50 hover:border-blue-400/50 hover:text-white rounded-xl transition-all duration-300 group backdrop-blur-sm"
                >
                  <div className="flex items-center justify-center space-x-3 w-full">
                    <UserPlus className="w-5 h-5 group-hover:text-blue-400 transition-colors" />
                    <span className="font-medium">Criar Nova Conta</span>
                  </div>
                </Button>
              </Link>

              {/* Footer Text */}
              <p className="text-center text-slate-400 text-sm leading-relaxed">
                Ao continuar, você concorda com nossos termos de uso e política de privacidade.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}