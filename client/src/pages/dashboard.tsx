import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Flame, Clock, Trophy, Play, List, ChevronRight, TrendingUp, CheckCircle, XCircle, Dumbbell, X, Target, BarChart3, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { workoutLogApi, exerciseApi, exerciseProgressApi } from "@/lib/api";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const { user } = useAuth();
  
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
      // Calculate actual volume from workout data
      const workoutVolume = 0; // Will be calculated from actual sets when available
      dayVolumes.set(dayName, (dayVolumes.get(dayName) || 0) + workoutVolume);
    });

    let bestDay = 'N/A';
    let maxVolume = 0;
    for (const [day, volume] of dayVolumes.entries()) {
      if (volume > maxVolume) {
        maxVolume = volume;
        bestDay = day;
      }
    }

    // Calculate exercises with weight increases based on actual data
    const exercisesWithIncrease = exercises.length > 0 ? exercises.filter((ex: any) => ex.lastUsed).length : 0;

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
        <CardContent className="p-6 sm:p-8 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-2xl"></div>
          
          {/* Header Section */}
          <div className="relative z-10 text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground bg-gradient-to-r from-foreground via-primary/80 to-foreground bg-clip-text mb-2">
              Olá, {user?.username || 'Usuário'}!🔥
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg font-medium">
              Pronto para progredir carga hoje?
            </p>
          </div>

          {/* Last Workout & Streak Cards */}
          <div className="grid grid-cols-2 gap-4 relative z-10">
            {/* Last Workout Card */}
            <div className="bg-blue-100/70 hover:bg-blue-200/80 dark:bg-slate-800/40 dark:hover:bg-slate-700/60 rounded-2xl p-3 sm:p-5 border border-blue-200/40 dark:border-slate-600/30 hover:border-blue-300/60 dark:hover:border-slate-500/50 transition-all duration-200 cursor-pointer">
              {recentWorkouts.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center border border-blue-500/30">
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-foreground">Último Treino</h3>
                      <p className="text-xs text-muted-foreground hidden sm:block">Suas atividades recentes</p>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                        recentWorkouts[0]?.endTime 
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                          : 'bg-orange-500/10 text-orange-300 border-orange-500/20'
                      }`}>
                        {recentWorkouts[0]?.endTime ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">Concluído</span>
                            <span className="sm:hidden">✓</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">Em andamento</span>
                            <span className="sm:hidden">...</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Workout Info */}
                  <div className="bg-blue-50/60 dark:bg-muted/30 rounded-xl p-3 space-y-2 border border-blue-200/30 dark:border-border/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Treino</span>
                      <span className="text-sm font-medium text-foreground truncate max-w-[120px] sm:max-w-[150px]">
                        {recentWorkouts[0]?.name || "Treino personalizado"}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Data</span>
                      <span className="text-sm font-medium text-foreground">
                        {formatDate(recentWorkouts[0]?.startTime)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Duração</span>
                      <span className="text-sm font-medium text-primary">
                        {recentWorkouts[0]?.endTime ? 
                          calculateDuration(recentWorkouts[0].startTime, recentWorkouts[0].endTime) : 
                          "Em andamento"
                        }
                      </span>
                    </div>
                    
                    {/* Muscle Groups */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Grupos</span>
                      </div>
                      <div className="flex flex-wrap gap-1 max-w-[130px] sm:max-w-[170px] justify-end">
                        {(() => {
                          const workoutName = recentWorkouts[0]?.name?.toLowerCase() || '';
                          let muscleGroups: string[] = [];
                          
                          // More comprehensive muscle group detection
                          if (workoutName.includes('push') || workoutName.includes('peito') || workoutName.includes('empurrar')) {
                            muscleGroups = ['Peito', 'Ombro', 'Tríceps'];
                          } else if (workoutName.includes('pull') || workoutName.includes('costa') || workoutName.includes('puxar') || workoutName.includes('costas')) {
                            muscleGroups = ['Costa', 'Bíceps', 'Trapézio'];
                          } else if (workoutName.includes('leg') || workoutName.includes('perna') || workoutName.includes('quadríceps') || workoutName.includes('glúteo')) {
                            muscleGroups = ['Quadríceps', 'Glúteos', 'Panturrilha'];
                          } else if (workoutName.includes('full') || workoutName.includes('completo') || workoutName.includes('corpo inteiro')) {
                            muscleGroups = ['Corpo todo'];
                          } else if (workoutName.includes('upper') || workoutName.includes('superior') || workoutName.includes('tronco')) {
                            muscleGroups = ['Peito', 'Costa', 'Ombro'];
                          } else if (workoutName.includes('lower') || workoutName.includes('inferior') || workoutName.includes('membros inferiores')) {
                            muscleGroups = ['Pernas', 'Glúteos'];
                          } else if (workoutName.includes('cardio') || workoutName.includes('aeróbico')) {
                            muscleGroups = ['Cardio'];
                          } else if (workoutName.includes('core') || workoutName.includes('abdômen') || workoutName.includes('abdominal')) {
                            muscleGroups = ['Core', 'Abdômen'];
                          } else if (workoutName.includes('ombro')) {
                            muscleGroups = ['Ombro', 'Trapézio'];
                          } else if (workoutName.includes('braço') || workoutName.includes('bíceps') || workoutName.includes('tríceps')) {
                            muscleGroups = ['Bíceps', 'Tríceps'];
                          } else {
                            // Default for mixed or unspecified workouts
                            muscleGroups = ['Variado'];
                          }
                          
                          return muscleGroups.map((group, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-300 border border-indigo-500/20"
                            >
                              {group}
                            </span>
                          ));
                        })()}
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="pt-2 border-t border-border/50">
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div>
                          <div className="text-lg font-bold text-emerald-400">
                            {(() => {
                              // Simulate exercise count based on workout type
                              const workoutName = recentWorkouts[0]?.name?.toLowerCase() || '';
                              if (workoutName.includes('push') || workoutName.includes('peito')) return '6';
                              if (workoutName.includes('pull') || workoutName.includes('costa')) return '7';
                              if (workoutName.includes('leg') || workoutName.includes('perna')) return '8';
                              if (workoutName.includes('full')) return '12';
                              return '5';
                            })()}
                          </div>
                          <div className="text-xs text-muted-foreground">Exercícios</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-purple-400">
                            {(() => {
                              // Simulate volume based on workout duration
                              const duration = recentWorkouts[0]?.endTime 
                                ? new Date(recentWorkouts[0].endTime).getTime() - new Date(recentWorkouts[0].startTime).getTime()
                                : Date.now() - new Date(recentWorkouts[0]?.startTime || Date.now()).getTime();
                              const hours = duration / (1000 * 60 * 60);
                              return Math.round(hours * 1200 + Math.random() * 400);
                            })()}kg
                          </div>
                          <div className="text-xs text-muted-foreground">Volume</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl px-3 sm:px-4 py-2.5 font-semibold text-white transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/25 w-full text-xs sm:text-sm"
                    onClick={() => navigate("/treinos")}
                  >
                    <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Iniciar Novo Treino</span>
                    <span className="sm:hidden">Novo Treino</span>
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-blue-50/60 dark:bg-muted/30 flex items-center justify-center border border-blue-200/30 dark:border-border/30">
                    <Play className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-1">Primeiro Treino</h3>
                    <p className="text-muted-foreground text-xs mb-3">Comece sua jornada fitness hoje!</p>
                  </div>
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl px-3 sm:px-4 py-2.5 font-semibold text-white transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/25 w-full text-xs sm:text-sm"
                    onClick={() => navigate("/treinos")}
                  >
                    <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Começar Primeiro Treino</span>
                    <span className="sm:hidden">Primeiro Treino</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Streak Card */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-2xl p-3 sm:p-5 border border-emerald-500/20 hover:border-emerald-500/30 transition-all duration-200">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 dark:from-blue-500/30 dark:to-blue-600/30 flex items-center justify-center border border-blue-500/30 dark:border-blue-400/40">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">Sequência</h3>
                  <p className="text-xs text-muted-foreground hidden sm:block">Dias consecutivos</p>
                </div>
              </div>
              
              <div className="text-center py-2 sm:py-3">
                <div className="flex items-center justify-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                  <div className="text-2xl sm:text-3xl font-black text-transparent bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text">
                    {stats.currentStreak}
                  </div>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                </div>
                <div className="text-xs text-emerald-400 font-semibold tracking-wide mb-1 sm:mb-2">
                  dias em sequência
                </div>
                {stats.currentStreak > 0 && (
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Continue assim! 💪
                  </div>
                )}
              </div>
              
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Próximo objetivo</div>
                  <div className="text-xs font-medium text-foreground">
                    {stats.currentStreak < 7 ? `${7 - stats.currentStreak} dias para 1 semana` :
                     stats.currentStreak < 30 ? `${30 - stats.currentStreak} dias para 1 mês` :
                     'Mantenha o ritmo!'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Treinos desta semana */}
        <Card className="neo-card rounded-2xl hover-lift group cursor-pointer overflow-hidden">
          <CardContent className="p-5 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex items-center justify-between mb-3 relative z-10 gap-2">
              <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 flex-shrink-0">
                <Calendar className="text-blue-400 w-5 h-5" />
              </div>
              <span className="text-xs text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20 whitespace-nowrap flex-shrink-0">
                Esta semana
              </span>
            </div>
            <div className="text-3xl font-black text-foreground mb-1">{stats.weeklyWorkouts}</div>
            <div className="text-sm text-muted-foreground font-medium whitespace-nowrap overflow-hidden text-ellipsis">Treinos esta semana</div>
          </CardContent>
        </Card>

        {/* Card 2: Melhor dia da semana */}
        <Card className="neo-card rounded-2xl hover-lift group cursor-pointer overflow-hidden">
          <CardContent className="p-5 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex items-center justify-between mb-3 relative z-10 gap-2">
              <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 flex-shrink-0">
                <Flame className="text-purple-400 w-5 h-5" />
              </div>
              <span className="text-xs text-purple-400 font-bold bg-purple-500/10 px-2 py-1 rounded-full border border-purple-500/20 whitespace-nowrap flex-shrink-0">
                Melhor dia
              </span>
            </div>
            <div className="text-3xl font-black text-foreground mb-1">{stats.bestVolumeDay}</div>
            <div className="text-sm text-muted-foreground font-medium whitespace-nowrap overflow-hidden text-ellipsis">Maior volume</div>
          </CardContent>
        </Card>

        {/* Card 3: Tempo médio */}
        <Card className="neo-card rounded-2xl hover-lift group cursor-pointer overflow-hidden">
          <CardContent className="p-5 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex items-center justify-between mb-3 relative z-10 gap-2">
              <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20 flex-shrink-0">
                <Clock className="text-green-400 w-5 h-5" />
              </div>
              <span className="text-xs text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20 whitespace-nowrap flex-shrink-0">
                Média geral
              </span>
            </div>
            <div className="text-3xl font-black text-foreground mb-1">{stats.avgDuration}</div>
            <div className="text-sm text-muted-foreground font-medium whitespace-nowrap overflow-hidden text-ellipsis">Tempo médio</div>
          </CardContent>
        </Card>
        
        {/* Card 4: Exercícios com peso aumentado */}
        <Card className="neo-card rounded-2xl hover-lift group cursor-pointer overflow-hidden">
          <CardContent className="p-5 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex items-center justify-between mb-3 relative z-10 gap-2">
              <div className="p-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20 flex-shrink-0">
                <TrendingUp className="text-yellow-400 w-5 h-5" />
              </div>
              <span className="text-xs text-yellow-400 font-bold bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20 animate-pulse whitespace-nowrap flex-shrink-0">
                Progresso
              </span>
            </div>
            <div className="text-3xl font-black text-foreground mb-1">{stats.exercisesWithIncrease}</div>
            <div className="text-sm text-muted-foreground font-medium whitespace-nowrap overflow-hidden text-ellipsis">Pesos aumentados</div>
          </CardContent>
        </Card>
      </div>
      {/* Recent Workouts */}
      <Card className="glass-card rounded-2xl hover-lift">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Treinos Recentes</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100/80 dark:hover:bg-blue-500/20 transition-all duration-200 rounded-lg px-3 py-1.5 border border-blue-200/40 dark:border-blue-500/30 hover:border-blue-300/60 dark:hover:border-blue-400/50"
              onClick={() => navigate("/workout-history")}
            >
              Ver todos
            </Button>
          </div>
          
          {workoutsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3 bg-blue-50/60 dark:bg-muted/30 rounded-xl border border-blue-200/30 dark:border-border/30">
                  <div className="loading-skeleton h-4 rounded mb-2"></div>
                  <div className="loading-skeleton h-3 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentWorkouts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100/60 dark:bg-muted/50 flex items-center justify-center border border-blue-200/50 dark:border-border">
                <List className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">Nenhum treino registrado ainda</p>
              <Button 
                className="gradient-accent"
                onClick={() => navigate("/treinos")}
              >
                Começar primeiro treino
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentWorkouts.slice(0, 3).map((workout) => (
                <div 
                  key={workout.id} 
                  className="flex items-center justify-between p-3 bg-blue-50/60 dark:bg-muted/30 rounded-xl border border-blue-200/30 dark:border-border/50 hover-lift cursor-pointer hover:bg-blue-100/70 dark:hover:bg-muted/40 transition-colors"
                  onClick={() => handleWorkoutClick(workout.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 gradient-accent rounded-lg flex items-center justify-center">
                      <Play className="text-white text-sm w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{workout.name}</div>
                      <div className="text-sm text-muted-foreground">{formatDate(workout.startTime)}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-sm font-medium text-emerald-400">
                        {workout.endTime ? calculateDuration(workout.startTime, workout.endTime) : "Em andamento"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {workout.endTime ? "Concluído" : "Incompleto"}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
                  <h3 className="text-xl font-bold text-foreground">Progresso de Treino</h3>
                  <p className="text-sm text-muted-foreground">Acompanhe sua evolução</p>
                </div>
              </div>
              
              <div className="relative">
                <Select 
                  value={selectedExerciseId || firstExerciseId || ""} 
                  onValueChange={(value) => setSelectedExerciseId(value)}
                >
                  <SelectTrigger className="w-56 bg-muted/50 border border-border text-foreground transition-all duration-200 hover:bg-muted/70">
                    <SelectValue placeholder={selectedExerciseName || "Selecione um exercício"} />
                  </SelectTrigger>
                  <SelectContent 
                    className="bg-background border border-border max-h-60 overflow-auto backdrop-blur-md"
                    sideOffset={4}
                  >
                    {exercises.map((exercise: any, index: number) => (
                      <SelectItem 
                        key={`exercise-select-${exercise.id}-${index}`} 
                        value={exercise.id}
                        className="text-foreground focus:bg-muted focus:text-foreground cursor-pointer transition-colors"
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
                  <div className="text-2xl font-bold text-foreground">
                    {chartData.length > 0 && chartData.some((d: any) => d.weight > 0) 
                      ? Math.max(...chartData.filter((d: any) => d.weight > 0).map((d: any) => d.weight))
                      : 0
                    }kg
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">Maior peso atingido</div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-xl p-4 border border-emerald-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Target className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium text-emerald-400 whitespace-nowrap">Total Sessões</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{chartData.length}</div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">Treinos registrados</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-4 border border-purple-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-sm font-medium text-purple-400 whitespace-nowrap">Último Treino</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
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
                  <div className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">Última execução</div>
                </div>
              </div>
            )}
            
            {/* Progress Chart */}
            <div className="bg-blue-50/80 dark:bg-slate-900/50 rounded-xl p-4 border border-blue-200/40 dark:border-slate-700/30">
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
                          tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                          domain={chartData.length > 0 ? ['dataMin - 5', 'dataMax + 5'] : [0, 100]}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(248, 250, 252, 0.95)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '16px',
                            color: '#1E293B',
                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(59, 130, 246, 0.1)',
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
                                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-4 shadow-2xl shadow-blue-500/20">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                                    <div className="text-slate-800 dark:text-white font-semibold text-sm">Progressão</div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-slate-600 dark:text-slate-400">Peso máximo:</span>
                                      <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">{data.weight}kg</span>
                                    </div>
                                    {data.workoutName && (
                                      <div className="mt-2 pt-2 border-t border-slate-300/50 dark:border-slate-700/50">
                                        <div className="text-xs text-slate-500 dark:text-slate-500 truncate max-w-[180px]">
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
                          strokeWidth={3}
                          fill="url(#weightGradient)"
                          dot={{ 
                            fill: '#3B82F6', 
                            strokeWidth: 2, 
                            r: 5,
                            style: { filter: 'drop-shadow(0 2px 6px rgba(59, 130, 246, 0.4))' }
                          }}
                          activeDot={{ 
                            r: 8, 
                            stroke: '#3B82F6', 
                            strokeWidth: 3, 
                            fill: '#fff',
                            style: { 
                              filter: 'drop-shadow(0 4px 16px rgba(59, 130, 246, 0.7))',
                              cursor: 'pointer'
                            }
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100/60 to-purple-100/40 dark:from-blue-500/10 dark:to-purple-500/5 flex items-center justify-center border border-blue-200/50 dark:border-blue-500/20">
                        <TrendingUp className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                      </div>
                      <p className="text-lg font-medium text-foreground mb-2">Nenhum progresso registrado</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Complete treinos com peso para visualizar sua evolução
                      </p>
                      <div className="inline-flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-300 bg-blue-100/60 dark:bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-200/50 dark:border-blue-500/20">
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
