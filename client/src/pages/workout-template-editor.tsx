import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Save, Trash2, Edit3, GripVertical, Minus, Timer, Dumbbell, MoreVertical, Check, CheckCircle2, Menu, ChevronUp, ChevronDown, Search, Heart, Target, Layers, Zap, TrendingUp, Calendar, ArrowUp, ArrowUpDown } from "lucide-react";
import { motion, Reorder, useDragControls } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { workoutTemplateApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Exercises from "./exercises";

// Quick Exercise Selector Component
interface QuickExerciseSelectorProps {
  onExerciseAdd: (exerciseId: string) => void;
  excludeExercises: string[];
}

function QuickExerciseSelector({ onExerciseAdd, excludeExercises }: QuickExerciseSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("Todos");

  const { data: exercises = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/exercicios"],
  });

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
    };

    return groups[muscleGroup] || { 
      icon: Dumbbell, 
      bgColor: "bg-gray-100/80 dark:bg-gray-500/20", 
      textColor: "text-gray-700 dark:text-gray-400", 
      borderColor: "border-gray-300/50 dark:border-gray-500/30" 
    };
  };

  const filteredExercises = exercises.filter((exercise: any) => {
    const matchesSearch = exercise.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMuscleGroup = selectedMuscleGroup === "Todos" || exercise.muscleGroup === selectedMuscleGroup;
    const notExcluded = !excludeExercises.includes(exercise.id);
    return matchesSearch && matchesMuscleGroup && notExcluded;
  });

  const muscleGroups = ["Todos", ...Array.from(new Set(exercises.map((ex: any) => ex.muscleGroup).filter(Boolean)))];

  if (isLoading) {
    return <div className="text-center py-8 text-slate-400">Carregando exercícios...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Buscar exercícios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-600/50 text-white"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {muscleGroups.map((group) => (
            <Button
              key={group}
              size="sm"
              variant={selectedMuscleGroup === group ? "default" : "outline"}
              onClick={() => setSelectedMuscleGroup(group as string)}
              className={selectedMuscleGroup === group 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "border-slate-600 text-slate-300 hover:bg-slate-700"
              }
            >
              {group as string}
            </Button>
          ))}
        </div>
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {filteredExercises.map((exercise: any) => {
          const info = getMuscleGroupInfo(exercise.muscleGroup);
          const IconComponent = info.icon;
          
          return (
            <Card
              key={exercise.id}
              className="cursor-pointer hover:bg-slate-700/50 transition-all duration-200 border-slate-600/50 bg-slate-800/30"
              onClick={() => onExerciseAdd(exercise.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${info.bgColor} ${info.borderColor} border`}>
                    <IconComponent className={`w-5 h-5 ${info.textColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{exercise.name}</h3>
                    <p className="text-sm text-slate-400">{exercise.muscleGroup}</p>
                  </div>
                  <Plus className="w-5 h-5 text-green-400 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredExercises.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          {excludeExercises.length > 0 && searchTerm === "" && selectedMuscleGroup === "Todos"
            ? "Todos os exercícios já foram adicionados ao treino!"
            : "Nenhum exercício encontrado."
          }
        </div>
      )}
    </div>
  );
}

const exerciseFormSchema = z.object({
  sets: z.number().min(1, "Pelo menos 1 série"),
  reps: z.string().min(1, "Repetições obrigatórias"),
  weight: z.number().optional(),
});

type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;

interface WorkoutTemplateEditorProps {
  templateId?: string;
}

export default function WorkoutTemplateEditor({ templateId }: WorkoutTemplateEditorProps) {
  const [, navigate] = useLocation();
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [editingExercise, setEditingExercise] = useState<any>(null);
  const [isExerciseFormOpen, setIsExerciseFormOpen] = useState(false);
  const [weightInputs, setWeightInputs] = useState<Record<string, string>>({});
  const [isEditingTemplateName, setIsEditingTemplateName] = useState(false);
  const [tempTemplateName, setTempTemplateName] = useState("");
  const [recentlyUpdated, setRecentlyUpdated] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [reorderedExercises, setReorderedExercises] = useState<any[]>([]);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [tempReorderedExercises, setTempReorderedExercises] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ["/api/workout-templates", templateId],
    queryFn: () => workoutTemplateApi.getById(templateId!),
    enabled: !!templateId,
  });

  const { data: templateExercises = [], isLoading: exercisesLoading } = useQuery({
    queryKey: ["/api/workout-templates", templateId, "exercises"],
    queryFn: () => workoutTemplateApi.getExercises(templateId!),
    enabled: !!templateId,
  });

  const addExerciseMutation = useMutation({
    mutationFn: (exerciseData: any) => workoutTemplateApi.addExercise(templateId!, exerciseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates", templateId, "exercises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates-with-exercises"] });
      setIsExerciseFormOpen(false);
      setEditingExercise(null);
      toast({
        title: "Exercício adicionado!",
        description: "O exercício foi adicionado ao treino.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o exercício.",
        variant: "destructive",
      });
    },
  });

  const updateExerciseMutation = useMutation({
    mutationFn: ({ exerciseId, updates }: { exerciseId: string; updates: any }) => 
      workoutTemplateApi.updateExercise(exerciseId, updates),
    onSuccess: () => {
      // Não invalidar queries para atualizações rápidas - preserva a ordem
      // queryClient.invalidateQueries({ queryKey: ["/api/workout-templates", templateId, "exercises"] });
      // queryClient.invalidateQueries({ queryKey: ["/api/workout-templates-with-exercises"] });
      
      // Visual feedback for successful update
      setRecentlyUpdated('success');
      setTimeout(() => setRecentlyUpdated(null), 2000);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o exercício.",
        variant: "destructive",
      });
    },
  });

  const removeExerciseMutation = useMutation({
    mutationFn: (exerciseId: string) => workoutTemplateApi.removeExercise(exerciseId),
    onSuccess: (_, exerciseId) => {
      // Atualização otimista - remove do estado local imediatamente
      setReorderedExercises(prev => prev.filter(exercise => exercise.id !== exerciseId));
      
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates", templateId, "exercises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates-with-exercises"] });
      toast({
        title: "Exercício removido!",
        description: "O exercício foi removido do treino.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o exercício.",
        variant: "destructive",
      });
    },
  });

  const updateTemplateNameMutation = useMutation({
    mutationFn: (newName: string) => 
      fetch(`/api/workout-templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates", templateId] });
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates"] });
      setIsEditingTemplateName(false);
      toast({
        title: "Nome atualizado!",
        description: "O nome do treino foi alterado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o nome do treino.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      sets: 3,
      reps: "8-12",
      weight: undefined,
    },
  });

  // Sync template name when data changes
  useEffect(() => {
    if (template?.name && !isEditingTemplateName) {
      setTempTemplateName(template.name);
    }
  }, [template?.name, isEditingTemplateName]);

  useEffect(() => {
    // Sempre sincroniza o estado local com os dados do servidor
    // mas preserva a ordem se o usuário está reorganizando
    if (templateExercises.length !== reorderedExercises.length || 
        (templateExercises.length > 0 && reorderedExercises.length === 0)) {
      setReorderedExercises([...templateExercises]);
    }
  }, [templateExercises]);

  const handleReorder = (newOrder: any[]) => {
    setReorderedExercises(newOrder);
  };

  const moveExercise = (exerciseId: string, direction: 'up' | 'down') => {
    const currentIndex = reorderedExercises.findIndex(ex => ex.id === exerciseId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= reorderedExercises.length) return;
    
    const newOrder = [...reorderedExercises];
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
    
    handleReorder(newOrder);
  };

  const handleTemplateNameEdit = () => {
    setTempTemplateName(template?.name || "");
    setIsEditingTemplateName(true);
  };

  const handleTemplateNameSave = () => {
    if (tempTemplateName.trim() && tempTemplateName !== template?.name) {
      updateTemplateNameMutation.mutate(tempTemplateName.trim());
    } else {
      setIsEditingTemplateName(false);
    }
  };

  const handleTemplateNameCancel = () => {
    setTempTemplateName(template?.name || "");
    setIsEditingTemplateName(false);
  };

  const handleExerciseSelect = (exerciseId: string) => {
    setSelectedExercises(prev => 
      prev.includes(exerciseId) 
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  const handleAddSelectedExercises = () => {
    if (selectedExercises.length === 0) {
      toast({
        title: "Nenhum exercício selecionado",
        description: "Selecione pelo menos um exercício para adicionar.",
        variant: "destructive",
      });
      return;
    }

    // For now, add exercises with default values
    selectedExercises.forEach((exerciseId, index) => {
      const exerciseData = {
        exerciseId,
        sets: 3,
        reps: "8-12",
        weight: null,
        order: reorderedExercises.length + index + 1,
      };
      addExerciseMutation.mutate(exerciseData);
    });

    setSelectedExercises([]);
    setShowExerciseSelector(false);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    removeExerciseMutation.mutate(exerciseId);
  };

  const handleQuickUpdate = (exerciseId: string, field: string, value: any) => {
    // Atualização otimista - atualiza o estado local primeiro
    setReorderedExercises(prev => 
      prev.map(exercise => 
        exercise.id === exerciseId 
          ? { ...exercise, [field]: value }
          : exercise
      )
    );
    
    // Depois envia para o servidor
    updateExerciseMutation.mutate({
      exerciseId,
      updates: { [field]: value }
    });
  };

  const onSubmit = (data: ExerciseFormValues) => {
    if (!editingExercise) return;

    const exerciseData = {
      exerciseId: editingExercise.id,
      sets: data.sets,
      reps: data.reps,
      weight: data.weight,
      order: templateExercises.length + 1,
    };

    addExerciseMutation.mutate(exerciseData);
  };

  const handleSaveWorkout = () => {
    navigate("/treinos");
  };

  // Modal de reordenação
  const openReorderModal = () => {
    setTempReorderedExercises([...reorderedExercises]);
    setShowReorderModal(true);
  };

  const handleReorderModalSave = () => {
    setReorderedExercises(tempReorderedExercises);
    setShowReorderModal(false);
    
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pb-24">
      {/* Header */}
      <div className="glass-card rounded-none border-b border-slate-700/50 p-4 sticky top-0 z-40 backdrop-blur-xl">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/treinos")}
            className="text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 transition-colors px-2 py-1 text-xs"
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            Voltar
          </Button>
          <div className="flex-1 min-w-0">
            {isEditingTemplateName ? (
              <div className="flex items-center space-x-2">
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
                  className="text-2xl font-bold bg-slate-800 border-slate-700 text-white h-12"
                  placeholder="Nome do treino"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleTemplateNameSave}
                  className="gradient-accent"
                  disabled={updateTemplateNameMutation.isPending}
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTemplateNameCancel}
                  className="border-slate-700 text-slate-300"
                >
                  ✕
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 group">
                <h1 className="text-2xl font-bold text-white">
                  {template?.name || "Novo Treino"}
                </h1>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleTemplateNameEdit}
                  className="opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-all duration-300 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
            )}
            <p className="text-slate-400 text-sm">
              {template?.description || "Adicione exercícios ao seu treino"}
            </p>
          </div>
        </div>
      </div>

      {/* Reorder Button */}
      {reorderedExercises.length > 1 && (
        <div className="mobile-container mobile-spacing mb-4">
          <Card className="glass-card rounded-xl border-dashed border-purple-600/50 hover:border-purple-500/50 transition-all duration-200 hover:bg-purple-800/20 cursor-pointer"
                onClick={openReorderModal}>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center space-x-3 text-slate-400 hover:text-purple-400 transition-colors">
                <ArrowUpDown className="w-5 h-5" />
                <span className="font-medium">
                  Reordenar exercícios
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Template Exercises */}
      <div className="mobile-container mobile-spacing">
        {exercisesLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="glass-card rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="loading-skeleton h-6 rounded mb-2 w-3/4"></div>
                    <div className="loading-skeleton h-4 rounded w-1/2"></div>
                  </div>
                  <div className="loading-skeleton h-8 w-16 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : reorderedExercises.length === 0 ? (
          <Card className="glass-card rounded-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                <Plus className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Nenhum exercício adicionado
              </h3>
              <p className="text-slate-400 mb-6">
                Comece adicionando exercícios ao seu treino
              </p>
              <Button
                onClick={() => setShowExerciseSelector(true)}
                className="gradient-accent"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Exercícios
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Reorder.Group
              axis="y"
              values={reorderedExercises}
              onReorder={handleReorder}
              className="space-y-4"
            >
              {reorderedExercises.map((exercise: any, index: number) => (
                  <Reorder.Item
                    key={exercise.id}
                    value={exercise}
                    className="relative"
                    onDragStart={() => setDraggedItem(exercise.id)}
                    onDragEnd={() => setDraggedItem(null)}
                    whileDrag={{ 
                      scale: 1.02, 
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
                      zIndex: 10,
                      rotate: 2
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className={`glass-card rounded-2xl border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-lg transition-all duration-200 ${
                      draggedItem === exercise.id ? 'ring-2 ring-blue-500/50 shadow-2xl' : 'hover:border-slate-600/50'
                    }`}>
                      <CardContent className="mobile-card-padding">
                        <div className="space-y-3">
                          {/* Exercise Header - Layout clean e espaçoso */}
                          <div className="space-y-4">
                            {/* Exercise Number + Name Section */}
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 flex-shrink-0 mt-1">
                                <span className="font-bold text-blue-400 text-sm">{index + 1}</span>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-bold text-white leading-relaxed exercise-name mb-2">
                                  {exercise.exercise?.name || exercise.name || 'Exercício sem nome'}
                                </h3>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60"></div>
                                    <span className="text-blue-300/80 font-medium text-sm">
                                      {exercise.exercise?.muscleGroup || exercise.muscleGroup || 'Grupo muscular'}
                                    </span>
                                  </div>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-7 h-7 p-0 hover:bg-red-500/20 rounded-lg transition-colors opacity-60 hover:opacity-100"
                                    onClick={() => handleRemoveExercise(exercise.id)}
                                    title="Remover exercício"
                                  >
                                    <Trash2 className="text-red-400 w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Parameters - Layout mais espaçoso e legível */}
                          <div className="space-y-6 mt-6">
                            {exercise.exercise?.muscleGroup === 'Cardio' || exercise.muscleGroup === 'Cardio' ? (
                              <>
                                {/* Cardio Parameters */}
                                <div className="space-y-5">
                                  {/* Duration */}
                                  <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                                    <div className="mb-5">
                                      <div className="flex items-center space-x-3 mb-2">
                                        <div className="w-4 h-4 rounded-full bg-green-400"></div>
                                        <label className="text-lg text-slate-200 font-semibold">Duração</label>
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <Input
                                        value={exercise.reps}
                                        onChange={(e) => handleQuickUpdate(exercise.id, 'reps', e.target.value)}
                                        className="text-center bg-slate-700/50 border-slate-600/50 text-white text-2xl font-bold h-20 rounded-xl focus:border-green-400/50 focus:ring-green-400/20"
                                        placeholder="30 min"
                                      />
                                      <div className="text-sm text-slate-400 mt-3">tempo de exercício</div>
                                    </div>
                                  </div>

                                  {/* Distance */}
                                  <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                                    <div className="mb-5">
                                      <div className="flex items-center space-x-3 mb-2">
                                        <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                                        <label className="text-lg text-slate-200 font-semibold">Distância</label>
                                      </div>
                                    </div>
                                    <div className="text-center">
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
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.currentTarget.blur();
                                          }
                                        }}
                                        className="text-center bg-slate-700/50 border-slate-600/50 text-white text-2xl font-bold h-20 rounded-xl focus:border-yellow-400/50 focus:ring-yellow-400/20"
                                        placeholder="5 km"
                                      />
                                      <div className="text-sm text-slate-400 mt-3">distância percorrida</div>
                                    </div>
                                  </div>

                                  {/* Intensity */}
                                  <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                                    <div className="mb-5">
                                      <div className="flex items-center space-x-3 mb-2">
                                        <div className="w-4 h-4 rounded-full bg-purple-400"></div>
                                        <label className="text-lg text-slate-200 font-semibold">Intensidade</label>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <Button
                                        variant="outline"
                                        size="lg"
                                        className="w-16 h-16 p-0 bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 rounded-xl"
                                        onClick={() => exercise.sets > 1 && handleQuickUpdate(exercise.id, 'sets', exercise.sets - 1)}
                                        disabled={exercise.sets <= 1 || updateExerciseMutation.isPending}
                                      >
                                        <Minus className="w-6 h-6" />
                                      </Button>
                                      <div className="text-center px-6">
                                        <div className="text-5xl font-bold text-purple-400 mb-2">{exercise.sets}</div>
                                        <div className="text-sm text-slate-400">nível de intensidade</div>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="lg"
                                        className="w-16 h-16 p-0 bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 rounded-xl"
                                        onClick={() => handleQuickUpdate(exercise.id, 'sets', exercise.sets + 1)}
                                        disabled={updateExerciseMutation.isPending}
                                      >
                                        <Plus className="w-6 h-6" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                {/* Regular Exercises */}
                                <div className="space-y-5">
                                  {/* Séries */}
                                  <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                                    <div className="mb-5">
                                      <div className="flex items-center space-x-3 mb-2">
                                        <div className="w-4 h-4 rounded-full bg-green-400"></div>
                                        <label className="text-lg text-slate-200 font-semibold">Séries</label>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <Button
                                        variant="outline"
                                        size="lg"
                                        className="w-16 h-16 p-0 bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 rounded-xl"
                                        onClick={() => exercise.sets > 1 && handleQuickUpdate(exercise.id, 'sets', exercise.sets - 1)}
                                        disabled={exercise.sets <= 1 || updateExerciseMutation.isPending}
                                      >
                                        <Minus className="w-6 h-6" />
                                      </Button>
                                      <div className="text-center px-6">
                                        <div className="text-5xl font-bold text-green-400 mb-2">{exercise.sets}</div>
                                        <div className="text-sm text-slate-400">número de séries</div>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="lg"
                                        className="w-16 h-16 p-0 bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 rounded-xl"
                                        onClick={() => handleQuickUpdate(exercise.id, 'sets', exercise.sets + 1)}
                                        disabled={updateExerciseMutation.isPending}
                                      >
                                        <Plus className="w-6 h-6" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Repetições */}
                                  <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                                    <div className="mb-5">
                                      <div className="flex items-center space-x-3 mb-2">
                                        <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                                        <label className="text-lg text-slate-200 font-semibold">Repetições</label>
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <Input
                                        value={exercise.reps}
                                        onChange={(e) => handleQuickUpdate(exercise.id, 'reps', e.target.value)}
                                        className="text-center bg-slate-700/50 border-slate-600/50 text-white text-2xl font-bold h-20 rounded-xl focus:border-yellow-400/50 focus:ring-yellow-400/20"
                                        placeholder="8-12"
                                      />
                                      <div className="text-sm text-slate-400 mt-3">repetições por série</div>
                                    </div>
                                  </div>

                                  {/* Peso */}
                                  <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                                    <div className="mb-5">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-4 h-4 rounded-full bg-purple-400"></div>
                                        <label className="text-lg text-slate-200 font-semibold">Peso (kg)</label>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                      <Button
                                        variant="outline"
                                        size="lg"
                                        className="w-16 h-16 p-0 bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 rounded-xl"
                                        onClick={() => {
                                          const currentWeight = exercise.weight || 0;
                                          const newWeight = Math.max(0, currentWeight - 2.5);
                                          handleQuickUpdate(exercise.id, 'weight', newWeight === 0 ? null : newWeight);
                                        }}
                                        disabled={updateExerciseMutation.isPending}
                                      >
                                        <Minus className="w-6 h-6" />
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
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.currentTarget.blur();
                                            }
                                          }}
                                          className="text-center bg-slate-700/50 border-slate-600/50 text-white text-2xl font-bold h-20 rounded-xl focus:border-purple-400/50 focus:ring-purple-400/20"
                                          placeholder="Ex: 20"
                                        />
                                        <div className="text-sm text-slate-400 mt-3 text-center">quilos utilizados</div>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="lg"
                                        className="w-16 h-16 p-0 bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 rounded-xl"
                                        onClick={() => {
                                          const currentWeight = exercise.weight || 0;
                                          const newWeight = currentWeight + 2.5;
                                          handleQuickUpdate(exercise.id, 'weight', newWeight);
                                        }}
                                        disabled={updateExerciseMutation.isPending}
                                      >
                                        <Plus className="w-6 h-6" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Rest Duration */}
                            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                              <div className="mb-5">
                                <div className="flex items-center space-x-3">
                                  <div className="w-4 h-4 rounded-full bg-orange-400"></div>
                                  <label className="text-lg text-slate-200 font-semibold flex items-center">
                                    <Timer className="w-5 h-5 mr-2" />
                                    Tempo de Descanso
                                  </label>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <Button
                                  variant="outline"
                                  size="lg"
                                  className="w-16 h-16 p-0 bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 rounded-xl"
                                  onClick={() => {
                                    const currentRest = exercise.restDurationSeconds || exercise.restDuration || 90;
                                    const newRest = Math.max(30, currentRest - 15);
                                    handleQuickUpdate(exercise.id, 'restDurationSeconds', newRest);
                                  }}
                                  disabled={updateExerciseMutation.isPending}
                                >
                                  <Minus className="w-6 h-6" />
                                </Button>
                                <div className="text-center px-6">
                                  <div className="text-5xl font-bold text-orange-400 mb-2">
                                    {Math.floor((exercise.restDurationSeconds || exercise.restDuration || 90) / 60)}:{((exercise.restDurationSeconds || exercise.restDuration || 90) % 60).toString().padStart(2, '0')}
                                  </div>
                                  <div className="text-sm text-slate-400">minutos entre séries</div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="lg"
                                  className="w-16 h-16 p-0 bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 rounded-xl"
                                  onClick={() => {
                                    const currentRest = exercise.restDurationSeconds || exercise.restDuration || 90;
                                    const newRest = Math.min(300, currentRest + 15);
                                    handleQuickUpdate(exercise.id, 'restDurationSeconds', newRest);
                                  }}
                                  disabled={updateExerciseMutation.isPending}
                                >
                                  <Plus className="w-6 h-6" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Reorder.Item>
              ))}
            </Reorder.Group>
            
            {/* Action Buttons */}
            <div className="space-y-4">
              {/* Reorder Exercises Button */}
              {reorderedExercises.length > 0 && (
                <Card className="glass-card rounded-xl border-dashed border-purple-600/50 hover:border-purple-500/50 transition-all duration-200 hover:bg-purple-800/20 cursor-pointer"
                      onClick={openReorderModal}>
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center space-x-3 text-slate-400 hover:text-purple-400 transition-colors">
                      <ArrowUpDown className="w-5 h-5" />
                      <span className="font-medium">
                        Reordenar exercícios ({reorderedExercises.length})
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Add More Exercises Button */}
              <Card className="glass-card rounded-xl border-dashed border-slate-600/50 hover:border-blue-500/50 transition-all duration-200 hover:bg-slate-800/30 cursor-pointer"
                    onClick={() => setShowExerciseSelector(true)}>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center space-x-3 text-slate-400 hover:text-blue-400 transition-colors">
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Adicionar mais exercícios</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Save Workout Button */}
            <div className="flex justify-center pt-6">
              <Button
                onClick={handleSaveWorkout}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition-all duration-300 flex items-center space-x-2"
              >
                <Save className="w-5 h-5" />
                <span>Salvar Treino</span>
              </Button>
            </div>
          </>
        )}

      </div>

      {/* Exercise Selector Dialog - Simplified */}
      <Dialog open={showExerciseSelector} onOpenChange={setShowExerciseSelector}>
        <DialogContent className="max-w-3xl max-h-[85vh] glass-card border-slate-700 flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white text-xl font-bold">Escolher Exercícios</DialogTitle>
            <p className="text-slate-400 text-sm">Clique nos exercícios para adicionar ao treino (mais rápido!)</p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <QuickExerciseSelector
              onExerciseAdd={(exerciseId) => {
                const exerciseData = {
                  exerciseId,
                  sets: 3,
                  reps: "8-12",
                  weight: null,
                  order: reorderedExercises.length + 1,
                };
                addExerciseMutation.mutate(exerciseData);
              }}
              excludeExercises={reorderedExercises.map(ex => ex.exerciseId)}
            />
          </div>
          <div className="flex justify-center pt-4 border-t border-slate-700">
            <Button
              variant="outline"
              onClick={() => setShowExerciseSelector(false)}
              className="border-slate-700 text-slate-300"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exercise Form Dialog - Mobile Optimized */}
      <Dialog open={isExerciseFormOpen} onOpenChange={setIsExerciseFormOpen}>
        <DialogContent className="glass-card border-slate-700 max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-lg leading-relaxed">
              Configurar: <span className="block mt-1 font-semibold exercise-name">{editingExercise?.name}</span>
            </DialogTitle>
            <p className="text-slate-400 text-sm">Defina os parâmetros iniciais</p>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Séries com botões +/- */}
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
              
              {/* Repetições */}
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
              
              {/* Peso com sugestões rápidas */}
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
                  className="flex-1 h-14 gradient-accent rounded-xl touch-manipulation"
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
        <DialogContent className="max-w-lg max-h-[85vh] glass-card border-slate-700 flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white text-xl font-bold">Reordenar Exercícios</DialogTitle>
            <p className="text-slate-400 text-sm">Use os botões para mover os exercícios para cima ou para baixo</p>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3">
              {tempReorderedExercises.map((exercise: any, index: number) => (
                <Card key={exercise.id} className="glass-card rounded-xl border-slate-700/50 bg-slate-800/30">
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
          
          <div className="flex justify-between pt-4 border-t border-slate-700 gap-3">
            <Button
              variant="outline"
              onClick={handleReorderModalCancel}
              className="flex-1 border-slate-700 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReorderModalSave}
              className="flex-1 gradient-accent"
            >
              Aplicar Nova Ordem
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}