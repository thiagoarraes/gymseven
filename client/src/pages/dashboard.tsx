import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Flame, Clock, Trophy, Play, List, ChevronRight, TrendingUp, CheckCircle, XCircle, Dumbbell, X, Target, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { workoutLogApi, exerciseApi, exerciseProgressApi } from "@/lib/api";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  
  const { data: recentWorkouts = [], isLoading: workoutsLoading } = useQuery({
    queryKey: ["/api/workout-logs"],
    queryFn: workoutLogApi.getAll,
  });

  // Get exercises with actual progress data
  const { data: exercises = [], isLoading: exercisesLoading } = useQuery({
    queryKey: ["/api/exercises-with-progress"],
    queryFn: exerciseProgressApi.getExercisesWithProgress,
  });

  // Auto-select first exercise for progress chart from exercises with progress
  const firstExerciseId = useMemo(() => {
    if (exercises.length > 0 && !selectedExerciseId) {
      // Prefer "Supino reto" if available, otherwise use first exercise with progress
      const supinoReto = exercises.find((e: any) => e.name === "Supino reto");
      return supinoReto ? supinoReto.id : exercises[0].id;
    }
    return selectedExerciseId;
  }, [exercises, selectedExerciseId]);

  // Fetch weight history for selected exercise
  const { data: weightHistory = [], isLoading: chartLoading } = useQuery({
    queryKey: ['/api/exercise-weight-history', firstExerciseId],
    queryFn: () => exerciseProgressApi.getWeightHistory(firstExerciseId!, 10),
    enabled: !!firstExerciseId,
  });

  // Find selected exercise name
  const selectedExercise = exercises.find((e: any) => e.id === (selectedExerciseId || firstExerciseId));
  const selectedExerciseName = selectedExercise?.name || "Selecione um exercício";

  // Process chart data
  const chartData = useMemo(() => {
    if (!weightHistory || weightHistory.length === 0) return [];
    
    // Data already comes from API in chronological order (oldest to newest)
    return weightHistory.map((entry: any, index: number) => {
        // Parse date correctly - entry.date is already in DD/MM/YYYY format from API
        const dateParts = entry.date.split('/');
        let formattedDate = entry.date;
        
        // Try to create a proper date if the format is DD/MM/YYYY
        if (dateParts.length === 3) {
          const day = dateParts[0];
          const month = dateParts[1];
          const year = dateParts[2];
          
          // Create date object and format it
          const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (!isNaN(dateObj.getTime())) {
            formattedDate = `${day}/${month}`;
          }
        }
        
        return {
          session: index + 1,
          weight: entry.weight || entry.maxWeight || 0,
          date: formattedDate,
          fullDate: entry.date,
          workoutName: entry.workoutName
        };
      });
  }, [weightHistory]);

  // Fetch workout summary when modal opens
  const { data: workoutSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/workout-logs', selectedWorkout, 'summary'],
    queryFn: () => workoutLogApi.getSummary(selectedWorkout!),
    enabled: !!selectedWorkout && showSummaryModal,
  });

  const handleWorkoutClick = (workoutId: string) => {
    setSelectedWorkout(workoutId);
    setShowSummaryModal(true);
  };

  const closeSummaryModal = () => {
    setShowSummaryModal(false);
    setSelectedWorkout(null);
  };

  // Calculate comprehensive weekly stats
  const stats = useMemo(() => {
    // Calculate workouts this week (Sunday to Saturday)
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const workoutsThisWeek = recentWorkouts.filter(w => {
      if (!w.startTime) return false;
      const workoutDate = new Date(w.startTime);
      return workoutDate >= startOfWeek && workoutDate <= endOfWeek && w.endTime; // completed workouts have endTime
    });

    // Calculate average duration from all completed workouts
    const completedWorkouts = recentWorkouts.filter(w => w.endTime && w.startTime);
    const avgDurationMs = completedWorkouts.length > 0 
      ? completedWorkouts.reduce((sum, w) => {
          const duration = new Date(w.endTime!).getTime() - new Date(w.startTime).getTime();
          return sum + duration;
        }, 0) / completedWorkouts.length
      : 0;

    const avgHours = Math.floor(avgDurationMs / (1000 * 60 * 60));
    const avgMinutes = Math.floor((avgDurationMs % (1000 * 60 * 60)) / (1000 * 60));
    const avgDurationStr = avgHours > 0 ? `${avgHours}h ${avgMinutes}m` : `${avgMinutes}m`;

    // Find day with highest volume this week
    const dayVolumes = new Map();
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    workoutsThisWeek.forEach(w => {
      const dayOfWeek = new Date(w.startTime).getDay();
      const dayName = dayNames[dayOfWeek];
      // For now, simulate volume data (would come from actual workout data)
      const simulatedVolume = Math.random() * 1000 + 500; // 500-1500kg simulation
      dayVolumes.set(dayName, (dayVolumes.get(dayName) || 0) + simulatedVolume);
    });

    let bestDay = 'N/A';
    let maxVolume = 0;
    for (const [day, volume] of dayVolumes.entries()) {
      if (volume > maxVolume) {
        maxVolume = volume;
        bestDay = day;
      }
    }

    // Calculate exercises with weight increases (simulated for now)
    const exercisesWithIncrease = Math.floor(Math.random() * 5) + 1; // 1-5 exercises

    // Calculate current streak (consecutive days with workouts)
    const sortedWorkouts = recentWorkouts
      .filter(w => w.endTime && w.startTime) // completed workouts have endTime
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const hasWorkout = sortedWorkouts.some(w => {
        const workoutDate = new Date(w.startTime);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === checkDate.getTime();
      });
      
      if (hasWorkout) {
        streak++;
      } else if (i > 0) { // Allow today to not have a workout yet
        break;
      }
    }

    return {
      weeklyWorkouts: workoutsThisWeek.length,
      bestVolumeDay: bestDay,
      avgDuration: avgDurationStr || "0m",
      exercisesWithIncrease,
      currentStreak: streak,
    };
  }, [recentWorkouts]);

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return `Hoje, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (d.toDateString() === yesterday.toDateString()) {
      return `Ontem, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return d.toLocaleDateString('pt-BR');
    }
  };

  const calculateDuration = (start: string | Date, end?: string | Date) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const diffMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 fade-in">
      {/* Welcome Section */}
      <Card className="neo-card rounded-3xl hover-lift overflow-hidden">
        <CardContent className="p-8 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-2xl"></div>
          
          {/* Header Section with better spacing */}
          <div className="flex items-start justify-between mb-8 gap-6">
            <div className="relative z-10 flex-1 space-y-3">
              <h2 className="text-3xl font-black text-white bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text">
                Olá, Seven!🔥
              </h2>
              <p className="text-slate-300 text-lg font-medium">
                Pronto para progredir carga hoje?
              </p>
            </div>
            <div className="relative z-10 flex-shrink-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-2xl border border-emerald-500/20 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                <div className="text-4xl font-black text-transparent bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text">
                  {stats.currentStreak}
                </div>
              </div>
              <div className="text-sm text-emerald-400 font-semibold text-center tracking-wide whitespace-nowrap">dias em sequência</div>
            </div>
          </div>

          {/* Last Workout Info */}
          <div className="relative z-10">
            {recentWorkouts.length > 0 ? (
              <div className="bg-gradient-to-r from-slate-800/40 to-slate-700/20 rounded-2xl p-6 border border-slate-600/30">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center border border-blue-500/30">
                    <Play className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm text-slate-400">Último treino foi de</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {recentWorkouts[0]?.name || "Treino Personalizado"}
                      </span>
                    </div>
                    <div className="text-slate-300 font-medium">
                      {formatDate(recentWorkouts[0]?.startTime)} • {
                        recentWorkouts[0]?.endTime ? 
                        calculateDuration(recentWorkouts[0].startTime, recentWorkouts[0].endTime) : 
                        "Em andamento"
                      }
                    </div>
                  </div>
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl px-6 py-3 font-semibold text-white transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/25"
                    onClick={() => navigate("/workouts")}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar Novo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-slate-800/40 to-slate-700/20 rounded-2xl p-6 border border-slate-600/30 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
                  <Play className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-300 font-medium mb-1">Nenhum treino registrado ainda</p>
                <p className="text-slate-400 text-sm mb-6">Comece sua jornada fitness hoje mesmo!</p>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl px-8 py-3 font-semibold text-white transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/25"
                  onClick={() => navigate("/workouts")}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Começar Primeiro Treino
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Treinos desta semana */}
        <Card className="neo-card rounded-2xl hover-lift group cursor-pointer overflow-hidden">
          <CardContent className="p-5 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex items-center justify-between mb-3 relative z-10 gap-2">
              <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 flex-shrink-0">
                <Calendar className="text-blue-400 w-5 h-5" />
              </div>
              <span className="text-xs text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20 whitespace-nowrap flex-shrink-0">
                Esta semana
              </span>
            </div>
            <div className="text-3xl font-black text-white mb-1">{stats.weeklyWorkouts}</div>
            <div className="text-sm text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Treinos esta semana</div>
          </CardContent>
        </Card>

        {/* Card 2: Melhor dia da semana */}
        <Card className="neo-card rounded-2xl hover-lift group cursor-pointer overflow-hidden">
          <CardContent className="p-5 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex items-center justify-between mb-3 relative z-10 gap-2">
              <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 flex-shrink-0">
                <Flame className="text-purple-400 w-5 h-5" />
              </div>
              <span className="text-xs text-purple-400 font-bold bg-purple-500/10 px-2 py-1 rounded-full border border-purple-500/20 whitespace-nowrap flex-shrink-0">
                Melhor dia
              </span>
            </div>
            <div className="text-3xl font-black text-white mb-1">{stats.bestVolumeDay}</div>
            <div className="text-sm text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Maior volume</div>
          </CardContent>
        </Card>

        {/* Card 3: Tempo médio */}
        <Card className="neo-card rounded-2xl hover-lift group cursor-pointer overflow-hidden">
          <CardContent className="p-5 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex items-center justify-between mb-3 relative z-10 gap-2">
              <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20 flex-shrink-0">
                <Clock className="text-green-400 w-5 h-5" />
              </div>
              <span className="text-xs text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20 whitespace-nowrap flex-shrink-0">
                Média geral
              </span>
            </div>
            <div className="text-3xl font-black text-white mb-1">{stats.avgDuration}</div>
            <div className="text-sm text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Tempo médio</div>
          </CardContent>
        </Card>
        
        {/* Card 4: Exercícios com peso aumentado */}
        <Card className="neo-card rounded-2xl hover-lift group cursor-pointer overflow-hidden">
          <CardContent className="p-5 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex items-center justify-between mb-3 relative z-10 gap-2">
              <div className="p-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20 flex-shrink-0">
                <TrendingUp className="text-yellow-400 w-5 h-5" />
              </div>
              <span className="text-xs text-yellow-400 font-bold bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20 animate-pulse whitespace-nowrap flex-shrink-0">
                Progresso
              </span>
            </div>
            <div className="text-3xl font-black text-white mb-1">{stats.exercisesWithIncrease}</div>
            <div className="text-sm text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Pesos aumentados</div>
          </CardContent>
        </Card>
      </div>
      {/* Recent Workouts */}
      <Card className="glass-card rounded-2xl hover-lift">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Treinos Recentes</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-all duration-200 rounded-lg px-3 py-1.5 border border-transparent hover:border-blue-500/30"
              onClick={() => navigate("/workout-history")}
            >
              Ver todos
            </Button>
          </div>
          
          {workoutsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3 bg-slate-800/30 rounded-xl">
                  <div className="loading-skeleton h-4 rounded mb-2"></div>
                  <div className="loading-skeleton h-3 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentWorkouts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                <List className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-400 mb-4">Nenhum treino registrado ainda</p>
              <Button 
                className="gradient-accent"
                onClick={() => navigate("/workouts")}
              >
                Começar primeiro treino
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentWorkouts.slice(0, 3).map((workout) => (
                <div 
                  key={workout.id} 
                  className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl border border-slate-700/50 hover-lift cursor-pointer"
                  onClick={() => handleWorkoutClick(workout.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 gradient-accent rounded-lg flex items-center justify-center">
                      <Play className="text-white text-sm w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-white">{workout.name}</div>
                      <div className="text-sm text-slate-400">{formatDate(workout.startTime)}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-sm font-medium text-emerald-400">
                        {workout.endTime ? calculateDuration(workout.startTime, workout.endTime) : "Em andamento"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {workout.endTime ? "Concluído" : "Incompleto"}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Enhanced Progress Section */}
      <div className="space-y-4">
        {/* Progress Header Card */}
        <Card className="glass-card rounded-2xl hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Progresso de Treino</h3>
                  <p className="text-sm text-slate-400">Acompanhe sua evolução</p>
                </div>
              </div>
              
              <div className="relative">
                <Select 
                  value={selectedExerciseId || firstExerciseId || ""} 
                  onValueChange={(value) => setSelectedExerciseId(value)}
                >
                  <SelectTrigger className="w-56 bg-slate-800/50 border border-slate-700 text-slate-200 transition-all duration-200 hover:bg-slate-700/50">
                    <SelectValue placeholder={selectedExerciseName || "Selecione um exercício"} />
                  </SelectTrigger>
                  <SelectContent 
                    className="bg-slate-800 border-slate-700 max-h-60 overflow-auto backdrop-blur-md"
                    sideOffset={4}
                  >
                    {exercises.map((exercise: any, index: number) => (
                      <SelectItem 
                        key={`exercise-select-${exercise.id}-${index}`} 
                        value={exercise.id}
                        className="text-slate-200 focus:bg-slate-700 focus:text-white cursor-pointer transition-colors"
                      >
                        {exercise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Progress Stats */}
            {chartData.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-4 border border-blue-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-blue-400 whitespace-nowrap">Peso Máximo</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {chartData.length > 0 && chartData.some((d: any) => d.weight > 0) 
                      ? Math.max(...chartData.filter((d: any) => d.weight > 0).map((d: any) => d.weight))
                      : 0
                    }kg
                  </div>
                  <div className="text-xs text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">Maior peso atingido</div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-xl p-4 border border-emerald-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Target className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium text-emerald-400 whitespace-nowrap">Total Sessões</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{chartData.length}</div>
                  <div className="text-xs text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">Treinos registrados</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-4 border border-purple-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-sm font-medium text-purple-400 whitespace-nowrap">Último Treino</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {chartData.length > 0 
                      ? (() => {
                          try {
                            // Get the most recent date from chartData
                            const sortedData = [...chartData].sort((a: any, b: any) => {
                              const dateA = new Date(a.fullDate || a.date);
                              const dateB = new Date(b.fullDate || b.date);
                              return dateB.getTime() - dateA.getTime();
                            });
                            
                            const lastDate = sortedData[0]?.fullDate || sortedData[0]?.date;
                            if (lastDate) {
                              // Try to parse the date correctly
                              let date: Date;
                              
                              // If it's in DD/MM/YYYY format, convert to proper Date
                              if (typeof lastDate === 'string' && lastDate.includes('/')) {
                                const parts = lastDate.split('/');
                                if (parts.length === 3) {
                                  // Convert DD/MM/YYYY to MM/DD/YYYY for Date constructor
                                  date = new Date(`${parts[1]}/${parts[0]}/${parts[2]}`);
                                } else {
                                  date = new Date(lastDate);
                                }
                              } else {
                                date = new Date(lastDate);
                              }
                              
                              // Check if date is valid
                              if (isNaN(date.getTime())) {
                                return "Data inválida";
                              }
                              
                              const today = new Date();
                              today.setHours(0, 0, 0, 0); // Reset time for accurate day comparison
                              date.setHours(0, 0, 0, 0);
                              
                              const diffTime = today.getTime() - date.getTime();
                              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                              
                              if (diffDays === 0) return "Hoje";
                              if (diffDays === 1) return "Ontem";
                              if (diffDays < 7) return `${diffDays} dias atrás`;
                              if (diffDays < 30) {
                                const weeks = Math.floor(diffDays / 7);
                                return weeks === 1 ? "1 semana atrás" : `${weeks} semanas atrás`;
                              }
                              
                              // For older dates, show format like "12 de junho"
                              const months = [
                                'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                                'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
                              ];
                              
                              const day = date.getDate();
                              const month = months[date.getMonth()];
                              
                              return `${day} de ${month}`;
                            }
                            return "N/A";
                          } catch (error) {
                            console.error('Error processing last workout date:', error);
                            return "Erro na data";
                          }
                        })()
                      : "Nunca"
                    }
                  </div>
                  <div className="text-xs text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">Última execução</div>
                </div>
              </div>
            )}
            
            {/* Progress Chart */}
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
              <div className="h-64 relative overflow-hidden">
                {chartLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <div className="loading-skeleton h-6 w-24 mb-2 mx-auto"></div>
                      <div className="loading-skeleton h-40 w-full"></div>
                    </div>
                  </div>
                ) : chartData.length > 0 ? (
                  <div className="h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                        <defs>
                          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                            <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="date" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#94A3B8' }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#94A3B8' }}
                          domain={chartData.length > 0 ? ['dataMin - 5', 'dataMax + 5'] : [0, 100]}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#1E293B',
                            border: '1px solid #475569',
                            borderRadius: '12px',
                            color: '#F1F5F9',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                          }}
                          formatter={(value) => [`${value}kg`]}
                          labelFormatter={(label) => label}
                          separator=""
                        />
                        <Area
                          type="monotone"
                          dataKey="weight"
                          stroke="#3B82F6"
                          strokeWidth={3}
                          fill="url(#weightGradient)"
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#fff' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/5 flex items-center justify-center border border-blue-500/20">
                        <TrendingUp className="w-10 h-10 text-blue-400" />
                      </div>
                      <p className="text-lg font-medium text-slate-300 mb-2">Nenhum progresso registrado</p>
                      <p className="text-sm text-slate-500 mb-4">
                        Complete treinos com peso para visualizar sua evolução
                      </p>
                      <div className="inline-flex items-center space-x-2 text-xs text-blue-300 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
                        <Play className="w-3 h-3" />
                        <span>Inicie um treino para começar</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workout Summary Modal */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden glass-card border-slate-700">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-white text-xl font-semibold">Resumo do Treino</DialogTitle>
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
                    <div className="text-lg font-bold text-blue-400">
                      {workoutSummary.exercises ? 
                        workoutSummary.exercises.filter((exercise: any, index: number, arr: any[]) => {
                          const firstIndex = arr.findIndex(e => e.id === exercise.id && e.name === exercise.name);
                          return firstIndex === index;
                        }).length 
                        : 0
                      }
                    </div>
                    <div className="text-xs text-slate-400">Exercícios</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-emerald-400">
                      {Math.max(0, workoutSummary.totalSets || 0)}
                    </div>
                    <div className="text-xs text-slate-400">Total de séries</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-400">
                      {Math.max(0, Math.round((workoutSummary.totalVolume || 0) * 100) / 100)}kg
                    </div>
                    <div className="text-xs text-slate-400">Volume total</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-400">
                      {workoutSummary.duration || "00:00:00"}
                    </div>
                    <div className="text-xs text-slate-400">Duração</div>
                  </div>
                </div>
              </div>

              {/* Simple workout info when full summary not available */}
              {!workoutSummary.exercises && (
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-200">Informações do Treino</h4>
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        workoutSummary.completed ? "gradient-accent" : "bg-slate-700/50"
                      }`}>
                        {workoutSummary.completed ? (
                          <CheckCircle className="w-6 h-6 text-white" />
                        ) : (
                          <XCircle className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-white">{workoutSummary.name}</div>
                        <div className="text-sm text-slate-400">
                          {workoutSummary.startTime ? formatDate(workoutSummary.startTime) : "Data não disponível"}
                        </div>
                        <Badge 
                          variant={workoutSummary.completed ? "default" : "secondary"}
                          className={workoutSummary.completed 
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                            : "bg-slate-700/50 text-slate-400 border-slate-600/50"
                          }
                        >
                          {workoutSummary.completed ? "Concluído" : "Incompleto"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Exercises - if available */}
              {workoutSummary.exercises && workoutSummary.exercises.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-200">Exercícios realizados</h4>
                  {(() => {
                    // Group exercises by ID and name, combining their sets
                    const exerciseGroups = workoutSummary.exercises.reduce((acc: any, exercise: any) => {
                      const key = `${exercise.id}-${exercise.name}`;
                      if (!acc[key]) {
                        acc[key] = {
                          ...exercise,
                          sets: []
                        };
                      }
                      // Combine sets from all instances of this exercise, avoiding duplicates
                      if (exercise.sets && exercise.sets.length > 0) {
                        exercise.sets.forEach((set: any) => {
                          // Only add if not already present (check by set ID)
                          const exists = acc[key].sets.find((existingSet: any) => existingSet.id === set.id);
                          if (!exists) {
                            acc[key].sets.push(set);
                          }
                        });
                      }
                      return acc;
                    }, {});

                    // Convert back to array and sort sets by setNumber
                    const uniqueExercises = Object.values(exerciseGroups).map((exercise: any) => ({
                      ...exercise,
                      sets: exercise.sets.sort((a: any, b: any) => a.setNumber - b.setNumber)
                    }));

                    return uniqueExercises.map((exercise: any, index: number) => {
                      const uniqueKey = `${exercise.id || 'unknown'}-${exercise.name || 'unnamed'}-${index}`;
                      return (
                        <div key={uniqueKey} className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30">
                              <span className="font-bold text-blue-400 text-sm">{index + 1}</span>
                            </div>
                            <div>
                              <h5 className="font-medium text-white">{exercise.name || 'Exercício sem nome'}</h5>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                <span className="text-sm text-blue-300">{exercise.muscleGroup || 'Grupo não especificado'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Sets */}
                          {exercise.sets && exercise.sets.length > 0 ? (
                            <div className="space-y-2">
                              {exercise.sets.map((set: any, setIndex: number) => {
                                const setKey = `${uniqueKey}-set-${set.id || setIndex}`;
                                return (
                                  <div key={setKey} className="flex items-center justify-between py-2 px-3 bg-slate-700/30 rounded-lg">
                                    <span className="text-sm text-slate-300">Série {set.setNumber || (setIndex + 1)}</span>
                                    <div className="flex items-center space-x-4 text-sm">
                                      {set.reps && set.reps > 0 && (
                                        <span className="text-yellow-400">{set.reps} reps</span>
                                      )}
                                      {set.weight && set.weight > 0 && (
                                        <span className="text-purple-400">{set.weight}kg</span>
                                      )}
                                      <div className={`w-2 h-2 rounded-full ${
                                        set.completed ? "bg-emerald-400" : "bg-slate-500"
                                      }`}></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-3 text-slate-400 text-sm">
                              <span>Nenhuma série registrada</span>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
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
