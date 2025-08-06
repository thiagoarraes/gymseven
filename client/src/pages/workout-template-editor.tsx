import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Save, Trash2, Edit3, GripVertical } from "lucide-react";
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

  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      sets: 3,
      reps: "8-12",
      weight: undefined,
    },
  });

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
        order: templateExercises.length + index + 1,
      };
      addExerciseMutation.mutate(exerciseData);
    });

    setSelectedExercises([]);
    setShowExerciseSelector(false);
  };

  const onSubmit = (data: ExerciseFormValues) => {
    if (!editingExercise) return;

    const exerciseData = {
      exerciseId: editingExercise.id,
      sets: data.sets,
      reps: data.reps,
      weight: data.weight || null,
      order: templateExercises.length + 1,
    };

    addExerciseMutation.mutate(exerciseData);
  };

  if (templateLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="loading-skeleton h-8 w-48 rounded mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-4">
                <div className="loading-skeleton h-6 w-3/4 rounded mb-2"></div>
                <div className="loading-skeleton h-4 w-1/2 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/workouts")}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {template?.name || "Novo Treino"}
            </h1>
            <p className="text-slate-400 text-sm">
              {template?.description || "Adicione exercícios ao seu treino"}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowExerciseSelector(true)}
          className="gradient-accent hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4 mr-2" />
          Exercícios
        </Button>
      </div>

      {/* Template Exercises */}
      <div className="space-y-4">
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
        ) : templateExercises.length === 0 ? (
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
          templateExercises.map((exercise: any, index: number) => (
            <Card key={exercise.id} className="glass-card rounded-xl hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-slate-500">
                    <GripVertical className="w-4 h-4" />
                    <span className="font-mono text-sm">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-lg">
                      {exercise.name}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-slate-400 mt-1">
                      <span>{exercise.sets} séries</span>
                      <span>{exercise.reps} reps</span>
                      {exercise.weight && <span>{exercise.weight}kg</span>}
                      <span className="text-xs bg-blue-500/20 px-2 py-1 rounded">
                        {exercise.muscleGroup}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 bg-slate-800/50 rounded-lg hover:bg-red-500/20 transition-colors"
                    onClick={() => {
                      // TODO: Implement remove exercise
                      toast({
                        title: "Em breve",
                        description: "Funcionalidade de remover exercícios em desenvolvimento.",
                      });
                    }}
                  >
                    <Trash2 className="text-red-400 w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Exercise Selector Dialog */}
      <Dialog open={showExerciseSelector} onOpenChange={setShowExerciseSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden glass-card border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Adicionar Exercícios</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <Exercises
              selectionMode={true}
              selectedExercises={selectedExercises}
              onExerciseSelect={handleExerciseSelect}
            />
          </div>
          <div className="flex justify-between pt-4 border-t border-slate-700">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedExercises([]);
                setShowExerciseSelector(false);
              }}
              className="border-slate-700 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddSelectedExercises}
              disabled={selectedExercises.length === 0 || addExerciseMutation.isPending}
              className="gradient-accent"
            >
              Adicionar {selectedExercises.length > 0 && `(${selectedExercises.length})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exercise Form Dialog */}
      <Dialog open={isExerciseFormOpen} onOpenChange={setIsExerciseFormOpen}>
        <DialogContent className="glass-card border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Configurar Exercício: {editingExercise?.name}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="sets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Séries</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="bg-slate-800 border-slate-700 text-white"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Repetições</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 8-12, 15, 10"
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
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Peso (kg) - Opcional</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="Ex: 20, 45.5"
                        className="bg-slate-800 border-slate-700 text-white"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                  onClick={() => setIsExerciseFormOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gradient-accent"
                  disabled={addExerciseMutation.isPending}
                >
                  Adicionar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}