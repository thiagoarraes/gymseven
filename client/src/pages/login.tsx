import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { loginSchema, type LoginUser } from '@shared/schema';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<LoginUser>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginUser) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta ao GymSeven",
      });
      setLocation('/');
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Verifique suas credenciais",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md glassmorphism">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">Entrar</CardTitle>
            <CardDescription className="text-muted-foreground">
              Acesse sua conta do GymSeven
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
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
                    <FormLabel className="text-foreground">Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Sua senha"
                          className="pl-10 pr-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
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
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-2.5 transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Entrando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <LogIn className="w-4 h-4" />
                    <span>Entrar</span>
                  </div>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Não tem uma conta?{' '}
              <Link href="/register">
                <span className="text-primary hover:text-primary/80 font-medium cursor-pointer transition-colors">
                  Criar conta
                </span>
              </Link>
            </p>
          </div>

          <div className="mt-4 flex items-center justify-center">
            <Link href="/register">
              <Button variant="outline" className="w-full">
                <UserPlus className="w-4 h-4 mr-2" />
                Criar nova conta
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}