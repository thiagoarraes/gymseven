import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Camera, Save, Calendar, Mail, AtSign, CalendarIcon, Upload, Trash2, AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { updateUserSchema, type UpdateUser } from '@shared/schema';
import ImageCropModal from '@/components/ImageCropModal';

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
  const { user, updateProfile, deleteAccount } = useAuth();
  const { toast } = useToast();
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
      
      await updateProfile(processedData);
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
      await deleteAccount();
      toast({
        title: "Conta excluída",
        description: "Sua conta foi excluída com sucesso.",
      });
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
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || user.username?.charAt(0).toUpperCase() || "U";
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
      updateProfile(result.user);
      
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
                <AvatarImage src={user?.profileImageUrl || ""} alt={user?.username || ""} />
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
                  : user?.username}
              </h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {/* Profile Form */}
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <User className="mr-2 h-5 w-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Atualize suas informações pessoais e preferências
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
                        <FormLabel className="text-slate-300 flex items-center">
                          <AtSign className="mr-2 h-4 w-4" />
                          Nome de usuário
                        </FormLabel>
                        <p className="text-xs text-slate-400 mb-2">Apenas letras, números e underscore. Sem acentos ou espaços.</p>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            className="bg-slate-800/50 border-slate-700 text-white"
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
                          <FormLabel className="text-slate-300">Nome</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ''}
                              className="bg-slate-800/50 border-slate-700 text-white"
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
                              value={field.value || ''}
                              className="bg-slate-800/50 border-slate-700 text-white"
                              disabled={loading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Data de Nascimento com calendário brasileiro */}
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          Data de Nascimento
                        </FormLabel>
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700/60 hover:text-white hover:border-slate-600 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 group"
                                disabled={loading}
                              >
                                <CalendarIcon className="mr-3 h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors duration-200" />
                                <span className={field.value ? "text-white" : "text-slate-400"}>
                                  {field.value ? formatDateForDisplay(parseDate(field.value)) : "Selecione uma data"}
                                </span>
                                {field.value && (
                                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-600/50 shadow-2xl rounded-xl backdrop-blur-sm max-h-[420px] overflow-y-auto" align="center" side="bottom" sideOffset={8}>
                            <div className="p-3">
                              {/* Header personalizado com seletores */}
                              <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-700/50">
                                <button
                                  type="button"
                                  className="h-8 w-8 bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-600/60 border border-slate-600/30 rounded-lg transition-all duration-200 shadow-sm backdrop-blur-sm"
                                  onClick={() => {
                                    const currentDate = field.value ? parseDate(field.value) : new Date(1990, 0);
                                    if (currentDate) {
                                      const newDate = new Date(currentDate);
                                      newDate.setMonth(newDate.getMonth() - 1);
                                      field.onChange(formatDateForInput(newDate));
                                    }
                                  }}
                                >
                                  ‹
                                </button>
                                
                                <div className="flex gap-3 items-center">
                                  <div className="flex flex-col">
                                    <label className="text-xs text-slate-400 mb-1">Mês</label>
                                    <select
                                      value={(field.value ? parseDate(field.value) : new Date(1990, 0))?.getMonth() || 0}
                                      onChange={(e) => {
                                        const currentDate = field.value ? parseDate(field.value) : new Date(1990, 0);
                                        if (currentDate) {
                                          const newDate = new Date(currentDate);
                                          newDate.setMonth(parseInt(e.target.value));
                                          field.onChange(formatDateForInput(newDate));
                                        }
                                      }}
                                      className="bg-slate-700/80 border border-slate-600/50 text-white text-sm rounded-lg px-2 py-1.5 shadow-lg hover:bg-slate-600/80 transition-all duration-200 backdrop-blur-sm font-medium min-w-[100px] max-h-[200px] overflow-y-auto"
                                    >
                                      {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i} value={i}>
                                          {format(new Date(2000, i, 1), 'MMMM', { locale: ptBR })}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  
                                  <div className="flex flex-col">
                                    <label className="text-xs text-slate-400 mb-1">Ano</label>
                                    <select
                                      value={(field.value ? parseDate(field.value) : new Date(1990, 0))?.getFullYear() || 1990}
                                      onChange={(e) => {
                                        const currentDate = field.value ? parseDate(field.value) : new Date(1990, 0);
                                        if (currentDate) {
                                          const newDate = new Date(currentDate);
                                          newDate.setFullYear(parseInt(e.target.value));
                                          field.onChange(formatDateForInput(newDate));
                                        }
                                      }}
                                      className="bg-slate-700/80 border border-slate-600/50 text-white text-sm rounded-lg px-2 py-1.5 shadow-lg hover:bg-slate-600/80 transition-all duration-200 backdrop-blur-sm font-medium min-w-[80px] max-h-[200px] overflow-y-auto"
                                    >
                                      {Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => (
                                        <option key={i} value={1900 + i}>
                                          {1900 + i}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                
                                <button
                                  type="button"
                                  className="h-8 w-8 bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-600/60 border border-slate-600/30 rounded-lg transition-all duration-200 shadow-sm backdrop-blur-sm"
                                  onClick={() => {
                                    const currentDate = field.value ? parseDate(field.value) : new Date(1990, 0);
                                    if (currentDate) {
                                      const newDate = new Date(currentDate);
                                      newDate.setMonth(newDate.getMonth() + 1);
                                      field.onChange(formatDateForInput(newDate));
                                    }
                                  }}
                                >
                                  ›
                                </button>
                              </div>

                              <CalendarComponent
                                mode="single"
                                selected={field.value ? parseDate(field.value) : undefined}
                                onSelect={(date) => {
                                  field.onChange(date ? formatDateForInput(date) : '');
                                  setCalendarOpen(false);
                                }}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                month={field.value ? parseDate(field.value) : new Date(1990, 0)}
                                locale={ptBR}
                                className="bg-transparent text-white"
                                classNames={{
                                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                  month: "space-y-4",
                                  caption: "hidden",
                                  caption_label: "hidden",
                                  caption_dropdowns: "hidden",
                                  dropdown: "hidden",
                                  dropdown_month: "hidden", 
                                  dropdown_year: "hidden",
                                  nav: "hidden",
                                  nav_button: "hidden",
                                  nav_button_previous: "hidden",
                                  nav_button_next: "hidden",
                                  table: "w-full border-collapse mt-2",
                                  head_row: "flex mb-3",
                                  head_cell: "text-slate-400 rounded-lg w-11 h-9 font-medium text-xs text-center flex items-center justify-center uppercase tracking-wider",
                                  row: "flex w-full gap-1 mb-1",
                                  cell: "text-center text-sm relative focus-within:relative focus-within:z-20",
                                  day: "h-11 w-11 p-0 font-medium text-white hover:bg-gradient-to-br hover:from-blue-500/20 hover:to-purple-500/20 rounded-lg flex items-center justify-center text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg border border-transparent hover:border-blue-500/30",
                                  day_selected: "bg-gradient-to-br from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/25 border-blue-400/50 scale-105",
                                  day_today: "bg-gradient-to-br from-slate-600/50 to-slate-700/50 text-white font-bold ring-2 ring-blue-400/30 ring-offset-1 ring-offset-slate-800",
                                  day_outside: "text-slate-600 opacity-40",
                                  day_disabled: "text-slate-600 opacity-30 hover:bg-transparent hover:scale-100",
                                  day_range_middle: "aria-selected:bg-slate-700 aria-selected:text-white",
                                  day_hidden: "invisible",
                                }}
                                formatters={{
                                  formatCaption: (date) => format(date, 'MMMM yyyy', { locale: ptBR }),
                                  formatWeekdayName: (date) => format(date, 'EEEEE', { locale: ptBR }).charAt(0).toUpperCase(),
                                }}
                              />
                              
                              {/* Footer with additional info */}
                              <div className="mt-3 pt-2 border-t border-slate-700/50">
                                <div className="flex items-center justify-center text-xs text-slate-400">
                                  <span>Selecione sua data de nascimento</span>
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                        {user?.dateOfBirth && (
                          <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                            {(() => {
                              const birthDate = new Date(user.dateOfBirth);
                              const month = birthDate.getMonth() + 1;
                              const day = birthDate.getDate();
                              
                              // Função para calcular o signo
                              const getZodiacSign = (month: number, day: number) => {
                                if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { sign: 'Áries', emoji: '♈', message: 'Sua determinação move montanhas nos treinos!' };
                                if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { sign: 'Touro', emoji: '♉', message: 'Sua persistência constrói músculos de aço!' };
                                if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return { sign: 'Gêmeos', emoji: '♊', message: 'Sua versatilidade domina qualquer exercício!' };
                                if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return { sign: 'Câncer', emoji: '♋', message: 'Sua dedicação alimenta força interior!' };
                                if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { sign: 'Leão', emoji: '♌', message: 'Sua coragem brilha em cada repetição!' };
                                if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { sign: 'Virgem', emoji: '♍', message: 'Sua disciplina esculpe o corpo perfeito!' };
                                if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { sign: 'Libra', emoji: '♎', message: 'Seu equilíbrio harmoniza mente e corpo!' };
                                if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { sign: 'Escorpião', emoji: '♏', message: 'Sua intensidade quebra todos os limites!' };
                                if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { sign: 'Sagitário', emoji: '♐', message: 'Sua energia mira sempre mais alto!' };
                                if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { sign: 'Capricórnio', emoji: '♑', message: 'Sua ambição conquista cada meta!' };
                                if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { sign: 'Aquário', emoji: '♒', message: 'Sua originalidade inova os treinos!' };
                                if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return { sign: 'Peixes', emoji: '♓', message: 'Sua intuição guia cada movimento!' };
                                return { sign: 'Signo', emoji: '⭐', message: 'Energia positiva nos treinos!' };
                              };
                              
                              const zodiac = getZodiacSign(month, day);
                              return (
                                <>
                                  <span>{zodiac.emoji}</span>
                                  <span>{zodiac.sign}: {zodiac.message}</span>
                                </>
                              );
                            })()}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />


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
                        <span>Salvar Alterações</span>
                      </div>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {/* Zona de Perigo */}
          <Card className="bg-red-900/20 border-red-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Zona de Perigo
              </CardTitle>
              <CardDescription className="text-red-300/80">
                Ações irreversíveis da conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog open={clearDataDialogOpen} onOpenChange={setClearDataDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full bg-orange-900/20 border-orange-500/50 text-orange-400 hover:bg-orange-800/30 hover:border-orange-400"
                    data-testid="button-clear-data"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Limpar Todos os Dados
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900/95 border-orange-500/50">
                  <DialogHeader>
                    <DialogTitle className="text-orange-400 flex items-center">
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Limpar Todos os Dados da Conta
                    </DialogTitle>
                    <DialogDescription className="text-slate-300">
                      Esta ação vai apagar todos os seus dados, deixando sua conta como se tivesse acabado de ser criada:
                      <br /><br />
                      • Todos os exercícios criados<br />
                      • Todos os treinos e modelos<br />
                      • Todo o histórico de progresso<br />
                      • Todas as conquistas<br />
                      <br />
                      <strong className="text-orange-400">Sua conta e perfil serão mantidos.</strong>
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setClearDataDialogOpen(false)}
                      disabled={clearingData}
                      className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/60"
                      data-testid="button-cancel-clear"
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleClearData}
                      disabled={clearingData}
                      className="bg-orange-600 hover:bg-orange-700"
                      data-testid="button-confirm-clear"
                    >
                      {clearingData ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Limpando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <RotateCcw className="w-4 h-4" />
                          <span>Sim, Limpar Dados</span>
                        </div>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    data-testid="button-delete-account"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Conta
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900/95 border-red-500/50">
                  <DialogHeader>
                    <DialogTitle className="text-red-400 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Excluir Conta Permanentemente
                    </DialogTitle>
                    <DialogDescription className="text-slate-300">
                      Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente excluídos:
                      <br /><br />
                      • Todos os exercícios criados<br />
                      • Todos os treinos e modelos<br />
                      • Todo o histórico de progresso<br />
                      • Todas as conquistas<br />
                      • Foto de perfil e preferências
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setDeleteDialogOpen(false)}
                      disabled={deleting}
                      className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/60"
                      data-testid="button-cancel-delete"
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="bg-red-600 hover:bg-red-700"
                      data-testid="button-confirm-delete"
                    >
                      {deleting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Excluindo...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Trash2 className="w-4 h-4" />
                          <span>Sim, Excluir Conta</span>
                        </div>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={handleCropCancel}
        imageSrc={selectedImage}
        onCropComplete={handleCropComplete}
        fileName={selectedFileName}
      />
    </div>
  );
}