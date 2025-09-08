import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'wouter';
import { Mail, ArrowLeft, Dumbbell, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Por favor, insira um email válido'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string>('');
  const { resetPassword } = useAuth();

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  useEffect(() => {
    setIsVisible(true);
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

  const onSubmit = async (data: ForgotPasswordData) => {
    setLoading(true);
    setError('');
    
    try {
      await resetPassword(data.email);
      setSubmitted(true);
    } catch (error: any) {
      setError(error.message || 'Erro ao enviar email de recuperação');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
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
              <CardTitle className="text-2xl font-bold text-white">Email Enviado!</CardTitle>
              <CardDescription className="text-slate-300 text-base">
                Instruções de recuperação foram enviadas para seu email
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 text-center">
              <div className="space-y-4">
                <p className="text-slate-400 text-sm leading-relaxed">
                  Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                </p>
                <p className="text-slate-500 text-xs">
                  Não esquece de verificar a pasta de spam também!
                </p>
              </div>

              <div className="space-y-3">
                <Link href="/login">
                  <Button 
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar ao Login
                  </Button>
                </Link>
                
                <Button 
                  variant="ghost"
                  onClick={() => {
                    setSubmitted(false);
                    form.reset();
                  }}
                  className="w-full text-slate-400 hover:text-blue-400 text-sm"
                >
                  Tentar outro email
                </Button>
              </div>
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
              <CardTitle className="text-3xl font-bold text-white tracking-tight">Esqueci minha senha</CardTitle>
              <CardDescription className="text-slate-300 text-base mt-2">
                Digite seu email para receber instruções de recuperação
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

                {/* Error Alert */}
                {error && (
                  <div className={`bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm transition-all duration-500 ease-out ${
                    error ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-red-300 mb-1">
                          Erro no envio
                        </h3>
                        <p className="text-sm text-red-200/80 leading-relaxed">
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className={`transition-all duration-700 ease-out ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`} style={{transitionDelay: '700ms'}}>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Enviando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-3">
                        <Send className="w-5 h-5" />
                        <span>Enviar Email de Recuperação</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </Form>

            {/* Back to Login */}
            <div className={`text-center transition-all duration-700 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`} style={{transitionDelay: '800ms'}}>
              <Link href="/login">
                <Button 
                  variant="ghost" 
                  className="text-slate-400 hover:text-blue-400 font-medium text-sm px-0 h-auto transition-all duration-300 hover:scale-105"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}