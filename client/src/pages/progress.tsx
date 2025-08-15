import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Trophy, 
  Medal, 
  Star, 
  Flame, 
  Target, 
  Calendar,
  Zap,
  Crown,
  Shield,
  Award,
  Unlock,
  Lock,
  TrendingUp,
  Filter,
  Search,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { workoutLogApi } from "@/lib/api";

// Achievement types and data structure
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'workout' | 'strength' | 'consistency' | 'milestone' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
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

// Sample achievements data - in a real app, this would come from an API
const SAMPLE_ACHIEVEMENTS: Achievement[] = [
  // Workout Achievements
  {
    id: 'first_workout',
    name: 'Primeiro Passo',
    description: 'Complete seu primeiro treino',
    icon: Trophy,
    category: 'milestone',
    tier: 'bronze',
    points: 10,
    requirement: { type: 'workout_count', target: 1, timeframe: 'all_time' },
    unlocked: true,
    progress: 100,
    unlockedAt: new Date('2025-08-10')
  },
  {
    id: 'workout_10',
    name: 'Veterano',
    description: 'Complete 10 treinos',
    icon: Medal,
    category: 'workout',
    tier: 'silver',
    points: 50,
    requirement: { type: 'workout_count', target: 10, timeframe: 'all_time' },
    unlocked: true,
    progress: 100,
    unlockedAt: new Date('2025-08-12')
  },
  {
    id: 'workout_50',
    name: 'Dedicado',
    description: 'Complete 50 treinos',
    icon: Crown,
    category: 'workout',
    tier: 'gold',
    points: 200,
    requirement: { type: 'workout_count', target: 50, timeframe: 'all_time' },
    unlocked: false,
    progress: 68
  },
  
  // Consistency Achievements
  {
    id: 'streak_3',
    name: 'Consistência',
    description: 'Treine por 3 dias consecutivos',
    icon: Flame,
    category: 'consistency',
    tier: 'bronze',
    points: 25,
    requirement: { type: 'consecutive_days', target: 3 },
    unlocked: true,
    progress: 100,
    unlockedAt: new Date('2025-08-11')
  },
  {
    id: 'streak_7',
    name: 'Semana Perfeita',
    description: 'Treine por 7 dias consecutivos',
    icon: Calendar,
    category: 'consistency',
    tier: 'silver',
    points: 75,
    requirement: { type: 'consecutive_days', target: 7 },
    unlocked: false,
    progress: 43
  },
  {
    id: 'streak_30',
    name: 'Disciplina de Ferro',
    description: 'Treine por 30 dias consecutivos',
    icon: Shield,
    category: 'consistency',
    tier: 'platinum',
    points: 500,
    requirement: { type: 'consecutive_days', target: 30 },
    unlocked: false,
    progress: 14
  },
  
  // Strength Achievements
  {
    id: 'total_weight_1000',
    name: 'Força Bruta',
    description: 'Levante um total de 1.000kg em uma sessão',
    icon: Zap,
    category: 'strength',
    tier: 'gold',
    points: 150,
    requirement: { type: 'total_weight', target: 1000, timeframe: 'daily' },
    unlocked: false,
    progress: 82
  },
  {
    id: 'benchpress_100',
    name: 'Centurião',
    description: 'Supino com 100kg ou mais',
    icon: Target,
    category: 'strength',
    tier: 'gold',
    points: 200,
    requirement: { type: 'single_weight', target: 100 },
    unlocked: false,
    progress: 75
  },
  
  // Special Achievements
  {
    id: 'early_bird',
    name: 'Madrugador',
    description: 'Complete um treino antes das 7h da manhã',
    icon: Star,
    category: 'special',
    tier: 'silver',
    points: 100,
    requirement: { type: 'time_based', target: 7 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'weekend_warrior',
    name: 'Guerreiro de Fim de Semana',
    description: 'Complete treinos em todos os finais de semana por um mês',
    icon: Award,
    category: 'special',
    tier: 'platinum',
    points: 300,
    requirement: { type: 'custom', target: 8 },
    unlocked: false,
    progress: 25
  }
];

// Achievement Card Component
function AchievementCard({ achievement }: { achievement: Achievement }) {
  const IconComponent = achievement.icon;
  
  const tierColors = {
    bronze: 'from-orange-400 to-orange-600',
    silver: 'from-slate-400 to-slate-600', 
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-purple-400 to-purple-600'
  };

  const tierBadgeColors = {
    bronze: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    silver: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    gold: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    platinum: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  };

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
        achievement.unlocked 
          ? 'bg-card border-border shadow-lg hover:shadow-xl' 
          : 'bg-card/50 border-border/50 opacity-75'
      }`}
      data-testid={`achievement-card-${achievement.id}`}
    >
      {/* Gradient overlay for unlocked achievements */}
      {achievement.unlocked && (
        <div className={`absolute inset-0 bg-gradient-to-br ${tierColors[achievement.tier]} opacity-5`} />
      )}
      
      <CardContent className="p-6 relative">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`relative flex-shrink-0 ${
            achievement.unlocked 
              ? `bg-gradient-to-br ${tierColors[achievement.tier]} p-3 rounded-xl shadow-lg`
              : 'bg-muted p-3 rounded-xl'
          }`}>
            {achievement.unlocked ? (
              <IconComponent className="w-6 h-6 text-white" />
            ) : (
              <Lock className="w-6 h-6 text-muted-foreground" />
            )}
            
            {achievement.unlocked && (
              <div className="absolute -top-1 -right-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 bg-background rounded-full" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className={`font-semibold ${
                achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {achievement.name}
              </h3>
              
              <Badge 
                variant="outline" 
                className={`text-xs ${tierBadgeColors[achievement.tier]}`}
              >
                {achievement.tier}
              </Badge>
              
              <Badge variant="secondary" className="text-xs">
                +{achievement.points} pts
              </Badge>
            </div>
            
            <p className={`text-sm mb-3 ${
              achievement.unlocked ? 'text-muted-foreground' : 'text-muted-foreground/70'
            }`}>
              {achievement.description}
            </p>

            {/* Progress */}
            {achievement.unlocked ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <Unlock className="w-3 h-3" />
                <span>
                  Desbloqueada em{' '}
                  {achievement.unlockedAt?.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short'
                  })}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="text-muted-foreground">
                    {achievement.progress}% ({Math.ceil(achievement.requirement.target * (1 - achievement.progress / 100))} restante)
                  </span>
                </div>
                <Progress 
                  value={achievement.progress} 
                  className="h-2"
                  data-testid={`progress-${achievement.id}`}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Stats Overview Component
function StatsOverview({ achievements }: { achievements: Achievement[] }) {
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);
  const totalPossiblePoints = achievements.reduce((sum, a) => sum + a.points, 0);
  
  const tierCounts = {
    bronze: achievements.filter(a => a.unlocked && a.tier === 'bronze').length,
    silver: achievements.filter(a => a.unlocked && a.tier === 'silver').length,
    gold: achievements.filter(a => a.unlocked && a.tier === 'gold').length,
    platinum: achievements.filter(a => a.unlocked && a.tier === 'platinum').length,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-400 mb-2">{unlockedCount}</div>
          <div className="text-sm text-muted-foreground">Conquistas</div>
          <div className="text-xs text-muted-foreground mt-1">
            {Math.round((unlockedCount / achievements.length) * 100)}% completo
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/20">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-emerald-400 mb-2">{totalPoints}</div>
          <div className="text-sm text-muted-foreground">Pontos</div>
          <div className="text-xs text-muted-foreground mt-1">
            de {totalPossiblePoints} possíveis
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-purple-400 mb-2">{tierCounts.platinum}</div>
          <div className="text-sm text-muted-foreground">Platinum</div>
          <div className="text-xs text-muted-foreground mt-1">
            Elite conquests
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-yellow-400 mb-2">{tierCounts.gold}</div>
          <div className="text-sm text-muted-foreground">Gold</div>
          <div className="text-xs text-muted-foreground mt-1">
            Major achievements
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AchievementsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTier, setSelectedTier] = useState<string>("all");

  // Fetch workout logs to calculate real progress (for future implementation)
  const { data: workoutLogs = [], isLoading } = useQuery({
    queryKey: ["/api/workout-logs"],
    queryFn: workoutLogApi.getAll,
  });

  // Filter achievements based on search and filters
  const filteredAchievements = useMemo(() => {
    return SAMPLE_ACHIEVEMENTS.filter(achievement => {
      const matchesSearch = achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           achievement.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || achievement.category === selectedCategory;
      const matchesTier = selectedTier === "all" || achievement.tier === selectedTier;
      
      return matchesSearch && matchesCategory && matchesTier;
    });
  }, [searchTerm, selectedCategory, selectedTier]);

  const unlockedAchievements = filteredAchievements.filter(a => a.unlocked);
  const lockedAchievements = filteredAchievements.filter(a => !a.unlocked);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="loading-skeleton h-12 w-64 rounded-lg"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="loading-skeleton h-24 rounded-xl"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="loading-skeleton h-32 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full border border-purple-500/20">
            <Trophy className="w-6 h-6 text-purple-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Conquistas
            </h1>
          </div>
          
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Desbloqueie conquistas completando treinos, mantendo consistência e alcançando novos recordes pessoais.
          </p>
        </div>

        {/* Stats Overview */}
        <StatsOverview achievements={SAMPLE_ACHIEVEMENTS} />

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conquistas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-achievements"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40" data-testid="filter-category">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="workout">Treinos</SelectItem>
                <SelectItem value="consistency">Consistência</SelectItem>
                <SelectItem value="strength">Força</SelectItem>
                <SelectItem value="milestone">Marcos</SelectItem>
                <SelectItem value="special">Especiais</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger className="w-32" data-testid="filter-tier">
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Achievement Tabs */}
        <Tabs defaultValue="unlocked" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:flex lg:gap-2">
            <TabsTrigger value="unlocked" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Desbloqueadas ({unlockedAchievements.length})
            </TabsTrigger>
            <TabsTrigger value="locked" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Bloqueadas ({lockedAchievements.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unlocked" className="space-y-4">
            {unlockedAchievements.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma conquista desbloqueada</h3>
                  <p className="text-muted-foreground">
                    Complete treinos para desbloquear suas primeiras conquistas!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {unlockedAchievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="locked" className="space-y-4">
            {lockedAchievements.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Crown className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Parabéns!</h3>
                  <p className="text-muted-foreground">
                    Você desbloqueou todas as conquistas disponíveis!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {lockedAchievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Tips */}
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-400">
              <TrendingUp className="w-5 h-5" />
              Dicas para Conquistar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex gap-3">
                <Flame className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-orange-400 mb-1">Mantenha Consistência</h4>
                  <p className="text-sm text-muted-foreground">
                    Treine regularmente para desbloquear conquistas de consistência
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Target className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-400 mb-1">Aumente os Pesos</h4>
                  <p className="text-sm text-muted-foreground">
                    Registre pesos progressivos para conquistas de força
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}