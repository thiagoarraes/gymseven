import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Save, 
  Edit3, 
  Timer, 
  Trash2, 
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Dumbbell,
  Target
} from "lucide-react";
import { Reorder } from "framer-motion";
import { workoutTemplateApi } from "@/lib/api";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context-new";

const schema = z.object({
  sets: z.number().min(1).max(50),
  reps: z.string().min(1, "Repetições são obrigatórias"),
  weight: z.number().optional(),
});

type FormData = z.infer<typeof schema>;

export default function WorkoutTemplateEditor() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [isEditingTemplateName, setIsEditingTemplateName] = useState(false);
  const [tempTemplateName, setTempTemplateName] = useState("");
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [isExerciseFormOpen, setIsExerciseFormOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any>(null);
  const [reorderedExercises, setReorderedExercises] = useState<any[]>([]);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [tempReorderedExercises, setTempReorderedExercises] = useState<any[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [weightInputs, setWeightInputs] = useState<Record<string, string>>({});

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      sets: 3,
      reps: "",
      weight: undefined,
    },
  });

  // Queries
  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ["/api/workout-templates", id],
    enabled: !!id,
  });

  const { data: templateExercises = [], isLoading: exercisesLoading, refetch: refetchExercises } = useQuery({
    queryKey: ["/api/workout-templates", id, "exercises"],
    queryFn: () => workoutTemplateApi.getExercises(id!),
    enabled: !!id,
    staleTime: 0, // Sempre buscar dados frescos
    gcTime: 0, // Não manter cache
  });

  const { data: allExercises = [] } = useQuery({
    queryKey: ["/api/exercicios"],
  }) as { data: any[] };

  // Mutations
  const updateTemplateNameMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("PATCH", `/api/workout-templates/${id}`, { name });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates", id] });
      setIsEditingTemplateName(false);
      toast({
        title: "Nome atualizado!",
        description: "O nome do treino foi alterado com sucesso.",
      });
    },
  });

  const addExerciseMutation = useMutation({
    mutationFn: async (exerciseData: any) => {
      const response = await apiRequest("POST", `/api/workout-templates/${id}/exercises`, { ...exerciseData, workoutTemplateId: id });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates", id, "exercises"] });
      setShowExerciseSelector(false);
      setIsExerciseFormOpen(false);
      toast({
        title: "Exercício adicionado!",
        description: "O exercício foi adicionado ao treino.",
      });
    },
  });

  const updateExerciseMutation = useMutation({
    mutationFn: async ({ exerciseId, updates }: { exerciseId: string; updates: any }) => {
      return await workoutTemplateApi.updateExercise(exerciseId, updates);
    },
    onMutate: async ({ exerciseId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/workout-templates", id, "exercises"] });
      
      // Snapshot the previous value
      const previousExercises = queryClient.getQueryData(["/api/workout-templates", id, "exercises"]);
      
      // Optimistically update to the new value with proper field mapping
      queryClient.setQueryData(["/api/workout-templates", id, "exercises"], (old: any) => {
        if (!old) return old;
        return old.map((ex: any) => {
          if (ex.id === exerciseId) {
            // Preserve exercise info and update only the changed fields
            return { 
              ...ex, 
              ...updates,
              // Ensure exercise object is preserved (contains name, etc.)
              exercise: ex.exercise 
            };
          }
          return ex;
        });
      });
      
      // Update local state with original field names for frontend
      setReorderedExercises(prev => 
        prev.map(ex => 
          ex.id === exerciseId 
            ? { 
                ...ex, 
                ...updates,
                // Preserve exercise object (contains name, etc.)
                exercise: ex.exercise 
              }
            : ex
        )
      );

      // Return a context object with the snapshotted value
      return { previousExercises };
    },
    onSuccess: (data, { exerciseId, updates }) => {
      // Update cache with actual server response
      queryClient.setQueryData(["/api/workout-templates", id, "exercises"], (old: any) => {
        if (!old) return old;
        return old.map((ex: any) => {
          if (ex.id === exerciseId) {
            // Use server response data if available, otherwise merge updates preserving exercise info
            return data || { 
              ...ex, 
              ...updates,
              // Preserve exercise object
              exercise: ex.exercise 
            };
          }
          return ex;
        });
      });
      
      // Also update local state
      setReorderedExercises(prev => 
        prev.map(ex => 
          ex.id === exerciseId 
            ? (data || { 
                ...ex, 
                ...updates,
                // Preserve exercise object
                exercise: ex.exercise 
              })
            : ex
        )
      );
    },
    onError: (err: any, variables, context) => {
      console.error('❌ Error updating exercise:', err);
      
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousExercises) {
        queryClient.setQueryData(["/api/workout-templates", id, "exercises"], context.previousExercises);
      }
      
      // Check if it's a 404 error (exercise not found or permission denied)
      const is404Error = err?.status === 404 || 
                        err?.message?.includes('não encontrado') ||
                        err?.message?.includes('not found') ||
                        (err?.response && err.response.status === 404);
      
      if (is404Error) {
        console.warn('🔄 Exercise not found - likely deleted or cache stale, forcing refresh');
        // Force refresh to sync with server state
        queryClient.invalidateQueries({ queryKey: ["/api/workout-templates", id, "exercises"] });
        queryClient.refetchQueries({ queryKey: ["/api/workout-templates", id, "exercises"] });
        
        toast({
          title: "Exercício não encontrado",
          description: "O exercício pode ter sido removido. Atualizando a lista...",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao atualizar",
          description: "Não foi possível atualizar o exercício. Tente novamente.",
          variant: "destructive",
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success to make sure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates", id, "exercises"] });
    },
  });

  const removeExerciseMutation = useMutation({
    mutationFn: async (exerciseId: string) => {
      return await workoutTemplateApi.removeExercise(exerciseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates", id, "exercises"] });
      toast({
        title: "Exercício removido!",
        description: "O exercício foi removido do treino.",
      });
    },
  });

  const reorderExercisesMutation = useMutation({
    mutationFn: async (exerciseUpdates: Array<{ id: string; order: number }>) => {
      const response = await apiRequest("PATCH", `/api/workout-templates/${id}/reorder`, { exercises: exerciseUpdates });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates", id, "exercises"] });
    },
  });

  // Effects
  useEffect(() => {
    if (templateExercises.length > 0) {
      setReorderedExercises(templateExercises);
    }
  }, [templateExercises]);

  useEffect(() => {
    if (template && typeof template === 'object' && template !== null) {
      const templateName = (template as any).nome || (template as any).name;
      if (templateName) {
        setTempTemplateName(templateName);
      }
    }
  }, [template]);

  // Handlers
  const handleTemplateNameEdit = () => {
    setIsEditingTemplateName(true);
    setTempTemplateName((template as any)?.nome || (template as any)?.name || "");
  };

  const handleTemplateNameSave = () => {
    const currentName = (template as any)?.nome || (template as any)?.name;
    if (tempTemplateName.trim() && tempTemplateName !== currentName) {
      updateTemplateNameMutation.mutate(tempTemplateName.trim());
    } else {
      setIsEditingTemplateName(false);
    }
  };

  const handleTemplateNameCancel = () => {
    setTempTemplateName((template as any)?.nome || (template as any)?.name || "");
    setIsEditingTemplateName(false);
  };

  const handleQuickUpdate = (exerciseId: string, field: string, value: any) => {
    updateExerciseMutation.mutate({
      exerciseId,
      updates: { [field]: value },
    });
  };

  const handleRemoveExercise = (exerciseId: string) => {
    removeExerciseMutation.mutate(exerciseId);
  };

  const handleForceRefresh = () => {
    // Limpar todos os caches relacionados
    queryClient.removeQueries({ queryKey: ["/api/workout-templates", id, "exercises"] });
    queryClient.removeQueries({ queryKey: ["/api/workout-templates", id] });
    
    // Forçar refetch dos dados
    refetchExercises();
    
    toast({
      title: "Dados atualizados",
      description: "A lista de exercícios foi sincronizada com o servidor.",
    });
  };

  const handleReorder = (newOrder: any[]) => {
    setReorderedExercises(newOrder);
  };

  const handleSaveWorkout = async () => {
    const exerciseUpdates = reorderedExercises.map((exercise, index) => ({
      id: exercise.id,
      order: index + 1,
    }));
    
    if (exerciseUpdates.length > 0) {
      reorderExercisesMutation.mutate(exerciseUpdates);
    }
    
    toast({
      title: "Treino salvo!",
      description: "Todas as alterações foram salvas com sucesso.",
    });
  };

  const onSubmit = (data: FormData) => {
    if (editingExercise) {
      const exerciseData = {
        exerciseId: editingExercise.id,
        sets: data.sets,
        reps: data.reps,
        weight: data.weight || null,
        order: reorderedExercises.length + 1,
      };
      addExerciseMutation.mutate(exerciseData);
    }
  };

  const openReorderModal = () => {
    setTempReorderedExercises([...reorderedExercises]);
    setShowReorderModal(true);
  };

  const handleReorderModalSave = () => {
    setReorderedExercises(tempReorderedExercises);
    setShowReorderModal(false);
    
    const exerciseUpdates = tempReorderedExercises.map((exercise, index) => ({
      id: exercise.id,
      order: index + 1,
    }));
    
    reorderExercisesMutation.mutate(exerciseUpdates);
    toast({
      title: "Exercícios reordenados!",
      description: "A nova ordem foi aplicada ao treino.",
    });
  };

  const handleReorderModalCancel = () => {
    setTempReorderedExercises([]);
    setShowReorderModal(false);
  };

  const moveExerciseInModal = (exerciseId: string, direction: 'up' | 'down') => {
    const currentIndex = tempReorderedExercises.findIndex(ex => ex.id === exerciseId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= tempReorderedExercises.length) return;
    
    const newOrder = [...tempReorderedExercises];
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
    
    setTempReorderedExercises(newOrder);
  };

  if (templateLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      {/* Compact Header Design */}
      <div className="bg-slate-900/98 backdrop-blur-xl border-b border-blue-500/20 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/treinos")}
              className="text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200 rounded-xl px-3 py-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            
            {/* Header Actions */}
            <div className="flex items-center gap-3">
              {/* Exercise Count Badge */}
              {reorderedExercises.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/15 rounded-lg border border-blue-500/25">
                  <Dumbbell className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-blue-300 text-xs font-medium">
                    {reorderedExercises.length} exercício{reorderedExercises.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              
              {/* Reorder Button for multiple exercises */}
              {reorderedExercises.length > 1 && (
                <Button
                  onClick={openReorderModal}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 rounded-lg px-2 py-1.5 transition-all duration-300"
                  title="Reordenar exercícios"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleForceRefresh}
                className="text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200 rounded-lg px-2 py-1.5"
                title="Atualizar dados"
              >
                🔄
              </Button>
            </div>
          </div>
          
          {/* Compact Template Title Section */}
          <div className="space-y-2">
            {isEditingTemplateName ? (
              <div className="space-y-3">
                <Input
                  value={tempTemplateName}
                  onChange={(e) => setTempTemplateName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTemplateNameSave();
                    } else if (e.key === 'Escape') {
                      handleTemplateNameCancel();
                    }
                  }}
                  className="text-2xl font-bold bg-transparent border-b-2 border-blue-400 text-white px-0 h-auto py-2 rounded-none focus:border-blue-300"
                  placeholder="Nome do treino"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleTemplateNameSave}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-1.5 text-xs"
                    disabled={updateTemplateNameMutation.isPending}
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Salvar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTemplateNameCancel}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800 rounded-lg px-3 py-1.5 text-xs"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="group cursor-pointer" onClick={handleTemplateNameEdit}>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors leading-tight">
                    {(template as any)?.nome || (template as any)?.name || "Novo Treino"}
                  </h1>
                  <Edit3 className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors opacity-60 group-hover:opacity-100" />
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {(template as any)?.descricao || (template as any)?.description || "Toque para editar o nome e descrição"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Inline Actions - Only show if no exercises */}
        {reorderedExercises.length === 0 && (
          <div className="flex gap-3">
            <Button
              onClick={() => setShowExerciseSelector(true)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Exercícios
            </Button>
          </div>
        )}
        

        {/* Exercise List */}
        {exercisesLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-slate-800/70 border-slate-600/50 rounded-2xl shadow-xl">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="loading-skeleton h-6 rounded-lg w-3/4"></div>
                    <div className="loading-skeleton h-4 rounded w-1/2"></div>
                    <div className="loading-skeleton h-16 rounded-xl"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reorderedExercises.length === 0 ? (
          <Card className="bg-slate-800/60 border-slate-600/60 rounded-2xl border-2 border-dashed shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Plus className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Seu treino está vazio
              </h3>
              <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                Comece adicionando exercícios para criar sua rotina personalizada
              </p>
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowExerciseSelector(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg transition-all duration-300"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Primeiro Exercício
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reorderedExercises.map((exercise: any, index: number) => (
              <Card key={exercise.id} className="bg-gradient-to-br from-slate-800/80 via-slate-800/70 to-blue-900/20 border-slate-600/40 rounded-2xl hover:border-slate-500/60 transition-all duration-300 group shadow-xl hover:shadow-2xl">
                <CardContent className="p-6">
                  {/* Exercise Header - Clean and Spacious */}
                  <div className="flex items-start gap-4 mb-6">
                    {/* Exercise Number Badge */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center border border-blue-500/30 flex-shrink-0">
                      <span className="font-bold text-blue-400">{index + 1}</span>
                    </div>
                    
                    {/* Exercise Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-bold text-white leading-tight exercise-name mb-2">
                        {exercise.exercise?.name || exercise.name || 'Exercício sem nome'}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <span className="text-blue-300 font-medium text-sm">
                          {exercise.exercise?.muscleGroup || exercise.muscleGroup || 'Grupo muscular'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-9 h-9 p-0 hover:bg-red-500/20 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-70 hover:!opacity-100"
                      onClick={() => handleRemoveExercise(exercise.id)}
                      title="Remover exercício"
                    >
                      <Trash2 className="text-red-400 w-4 h-4" />
                    </Button>
                  </div>

                  {/* Exercise Parameters - Modern Grid Layout */}
                  <div className="grid gap-4">
                    {exercise.exercise?.muscleGroup === 'Cardio' || exercise.muscleGroup === 'Cardio' ? (
                      <>
                        {/* Cardio Parameters */}
                        <div className="grid md:grid-cols-3 gap-4">
                          {/* Duration */}
                          <div className="bg-gradient-to-br from-slate-700/90 to-slate-800/70 rounded-xl p-4 border border-slate-500/30 shadow-md backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <Timer className="w-4 h-4 text-green-400" />
                              <label className="text-sm font-semibold text-slate-200">Duração</label>
                            </div>
                            <Input
                              value={exercise.reps}
                              onChange={(e) => handleQuickUpdate(exercise.id, 'reps', e.target.value)}
                              className="text-center bg-slate-600/80 border-slate-400/40 backdrop-blur-sm text-white text-lg font-bold h-12 rounded-xl shadow-sm"
                              placeholder="30 min"
                            />
                          </div>

                          {/* Distance */}
                          <div className="bg-gradient-to-br from-slate-700/90 to-slate-800/70 rounded-xl p-4 border border-slate-500/30 shadow-md backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <Target className="w-4 h-4 text-yellow-400" />
                              <label className="text-sm font-semibold text-slate-200">Distância</label>
                            </div>
                            <Input
                              type="text"
                              value={weightInputs[exercise.id] ?? (exercise.weight?.toString() || '')}
                              onChange={(e) => {
                                const value = e.target.value;
                                setWeightInputs(prev => ({ ...prev, [exercise.id]: value }));
                              }}
                              onBlur={(e) => {
                                const value = e.target.value.trim();
                                if (value === '') {
                                  handleQuickUpdate(exercise.id, 'weight', null);
                                  setWeightInputs(prev => {
                                    const newInputs = { ...prev };
                                    delete newInputs[exercise.id];
                                    return newInputs;
                                  });
                                } else {
                                  const numericValue = parseFloat(value);
                                  if (!isNaN(numericValue)) {
                                    handleQuickUpdate(exercise.id, 'weight', numericValue);
                                    setWeightInputs(prev => {
                                      const newInputs = { ...prev };
                                      delete newInputs[exercise.id];
                                      return newInputs;
                                    });
                                  }
                                }
                              }}
                              className="text-center bg-slate-600/80 border-slate-400/40 backdrop-blur-sm text-white text-lg font-bold h-12 rounded-xl shadow-sm"
                              placeholder="5 km"
                            />
                          </div>

                          {/* Intensity */}
                          <div className="bg-gradient-to-br from-slate-700/90 to-slate-800/70 rounded-xl p-4 border border-slate-500/30 shadow-md backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <Dumbbell className="w-4 h-4 text-purple-400" />
                              <label className="text-sm font-semibold text-slate-200">Intensidade</label>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-10 h-10 p-0 bg-gradient-to-br from-slate-600/90 to-slate-700/80 border-slate-400/50 backdrop-blur-sm hover:from-blue-500/80 hover:to-blue-600/70 hover:border-blue-400/60 hover:scale-105 active:scale-95 rounded-xl shadow-md transition-all duration-200 group"
                                onClick={() => exercise.sets > 1 && handleQuickUpdate(exercise.id, 'sets', exercise.sets - 1)}
                                disabled={exercise.sets <= 1 || updateExerciseMutation.isPending}
                              >
                                <Minus className="w-4 h-4 text-white/90 group-hover:text-white transition-colors" />
                              </Button>
                              <div className="text-center flex-1">
                                <div className="text-2xl font-bold text-purple-400">{exercise.sets}</div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-10 h-10 p-0 bg-gradient-to-br from-slate-600/90 to-slate-700/80 border-slate-400/50 backdrop-blur-sm hover:from-blue-500/80 hover:to-blue-600/70 hover:border-blue-400/60 hover:scale-105 active:scale-95 rounded-xl shadow-md transition-all duration-200 group"
                                onClick={() => handleQuickUpdate(exercise.id, 'sets', exercise.sets + 1)}
                                disabled={updateExerciseMutation.isPending}
                              >
                                <Plus className="w-4 h-4 text-white/90 group-hover:text-white transition-colors" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Regular Exercise Parameters */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Sets */}
                          <div className="bg-gradient-to-br from-slate-700/90 to-slate-800/70 rounded-xl p-4 border border-slate-500/30 shadow-md backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-3 h-3 rounded-full bg-green-400"></div>
                              <label className="text-sm font-semibold text-slate-200">Séries</label>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-10 h-10 p-0 bg-gradient-to-br from-slate-600/90 to-slate-700/80 border-slate-400/50 backdrop-blur-sm hover:from-blue-500/80 hover:to-blue-600/70 hover:border-blue-400/60 hover:scale-105 active:scale-95 rounded-xl shadow-md transition-all duration-200 group"
                                onClick={() => exercise.sets > 1 && handleQuickUpdate(exercise.id, 'sets', exercise.sets - 1)}
                                disabled={exercise.sets <= 1 || updateExerciseMutation.isPending}
                              >
                                <Minus className="w-4 h-4 text-white/90 group-hover:text-white transition-colors" />
                              </Button>
                              <div className="text-center flex-1">
                                <div className="text-2xl font-bold text-green-400">{exercise.sets}</div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-10 h-10 p-0 bg-gradient-to-br from-slate-600/90 to-slate-700/80 border-slate-400/50 backdrop-blur-sm hover:from-blue-500/80 hover:to-blue-600/70 hover:border-blue-400/60 hover:scale-105 active:scale-95 rounded-xl shadow-md transition-all duration-200 group"
                                onClick={() => handleQuickUpdate(exercise.id, 'sets', exercise.sets + 1)}
                                disabled={updateExerciseMutation.isPending}
                              >
                                <Plus className="w-4 h-4 text-white/90 group-hover:text-white transition-colors" />
                              </Button>
                            </div>
                          </div>

                          {/* Reps */}
                          <div className="bg-gradient-to-br from-slate-700/90 to-slate-800/70 rounded-xl p-4 border border-slate-500/30 shadow-md backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                              <label className="text-sm font-semibold text-slate-200">Repetições</label>
                            </div>
                            <Input
                              value={exercise.reps}
                              onChange={(e) => handleQuickUpdate(exercise.id, 'reps', e.target.value)}
                              className="text-center bg-slate-600/80 border-slate-400/40 backdrop-blur-sm text-white text-lg font-bold h-12 rounded-xl shadow-sm"
                              placeholder="8-12"
                            />
                          </div>

                          {/* Weight */}
                          <div className="bg-gradient-to-br from-slate-700/90 to-slate-800/70 rounded-xl p-4 border border-slate-500/30 shadow-md backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                              <label className="text-sm font-semibold text-slate-200">Peso (kg)</label>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-10 h-10 p-0 bg-gradient-to-br from-slate-600/90 to-slate-700/80 border-slate-400/50 backdrop-blur-sm hover:from-blue-500/80 hover:to-blue-600/70 hover:border-blue-400/60 hover:scale-105 active:scale-95 rounded-xl shadow-md transition-all duration-200 group"
                                onClick={() => {
                                  const currentWeight = exercise.weight || 0;
                                  const newWeight = Math.max(0, currentWeight - 2.5);
                                  handleQuickUpdate(exercise.id, 'weight', newWeight === 0 ? null : newWeight);
                                }}
                                disabled={updateExerciseMutation.isPending}
                              >
                                <Minus className="w-4 h-4 text-white/90 group-hover:text-white transition-colors" />
                              </Button>
                              <div className="flex-1">
                                <Input
                                  type="text"
                                  value={weightInputs[exercise.id] ?? (exercise.weight?.toString() || '')}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setWeightInputs(prev => ({ ...prev, [exercise.id]: value }));
                                  }}
                                  onBlur={(e) => {
                                    const value = e.target.value.trim();
                                    if (value === '') {
                                      handleQuickUpdate(exercise.id, 'weight', null);
                                      setWeightInputs(prev => {
                                        const newInputs = { ...prev };
                                        delete newInputs[exercise.id];
                                        return newInputs;
                                      });
                                    } else {
                                      const numericValue = parseFloat(value);
                                      if (!isNaN(numericValue)) {
                                        handleQuickUpdate(exercise.id, 'weight', numericValue);
                                        setWeightInputs(prev => {
                                          const newInputs = { ...prev };
                                          delete newInputs[exercise.id];
                                          return newInputs;
                                        });
                                      }
                                    }
                                  }}
                                  className="text-center bg-slate-600/80 border-slate-400/40 backdrop-blur-sm text-white text-lg font-bold h-12 rounded-xl shadow-sm"
                                  placeholder="20"
                                />
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-10 h-10 p-0 bg-gradient-to-br from-slate-600/90 to-slate-700/80 border-slate-400/50 backdrop-blur-sm hover:from-blue-500/80 hover:to-blue-600/70 hover:border-blue-400/60 hover:scale-105 active:scale-95 rounded-xl shadow-md transition-all duration-200 group"
                                onClick={() => {
                                  const currentWeight = exercise.weight || 0;
                                  const newWeight = currentWeight + 2.5;
                                  handleQuickUpdate(exercise.id, 'weight', newWeight);
                                }}
                                disabled={updateExerciseMutation.isPending}
                              >
                                <Plus className="w-4 h-4 text-white/90 group-hover:text-white transition-colors" />
                              </Button>
                            </div>
                          </div>

                          {/* Rest Duration */}
                          <div className="bg-gradient-to-br from-slate-700/90 to-slate-800/70 rounded-xl p-4 border border-slate-500/30 shadow-md backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <Timer className="w-4 h-4 text-orange-400" />
                              <label className="text-sm font-semibold text-slate-200">Descanso</label>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-10 h-10 p-0 bg-gradient-to-br from-slate-600/90 to-slate-700/80 border-slate-400/50 backdrop-blur-sm hover:from-blue-500/80 hover:to-blue-600/70 hover:border-blue-400/60 hover:scale-105 active:scale-95 rounded-xl shadow-md transition-all duration-200 group"
                                onClick={() => {
                                  const currentRest = exercise.restDuration || exercise.restDurationSeconds || 90;
                                  const newRest = Math.max(30, currentRest - 15);
                                  handleQuickUpdate(exercise.id, 'restDurationSeconds', newRest);
                                }}
                                disabled={updateExerciseMutation.isPending}
                              >
                                <Minus className="w-4 h-4 text-white/90 group-hover:text-white transition-colors" />
                              </Button>
                              <div className="text-center flex-1">
                                <div className="text-lg font-bold text-orange-400">
                                  {Math.floor((exercise.restDuration || exercise.restDurationSeconds || 90) / 60)}:{((exercise.restDuration || exercise.restDurationSeconds || 90) % 60).toString().padStart(2, '0')}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-10 h-10 p-0 bg-gradient-to-br from-slate-600/90 to-slate-700/80 border-slate-400/50 backdrop-blur-sm hover:from-blue-500/80 hover:to-blue-600/70 hover:border-blue-400/60 hover:scale-105 active:scale-95 rounded-xl shadow-md transition-all duration-200 group"
                                onClick={() => {
                                  const currentRest = exercise.restDuration || exercise.restDurationSeconds || 90;
                                  const newRest = Math.min(300, currentRest + 15);
                                  handleQuickUpdate(exercise.id, 'restDurationSeconds', newRest);
                                }}
                                disabled={updateExerciseMutation.isPending}
                              >
                                <Plus className="w-4 h-4 text-white/90 group-hover:text-white transition-colors" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Save Button */}
        {reorderedExercises.length > 0 && (
          <div className="flex justify-center pt-6">
            <Button
              onClick={handleSaveWorkout}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-12 py-4 rounded-2xl shadow-lg transition-all duration-300 flex items-center space-x-3"
            >
              <Save className="w-5 h-5" />
              <span>Salvar Treino</span>
            </Button>
          </div>
        )}
      </div>

      {/* Exercise Selector Dialog */}
      <Dialog open={showExerciseSelector} onOpenChange={setShowExerciseSelector}>
        <DialogContent className="max-w-3xl max-h-[85vh] bg-slate-900/95 border-slate-700/30 flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white text-xl font-bold">Escolher Exercícios</DialogTitle>
            <p className="text-slate-400 text-sm">Clique nos exercícios para adicionar ao treino</p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3">
              {(allExercises as any[])
                .filter((exercise: any) => !reorderedExercises.some(ex => ex.exerciseId === exercise.id))
                .map((exercise: any) => (
                  <Card 
                    key={exercise.id} 
                    className="bg-slate-800/40 border-slate-700/30 rounded-xl hover:bg-slate-800/60 transition-all duration-200 cursor-pointer group"
                    onClick={() => {
                      const exerciseData = {
                        exerciseId: exercise.id,
                        sets: 3,
                        reps: "8-12",
                        weight: null,
                        order: reorderedExercises.length + 1,
                      };
                      addExerciseMutation.mutate(exerciseData);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white leading-tight group-hover:text-blue-300 transition-colors">
                            {exercise.name}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                            <span className="text-sm text-blue-300 font-medium">
                              {exercise.muscleGroup}
                            </span>
                          </div>
                        </div>
                        <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              {(allExercises as any[]).filter((exercise: any) => !reorderedExercises.some(ex => ex.exerciseId === exercise.id)).length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-slate-800/50 flex items-center justify-center">
                    <Dumbbell className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-400">Todos os exercícios já foram adicionados</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-center pt-4 border-t border-slate-700/30">
            <Button
              variant="outline"
              onClick={() => setShowExerciseSelector(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exercise Form Dialog - Mobile Optimized */}
      <Dialog open={isExerciseFormOpen} onOpenChange={setIsExerciseFormOpen}>
        <DialogContent className="bg-slate-900/95 border-slate-700/30 max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-lg leading-relaxed">
              Configurar: <span className="block mt-1 font-semibold exercise-name">{editingExercise?.name}</span>
            </DialogTitle>
            <p className="text-slate-400 text-sm">Defina os parâmetros iniciais</p>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Sets */}
              <FormField
                control={form.control}
                name="sets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200 text-lg flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      <span>Séries</span>
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center justify-center space-x-4 bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="w-16 h-16 p-0 bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 rounded-xl touch-manipulation transition-all active:scale-95"
                          onClick={() => field.onChange(Math.max(1, field.value - 1))}
                          disabled={field.value <= 1}
                        >
                          <Minus className="w-6 h-6" />
                        </Button>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-green-400">{field.value}</div>
                          <div className="text-sm text-slate-400">séries</div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="w-16 h-16 p-0 bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 rounded-xl touch-manipulation transition-all active:scale-95"
                          onClick={() => field.onChange(field.value + 1)}
                        >
                          <Plus className="w-6 h-6" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Reps */}
              <FormField
                control={form.control}
                name="reps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200 text-lg flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <span>Repetições</span>
                    </FormLabel>
                    <FormControl>
                      <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                        <Input
                          placeholder="Ex: 8-12, 15, 10"
                          className="text-center bg-slate-700/50 border-slate-600/50 text-white text-xl font-bold h-14 rounded-xl touch-manipulation"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Weight */}
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200 text-lg flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                      <span>Peso (kg)</span>
                    </FormLabel>
                    <FormControl>
                      <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                        <Input
                          type="text"
                          placeholder="Ex: 20, 45.5 (opcional)"
                          className="text-center bg-slate-700/50 border-slate-600/50 text-white text-xl font-bold h-14 rounded-xl touch-manipulation"
                          {...field}
                          value={field.value?.toString() || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? undefined : parseFloat(value) || undefined);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-14 border-slate-700 text-slate-300 rounded-xl touch-manipulation"
                  onClick={() => setIsExerciseFormOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl touch-manipulation"
                  disabled={addExerciseMutation.isPending}
                >
                  Adicionar Exercício
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Reorder Exercises Modal */}
      <Dialog open={showReorderModal} onOpenChange={setShowReorderModal}>
        <DialogContent className="max-w-lg max-h-[85vh] bg-slate-900/98 border-slate-600/50 flex flex-col shadow-2xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white text-xl font-bold">Reordenar Exercícios</DialogTitle>
            <p className="text-slate-400 text-sm">Use os botões para mover os exercícios para cima ou para baixo</p>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3">
              {tempReorderedExercises.map((exercise: any, index: number) => (
                <Card key={exercise.id} className="bg-slate-800/70 border-slate-600/50 rounded-xl shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {/* Exercise Number Badge */}
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center border border-blue-500/30 flex-shrink-0">
                          <span className="font-bold text-blue-400 text-sm">{index + 1}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white leading-tight truncate">
                            {exercise.exercise?.name || exercise.name || 'Exercício sem nome'}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0"></div>
                            <span className="text-xs text-blue-300 font-medium truncate">
                              {exercise.exercise?.muscleGroup || exercise.muscleGroup || 'Grupo muscular'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Move Controls */}
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`w-8 h-8 p-0 rounded-lg transition-all duration-200 ${
                            index === 0 
                              ? 'opacity-30 bg-slate-800/30 border-slate-700/30' 
                              : 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-400/50'
                          }`}
                          onClick={() => moveExerciseInModal(exercise.id, 'up')}
                          disabled={index === 0}
                          title="Mover para cima"
                        >
                          <ChevronUp className={`w-4 h-4 ${index === 0 ? 'text-slate-500' : 'text-blue-400'}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`w-8 h-8 p-0 rounded-lg transition-all duration-200 ${
                            index === tempReorderedExercises.length - 1 
                              ? 'opacity-30 bg-slate-800/30 border-slate-700/30' 
                              : 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-400/50'
                          }`}
                          onClick={() => moveExerciseInModal(exercise.id, 'down')}
                          disabled={index === tempReorderedExercises.length - 1}
                          title="Mover para baixo"
                        >
                          <ChevronDown className={`w-4 h-4 ${index === tempReorderedExercises.length - 1 ? 'text-slate-500' : 'text-blue-400'}`} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between pt-4 border-t border-slate-700/30 gap-3">
            <Button
              variant="outline"
              onClick={handleReorderModalCancel}
              className="flex-1 border-slate-700 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReorderModalSave}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              Aplicar Nova Ordem
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}