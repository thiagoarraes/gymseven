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
  Target,
  Filter,
  Check,
  Heart,
  ArrowUp,
  Layers,
  Zap,
  TrendingUp,
  Calendar
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

// Muscle group color mapping function
const getMuscleGroupInfo = (muscleGroup: string) => {
  const groups: Record<string, { icon: any; bgColor: string; textColor: string; borderColor: string }> = {
    "Peito": { 
      icon: Heart, 
      bgColor: "bg-rose-500/20", 
      textColor: "text-rose-400", 
      borderColor: "border-rose-500/30" 
    },
    "Costas": { 
      icon: ArrowUp, 
      bgColor: "bg-blue-500/20", 
      textColor: "text-blue-400", 
      borderColor: "border-blue-500/30" 
    },
    "Ombros": { 
      icon: Layers, 
      bgColor: "bg-amber-500/20", 
      textColor: "text-amber-400", 
      borderColor: "border-amber-500/30" 
    },
    "Bíceps": { 
      icon: Zap, 
      bgColor: "bg-purple-500/20", 
      textColor: "text-purple-400", 
      borderColor: "border-purple-500/30" 
    },
    "Tríceps": { 
      icon: TrendingUp, 
      bgColor: "bg-indigo-500/20", 
      textColor: "text-indigo-400", 
      borderColor: "border-indigo-500/30" 
    },
    "Pernas": { 
      icon: Target, 
      bgColor: "bg-emerald-500/20", 
      textColor: "text-emerald-400", 
      borderColor: "border-emerald-500/30" 
    },
    "Abdômen": { 
      icon: Calendar, 
      bgColor: "bg-orange-500/20", 
      textColor: "text-orange-400", 
      borderColor: "border-orange-500/30" 
    },
  };

  return groups[muscleGroup] || { 
    icon: Dumbbell, 
    bgColor: "bg-gray-500/20", 
    textColor: "text-gray-400", 
    borderColor: "border-gray-500/30" 
  };
};

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
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<string>('all');
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  
  // Local changes state - stores pending changes until user clicks save
  const [localChanges, setLocalChanges] = useState<Record<string, Partial<{
    series: number;
    repeticoes: string;
    weight: number | null;
    restDurationSeconds: number;
  }>>>({});

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
    queryKey: ["/api/v2/workouts/templates", id],
    enabled: !!id,
  });

  const { data: templateExercises = [], isLoading: exercisesLoading, refetch: refetchExercises } = useQuery({
    queryKey: ["/api/v2/workouts/templates", id, "exercises"],
    queryFn: () => workoutTemplateApi.getExercises(id!),
    enabled: !!id,
    staleTime: 0, // Sempre buscar dados frescos
    gcTime: 0, // Não manter cache
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const { data: allExercises = [] } = useQuery({
    queryKey: ["/api/v2/exercises"],
  });

  // Mutations
  const updateTemplateNameMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("PATCH", `/api/workout-templates/${id}`, { name });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v2/workouts/templates", id] });
      setIsEditingTemplateName(false);
      toast({
        title: "Nome atualizado!",
        description: "O nome do treino foi alterado com sucesso.",
      });
    },
  });

  const addExerciseMutation = useMutation({
    mutationFn: async (exerciseData: any) => {
      const response = await apiRequest("POST", `/api/v2/workouts/templates/exercises`, { ...exerciseData, templateId: id });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        return await response.json();
      } else {
        // If not JSON, just return success indicator
        return { success: true, exerciseId: exerciseData.exerciseId };
      }
    },
    onSuccess: async () => {
      // Force cache invalidation and immediate refetch
      queryClient.removeQueries({ queryKey: ["/api/v2/workouts/templates", id, "exercises"] });
      await refetchExercises(); // Force immediate refetch
      setIsExerciseFormOpen(false);
      // Only show toast for single exercise additions here, not in the loop
    },
    onError: (error) => {
      console.error("Error adding single exercise:", error);
      toast({
        title: "Erro ao adicionar exercício",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Mutation for adding multiple exercises at once
  const addMultipleExercisesMutation = useMutation({
    mutationFn: async (exercisesData: any[]) => {
      const promises = exercisesData.map(async (exerciseData) => {
        try {
          const response = await apiRequest("POST", `/api/v2/workouts/templates/exercises`, { ...exerciseData, templateId: id });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          // Check if response is JSON
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
          } else {
            // If not JSON, just return success indicator
            return { success: true, exerciseId: exerciseData.exerciseId };
          }
        } catch (error) {
          console.error('Error adding exercise:', error);
          throw error;
        }
      });
      return Promise.all(promises);
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["/api/v2/workouts/templates", id, "exercises"] });
      queryClient.invalidateQueries({ queryKey: ["workout-templates", user?.id] }); // Invalidate main workout list
      refetchExercises(); // Force immediate refetch
      setShowExerciseSelector(false);
      setSelectedExercises(new Set());
      setMuscleGroupFilter('all');
      
      toast({
        title: `${results.length} exercício${results.length > 1 ? 's' : ''} adicionado${results.length > 1 ? 's' : ''}!`,
        description: "Os exercícios foram adicionados ao treino com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error adding exercises:", error);
      toast({
        title: "Erro ao adicionar exercícios",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const updateExerciseMutation = useMutation({
    mutationFn: async ({ exerciseId, updates }: { exerciseId: string; updates: any }) => {
      console.log(`🚀 Making API call to update exercise ${exerciseId}:`, updates);
      return await workoutTemplateApi.updateExercise(exerciseId, updates);
    },
    onSuccess: (data, { exerciseId, updates }) => {
      console.log(`✅ Update successful for exercise ${exerciseId}:`, data);
      
      // Force immediate cache removal and refetch
      queryClient.removeQueries({ queryKey: ["workout-templates", user?.id] });
      queryClient.removeQueries({ queryKey: ["/api/v2/workouts/templates", id, "exercises"] });
      queryClient.removeQueries({ queryKey: ["/api/v2/workouts/templates", id, "exercises"] });
      
      // Also remove any cached workout template data completely
      queryClient.removeQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.includes('workout');
        }
      });
      
      // Force refetch the main workout templates
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["workout-templates", user?.id] });
      }, 100);
      
      toast({
        title: "Exercício atualizado",
        description: "Alterações salvas com sucesso.",
      });
    },
    onError: (err: any, { exerciseId, updates }) => {
      console.error(`❌ Error updating exercise ${exerciseId}:`, err);
      
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o exercício. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const removeExerciseMutation = useMutation({
    mutationFn: async (exerciseId: string) => {
      return await workoutTemplateApi.removeExercise(id!, exerciseId);
    },
    onSuccess: (_, exerciseId) => {
      // Clear local changes for the removed exercise
      setLocalChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[exerciseId];
        return newChanges;
      });
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["/api/v2/workouts/templates", id, "exercises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v2/workouts/templates", id, "exercises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v2/workouts/templates", id] });
      queryClient.invalidateQueries({ queryKey: ["workout-templates", user?.id] }); // Invalidate main workout list
      
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
      // Only invalidate specific queries to avoid race conditions
      queryClient.invalidateQueries({ queryKey: ["/api/v2/workouts/templates", id, "exercises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v2/workouts/templates", id, "exercises"] });
      queryClient.invalidateQueries({ queryKey: ["workout-templates", user?.id] }); // Invalidate main workout list
    },
    onError: (error) => {
      console.error("❌ Failed to reorder exercises:", error);
    }
  });

  // Effects - Sync templateExercises with reorderedExercises
  useEffect(() => {
    if (!templateExercises) return;
    
    // Only update if the data is actually different to prevent infinite loops
    const newExercises = Array.isArray(templateExercises) ? templateExercises : [];
    
    // Check if current reorderedExercises is different from new data
    const isDifferent = reorderedExercises.length !== newExercises.length || 
                       reorderedExercises.some((ex, index) => ex.id !== newExercises[index]?.id);
    
    if (isDifferent) {
      console.log("🔄 Updating reorderedExercises from templateExercises");
      // Sort exercises by order property to maintain consistent ordering
      const sortedExercises = [...newExercises].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      setReorderedExercises(sortedExercises);
      
      // Clean localChanges for exercises that no longer exist
      const newExerciseIds = new Set(newExercises.map(ex => ex.id));
      setLocalChanges(prev => {
        const filtered = Object.fromEntries(
          Object.entries(prev).filter(([exerciseId]) => newExerciseIds.has(exerciseId))
        );
        return filtered;
      });
    }
  }, [templateExercises]);

  useEffect(() => {
    if (template && typeof template === 'object' && template !== null) {
      const templateName = (template as any)?.data?.name || (template as any)?.data?.nome || (template as any)?.name || (template as any)?.nome;
      if (templateName) {
        setTempTemplateName(templateName);
      }
    }
  }, [template]);

  // Check URL params to auto-open modal
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openModal') === 'true') {
      setShowExerciseSelector(true);
      // Remove the parameter from URL without affecting history
      const url = new URL(window.location.href);
      url.searchParams.delete('openModal');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, []);

  // Handlers
  const handleTemplateNameEdit = () => {
    setIsEditingTemplateName(true);
    setTempTemplateName((template as any)?.data?.name || (template as any)?.data?.nome || (template as any)?.name || (template as any)?.nome || "");
  };

  const handleTemplateNameSave = () => {
    const currentName = (template as any)?.data?.name || (template as any)?.data?.nome || (template as any)?.name || (template as any)?.nome;
    if (tempTemplateName.trim() && tempTemplateName !== currentName) {
      updateTemplateNameMutation.mutate(tempTemplateName.trim());
    } else {
      setIsEditingTemplateName(false);
    }
  };

  const handleTemplateNameCancel = () => {
    setTempTemplateName((template as any)?.data?.name || (template as any)?.data?.nome || (template as any)?.name || (template as any)?.nome || "");
    setIsEditingTemplateName(false);
  };

  // Update local changes only - no immediate server save
  const handleLocalUpdate = (exerciseId: string, field: string, value: any) => {
    console.log(`🔄 handleLocalUpdate called:`, { exerciseId, field, value });
    
    // Map frontend field names to backend field names (Portuguese)
    const fieldMapping: Record<string, string> = {
      'sets': 'series',
      'reps': 'repeticoes', 
      'weight': 'weight',
      'restDurationSeconds': 'restDurationSeconds',
      'restDuration': 'restDurationSeconds'
    };

    const backendField = fieldMapping[field] || field;
    
    setLocalChanges(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [backendField]: value
      }
    }));

    // Also update the local display immediately with proper state immutability
    setReorderedExercises(prev => {
      return prev.map(ex => {
        if (ex.id !== exerciseId) return ex;
        
        // Create a completely new object to avoid state mutation
        const updatedEx = JSON.parse(JSON.stringify(ex));
        
        // Update the display field names
        if (backendField === 'series') updatedEx.sets = value;
        if (backendField === 'repeticoes') updatedEx.reps = value;  
        if (backendField === 'weight') updatedEx.weight = value;
        if (backendField === 'restDurationSeconds') updatedEx.restDurationSeconds = value;
        
        return updatedEx;
      });
    });
  };

  const handleRemoveExercise = (exerciseId: string) => {
    removeExerciseMutation.mutate(exerciseId);
  };

  const handleSaveExercise = async (exerciseId: string) => {
    const changes = localChanges[exerciseId];
    if (!changes || Object.keys(changes).length === 0) {
      return;
    }

    try {
      console.log(`💾 Saving individual exercise ${exerciseId}:`, changes);
      await workoutTemplateApi.updateExercise(exerciseId, changes);
      
      // Remove from local changes after successful save
      setLocalChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[exerciseId];
        return newChanges;
      });
      
      toast({
        title: "Exercício salvo!",
        description: "As alterações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Error saving exercise:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      });
    }
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
    let hasChanges = false;

    try {
      // First save all local changes to exercises
      if (Object.keys(localChanges).length > 0) {
        console.log("💾 Saving local exercise changes:", localChanges);
        
        // Get current exercise IDs to validate changes
        const currentExerciseIds = new Set(reorderedExercises.map(ex => ex.id));
        
        const updatePromises = [];
        for (const [exerciseId, changes] of Object.entries(localChanges)) {
          // Only update if exercise still exists
          if (currentExerciseIds.has(exerciseId) && Object.keys(changes).length > 0) {
            console.log(`💾 Updating exercise ${exerciseId} with:`, changes);
            updatePromises.push(workoutTemplateApi.updateExercise(exerciseId, changes));
          } else if (!currentExerciseIds.has(exerciseId)) {
            console.log(`⚠️ Skipping update for deleted exercise ${exerciseId}`);
          }
        }

        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
        }
        hasChanges = updatePromises.length > 0;
        
        // Clear local changes after successful save
        setLocalChanges({});
      }

      // Then save exercise order changes (only if needed)
      const currentOrder = reorderedExercises.map(ex => ex.order);
      const expectedOrder = reorderedExercises.map((_, index) => index + 1);
      const needsReorder = !currentOrder.every((order, index) => order === expectedOrder[index]);
      
      if (needsReorder && reorderedExercises.length > 0) {
        const exerciseUpdates = reorderedExercises.map((exercise, index) => ({
          id: exercise.id,
          order: index + 1,
        }));
        
        console.log("💾 Updating exercise order:", exerciseUpdates);
        
        // Wait for reorder mutation to complete using mutateAsync
        await new Promise<void>((resolve, reject) => {
          reorderExercisesMutation.mutate(exerciseUpdates, {
            onSuccess: () => {
              console.log("✅ Exercise reorder completed successfully");
              resolve();
            },
            onError: (error) => {
              console.error("❌ Exercise reorder failed:", error);
              reject(error);
            }
          });
        });
        hasChanges = true;
      }
      
      if (!hasChanges) {
        toast({
          title: "Nenhuma alteração",
          description: "Não há alterações para salvar.",
        });
        return;
      }
      
      // Only invalidate queries if no reorder was done (to avoid double invalidation)
      if (!needsReorder) {
        queryClient.invalidateQueries({ queryKey: ["/api/v2/workouts/templates", id, "exercises"] });
        queryClient.invalidateQueries({ queryKey: ["/api/v2/workouts/templates", id, "exercises"] });
      }
      
      toast({
        title: "Treino salvo!",
        description: "Todas as alterações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error("Error saving workout:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      });
    }
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
                    {(template as any)?.data?.name || (template as any)?.data?.nome || (template as any)?.name || (template as any)?.nome || "Novo Treino"}
                  </h1>
                  <Edit3 className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors opacity-60 group-hover:opacity-100" />
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {(template as any)?.data?.description || (template as any)?.data?.descricao || (template as any)?.description || (template as any)?.descricao || "Toque para editar o nome e descrição"}
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
                      <div className="mt-1">
                        {(() => {
                          const groupInfo = getMuscleGroupInfo(exercise.exercise?.muscleGroup || exercise.muscleGroup || 'Grupo muscular');
                          return (
                            <div className={`inline-flex items-center px-3 py-1.5 rounded-full border ${groupInfo.bgColor} ${groupInfo.textColor} ${groupInfo.borderColor} backdrop-blur-sm transition-all duration-200 hover:scale-105`}>
                              <span className="text-xs font-semibold tracking-wide">
                                {exercise.exercise?.muscleGroup || exercise.muscleGroup || 'Grupo muscular'}
                              </span>
                            </div>
                          );
                        })()}
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
                              onChange={(e) => handleLocalUpdate(exercise.id, 'reps', e.target.value)}
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
                                  handleLocalUpdate(exercise.id, 'weight', null);
                                  setWeightInputs(prev => {
                                    const newInputs = { ...prev };
                                    delete newInputs[exercise.id];
                                    return newInputs;
                                  });
                                } else {
                                  const numericValue = parseFloat(value);
                                  if (!isNaN(numericValue)) {
                                    handleLocalUpdate(exercise.id, 'weight', numericValue);
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
                                onClick={() => exercise.sets > 1 && handleLocalUpdate(exercise.id, 'sets', exercise.sets - 1)}
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
                                onClick={() => handleLocalUpdate(exercise.id, 'sets', exercise.sets + 1)}
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
                                onClick={() => exercise.sets > 1 && handleLocalUpdate(exercise.id, 'sets', exercise.sets - 1)}
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
                                onClick={() => handleLocalUpdate(exercise.id, 'sets', exercise.sets + 1)}
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
                              value={exercise.reps || ''}
                              onChange={(e) => handleLocalUpdate(exercise.id, 'reps', e.target.value)}
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
                                  handleLocalUpdate(exercise.id, 'weight', newWeight === 0 ? null : newWeight);
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
                                      handleLocalUpdate(exercise.id, 'weight', null);
                                      setWeightInputs(prev => {
                                        const newInputs = { ...prev };
                                        delete newInputs[exercise.id];
                                        return newInputs;
                                      });
                                    } else {
                                      const numericValue = parseFloat(value);
                                      if (!isNaN(numericValue)) {
                                        handleLocalUpdate(exercise.id, 'weight', numericValue);
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
                                  handleLocalUpdate(exercise.id, 'weight', newWeight);
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
                                  handleLocalUpdate(exercise.id, 'restDurationSeconds', newRest);
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
                                  handleLocalUpdate(exercise.id, 'restDurationSeconds', newRest);
                                }}
                                disabled={updateExerciseMutation.isPending}
                              >
                                <Plus className="w-4 h-4 text-white/90 group-hover:text-white transition-colors" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Save Button for this exercise - shown when there are changes */}
                        {localChanges[exercise.id] && Object.keys(localChanges[exercise.id]).length > 0 && (
                          <div className="mt-4 flex justify-center">
                            <Button
                              onClick={() => handleSaveExercise(exercise.id)}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium px-6 py-2 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg shadow-green-500/25"
                            >
                              <Save className="w-4 h-4" />
                              <span>Salvar Alterações</span>
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Save Button for cardio exercises too */}
                    {(exercise.exercise?.muscleGroup === 'Cardio' || exercise.muscleGroup === 'Cardio') && 
                     localChanges[exercise.id] && Object.keys(localChanges[exercise.id]).length > 0 && (
                      <div className="mt-4 flex justify-center">
                        <Button
                          onClick={() => handleSaveExercise(exercise.id)}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium px-6 py-2 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg shadow-green-500/25"
                        >
                          <Save className="w-4 h-4" />
                          <span>Salvar Alterações</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Add More Exercises Button - Always visible when there are exercises */}
            <div className="pt-4">
              <Button
                onClick={() => setShowExerciseSelector(true)}
                className="w-full bg-gradient-to-r from-blue-500/80 to-blue-600/80 hover:from-blue-500 hover:to-blue-600 text-white font-medium py-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 border border-blue-500/30 hover:border-blue-400/50"
              >
                <Plus className="w-4 h-4" />
                Adicionar Mais Exercícios
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* Exercise Selector Dialog */}
      <Dialog open={showExerciseSelector} onOpenChange={setShowExerciseSelector}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-gradient-to-b from-slate-900/98 to-slate-800/95 backdrop-blur-xl border-slate-600/50 shadow-2xl flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center border border-blue-500/30">
                <Dumbbell className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-white text-2xl font-bold">Escolher Exercícios</DialogTitle>
                <p className="text-slate-400 text-sm">Selecione exercícios para adicionar ao seu treino</p>
              </div>
            </div>
            
            {/* Muscle Group Filter */}
            <div className="flex items-center space-x-3 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <Filter className="w-5 h-5 text-slate-400" />
              <span className="text-slate-300 text-sm font-medium min-w-fit">Filtrar por grupo:</span>
              <select 
                value={muscleGroupFilter} 
                onChange={(e) => setMuscleGroupFilter(e.target.value)}
                className="flex-1 bg-slate-700/50 border border-slate-600/50 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:bg-slate-600/70 active:bg-slate-600/80 hover:bg-slate-700/70 transition-all duration-200"
              >
                <option value="all">Todos os grupos musculares</option>
                {Array.from(new Set(Array.isArray(allExercises) ? (allExercises as any[]).map((ex: any) => ex.grupoMuscular || ex.muscleGroup) : [])).sort().map((group: any) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
            
            {/* Selected Count */}
            {selectedExercises.size > 0 && (
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl px-4 py-3 mt-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/50 flex items-center justify-center">
                    <Check className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-blue-300 font-medium">
                    {selectedExercises.size} exercício{selectedExercises.size > 1 ? 's' : ''} selecionado{selectedExercises.size > 1 ? 's' : ''}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => setSelectedExercises(new Set())}
                  variant="outline"
                  className="border-slate-500/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-400 text-xs"
                >
                  Limpar Seleção
                </Button>
              </div>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <div className="grid grid-cols-2 gap-3">
              {Array.isArray(allExercises) ? (allExercises as any[])
                .filter((exercise: any) => !reorderedExercises.some(ex => ex.exerciseId === exercise.id))
                .filter((exercise: any) => muscleGroupFilter === 'all' || (exercise.grupoMuscular || exercise.muscleGroup) === muscleGroupFilter)
                .sort((a: any, b: any) => (a.nome || a.name || '').localeCompare(b.nome || b.name || '', 'pt-BR'))
                .map((exercise: any) => {
                  const isSelected = selectedExercises.has(exercise.id);
                  const muscleGroup = exercise.grupoMuscular || exercise.muscleGroup;
                  const groupInfo = getMuscleGroupInfo(muscleGroup);
                  const IconComponent = groupInfo.icon;
                  
                  return (
                    <Card 
                      key={exercise.id} 
                      className={`border transition-all duration-200 cursor-pointer group hover:shadow-lg ${
                        isSelected 
                          ? `bg-gradient-to-r from-blue-500/15 to-purple-500/10 border-blue-400/50 shadow-md shadow-blue-500/20 hover:shadow-blue-500/30` 
                          : 'bg-slate-800/30 border-slate-700/40 hover:bg-slate-800/60 hover:border-slate-600/60 hover:shadow-slate-500/10'
                      } rounded-xl`}
                      onClick={() => {
                        const newSelected = new Set(selectedExercises);
                        if (isSelected) {
                          newSelected.delete(exercise.id);
                        } else {
                          newSelected.add(exercise.id);
                        }
                        setSelectedExercises(newSelected);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1 min-w-0">
                            {/* Modern Checkbox with [+] design */}
                            <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-300 font-bold text-lg ${
                              isSelected 
                                ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-400 shadow-lg shadow-green-500/40 text-white scale-110' 
                                : 'border-slate-500/60 hover:border-green-400/70 hover:bg-green-500/10 hover:shadow-md text-slate-500 hover:text-green-400'
                            }`}>
                              {isSelected ? '✓' : '+'}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-semibold text-lg leading-tight transition-colors ${
                                isSelected ? 'text-blue-200' : 'text-white group-hover:text-blue-300'
                              }`}>
                                {exercise.nome || exercise.name}
                              </h4>
                              {/* Muscle Group Tag with proper colors */}
                              <div className="mt-2">
                                <div className={`inline-flex items-center px-3 py-1.5 rounded-full border ${groupInfo.bgColor} ${groupInfo.textColor} ${groupInfo.borderColor} backdrop-blur-sm transition-all duration-200 hover:scale-105`}>
                                  <span className="text-xs font-semibold tracking-wide">
                                    {muscleGroup}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }) : []}
              {Array.isArray(allExercises) ? (allExercises as any[])
                .filter((exercise: any) => !reorderedExercises.some(ex => ex.exerciseId === exercise.id))
                .filter((exercise: any) => muscleGroupFilter === 'all' || (exercise.grupoMuscular || exercise.muscleGroup) === muscleGroupFilter)
                .length === 0 : false && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-slate-800/50 flex items-center justify-center">
                    <Dumbbell className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-400">
                    {muscleGroupFilter === 'all' 
                      ? 'Todos os exercícios já foram adicionados' 
                      : `Nenhum exercício disponível para ${muscleGroupFilter}`
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* Footer with main action button */}
          <div className="flex-shrink-0 pt-6 border-t border-slate-700/50">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExerciseSelector(false);
                  setSelectedExercises(new Set());
                  setMuscleGroupFilter('all');
                }}
                className="flex-1 h-12 border-slate-600/60 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500 transition-all"
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (selectedExercises.size > 0) {
                    // Add exercises one by one to avoid API issues
                    let successCount = 0;
                    const totalExercises = selectedExercises.size;
                    
                    for (const [index, exerciseId] of Array.from(selectedExercises).entries()) {
                      try {
                        const exercise = Array.isArray(allExercises) ? (allExercises as any[]).find((ex: any) => ex.id === exerciseId) : null;
                        if (exercise) {
                          const exerciseData = {
                            exerciseId: exercise.id,
                            sets: 3,
                            reps: "8-12",
                            weight: null,
                            order: reorderedExercises.length + index + 1,
                          };
                          
                          await new Promise((resolve, reject) => {
                            addExerciseMutation.mutate(exerciseData, {
                              onSuccess: () => {
                                successCount++;
                                resolve(true);
                              },
                              onError: (error) => {
                                console.error('Error adding exercise:', error);
                                resolve(false); // Don't reject, just continue
                              }
                            });
                          });
                        }
                      } catch (error) {
                        console.error('Failed to add exercise:', error);
                      }
                    }
                    
                    // Clean up and show result
                    setSelectedExercises(new Set());
                    setShowExerciseSelector(false);
                    setMuscleGroupFilter('all');
                    
                    // Force a final refetch
                    await queryClient.removeQueries({ queryKey: ["/api/v2/workouts/templates", id, "exercises"] });
                    await refetchExercises();
                    
                    if (successCount > 0) {
                      if (successCount === totalExercises) {
                        toast({
                          title: `${successCount} exercício${successCount > 1 ? 's' : ''} adicionado${successCount > 1 ? 's' : ''}!`,
                          description: "Exercícios adicionados com sucesso.",
                        });
                      } else {
                        toast({
                          title: `${successCount} de ${totalExercises} exercícios adicionados`,
                          description: "Alguns exercícios não puderam ser adicionados.",
                          variant: "destructive",
                        });
                      }
                    } else {
                      toast({
                        title: "Erro ao adicionar exercícios",
                        description: "Nenhum exercício pôde ser adicionado. Tente novamente.",
                        variant: "destructive",
                      });
                    }
                  } else {
                    // Just close modal
                    setShowExerciseSelector(false);
                    setMuscleGroupFilter('all');
                  }
                }}
                disabled={addExerciseMutation.isPending}
                className={`flex-[2] h-12 font-semibold transition-all duration-200 ${
                  selectedExercises.size > 0
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30'
                    : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600'
                }`}
              >
                {selectedExercises.size > 0 
                  ? `Adicionar ${selectedExercises.size} Exercício${selectedExercises.size > 1 ? 's' : ''}` 
                  : 'Concluir'
                }
              </Button>
            </div>
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
                          <div className="mt-1">
                            {(() => {
                              const groupInfo = getMuscleGroupInfo(exercise.exercise?.muscleGroup || exercise.muscleGroup || 'Grupo muscular');
                              return (
                                <div className={`inline-flex items-center px-2 py-1 rounded-full border ${groupInfo.bgColor} ${groupInfo.textColor} ${groupInfo.borderColor} backdrop-blur-sm transition-all duration-200 hover:scale-105`}>
                                  <span className="text-xs font-semibold tracking-wide">
                                    {exercise.exercise?.muscleGroup || exercise.muscleGroup || 'Grupo muscular'}
                                  </span>
                                </div>
                              );
                            })()}
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