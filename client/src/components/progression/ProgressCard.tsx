/**
 * Card "Seu Progresso"
 * Mostra métricas visuais de progresso do usuário
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Music, 
  Target, 
  TrendingUp, 
  CheckCircle2,
  Guitar,
  BookOpen,
  Trophy
} from 'lucide-react';
import { useChordStore } from '@/stores/useChordStore';
import { useScaleStore } from '@/stores/useScaleStore';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useProgressionStore } from '@/stores/useProgressionStore';
import { useSongUnlockStore } from '@/stores/useSongUnlockStore';

interface ProgressMetric {
  id: string;
  label: string;
  current: number;
  total: number;
  icon: React.ReactNode;
  color: string;
  trend?: number; // % de melhoria
}

export function ProgressCard() {
  const { progress: chordProgress } = useChordStore();
  const { completedScales } = useScaleStore();
  const { level, xp } = useGamificationStore();
  const { skills } = useProgressionStore();
  const { getUnlockedSongs } = useSongUnlockStore();

  const [metrics, setMetrics] = useState<ProgressMetric[]>([]);

  useEffect(() => {
    const completedSkills = skills?.filter((skill) => skill.mastered) ?? [];
    const unlockedSongs = getUnlockedSongs();
    const practicedChordsCount = Object.values(chordProgress ?? {}).filter(p => p?.practiced).length;
    const completedScalesCount = completedScales?.length ?? 0;

    // Calcular métricas
    const newMetrics: ProgressMetric[] = [
      {
        id: 'chords',
        label: 'Acordes Dominados',
        current: practicedChordsCount,
        total: 50, // Total de acordes básicos
        icon: <Guitar className="w-5 h-5" />,
        color: 'from-purple-500 to-pink-500',
        trend: 15 // Placeholder - calcular baseado em histórico
      },
      {
        id: 'scales',
        label: 'Escalas Aprendidas',
        current: completedScalesCount,
        total: 18, // Total de escalas disponíveis
        icon: <Music className="w-5 h-5" />,
        color: 'from-blue-500 to-cyan-500',
        trend: 8
      },
      {
        id: 'songs',
        label: 'Músicas Completas',
        current: unlockedSongs.length,
        total: 20, // Total de músicas disponíveis
        icon: <BookOpen className="w-5 h-5" />,
        color: 'from-green-500 to-emerald-500',
        trend: 12
      },
      {
        id: 'skills',
        label: 'Habilidades Dominadas',
        current: completedSkills.length,
        total: 45, // Total de habilidades
        icon: <Trophy className="w-5 h-5" />,
        color: 'from-orange-500 to-yellow-500',
        trend: 20
      }
    ];

    setMetrics(newMetrics);
  }, [chordProgress, completedScales, level, skills, getUnlockedSongs]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Seu Progresso
        </CardTitle>
        <p className="text-sm text-white/60 mt-1">
          Acompanhe sua evolução no aprendizado musical
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {metrics.map((metric) => {
          const percentage = metric.total > 0 ? (metric.current / metric.total) * 100 : 0;
          
          return (
            <div key={metric.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center text-white`}>
                    {metric.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{metric.label}</p>
                    <p className="text-xs text-white/60">
                      {metric.current} de {metric.total}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-bold text-white">
                    {Math.round(percentage)}%
                  </p>
                  {metric.trend && metric.trend > 0 && (
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{metric.trend}% este mês
                    </p>
                  )}
                </div>
              </div>
              
              <Progress 
                value={percentage} 
                className="h-2"
              />
            </div>
          );
        })}

        {/* Resumo Geral */}
        <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80 mb-1">Nível Atual</p>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-xl font-bold text-white">Nível {level}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/80 mb-1">XP Total</p>
              <span className="text-xl font-bold text-white">{xp.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
