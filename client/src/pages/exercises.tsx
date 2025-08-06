import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Edit, Trash2, Dumbbell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { exerciseApi } from "@/lib/api";
import { MUSCLE_GROUPS } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const exerciseFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  muscleGroup: z.string().min(1, "Grupo muscular é obrigatório"),
  description: z.string().optional(),
  imageUrl: z.string().url("URL da imagem inválida").optional().or(z.literal("")),
});

type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;

export default function Exercises() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("Todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any>(null);
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
      description: "",
      imageUrl: "",
    },
  });

  const onSubmit = (data: ExerciseFormValues) => {
    if (editingExercise) {
      updateMutation.mutate({ id: editingExercise.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (exercise: any) => {
    setEditingExercise(exercise);
    form.reset({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      description: exercise.description || "",
      imageUrl: exercise.imageUrl || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este exercício?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMuscleGroup = selectedMuscleGroup === "Todos" || exercise.muscleGroup === selectedMuscleGroup;
    return matchesSearch && matchesMuscleGroup;
  });

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Search and Filters */}
      <Card className="glass-card rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar exercícios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder-slate-400"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="gradient-accent p-3 hover:scale-105 transition-transform"
                  onClick={() => {
                    setEditingExercise(null);
                    form.reset({
                      name: "",
                      muscleGroup: "",
                      description: "",
                      imageUrl: "",
                    });
                  }}
                >
                  <Plus className="w-4 h-4" />
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
                      name="muscleGroup"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200">Grupo Muscular</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                <SelectValue placeholder="Selecione o grupo muscular" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              {MUSCLE_GROUPS.map((group) => (
                                <SelectItem key={group} value={group}>
                                  {group}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                              placeholder="Descrição do exercício..."
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
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200">URL da Imagem</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://..."
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
                        {editingExercise ? "Atualizar" : "Criar"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Muscle Group Filters */}
          <div className="flex overflow-x-auto space-x-2 pb-2">
            <Button
              variant={selectedMuscleGroup === "Todos" ? "default" : "outline"}
              size="sm"
              className={`whitespace-nowrap ${
                selectedMuscleGroup === "Todos" 
                  ? "gradient-accent text-white" 
                  : "glass-card border-slate-700 text-slate-300 hover-lift"
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
                    : "glass-card border-slate-700 text-slate-300 hover-lift"
                }`}
                onClick={() => setSelectedMuscleGroup(group)}
              >
                {group}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exercise Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="glass-card rounded-xl overflow-hidden">
              <div className="h-40 loading-skeleton"></div>
              <CardContent className="p-4">
                <div className="loading-skeleton h-6 rounded mb-2"></div>
                <div className="loading-skeleton h-4 rounded mb-3 w-3/4"></div>
                <div className="loading-skeleton h-8 rounded"></div>
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
              setEditingExercise(null);
              form.reset({
                name: "",
                muscleGroup: "",
                description: "",
                imageUrl: "",
              });
              setIsDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Exercício
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map((exercise) => (
            <Card key={exercise.id} className="glass-card rounded-xl overflow-hidden hover-lift cursor-pointer">
              <div className="relative h-40 bg-gradient-to-br from-blue-500/20 to-purple-500/20 overflow-hidden">
                {exercise.imageUrl ? (
                  <img
                    src={exercise.imageUrl}
                    alt={exercise.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Dumbbell className="w-12 h-12 text-blue-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className="bg-blue-500/80 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                    {exercise.muscleGroup}
                  </span>
                </div>
              </div>
              <CardContent className="p-4">
                <h4 className="font-semibold text-white mb-1">{exercise.name}</h4>
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                  {exercise.description || "Sem descrição"}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-xs text-slate-500">
                    <Dumbbell className="w-3 h-3" />
                    <span>{exercise.muscleGroup}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(exercise);
                      }}
                    >
                      <Edit className="text-slate-400 w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1.5 bg-slate-800 rounded-lg hover:bg-red-500/20 hover:border-red-500/20 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(exercise.id);
                      }}
                    >
                      <Trash2 className="text-red-400 hover:text-red-300 w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
