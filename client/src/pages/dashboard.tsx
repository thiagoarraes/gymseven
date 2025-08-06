import { useQuery } from "@tanstack/react-query";
import { Calendar, Flame, Clock, Trophy, Play, List, ChevronRight, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { workoutLogApi, exerciseApi } from "@/lib/api";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, navigate] = useLocation();
  
  const { data: recentWorkouts = [], isLoading: workoutsLoading } = useQuery({
    queryKey: ["/api/workout-logs", "recent"],
    queryFn: workoutLogApi.getRecent,
  });

  const { data: exercises = [], isLoading: exercisesLoading } = useQuery({
    queryKey: ["/api/exercises"],
    queryFn: exerciseApi.getAll,
  });

  // Calculate stats from recent workouts
  const stats = {
    weeklyWorkouts: recentWorkouts.filter(w => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(w.startTime) >= weekAgo;
    }).length,
    totalWeight: "2.5t", // Would calculate from actual data
    avgDuration: "1h 15m",
    personalRecords: 3,
    currentStreak: 7,
  };

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
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 fade-in">
      {/* Welcome Section */}
      <Card className="neo-card rounded-3xl hover-lift overflow-hidden">
        <CardContent className="p-8 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between mb-6">
            <div className="relative z-10">
              <h2 className="text-3xl font-black text-white mb-2 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text">Olá, Seven!🔥</h2>
              <p className="text-slate-300 text-lg">Pronto para quebrar recordes hoje?</p>
            </div>
            <div className="text-right relative z-10">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <div className="text-3xl font-black text-transparent bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text">
                  {stats.currentStreak}
                </div>
              </div>
              <div className="text-sm text-emerald-400 font-medium">dias em sequência</div>
            </div>
          </div>
          
          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <Button 
              className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:via-blue-400 hover:to-indigo-500 rounded-2xl py-4 px-6 font-bold text-white hover:scale-105 transition-all duration-300 shadow-2xl shadow-blue-500/25 border border-blue-400/30"
              onClick={() => navigate("/workouts")}
            >
              <Play className="w-5 h-5 mr-3" />
              Iniciar Treino
            </Button>
            <Button 
              variant="outline"
              className="neo-card rounded-2xl py-4 px-6 font-bold text-slate-100 hover-lift border-slate-600/50 hover:border-blue-500/50 transition-all duration-300"
              onClick={() => navigate("/exercises")}
            >
              <List className="w-5 h-5 mr-3" />
              Exercícios
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="neo-card rounded-2xl hover-lift group cursor-pointer overflow-hidden">
          <CardContent className="p-5 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <Calendar className="text-blue-400 w-5 h-5" />
              </div>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                +2 semana
              </span>
            </div>
            <div className="text-3xl font-black text-white mb-1">{stats.weeklyWorkouts}</div>
            <div className="text-sm text-slate-400 font-medium">Treinos semanais</div>
          </CardContent>
        </Card>
        
        <Card className="neo-card rounded-2xl hover-lift group cursor-pointer overflow-hidden">
          <CardContent className="p-5 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20">
                <Flame className="text-orange-400 w-5 h-5" />
              </div>
              <span className="text-xs text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">
                +15kg
              </span>
            </div>
            <div className="text-3xl font-black text-white mb-1">{stats.totalWeight}</div>
            <div className="text-sm text-slate-400 font-medium">Volume total</div>
          </CardContent>
        </Card>
        
        <Card className="neo-card rounded-2xl hover-lift group cursor-pointer overflow-hidden">
          <CardContent className="p-5 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <Clock className="text-purple-400 w-5 h-5" />
              </div>
              <span className="text-xs text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                -5min
              </span>
            </div>
            <div className="text-3xl font-black text-white mb-1">{stats.avgDuration}</div>
            <div className="text-sm text-slate-400 font-medium">Tempo médio</div>
          </CardContent>
        </Card>
        
        <Card className="neo-card rounded-2xl hover-lift group cursor-pointer overflow-hidden">
          <CardContent className="p-5 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="p-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                <Trophy className="text-yellow-400 w-5 h-5" />
              </div>
              <span className="text-xs text-yellow-400 font-bold bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20 animate-pulse">
                Nova!
              </span>
            </div>
            <div className="text-3xl font-black text-white mb-1">{stats.personalRecords}</div>
            <div className="text-sm text-slate-400 font-medium">Recordes</div>
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
              className="text-blue-400 hover:text-blue-300"
              onClick={() => navigate("/progress")}
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
                  onClick={() => navigate(`/workout-session/${workout.id}`)}
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
                        {workout.completed ? "Concluído" : "Incompleto"}
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
      {/* Progress Chart */}
      <Card className="glass-card rounded-2xl hover-lift">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Progresso Semanal</h3>
            <select className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-sm text-slate-200">
              <option>Supino</option>
              <option>Agachamento</option>
              <option>Deadlift</option>
            </select>
          </div>
          
          <div className="h-48 bg-slate-800/30 rounded-xl border border-slate-700/50 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 text-blue-400" />
                <p className="text-sm">Gráfico de progressão</p>
                <p className="text-xs">Carga × Tempo</p>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex justify-between">
              <div className="w-2 h-12 bg-blue-500/30 rounded-t"></div>
              <div className="w-2 h-16 bg-blue-500/50 rounded-t"></div>
              <div className="w-2 h-20 bg-blue-500/70 rounded-t"></div>
              <div className="w-2 h-24 bg-blue-500 rounded-t"></div>
              <div className="w-2 h-28 bg-emerald-500 rounded-t"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
