import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Camera, Save, Calendar, Mail, AtSign, Weight, Ruler, Activity, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { updateUserSchema, type UpdateUser } from '@shared/schema';

export default function Profile() {
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  // Format date helpers
  const formatDateForInput = (date: string | Date | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const parseDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    return new Date(dateStr);
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
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
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

  const getUserInitials = () => {
    if (!user) return "U";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || user.username?.charAt(0).toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-24">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="space-y-6">
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
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-slate-800 border-slate-600 hover:bg-slate-700"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.username}
              </h1>
              <p className="text-slate-400">{user?.email}</p>
            </div>
          </div>

          {/* Profile Form */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <User className="mr-2 h-5 w-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription className="text-slate-400">
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
                        <FormLabel className="text-slate-300 flex items-center">
                          <Mail className="mr-2 h-4 w-4" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            type="email"
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
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 flex items-center">
                          <AtSign className="mr-2 h-4 w-4" />
                          Nome de usuário
                        </FormLabel>
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
                          <PopoverContent className="w-auto p-0 bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-600/50 shadow-2xl rounded-xl backdrop-blur-sm" align="start">
                            <div className="p-4">
                              {/* Header personalizado com seletores */}
                              <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-700/50">
                                <button
                                  type="button"
                                  className="h-8 w-8 bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-600/60 border border-slate-600/30 rounded-lg transition-all duration-200 shadow-sm backdrop-blur-sm"
                                  onClick={() => {
                                    const currentDate = field.value ? parseDate(field.value) : new Date(1990, 0);
                                    const newDate = new Date(currentDate);
                                    newDate.setMonth(newDate.getMonth() - 1);
                                    field.onChange(formatDateForInput(newDate));
                                  }}
                                >
                                  ‹
                                </button>
                                
                                <div className="flex gap-3 items-center">
                                  <div className="flex flex-col">
                                    <label className="text-xs text-slate-400 mb-1">Mês</label>
                                    <select
                                      value={(field.value ? parseDate(field.value) : new Date(1990, 0)).getMonth()}
                                      onChange={(e) => {
                                        const currentDate = field.value ? parseDate(field.value) : new Date(1990, 0);
                                        const newDate = new Date(currentDate);
                                        newDate.setMonth(parseInt(e.target.value));
                                        field.onChange(formatDateForInput(newDate));
                                      }}
                                      className="bg-slate-700/80 border border-slate-600/50 text-white text-sm rounded-lg px-3 py-2 shadow-lg hover:bg-slate-600/80 transition-all duration-200 backdrop-blur-sm font-medium min-w-[120px]"
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
                                      value={(field.value ? parseDate(field.value) : new Date(1990, 0)).getFullYear()}
                                      onChange={(e) => {
                                        const currentDate = field.value ? parseDate(field.value) : new Date(1990, 0);
                                        const newDate = new Date(currentDate);
                                        newDate.setFullYear(parseInt(e.target.value));
                                        field.onChange(formatDateForInput(newDate));
                                      }}
                                      className="bg-slate-700/80 border border-slate-600/50 text-white text-sm rounded-lg px-3 py-2 shadow-lg hover:bg-slate-600/80 transition-all duration-200 backdrop-blur-sm font-medium min-w-[90px]"
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
                                    const newDate = new Date(currentDate);
                                    newDate.setMonth(newDate.getMonth() + 1);
                                    field.onChange(formatDateForInput(newDate));
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
                              <div className="mt-4 pt-3 border-t border-slate-700/50">
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                  <span>Selecione sua data de nascimento</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span>Hoje</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                        {user?.dateOfBirth && (
                          <p className="text-xs text-slate-400 mt-1">
                            Atual: {formatDateForDisplay(user.dateOfBirth)}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Altura e Peso com formato brasileiro */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300 flex items-center">
                            <Ruler className="mr-2 h-4 w-4" />
                            Altura (cm)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value?.toString() || ''}
                              type="number"
                              step="0.1"
                              min="100"
                              max="250"
                              placeholder="175"
                              className="bg-slate-800/50 border-slate-700 text-white"
                              disabled={loading}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300 flex items-center">
                            <Weight className="mr-2 h-4 w-4" />
                            Peso (kg)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value?.toString() || ''}
                              type="number"
                              step="0.1"
                              min="30"
                              max="300"
                              placeholder="70.5"
                              className="bg-slate-800/50 border-slate-700 text-white"
                              disabled={loading}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Nível de Atividade com opções brasileiras */}
                  <FormField
                    control={form.control}
                    name="activityLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 flex items-center">
                          <Activity className="mr-2 h-4 w-4" />
                          Nível de Atividade Física
                        </FormLabel>
                        <FormControl>
                          <select 
                            {...field}
                            value={field.value || ''}
                            className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-md px-3 py-2 text-sm"
                            disabled={loading}
                          >
                            <option value="sedentário">Sedentário (sem exercícios)</option>
                            <option value="leve">Leve (1-3 dias/semana)</option>
                            <option value="moderado">Moderado (3-5 dias/semana)</option>
                            <option value="intenso">Intenso (6-7 dias/semana)</option>
                            <option value="atleta">Atleta (2x por dia ou mais)</option>
                          </select>
                        </FormControl>
                        <FormMessage />
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
        </div>
      </div>
    </div>
  );
}