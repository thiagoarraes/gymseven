import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp, Dumbbell, ArrowUp, ArrowDown, Minus, Clock, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { exerciseProgressApi, exerciseApi, workoutLogApi } from "@/lib/api";
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";

// Weight Progression Chart Component with Area Chart
function WeightProgressionChart({ exerciseId, exerciseName }: { exerciseId: string; exerciseName: string }) {
  const { data: weightHistory = [], isLoading } = useQuery({
    queryKey: ['/api/exercise-weight-history', exerciseId],
    queryFn: () => exerciseProgressApi.getWeightHistory(exerciseId, 5),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="loading-skeleton h-16 rounded"></div>
        ))}
      </div>
    );
  }

  if (!weightHistory || weightHistory.length === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-400" />
        <p className="text-slate-400">Nenhum dado de peso para {exerciseName}</p>
        <p className="text-sm text-slate-500 mt-1">
          Complete treinos com pesos para ver o progresso
        </p>
        <p className="text-xs text-slate-500 mt-2">
          💡 Dica: Registre o peso usado em cada série durante o treino
        </p>
      </div>
    );
  }

  // Prepare data for area chart (oldest to newest)
  const chartData = [...weightHistory].reverse().map((entry: any, index: number) => ({
    session: index + 1,
    weight: entry.maxWeight,
    date: new Date(entry.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
    workoutName: entry.workoutName,
    fullDate: entry.date
  }));

  const maxWeight = Math.max(...weightHistory.map((entry: any) => entry.maxWeight));
  const minWeight = Math.min(...weightHistory.map((entry: any) => entry.maxWeight));

  // Calculate trend
  const latestWeight = weightHistory[0]?.maxWeight || 0;
  const previousWeight = weightHistory[1]?.maxWeight || latestWeight;
  const weightChange = latestWeight - previousWeight;

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-blue-400">{latestWeight}kg</div>
          <div className="text-xs text-slate-400">Último Peso</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-emerald-400">{maxWeight}kg</div>
          <div className="text-xs text-slate-400">Recorde</div>
        </div>
        <div className="flex items-center justify-center space-x-1">
          {weightChange > 0 ? (
            <ArrowUp className="w-4 h-4 text-emerald-400" />
          ) : weightChange < 0 ? (
            <ArrowDown className="w-4 h-4 text-red-400" />
          ) : (
            <Minus className="w-4 h-4 text-slate-400" />
          )}
          <div className={`text-lg font-bold ${
            weightChange > 0 ? 'text-emerald-400' : 
            weightChange < 0 ? 'text-red-400' : 'text-slate-400'
          }`}>
            {weightChange > 0 ? '+' : ''}{weightChange}kg
          </div>
        </div>
      </div>

      {/* Modern Area Chart */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-300">Progresso de Carga Máxima - Últimos 5 Dias</h4>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis 
                domain={[Math.max(0, minWeight - 5), maxWeight + 5]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={(value) => `${value}kg`}
              />
              <ReferenceLine 
                y={maxWeight} 
                stroke="#10b981" 
                strokeDasharray="3 3" 
                strokeOpacity={0.7}
                label={{ value: "Recorde", position: "insideTopRight", fontSize: 10, fill: "#10b981" }}
              />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#weightGradient)"
                dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#1e293b" }}
                activeDot={{ r: 6, fill: "#10b981", strokeWidth: 2, stroke: "#1e293b" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Session details */}
        <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
          <div>
            <span className="text-slate-300">Total de sessões:</span> {weightHistory.length}
          </div>
          <div>
            <span className="text-slate-300">Variação:</span> {minWeight}kg - {maxWeight}kg
          </div>
        </div>

        {/* Recent Sessions List */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detalhes das Sessões</h5>
          {weightHistory.slice(0, 5).map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between bg-slate-800/30 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  entry.maxWeight === maxWeight ? 'bg-emerald-400' : 'bg-blue-400'
                }`}></div>
                <div>
                  <div className="text-sm font-medium text-white">
                    {new Date(entry.date).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="text-xs text-slate-400">{entry.workoutName}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">{entry.maxWeight}kg</div>
                <div className="text-xs text-slate-400">{entry.totalSets} séries</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Progress() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch exercises that have progress data (used in completed workouts)
  const { data: exercisesWithProgress = [], isLoading: exercisesLoading } = useQuery({
    queryKey: ["/api/exercises-with-progress"],
    queryFn: () => fetch("/api/exercises-with-progress").then(res => res.json()),
  });

  // Also fetch all exercises for fallback
  const { data: allExercises = [] } = useQuery({
    queryKey: ["/api/exercises"],
    queryFn: exerciseApi.getAll,
  });

  // Auto-select first exercise for progress chart from exercises with progress
  const firstExerciseId = useMemo(() => {
    if (exercisesWithProgress.length > 0 && !selectedExerciseId) {
      return exercisesWithProgress[0].id;
    }
    return selectedExerciseId;
  }, [exercisesWithProgress, selectedExerciseId]);

  // Fetch weight history for selected exercise
  const { data: weightHistory = [], isLoading: chartLoading } = useQuery({
    queryKey: ['/api/exercise-weight-history', firstExerciseId],
    queryFn: () => exerciseProgressApi.getWeightHistory(firstExerciseId!, 10),
    enabled: !!firstExerciseId,
  });

  // Find selected exercise name
  const selectedExercise = exercisesWithProgress.find(e => e.id === (selectedExerciseId || firstExerciseId)) || 
                          allExercises.find(e => e.id === (selectedExerciseId || firstExerciseId));
  const selectedExerciseName = selectedExercise?.name || "Selecione um exercício";

  // Process chart data
  const chartData = useMemo(() => {
    if (!weightHistory || weightHistory.length === 0) return [];
    
    // Sort by date and prepare data for area chart
    return [...weightHistory]
      .reverse() // Oldest to newest for chronological display
      .map((entry, index) => {
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

  // Filter exercises for autocomplete - prioritize exercises with progress
  const filteredExercises = useMemo(() => {
    if (!searchTerm || searchTerm.length < 1) return exercisesWithProgress.slice(0, 8);
    
    const filtered = exercisesWithProgress.filter((exercise: any) =>
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered.slice(0, 8);
  }, [searchTerm, exercisesWithProgress]);

  const handleExerciseSelect = (exercise: any) => {
    setSelectedExerciseId(exercise.id);
    setSearchTerm("");
    setShowSuggestions(false);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
          <TrendingUp className="w-8 h-8 text-blue-400" />
          Progresso
        </h1>
        <p className="text-slate-400">
          Acompanhe a evolução das suas cargas por exercício
        </p>
      </div>

      {/* Search bar with autocomplete */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Buscar exercício..."
          value={searchTerm}
          onChange={(e) => {
            const value = e.target.value;
            setSearchTerm(value);
            setShowSuggestions(value.length >= 1);
          }}
          onFocus={() => {
            if (searchTerm.length >= 1) setShowSuggestions(true);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder-slate-400"
        />
        
        {/* Autocomplete dropdown */}
        {showSuggestions && searchTerm.length >= 1 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {filteredExercises.length === 0 ? (
              <div className="px-4 py-3 text-slate-400 text-sm">
                Nenhum exercício encontrado para "{searchTerm}"
              </div>
            ) : (
              filteredExercises.map((exercise: any) => {
                return (
                  <button
                    key={exercise.id}
                    onClick={() => handleExerciseSelect(exercise)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-700 border-b border-slate-700 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{exercise.name}</div>
                        <div className="text-xs text-slate-400">{exercise.muscleGroup}</div>
                      </div>
                      {exercise.lastWeight && (
                        <div className="text-xs text-slate-300">
                          {exercise.lastWeight}kg
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Quick access buttons for exercises with progress data */}
      {exercisesWithProgress.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-300">Exercícios com Progresso</h3>
            <div className="text-xs text-slate-400">({exercisesWithProgress.length} exercícios)</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exercisesWithProgress.map((exercise: any) => (
              <Button
                key={exercise.id}
                variant={selectedExerciseId === exercise.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleExerciseSelect(exercise)}
                className={`p-4 h-auto text-left justify-start ${
                  selectedExerciseId === exercise.id 
                    ? 'bg-blue-600 hover:bg-blue-700 border-blue-500' 
                    : 'bg-slate-800/50 hover:bg-slate-700 border-slate-600 text-white'
                }`}
              >
                <div className="w-full flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm truncate">{exercise.name}</div>
                    <div className="text-xs opacity-75 truncate">{exercise.muscleGroup}</div>
                  </div>
                  {exercise.lastWeight > 0 && (
                    <div className="text-right ml-2">
                      <div className="text-sm font-bold text-emerald-400">{exercise.lastWeight}kg</div>
                      <div className="text-xs text-slate-400">última</div>
                    </div>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Show message if no exercises with progress */}
      {exercisesWithProgress.length === 0 && !exercisesLoading && (
        <Card className="glass-card rounded-2xl max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-semibold text-white mb-2">Nenhum progresso ainda</h3>
            <p className="text-slate-400 text-sm mb-4">
              Complete alguns treinos com peso para ver seu progresso aqui
            </p>
            <Button 
              onClick={() => window.location.href = '/workouts'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Clock className="w-4 h-4 mr-2" />
              Iniciar Treino
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Progress chart - sempre mostra um exercício */}
      <Card className="glass-card rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Progresso de {selectedExerciseName}
            </CardTitle>
            <div className="relative">
              <select 
                value={selectedExerciseId || firstExerciseId || ""} 
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="bg-slate-800/50 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                {exercisesWithProgress.map((exercise: any) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name} {exercise.lastWeight > 0 && `(${exercise.lastWeight}kg)`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {chartLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="loading-skeleton h-16 rounded"></div>
              ))}
            </div>
          ) : chartData.length > 0 ? (
            <div className="space-y-6">
              {/* Stats Header */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-400">{chartData[chartData.length - 1]?.weight || 0}kg</div>
                  <div className="text-xs text-slate-400">Último Peso</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400">{Math.max(...chartData.map(d => d.weight))}kg</div>
                  <div className="text-xs text-slate-400">Recorde</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">{chartData.length}</div>
                  <div className="text-xs text-slate-400">Sessões</div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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

              {/* Session details */}
              <div className="space-y-2">
                <h5 className="text-sm font-semibold text-slate-300">Histórico Recente</h5>
                {chartData.slice(-5).reverse().map((entry: any, index: number) => (
                  <div key={index} className="flex items-center justify-between bg-slate-800/30 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                      <div>
                        <div className="text-sm font-medium text-white">{entry.date}</div>
                        <div className="text-xs text-slate-400">{entry.workoutName}</div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-white">{entry.weight}kg</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-400">Nenhum dado de peso para {selectedExerciseName}</p>
              <p className="text-sm text-slate-500 mt-1">
                Complete treinos com pesos para ver o progresso
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Empty state when no exercise selected - NOT NEEDED ANYMORE */}
      {false && (
        <div></div>
      )}

      {/* Loading states */}
      {(exercisesLoading || chartLoading) && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="glass-card rounded-2xl">
              <CardContent className="p-6">
                <div className="loading-skeleton h-6 rounded mb-4 w-3/4"></div>
                <div className="loading-skeleton h-32 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}