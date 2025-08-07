import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp, Trophy, Target, Zap, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { workoutLogApi, exerciseApi } from "@/lib/api";

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
                    : "glass-card border-slate-700 text-slate-300 hover-lift"
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

      {/* Progress Chart */}
      <Card className="glass-card rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {selectedExercise} - Evolução da Carga
              </h3>
              <p className="text-sm text-slate-400">Carga máxima por treino</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-emerald-400">+15kg</div>
              <div className="text-xs text-slate-500">vs. mês passado</div>
            </div>
          </div>
          
          <div className="h-64 bg-slate-800/30 rounded-xl border border-slate-700/50 relative overflow-hidden">
            {/* Chart implementation placeholder */}
            <div className="absolute inset-4">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-slate-500">
                <span>100kg</span>
                <span>90kg</span>
                <span>80kg</span>
                <span>70kg</span>
                <span>60kg</span>
              </div>
              
              {/* Chart area */}
              <div className="ml-8 mr-4 h-full relative">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between">
                  <div className="border-t border-slate-700/50"></div>
                  <div className="border-t border-slate-700/50"></div>
                  <div className="border-t border-slate-700/50"></div>
                  <div className="border-t border-slate-700/50"></div>
                  <div className="border-t border-slate-700/50"></div>
                </div>
                
                {/* Data points */}
                <div className="absolute inset-0 flex items-end justify-between">
                  <div className="w-2 bg-blue-500 rounded-t" style={{ height: "40%" }}></div>
                  <div className="w-2 bg-blue-500 rounded-t" style={{ height: "45%" }}></div>
                  <div className="w-2 bg-blue-500 rounded-t" style={{ height: "50%" }}></div>
                  <div className="w-2 bg-blue-500 rounded-t" style={{ height: "55%" }}></div>
                  <div className="w-2 bg-blue-500 rounded-t" style={{ height: "60%" }}></div>
                  <div className="w-2 bg-blue-500 rounded-t" style={{ height: "65%" }}></div>
                  <div className="w-2 bg-emerald-500 rounded-t" style={{ height: "70%" }}></div>
                  <div className="w-2 bg-emerald-500 rounded-t shadow-lg shadow-emerald-500/30" style={{ height: "75%" }}></div>
                </div>
              </div>
              
              {/* X-axis labels */}
              <div className="absolute bottom-0 left-8 right-4 flex justify-between text-xs text-slate-500 mt-2">
                <span>Jan</span>
                <span>Fev</span>
                <span>Mar</span>
                <span>Abr</span>
                <span>Mai</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Ago</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card rounded-xl hover-lift">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400 mb-1">{stats.personalRecord}</div>
              <div className="text-xs text-slate-400">Recorde Pessoal</div>
              <div className="text-xs text-emerald-400 mt-1">+5kg este mês</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card rounded-xl hover-lift">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">{stats.totalWorkouts}</div>
              <div className="text-xs text-slate-400">Treinos</div>
              <div className="text-xs text-blue-400 mt-1">+{Math.max(0, stats.totalWorkouts - 21)} vs. passado</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card rounded-xl hover-lift">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">{stats.monthlyAverage}</div>
              <div className="text-xs text-slate-400">Média do Mês</div>
              <div className="text-xs text-purple-400 mt-1">+2kg médio</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card rounded-xl hover-lift">
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
