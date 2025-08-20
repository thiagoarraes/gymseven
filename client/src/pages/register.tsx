import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff, Mail, Lock, User, UserPlus, LogIn } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">Criar Conta</CardTitle>
            <CardDescription className="text-slate-400">
              Junte-se ao GymSeven e transforme seus treinos
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Nome</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="João"
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
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
                      <FormLabel className="text-slate-300">Sobrenome</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Silva"
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10"
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
                    <FormLabel>Nome de usuário</FormLabel>
                    <p className="text-xs text-muted-foreground mb-2">Apenas letras, números e underscore. Sem acentos ou espaços.</p>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          {...field}
                          placeholder="seunome123"
                          className="pl-10"
                          disabled={loading}
                          onChange={(e) => {
                            // Remove caracteres inválidos em tempo real
                            const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                            field.onChange(value);
                          }}
                          maxLength={20}
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
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mínimo 6 caracteres"
                          className="pl-10 pr-10"
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
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
                className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-semibold py-2.5 transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Criando conta...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Criar conta</span>
                  </div>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Já tem uma conta?{' '}
              <Link href="/login">
                <span className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer transition-colors">
                  Fazer login
                </span>
              </Link>
            </p>
          </div>

          <div className="mt-4 flex items-center justify-center">
            <Link href="/login">
              <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                <LogIn className="w-4 h-4 mr-2" />
                Entrar na conta
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}