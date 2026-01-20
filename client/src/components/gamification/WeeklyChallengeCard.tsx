/**
 * Card de Desafio Semanal
 * Reseta toda segunda-feira com novo desafio e recompensas
 */

import { useState, useEffect } from 'react';
import { Trophy, Calendar, Target, Flame, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useProgressionStore } from '@/stores/useProgressionStore';
import { useChordStore } from '@/stores/useChordStore';
import { useScaleStore } from '@/stores/useScaleStore';

interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  type: 'chords' | 'practice_time' | 'scales' | 'songs' | 'accuracy';
  target: number;
  current: number;
  unit: string;
  reward: {
    xp: number;
    badge?: string;
  };
  weekStart: string; // ISO date
  completed: boolean;
}

const CHALLENGE_TEMPLATES: Omit<WeeklyChallenge, 'current' | 'completed' | 'weekStart'>[] = [
  {
    id: 'chords_5',
    title: 'Domine 5 Acordes Novos',
    description: 'Aprenda e pratique 5 novos acordes esta semana',
    type: 'chords',
    target: 5,
    unit: 'acordes',
    reward: { xp: 500, badge: 'Mestre dos Acordes' }
  },
  {
    id: 'practice_150',
    title: '150 Minutos de Prática',
    description: 'Pratique pelo menos 150 minutos esta semana',
    type: 'practice_time',
    target: 150,
    unit: 'minutos',
    reward: { xp: 300 }
  },
  {
    id: 'scales_3',
    title: 'Aprenda 3 Escalas',
    description: 'Domine 3 novas escalas esta semana',
    type: 'scales',
    target: 3,
    unit: 'escalas',
    reward: { xp: 400, badge: 'Explorador de Escalas' }
  },
  {
    id: 'accuracy_85',
    title: 'Precisão de 85%',
    description: 'Mantenha precisão média de 85% em todos os exercícios',
    type: 'accuracy',
    target: 85,
    unit: '%',
    reward: { xp: 600, badge: 'Precisão Perfeita' }
  },
  {
    id: 'songs_2',
    title: 'Aprenda 2 Músicas',
    description: 'Complete 2 músicas do início ao fim',
    type: 'songs',
    target: 2,
    unit: 'músicas',
    reward: { xp: 700, badge: 'Repertório em Crescimento' }
  }
];

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Segunda-feira
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

function generateWeeklyChallenge(): WeeklyChallenge {
  const template = CHALLENGE_TEMPLATES[Math.floor(Math.random() * CHALLENGE_TEMPLATES.length)];
  const weekStart = getWeekStart();
  
  return {
    ...template,
    current: 0,
    completed: false,
    weekStart
  };
}

