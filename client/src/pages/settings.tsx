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
  const { toast } = useToast();

  const preferencesForm = useForm<Preferences>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      theme: 'dark',
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
      // For now, just store in localStorage
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
    <div className="min-h-screen bg-slate-950 pt-24 pb-24">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-white flex items-center justify-center">
              <SettingsIcon className="mr-2 h-6 w-6" />
              Configurações
            </h1>
            <p className="text-slate-400">Personalize sua experiência no GymSeven</p>
          </div>

          {/* Appearance */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
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
                        <FormLabel className="text-slate-300">Tema</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                              <SelectValue placeholder="Selecione o tema" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="dark" className="text-white">
                              <div className="flex items-center">
                                <Moon className="mr-2 h-4 w-4" />
                                Escuro
                              </div>
                            </SelectItem>
                            <SelectItem value="light" className="text-white">
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
                        <FormLabel className="text-slate-300">Unidades</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                              <SelectValue placeholder="Sistema de unidades" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="metric" className="text-white">Métrico (kg, cm)</SelectItem>
                            <SelectItem value="imperial" className="text-white">Imperial (lb, ft)</SelectItem>
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
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
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
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-700 p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base text-white">
                            Notificações Push
                          </FormLabel>
                          <FormDescription className="text-slate-400">
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
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-700 p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base text-white flex items-center">
                            {field.value ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}
                            Efeitos Sonoros
                          </FormLabel>
                          <FormDescription className="text-slate-400">
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
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
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
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-700 p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base text-white">
                            Timer Automático
                          </FormLabel>
                          <FormDescription className="text-slate-400">
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
                        <FormLabel className="text-slate-300">Tempo de Descanso Padrão (segundos)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            className="bg-slate-800/50 border-slate-700 text-white"
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
                        <FormLabel className="text-slate-300 flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          Semana Inicia Em
                        </FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                              <SelectValue placeholder="Primeiro dia da semana" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="0" className="text-white">Domingo</SelectItem>
                            <SelectItem value="1" className="text-white">Segunda-feira</SelectItem>
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
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Alterar Senha</h3>
                    <p className="text-slate-400 text-sm">Mantenha sua conta segura</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    <Key className="mr-2 h-4 w-4" />
                    {showPasswordForm ? 'Cancelar' : 'Alterar'}
                  </Button>
                </div>

                {showPasswordForm && (
                  <Separator className="bg-slate-700" />
                )}

                {showPasswordForm && (
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300">Senha Atual</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                className="bg-slate-800/50 border-slate-700 text-white"
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
                            <FormLabel className="text-slate-300">Nova Senha</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                className="bg-slate-800/50 border-slate-700 text-white"
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
                            <FormLabel className="text-slate-300">Confirmar Nova Senha</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                className="bg-slate-800/50 border-slate-700 text-white"
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