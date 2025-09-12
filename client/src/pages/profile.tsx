import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  User, Camera, Save, Calendar, Mail, AtSign, CalendarIcon, Upload, Trash2, AlertTriangle, RotateCcw,
  Settings as SettingsIcon, Moon, Sun, Bell, Volume2, Clock, VolumeX, XCircle, CheckCircle, Info, Smartphone, HelpCircle
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
import { useTheme } from '@/contexts/theme-context';
import { useNotifications } from '@/hooks/use-notifications';
import { useAuth } from '@/contexts/auth-context-new';
import { updateUserSchema, type UpdateUser } from '@shared/schema';
import ImageCropModal from '@/components/ImageCropModal';
import { IOSNotificationGuide } from '@/components/ios-notification-guide';
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
  
  // Estado para controle do modal de status
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalData, setStatusModalData] = useState<{
    title: string;
    description: string;
    status: 'active' | 'blocked' | 'unsupported';
    icon: 'CheckCircle' | 'AlertTriangle' | 'XCircle';
  } | null>(null);
  const { user, updateProfile, deleteAccount } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { permission, isSupported, supportStatus, requestPermission, sendNotification, soundEffects, refreshSupport } = useNotifications();
  
  // Estado para o modal de guia iOS
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  
  // Função para tentar nova detecção
  const retryDetection = () => {
    refreshSupport(); // Recarrega detecção sem reload da página
  };

  // Função para abrir modal de status
  const openStatusModal = (type: 'notifications' | 'sound', status: 'active' | 'blocked' | 'unsupported') => {
    const data = {
      notifications: {
        active: {
          title: 'Notificações Ativas',
          description: 'As notificações push estão funcionando corretamente. Você receberá alertas sobre treinos, lembretes de descanso e outras informações importantes do app.',
          icon: 'CheckCircle' as const
        },
        blocked: {
          title: 'Notificações Bloqueadas',
          description: 'Você negou a permissão para notificações. Para reativar, vá nas configurações do seu navegador, encontre este site e permita as notificações. Depois volte aqui e ative novamente.',
          icon: 'AlertTriangle' as const
        },
        unsupported: {
          title: 'Notificações Não Suportadas',
          description: 'Seu navegador não suporta notificações push. Considere atualizar para uma versão mais recente ou usar um navegador moderno como Chrome, Firefox ou Safari.',
          icon: 'XCircle' as const
        }
      },
      sound: {
        active: {
          title: 'Efeitos Sonoros Ativos',
          description: 'Os sons de feedback estão habilitados. Você ouvirá sons durante treinos, alertas de descanso e outras interações do app para uma experiência mais imersiva.',
          icon: 'CheckCircle' as const
        },
        blocked: {
          title: 'Efeitos Sonoros Desativados',
          description: 'Os efeitos sonoros estão desligados. Você pode ativá-los a qualquer momento para receber feedback sonoro durante os treinos.',
          icon: 'AlertTriangle' as const
        },
        unsupported: {
          title: 'Áudio Não Suportado',
          description: 'Seu navegador não suporta reprodução de áudio ou está com o áudio desabilitado. Verifique as configurações do navegador ou considere usar um navegador moderno.',
          icon: 'XCircle' as const
        }
      }
    };

    setStatusModalData({
      ...data[type][status],
      status
    });
    setStatusModalOpen(true);
  };
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
      username: user?.username || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      dateOfBirth: user?.dateOfBirth ? formatDateForInput(user.dateOfBirth) : undefined,
      height: user?.height || undefined,
      weight: user?.weight || undefined,
      activityLevel: user?.activityLevel || 'moderado',
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
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const username = user.username || user.email || "";
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
                <AvatarImage src={user?.profileImageUrl || ""} alt={user?.username || user?.email || ""} />
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
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.username || user?.email}
              </h1>
              <p className="text-muted-foreground">{user?.email}</p>
              {user?.username && (
                <p className="text-sm text-muted-foreground/80">@{user.username}</p>
              )}
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
                <CardContent className="space-y-4 sm:space-y-6">
                  {/* Limpar Dados */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border border-destructive/20 rounded-lg space-y-4 sm:space-y-0">
                    <div className="flex-1 pr-0 sm:pr-4">
                      <h3 className="text-foreground font-medium text-base sm:text-lg mb-2">Limpar Todos os Dados</h3>
                      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">Remove todos os treinos, exercícios e configurações (mantém a conta)</p>
                    </div>
                    <Dialog open={clearDataDialogOpen} onOpenChange={setClearDataDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="w-full sm:w-auto h-10 sm:h-9 text-sm font-medium">
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
                        <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
                          <Button variant="outline" onClick={() => setClearDataDialogOpen(false)} className="w-full sm:w-auto order-2 sm:order-1">
                            Cancelar
                          </Button>
                          <Button variant="destructive" onClick={handleClearData} disabled={clearingData} className="w-full sm:w-auto order-1 sm:order-2">
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
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border border-destructive/20 rounded-lg space-y-4 sm:space-y-0">
                    <div className="flex-1 pr-0 sm:pr-4">
                      <h3 className="text-foreground font-medium text-base sm:text-lg mb-2">Excluir Conta</h3>
                      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">Remove permanentemente sua conta e todos os dados</p>
                    </div>
                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="w-full sm:w-auto h-10 sm:h-9 text-sm font-medium">
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
                        <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
                          <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="w-full sm:w-auto order-2 sm:order-1">
                            Cancelar
                          </Button>
                          <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting} className="w-full sm:w-auto order-1 sm:order-2">
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
                          <FormItem className="rounded-lg border border-border p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                {/* Título com ícone de status */}
                                <div className="flex items-center gap-2 mb-2">
                                  <FormLabel className="text-base text-foreground flex items-center gap-2 mb-0">
                                    <Bell className="h-4 w-4 shrink-0" />
                                    <span className="font-medium">Notificações Push</span>
                                  </FormLabel>
                                  {/* Ícone de status clicável */}
                                  {!isSupported && supportStatus.isIOS && (
                                    <button
                                      onClick={() => setShowIOSGuide(true)}
                                      className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-muted transition-colors"
                                      title="Guia para iOS"
                                    >
                                      <Smartphone className="h-4 w-4 text-blue-500" />
                                    </button>
                                  )}
                                  {!isSupported && !supportStatus.isIOS && (
                                    <button
                                      onClick={() => openStatusModal('notifications', 'unsupported')}
                                      className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-muted transition-colors"
                                      title="Clique para mais informações"
                                    >
                                      <XCircle className="h-4 w-4 text-destructive" />
                                    </button>
                                  )}
                                  {isSupported && permission === 'denied' && (
                                    <button
                                      onClick={() => openStatusModal('notifications', 'blocked')}
                                      className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-muted transition-colors"
                                      title="Clique para mais informações"
                                    >
                                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                                    </button>
                                  )}
                                  {isSupported && permission === 'granted' && field.value && (
                                    <button
                                      onClick={() => openStatusModal('notifications', 'active')}
                                      className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-muted transition-colors"
                                      title="Clique para mais informações"
                                    >
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    </button>
                                  )}
                                </div>
                                {/* Descrição */}
                                <FormDescription className="text-muted-foreground text-sm mb-3">
                                  {!isSupported 
                                    ? supportStatus.reason || 'Seu navegador não suporta notificações push'
                                    : permission === 'denied'
                                    ? 'Ative as notificações nas configurações do navegador'
                                    : 'Receba lembretes sobre treinos e descanso'
                                  }
                                </FormDescription>
                              </div>
                              {/* Botões em linha separada no mobile */}
                              <FormControl className="w-full sm:w-auto">
                                <div className="flex gap-2">
                                  {!isSupported && supportStatus.isIOS && (
                                    <Button
                                      type="button"
                                      onClick={() => setShowIOSGuide(true)}
                                      size="sm"
                                      variant="outline"
                                      className="flex items-center gap-2"
                                      data-testid="button-ios-help"
                                    >
                                      <HelpCircle className="h-4 w-4" />
                                      Ajuda iOS
                                    </Button>
                                  )}
                                  <Button
                                  type="button"
                                  variant={field.value && permission === 'granted' ? 'default' : 'outline'}
                                  size="sm"
                                  disabled={!isSupported}
                                  onClick={async () => {
                                    const currentValue = field.value && permission === 'granted';
                                    if (!currentValue && permission !== 'granted') {
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
                                      field.onChange(!currentValue);
                                    }
                                  }}
                                  className={`w-full sm:min-w-[80px] h-9 shrink-0 font-medium transition-all ${
                                    field.value && permission === 'granted' 
                                      ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                                      : 'bg-muted hover:bg-muted/80 text-muted-foreground border-muted'
                                  }`}
                                  data-testid="toggle-notifications"
                                >
                                  {field.value && permission === 'granted' ? 'Ativo' : 'Inativo'}
                                </Button>
                                </div>
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={preferencesForm.control}
                        name="soundEffects"
                        render={({ field }) => (
                          <FormItem className="rounded-lg border border-border p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                {/* Título com ícone de status */}
                                <div className="flex items-center gap-2 mb-2">
                                  <FormLabel className="text-base text-foreground flex items-center gap-2 mb-0">
                                    {field.value ? <Volume2 className="h-4 w-4 shrink-0" /> : <VolumeX className="h-4 w-4 shrink-0" />}
                                    <span className="font-medium">Efeitos Sonoros</span>
                                  </FormLabel>
                                  {/* Ícone de status clicável */}
                                  {!soundEffects.isSupported && (
                                    <button
                                      onClick={() => openStatusModal('sound', 'unsupported')}
                                      className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-muted transition-colors"
                                      title="Clique para mais informações"
                                    >
                                      <XCircle className="h-4 w-4 text-destructive" />
                                    </button>
                                  )}
                                  {soundEffects.isSupported && field.value && (
                                    <button
                                      onClick={() => openStatusModal('sound', 'active')}
                                      className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-muted transition-colors"
                                      title="Clique para mais informações"
                                    >
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    </button>
                                  )}
                                </div>
                                {/* Descrição */}
                                <FormDescription className="text-muted-foreground text-sm mb-3">
                                  {soundEffects.isSupported 
                                    ? 'Sons de feedback durante treinos e descanso'
                                    : 'Seu navegador não suporta áudio'
                                  }
                                </FormDescription>
                              </div>
                              {/* Botões em linha separada no mobile */}
                              <FormControl className="w-full sm:w-auto">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                  <Button
                                    type="button"
                                    variant={field.value && soundEffects.isSupported ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!soundEffects.isSupported}
                                    onClick={() => field.onChange(!field.value)}
                                    className={`w-full sm:min-w-[80px] h-9 shrink-0 font-medium transition-all ${
                                      field.value && soundEffects.isSupported 
                                        ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                                        : 'bg-muted hover:bg-muted/80 text-muted-foreground border-muted'
                                    }`}
                                    data-testid="toggle-sound-effects"
                                  >
                                    {field.value && soundEffects.isSupported ? 'Ativo' : 'Inativo'}
                                  </Button>
                                  {field.value && soundEffects.isSupported && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => soundEffects.testSound()}
                                      className="w-full sm:w-auto text-xs px-3 py-1 h-7 shrink-0 hover:bg-muted"
                                      data-testid="button-test-sound"
                                    >
                                      Testar
                                    </Button>
                                  )}
                                </div>
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </Form>
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

      {/* Status Info Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {statusModalData?.icon === 'CheckCircle' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {statusModalData?.icon === 'AlertTriangle' && <AlertTriangle className="h-5 w-5 text-orange-600" />}
              {statusModalData?.icon === 'XCircle' && <XCircle className="h-5 w-5 text-destructive" />}
              {statusModalData?.title}
            </DialogTitle>
            <DialogDescription className="text-left">
              {statusModalData?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setStatusModalOpen(false)} variant="outline">
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* iOS Notification Guide Modal */}
      <IOSNotificationGuide
        open={showIOSGuide}
        onOpenChange={setShowIOSGuide}
        supportStatus={supportStatus}
        onRetryDetection={retryDetection}
      />
    </div>
  );
}