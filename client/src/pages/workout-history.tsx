import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Play, Clock, Dumbbell, Calendar, TrendingUp, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { motion, PanInfo } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface WorkoutLog {
  id: string;
  templateId?: string;
  name: string;
  startTime: string;
  endTime?: string;
  completed?: boolean;
}

interface WorkoutSummary {
  id?: string;
  name?: string;
  startTime?: string;
  endTime?: string;
  completed?: boolean;
  exercises?: Array<{
    id: string;
    name: string;
    muscleGroup: string;
    sets: Array<{
      setNumber: number;
      reps?: number;
      weight?: number;
      completed: boolean;
    }>;
  }>;
  totalSets?: number;
  totalVolume?: number;
  duration?: string;
}

export default function WorkoutHistory() {
  const [, navigate] = useLocation();
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [swipedWorkout, setSwipedWorkout] = useState<string | null>(null);
  const [draggedWorkout, setDraggedWorkout] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch workout logs
  const { data: workoutLogs = [], isLoading } = useQuery<WorkoutLog[]>({
    queryKey: ['/api/workout-logs'],
  });

  // Fetch workout summary when modal opens  
  const { data: workoutSummary, isLoading: summaryLoading } = useQuery<WorkoutSummary>({
    queryKey: ['/api/workout-logs', selectedWorkout, 'summary'],
    queryFn: async () => {
      const response = await fetch(`/api/workout-logs/${selectedWorkout}/summary`);
      return response.json();
    },
    enabled: !!selectedWorkout && showSummaryModal,
  });

  // Delete workout mutation
  const deleteWorkoutMutation = useMutation({
    mutationFn: async (workoutId: string) => {
      const response = await fetch(`/api/workout-logs/${workoutId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Erro ao excluir treino');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workout-logs'] });
      toast({
        title: "Treino excluído",
        description: "O treino foi removido do seu histórico.",
      });
      setSwipedWorkout(null);
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o treino. Tente novamente.",
        variant: "destructive",
      });
      setSwipedWorkout(null);
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateDuration = (start: string, end?: string) => {
    if (!end) return "Em andamento";
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleWorkoutClick = (workoutId: string) => {
    if (swipedWorkout === workoutId) return; // Não abrir se estiver no modo swipe
    setSelectedWorkout(workoutId);
    setShowSummaryModal(true);
  };

  const handleSwipeEnd = (info: PanInfo, workoutId: string) => {
    const { offset, velocity } = info;
    const swipeThreshold = -40;
    const velocityThreshold = -500;

    if (offset.x < swipeThreshold || velocity.x < velocityThreshold) {
      setSwipedWorkout(workoutId);
    } else {
      setSwipedWorkout(null);
    }
    
    // Clear dragged state
    setDraggedWorkout(null);
  };

  const handleDragStart = (workoutId: string) => {
    setDraggedWorkout(workoutId);
  };

  const handleDeleteWorkout = (workoutId: string) => {
    deleteWorkoutMutation.mutate(workoutId);
  };

  const closeSummaryModal = () => {
    setShowSummaryModal(false);
    setSelectedWorkout(null);
  };

  return (
    <div className="container mx-auto px-4 space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Histórico de Treinos</h1>
          <p className="text-slate-400 text-sm">
            Visualize seus treinos anteriores e acompanhe seu progresso
          </p>
        </div>
      </div>

      {/* Workout List */}
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
                  <div className="loading-skeleton h-8 w-20 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : workoutLogs.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Nenhum treino registrado
          </h3>
          <p className="text-slate-400 mb-6">
            Complete alguns treinos para ver seu histórico aqui
          </p>
          <Button 
            className="gradient-accent"
            onClick={() => navigate("/workouts")}
          >
            <Play className="w-4 h-4 mr-2" />
            Começar primeiro treino
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {workoutLogs.map((workout) => (
            <div key={workout.id} className="relative overflow-hidden">
              {/* Background Delete Button - WhatsApp Style */}
              <div 
                className={`absolute right-0 top-0 bottom-0 flex transition-all duration-300 ${
                  (swipedWorkout === workout.id || draggedWorkout === workout.id) ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ zIndex: 1 }}
              >
                {/* Delete Button Column */}
                <div
                  className="flex items-center justify-center w-24 h-[4.75rem] bg-red-500 rounded-xl cursor-pointer hover:bg-red-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteWorkout(workout.id);
                  }}
                >
                  <div className="flex flex-col items-center justify-center text-white">
                    <Trash2 className="w-6 h-6 mb-1" />
                    <span className="text-sm font-medium">Apagar</span>
                  </div>
                </div>
              </div>
              
              {/* Swipeable Card */}
              <motion.div
                drag="x"
                dragConstraints={{ left: -96, right: 0, top: 0, bottom: 0 }}
                dragElastic={{ left: 0.1, right: 0.1, top: 0, bottom: 0 }}
                dragDirectionLock={true}
                dragPropagation={false}
                onDragStart={() => handleDragStart(workout.id)}
                onDragEnd={(_, info) => handleSwipeEnd(info, workout.id)}
                onDrag={(_, info) => {
                  // Force y position to stay at 0 during drag
                  if (info.point.y !== 0) {
                    info.point.y = 0;
                  }
                }}
                animate={{ 
                  x: swipedWorkout === workout.id ? -96 : 0,
                  y: 0
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ zIndex: 2 }}
                className="relative"
              >
                <Card 
                  className="glass-card rounded-xl cursor-pointer transition-all duration-200 h-20"
                  onClick={() => (swipedWorkout === workout.id || draggedWorkout === workout.id) ? null : handleWorkoutClick(workout.id)}
                >
                  <CardContent className="p-4 h-20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          workout.endTime ? "gradient-accent" : "bg-slate-700/50"
                        }`}>
                          {workout.endTime ? (
                            <CheckCircle className="w-6 h-6 text-white" />
                          ) : (
                            <XCircle className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white text-lg">{workout.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-slate-400">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(workout.startTime)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{calculateDuration(workout.startTime, workout.endTime)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={workout.endTime ? "default" : "secondary"}
                          className={workout.endTime 
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                            : "bg-slate-700/50 text-slate-400 border-slate-600/50"
                          }
                        >
                          {workout.endTime ? "Concluído" : "Incompleto"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          ))}
        </div>
      )}

      {/* Workout Summary Modal */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden glass-card border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Resumo do Treino</DialogTitle>
            <DialogDescription className="text-slate-400">
              Visualize os detalhes completos do seu treino, incluindo exercícios realizados e estatísticas.
            </DialogDescription>
          </DialogHeader>
          
          {summaryLoading ? (
            <div className="space-y-4">
              <div className="loading-skeleton h-8 rounded w-3/4"></div>
              <div className="loading-skeleton h-20 rounded"></div>
              <div className="loading-skeleton h-32 rounded"></div>
            </div>
          ) : workoutSummary ? (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Workout Info */}
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                <h3 className="font-semibold text-white text-lg mb-3">{workoutSummary.name}</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-400">{workoutSummary.exercises?.length || 0}</div>
                    <div className="text-xs text-slate-400">Exercícios</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-emerald-400">{workoutSummary.totalSets || 0}</div>
                    <div className="text-xs text-slate-400">Total de séries</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-400">{workoutSummary.totalVolume || 0}kg</div>
                    <div className="text-xs text-slate-400">Volume total</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-400">{workoutSummary.duration || "N/A"}</div>
                    <div className="text-xs text-slate-400">Duração</div>
                  </div>
                </div>
              </div>

              {/* Exercises */}
              {workoutSummary.exercises && workoutSummary.exercises.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-slate-200">Exercícios realizados</h4>
                {workoutSummary.exercises.map((exercise, index) => (
                  <div key={exercise.id} className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30">
                        <span className="font-bold text-blue-400 text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <h5 className="font-medium text-white">{exercise.name}</h5>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                          <span className="text-sm text-blue-300">{exercise.muscleGroup}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sets */}
                    <div className="space-y-2">
                      {exercise.sets.map((set) => (
                        <div key={set.setNumber} className="flex items-center justify-between py-2 px-3 bg-slate-700/30 rounded-lg">
                          <span className="text-sm text-slate-300">Série {set.setNumber}</span>
                          <div className="flex items-center space-x-4 text-sm">
                            {set.reps && (
                              <span className="text-yellow-400">{set.reps} reps</span>
                            )}
                            {set.weight && (
                              <span className="text-purple-400">{set.weight}kg</span>
                            )}
                            <div className={`w-2 h-2 rounded-full ${
                              set.completed ? "bg-emerald-400" : "bg-slate-500"
                            }`}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-4" />
              <p>Erro ao carregar dados do treino</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}