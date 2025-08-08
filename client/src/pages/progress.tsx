import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp, Dumbbell, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { exerciseProgressApi, exerciseApi } from "@/lib/api";

// Weight Progression Chart Component
function WeightProgressionChart({ exerciseId, exerciseName }: { exerciseId: string; exerciseName: string }) {
  const { data: weightHistory = [], isLoading } = useQuery({
    queryKey: ['/api/exercise-weight-history', exerciseId],
    queryFn: () => exerciseProgressApi.getWeightHistory(exerciseId, 10),
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
      </div>
    );
  }

  // Reverse to show oldest to newest (left to right)
  const reversedHistory = [...weightHistory].reverse();
  const maxWeight = Math.max(...weightHistory.map((entry: any) => entry.maxWeight));
  const minWeight = Math.min(...weightHistory.map((entry: any) => entry.maxWeight));
  const weightRange = maxWeight - minWeight;

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

      {/* Weight Progression Chart */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-300">Últimas 10 Sessões</h4>
        
        <div className="relative">
          {/* Grid lines and weight scale */}
          <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-slate-500">
            <span>{maxWeight}kg</span>
            <span>{Math.round((maxWeight + minWeight) / 2)}kg</span>
            <span>{minWeight}kg</span>
          </div>
          
          {/* Chart area */}
          <div className="ml-20 relative h-40">
            {/* Background grid */}
            <div className="absolute inset-0 border-l border-slate-700/50">
              <div className="h-full border-b border-slate-700/50"></div>
              <div className="absolute top-0 left-0 right-0 border-b border-slate-700/30"></div>
              <div className="absolute top-1/2 left-0 right-0 border-b border-slate-700/30"></div>
            </div>
            
            {/* Data points and line */}
            <div className="absolute inset-0 flex items-end">
              {reversedHistory.map((entry: any, index: number) => {
                const heightPercentage = weightRange > 0 
                  ? ((entry.maxWeight - minWeight) / weightRange) * 100 
                  : 50;
                const leftPercentage = (index / Math.max(reversedHistory.length - 1, 1)) * 100;
                
                return (
                  <div key={index} className="absolute flex flex-col items-center">
                    <div 
                      className="absolute"
                      style={{ 
                        left: `${leftPercentage}%`,
                        bottom: `${heightPercentage}%`,
                        transform: 'translateX(-50%)'
                      }}
                    >
                      {/* Data point */}
                      <div className={`w-3 h-3 rounded-full ${
                        entry.maxWeight === maxWeight 
                          ? 'bg-emerald-400 ring-2 ring-emerald-400/50' 
                          : 'bg-blue-400'
                      } relative z-10`}>
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity z-20 pointer-events-none">
                          <div className="font-semibold">{entry.maxWeight}kg</div>
                          <div className="text-slate-300">
                            {new Date(entry.date).toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: '2-digit' 
                            })}
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                        </div>
                      </div>
                      
                      {/* Connection line to next point */}
                      {index < reversedHistory.length - 1 && (
                        <div className="absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-blue-400 to-blue-400/30 transform -translate-y-1/2 z-0"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* X-axis labels (dates) */}
          <div className="ml-20 mt-2 flex justify-between text-xs text-slate-500">
            {reversedHistory.map((entry: any, index: number) => {
              // Show only every 2nd or 3rd date to avoid crowding
              if (reversedHistory.length <= 5 || index % Math.ceil(reversedHistory.length / 5) === 0) {
                return (
                  <span key={index}>
                    {new Date(entry.date).toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: '2-digit' 
                    })}
                  </span>
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* Session Details */}
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
  const [selectedExercise, setSelectedExercise] = useState<{id: string, name: string} | null>(null);

  const { data: exercises = [], isLoading: exercisesLoading } = useQuery({
    queryKey: ["/api/exercises"],
    queryFn: exerciseApi.getAll,
  });

  const { data: exercisesSummary = [], isLoading: summaryLoading } = useQuery({
    queryKey: ["/api/exercises-weight-summary"],
    queryFn: exerciseProgressApi.getExercisesWeightSummary,
  });

  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get exercises that have weight data for quick selection
  const exercisesWithData = exercisesSummary.filter((summary: any) => summary.sessionCount > 0);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Progresso de Cargas</h2>
        <div className="text-sm text-slate-400">
          Últimas 10 sessões por exercício
        </div>
      </div>

      {/* Exercise Selection */}
      <Card className="glass-card rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <Search className="text-slate-400 w-4 h-4" />
            <Input
              placeholder="Buscar exercício para ver progresso de peso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none text-white placeholder-slate-400 focus-visible:ring-0"
            />
          </div>
          
          {/* Quick selection for exercises with data */}
          {!searchTerm && exercisesWithData.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-300">Exercícios com Dados</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exercisesWithData.map((summary: any) => (
                  <Button
                    key={summary.id}
                    variant="ghost"
                    className="glass-card border-slate-700 text-left p-4 h-auto hover:bg-slate-800/50 transition-colors"
                    onClick={() => setSelectedExercise({id: summary.id, name: summary.name})}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="space-y-1">
                        <div className="font-medium text-white">{summary.name}</div>
                        <div className="text-xs text-slate-400">{summary.muscleGroup}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-400">{summary.lastWeight}kg</div>
                        <div className="text-xs text-slate-500">{summary.sessionCount} sessões</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Search results */}
          {searchTerm && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredExercises.slice(0, 8).map((exercise) => (
                <Button
                  key={exercise.id}
                  variant="ghost"
                  className="w-full justify-start text-slate-300 hover:bg-slate-800/50"
                  onClick={() => {
                    setSelectedExercise({id: exercise.id, name: exercise.name});
                    setSearchTerm("");
                  }}
                >
                  <Dumbbell className="w-4 h-4 mr-3 text-slate-400" />
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

      {/* Selected Exercise Progress */}
      {selectedExercise ? (
        <Card className="glass-card rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center space-x-3">
                <Dumbbell className="w-5 h-5 text-blue-400" />
                <span>{selectedExercise.name}</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedExercise(null)}
                className="text-slate-400 hover:text-white hover:bg-slate-800/50"
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <WeightProgressionChart 
              exerciseId={selectedExercise.id} 
              exerciseName={selectedExercise.name}
            />
          </CardContent>
        </Card>
      ) : (
        // Empty state when no exercise selected
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Selecione um Exercício
            </h3>
            <p className="text-slate-400 mb-6">
              Escolha um exercício acima para ver o progresso de cargas das últimas 10 sessões
            </p>
            {exercisesWithData.length === 0 && (
              <p className="text-sm text-slate-500">
                Complete alguns treinos com pesos para ver dados de progresso
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading states */}
      {(exercisesLoading || summaryLoading) && !selectedExercise && (
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