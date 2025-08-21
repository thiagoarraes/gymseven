import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Edit, Trash2, Dumbbell, Check, Clock, TrendingUp, Calendar, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { exerciseApi, exerciseProgressApi } from "@/lib/api";
import { MUSCLE_GROUPS } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

const exerciseFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  muscleGroup: z.string().min(1, "Grupo muscular é obrigatório"),
});

type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
}

interface ExercisesProps {
  selectionMode?: boolean;
  selectedExercises?: string[];
  onExerciseSelect?: (exerciseId: string) => void;
}

export default function Exercises({ selectionMode = false, selectedExercises = [], onExerciseSelect }: ExercisesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("Todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any>(null);
  const [swipedExercise, setSwipedExercise] = useState<string | null>(null);
  const [draggedExercise, setDraggedExercise] = useState<string | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["/api/exercicios"],
    queryFn: exerciseApi.getAll,
  });

  // Fetch exercise progress data for enhanced display
  const { data: exercisesWithProgress = [] } = useQuery({
    queryKey: ["/api/exercises-with-progress"],
    queryFn: exerciseProgressApi.getExercisesWithProgress,
  });

  // Fetch weight history for expanded exercise
  const { data: weightHistory = [], isLoading: weightHistoryLoading } = useQuery({
    queryKey: ["/api/exercise-weight-history", expandedExercise],
    queryFn: () => expandedExercise ? exerciseProgressApi.getWeightHistory(expandedExercise, 8) : [],
    enabled: !!expandedExercise,
  });

  // Merge exercises with progress data
  const enhancedExercises = exercises.map(exercise => {
    const progressData = exercisesWithProgress.find((p: any) => p.id === exercise.id);
    return {
      ...exercise,
      maxWeight: progressData?.maxWeight || 0,
      lastWorkout: progressData?.lastUsed || null,
      totalSessions: progressData?.totalSessions || 0
    };
  });

  const createMutation = useMutation({
    mutationFn: exerciseApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercicios"] });
      setIsDialogOpen(false);
      toast({
        title: "Exercício criado!",
        description: "O exercício foi adicionado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o exercício.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExerciseFormValues> }) =>
      exerciseApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercicios"] });
      setIsDialogOpen(false);
      setEditingExercise(null);
      toast({
        title: "Exercício atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: exerciseApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercicios"] });
      toast({
        title: "Exercício excluído!",
        description: "O exercício foi removido com sucesso.",
      });
    },
  });

  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      name: "",
      muscleGroup: "",
    },
  });

  const onSubmit = (data: ExerciseFormValues) => {
    // Add optional fields with null values to match backend schema
    const exerciseData = {
      ...data,
      userId: user?.id || "",
      description: null,
      imageUrl: null,
      videoUrl: null,
    };

    if (editingExercise) {
      updateMutation.mutate({ id: editingExercise.id, data: exerciseData });
    } else {
      createMutation.mutate(exerciseData);
    }
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    form.reset({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este exercício?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSwipeEnd = (info: any, exerciseId: string) => {
    const { offset, velocity } = info;
    const swipeThreshold = -70;
    const velocityThreshold = -500;

    if (offset.x < swipeThreshold || velocity.x < velocityThreshold) {
      setSwipedExercise(exerciseId);
    } else {
      setSwipedExercise(null);
    }
    
    // Clear dragged state
    setDraggedExercise(null);
  };

  const handleDragStart = (exerciseId: string) => {
    setDraggedExercise(exerciseId);
  };

  const filteredExercises = enhancedExercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMuscleGroup = selectedMuscleGroup === "Todos" || exercise.muscleGroup === selectedMuscleGroup;
    return matchesSearch && matchesMuscleGroup;
  });

  const resetForm = () => {
    setEditingExercise(null);
    form.reset({
      name: "",
      muscleGroup: "",
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header & Search */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {selectionMode ? "Selecionar Exercícios" : "Exercícios"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {selectionMode ? "Escolha os exercícios para seu treino" : "Gerencie seus exercícios"}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="gradient-accent hover:scale-105 transition-transform"
              onClick={resetForm}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingExercise ? "Editar Exercício" : "Novo Exercício"}
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
                          placeholder="Ex: Supino Reto"
                          className="glass-card border-slate-700/50 text-white h-11 rounded-xl hover:border-blue-500/30 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 placeholder-slate-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="muscleGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Grupo Muscular</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="glass-card border-slate-700/50 text-white h-11 rounded-xl hover:border-blue-500/30 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50">
                            <SelectValue placeholder="Selecione o grupo muscular" className="text-slate-300" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-card border-slate-700/50 rounded-xl shadow-xl backdrop-blur-md">
                          {MUSCLE_GROUPS.map((group) => (
                            <SelectItem 
                              key={group} 
                              value={group}
                              className="text-slate-200 hover:bg-blue-500/10 hover:text-blue-300 rounded-lg cursor-pointer transition-colors focus:bg-blue-500/10 focus:text-blue-300"
                            >
                              {group}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    {editingExercise ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filters */}
      <Card className="bg-blue-50/60 dark:bg-slate-800/40 rounded-2xl border border-blue-200/30 dark:border-slate-600/30">
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar exercícios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 dark:bg-slate-800/50 border-blue-200/50 dark:border-slate-700 text-foreground placeholder-muted-foreground focus:border-blue-400/60 dark:focus:border-blue-500/50"
            />
          </div>
          
          {/* Muscle Group Filters */}
          <div className="flex overflow-x-auto space-x-2 pb-2">
            <Button
              variant={selectedMuscleGroup === "Todos" ? "default" : "outline"}
              size="sm"
              className={`whitespace-nowrap ${
                selectedMuscleGroup === "Todos" 
                  ? "gradient-accent text-white" 
                  : "bg-white/70 dark:bg-slate-700/50 border-blue-200/50 dark:border-slate-700 text-foreground hover:bg-blue-100/60 dark:hover:bg-slate-600/50"
              }`}
              onClick={() => setSelectedMuscleGroup("Todos")}
            >
              Todos
            </Button>
            {MUSCLE_GROUPS.map((group) => (
              <Button
                key={group}
                variant={selectedMuscleGroup === group ? "default" : "outline"}
                size="sm"
                className={`whitespace-nowrap ${
                  selectedMuscleGroup === group
                    ? "gradient-accent text-white"
                    : "bg-white/70 dark:bg-slate-700/50 border-blue-200/50 dark:border-slate-700 text-foreground hover:bg-blue-100/60 dark:hover:bg-slate-600/50"
                }`}
                onClick={() => setSelectedMuscleGroup(group)}
              >
                {group}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exercise List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="bg-blue-50/60 dark:bg-slate-800/40 rounded-2xl overflow-hidden border border-blue-200/30 dark:border-slate-600/30">
              <CardContent className="p-0">
                <div className="p-4 pb-3">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="loading-skeleton w-12 h-12 rounded-xl"></div>
                    <div className="flex-1 space-y-2">
                      <div className="loading-skeleton h-5 w-3/4 rounded"></div>
                      <div className="loading-skeleton h-4 w-1/2 rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <div className="bg-blue-100/50 dark:bg-slate-800/30 rounded-xl p-3 space-y-3 border border-blue-200/40 dark:border-slate-700/30">
                    <div className="flex items-center justify-between">
                      <div className="loading-skeleton h-3 w-16 rounded"></div>
                      <div className="loading-skeleton h-3 w-8 rounded"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="loading-skeleton h-3 w-12 rounded"></div>
                      <div className="loading-skeleton h-3 w-10 rounded"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="loading-skeleton h-3 w-14 rounded"></div>
                      <div className="loading-skeleton h-3 w-6 rounded"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100/60 dark:bg-slate-800/50 flex items-center justify-center border border-blue-200/50 dark:border-slate-600/50">
            <Dumbbell className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchTerm || selectedMuscleGroup !== "Todos" 
              ? "Nenhum exercício encontrado" 
              : "Nenhum exercício cadastrado"
            }
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || selectedMuscleGroup !== "Todos"
              ? "Tente ajustar os filtros de busca"
              : "Adicione exercícios para começar a treinar"
            }
          </p>
          <Button 
            className="gradient-accent"
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Exercício
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredExercises.map((exercise) => (
            <motion.div
              key={exercise.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative group"
            >
              <Card 
                className={`bg-blue-50/60 dark:bg-slate-800/40 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 border ${
                  selectionMode && selectedExercises.includes(exercise.id) 
                    ? "ring-2 ring-blue-500 bg-blue-100/70 dark:bg-blue-500/10 border-blue-300/50 dark:border-blue-500/30" 
                    : "border-blue-200/30 dark:border-slate-600/30 hover:border-blue-300/50 dark:hover:border-blue-500/30"
                }`}
                onClick={() => selectionMode && onExerciseSelect?.(exercise.id)}
              >
                <CardContent className="p-0">
                  {/* Header Section */}
                  <div className="p-4 pb-3 relative">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="flex space-x-1">
                        {!selectionMode && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-8 h-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(exercise);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-8 h-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(exercise.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Exercise Icon and Title */}
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
                        <Dumbbell className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground text-lg leading-tight mb-1 truncate">
                          {exercise.name}
                        </h4>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-300 border border-indigo-500/20">
                          {exercise.muscleGroup}
                        </span>
                      </div>
                    </div>

                    {/* Selection Checkbox */}
                    {selectionMode && selectedExercises.includes(exercise.id) && (
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Stats Section */}
                  <div className="px-4 pb-4">
                    <div className="bg-blue-100/50 dark:bg-slate-800/30 rounded-xl p-3 space-y-3 border border-blue-200/40 dark:border-slate-700/30">
                      {/* Max Weight */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs text-muted-foreground">Peso máx.</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-400">
                          {exercise.maxWeight > 0 ? `${exercise.maxWeight}kg` : "0kg"}
                        </span>
                      </div>

                      {/* Last Workout */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span className="text-xs text-muted-foreground">Último</span>
                        </div>
                        <span className="text-sm font-medium text-blue-400">
                          {exercise.lastWorkout ? (
                            (() => {
                              const lastDate = new Date(exercise.lastWorkout);
                              const today = new Date();
                              
                              // Reset time to start of day for accurate day comparison
                              const lastDateOnly = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
                              const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                              
                              const diffTime = todayOnly.getTime() - lastDateOnly.getTime();
                              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                              
                              if (diffDays === 0) return "Hoje";
                              if (diffDays === 1) return "Ontem";
                              if (diffDays < 0) {
                                // Future date - shouldn't happen but handle gracefully
                                return "Hoje";
                              }
                              if (diffDays < 7) return `${diffDays}d atrás`;
                              if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem atrás`;
                              return "1+ mês";
                            })()
                          ) : "Nunca"}
                        </span>
                      </div>

                      {/* Total Sessions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-purple-400" />
                          <span className="text-xs text-muted-foreground">Sessões</span>
                        </div>
                        <span className="text-sm font-medium text-purple-400">
                          {exercise.totalSessions || 0}
                        </span>
                      </div>
                    </div>

                    {/* Weight Progress Accordion */}
                    <Collapsible open={expandedExercise === exercise.id} onOpenChange={(open) => setExpandedExercise(open ? exercise.id : null)}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full mt-3 p-2 hover:bg-blue-100/60 dark:hover:bg-slate-700/30 rounded-lg border border-blue-200/40 dark:border-slate-600/30 transition-colors"
                        >
                          <div className="flex items-center justify-center space-x-2 text-foreground">
                            <BarChart3 className="w-4 h-4" />
                            <span className="text-sm font-medium">Progresso de Peso</span>
                            {expandedExercise === exercise.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3">
                        <div className="bg-blue-100/40 dark:bg-slate-900/30 rounded-xl p-3 border border-blue-200/40 dark:border-slate-600/30">
                          {weightHistoryLoading ? (
                            <div className="text-center py-4">
                              <div className="loading-skeleton h-4 rounded mb-2 mx-auto w-32"></div>
                              <div className="space-y-2">
                                {[...Array(3)].map((_, i) => (
                                  <div key={i} className="flex items-center justify-between py-1">
                                    <div className="loading-skeleton h-3 rounded w-16"></div>
                                    <div className="loading-skeleton h-3 rounded w-12"></div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : weightHistory.length > 0 ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground">Histórico de Peso</span>
                                <span className="text-xs text-muted-foreground/80">{weightHistory.length} sessões</span>
                              </div>
                              <div className="space-y-1">
                                {weightHistory.slice(0, 6).map((entry: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between py-1">
                                    <span className="text-xs text-muted-foreground/80">{entry.date}</span>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-semibold text-emerald-400">{entry.weight}kg</span>
                                      {index === 0 && (
                                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                                          Mais recente
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {weightHistory.length > 6 && (
                                <div className="text-center mt-2 pt-2 border-t border-border/50 dark:border-slate-700/50">
                                  <span className="text-xs text-muted-foreground/70">+{weightHistory.length - 6} sessões anteriores</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <BarChart3 className="w-6 h-6 text-muted-foreground/60 mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Nenhum histórico de peso</p>
                              <p className="text-xs text-muted-foreground/80">Complete treinos para ver o progresso</p>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}