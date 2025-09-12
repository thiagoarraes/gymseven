import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { 
  Pause, 
  Square, 
  StopCircle,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { workoutLogApi, workoutTemplateApi, exerciseProgressApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function WorkoutSession() {
  const [, params] = useRoute("/workout-session/:id");
  const [, navigate] = useLocation();
  const [isPaused, setIsPaused] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [hasCompletedFirstSet, setHasCompletedFirstSet] = useState(false);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentWeight, setCurrentWeight] = useState("");
  const [currentReps, setCurrentReps] = useState("");
  const [logExerciseIds, setLogExerciseIds] = useState<{[key: string]: string}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const workoutId = params?.id;

  const { data: workoutLog, isLoading: logLoading, error: logError } = useQuery({
    queryKey: ["/api/v2/workouts/logs", workoutId],
    queryFn: () => workoutLogApi.getById(workoutId!),
    enabled: !!workoutId,
  });

  const { data: templateExercises = [], isLoading: exercisesLoading, error: exercisesError } = useQuery({
    queryKey: ["/api/v2/workouts/templates", workoutLog?.modeloId || (workoutLog as any)?.templateId, "exercises"],
    queryFn: () => workoutTemplateApi.getExercises(workoutLog!.modeloId! || (workoutLog as any)!.templateId!),
    enabled: !!(workoutLog?.modeloId || (workoutLog as any)?.templateId),
  });

  // Query for exercise weight history  
  const { data: weightHistory = [], isLoading: weightHistoryLoading } = useQuery({
    queryKey: ["/api/v2/exercises", templateExercises[currentExerciseIndex]?.exerciseId, "weight-history"],
    queryFn: () => exerciseProgressApi.getWeightHistory(templateExercises[currentExerciseIndex]!.exerciseId, 10),
    enabled: !!templateExercises[currentExerciseIndex]?.exerciseId,
  });

  // Clear logExerciseIds when workoutId changes (new workout session)
  useEffect(() => {
    if (workoutId) {
      console.log('🔄 New workout session detected, clearing exercise IDs cache');
      setLogExerciseIds({});
    }
  }, [workoutId]);

  // Create workout log exercises when template exercises are loaded
  useEffect(() => {
    if (!templateExercises.length || !workoutId || Object.keys(logExerciseIds).length > 0) return;

    const createLogExercises = async () => {
      const newLogExerciseIds: {[key: string]: string} = {};
      
      for (const templateExercise of templateExercises) {
        try {
          console.log(`🔧 Creating log exercise for: ${templateExercise.exerciseName} (${templateExercise.exerciseId})`);
          const logExercise = await workoutLogApi.createExercise({
            registroId: workoutId,
            exercicioId: templateExercise.exerciseId,
            nomeExercicio: templateExercise.exerciseName,
            order: templateExercise.order
          });
          newLogExerciseIds[templateExercise.exerciseId] = logExercise.id;
          console.log(`✅ Log exercise created with ID: ${logExercise.id}`);
        } catch (error) {
          console.error('Error creating log exercise:', error);
          // Continue with other exercises even if one fails
        }
      }
      
      console.log('🗂️ All log exercise IDs:', newLogExerciseIds);
      setLogExerciseIds(newLogExerciseIds);
    };

    createLogExercises();
  }, [templateExercises, workoutId, logExerciseIds]);

  // Initialize weight and reps when exercise changes
  useEffect(() => {
    if (templateExercises.length > 0) {
      const currentExercise = templateExercises[currentExerciseIndex];
      if (currentExercise) {
        // Load exercise data: weight and reps (but not rest timer until first set is completed)
        setCurrentWeight(currentExercise.weight?.toString() || "");
        setCurrentReps(currentExercise.reps?.toString() || "");
        // Reset rest timer and completion status for new exercise
        setRestTimer(0);
        setHasCompletedFirstSet(false);
      }
    }
  }, [templateExercises, currentExerciseIndex]);

  const finishWorkoutMutation = useMutation({
    mutationFn: () => {
      console.log("🏁 Finishing workout with ID:", workoutId);
      const endTimeValue = new Date();
      console.log("🏁 Setting endTime to:", endTimeValue);
      return workoutLogApi.update(workoutId!, {
        endTime: endTimeValue,
      });
    },
    onSuccess: (result) => {
      console.log("✅ Workout finished successfully:", result);
      // Invalidar todas as queries relacionadas aos treinos
      queryClient.invalidateQueries({ queryKey: ["/api/v2/workouts/logs"] });
      queryClient.invalidateQueries({ queryKey: ["active-workout-logs"] }); // Query dos treinos ativos
      queryClient.invalidateQueries({ queryKey: ["/api/v2/workouts/templates"] }); // Templates e exercícios do dashboard
      toast({
        title: "Treino finalizado!",
        description: "Parabéns! Treino concluído com sucesso.",
      });
      navigate("/");
    },
    onError: (error) => {
      console.error("❌ Error finishing workout:", error);
      toast({
        title: "Erro ao finalizar treino",
        description: "Ocorreu um erro ao finalizar o treino. Tente novamente.",
        variant: "destructive",
      });
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
      // Weight, reps and rest timer will be set by useEffect when currentExerciseIndex changes
      setHasCompletedFirstSet(false);
    }
  };

  const handlePrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setCurrentSetIndex(0);
      // Weight, reps and rest timer will be set by useEffect when currentExerciseIndex changes
      setHasCompletedFirstSet(false);
    }
  };

  const handleCompleteSet = async () => {
    const exercise = templateExercises[currentExerciseIndex];
    const logExerciseId = logExerciseIds[exercise?.exerciseId];
    
    // Save the set data if we have weight/reps
    if (logExerciseId && (currentWeight || currentReps)) {
      try {
        await workoutLogApi.createSet({
          logExerciseId: logExerciseId,
          setNumber: currentSetIndex + 1,
          weight: currentWeight ? parseFloat(currentWeight) : null,
          reps: currentReps ? parseInt(currentReps) : null,
          completed: true
        });
        console.log(`Set ${currentSetIndex + 1} saved: ${currentWeight}kg x ${currentReps} reps`);
      } catch (error) {
        console.error('Error saving set:', error);
      }
    }

    if (currentSetIndex < exercise?.sets - 1) {
      // Move to next set and reset to template defaults
      setCurrentSetIndex(prev => prev + 1);
      setRestTimer(exercise?.restDurationSeconds || 90);
      setHasCompletedFirstSet(true);
      setCurrentWeight(exercise?.weight?.toString() || "");
      setCurrentReps(exercise?.reps?.toString() || "");
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

  // Enhanced loading check
  if (logLoading || (workoutLog && exercisesLoading)) {
    return (
      <div className="container mx-auto px-4">
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
      <div className="container mx-auto px-4">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-white mb-4">Treino não encontrado</h2>
          <Button onClick={() => navigate("/treinos")}>
            Voltar aos treinos
          </Button>
        </div>
      </div>
    );
  }

  const currentExercise = templateExercises[currentExerciseIndex];
  
  // Add safety check for currentExercise
  if (!currentExercise || !templateExercises.length) {
    return (
      <div className="container mx-auto px-4">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-white mb-4">Nenhum exercício encontrado</h2>
          <p className="text-slate-400 mb-4">Este template não possui exercícios cadastrados.</p>
          <Button onClick={() => navigate("/treinos")}>Voltar aos treinos</Button>
        </div>
      </div>
    );
  }
  
  const progress = templateExercises.length > 0 
    ? ((currentExerciseIndex + (currentSetIndex + 1) / (currentExercise?.sets || 1)) / templateExercises.length) * 100
    : 0;

  return (
    <div className="container mx-auto px-2 sm:px-4 space-y-3 sm:space-y-4 pb-safe">
      {/* Workout Header */}
      <Card className="glass-card rounded-2xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">{workoutLog.nome}</h2>
              <p className="text-sm text-slate-400">
                Exercício {currentExerciseIndex + 1} de {templateExercises.length}
              </p>
              {currentExercise && (
                <p className="text-sm text-blue-300 font-medium mt-1">
                  {currentExercise?.exercise?.name || currentExercise?.exerciseName || 'Exercício'}
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
          
          {/* Quick Actions - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              variant="outline"
              className="flex-1 glass-card border-slate-700 py-3 rounded-lg font-medium text-slate-300 touch-feedback min-h-[48px]"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
              {isPaused ? "Continuar Treino" : "Pausar Treino"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 glass-card border-slate-700 py-2 rounded-lg font-medium text-slate-300"
              onClick={handleFinishWorkout}
            >
              <StopCircle className="w-4 h-4 mr-2" />
              Finalizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Exercise */}
      <Card className="glass-card rounded-2xl">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">{currentExercise?.exercise?.name || currentExercise?.exerciseName || 'Exercício'}</h3>
              <div className="flex items-center justify-between">
                <p className="text-sm sm:text-base text-slate-400">{currentExercise?.exercise?.muscleGroup || 'Grupo muscular'}</p>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="bg-orange-500/15 border border-orange-500/30 rounded-lg px-4 py-2.5 flex items-center space-x-2">
                    <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm sm:text-base font-semibold text-orange-400">
                      {formatTime(currentExercise?.restDurationSeconds || 90)} descanso
                    </span>
                  </div>
                  <div className="bg-blue-500/15 border border-blue-500/30 rounded-lg px-4 py-2.5 flex items-center space-x-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    <span className="text-sm sm:text-base font-semibold text-blue-400">{currentExercise?.sets || 0} séries</span>
                  </div>
                </div>
              </div>
              {currentExercise?.exercise?.instructions && (
                <div className="mt-4 p-4 bg-slate-800/20 rounded-lg border border-slate-700/30">
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{currentExercise.exercise.instructions}</p>
                </div>
              )}
            </div>
            
            {/* Sets Tracking */}
            <div className="space-y-5 sm:space-y-6">
              <div className="text-sm sm:text-base text-slate-500 uppercase tracking-wide mb-4 font-medium">
                Séries - {currentSetIndex + 1} de {currentExercise?.sets || 0}
              </div>
              
              {/* Current Set - Mobile Optimized */}
              <div className="bg-slate-800/30 rounded-xl border border-blue-500/30 p-5 sm:p-6">
                {/* Set Number Header */}
                <div className="flex items-center justify-center space-x-3 mb-6 sm:mb-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500/20 border border-blue-500 rounded-xl flex items-center justify-center font-semibold text-blue-400 text-lg sm:text-xl">
                    {currentSetIndex + 1}
                  </div>
                  <span className="text-sm sm:text-base font-medium text-slate-300">Série Atual</span>
                </div>
                
                {/* Mobile-First Input Layout */}
                <div className="space-y-6 sm:space-y-8">
                  {/* Weight and Reps Row */}
                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="text-sm sm:text-base font-medium text-slate-300 block mb-3">Peso (kg)</label>
                      <Input 
                        type="number" 
                        value={currentWeight}
                        onChange={(e) => setCurrentWeight(e.target.value)}
                        placeholder={currentExercise?.weight?.toString() || "0"}
                        className="w-full h-14 sm:h-16 bg-slate-800 border-slate-700 text-white text-center text-lg sm:text-xl font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-sm sm:text-base font-medium text-slate-300 block mb-3">Repetições</label>
                      <Input 
                        type="number" 
                        value={currentReps}
                        onChange={(e) => setCurrentReps(e.target.value)}
                        placeholder={currentExercise?.reps?.toString() || "12"}
                        className="w-full h-14 sm:h-16 bg-slate-800 border-slate-700 text-white text-center text-lg sm:text-xl font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl"
                      />
                    </div>
                  </div>
                  
                  {/* Complete Button */}
                  <Button
                    className="w-full h-14 sm:h-16 gradient-accent rounded-xl font-semibold text-white hover:scale-105 transition-transform touch-feedback text-lg sm:text-xl"
                    onClick={handleCompleteSet}
                  >
                    <Check className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                    Concluir Série
                  </Button>
                </div>
              </div>

              {/* Upcoming Sets Preview - Simplified for Mobile */}
              {Array.from({ length: Math.min(2, (currentExercise?.sets || 0) - currentSetIndex - 1) }).map((_, index) => (
                <div key={index} className="bg-slate-800/20 rounded-xl border border-slate-700/30 p-5 sm:p-6">
                  <div className="flex items-center space-x-3 mb-4 sm:mb-5">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center font-semibold text-slate-500 text-sm sm:text-base">
                      {currentSetIndex + index + 2}
                    </div>
                    <span className="text-sm sm:text-base font-medium text-slate-500">Próxima Série</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-4">
                    <div>
                      <label className="text-sm text-slate-500 block mb-1">Peso (kg)</label>
                      <div className="w-full h-12 bg-slate-800/50 border border-slate-700/50 rounded-lg flex items-center justify-center text-slate-500 text-center font-semibold">
                        {currentExercise?.weight?.toString() || "0"}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-slate-500 block mb-1">Repetições</label>
                      <div className="w-full h-12 bg-slate-800/50 border border-slate-700/50 rounded-lg flex items-center justify-center text-slate-500 text-center font-semibold">
                        {currentExercise?.reps?.toString() || "12"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Rest Timer */}
            {hasCompletedFirstSet && restTimer > 0 && (
              <div className="mt-8 p-5 sm:p-6 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                  <div>
                    <div className="text-sm sm:text-base text-orange-400 font-medium">Descanso</div>
                    <div className="text-xs sm:text-sm text-slate-400">Entre séries</div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-orange-400">{formatTime(restTimer)}</div>
                </div>
                <Progress 
                  value={((templateExercises[currentExerciseIndex]?.restDurationSeconds || 90) - restTimer) / (templateExercises[currentExerciseIndex]?.restDurationSeconds || 90) * 100}
                  className="w-full mb-4 sm:mb-5 h-2 sm:h-3"
                />
                <div className="flex items-center justify-center space-x-3 sm:space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 sm:h-12 px-4 sm:px-5 bg-slate-800/50 border-orange-500/30 text-orange-400 hover:bg-orange-500/20 text-sm sm:text-base"
                    onClick={() => setRestTimer(prev => Math.max(0, prev - 15))}
                  >
                    -15s
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 sm:h-12 px-4 sm:px-5 bg-slate-800/50 border-orange-500/30 text-orange-400 hover:bg-orange-500/20 text-sm sm:text-base"
                    onClick={() => setRestTimer(prev => prev + 15)}
                  >
                    +15s
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 sm:h-12 px-4 sm:px-5 bg-slate-800/50 border-red-500/30 text-red-400 hover:bg-red-500/20 text-sm sm:text-base"
                    onClick={() => setRestTimer(0)}
                  >
                    Pular
                  </Button>
                </div>
              </div>
            )}

            {/* Exercise Progress Accordion */}
            {currentExercise && (
              <Accordion type="single" collapsible className="mt-6">
                <AccordionItem value="progress" className="border-slate-700/30">
                  <AccordionTrigger className="bg-slate-800/20 px-4 py-3 rounded-xl border border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center justify-between w-full mr-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">Progresso de Peso</div>
                          <div className="text-xs text-slate-400">{weightHistory.length > 0 ? `${weightHistory.length} sessões registradas` : 'Primeira sessão - Sem histórico ainda'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-blue-400">
                          {weightHistory.length > 0 ? `${weightHistory[0]?.maxWeight || 0}kg` : 'N/A'}
                        </div>
                        <div className="text-xs text-slate-500">{weightHistory.length > 0 ? 'Máximo atual' : 'Sem dados'}</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    {/* Chart Container */}
                    <div className="bg-slate-800/10 rounded-xl p-4 mt-3">
                      {weightHistory.length === 0 && (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/30 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <p className="text-slate-400 text-sm mb-2">Sem histórico de peso</p>
                          <p className="text-slate-500 text-xs">Complete este treino para começar seu progresso!</p>
                        </div>
                      )}
                      {weightHistory.length > 0 && (
                        <>
                          {/* Area Chart */}
                          <div className="h-40 mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={weightHistory.map((entry: any, index: number) => ({
                            session: index + 1,
                            weight: entry.maxWeight || entry.weight || 0,
                            date: entry.date ? entry.date.split('/').slice(0, 2).join('/') : 'N/A',
                            fullDate: entry.date,
                            workoutName: entry.workoutName
                          }))} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                            <defs>
                              <linearGradient id="weightGradientSession" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                                <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <XAxis 
                              dataKey="date" 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: '#94A3B8' }}
                            />
                            <YAxis 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: '#94A3B8' }}
                              domain={weightHistory.length > 0 ? ['dataMin - 5', 'dataMax + 5'] : [0, 100]}
                            />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: '16px',
                                color: '#F1F5F9',
                                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                                fontSize: '13px',
                                padding: '12px 16px',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)'
                              }}
                              cursor={{ stroke: 'rgba(59, 130, 246, 0.5)', strokeWidth: 1 }}
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-4 shadow-2xl shadow-blue-500/20">
                                      <div className="flex items-center space-x-3 mb-2">
                                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                                        <div className="text-white font-semibold text-sm">Progressão</div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="text-slate-400">Peso máximo:</span>
                                          <span className="text-blue-400 font-bold text-lg">{data.weight}kg</span>
                                        </div>
                                        {data.workoutName && (
                                          <div className="mt-2 pt-2 border-t border-slate-700/50">
                                            <div className="text-xs text-slate-500 truncate max-w-[180px]">
                                              {data.workoutName}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="weight"
                              stroke="#3B82F6"
                              strokeWidth={2.5}
                              fill="url(#weightGradientSession)"
                              dot={{ 
                                fill: '#3B82F6', 
                                strokeWidth: 2, 
                                r: 4,
                                style: { filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))' }
                              }}
                              activeDot={{ 
                                r: 7, 
                                stroke: '#3B82F6', 
                                strokeWidth: 3, 
                                fill: '#fff',
                                style: { 
                                  filter: 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.6))',
                                  cursor: 'pointer'
                                }
                              }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                        </>
                      )}
                      
                      {/* Progress Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/30 rounded-lg p-3 text-center">
                          <div className="text-lg font-semibold text-emerald-400">
                            {weightHistory.length > 1 && weightHistory[1]?.maxWeight 
                              ? `${weightHistory[0]?.maxWeight > weightHistory[1]?.maxWeight ? '+' : ''}${((weightHistory[0]?.maxWeight || 0) - (weightHistory[1]?.maxWeight || 0)).toFixed(1)}kg`
                              : 'N/A'
                            }
                          </div>
                          <div className="text-xs text-slate-500">vs última sessão</div>
                        </div>
                        <div className="bg-slate-800/30 rounded-lg p-3 text-center">
                          <div className="text-lg font-semibold text-blue-400">
                            {Math.max(...weightHistory.map((r: any) => r.maxWeight || 0)).toFixed(1)}kg
                          </div>
                          <div className="text-xs text-slate-500">Recorde pessoal</div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </CardContent>
        </Card>


      {/* Navigation - Mobile Optimized */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sticky bottom-4 z-10">
        <Button
          variant="outline"
          className="flex-1 glass-card border-slate-700 py-4 sm:py-4 rounded-xl font-semibold text-slate-300 touch-feedback min-h-[56px] backdrop-blur-lg"
          onClick={handlePrevExercise}
          disabled={currentExerciseIndex === 0}
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          <span className="hidden sm:inline">Anterior</span>
          <span className="sm:hidden">Exercício Anterior</span>
        </Button>
        <Button
          className="flex-1 gradient-accent py-4 sm:py-4 rounded-xl font-semibold text-white hover:scale-105 transition-transform touch-feedback min-h-[56px] backdrop-blur-lg"
          onClick={handleNextExercise}
          disabled={currentExerciseIndex >= templateExercises.length - 1}
        >
          <span className="hidden sm:inline">Próximo</span>
          <span className="sm:hidden">Próximo Exercício</span>
          <ChevronRight className="w-5 h-5 ml-2" />
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
