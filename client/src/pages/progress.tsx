import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp, Trophy, Target, Zap, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { workoutLogApi, exerciseApi } from "@/lib/api";

// Daily Volume Chart Component
function DailyVolumeChart() {
  const { data: dailyData, isLoading } = useQuery({
    queryKey: ['/api/workout-logs-daily-volume'],
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="loading-skeleton h-8 rounded"></div>
        ))}
      </div>
    );
  }

  if (!dailyData || !Array.isArray(dailyData) || dailyData.length === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-400" />
        <p className="text-slate-400">Nenhum dados de volume ainda</p>
        <p className="text-sm text-slate-500 mt-1">
          Complete alguns treinos para ver seu gráfico de volume diário
        </p>
      </div>
    );
  }

  const maxVolume = Array.isArray(dailyData) ? Math.max(...dailyData.map((d: any) => d.volume)) : 0;
  const volumeSteps = [0, maxVolume * 0.25, maxVolume * 0.5, maxVolume * 0.75, maxVolume];

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="relative">
        <div className="relative h-80">
          {/* X-axis labels (Volume) */}
          <div className="absolute top-0 left-16 right-4 flex justify-between text-xs text-slate-500 mb-4">
            {volumeSteps.map((step, i) => (
              <span key={i}>{Math.round(step)}kg</span>
            ))}
          </div>
          
          {/* Chart area */}
          <div className="mt-8 ml-16 mr-4 space-y-3">
            {/* Grid lines */}
            <div className="absolute left-16 right-4 top-8 bottom-0">
              {volumeSteps.slice(1).map((_, i) => (
                <div key={i} className="absolute border-l border-slate-700/50" style={{ left: `${(i + 1) * 25}%` }}></div>
              ))}
            </div>
            
            {/* Data points */}
            {Array.isArray(dailyData) && dailyData.map((day: any, index: number) => {
              const widthPercentage = maxVolume > 0 ? (day.volume / maxVolume) * 100 : 0;
              const isHighest = day.volume === maxVolume;
              
              return (
                <div key={index} className="relative flex items-center h-8">
                  {/* Day label (Y-axis) */}
                  <div className="absolute -left-16 w-14 text-xs text-slate-400 text-right">
                    {day.dayName}
                  </div>
                  
                  {/* Volume bar */}
                  <div className="relative w-full">
                    <div 
                      className={`h-6 rounded-r-full transition-all duration-500 ${
                        isHighest 
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-500/30' 
                          : 'bg-gradient-to-r from-blue-500 to-blue-400'
                      }`}
                      style={{ width: `${widthPercentage}%` }}
                    >
                      {/* Volume label */}
                      {day.volume > 0 && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-white font-medium">
                          {day.volume}kg
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span className="text-slate-400">Volume Normal</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-emerald-500"></div>
          <span className="text-slate-400">Volume Máximo</span>
        </div>
      </div>
    </div>
  );
}

export default function Progress() {
  const [selectedExercise, setSelectedExercise] = useState("Supino Reto");
  const [timeRange, setTimeRange] = useState("30");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: workoutLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["/api/workout-logs"],
    queryFn: workoutLogApi.getAll,
  });

  const { data: exercises = [], isLoading: exercisesLoading } = useQuery({
    queryKey: ["/api/exercises"],
    queryFn: exerciseApi.getAll,
  });

  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const popularExercises = [
    "Supino Reto",
    "Agachamento",
    "Deadlift",
    "Puxada",
  ];

  // Mock statistics - in real app, calculate from workout logs
  const stats = {
    personalRecord: "85kg",
    totalWorkouts: workoutLogs.filter(log => log.endTime).length,
    monthlyAverage: "76kg",
    totalVolume: "18.2t",
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Meu Progresso</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="glass-card border-slate-700/50 text-white w-48 h-11 rounded-xl hover:border-blue-500/30 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50">
            <SelectValue className="text-slate-200" />
          </SelectTrigger>
          <SelectContent className="glass-card border-slate-700/50 rounded-xl shadow-xl backdrop-blur-md">
            <SelectItem value="7" className="text-slate-200 hover:bg-blue-500/10 hover:text-blue-300 rounded-lg cursor-pointer transition-colors">
              Semana passada
            </SelectItem>
            <SelectItem value="30" className="text-slate-200 hover:bg-blue-500/10 hover:text-blue-300 rounded-lg cursor-pointer transition-colors">
              Últimos 30 dias
            </SelectItem>
            <SelectItem value="90" className="text-slate-200 hover:bg-blue-500/10 hover:text-blue-300 rounded-lg cursor-pointer transition-colors">
              Últimos 3 meses
            </SelectItem>
            <SelectItem value="180" className="text-slate-200 hover:bg-blue-500/10 hover:text-blue-300 rounded-lg cursor-pointer transition-colors">
              Últimos 6 meses
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Exercise Selection */}
      <Card className="glass-card rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <Search className="text-slate-400 w-4 h-4" />
            <Input
              placeholder="Buscar exercício para ver progresso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none text-white placeholder-slate-400 focus-visible:ring-0"
            />
          </div>
          
          <div className="flex overflow-x-auto space-x-2 pb-2">
            {popularExercises.map((exercise) => (
              <Button
                key={exercise}
                variant={selectedExercise === exercise ? "default" : "outline"}
                size="sm"
                className={`whitespace-nowrap ${
                  selectedExercise === exercise
                    ? "gradient-accent text-white"
                    : "glass-card border-slate-700 text-slate-300"
                }`}
                onClick={() => setSelectedExercise(exercise)}
              >
                {exercise}
              </Button>
            ))}
          </div>

          {/* Filtered exercises dropdown */}
          {searchTerm && (
            <div className="mt-3 max-h-32 overflow-y-auto">
              {filteredExercises.slice(0, 5).map((exercise) => (
                <Button
                  key={exercise.id}
                  variant="ghost"
                  className="w-full justify-start text-slate-300 hover:bg-slate-800/50"
                  onClick={() => {
                    setSelectedExercise(exercise.name);
                    setSearchTerm("");
                  }}
                >
                  {exercise.name}
                  <span className="ml-auto text-xs text-slate-500">
                    {exercise.muscleGroup}
                  </span>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Volume Chart - Horizontal */}
      <Card className="glass-card rounded-2xl">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Volume Diário de Treino</h3>
          
          <DailyVolumeChart />
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card rounded-xl">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400 mb-1">{stats.personalRecord}</div>
              <div className="text-xs text-slate-400">Recorde Pessoal</div>
              <div className="text-xs text-emerald-400 mt-1">+5kg este mês</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card rounded-xl">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">{stats.totalWorkouts}</div>
              <div className="text-xs text-slate-400">Treinos</div>
              <div className="text-xs text-blue-400 mt-1">+{Math.max(0, stats.totalWorkouts - 21)} vs. passado</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card rounded-xl">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">{stats.monthlyAverage}</div>
              <div className="text-xs text-slate-400">Média do Mês</div>
              <div className="text-xs text-purple-400 mt-1">+2kg médio</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card rounded-xl">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400 mb-1">{stats.totalVolume}</div>
              <div className="text-xs text-slate-400">Volume Total</div>
              <div className="text-xs text-orange-400 mt-1">+2.1t este mês</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Time Stats */}
      <Card className="glass-card rounded-2xl">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Histórico Geral</h3>
          
          {logsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="loading-skeleton h-16 rounded"></div>
              ))}
            </div>
          ) : workoutLogs.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-400">Nenhum dados de progresso ainda</p>
              <p className="text-sm text-slate-500 mt-1">
                Complete alguns treinos para ver seus gráficos de progresso
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-white">{workoutLogs.length}</div>
                  <div className="text-xs text-slate-400">Total de treinos</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">
                    {workoutLogs.filter(log => log.endTime).length}
                  </div>
                  <div className="text-xs text-slate-400">Treinos completos</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">
                    {Math.round((workoutLogs.filter(log => log.endTime).length / Math.max(workoutLogs.length, 1)) * 100)}%
                  </div>
                  <div className="text-xs text-slate-400">Taxa de conclusão</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
