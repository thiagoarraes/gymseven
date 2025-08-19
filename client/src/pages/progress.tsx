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
  CheckCircle2,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { workoutLogApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

// Achievement types and data structure
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'workout' | 'strength' | 'consistency' | 'milestone' | 'special';
  tier: 'bronze' | 'prata' | 'ouro' | 'diamante' | 'epico' | 'lendario' | 'mitico';
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

// Dados de conquistas de exemplo - em uma aplicação real, viria de uma API
const SAMPLE_ACHIEVEMENTS: Achievement[] = [
  // Conquistas de Treino
  {
    id: 'first_workout',
    name: 'Primeiro Passo',
    description: 'Complete seu primeiro treino',
    icon: Trophy,
    category: 'milestone',
    tier: 'bronze',
    points: 10,
    requirement: { type: 'workout_count', target: 1, timeframe: 'all_time' },
    unlocked: false,
    progress: 0
  },
  {
    id: 'workout_10',
    name: 'Veterano',
    description: 'Complete 10 treinos',
    icon: Medal,
    category: 'workout',
    tier: 'prata',
    points: 50,
    requirement: { type: 'workout_count', target: 10, timeframe: 'all_time' },
    unlocked: false,
    progress: 0
  },
  {
    id: 'workout_50',
    name: 'Dedicado',
    description: 'Complete 50 treinos',
    icon: Crown,
    category: 'workout',
    tier: 'ouro',
    points: 200,
    requirement: { type: 'workout_count', target: 50, timeframe: 'all_time' },
    unlocked: false,
    progress: 0
  },
  {
    id: 'workout_100',
    name: 'Imortal',
    description: 'Complete 100 treinos',
    icon: Shield,
    category: 'workout',
    tier: 'diamante',
    points: 500,
    requirement: { type: 'workout_count', target: 100, timeframe: 'all_time' },
    unlocked: false,
    progress: 0
  },
  
  // Conquistas de Consistência
  {
    id: 'streak_3',
    name: 'Consistência',
    description: 'Treine por 3 dias consecutivos',
    icon: Flame,
    category: 'consistency',
    tier: 'bronze',
    points: 25,
    requirement: { type: 'consecutive_days', target: 3 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'streak_7',
    name: 'Semana Perfeita',
    description: 'Treine por 7 dias consecutivos',
    icon: Calendar,
    category: 'consistency',
    tier: 'prata',
    points: 75,
    requirement: { type: 'consecutive_days', target: 7 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'streak_30',
    name: 'Disciplina de Ferro',
    description: 'Treine por 30 dias consecutivos',
    icon: Shield,
    category: 'consistency',
    tier: 'ouro',
    points: 300,
    requirement: { type: 'consecutive_days', target: 30 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'streak_100',
    name: 'Lenda Viva',
    description: 'Treine por 100 dias consecutivos',
    icon: Crown,
    category: 'consistency',
    tier: 'epico',
    points: 1000,
    requirement: { type: 'consecutive_days', target: 100 },
    unlocked: false,
    progress: 0
  },
  
  // Conquistas de Força
  {
    id: 'total_weight_1000',
    name: 'Força Bruta',
    description: 'Levante um total de 1.000kg em uma sessão',
    icon: Zap,
    category: 'strength',
    tier: 'ouro',
    points: 150,
    requirement: { type: 'total_weight', target: 1000, timeframe: 'daily' },
    unlocked: false,
    progress: 0
  },
  {
    id: 'benchpress_100',
    name: 'Centurião',
    description: 'Supino com 100kg ou mais',
    icon: Target,
    category: 'strength',
    tier: 'diamante',
    points: 400,
    requirement: { type: 'single_weight', target: 100 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'deadlift_200',
    name: 'Destruidor',
    description: 'Levantamento terra com 200kg ou mais',
    icon: Zap,
    category: 'strength',
    tier: 'lendario',
    points: 800,
    requirement: { type: 'single_weight', target: 200 },
    unlocked: false,
    progress: 0
  },
  
  // Conquistas Especiais
  {
    id: 'early_bird',
    name: 'Madrugador',
    description: 'Complete um treino antes das 7h da manhã',
    icon: Star,
    category: 'special',
    tier: 'prata',
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
    tier: 'ouro',
    points: 300,
    requirement: { type: 'custom', target: 8 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'perfect_month',
    name: 'Mestre dos Treinos',
    description: 'Complete pelo menos 20 treinos em um mês',
    icon: Crown,
    category: 'special',
    tier: 'epico',
    points: 600,
    requirement: { type: 'custom', target: 20 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'year_champion',
    name: 'Campeão Anual',
    description: 'Complete pelo menos 300 treinos em um ano',
    icon: Trophy,
    category: 'special',
    tier: 'mitico',
    points: 2000,
    requirement: { type: 'workout_count', target: 300, timeframe: 'all_time' },
    unlocked: false,
    progress: 0
  },

  // Conquistas Divertidas de Musculação
  {
    id: 'gym_bro',
    name: 'Mano da Academia',
    description: 'Complete 5 treinos de peito e bíceps em uma semana',
    icon: Medal,
    category: 'special',
    tier: 'bronze',
    points: 30,
    requirement: { type: 'custom', target: 5 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'swole_patrol',
    name: 'Patrulha dos Bombados',
    description: 'Faça supino, agachamento e terra morto na mesma semana',
    icon: Shield,
    category: 'strength',
    tier: 'prata',
    points: 100,
    requirement: { type: 'custom', target: 3 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'protein_hunter',
    name: 'Caçador de Proteína',
    description: 'Complete 20 treinos sem faltar nenhum',
    icon: Target,
    category: 'consistency',
    tier: 'ouro',
    points: 250,
    requirement: { type: 'workout_count', target: 20, timeframe: 'all_time' },
    unlocked: false,
    progress: 0
  },
  {
    id: 'no_pain_no_gain',
    name: 'Sem Dor, Sem Ganho',
    description: 'Complete um treino que dure mais de 2 horas',
    icon: Clock,
    category: 'special',
    tier: 'diamante',
    points: 400,
    requirement: { type: 'time_based', target: 120 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'mass_monster',
    name: 'Monstro da Massa',
    description: 'Ganhe 5kg de peso corporal em 3 meses',
    icon: Crown,
    category: 'milestone',
    tier: 'epico',
    points: 750,
    requirement: { type: 'custom', target: 5 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'iron_addiction',
    name: 'Viciado em Ferro',
    description: 'Treine todos os dias por 2 semanas seguidas',
    icon: Zap,
    category: 'consistency',
    tier: 'diamante',
    points: 500,
    requirement: { type: 'consecutive_days', target: 14 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'bicep_flex',
    name: 'Flexão de Ego',
    description: 'Tire 10 selfies no espelho da academia',
    icon: Star,
    category: 'special',
    tier: 'bronze',
    points: 15,
    requirement: { type: 'custom', target: 10 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'pre_workout_zombie',
    name: 'Zumbi do Pré-Treino',
    description: 'Treine às 5h da manhã por 5 dias seguidos',
    icon: Flame,
    category: 'special',
    tier: 'ouro',
    points: 300,
    requirement: { type: 'custom', target: 5 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'leg_day_survivor',
    name: 'Sobrevivente do Leg Day',
    description: 'Complete 10 treinos de perna sem pular nenhum',
    icon: Shield,
    category: 'consistency',
    tier: 'prata',
    points: 150,
    requirement: { type: 'custom', target: 10 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'pump_chaser',
    name: 'Caçador de Pump',
    description: 'Faça mais de 20 séries em um único treino',
    icon: Zap,
    category: 'strength',
    tier: 'ouro',
    points: 200,
    requirement: { type: 'custom', target: 20 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'bench_warrior',
    name: 'Guerreiro do Supino',
    description: 'Supino com o próprio peso corporal',
    icon: Medal,
    category: 'strength',
    tier: 'diamante',
    points: 600,
    requirement: { type: 'single_weight', target: 80 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'gym_shark',
    name: 'Tubarão da Academia',
    description: 'Seja o primeiro a chegar na academia 10 vezes',
    icon: Crown,
    category: 'special',
    tier: 'prata',
    points: 120,
    requirement: { type: 'custom', target: 10 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'mirror_magnet',
    name: 'Ímã de Espelho',
    description: 'Passe mais de 30 minutos checando a forma nos espelhos',
    icon: Star,
    category: 'special',
    tier: 'bronze',
    points: 20,
    requirement: { type: 'time_based', target: 30 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'gains_goblin',
    name: 'Duende dos Ganhos',
    description: 'Aumente a carga em pelo menos 3 exercícios na mesma semana',
    icon: Target,
    category: 'strength',
    tier: 'ouro',
    points: 250,
    requirement: { type: 'custom', target: 3 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'sweat_waterfall',
    name: 'Cachoeira de Suor',
    description: 'Termine um treino completamente encharcado',
    icon: Trophy,
    category: 'special',
    tier: 'prata',
    points: 80,
    requirement: { type: 'custom', target: 1 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'rep_collector',
    name: 'Colecionador de Reps',
    description: 'Complete mais de 1000 repetições em um mês',
    icon: Award,
    category: 'milestone',
    tier: 'epico',
    points: 800,
    requirement: { type: 'custom', target: 1000 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'beast_mode',
    name: 'Modo Fera',
    description: 'Treine por mais de 90 minutos sem parar',
    icon: Flame,
    category: 'special',
    tier: 'diamante',
    points: 450,
    requirement: { type: 'time_based', target: 90 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'iron_temple_monk',
    name: 'Monge do Templo de Ferro',
    description: 'Treine na mesma academia por 6 meses seguidos',
    icon: Shield,
    category: 'consistency',
    tier: 'lendario',
    points: 1000,
    requirement: { type: 'custom', target: 180 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'ultimate_bulk',
    name: 'Bulk Supremo',
    description: 'Ganhe mais de 10kg mantendo menos de 15% de gordura',
    icon: Crown,
    category: 'milestone',
    tier: 'mitico',
    points: 1500,
    requirement: { type: 'custom', target: 10 },
    unlocked: false,
    progress: 0
  }
];

// Achievement Card Component
function AchievementCard({ achievement }: { achievement: Achievement }) {
  const IconComponent = achievement.icon;
  
  const tierColors = {
    bronze: 'from-orange-400 to-orange-600',
    prata: 'from-slate-400 to-slate-600', 
    ouro: 'from-yellow-400 to-yellow-600',
    diamante: 'from-cyan-400 to-cyan-600',
    epico: 'from-purple-400 to-purple-600',
    lendario: 'from-red-400 to-red-600',
    mitico: 'from-pink-400 to-indigo-400'
  };

  const tierBadgeColors = {
    bronze: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    prata: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    ouro: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    diamante: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    epico: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    lendario: 'bg-red-500/20 text-red-300 border-red-500/30',
    mitico: 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border-pink-500/30'
  };

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
        achievement.unlocked 
          ? 'bg-card border-border/40 shadow-md' 
          : 'bg-card/60 border-border/30'
      }`}
      data-testid={`achievement-card-${achievement.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`relative flex-shrink-0 ${
            achievement.unlocked 
              ? 'bg-slate-100 dark:bg-slate-800 p-3 rounded-xl'
              : 'bg-muted p-3 rounded-xl'
          }`}>
            {achievement.unlocked ? (
              <IconComponent className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            ) : (
              <Lock className="w-6 h-6 text-muted-foreground" />
            )}
            
            {achievement.unlocked && (
              <div className="absolute -top-1 -right-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 bg-background rounded-full" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header - Nome e badges */}
            <div className="flex items-start justify-between mb-3">
              <h3 className={`text-lg font-bold leading-tight ${
                achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {achievement.name}
              </h3>
              
              <div className="flex items-center gap-2 ml-3">
                <Badge variant="outline" className="text-xs">
                  {achievement.tier}
                </Badge>
                <Badge variant="secondary" className="text-xs whitespace-nowrap">
                  +{achievement.points}
                </Badge>
              </div>
            </div>
            
            {/* Description */}
            <p className={`text-sm leading-relaxed mb-4 ${
              achievement.unlocked ? 'text-muted-foreground' : 'text-muted-foreground/80'
            }`}>
              {achievement.description}
            </p>

            {/* Progress */}
            {achievement.unlocked ? (
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
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
                  <span className="text-muted-foreground font-medium">
                    {achievement.progress}%
                  </span>
                </div>
                <Progress 
                  value={achievement.progress} 
                  className="h-2"
                  data-testid={`progress-${achievement.id}`}
                />
                {achievement.progress > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {Math.ceil(achievement.requirement.target * (1 - achievement.progress / 100))} restante
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Level System Component
function LevelSystem({ achievements, username }: { achievements: Achievement[]; username: string }) {
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);
  
  // Calculate level based on points (exponential growth)
  const calculateLevel = (points: number) => {
    if (points < 100) return 1;
    if (points < 300) return 2;
    if (points < 600) return 3;
    if (points < 1000) return 4;
    if (points < 1500) return 5;
    if (points < 2200) return 6;
    if (points < 3000) return 7;
    if (points < 4000) return 8;
    if (points < 5200) return 9;
    if (points < 6600) return 10;
    if (points < 8200) return 11;
    if (points < 10000) return 12;
    return Math.floor(12 + (points - 10000) / 2000);
  };

  // Calculate points needed for next level
  const getPointsForLevel = (level: number) => {
    if (level <= 1) return 0;
    if (level === 2) return 100;
    if (level === 3) return 300;
    if (level === 4) return 600;
    if (level === 5) return 1000;
    if (level === 6) return 1500;
    if (level === 7) return 2200;
    if (level === 8) return 3000;
    if (level === 9) return 4000;
    if (level === 10) return 5200;
    if (level === 11) return 6600;
    if (level === 12) return 8200;
    if (level === 13) return 10000;
    return 10000 + (level - 13) * 2000;
  };

  const currentLevel = calculateLevel(totalPoints);
  const nextLevel = currentLevel + 1;
  const currentLevelPoints = getPointsForLevel(currentLevel);
  const nextLevelPoints = getPointsForLevel(nextLevel);
  const progressPoints = totalPoints - currentLevelPoints;
  const neededPoints = nextLevelPoints - currentLevelPoints;
  const progressPercentage = Math.min((progressPoints / neededPoints) * 100, 100);

  // Level titles based on level ranges
  const getLevelTitle = (level: number) => {
    if (level <= 2) return "Novato";
    if (level <= 4) return "Iniciante";
    if (level <= 6) return "Atleta";
    if (level <= 8) return "Veterano";
    if (level <= 10) return "Expert";
    if (level <= 12) return "Mestre";
    if (level <= 15) return "Lenda";
    return "Imortal";
  };

  return (
    <Card className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 border-blue-500/20 mb-6">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          {/* Level Badge */}
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-blue-400/50 shadow-lg">
              <span className="text-2xl font-bold text-white">{currentLevel}</span>
            </div>
            <div className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-bold">
              LVL
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-foreground">@{username}</h2>
              <Badge variant="outline" className="text-xs bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30">
                {getLevelTitle(currentLevel)}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {/* Progress Bar */}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Nível {currentLevel}</span>
                <span>Nível {nextLevel}</span>
              </div>
              
              <div className="relative">
                <Progress 
                  value={progressPercentage} 
                  className="h-3 bg-slate-800/50"
                  data-testid="level-progress"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full pointer-events-none" />
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{totalPoints} XP</span>
                <span>{nextLevelPoints - totalPoints} XP para próximo nível</span>
              </div>
            </div>
          </div>
        </div>

        {/* Level Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/40">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{totalPoints}</div>
            <div className="text-xs text-muted-foreground">XP Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{currentLevel}</div>
            <div className="text-xs text-muted-foreground">Nível Atual</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{Math.round(progressPercentage)}%</div>
            <div className="text-xs text-muted-foreground">Progresso</div>
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
  const completionPercentage = Math.round((unlockedCount / achievements.length) * 100);
  
  // Calculate tier counts
  const tierCounts = {
    bronze: achievements.filter(a => a.unlocked && a.tier === 'bronze').length,
    prata: achievements.filter(a => a.unlocked && a.tier === 'prata').length,
    ouro: achievements.filter(a => a.unlocked && a.tier === 'ouro').length,
    diamante: achievements.filter(a => a.unlocked && a.tier === 'diamante').length,
    epico: achievements.filter(a => a.unlocked && a.tier === 'epico').length,
    lendario: achievements.filter(a => a.unlocked && a.tier === 'lendario').length,
    mitico: achievements.filter(a => a.unlocked && a.tier === 'mitico').length,
  };

  // Count highest tier achieved
  const getHighestTier = () => {
    if (tierCounts.mitico > 0) return "Mítico";
    if (tierCounts.lendario > 0) return "Lendário";
    if (tierCounts.epico > 0) return "Épico";
    if (tierCounts.diamante > 0) return "Diamante";
    if (tierCounts.ouro > 0) return "Ouro";
    if (tierCounts.prata > 0) return "Prata";
    if (tierCounts.bronze > 0) return "Bronze";
    return "Nenhum";
  };

  const highestTier = getHighestTier();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Card className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 border-emerald-500/20">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <Trophy className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 mb-2">{unlockedCount}</div>
          <div className="text-sm text-muted-foreground">Conquistas</div>
          <div className="text-xs text-muted-foreground mt-1">
            {completionPercentage}% completo
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border-blue-500/20">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <Zap className="w-8 h-8 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-2">{totalPoints}</div>
          <div className="text-sm text-muted-foreground">XP Alcançado</div>
          <div className="text-xs text-muted-foreground mt-1">
            de {totalPossiblePoints} possíveis
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-purple-500/20">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <Crown className="w-8 h-8 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-400 mb-2">{tierCounts.mitico + tierCounts.lendario + tierCounts.epico}</div>
          <div className="text-sm text-muted-foreground">Elite</div>
          <div className="text-xs text-muted-foreground mt-1">
            Épico+ desbloqueadas
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-600/10 border-orange-500/20">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <Star className="w-8 h-8 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-orange-400 mb-2">{highestTier}</div>
          <div className="text-sm text-muted-foreground">Maior Nível</div>
          <div className="text-xs text-muted-foreground mt-1">
            Conquista alcançada
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
  const { user } = useAuth();

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

        {/* Level System */}
        <LevelSystem achievements={SAMPLE_ACHIEVEMENTS} username={user?.username || 'Usuário'} />

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
                <SelectItem value="prata">Prata</SelectItem>
                <SelectItem value="ouro">Ouro</SelectItem>
                <SelectItem value="diamante">Diamante</SelectItem>
                <SelectItem value="epico">Épico</SelectItem>
                <SelectItem value="lendario">Lendário</SelectItem>
                <SelectItem value="mitico">Mítico</SelectItem>
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