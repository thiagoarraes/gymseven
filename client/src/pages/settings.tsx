import { useState } from 'react';
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
import { changePasswordSchema, type ChangePassword } from '@shared/schema';
import { z } from 'zod';

// Simple preferences schema
const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark']).default('dark'),
  units: z.enum(['metric', 'imperial']).default('metric'),
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

  const preferencesForm = useForm<Preferences>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      theme: theme,
      units: 'metric',
      language: 'pt-BR',
      notifications: true,
      soundEffects: true,
      restTimerAutoStart: true,
      defaultRestTime: 90,
      weekStartsOn: 1,
    },
  });

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
    <div className="min-h-screen bg-background pt-24 pb-24">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground flex items-center justify-center">
              <SettingsIcon className="mr-2 h-6 w-6" />
              Configurações
            </h1>
            <p className="text-muted-foreground">Personalize sua experiência no GymSeven</p>
          </div>

          {/* Appearance */}
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Moon className="mr-2 h-5 w-5" />
                Aparência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...preferencesForm}>
                <form onSubmit={preferencesForm.handleSubmit(onSubmitPreferences)} className="space-y-4">
                  <FormField
                    control={preferencesForm.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Tema</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={theme} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-card border-border text-foreground">
                              <SelectValue placeholder="Selecione o tema" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="dark" className="text-foreground">
                              <div className="flex items-center">
                                <Moon className="mr-2 h-4 w-4" />
                                Escuro
                              </div>
                            </SelectItem>
                            <SelectItem value="light" className="text-foreground">
                              <div className="flex items-center">
                                <Sun className="mr-2 h-4 w-4" />
                                Claro
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={preferencesForm.control}
                    name="units"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Unidades</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-card border-border text-foreground">
                              <SelectValue placeholder="Sistema de unidades" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="metric" className="text-foreground">Métrico (kg, cm)</SelectItem>
                            <SelectItem value="imperial" className="text-foreground">Imperial (lb, ft)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notificações
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
                          <FormLabel className="text-base text-foreground">
                            Notificações Push
                          </FormLabel>
                          <FormDescription className="text-muted-foreground">
                            Receba lembretes sobre treinos e metas
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={preferencesForm.control}
                    name="soundEffects"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base text-foreground flex items-center">
                            {field.value ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}
                            Efeitos Sonoros
                          </FormLabel>
                          <FormDescription className="text-muted-foreground">
                            Sons de feedback durante o treino
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
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
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base text-foreground">
                            Timer Automático
                          </FormLabel>
                          <FormDescription className="text-muted-foreground">
                            Iniciar timer de descanso automaticamente
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
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