export function WeeklyChallengeCard() {
  const { addXP, level } = useGamificationStore();
  const { totalPracticeMinutes } = useProgressionStore();
  const { progress: chordProgress } = useChordStore();
  const { completedScales } = useScaleStore();
  
  const [challenge, setChallenge] = useState<WeeklyChallenge | null>(null);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    // Carregar ou gerar desafio semanal
    const saved = localStorage.getItem('weekly_challenge');
    const weekStart = getWeekStart();
    
    if (saved) {
      const parsed: WeeklyChallenge = JSON.parse(saved);
      
      // Verificar se é da semana atual
      if (parsed.weekStart === weekStart) {
        // Atualizar progresso
        updateChallengeProgress(parsed);
      } else {
        // Nova semana - gerar novo desafio
        const newChallenge = generateWeeklyChallenge();
        updateChallengeProgress(newChallenge);
        setChallenge(newChallenge);
        localStorage.setItem('weekly_challenge', JSON.stringify(newChallenge));
      }
    } else {
      // Primeiro desafio
      const newChallenge = generateWeeklyChallenge();
      updateChallengeProgress(newChallenge);
      setChallenge(newChallenge);
      localStorage.setItem('weekly_challenge', JSON.stringify(newChallenge));
    }
    
    // Verificar se recompensa foi reivindicada
    const claimedReward = localStorage.getItem(`weekly_challenge_claimed_${weekStart}`);
    setClaimed(claimedReward === 'true');
  }, []);

  const updateChallengeProgress = (challenge: WeeklyChallenge) => {
    let current = 0;
    
    switch (challenge.type) {
      case 'chords':
        // Contar acordes dominados esta semana
        // Simplificado: usar total de acordes praticados
        current = Object.values(chordProgress ?? {}).filter(p => p?.practiced).length;
        break;
      case 'practice_time':
        // Minutos praticados esta semana (simplificado: usar total)
        current = Math.floor(totalPracticeMinutes ?? 0);
        break;
      case 'scales':
        current = completedScales?.length ?? 0;
        break;
      case 'accuracy':
        // Calcular precisão média (simplificado)
        current = 75; // Placeholder
        break;
      case 'songs':
        // Músicas completadas (simplificado)
        current = 0;
        break;
    }
    
    const completed = current >= challenge.target;
    const updated = { ...challenge, current, completed };
    setChallenge(updated);
    localStorage.setItem('weekly_challenge', JSON.stringify(updated));
  };

  const claimReward = () => {
    if (!challenge || !challenge.completed || claimed) return;
    
    addXP(challenge.reward.xp);
    const weekStart = getWeekStart();
    localStorage.setItem(`weekly_challenge_claimed_${weekStart}`, 'true');
    setClaimed(true);
    
    // Mostrar notificação de sucesso
    if (challenge.reward.badge) {
      // TODO: Mostrar badge desbloqueado
      console.log(`Badge desbloqueado: ${challenge.reward.badge}`);
    }
  };

  if (!challenge) {
    return null;
  }

  const progress = Math.min(100, (challenge.current / challenge.target) * 100);
  const daysRemaining = () => {
    const now = new Date();
    const weekStart = new Date(challenge.weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const diff = weekEnd.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getChallengeIcon = () => {
    switch (challenge.type) {
      case 'chords':
        return <Target className="w-5 h-5" />;
      case 'practice_time':
        return <Clock className="w-5 h-5" />;
      case 'scales':
        return <Sparkles className="w-5 h-5" />;
      case 'accuracy':
        return <Trophy className="w-5 h-5" />;
      case 'songs':
        return <Trophy className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                Desafio Semanal
                {challenge.completed && (
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/40">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Completo!
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-white/60 flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" />
                {daysRemaining()} dias restantes
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Desafio */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            {getChallengeIcon()}
            <h3 className="font-semibold text-white">{challenge.title}</h3>
          </div>
          <p className="text-sm text-white/70 mb-3">{challenge.description}</p>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/80">
                {challenge.current} / {challenge.target} {challenge.unit}
              </span>
              <span className="text-white/60">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </div>

        {/* Recompensa */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80 mb-1">Recompensa:</p>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-500/30 text-yellow-200 border-yellow-500/50">
                  <Sparkles className="w-3 h-3 mr-1" />
                  +{challenge.reward.xp} XP
                </Badge>
                {challenge.reward.badge && (
                  <Badge className="bg-purple-500/30 text-purple-200 border-purple-500/50">
                    <Trophy className="w-3 h-3 mr-1" />
                    {challenge.reward.badge}
                  </Badge>
                )}
              </div>
            </div>
            
            {challenge.completed && !claimed && (
              <Button
                onClick={claimReward}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Reivindicar
              </Button>
            )}
            
            {claimed && (
              <div className="flex items-center gap-2 text-green-300">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-semibold">Reivindicado!</span>
              </div>
            )}
          </div>
        </div>

        {/* Motivação */}
        {!challenge.completed && (
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Flame className="w-4 h-4" />
            <span>
              Falta {challenge.target - challenge.current} {challenge.unit} para completar!
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
