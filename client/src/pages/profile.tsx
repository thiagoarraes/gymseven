import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  User, Camera, Save, Calendar, Mail, AtSign, CalendarIcon, Upload, Trash2, AlertTriangle, RotateCcw,
  Settings as SettingsIcon, Moon, Sun, Bell, Volume2, Clock, Shield, Key, VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/supabase-auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useNotifications } from '@/hooks/use-notifications';
import { updateUserSchema, type UpdateUser, changePasswordSchema, type ChangePassword } from '@shared/schema';
import ImageCropModal from '@/components/ImageCropModal';
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

export default function Profile() {
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [clearDataDialogOpen, setClearDataDialogOpen] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const { user, updateProfile, deleteAccount, changePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { permission, isSupported, requestPermission, sendNotification, soundEffects } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format date helpers
  const formatDateForInput = (date: string | Date | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    // Use local timezone to avoid date shifting
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    // Parse as local date to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDateForDisplay = (date: string | Date | undefined): string => {
    if (!date) return '';
    try {
      const d = new Date(date);
      return format(d, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '';
    }
  };

  const form = useForm<UpdateUser>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      email: user?.email || '',
      username: user?.user_metadata?.username || '',
      firstName: user?.user_metadata?.first_name || '',
      lastName: user?.user_metadata?.last_name || '',
      dateOfBirth: user?.user_metadata?.date_of_birth ? formatDateForInput(user.user_metadata.date_of_birth) : undefined,
      height: user?.user_metadata?.height || undefined,
      weight: user?.user_metadata?.weight || undefined,
      activityLevel: user?.user_metadata?.activity_level || 'moderado',
    },
  });

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

  const passwordForm = useForm<ChangePassword>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Atualiza o valor do formulário quando o tema muda
  useEffect(() => {
    if (preferencesForm) {
      preferencesForm.setValue('theme', theme);
    }
  }, [theme, preferencesForm]);

  const onSubmit = async (data: UpdateUser) => {
    setLoading(true);
    try {
      // Convert string values to numbers for height and weight, dates to Date objects
      const processedData = {
        ...data,
        height: data.height ? Number(data.height) : undefined,
        weight: data.weight ? Number(data.weight) : undefined,
        dateOfBirth: data.dateOfBirth ? parseDate(data.dateOfBirth) : undefined,
      };
      
      await updateProfile?.(processedData);
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
        title: "Configurações salvas!",
        description: "Suas preferências foram atualizadas.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar configurações",
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
      await changePassword(data.currentPassword, data.newPassword);
      
      toast({
        title: "Senha alterada com sucesso!",
        description: "Sua senha foi atualizada.",
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

  const handleClearData = async () => {
    setClearingData(true);
    try {
      const response = await fetch('/api/auth/clear-data', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao limpar dados');
      }

      toast({
        title: "Dados limpos com sucesso!",
        description: "Todos os seus dados foram removidos. Sua conta foi zerada.",
      });
      
      setClearDataDialogOpen(false);
      // Refresh page to reset UI state
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Erro ao limpar dados",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setClearingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount?.();
      // Redirect immediately to login with success parameter
      window.location.href = '/login?accountDeleted=true';
    } catch (error: any) {
      toast({
        title: "Erro ao excluir conta",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const firstName = user.user_metadata?.first_name || "";
    const lastName = user.user_metadata?.last_name || "";
    const username = user.user_metadata?.username || user.email || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || username.charAt(0).toUpperCase() || "U";
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Use apenas arquivos JPEG, PNG ou WebP",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create image URL for crop modal
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setSelectedFileName(file.name);
    setCropModalOpen(true);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedImageBlob: Blob, fileName: string) => {
    setUploadingAvatar(true);
    setCropModalOpen(false);
    
    try {
      const formData = new FormData();
      formData.append('avatar', croppedImageBlob, fileName);

      const response = await fetch('/api/auth/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao fazer upload');
      }

      const result = await response.json();
      updateProfile?.(result.user);
      
      toast({
        title: "Avatar atualizado!",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar avatar",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      // Clean up the created URL
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
        setSelectedImage('');
      }
    }
  };

  const handleCropCancel = () => {
    // Clean up the created URL
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage('');
    }
    setCropModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt={user?.user_metadata?.username || user?.email || ""} />
                <AvatarFallback className="bg-blue-600 text-white text-2xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-card border-border hover:bg-accent"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                data-testid="button-upload-avatar"
              >
                {uploadingAvatar ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-avatar-file"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {user?.user_metadata?.first_name && user?.user_metadata?.last_name 
                  ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}` 
                  : user?.user_metadata?.username || user?.email}
              </h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {/* Tabs for Profile and Settings */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <SettingsIcon className="w-4 h-4" />
                <span>Configurações</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Informações Pessoais
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Atualize suas informações pessoais
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      {/* Email e Username */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground flex items-center">
                              <Mail className="mr-2 h-4 w-4" />
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ''}
                                type="email"
                                className="bg-card border-border text-foreground"
                                disabled={loading}
                              />
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
                            <FormLabel className="text-foreground flex items-center">
                              <AtSign className="mr-2 h-4 w-4" />
                              Nome de usuário
                            </FormLabel>
                            <p className="text-xs text-muted-foreground mb-2">Apenas letras, números e underscore. Sem acentos ou espaços.</p>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ''}
                                className="bg-card border-border text-foreground"
                                disabled={loading}
                                onChange={(e) => {
                                  // Remove caracteres inválidos em tempo real
                                  const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                                  field.onChange(value);
                                }}
                                maxLength={20}
                                placeholder="seunome123"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Nome e Sobrenome */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">Nome</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ''}
                                  className="bg-card border-border text-foreground"
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
                              <FormLabel className="text-foreground">Sobrenome</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ''}
                                  className="bg-card border-border text-foreground"
                                  disabled={loading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>


                      <Button
                        type="submit"
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
                            <span>Salvar Perfil</span>
                          </div>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Zona de Perigo */}
              <Card className="glassmorphism border-destructive/20">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Zona de Perigo
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Ações irreversíveis com seus dados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Limpar Dados */}
                  <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                    <div>
                      <h3 className="text-foreground font-medium">Limpar Todos os Dados</h3>
                      <p className="text-muted-foreground text-sm">Remove todos os treinos, exercícios e configurações (mantém a conta)</p>
                    </div>
                    <Dialog open={clearDataDialogOpen} onOpenChange={setClearDataDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Limpar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glassmorphism">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">Confirmar Limpeza de Dados</DialogTitle>
                          <DialogDescription className="text-muted-foreground">
                            Esta ação irá remover TODOS os seus dados do aplicativo (treinos, exercícios, configurações). 
                            Sua conta será mantida, mas todos os dados serão perdidos permanentemente.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setClearDataDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button variant="destructive" onClick={handleClearData} disabled={clearingData}>
                            {clearingData ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Limpando...</span>
                              </div>
                            ) : (
                              "Confirmar Limpeza"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Excluir Conta */}
                  <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                    <div>
                      <h3 className="text-foreground font-medium">Excluir Conta</h3>
                      <p className="text-muted-foreground text-sm">Remove permanentemente sua conta e todos os dados</p>
                    </div>
                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glassmorphism">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">Confirmar Exclusão de Conta</DialogTitle>
                          <DialogDescription className="text-muted-foreground">
                            Esta ação é IRREVERSÍVEL. Sua conta e todos os dados associados serão 
                            permanentemente removidos de nossos servidores.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting}>
                            {deleting ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Excluindo...</span>
                              </div>
                            ) : (
                              "Confirmar Exclusão"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              {/* Theme Selector */}
              <Card className="glassmorphism mb-4">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <Sun className="mr-2 h-5 w-5" />
                    Aparência
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card className="glassmorphism mb-4">
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
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={handleCropCancel}
        imageSrc={selectedImage}
        fileName={selectedFileName}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}