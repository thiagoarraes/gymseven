import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Camera, Save, Calendar, Mail, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { updateUserSchema, type UpdateUser } from '@shared/schema';

export default function Profile() {
  const [loading, setLoading] = useState(false);
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  // Format date helpers
  const formatDateForInput = (date: string | Date | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
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
      activityLevel: user?.activityLevel || 'moderado',
    },
  });

  const onSubmit = async (data: UpdateUser) => {
    setLoading(true);
    try {
      await updateProfile(data);
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

                  {/* Data de Nascimento com formato brasileiro */}
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          Data de Nascimento (dd/mm/aaaa)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ? (typeof field.value === 'string' ? field.value : formatDateForInput(field.value)) : ''}
                            type="date"
                            className="bg-slate-800/50 border-slate-700 text-white [&::-webkit-calendar-picker-indicator]:brightness-200"
                            disabled={loading}
                            lang="pt-BR"
                          />
                        </FormControl>
                        <FormMessage />
                        {user?.dateOfBirth && (
                          <p className="text-xs text-slate-400 mt-1">
                            Atual: {formatDateForDisplay(user.dateOfBirth)}
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
        </div>
      </div>
    </div>
  );
}