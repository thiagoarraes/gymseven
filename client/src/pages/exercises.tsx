import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Edit, Trash2, Dumbbell, Check, Clock, TrendingUp, Calendar, ChevronDown, ChevronUp, BarChart3, Target, Heart, ArrowUp, Zap, Layers, Activity } from "lucide-react";
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

// Função para obter ícone e cores do grupo muscular
const getMuscleGroupInfo = (muscleGroup: string) => {
  const groups: Record<string, { icon: any; bgColor: string; textColor: string; borderColor: string }> = {
    "Peito": { 
      icon: Heart, 
      bgColor: "bg-rose-100/80 dark:bg-rose-500/20", 
      textColor: "text-rose-700 dark:text-rose-400", 
      borderColor: "border-rose-300/50 dark:border-rose-500/30" 
    },
    "Costas": { 
      icon: ArrowUp, 
      bgColor: "bg-blue-100/80 dark:bg-blue-500/20", 
      textColor: "text-blue-700 dark:text-blue-400", 
      borderColor: "border-blue-300/50 dark:border-blue-500/30" 
    },
    "Ombros": { 
      icon: Layers, 
      bgColor: "bg-amber-100/80 dark:bg-amber-500/20", 
      textColor: "text-amber-700 dark:text-amber-400", 
      borderColor: "border-amber-300/50 dark:border-amber-500/30" 
    },
    "Bíceps": { 
      icon: Zap, 
      bgColor: "bg-purple-100/80 dark:bg-purple-500/20", 
      textColor: "text-purple-700 dark:text-purple-400", 
      borderColor: "border-purple-300/50 dark:border-purple-500/30" 
    },
    "Tríceps": { 
      icon: TrendingUp, 
      bgColor: "bg-indigo-100/80 dark:bg-indigo-500/20", 
      textColor: "text-indigo-700 dark:text-indigo-400", 
      borderColor: "border-indigo-300/50 dark:border-indigo-500/30" 
    },
    "Pernas": { 
      icon: Target, 
      bgColor: "bg-emerald-100/80 dark:bg-emerald-500/20", 
      textColor: "text-emerald-700 dark:text-emerald-400", 
      borderColor: "border-emerald-300/50 dark:border-emerald-500/30" 
    },
    "Abdômen": { 
      icon: Calendar, 
      bgColor: "bg-orange-100/80 dark:bg-orange-500/20", 
      textColor: "text-orange-700 dark:text-orange-400", 
      borderColor: "border-orange-300/50 dark:border-orange-500/30" 
    },
    "Cardio": { 
      icon: Activity, 
      bgColor: "bg-red-100/80 dark:bg-red-500/20", 
      textColor: "text-red-700 dark:text-red-400", 
      borderColor: "border-red-300/50 dark:border-red-500/30" 
    }
  };

  return groups[muscleGroup] || { 
    icon: Dumbbell, 
    bgColor: "bg-gray-100/80 dark:bg-gray-500/20", 
    textColor: "text-gray-700 dark:text-gray-400", 
    borderColor: "border-gray-300/50 dark:border-gray-500/30" 
  };
};

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
      name: data.name,
      muscleGroup: data.muscleGroup,
      user_id: user?.id || "",
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
    <div className="container mx-auto px-4 py-6 space-y-6 pb-32 header-offset">
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
          <DialogContent className="bg-white/95 dark:bg-slate-900/95 border-blue-200/50 dark:border-slate-700 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">
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
                      <FormLabel className="text-foreground">Nome</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Supino Reto"
                          className="bg-white/80 dark:bg-slate-800/50 border-blue-200/50 dark:border-slate-700/50 text-foreground h-11 rounded-xl hover:border-blue-400/60 dark:hover:border-blue-500/30 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 placeholder-muted-foreground"
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
                      <FormLabel className="text-foreground">Grupo Muscular</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white/80 dark:bg-slate-800/50 border-blue-200/50 dark:border-slate-700/50 text-foreground h-11 rounded-xl hover:border-blue-400/60 dark:hover:border-blue-500/30 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50">
                            <SelectValue placeholder="Selecione o grupo muscular" className="text-muted-foreground" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white/95 dark:bg-slate-900/95 border-blue-200/50 dark:border-slate-700/50 rounded-xl shadow-xl backdrop-blur-md">
                          {MUSCLE_GROUPS.map((group) => (
                            <SelectItem 
                              key={group} 
                              value={group}
                              className="text-foreground hover:bg-blue-100/60 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-300 rounded-lg cursor-pointer transition-colors focus:bg-blue-100/60 dark:focus:bg-blue-500/10 focus:text-blue-600 dark:focus:text-blue-300"
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
                    className="flex-1 border-blue-200/50 dark:border-slate-700 text-foreground hover:bg-blue-100/60 dark:hover:bg-slate-700/50"
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
        <CardContent className="mobile-card-padding space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
            <Input
              placeholder="Buscar exercícios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-16 pr-4 h-12 mobile-button bg-white/80 dark:bg-slate-800/50 border-blue-200/50 dark:border-slate-700 text-foreground placeholder-muted-foreground focus:border-blue-400/60 dark:focus:border-blue-500/50 mobile-focus"
              data-testid="input-search-exercises"
            />
          </div>
          
          {/* Muscle Group Filters - Mobile Optimized */}
          <div className="space-y-3">
            <h3 className="mobile-body font-medium text-foreground">Filtrar por grupo muscular</h3>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Button
                variant={selectedMuscleGroup === "Todos" ? "default" : "outline"}
                className={`mobile-button px-4 py-2.5 rounded-xl font-medium transition-all duration-200 touch-feedback mobile-focus ${
                  selectedMuscleGroup === "Todos" 
                    ? "gradient-accent text-white shadow-lg hover:scale-105" 
                    : "bg-white/80 dark:bg-slate-700/60 border-blue-200/60 dark:border-slate-600 text-foreground hover:bg-blue-100/80 dark:hover:bg-slate-600/80 hover:border-blue-300/80 dark:hover:border-blue-500/60"
                }`}
                onClick={() => setSelectedMuscleGroup("Todos")}
                data-testid="filter-muscle-group-todos"
              >
                <span className="mobile-body">Todos</span>
              </Button>
              {MUSCLE_GROUPS.map((group) => (
                <Button
                  key={group}
                  variant={selectedMuscleGroup === group ? "default" : "outline"}
                  className={`mobile-button px-4 py-2.5 rounded-xl font-medium transition-all duration-200 touch-feedback mobile-focus ${
                    selectedMuscleGroup === group
                      ? "gradient-accent text-white shadow-lg hover:scale-105"
                      : "bg-white/80 dark:bg-slate-700/60 border-blue-200/60 dark:border-slate-600 text-foreground hover:bg-blue-100/80 dark:hover:bg-slate-600/80 hover:border-blue-300/80 dark:hover:border-blue-500/60"
                  }`}
                  onClick={() => setSelectedMuscleGroup(group)}
                  data-testid={`filter-muscle-group-${group.toLowerCase()}`}
                >
                  <span className="mobile-body">{group}</span>
                </Button>
              ))}
            </div>
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
                        <h4 className="font-bold text-foreground text-lg leading-tight truncate">
                          {exercise.name}
                        </h4>
                        {/* Improved Muscle Group Badge */}
                        <div className="mt-2">
                          {(() => {
                            const groupInfo = getMuscleGroupInfo(exercise.muscleGroup);
                            return (
                              <div className={`inline-flex items-center px-3 py-1.5 rounded-full border ${groupInfo.bgColor} ${groupInfo.textColor} ${groupInfo.borderColor} backdrop-blur-sm transition-all duration-200 hover:scale-105`}>
                                <span className="text-xs font-semibold tracking-wide">
                                  {exercise.muscleGroup}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
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
                          <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                          <span className="text-xs text-muted-foreground">Peso máx.</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-500 dark:text-emerald-400">
                          {exercise.maxWeight > 0 ? `${exercise.maxWeight}kg` : "0kg"}
                        </span>
                      </div>

                      {/* Last Workout */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                          <span className="text-xs text-muted-foreground">Último</span>
                        </div>
                        <span className="text-sm font-medium text-blue-500 dark:text-blue-400">
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
                              return `${Math.floor(diffDays / 30)}mês atrás`;
                            })()
                          ) : (
                            "Nunca"
                          )}
                        </span>
                      </div>

                      {/* Total Sessions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                          <span className="text-xs text-muted-foreground">Sessões</span>
                        </div>
                        <span className="text-sm font-bold text-amber-500 dark:text-amber-400">
                          {exercise.totalSessions || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Weight History */}
                  <div className="px-4 pb-4">
                    <Collapsible
                      open={expandedExercise === exercise.id}
                      onOpenChange={(isOpen) => setExpandedExercise(isOpen ? exercise.id : null)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full h-auto p-3 bg-gradient-to-r from-blue-50/60 to-purple-50/60 dark:from-slate-800/40 dark:to-slate-700/40 hover:from-blue-100/80 hover:to-purple-100/80 dark:hover:from-slate-700/60 dark:hover:to-slate-600/60 rounded-xl border border-blue-200/40 dark:border-slate-600/40 transition-all duration-300 shadow-sm hover:shadow-md group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-2">
                              <BarChart3 className="w-4 h-4 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200" />
                              <span className="text-sm font-medium text-foreground">Histórico de Peso</span>
                            </div>
                            {expandedExercise === exercise.id ? (
                              <ChevronUp className="w-4 h-4 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200" />
                            )}
                          </div>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3 overflow-hidden transition-all duration-300 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                        <div className="bg-gradient-to-br from-white/60 to-blue-50/40 dark:from-slate-900/60 dark:to-slate-800/40 rounded-xl p-4 border border-blue-200/50 dark:border-slate-700/50 shadow-sm backdrop-blur-sm">
                          {weightHistoryLoading ? (
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                <span className="text-xs font-medium text-muted-foreground">Carregando histórico...</span>
                              </div>
                              {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-blue-50/50 dark:bg-slate-800/50">
                                  <div className="loading-skeleton h-4 w-20 rounded-md"></div>
                                  <div className="loading-skeleton h-4 w-16 rounded-md"></div>
                                </div>
                              ))}
                            </div>
                          ) : weightHistory.length > 0 ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-200/40 dark:border-slate-700/40">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Últimas 6 sessões</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{weightHistory.length} total</span>
                              </div>
                              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                {weightHistory.slice(0, 6).map((entry: any, index: number) => (
                                  <motion.div 
                                    key={index} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50/70 to-white/50 dark:from-slate-800/70 dark:to-slate-700/50 border border-blue-100/60 dark:border-slate-700/60 hover:shadow-sm transition-all duration-200 group"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-emerald-500' : 'bg-blue-400'}`}></div>
                                        <span className="text-xs font-medium text-muted-foreground">
                                          {new Date(entry.date).toLocaleDateString('pt-BR', { 
                                            day: '2-digit', 
                                            month: '2-digit',
                                            year: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                      {index === 0 && (
                                        <span className="text-xs bg-emerald-500/20 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 dark:border-emerald-500/30 font-medium">
                                          Mais recente
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-sm font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                      {entry.weight}kg
                                    </span>
                                  </motion.div>
                                ))}
                              </div>
                              {weightHistory.length > 6 && (
                                <div className="text-center mt-3 pt-3 border-t border-blue-200/40 dark:border-slate-700/40">
                                  <span className="text-xs text-muted-foreground/80 bg-blue-50/50 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-blue-200/40 dark:border-slate-700/40">
                                    +{weightHistory.length - 6} sessões anteriores
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                                <BarChart3 className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                              </div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">Nenhum histórico de peso</p>
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