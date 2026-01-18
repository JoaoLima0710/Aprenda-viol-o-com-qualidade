import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Flame, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface SongProgressData {
  songId: string;
  totalAttempts: number;
  successfulAttempts: number;
  accuracyHistory: number[];
  timeSpent: number; // segundos totais
  sections: Array<{
    id: string;
    name: string;
    accuracy: number; // 0-1
    attempts: number;
    timeSpent: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  lastPlayed: number;
  currentStreak: number;
  bestStreak: number;
}

export interface StealthGamificationProps {
  progressData: SongProgressData;
  currentSection?: string;
  isPlaying?: boolean;
  showVisualFeedback?: boolean;
  className?: string;
}

export function StealthGamification({
  progressData,
  currentSection,
  isPlaying = false,
  showVisualFeedback = true,
  className = ''
}: StealthGamificationProps) {
  const [showAchievement, setShowAchievement] = useState<string | null>(null);
  const [recentImprovements, setRecentImprovements] = useState<string[]>([]);

  // Calcular estatísticas gerais
  const stats = useMemo(() => {
    const overallAccuracy = progressData.accuracyHistory.length > 0
      ? progressData.accuracyHistory.reduce((sum, acc) => sum + acc, 0) / progressData.accuracyHistory.length
      : 0;

    const recentAccuracy = progressData.accuracyHistory.slice(-5);
    const recentAvg = recentAccuracy.length > 0
      ? recentAccuracy.reduce((sum, acc) => sum + acc, 0) / recentAccuracy.length
      : 0;

    const improvement = recentAccuracy.length >= 2
      ? recentAvg - (recentAccuracy.slice(0, -1).reduce((sum, acc) => sum + acc, 0) / (recentAccuracy.length - 1))
      : 0;

    const masteryLevel = overallAccuracy > 0.9 ? 'master'
                       : overallAccuracy > 0.8 ? 'expert'
                       : overallAccuracy > 0.7 ? 'advanced'
                       : overallAccuracy > 0.6 ? 'intermediate'
                       : 'beginner';

    return {
      overallAccuracy,
      recentAccuracy: recentAvg,
      improvement,
      masteryLevel,
      totalSections: progressData.sections.length,
      completedSections: progressData.sections.filter(s => s.accuracy > 0.8).length
    };
  }, [progressData]);

  // Detectar melhorias recentes
  useEffect(() => {
    const improvements: string[] = [];

    if (stats.improvement > 0.1) {
      improvements.push('Precisão melhorando!');
    }

    if (progressData.currentStreak >= 3) {
      improvements.push(`${progressData.currentStreak} dias seguidos!`);
    }

    if (stats.overallAccuracy > 0.8 && stats.recentAccuracy > stats.overallAccuracy) {
      improvements.push('Superando sua média!');
    }

    const newSections = progressData.sections.filter(s => s.attempts === 1 && s.accuracy > 0.7);
    if (newSections.length > 0) {
      improvements.push('Nova seção dominada!');
    }

    setRecentImprovements(improvements);

    // Mostrar achievement se houve melhoria significativa
    if (stats.improvement > 0.15) {
      setShowAchievement('improvement');
      setTimeout(() => setShowAchievement(null), 3000);
    }
  }, [stats, progressData]);

  // Gerar cores do heatmap baseado na precisão
  const getHeatmapColor = (accuracy: number): string => {
    if (accuracy >= 0.9) return 'bg-green-500/30 border-green-400/50'; // Excelente
    if (accuracy >= 0.8) return 'bg-blue-500/30 border-blue-400/50';  // Bom
    if (accuracy >= 0.7) return 'bg-yellow-500/30 border-yellow-400/50'; // Regular
    if (accuracy >= 0.6) return 'bg-orange-500/30 border-orange-400/50'; // Ruim
    return 'bg-red-500/30 border-red-400/50'; // Muito ruim
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getMasteryIcon = (level: string) => {
    switch (level) {
      case 'master': return <Trophy className="w-4 h-4 text-yellow-400" />;
      case 'expert': return <Star className="w-4 h-4 text-purple-400" />;
      case 'advanced': return <Flame className="w-4 h-4 text-orange-400" />;
      case 'intermediate': return <Target className="w-4 h-4 text-blue-400" />;
      default: return null;
    }
  };

  const getMasteryLabel = (level: string): string => {
    switch (level) {
      case 'master': return 'Mestre';
      case 'expert': return 'Expert';
      case 'advanced': return 'Avançado';
      case 'intermediate': return 'Intermediário';
      default: return 'Iniciante';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Barra de Progresso de Domínio (Topo) */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Domínio da Música</span>
            {getMasteryIcon(stats.masteryLevel)}
            <Badge variant="outline" className="text-xs">
              {getMasteryLabel(stats.masteryLevel)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">
              {stats.completedSections}/{stats.totalSections} seções
            </span>
            <span className="font-bold text-white">
              {Math.round(stats.overallAccuracy * 100)}%
            </span>
          </div>
        </div>

        <div className="w-full h-3 bg-gray-800/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 rounded-full"
            style={{ width: `${stats.overallAccuracy * 100}%` }}
            animate={{
              width: `${stats.overallAccuracy * 100}%`,
              background: stats.overallAccuracy > 0.8
                ? 'linear-gradient(to right, #10b981, #059669)' // Verde para mastery
                : stats.overallAccuracy > 0.6
                ? 'linear-gradient(to right, #3b82f6, #2563eb)' // Azul para intermediate
                : 'linear-gradient(to right, #f59e0b, #d97706)' // Laranja para beginner
            }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Indicadores de melhoria recente */}
        {recentImprovements.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {recentImprovements.map((improvement, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
                  <Star className="w-3 h-3 mr-1" />
                  {improvement}
                </Badge>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Heatmap de Seções (Integrado no conteúdo) */}
      {showVisualFeedback && (
        <div className="absolute inset-0 pointer-events-none">
          {progressData.sections.map((section, index) => {
            const isCurrentSection = section.id === currentSection;
            const sectionAccuracy = section.accuracy;

            return (
              <motion.div
                key={section.id}
                className={`absolute border-2 rounded transition-all duration-300 ${
                  getHeatmapColor(sectionAccuracy)
                } ${isCurrentSection ? 'ring-2 ring-white/50' : ''}`}
                style={{
                  // Posicionamento aproximado baseado no index (ajustar conforme layout real)
                  top: `${10 + (index * 15)}%`,
                  left: '5%',
                  right: '5%',
                  height: '8%',
                  opacity: isCurrentSection ? 0.8 : sectionAccuracy > 0 ? 0.4 : 0.1
                }}
                animate={{
                  opacity: isCurrentSection && isPlaying ? [0.4, 0.8, 0.4] : undefined,
                  scale: isCurrentSection ? 1.02 : 1
                }}
                transition={{
                  duration: 2,
                  repeat: isCurrentSection && isPlaying ? Infinity : 0
                }}
              >
                {/* Indicador de dificuldade */}
                <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
                  <div className={`w-2 h-2 rounded-full ${
                    section.difficulty === 'easy' ? 'bg-green-400' :
                    section.difficulty === 'medium' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Achievement Popup */}
      <AnimatePresence>
        {showAchievement && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed top-4 right-4 z-50"
          >
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-3 rounded-lg shadow-lg border border-yellow-400/50">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                <div>
                  <div className="font-bold text-sm">Melhoria Detectada!</div>
                  <div className="text-xs opacity-90">Sua precisão está aumentando</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicadores sutis de progresso */}
      <div className="absolute top-2 right-2 flex gap-1">
        {/* Streak indicator */}
        {progressData.currentStreak > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-orange-500/20 border border-orange-500/30 rounded-full px-2 py-1"
          >
            <div className="flex items-center gap-1 text-xs text-orange-400">
              <Flame className="w-3 h-3" />
              {progressData.currentStreak}
            </div>
          </motion.div>
        )}

        {/* Recent success indicator */}
        {stats.improvement > 0.05 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-green-500/20 border border-green-500/30 rounded-full px-2 py-1"
          >
            <div className="flex items-center gap-1 text-xs text-green-400">
              <Star className="w-3 h-3" />
              +{Math.round(stats.improvement * 100)}%
            </div>
          </motion.div>
        )}
      </div>

      {/* Progress overlay para seção atual */}
      {currentSection && showVisualFeedback && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white">
                Seção atual: {progressData.sections.find(s => s.id === currentSection)?.name}
              </span>
              <div className="flex items-center gap-2">
                <span className={getDifficultyColor(
                  progressData.sections.find(s => s.id === currentSection)?.difficulty || 'medium'
                )}>
                  {progressData.sections.find(s => s.id === currentSection)?.difficulty}
                </span>
                <span className="text-white font-bold">
                  {Math.round((progressData.sections.find(s => s.id === currentSection)?.accuracy || 0) * 100)}%
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full mt-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                style={{
                  width: `${(progressData.sections.find(s => s.id === currentSection)?.accuracy || 0) * 100}%`
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook para usar Stealth Gamification
export function useStealthGamification(songId: string) {
  const [progressData, setProgressData] = useState<SongProgressData>({
    songId,
    totalAttempts: 0,
    successfulAttempts: 0,
    accuracyHistory: [],
    timeSpent: 0,
    sections: [],
    lastPlayed: 0,
    currentStreak: 0,
    bestStreak: 0
  });

  const updateProgress = (sectionId: string, accuracy: number, timeSpent: number) => {
    setProgressData(prev => {
      const existingSection = prev.sections.find(s => s.id === sectionId);
      const newSections = existingSection
        ? prev.sections.map(s =>
            s.id === sectionId
              ? {
                  ...s,
                  accuracy: (s.accuracy * s.attempts + accuracy) / (s.attempts + 1),
                  attempts: s.attempts + 1,
                  timeSpent: s.timeSpent + timeSpent
                }
              : s
          )
        : [...prev.sections, {
            id: sectionId,
            name: sectionId,
            accuracy,
            attempts: 1,
            timeSpent,
            difficulty: 'medium' as const
          }];

      return {
        ...prev,
        totalAttempts: prev.totalAttempts + 1,
        successfulAttempts: prev.successfulAttempts + (accuracy > 0.7 ? 1 : 0),
        accuracyHistory: [...prev.accuracyHistory.slice(-9), accuracy],
        timeSpent: prev.timeSpent + timeSpent,
        sections: newSections,
        lastPlayed: Date.now()
      };
    });
  };

  return {
    progressData,
    updateProgress
  };
}
