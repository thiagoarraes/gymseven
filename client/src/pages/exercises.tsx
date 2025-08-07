import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Edit, Trash2, Dumbbell, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { exerciseApi } from "@/lib/api";
import { MUSCLE_GROUPS } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["/api/exercises"],
    queryFn: exerciseApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: exerciseApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
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

  const filteredExercises = exercises.filter((exercise) => {
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
          <h1 className="text-2xl font-bold text-white mb-1">
            {selectionMode ? "Selecionar Exercícios" : "Exercícios"}
          </h1>
          <p className="text-slate-400 text-sm">
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
      <Card className="glass-card rounded-2xl">
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Buscar exercícios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder-slate-400"
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
                  : "glass-card border-slate-700 text-slate-300"
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
                    : "glass-card border-slate-700 text-slate-300"
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
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="glass-card rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="loading-skeleton h-6 rounded mb-2 w-3/4"></div>
                    <div className="loading-skeleton h-4 rounded w-1/2"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="loading-skeleton h-8 w-8 rounded-lg"></div>
                    <div className="loading-skeleton h-8 w-8 rounded-lg"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {searchTerm || selectedMuscleGroup !== "Todos" 
              ? "Nenhum exercício encontrado" 
              : "Nenhum exercício cadastrado"
            }
          </h3>
          <p className="text-slate-400 mb-6">
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
        <div className="space-y-3">
          {filteredExercises.map((exercise) => (
            <div key={exercise.id} className="relative overflow-hidden">
              {/* Background Action Buttons - WhatsApp Style */}
              {!selectionMode && (
                <div 
                  className={`absolute right-0 top-0 flex transition-all duration-300 h-full ${
                    (swipedExercise === exercise.id || draggedExercise === exercise.id) ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ zIndex: 1 }}
                >
                  {/* Edit Button Column */}
                  <div
                    className="flex items-center justify-center w-20 h-full bg-blue-500 rounded-l-xl cursor-pointer hover:bg-blue-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(exercise);
                      setSwipedExercise(null);
                    }}
                  >
                    <div className="flex flex-col items-center justify-center text-white">
                      <Edit className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium">Editar</span>
                    </div>
                  </div>
                  
                  {/* Delete Button Column */}
                  <div
                    className="flex items-center justify-center w-20 h-full bg-red-500 rounded-r-xl cursor-pointer hover:bg-red-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(exercise.id);
                      setSwipedExercise(null);
                    }}
                  >
                    <div className="flex flex-col items-center justify-center text-white">
                      <Trash2 className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium">Apagar</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Swipeable Card */}
              <motion.div
                drag={!selectionMode ? "x" : false}
                dragConstraints={{ left: -160, right: 0, top: 0, bottom: 0 }}
                dragElastic={{ left: 0.1, right: 0.1, top: 0, bottom: 0 }}
                dragDirectionLock={true}
                dragPropagation={false}
                onDragStart={() => !selectionMode && handleDragStart(exercise.id)}
                onDragEnd={(_, info) => !selectionMode && handleSwipeEnd(info, exercise.id)}
                onDrag={(_, info) => {
                  // Force y position to stay at 0 during drag
                  if (info.point.y !== 0) {
                    info.point.y = 0;
                  }
                }}
                animate={{ 
                  x: swipedExercise === exercise.id ? -160 : 0,
                  y: 0
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ zIndex: 2 }}
                className="relative"
              >
                <Card 
                  className={`glass-card rounded-xl hover-lift cursor-pointer transition-all duration-200 h-20 ${
                    selectionMode && selectedExercises.includes(exercise.id) 
                      ? "ring-2 ring-blue-500 bg-blue-500/10" 
                      : ""
                  }`}
                  onClick={() => selectionMode && onExerciseSelect?.(exercise.id)}
                >
                  <CardContent className="p-4 h-20 flex items-center">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                          <Dumbbell className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white text-lg">{exercise.name}</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-400">{exercise.muscleGroup}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {selectionMode && selectedExercises.includes(exercise.id) && (
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}