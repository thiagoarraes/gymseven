import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { 
  Pause, 
  Square, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Play,
  Timer,
  Dumbbell
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { workoutLogApi, workoutTemplateApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function WorkoutSession() {
  const [, params] = useRoute("/workout-session/:id");
  const [, navigate] = useLocation();
  const [isPaused, setIsPaused] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentWeight, setCurrentWeight] = useState("");
  const [currentReps, setCurrentReps] = useState("");
  const [logExerciseIds, setLogExerciseIds] = useState<{[key: string]: string}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const workoutId = params?.id;

  const { data: workoutLog, isLoading: logLoading } = useQuery({
    queryKey: ["/api/workout-logs", workoutId],
    queryFn: () => workoutLogApi.getById(workoutId!),
    enabled: !!workoutId,
  });

  const { data: templateExercises = [], isLoading: exercisesLoading } = useQuery({
    queryKey: ["/api/workout-templates", workoutLog?.templateId, "exercises"],
    queryFn: () => workoutTemplateApi.getExercises(workoutLog!.templateId!),
    enabled: !!workoutLog?.templateId,
  });

  // Create workout log exercises when template exercises are loaded
  useEffect(() => {
    if (!templateExercises.length || !workoutId || Object.keys(logExerciseIds).length > 0) return;

    const createLogExercises = async () => {
      const newLogExerciseIds: {[key: string]: string} = {};
      
      for (const templateExercise of templateExercises) {
        try {
          const logExercise = await workoutLogApi.createExercise({
            logId: workoutId,
            exerciseId: templateExercise.exerciseId,
            order: templateExercise.order
          });
          newLogExerciseIds[templateExercise.exerciseId] = logExercise.id;
        } catch (error) {
          console.error('Error creating log exercise:', error);
        }
      }
      
      setLogExerciseIds(newLogExerciseIds);
    };

    createLogExercises();
  }, [templateExercises, workoutId, logExerciseIds]);

  // Initialize weight and reps when first exercise loads
  useEffect(() => {
    if (templateExercises.length > 0 && currentExerciseIndex === 0 && !currentWeight && !currentReps) {
      const firstExercise = templateExercises[0];
      setCurrentWeight(firstExercise?.weight?.toString() || "");
      setCurrentReps(firstExercise?.reps?.toString() || "");
    }
  }, [templateExercises, currentExerciseIndex, currentWeight, currentReps]);

  const finishWorkoutMutation = useMutation({
    mutationFn: () => workoutLogApi.update(workoutId!, {
      endTime: new Date(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-logs"] });
      toast({
        title: "Treino finalizado!",
        description: "Parabéns! Treino concluído com sucesso.",
      });
      navigate("/");
    },
  });

  // Workout timer
  useEffect(() => {
    if (!workoutLog || isPaused) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(workoutLog.startTime).getTime();
      setWorkoutDuration(Math.floor((now - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [workoutLog, isPaused]);

  // Rest timer
  useEffect(() => {
    if (restTimer <= 0) return;

    const interval = setInterval(() => {
      setRestTimer(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [restTimer]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinishWorkout = () => {
    if (confirm("Tem certeza que deseja finalizar o treino?")) {
      finishWorkoutMutation.mutate();
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < templateExercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSetIndex(0);
      const nextExercise = templateExercises[currentExerciseIndex + 1];
      setRestTimer(nextExercise?.restDurationSeconds || 90);
      
      // Initialize weight and reps with template defaults for the new exercise
      setCurrentWeight(nextExercise?.weight?.toString() || "");
      setCurrentReps(nextExercise?.reps?.toString() || "");
    }
  };

  const handlePrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setCurrentSetIndex(0);
      
      // Initialize weight and reps with template defaults for the previous exercise
      const prevExercise = templateExercises[currentExerciseIndex - 1];
      setCurrentWeight(prevExercise?.weight?.toString() || "");
      setCurrentReps(prevExercise?.reps?.toString() || "");
    }
  };

  const handleCompleteSet = async () => {
    const currentExercise = templateExercises[currentExerciseIndex];
    const logExerciseId = logExerciseIds[currentExercise?.exerciseId];
    
    // Save the set data if we have weight/reps
    if (logExerciseId && (currentWeight || currentReps)) {
      try {
        await workoutLogApi.createSet({
          logExerciseId,
          setNumber: currentSetIndex + 1,
          weight: currentWeight ? parseFloat(currentWeight) : null,
          reps: currentReps ? parseInt(currentReps) : null
        });
        console.log(`Set ${currentSetIndex + 1} saved: ${currentWeight}kg x ${currentReps} reps`);
      } catch (error) {
        console.error('Error saving set:', error);
      }
    }

    if (currentSetIndex < currentExercise?.sets - 1) {
      // Move to next set and reset to template defaults
      setCurrentSetIndex(prev => prev + 1);
      setRestTimer(currentExercise?.restDurationSeconds || 90);
      setCurrentWeight(currentExercise?.weight?.toString() || "");
      setCurrentReps(currentExercise?.reps?.toString() || "");
      toast({
        title: "Série concluída!",
        description: "Ótimo trabalho, continue assim.",
      });
    } else {
      // Last set of exercise
      if (currentExerciseIndex < templateExercises.length - 1) {
        handleNextExercise();
        toast({
          title: "Exercício concluído!",
          description: "Próximo exercício carregado.",
        });
      } else {
        // Last set of last exercise - show celebration and finish workout
        setShowCelebration(true);
      }
    }
  };

  if (logLoading || exercisesLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <Card className="glass-card rounded-2xl">
            <CardContent className="p-6">
              <div className="loading-skeleton h-8 rounded mb-4"></div>
              <div className="loading-skeleton h-2 rounded mb-4"></div>
              <div className="flex space-x-3">
                <div className="loading-skeleton h-10 rounded flex-1"></div>
                <div className="loading-skeleton h-10 rounded flex-1"></div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card rounded-2xl">
            <CardContent className="p-6">
              <div className="loading-skeleton h-32 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!workoutLog) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-white mb-4">Treino não encontrado</h2>
          <Button onClick={() => navigate("/workouts")}>
            Voltar aos treinos
          </Button>
        </div>
      </div>
    );
  }

  const currentExercise = templateExercises[currentExerciseIndex];
  const progress = templateExercises.length > 0 
    ? ((currentExerciseIndex + (currentSetIndex + 1) / (currentExercise?.sets || 1)) / templateExercises.length) * 100
    : 0;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Workout Header */}
      <Card className="glass-card rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">{workoutLog.name}</h2>
              <p className="text-sm text-slate-400">
                Exercício {currentExerciseIndex + 1} de {templateExercises.length}
              </p>
              {currentExercise && (
                <p className="text-sm text-blue-300 font-medium mt-1">
                  {currentExercise.exercise?.name || currentExercise.name || 'Exercício'}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-emerald-400">
                {formatTime(workoutDuration)}
              </div>
              <div className="text-xs text-slate-500">
                {isPaused ? "pausado" : "em andamento"}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <Progress 
            value={progress} 
            className="w-full mb-4 h-2"
          />
          
          {/* Quick Actions */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="flex-1 glass-card border-slate-700 py-2 rounded-lg font-medium text-slate-300"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
              {isPaused ? "Continuar" : "Pausar"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 glass-card border-slate-700 py-2 rounded-lg font-medium text-slate-300"
              onClick={handleFinishWorkout}
            >
              <Square className="w-4 h-4 mr-2" />
              Finalizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Exercise */}
      {currentExercise && (
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">{currentExercise.exercise?.name || currentExercise.name || 'Exercício'}</h3>
              <p className="text-sm text-slate-400">{currentExercise.exercise?.muscleGroup || currentExercise.muscleGroup || 'Grupo muscular'}</p>
            </div>
            
            {/* Sets Tracking */}
            <div className="space-y-3">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                Séries - {currentSetIndex + 1} de {currentExercise.sets}
              </div>
              
              {/* Current Set */}
              <div className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-xl border border-blue-500/30">
                <div className="w-8 h-8 bg-blue-500/20 border border-blue-500 rounded-lg flex items-center justify-center font-semibold text-blue-400 text-sm">
                  {currentSetIndex + 1}
                </div>
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Peso (kg)</label>
                    <Input 
                      type="number" 
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(e.target.value)}
                      placeholder={currentExercise.weight?.toString() || "0"}
                      className="w-full bg-slate-800 border-slate-700 text-white text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Reps</label>
                    <Input 
                      type="number" 
                      value={currentReps}
                      onChange={(e) => setCurrentReps(e.target.value)}
                      placeholder={currentExercise.reps?.toString() || "12"}
                      className="w-full bg-slate-800 border-slate-700 text-white text-center"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      className="w-full gradient-accent py-2 rounded-lg font-semibold text-white hover:scale-105 transition-transform"
                      onClick={handleCompleteSet}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Upcoming Sets Preview */}
              {Array.from({ length: Math.min(2, currentExercise.sets - currentSetIndex - 1) }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-slate-800/20 rounded-xl border border-slate-700/30">
                  <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center font-semibold text-slate-500 text-sm">
                    {currentSetIndex + index + 2}
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Peso (kg)</label>
                      <Input 
                        disabled 
                        className="w-full bg-slate-800/50 border-slate-700/50 text-slate-500 text-center" 
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Reps</label>
                      <Input 
                        disabled 
                        className="w-full bg-slate-800/50 border-slate-700/50 text-slate-500 text-center" 
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        disabled 
                        className="w-full bg-slate-800/50 border-slate-700/50 py-2 rounded-lg font-semibold text-slate-600"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Rest Timer */}
            {restTimer > 0 && (
              <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm text-orange-400 font-medium">Descanso</div>
                    <div className="text-xs text-slate-400">Entre séries</div>
                  </div>
                  <div className="text-2xl font-bold text-orange-400">{formatTime(restTimer)}</div>
                </div>
                <Progress 
                  value={((templateExercises[currentExerciseIndex]?.restDurationSeconds || 90) - restTimer) / (templateExercises[currentExerciseIndex]?.restDurationSeconds || 90) * 100}
                  className="w-full mb-3 h-2"
                />
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 bg-slate-800/50 border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
                    onClick={() => setRestTimer(prev => Math.max(0, prev - 15))}
                  >
                    -15s
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 bg-slate-800/50 border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
                    onClick={() => setRestTimer(prev => prev + 15)}
                  >
                    +15s
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 bg-slate-800/50 border-red-500/30 text-red-400 hover:bg-red-500/20"
                    onClick={() => setRestTimer(0)}
                  >
                    Pular
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex space-x-3">
        <Button
          variant="outline"
          className="flex-1 glass-card border-slate-700 py-4 rounded-xl font-semibold text-slate-300"
          onClick={handlePrevExercise}
          disabled={currentExerciseIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button
          className="flex-1 gradient-accent py-4 rounded-xl font-semibold text-white hover:scale-105 transition-transform"
          onClick={handleNextExercise}
          disabled={currentExerciseIndex >= templateExercises.length - 1}
        >
          Próximo
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          {/* Completion Modal */}
          <Card className="glass-card rounded-2xl border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 backdrop-blur-lg w-full max-w-sm mx-auto mb-20">
            <CardContent className="p-6 text-center space-y-6">
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white">Treino Concluído</h2>
                <p className="text-slate-400 text-sm">
                  Parabéns! Mais um passo em direção aos seus objetivos.
                </p>
              </div>
              
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-center space-x-2 text-blue-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-lg font-medium">
                    {formatTime(workoutDuration)}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">Duração total</div>
              </div>
              
              <Button
                onClick={() => finishWorkoutMutation.mutate()}
                className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 py-3 text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg"
                disabled={finishWorkoutMutation.isPending}
              >
                {finishWorkoutMutation.isPending ? "Finalizando..." : "Finalizar Treino"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
