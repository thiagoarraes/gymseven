import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Flame, Clock, Trophy, Play, List, ChevronRight, TrendingUp, CheckCircle, XCircle, Dumbbell, X, Target, BarChart3, Zap, Award, Activity, Medal, Star, Crown, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { workoutLogApi, exerciseApi, exerciseProgressApi, workoutTemplateApi } from "@/lib/api";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context-new";

// Achievement types and data (copied from progress page)
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'workout' | 'strength' | 'consistency' | 'milestone' | 'special';
  tier: 'bronze' | 'prata' | 'ouro' | 'diamante' | 'épico' | 'lendário' | 'mítico';
  points: number;
  requirement: {
    type: 'workout_count' | 'consecutive_days' | 'total_weight' | 'single_weight' | 'time_based' | 'custom';
    target: number;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  };
  unlocked: boolean;
  progress: number;
  unlockedAt?: Date;
}

// Achievement system based on real workout data

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showWorkoutDetailsModal, setShowWorkoutDetailsModal] = useState(false);
  const [selectedWorkoutForDetails, setSelectedWorkoutForDetails] = useState<any>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const { user } = useAuth();
  
  const { data: recentWorkouts = [], isLoading: workoutsLoading } = useQuery({
    queryKey: ["/api/workout-logs"],
    queryFn: workoutLogApi.getAll,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Get template exercises for the first workout to show muscle groups
  const { data: templateExercises = [] } = useQuery({
    queryKey: ["/api/workout-templates", recentWorkouts[0]?.modeloId, "exercises"],
    queryFn: () => workoutTemplateApi.getExercises(recentWorkouts[0]!.modeloId!),
    enabled: !!recentWorkouts[0]?.modeloId,
  });

  // Get detailed workout data for modal
  const { data: workoutDetails, isLoading: workoutDetailsLoading } = useQuery({
    queryKey: ["/api/workout-logs", selectedWorkoutForDetails?.id, "details"],
    queryFn: () => workoutLogApi.getSummary(selectedWorkoutForDetails?.id),
    enabled: !!selectedWorkoutForDetails?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Calculate achievements progress based on workout data
  const achievementsWithProgress = useMemo(() => {
    const completedWorkouts = recentWorkouts.filter(w => w.endTime);
    const totalWorkouts = completedWorkouts.length;

    // Helper function to calculate consecutive days
    const calculateConsecutiveDays = (workouts: any[]) => {
      if (!workouts.length) return 0;

      const sortedDates = workouts
        .map(w => new Date(w.endTime).toDateString())
        .filter((date, index, arr) => arr.indexOf(date) === index)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      for (const dateStr of sortedDates) {
        const workoutDate = new Date(dateStr);
        workoutDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === streak) {
          streak++;
          continue;
        }
        
        if (daysDiff === 0 && streak === 0) {
          streak++;
          continue;
        }
        
        break;
      }

      return streak;
    };

    const currentStreak = calculateConsecutiveDays(completedWorkouts);

    // Create dynamic achievements based on real data
    const achievements: Achievement[] = [
      {
        id: 'first_workout',
        name: 'Primeiro Treino',
        description: 'Complete seu primeiro treino',
        icon: Trophy,
        category: 'milestone',
        tier: 'bronze',
        points: 10,
        requirement: { type: 'workout_count', target: 1 },
        unlocked: totalWorkouts >= 1,
        progress: Math.min(totalWorkouts / 1, 1)
      },
      {
        id: 'workout_10',
        name: 'Dedicado',
        description: 'Complete 10 treinos',
        icon: Medal,
        category: 'workout',
        tier: 'prata',
        points: 50,
        requirement: { type: 'workout_count', target: 10 },
        unlocked: totalWorkouts >= 10,
        progress: Math.min(totalWorkouts / 10, 1)
      },
      {
        id: 'workout_25',
        name: 'Marombeiro',
        description: 'Complete 25 treinos',
        icon: Crown,
        category: 'workout',
        tier: 'ouro',
        points: 100,
        requirement: { type: 'workout_count', target: 25 },
        unlocked: totalWorkouts >= 25,
        progress: Math.min(totalWorkouts / 25, 1)
      }
    ];

    return achievements.map(achievement => {
      let progress = 0;
      let unlocked = false;

      switch (achievement.requirement.type) {
        case 'workout_count':
          progress = Math.min(totalWorkouts / achievement.requirement.target, 1);
          unlocked = totalWorkouts >= achievement.requirement.target;
          break;
        case 'consecutive_days':
          progress = Math.min(currentStreak / achievement.requirement.target, 1);
          unlocked = currentStreak >= achievement.requirement.target;
          break;
        default:
          progress = 0;
          unlocked = false;
      }

      return {
        ...achievement,
        progress,
        unlocked,
        unlockedAt: unlocked ? new Date() : undefined
      };
    });
  }, [recentWorkouts]);

  // Weight history data
  // Get exercises with weight history for select dropdown
  const { data: exercisesWithWeightHistory = [] } = useQuery({
    queryKey: ["/api/exercises-with-weight-history"],
    queryFn: () => exerciseProgressApi.getExercisesWithWeightHistory(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Get weight data based on selected exercise
  const { data: weightHistory = [] } = useQuery({
    queryKey: ["/api/exercise-progress/weight", selectedExerciseId],
    queryFn: () => {
      if (selectedExerciseId && selectedExerciseId !== "all") {
        // Get specific exercise weight history
        return exerciseProgressApi.getWeightHistory(selectedExerciseId, 20);
      } else {
        // Get overall weight summary (all exercises)
        return exerciseProgressApi.getExercisesWeightSummary();
      }
    },
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache
  });

  // Process chart data
  const chartData = useMemo(() => {
    if (!weightHistory || !Array.isArray(weightHistory) || weightHistory.length === 0) return [];
    
    console.log('📊 Processing weight history for chart:', weightHistory);
    
    // Data format differs based on whether it's exercise-specific or overall
    return weightHistory.map((entry: any, index: number) => {
        let formattedDate = entry.date;
        let weightValue = entry.maxWeight || entry.weight || 0;
        
        // Handle different data formats
        if (selectedExerciseId && selectedExerciseId !== "all") {
          // Exercise-specific data format
          if (entry.loggedDate) {
            const logDate = new Date(entry.loggedDate);
            formattedDate = logDate.toLocaleDateString('pt-BR');
          }
          weightValue = entry.weight || 0;
        } else {
          // Overall data format - parse date correctly
          if (entry.date && entry.date.includes('/')) {
            const dateParts = entry.date.split('/');
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
          }
        }
        
        return {
          session: index + 1,
          weight: weightValue,
          date: formattedDate,
          fullDate: entry.date || entry.loggedDate,
          workoutName: entry.workoutName || 'Treino'
        };
      });
  }, [weightHistory, selectedExerciseId]);

  // Fetch workout complete data when modal opens
  const { data: workoutSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/workout-logs', selectedWorkout, 'complete', Date.now()],
    queryFn: async () => {
      if (!selectedWorkout) return null;
      try {
        const response = await workoutLogApi.getById(selectedWorkout);
        return response;
      } catch (error) {
        console.error('Error loading workout data:', error);
        throw new Error('Erro ao carregar dados do treino');
      }
    },
    enabled: !!selectedWorkout && showSummaryModal,
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache (replaces cacheTime in v5)
  });

  const handleWorkoutClick = (workoutId: string) => {
    setSelectedWorkout(workoutId);
    setShowSummaryModal(true);
  };

  const closeSummaryModal = () => {
    setShowSummaryModal(false);
    setSelectedWorkout(null);
  };

  // Handle workout details modal
  const handleWorkoutDetails = (workout: any) => {
    console.log('Opening details modal for workout:', workout);
    setSelectedWorkoutForDetails(workout);
    setShowWorkoutDetailsModal(true);
  };

  // Get muscle groups from workout
  const getMuscleGroupsFromWorkout = (workout: any) => {
    if (!workout) return [];
    
    // Use template exercises data instead of workout data
    const exercises = templateExercises;
    if (!exercises || !Array.isArray(exercises)) return [];
    
    const muscleGroups = new Set<string>();
    exercises.forEach((exercise: any) => {
      if (exercise.exercise?.muscleGroup) {
        muscleGroups.add(exercise.exercise.muscleGroup);
      } else if (exercise.muscleGroup) {
        muscleGroups.add(exercise.muscleGroup);
      }
    });
    
    return Array.from(muscleGroups).sort();
  };

  // Format date for workout card
  const formatWorkoutDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  // Calculate comprehensive weekly stats
  const stats = useMemo(() => {
    if (!recentWorkouts || recentWorkouts.length === 0) {
      return {
        weeklyWorkouts: 0,
        bestVolumeDay: 'N/A',
        avgDuration: "0m",
        exercisesWithIncrease: 0,
        currentStreak: 0,
      };
    }

    // Calculate workouts this week (Sunday to Saturday)
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const workoutsThisWeek = recentWorkouts.filter((w: any) => {
      if (!w.startTime) return false;
      const workoutDate = new Date(w.startTime);
      const isInWeek = workoutDate >= startOfWeek && workoutDate <= endOfWeek;
      const isCompleted = !!w.endTime; // completed workouts have endTime
      
      return isInWeek && isCompleted;
    });

    // Calculate average duration from all completed workouts
    const completedWorkouts = recentWorkouts.filter((w: any) => w.endTime && w.startTime);
    let avgDurationMinutes = 0;
    
    if (completedWorkouts.length > 0) {
      const totalMinutes = completedWorkouts.reduce((total: number, workout: any) => {
        const start = new Date(workout.startTime);
        const end = new Date(workout.endTime);
        const durationMs = end.getTime() - start.getTime();
        const minutes = Math.round(durationMs / (1000 * 60));
        return total + minutes;
      }, 0);
      
      avgDurationMinutes = Math.round(totalMinutes / completedWorkouts.length);
    }

    // Calculate total workouts for the streak
    const totalWorkouts = completedWorkouts.length;

    // Calculate consecutive weeks of training
    const weeksWithWorkouts = new Set();
    completedWorkouts.forEach((workout: any) => {
      const date = new Date(workout.endTime);
      const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      weeksWithWorkouts.add(weekKey);
    });

    // Count consecutive weeks from current week backwards
    let consecutiveWeeks = 0;
    let checkDate = new Date(startOfWeek);
    
    while (consecutiveWeeks < 52) { // Max 52 weeks to prevent infinite loop
      const weekKey = checkDate.toISOString().split('T')[0];
      if (weeksWithWorkouts.has(weekKey)) {
        consecutiveWeeks++;
        checkDate.setDate(checkDate.getDate() - 7); // Go back one week
      } else {
        break;
      }
    }

    // Calculate weekly volume (total weight moved this week)
    const weeklyVolume = workoutsThisWeek.reduce((total: number, workout: any) => {
      if (!workout.exercises) return total;
      
      const workoutVolume = workout.exercises.reduce((exerciseTotal: number, exercise: any) => {
        if (!exercise.sets) return exerciseTotal;
        
        const setsVolume = exercise.sets.reduce((setTotal: number, set: any) => {
          const weight = parseFloat(set.weight) || 0;
          const reps = parseInt(set.reps) || 0;
          return setTotal + (weight * reps);
        }, 0);
        
        return exerciseTotal + setsVolume;
      }, 0);
      
      return total + workoutVolume;
    }, 0);

    // Format volume for display
    const formatVolume = (volume: number) => {
      if (volume >= 1000) {
        return `${(volume / 1000).toFixed(1)}t`;
      }
      return `${Math.round(volume)}kg`;
    };

    return {
      weeklyWorkouts: workoutsThisWeek.length,
      totalWorkouts: totalWorkouts,
      consecutiveWeeks: consecutiveWeeks,
      avgDuration: avgDurationMinutes > 0 ? `${avgDurationMinutes}m` : "0m",
      weeklyVolume: weeklyVolume,
      formattedVolume: formatVolume(weeklyVolume),
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
    <div className="fade-in space-y-4">
      {/* Welcome Section */}
      <Card className="neo-card rounded-3xl hover-lift overflow-hidden">
        <CardContent className="mobile-card-padding relative touch-feedback">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-2xl"></div>
          
          {/* Header Section */}
          <div className="relative z-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground bg-gradient-to-r from-foreground via-primary/80 to-foreground bg-clip-text mb-2">
              Olá, {user?.username || user?.email || 'Usuário'}!🔥
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg font-medium">
              Pronto para progredir carga hoje?
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Last Workout & Achievements Cards */}
      <div className="mobile-flex relative z-10">
        {/* Last Workout Card */}
        <div className="bg-gradient-to-br from-slate-50/90 to-blue-50/70 dark:from-slate-900/80 dark:to-slate-800/60 hover:from-blue-50/80 hover:to-indigo-50/70 dark:hover:from-slate-800/90 dark:hover:to-slate-700/80 rounded-2xl mobile-card-padding border border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300/70 dark:hover:border-slate-600/70 transition-all duration-300 cursor-pointer touch-feedback mobile-focus shadow-lg hover:shadow-xl dark:shadow-slate-900/30 backdrop-blur-sm">
          {recentWorkouts.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 dark:from-blue-400/30 dark:to-indigo-500/30 flex items-center justify-center border border-blue-500/30 dark:border-blue-400/50 shadow-lg">
                    <Dumbbell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Último Treino</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Sua atividade mais recente</p>
                  </div>
                </div>
                <div className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold border shadow-sm ${
                  recentWorkouts[0]?.endTime 
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/40' 
                    : 'bg-amber-500/15 text-amber-500 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-400/40'
                }`}>
                  {recentWorkouts[0]?.endTime ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1.5" />
                      <span>Concluído</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 mr-1.5" />
                      <span>Em andamento</span>
                    </>
                  )}
                </div>
              </div>

              {/* Workout Details */}
              <div className="space-y-4">
                {/* Workout Name and Date */}
                <div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {(recentWorkouts[0] as any)?.templateName || recentWorkouts[0]?.nome || "Treino personalizado"}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">
                      {formatWorkoutDate((recentWorkouts[0]?.startTime || recentWorkouts[0]?.endTime)?.toString() || '')}
                    </span>
                    {recentWorkouts[0]?.endTime && (
                      <>
                        <span className="text-slate-400 dark:text-slate-500">•</span>
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">
                          {calculateDuration(recentWorkouts[0].startTime, recentWorkouts[0].endTime)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Muscle Groups */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Grupos Musculares</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {getMuscleGroupsFromWorkout(recentWorkouts[0]).map((group, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                        {group}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-600/50">
                {!recentWorkouts[0]?.endTime && (
                  <Button 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-400 dark:hover:to-indigo-400 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg text-sm shadow-md"
                    onClick={() => navigate(`/workout-session/${recentWorkouts[0]?.id}`)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Continuar Treino
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700 border-slate-300/60 dark:border-slate-600/60 text-slate-700 dark:text-slate-300 font-medium py-2.5 px-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-md text-sm backdrop-blur-sm"
                  onClick={() => handleWorkoutDetails(recentWorkouts[0])}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Ver Detalhes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center py-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-100/60 to-purple-100/40 dark:from-blue-500/10 dark:to-purple-500/5 flex items-center justify-center border border-blue-200/50 dark:border-blue-500/20">
                <Dumbbell className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Nenhum treino iniciado</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Comece sua jornada fitness hoje mesmo
                </p>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-400 dark:hover:to-indigo-400 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg text-sm shadow-md"
                  onClick={() => navigate("/treinos")}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Começar Treino
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Achievements Card */}
        <div 
          className="bg-gradient-to-br from-purple-50/90 to-pink-50/70 dark:from-purple-900/30 dark:to-pink-900/20 hover:from-purple-50/95 hover:to-pink-50/80 dark:hover:from-purple-900/40 dark:hover:to-pink-900/30 rounded-2xl mobile-card-padding border border-purple-200/60 dark:border-purple-700/40 hover:border-purple-300/70 dark:hover:border-purple-600/50 transition-all duration-300 cursor-pointer touch-feedback mobile-focus shadow-lg hover:shadow-xl dark:shadow-slate-900/30 backdrop-blur-sm"
          onClick={() => navigate("/progress")}
        >
          <div className="space-y-3 sm:space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 dark:from-purple-400/30 dark:to-pink-500/30 flex items-center justify-center border border-purple-500/30 dark:border-purple-400/50 shadow-lg">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="mr-4">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Conquistas</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 hidden sm:block mt-1">Seu progresso e medalhas</p>
                </div>
              </div>
            </div>

            {/* Achievement Progress */}
            <div className="space-y-3">
              {/* Recent Achievement Preview */}
              {achievementsWithProgress.length > 0 && (
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 border border-purple-200/50 dark:border-purple-700/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-400/30 dark:to-pink-400/30 flex items-center justify-center border border-purple-500/30 dark:border-purple-400/40">
                      {React.createElement(achievementsWithProgress.find(a => a.progress > 0)?.icon || Trophy, { 
                        className: "w-4 h-4 text-purple-600 dark:text-purple-400" 
                      })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {achievementsWithProgress.find(a => a.progress > 0)?.name || "Primeira conquista aguardando"}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-slate-200/60 dark:bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 transition-all duration-500 ease-out rounded-full"
                            style={{ 
                              width: `${Math.max(5, (achievementsWithProgress.find(a => a.progress > 0)?.progress || 0) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-300 min-w-fit">
                          {Math.round((achievementsWithProgress.find(a => a.progress > 0)?.progress || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contadores de Conquistas */}
              <div className="pt-3 border-t border-slate-300/50 dark:border-slate-600/50">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-emerald-500/10 dark:bg-emerald-500/15 rounded-xl p-2.5 border border-emerald-500/20 dark:border-emerald-400/30">
                    <div className="text-lg font-bold text-emerald-500 dark:text-emerald-400">
                      {achievementsWithProgress.filter(a => a.unlocked).length}
                    </div>
                    <div className="text-xs font-medium text-emerald-600 dark:text-emerald-300">Desbloqueadas</div>
                  </div>
                  <div className="bg-orange-500/10 dark:bg-orange-500/15 rounded-xl p-2.5 border border-orange-500/20 dark:border-orange-400/30">
                    <div className="text-lg font-bold text-orange-500 dark:text-orange-400">
                      {achievementsWithProgress.filter(a => !a.unlocked).length}
                    </div>
                    <div className="text-xs font-medium text-orange-600 dark:text-orange-300">Restantes</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Button */}
            <Button 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 dark:from-purple-500 dark:to-blue-500 dark:hover:from-purple-400 dark:hover:to-blue-400 rounded-2xl px-4 sm:px-5 py-3 font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg shadow-purple-500/30 dark:shadow-purple-500/20 w-full text-sm sm:text-base backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/progress");
              }}
            >
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
              <span className="hidden sm:inline">Ver Todas Conquistas</span>
              <span className="sm:hidden">Ver Conquistas</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="space-y-4">
        {/* Card 1: Total de treinos */}
        <Card className="neo-card rounded-2xl hover-lift group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
          <CardContent className="p-8 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
            
            {/* Content */}
            <div className="relative z-10 flex items-center justify-between">
              {/* Left side - Info */}
              <div className="space-y-3">
                {/* Icon + Badge na mesma linha */}
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl border border-blue-500/30 shadow-lg">
                    <Trophy className="text-blue-400 w-8 h-8" />
                  </div>
                  <span className="text-xs text-blue-400 font-bold bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
                    🏆 Total
                  </span>
                </div>
                
                {/* Título sozinho */}
                <h3 className="text-lg font-semibold text-foreground">Treinos concluídos</h3>
                
                {/* Descrição sozinha */}
                <p className="text-sm text-muted-foreground">Seu progresso total de treinos finalizados</p>
              </div>
              
              {/* Right side - Value */}
              <div className="text-right">
                <div className="text-5xl font-black text-blue-400 leading-none">
                  {stats.totalWorkouts || 0}
                </div>
                <div className="text-sm text-blue-300/70 mt-2">treinos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Semanas consecutivas */}
        <Card className="neo-card rounded-2xl hover-lift group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
          <CardContent className="p-8 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
            
            {/* Content */}
            <div className="relative z-10 flex items-center justify-between">
              {/* Left side - Info */}
              <div className="space-y-3">
                {/* Icon + Badge na mesma linha */}
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl border border-purple-500/30 shadow-lg">
                    <Calendar className="text-purple-400 w-8 h-8" />
                  </div>
                  <span className="text-xs text-purple-400 font-bold bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20">
                    📅 Constância
                  </span>
                </div>
                
                {/* Título sozinho */}
                <h3 className="text-lg font-semibold text-foreground">Semanas consecutivas</h3>
                
                {/* Descrição sozinha */}
                <p className="text-sm text-muted-foreground">Sua sequência atual de treinos semanais</p>
              </div>
              
              {/* Right side - Value */}
              <div className="text-right">
                <div className="text-5xl font-black text-purple-400 leading-none">
                  {stats.consecutiveWeeks || 0}
                </div>
                <div className="text-sm text-purple-300/70 mt-2">semanas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Volume Total */}
        <Card className="neo-card rounded-2xl hover-lift group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10">
          <CardContent className="p-8 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
            
            {/* Content */}
            <div className="relative z-10 flex items-center justify-between">
              {/* Left side - Info */}
              <div className="space-y-3">
                {/* Icon + Badge na mesma linha */}
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-2xl border border-emerald-500/30 shadow-lg">
                    <BarChart3 className="text-emerald-400 w-8 h-8" />
                  </div>
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                    💪 Volume
                  </span>
                </div>
                
                {/* Título sozinho */}
                <h3 className="text-lg font-semibold text-foreground">Volume semanal</h3>
                
                {/* Descrição sozinha */}
                <p className="text-sm text-muted-foreground">Total de peso levantado esta semana</p>
              </div>
              
              {/* Right side - Value */}
              <div className="text-right">
                <div className="text-5xl font-black text-emerald-400 leading-none">
                  {stats.formattedVolume || "0kg"}
                </div>
                <div className="text-sm text-emerald-300/70 mt-2">levantado</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Card 4: Tempo médio */}
        <Card className="neo-card rounded-2xl hover-lift group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
          <CardContent className="p-8 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
            
            {/* Content */}
            <div className="relative z-10 flex items-center justify-between">
              {/* Left side - Info */}
              <div className="space-y-3">
                {/* Icon + Badge na mesma linha */}
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-2xl border border-amber-500/30 shadow-lg">
                    <Clock className="text-amber-400 w-8 h-8" />
                  </div>
                  <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                    ⏱️ Duração
                  </span>
                </div>
                
                {/* Título sozinho */}
                <h3 className="text-lg font-semibold text-foreground">Tempo médio</h3>
                
                {/* Descrição sozinha */}
                <p className="text-sm text-muted-foreground">Duração média dos seus treinos</p>
              </div>
              
              {/* Right side - Value */}
              <div className="text-right">
                <div className="text-5xl font-black text-amber-400 leading-none">
                  {stats.avgDuration || "0m"}
                </div>
                <div className="text-sm text-amber-300/70 mt-2">por treino</div>
              </div>
            </div>
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
              className="text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/workout-history")}
            >
              Ver todos
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {recentWorkouts.length > 0 ? (
            <div className="space-y-3">
              {recentWorkouts.slice(0, 5).map((workout) => (
                <div 
                  key={workout.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => handleWorkoutClick(workout.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${
                      workout.endTime 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                    }`}>
                      {workout.endTime ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {(workout as any).templateName || workout.nome || "Treino personalizado"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(workout.startTime || workout.endTime)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {workout.endTime && (
                      <span className="text-sm text-muted-foreground">
                        {calculateDuration(workout.startTime, workout.endTime)}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Dumbbell className="w-12 h-12 mx-auto mb-4" />
              <p>Nenhum treino encontrado</p>
              <p className="text-sm">Comece seu primeiro treino agora!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Chart */}
      <Card className="glass-card rounded-2xl hover-lift">
        <CardContent className="p-6">
          <div className="mb-6 space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Progresso de Peso</h3>
              <p className="text-sm text-muted-foreground">Sua evolução ao longo do tempo</p>
            </div>
            <div className="w-full">
              <Select value={selectedExerciseId || "all"} onValueChange={setSelectedExerciseId}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Selecione um exercício" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all" className="py-3 px-4">Todos os exercícios</SelectItem>
                  {exercisesWithWeightHistory.map((exercise: any) => (
                    <SelectItem key={exercise.id} value={exercise.id} className="py-3 px-4">
                      <div className="flex items-center justify-between w-full">
                        <span>{exercise.name}</span>
                        <Badge variant="secondary" className="ml-2 px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 border-blue-500/30 rounded-full">
                          {exercise.muscleGroup}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="h-80 relative">
            {chartData.length > 0 ? (
              <div className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      className="text-muted-foreground text-xs"
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      className="text-muted-foreground text-xs"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: any, name: string) => {
                        return [`${value}kg`, 'Peso máximo'];
                      }}
                      labelFormatter={(label: string) => `Data: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--primary))"
                      fill="url(#colorWeight)"
                      strokeWidth={2}
                    />
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
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
        </CardContent>
      </Card>
      
      {/* Workout Details Modal */}
      <Dialog open={showWorkoutDetailsModal} onOpenChange={setShowWorkoutDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden glass-card border-slate-700">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-white text-xl font-semibold">
              {selectedWorkoutForDetails?.name || "Detalhes do Treino"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Visualize todos os detalhes, séries, cargas e estatísticas do treino.
            </DialogDescription>
          </DialogHeader>
          
          {workoutDetailsLoading ? (
            <div className="space-y-4">
              <div className="loading-skeleton h-8 rounded w-3/4"></div>
              <div className="loading-skeleton h-20 rounded"></div>
              <div className="loading-skeleton h-32 rounded"></div>
            </div>
          ) : workoutDetails ? (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Workout Info */}
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white text-lg mb-1">
                      {workoutDetails.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatWorkoutDate(workoutDetails.startTime?.toString() || '')}</span>
                      </div>
                      {workoutDetails.endTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{calculateDuration(workoutDetails.startTime, workoutDetails.endTime)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    workoutDetails.endTime 
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                      : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                  }`}>
                    {workoutDetails.endTime ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1.5" />
                        Concluído
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 mr-1.5" />
                        Em andamento
                      </>
                    )}
                  </div>
                </div>

                {/* Muscle Groups */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Grupos Musculares</h4>
                  <div className="flex flex-wrap gap-2">
                    {getMuscleGroupsFromWorkout(workoutDetails || selectedWorkoutForDetails).map((group, index) => (
                      <Badge key={index} variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                        {group}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                {(workoutDetails as any)?.exercises && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                      <div className="text-lg font-bold text-white">{(workoutDetails as any).exercises.length}</div>
                      <div className="text-xs text-slate-400">Exercícios</div>
                    </div>
                    <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                      <div className="text-lg font-bold text-white">
                        {(workoutDetails as any).exercises.reduce((total: number, ex: any) => total + (ex.sets?.length || 0), 0)}
                      </div>
                      <div className="text-xs text-slate-400">Total de Séries</div>
                    </div>
                    <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                      <div className="text-lg font-bold text-white">
                        {(workoutDetails as any).exercises.reduce((total: number, ex: any) => {
                          return total + (ex.sets?.reduce((setTotal: number, set: any) => setTotal + (set.reps || 0), 0) || 0);
                        }, 0)}
                      </div>
                      <div className="text-xs text-slate-400">Total de Reps</div>
                    </div>
                    <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                      <div className="text-lg font-bold text-white">
                        {Math.round((workoutDetails as any).exercises.reduce((total: number, ex: any) => {
                          return total + (ex.sets?.reduce((setTotal: number, set: any) => {
                            return setTotal + ((set.weight || 0) * (set.reps || 0));
                          }, 0) || 0);
                        }, 0))}kg
                      </div>
                      <div className="text-xs text-slate-400">Volume Total</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Exercises */}
              {(workoutDetails as any)?.exercises && (workoutDetails as any).exercises.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">Exercícios Realizados</h4>
                  {(workoutDetails as any).exercises.map((exercise: any, exerciseIndex: number) => (
                    <div key={exerciseIndex} className="bg-slate-800/20 rounded-xl p-4 border border-slate-700/30">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="font-semibold text-white text-base">{exercise.name}</h5>
                          <p className="text-sm text-slate-400">{exercise.muscleGroup}</p>
                        </div>
                        <Badge variant="outline" className="text-slate-300 border-slate-600">
                          {exercise.sets?.length || 0} séries
                        </Badge>
                      </div>

                      {/* Sets */}
                      {exercise.sets && exercise.sets.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-700/50">
                                <th className="text-left py-2 px-3 text-slate-300 font-medium">Série</th>
                                <th className="text-center py-2 px-3 text-slate-300 font-medium">Peso (kg)</th>
                                <th className="text-center py-2 px-3 text-slate-300 font-medium">Reps</th>
                                <th className="text-center py-2 px-3 text-slate-300 font-medium">Volume</th>
                                <th className="text-center py-2 px-3 text-slate-300 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {exercise.sets.map((set: any, setIndex: number) => (
                                <tr key={setIndex} className="border-b border-slate-700/30">
                                  <td className="py-2 px-3 text-slate-200 font-medium">{setIndex + 1}</td>
                                  <td className="py-2 px-3 text-center text-slate-200">
                                    {set.weight ? `${set.weight}kg` : '-'}
                                  </td>
                                  <td className="py-2 px-3 text-center text-slate-200">
                                    {set.reps || '-'}
                                  </td>
                                  <td className="py-2 px-3 text-center text-slate-200">
                                    {set.weight && set.reps ? `${(set.weight * set.reps).toFixed(1)}kg` : '-'}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    {set.completed ? (
                                      <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-slate-500 mx-auto" />
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-4" />
              <p>Erro ao carregar detalhes do treino</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white text-lg mb-1">
                      {(workoutSummary as any)?.name || 'Treino'}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatWorkoutDate((workoutSummary as any)?.startTime?.toString() || '')}</span>
                      </div>
                      {(workoutSummary as any)?.endTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{calculateDuration((workoutSummary as any).startTime, (workoutSummary as any).endTime)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    (workoutSummary as any)?.endTime 
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                      : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                  }`}>
                    {(workoutSummary as any)?.endTime ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1.5" />
                        Concluído
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 mr-1.5" />
                        Em andamento
                      </>
                    )}
                  </div>
                </div>

                {/* Stats */}
                {(workoutSummary as any)?.exercises && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                      <div className="text-lg font-bold text-white">{(workoutSummary as any).exercises.length}</div>
                      <div className="text-xs text-slate-400">Exercícios</div>
                    </div>
                    <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                      <div className="text-lg font-bold text-white">
                        {(workoutSummary as any).exercises.reduce((total: number, ex: any) => total + (ex.sets?.length || 0), 0)}
                      </div>
                      <div className="text-xs text-slate-400">Total de Séries</div>
                    </div>
                    <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                      <div className="text-lg font-bold text-white">
                        {(workoutSummary as any).exercises.reduce((total: number, ex: any) => {
                          return total + (ex.sets?.reduce((setTotal: number, set: any) => setTotal + (set.reps || 0), 0) || 0);
                        }, 0)}
                      </div>
                      <div className="text-xs text-slate-400">Total de Reps</div>
                    </div>
                    <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                      <div className="text-lg font-bold text-white">
                        {Math.round((workoutSummary as any).exercises.reduce((total: number, ex: any) => {
                          return total + (ex.sets?.reduce((setTotal: number, set: any) => {
                            return setTotal + ((set.weight || 0) * (set.reps || 0));
                          }, 0) || 0);
                        }, 0))}kg
                      </div>
                      <div className="text-xs text-slate-400">Volume Total</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Exercises */}
              {(workoutSummary as any)?.exercises && (workoutSummary as any).exercises.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">Exercícios Realizados</h4>
                  {(workoutSummary as any).exercises.map((exercise: any, exerciseIndex: number) => (
                    <div key={exerciseIndex} className="bg-slate-800/20 rounded-xl p-4 border border-slate-700/30">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="font-semibold text-white text-base">{exercise.name}</h5>
                          <p className="text-sm text-slate-400">{exercise.muscleGroup}</p>
                        </div>
                        <Badge variant="outline" className="text-slate-300 border-slate-600">
                          {exercise.sets?.length || 0} séries
                        </Badge>
                      </div>

                      {/* Sets */}
                      {exercise.sets && exercise.sets.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-700/50">
                                <th className="text-left py-2 px-3 text-slate-300 font-medium">Série</th>
                                <th className="text-center py-2 px-3 text-slate-300 font-medium">Peso (kg)</th>
                                <th className="text-center py-2 px-3 text-slate-300 font-medium">Reps</th>
                                <th className="text-center py-2 px-3 text-slate-300 font-medium">Volume</th>
                                <th className="text-center py-2 px-3 text-slate-300 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {exercise.sets.map((set: any, setIndex: number) => (
                                <tr key={setIndex} className="border-b border-slate-700/30">
                                  <td className="py-2 px-3 text-slate-200 font-medium">{setIndex + 1}</td>
                                  <td className="py-2 px-3 text-center text-slate-200">
                                    {set.weight ? `${set.weight}kg` : '-'}
                                  </td>
                                  <td className="py-2 px-3 text-center text-slate-200">
                                    {set.reps || '-'}
                                  </td>
                                  <td className="py-2 px-3 text-center text-slate-200">
                                    {set.weight && set.reps ? `${(set.weight * set.reps).toFixed(1)}kg` : '-'}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    {set.completed ? (
                                      <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-slate-500 mx-auto" />
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
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