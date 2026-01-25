/**
 * 📊 Practice Metrics Component
 * 
 * Componente para exibir métricas simples e educativas de progresso.
 * 
 * Mostra:
 * - % de acertos
 * - Tempo médio
 * - Consistência por sessão
 * - Comparação entre sessões
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Activity,
  Award,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePracticeMetricsStore, PracticeType } from '@/stores/usePracticeMetricsStore';

interface PracticeMetricsProps {
  practiceType: PracticeType;
  currentSession?: {
    accuracy: number;
    duration: number;
    consistency: number;
  };
  showComparison?: boolean;
  compact?: boolean;
}

export function PracticeMetrics({
  practiceType,
  currentSession,
  showComparison = true,
  compact = false,
}: PracticeMetricsProps) {
  const { getMetrics, getSessionComparison } = usePracticeMetricsStore();

  const metrics = useMemo(() => getMetrics(practiceType, 7), [practiceType, getMetrics]);

  const comparison = useMemo(() => {
    if (!currentSession) return null;
    
    const session = {
      id: '',
      type: practiceType,
      timestamp: Date.now(),
      duration: currentSession.duration,
      accuracy: currentSession.accuracy,
      attempts: 0,
      correct: 0,
      consistency: currentSession.consistency,
    };

    return getSessionComparison(session);
  }, [currentSession, practiceType, getSessionComparison]);

  if (compact) {
    return (
      <Card className="p-4 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Precisão</p>
            <p className="text-lg font-bold text-cyan-400">{metrics.averageAccuracy}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Tempo Médio</p>
            <p className="text-lg font-bold text-purple-400">{metrics.averageTime}s</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Consistência</p>
            <p className="text-lg font-bold text-green-400">{metrics.averageConsistency}%</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Suas Métricas
          </h3>
          <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
            {metrics.totalSessions} sessões
          </Badge>
        </div>
        <p className="text-sm text-gray-400">
          Últimos 7 dias • {practiceType === 'chord' ? 'Acordes' : practiceType === 'chord_progression' ? 'Progressões' : practiceType === 'rhythm' ? 'Ritmo' : 'Prática'}
        </p>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Precisão */}
        <div className="rounded-xl p-4 bg-cyan-500/10 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-cyan-400" />
            {metrics.bestSession && metrics.bestSession.accuracy > metrics.averageAccuracy && (
              <Award className="w-4 h-4 text-yellow-400" />
            )}
          </div>
          <p className="text-xs text-gray-400 mb-1">Precisão Média</p>
          <p className="text-2xl font-bold text-cyan-400">{metrics.averageAccuracy}%</p>
          {metrics.bestSession && (
            <p className="text-xs text-gray-500 mt-1">
              Melhor: {metrics.bestSession.accuracy}%
            </p>
          )}
        </div>

        {/* Tempo Médio */}
        <div className="rounded-xl p-4 bg-purple-500/10 border border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-purple-400" />
            {metrics.bestSession && metrics.bestSession.duration < metrics.averageTime && (
              <Award className="w-4 h-4 text-yellow-400" />
            )}
          </div>
          <p className="text-xs text-gray-400 mb-1">Tempo Médio</p>
          <p className="text-2xl font-bold text-purple-400">{metrics.averageTime}s</p>
          {metrics.bestSession && (
            <p className="text-xs text-gray-500 mt-1">
              Melhor: {metrics.bestSession.duration}s
            </p>
          )}
        </div>

        {/* Consistência */}
        <div className="rounded-xl p-4 bg-green-500/10 border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-green-400" />
            {metrics.bestSession && metrics.bestSession.consistency > metrics.averageConsistency && (
              <Award className="w-4 h-4 text-yellow-400" />
            )}
          </div>
          <p className="text-xs text-gray-400 mb-1">Consistência</p>
          <p className="text-2xl font-bold text-green-400">{metrics.averageConsistency}%</p>
          {metrics.bestSession && (
            <p className="text-xs text-gray-500 mt-1">
              Melhor: {metrics.bestSession.consistency}%
            </p>
          )}
        </div>
      </div>

      {/* Comparação com Sessão Atual */}
      {showComparison && currentSession && comparison && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 rounded-xl border-2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30"
        >
          <div className="flex items-center gap-2 mb-3">
            {comparison.isImproving ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-yellow-400" />
            )}
            <h4 className="font-bold text-white">Comparação com Sessões Anteriores</h4>
          </div>

          <p className="text-sm text-gray-300 mb-4">{comparison.message}</p>

          <div className="grid grid-cols-3 gap-3">
            {/* Mudança de Precisão */}
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-gray-400 flex-1">Precisão</span>
              {comparison.accuracyChange > 0 ? (
                <div className="flex items-center gap-1 text-green-400">
                  <ArrowUp className="w-3 h-3" />
                  <span className="text-sm font-semibold">+{comparison.accuracyChange}%</span>
                </div>
              ) : comparison.accuracyChange < 0 ? (
                <div className="flex items-center gap-1 text-red-400">
                  <ArrowDown className="w-3 h-3" />
                  <span className="text-sm font-semibold">{comparison.accuracyChange}%</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-400">
                  <Minus className="w-3 h-3" />
                  <span className="text-sm font-semibold">0%</span>
                </div>
              )}
            </div>

            {/* Mudança de Tempo */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400 flex-1">Tempo</span>
              {comparison.timeChange > 0 ? (
                <div className="flex items-center gap-1 text-green-400">
                  <ArrowUp className="w-3 h-3" />
                  <span className="text-sm font-semibold">+{comparison.timeChange}s</span>
                </div>
              ) : comparison.timeChange < 0 ? (
                <div className="flex items-center gap-1 text-red-400">
                  <ArrowDown className="w-3 h-3" />
                  <span className="text-sm font-semibold">{comparison.timeChange}s</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-400">
                  <Minus className="w-3 h-3" />
                  <span className="text-sm font-semibold">0s</span>
                </div>
              )}
            </div>

            {/* Mudança de Consistência */}
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400 flex-1">Consistência</span>
              {comparison.consistencyChange > 0 ? (
                <div className="flex items-center gap-1 text-green-400">
                  <ArrowUp className="w-3 h-3" />
                  <span className="text-sm font-semibold">+{comparison.consistencyChange}%</span>
                </div>
              ) : comparison.consistencyChange < 0 ? (
                <div className="flex items-center gap-1 text-red-400">
                  <ArrowDown className="w-3 h-3" />
                  <span className="text-sm font-semibold">{comparison.consistencyChange}%</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-400">
                  <Minus className="w-3 h-3" />
                  <span className="text-sm font-semibold">0%</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Progresso Visual */}
      {metrics.totalSessions > 0 && (
        <div className="mt-6 space-y-3">
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Precisão</span>
              <span>{metrics.averageAccuracy}%</span>
            </div>
            <Progress value={metrics.averageAccuracy} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Consistência</span>
              <span>{metrics.averageConsistency}%</span>
            </div>
            <Progress value={metrics.averageConsistency} className="h-2" />
          </div>
        </div>
      )}

      {metrics.totalSessions === 0 && (
        <div className="mt-6 p-4 rounded-xl bg-gray-800/50 border border-gray-700 text-center">
          <p className="text-sm text-gray-400">
            Complete algumas sessões de prática para ver suas métricas aqui!
          </p>
        </div>
      )}
    </Card>
  );
}
