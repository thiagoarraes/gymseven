import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Play, Edit3, Calendar, Dumbbell, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { workoutService } from "../services/workout.service";
import { useAuth } from "@/contexts/auth-context-new";

const workoutFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
});

type WorkoutFormValues = z.infer<typeof workoutFormSchema>;

export default function Workouts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Query para buscar templates de treino com exercícios
  const { data: workoutTemplates = [], isLoading, error } = useQuery({
    queryKey: ["workout-templates", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }
      const result = await workoutService.getWorkoutTemplatesWithExercises(user.id);
      console.log("Templates retornados:", result);
      return result;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });

  // Mutation para criar template
  const createMutation = useMutation({
    mutationFn: (data: WorkoutFormValues) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }
      return workoutService.createWorkoutTemplate(data, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-templates", user?.id] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Treino criado!",
        description: "O modelo de treino foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o treino.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar template
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: WorkoutFormValues }) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }
      return workoutService.updateWorkoutTemplate(id, data, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-templates", user?.id] });
      setIsDialogOpen(false);
      setEditingWorkout(null);
      form.reset();
      toast({
        title: "Treino atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o treino.",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir template
  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }
      return workoutService.deleteWorkoutTemplate(id, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-templates", user?.id] });
      toast({
        title: "Treino excluído!",
        description: "O modelo de treino foi excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o treino.",
        variant: "destructive",
      });
    },
  });

  // Mutation para iniciar treino
  const startWorkoutMutation = useMutation({
    mutationFn: (templateId: string) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }
      const template = workoutTemplates.find((t: any) => t.id === templateId);
      return workoutService.createWorkoutLog({
        templateId,
        name: template?.nome || template?.name || "Treino",
        userId: user.id,
      });
    },
    onSuccess: (workoutLog: any) => {
      navigate(`/workout-session/${workoutLog.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível iniciar o treino.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = (data: WorkoutFormValues) => {
    if (editingWorkout) {
      updateMutation.mutate({ id: editingWorkout.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (workout: any) => {
    setEditingWorkout(workout);
    form.reset({
      name: workout.nome || workout.name,
      description: workout.descricao || workout.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleStartWorkout = (templateId: string) => {
    startWorkoutMutation.mutate(templateId);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este treino?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleNewWorkout = () => {
    setEditingWorkout(null);
    form.reset({
      name: "",
      description: "",
    });
    setIsDialogOpen(true);
  };

  // Tratar erro de carregamento
  if (error) {
    return (
      <div className="mobile-spacing">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100/60 dark:bg-red-900/20 flex items-center justify-center border border-red-200/50 dark:border-red-800/50">
            <Dumbbell className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Erro ao carregar treinos
          </h3>
          <p className="text-muted-foreground mb-6">
            {error instanceof Error ? error.message : "Erro desconhecido"}
          </p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ["workout-templates", user?.id] })}
            className="gradient-accent"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-spacing">
      <div className="flex items-center justify-between">
        <h2 className="mobile-heading text-foreground">Meus Treinos</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="gradient-accent mobile-button rounded-xl font-semibold text-white hover:scale-105 transition-transform touch-feedback mobile-focus" 
              data-testid="button-new-workout"
              onClick={handleNewWorkout}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Treino
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingWorkout ? "Editar Treino" : "Novo Treino"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Push A, Pull B, Legs"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Peito, Ombros e Tríceps..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 gradient-accent"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-workout"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingWorkout ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workout Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass-card rounded-2xl">
              <CardContent className="p-6">
                <div className="loading-skeleton h-6 rounded mb-2"></div>
                <div className="loading-skeleton h-4 rounded mb-4 w-3/4"></div>
                <div className="space-y-2 mb-4">
                  <div className="loading-skeleton h-4 rounded"></div>
                  <div className="loading-skeleton h-4 rounded"></div>
                  <div className="loading-skeleton h-4 rounded"></div>
                </div>
                <div className="loading-skeleton h-12 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : workoutTemplates.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100/60 dark:bg-slate-800/50 flex items-center justify-center border border-blue-200/50 dark:border-border">
            <Dumbbell className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum treino cadastrado
          </h3>
          <p className="text-muted-foreground mb-6">
            Crie seu primeiro modelo de treino para começar
          </p>
          <Button 
            className="gradient-accent"
            onClick={handleNewWorkout}
            data-testid="button-create-first-workout"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Treino
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workoutTemplates.map((template: any) => (
            <Card key={template.id} className="glass-card rounded-2xl" data-testid={`card-workout-${template.id}`}>
              <CardContent className="p-6 pb-4 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1" data-testid={`text-workout-name-${template.id}`}>
                      {template.nome || template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground" data-testid={`text-workout-description-${template.id}`}>
                      {template.descricao || template.description || "Sem descrição"}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 bg-muted/50 dark:bg-slate-800/50 rounded-lg hover:bg-muted dark:hover:bg-slate-700 transition-colors"
                      onClick={() => navigate(`/workout-template/${template.id}`)}
                      data-testid={`button-edit-${template.id}`}
                    >
                      <Edit3 className="text-muted-foreground dark:text-slate-400 w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 bg-muted/50 dark:bg-slate-800/50 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                      onClick={() => handleDelete(template.id)}
                      data-testid={`button-delete-${template.id}`}
                    >
                      <Trash2 className="text-red-500 dark:text-red-400 w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Exercise List */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-foreground">
                      <Dumbbell className="text-blue-500 dark:text-blue-400 mr-2 w-4 h-4" />
                      <span data-testid={`text-exercise-count-${template.id}`}>
                        {template.exercises?.length || 0} exercícios
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg px-2 py-1 transition-all duration-200"
                      onClick={() => navigate(`/workout-template/${template.id}`)}
                      data-testid={`button-add-exercises-${template.id}`}
                    >
                      + Adicionar
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {template.exercises && template.exercises.length > 0 ? (
                      template.exercises.slice(0, 3).map((exercise: any, index: number) => (
                        <div key={exercise.id} className="flex items-center text-xs text-muted-foreground" data-testid={`exercise-${exercise.id}`}>
                          <span className="w-4 text-center">{index + 1}</span>
                          <span className="flex-1 ml-2">
                            {exercise.exercise?.name || 'Exercício'}
                          </span>
                          <span className="text-blue-500 dark:text-blue-400 text-xs">
                            {exercise.sets}×{exercise.reps}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div 
                        className="bg-muted/30 dark:bg-slate-800/30 border border-border dark:border-slate-700 rounded-lg p-3 text-center cursor-pointer hover:bg-muted/50 dark:hover:bg-slate-800/50 transition-colors"
                        onClick={() => navigate(`/workout-template/${template.id}`)}
                        data-testid={`placeholder-add-exercises-${template.id}`}
                      >
                        <span className="text-muted-foreground text-sm">+ Adicionar exercícios</span>
                      </div>
                    )}
                    
                    {template.exercises && template.exercises.length > 3 && (
                      <div className="text-xs text-muted-foreground/70 text-center pt-1">
                        +{template.exercises.length - 3} mais exercícios
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button
                    className="w-full gradient-accent py-3 rounded-xl font-semibold text-white hover:scale-105 transition-transform"
                    onClick={() => handleStartWorkout(template.id)}
                    disabled={startWorkoutMutation.isPending}
                    data-testid={`button-start-workout-${template.id}`}
                  >
                    {startWorkoutMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Começar Treino
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
