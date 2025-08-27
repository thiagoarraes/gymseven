import { useState } from 'react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Bell, 
  Volume2, 
  Clock, 
  Calendar,
  Shield,
  Key,
  Save,
  VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useNotifications } from '@/hooks/use-notifications';
import { changePasswordSchema, type ChangePassword } from '@shared/schema';
import { z } from 'zod';

// Simple preferences schema
const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark']).default('dark'),
  language: z.string().default('pt-BR'),
  notifications: z.boolean().default(true),
  soundEffects: z.boolean().default(true),
  restTimerAutoStart: z.boolean().default(true),
  defaultRestTime: z.number().default(90),
  weekStartsOn: z.number().default(1),
});

type Preferences = z.infer<typeof preferencesSchema>;

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const { user, token } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { permission, isSupported, requestPermission, sendNotification, soundEffects } = useNotifications();

  const preferencesForm = useForm<Preferences>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      theme: theme,
      language: 'pt-BR',
      notifications: true,
      soundEffects: true,
      restTimerAutoStart: true,
      defaultRestTime: 90,
      weekStartsOn: 1,
    },
  });

  // Atualiza o valor do formulário quando o tema muda
  React.useEffect(() => {
    preferencesForm.setValue('theme', theme);
  }, [theme, preferencesForm]);

  const passwordForm = useForm<ChangePassword>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmitPreferences = async (data: Preferences) => {
    setLoading(true);
    try {
      // Update theme if changed
      if (data.theme !== theme) {
        setTheme(data.theme);
      }
      
      // Store preferences in localStorage
      localStorage.setItem('userPreferences', JSON.stringify(data));
      
      toast({
        title: "Preferências salvas!",
        description: "Suas configurações foram atualizadas.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar preferências",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitPassword = async (data: ChangePassword) => {
    setLoading(true);
    try {
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "A alteração de senha estará disponível em breve.",
        variant: "default",
      });
      
      passwordForm.reset();
      setShowPasswordForm(false);
    } catch (error: any) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="space-y-4">
          {/* Header com seletor de tema */}
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground flex items-center justify-center">
              <SettingsIcon className="mr-2 h-6 w-6" />
              Configurações
            </h1>
            <p className="text-muted-foreground">Personalize sua experiência no GymSeven</p>
            
            {/* Seletor de Tema Compacto */}
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm text-muted-foreground">Tema:</span>
              <div className="flex bg-muted rounded-lg p-1">
                <Button
                  variant={theme === 'dark' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="flex items-center space-x-2 px-3 py-1.5 text-xs"
                >
                  <Moon className="w-3 h-3" />
                  <span>Escuro</span>
                </Button>
                <Button
                  variant={theme === 'light' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="flex items-center space-x-2 px-3 py-1.5 text-xs"
                >
                  <Sun className="w-3 h-3" />
                  <span>Claro</span>
                </Button>
              </div>
            </div>
          </div>


          {/* Notifications */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Notificações
                </div>
                {isSupported && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      sendNotification({
                        title: '🧪 Teste de notificação',
                        body: 'Se você viu isso, as notificações estão funcionando!',
                        tag: 'test-notification'
                      });
                    }}
                    disabled={permission !== 'granted'}
                  >
                    Testar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...preferencesForm}>
                <div className="space-y-4">
                  <FormField
                    control={preferencesForm.control}
                    name="notifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base text-foreground flex items-center">
                            <Bell className="mr-2 h-4 w-4" />
                            Notificações Push
                            {!isSupported && (
                              <span className="ml-2 text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
                                Não suportado
                              </span>
                            )}
                            {isSupported && permission === 'denied' && (
                              <span className="ml-2 text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
                                Bloqueado
                              </span>
                            )}
                            {isSupported && permission === 'granted' && field.value && (
                              <span className="ml-2 text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">
                                Ativo
                              </span>
                            )}
                          </FormLabel>
                          <FormDescription className="text-muted-foreground">
                            {!isSupported 
                              ? 'Seu navegador não suporta notificações push'
                              : permission === 'denied'
                              ? 'Ative as notificações nas configurações do navegador'
                              : 'Receba lembretes sobre treinos e descanso'
                            }
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value && permission === 'granted'}
                            disabled={!isSupported}
                            onCheckedChange={async (checked) => {
                              if (checked && permission !== 'granted') {
                                const granted = await requestPermission();
                                if (granted) {
                                  field.onChange(true);
                                  // Testar notificação
                                  setTimeout(() => {
                                    sendNotification({
                                      title: '🎉 Notificações ativadas!',
                                      body: 'Você receberá alertas sobre seus treinos.',
                                      tag: 'welcome-notification'
                                    });
                                  }, 1000);
                                } else {
                                  field.onChange(false);
                                }
                              } else {
                                field.onChange(checked);
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={preferencesForm.control}
                    name="soundEffects"
                    render={({ field }) => (
                      <FormItem className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border p-4 space-y-3 sm:space-y-0">
                        <div className="space-y-1 flex-1">
                          <FormLabel className="text-base text-foreground flex items-center flex-wrap gap-2">
                            {field.value ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                            <span>Efeitos Sonoros</span>
                            {!soundEffects.isSupported && (
                              <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
                                Não suportado
                              </span>
                            )}
                            {soundEffects.isSupported && field.value && (
                              <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">
                                Ativo
                              </span>
                            )}
                          </FormLabel>
                          <FormDescription className="text-muted-foreground text-sm">
                            {soundEffects.isSupported 
                              ? 'Sons de feedback durante treinos e descanso'
                              : 'Seu navegador não suporta áudio'
                            }
                          </FormDescription>
                        </div>
                        <FormControl>
                          <div className="flex items-center justify-end gap-3 sm:flex-shrink-0">
                            <Switch
                              checked={field.value && soundEffects.isSupported}
                              disabled={!soundEffects.isSupported}
                              onCheckedChange={field.onChange}
                              className="shrink-0"
                            />
                            {field.value && soundEffects.isSupported && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => soundEffects.testSound()}
                                className="text-xs px-3 py-1 h-7 shrink-0"
                              >
                                Testar
                              </Button>
                            )}
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
            </CardContent>
          </Card>

          {/* Workout Settings */}
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Configurações de Treino
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...preferencesForm}>
                <div className="space-y-4">
                  <FormField
                    control={preferencesForm.control}
                    name="restTimerAutoStart"
                    render={({ field }) => (
                      <FormItem className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border p-4 space-y-3 sm:space-y-0">
                        <div className="space-y-1 flex-1">
                          <FormLabel className="text-base text-foreground">
                            Timer Automático
                          </FormLabel>
                          <FormDescription className="text-muted-foreground text-sm">
                            Iniciar timer de descanso automaticamente
                          </FormDescription>
                        </div>
                        <FormControl>
                          <div className="flex justify-end sm:flex-shrink-0">
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="shrink-0"
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={preferencesForm.control}
                    name="defaultRestTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Tempo de Descanso Padrão (segundos)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            className="bg-card border-border text-foreground"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={preferencesForm.control}
                    name="weekStartsOn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          Semana Inicia Em
                        </FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger className="bg-card border-border text-foreground">
                              <SelectValue placeholder="Primeiro dia da semana" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="0" className="text-foreground">Domingo</SelectItem>
                            <SelectItem value="1" className="text-foreground">Segunda-feira</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    onClick={preferencesForm.handleSubmit(onSubmitPreferences)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Salvando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Save className="w-4 h-4" />
                        <span>Salvar Configurações</span>
                      </div>
                    )}
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-foreground font-medium">Alterar Senha</h3>
                    <p className="text-muted-foreground text-sm">Mantenha sua conta segura</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="border-border text-foreground hover:bg-accent"
                  >
                    <Key className="mr-2 h-4 w-4" />
                    {showPasswordForm ? 'Cancelar' : 'Alterar'}
                  </Button>
                </div>

                {showPasswordForm && (
                  <Separator className="bg-border" />
                )}

                {showPasswordForm && (
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Senha Atual</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                className="bg-card border-border text-foreground"
                                disabled={loading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Nova Senha</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                className="bg-card border-border text-foreground"
                                disabled={loading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Confirmar Nova Senha</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                className="bg-card border-border text-foreground"
                                disabled={loading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Alterando...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Key className="w-4 h-4" />
                            <span>Alterar Senha</span>
                          </div>
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}