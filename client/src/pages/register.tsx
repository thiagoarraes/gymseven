import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff, Mail, Lock, User, UserPlus, LogIn, Dumbbell, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { registerSchema, type RegisterUser } from '@shared/schema';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<RegisterUser>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      firstName: '',
      lastName: '',
    },
  });

  const onSubmit = async (data: RegisterUser) => {
    setLoading(true);
    try {
      await register(data);
      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao GymSeven! Sua jornada fitness começa agora.",
      });
      setLocation('/');
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex">
      {/* Left side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-blue-600/20 to-slate-800/40"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-32 right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl animate-pulse delay-500"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center p-12 w-full">
          {/* Logo */}
          <div className="w-24 h-24 mb-8 rounded-3xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <UserPlus className="w-12 h-12 text-white" />
          </div>
          
          {/* Hero Text */}
          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Junte-se ao <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">GymSeven</span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              Comece sua transformação hoje. Milhares já mudaram suas vidas conosco.
            </p>
            <div className="flex items-center justify-center space-x-8 pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">100+</div>
                <div className="text-sm text-slate-400">Exercícios</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">∞</div>
                <div className="text-sm text-slate-400">Templates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">Gratuito</div>
                <div className="text-sm text-slate-400">Para Sempre</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-xl">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">GymSeven</h1>
          </div>

          <Card className="glass-card border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-xl shadow-2xl">
            <CardHeader className="text-center space-y-4 pb-6">
              <div>
                <CardTitle className="text-3xl font-bold text-white tracking-tight">Criar Conta</CardTitle>
                <CardDescription className="text-slate-300 text-lg mt-2">
                  Inicie sua jornada fitness hoje
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 font-medium">Nome</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="João"
                              className="h-12 bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-emerald-400/50 focus:ring-emerald-400/20 rounded-xl"
                              disabled={loading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 font-medium">Sobrenome</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Silva"
                              className="h-12 bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-emerald-400/50 focus:ring-emerald-400/20 rounded-xl"
                              disabled={loading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200 font-medium">Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="seu@email.com"
                              className="pl-12 h-12 bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-emerald-400/50 focus:ring-emerald-400/20 rounded-xl"
                              disabled={loading}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200 font-medium">Nome de usuário</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <Input
                              {...field}
                              placeholder="seunome123"
                              className="pl-12 h-12 bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-emerald-400/50 focus:ring-emerald-400/20 rounded-xl"
                              disabled={loading}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200 font-medium">Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <Input
                              {...field}
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Sua senha"
                              className="pl-12 pr-12 h-12 bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-emerald-400/50 focus:ring-emerald-400/20 rounded-xl"
                              disabled={loading}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={loading}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Criando conta...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <UserPlus className="w-5 h-5" />
                        <span>Criar Conta</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </form>
              </Form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-600/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-slate-800/50 px-4 text-slate-400 font-medium">Já tem uma conta?</span>
                </div>
              </div>

              {/* Login Button */}
              <Link href="/login">
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-slate-600/50 bg-slate-800/30 text-white hover:bg-slate-700/50 hover:border-emerald-400/50 rounded-xl transition-all duration-300 group"
                >
                  <LogIn className="w-5 h-5 mr-3 group-hover:text-emerald-400 transition-colors" />
                  <span>Fazer Login</span>
                  <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
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