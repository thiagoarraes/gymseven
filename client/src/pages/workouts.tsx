import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Play, Copy, Edit, Edit3, Clock, Calendar, Dumbbell, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { workoutTemplateApi, workoutLogApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

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

  const { data: workoutTemplates = [], isLoading } = useQuery({
    queryKey: ["/api/workout-templates"],
    queryFn: workoutTemplateApi.getAll,
  });

  // Query to get exercises for each template
  const { data: templatesWithExercises = [] } = useQuery({
    queryKey: ["/api/workout-templates-with-exercises"],
    queryFn: async () => {
      const templatesWithExercises = await Promise.all(
        workoutTemplates.map(async (template) => {
          const exercises = await workoutTemplateApi.getExercises(template.id);
          return { ...template, exercises };
        })
      );
      return templatesWithExercises;
    },
    enabled: workoutTemplates.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: workoutTemplateApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates"] });
      setIsDialogOpen(false);
      toast({
        title: "Treino criado!",
        description: "O modelo de treino foi criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o treino.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkoutFormValues> }) =>
      workoutTemplateApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates"] });
      setIsDialogOpen(false);
      setEditingWorkout(null);
      toast({
        title: "Treino atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: workoutTemplateApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates"] });
      toast({
        title: "Treino excluído!",
        description: "O modelo de treino foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o treino.",
        variant: "destructive",
      });
    },
  });

  const startWorkoutMutation = useMutation({
    mutationFn: (templateId: string) => 
      workoutLogApi.create({
        templateId,
        name: workoutTemplates.find(t => t.id === templateId)?.name || "Treino",
        startTime: new Date(),
        completed: false,
      }),
    onSuccess: (workoutLog) => {
      navigate(`/workout-session/${workoutLog.id}`);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o treino.",
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
      name: workout.name,
      description: workout.description || "",
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

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Meus Treinos</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="gradient-accent px-4 py-2 rounded-xl font-semibold text-white hover:scale-105 transition-transform"
              onClick={() => {
                setEditingWorkout(null);
                form.reset({
                  name: "",
                  description: "",
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Treino
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">
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
                      <FormLabel className="text-slate-200">Nome</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Push A, Pull B, Legs"
                          className="bg-slate-800 border-slate-700 text-white"
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
                      <FormLabel className="text-slate-200">Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Peito, Ombros e Tríceps..."
                          className="bg-slate-800 border-slate-700 text-white"
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
                    className="flex-1 border-slate-700 text-slate-300"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 gradient-accent"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Nenhum treino cadastrado
          </h3>
          <p className="text-slate-400 mb-6">
            Crie seu primeiro modelo de treino para começar
          </p>
          <Button 
            className="gradient-accent"
            onClick={() => {
              setEditingWorkout(null);
              form.reset({
                name: "",
                description: "",
              });
              setIsDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Treino
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(templatesWithExercises.length > 0 ? templatesWithExercises : workoutTemplates).map((template) => (
            <Card key={template.id} className="glass-card rounded-2xl hover-lift cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{template.name}</h3>
                    <p className="text-sm text-slate-400">{template.description || "Sem descrição"}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement duplicate functionality
                        toast({
                          title: "Em breve",
                          description: "Função de duplicar treino será implementada em breve.",
                        });
                      }}
                    >
                      <Copy className="text-slate-400 w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/workout-template/${template.id}`);
                      }}
                    >
                      <Edit3 className="text-slate-400 w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 bg-slate-800/50 rounded-lg hover:bg-red-500/20 hover:border-red-500/20 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(template.id);
                      }}
                    >
                      <Trash2 className="text-red-400 hover:text-red-300 w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Exercise List */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-slate-300">
                      <Dumbbell className="text-blue-400 mr-2 w-4 h-4" />
                      <span>{template.exercises?.length || 0} exercícios</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-blue-400 hover:text-blue-300 p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/workout-template/${template.id}`);
                      }}
                    >
                      + Adicionar
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {template.exercises && template.exercises.length > 0 ? (
                      template.exercises.slice(0, 3).map((exercise: any, index: number) => (
                        <div key={exercise.id} className="flex items-center text-xs text-slate-400">
                          <span className="w-4 text-center">{index + 1}</span>
                          <span className="flex-1 ml-2">{exercise.name}</span>
                          <span className="text-blue-400 text-xs">{exercise.sets}×{exercise.reps}</span>
                        </div>
                      ))
                    ) : (
                      <div 
                        className="bg-slate-800/30 border border-slate-700 rounded-lg p-3 text-center cursor-pointer hover:bg-slate-800/50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/workout-template/${template.id}`);
                        }}
                      >
                        <span className="text-slate-400 text-sm">+ Adicionar exercícios</span>
                      </div>
                    )}
                    
                    {template.exercises && template.exercises.length > 3 && (
                      <div className="text-xs text-slate-500 text-center pt-1">
                        +{template.exercises.length - 3} mais exercícios
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  className="w-full gradient-accent py-3 rounded-xl font-semibold text-white hover:scale-105 transition-transform"
                  onClick={() => handleStartWorkout(template.id)}
                  disabled={startWorkoutMutation.isPending}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Começar Treino
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
