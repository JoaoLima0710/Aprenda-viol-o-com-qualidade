import { useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Clock, Target, Brain, TrendingUp, CheckCircle2, ChevronRight, Flame, Star, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { TrainingModule } from '@/services/TrainingMethodologyService';
import { Link } from 'wouter';
import { SpacedRepetitionReview } from '@/components/spaced-repetition/SpacedRepetitionReview';
import { useDailyTraining } from '@/hooks/useDailyTraining';

export function DailyTraining() {
  const {
    dailyTraining,
    loading,
    error,
    completedModules,
    progress,
    markModuleComplete,
    refreshTraining,
    getModuleLink,
  } = useDailyTraining();

  const getCategoryIcon = useCallback((category: string): string => {
    const iconMap: Record<string, string> = {
      'chords': '🎸',
      'scales': '🎵',
      'rhythm': '🥁',
      'ear-training': '👂',
      'songs': '🎤',
      'technique': '🧘',
    };
    return iconMap[category] || '🎯';
  }, []);

  const getDifficultyColor = useCallback((difficulty: number): string => {
    if (difficulty <= 2) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (difficulty <= 3) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  }, []);

  const getDifficultyLabel = useCallback((difficulty: number): string => {
    if (difficulty <= 2) return 'Iniciante';
    if (difficulty <= 3) return 'Intermediário';
    return 'Avançado';
  }, []);

  const getPriorityBadge = useCallback((priority: 'essential' | 'recommended' | 'optional') => {
    switch (priority) {
      case 'essential':
        return (
          <Badge className="bg-red-500/20 text-red-300 border-red-500/40 flex items-center gap-1">
            <Flame className="w-3 h-3" />
            Essencial
          </Badge>
        );
      case 'recommended':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40 flex items-center gap-1">
            <Star className="w-3 h-3" />
            Recomendado
          </Badge>
        );
      case 'optional':
        return (
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            Opcional
          </Badge>
        );
      default:
        return null;
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/30">
        <div className="text-center">
          <p className="text-red-400 mb-4">Erro ao carregar treino do dia</p>
          <Button onClick={refreshTraining} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      </Card>
    );
  }

  if (!dailyTraining) {
    return null;
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <Target className="w-6 h-6 lg:w-8 lg:h-8 text-purple-400" />
          Treino do Dia
        </h2>
        <p className="text-sm lg:text-base text-gray-400">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </motion.div>

      {/* Focus Card - Compacto em mobile */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 lg:p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl"
      >
        <div className="flex items-start gap-3 lg:gap-4">
          <div className="p-2 lg:p-3 bg-purple-500/20 rounded-lg flex-shrink-0">
            <Brain className="w-5 h-5 lg:w-6 lg:h-6 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg lg:text-xl font-bold text-white mb-1 lg:mb-2">
              Foco de Hoje: {dailyTraining.focus}
            </h3>
            {/* Rationale resumido em mobile */}
            <p className="text-sm lg:text-base text-gray-300 mb-3 lg:mb-4 line-clamp-2 lg:line-clamp-none">
              {dailyTraining.rationale}
            </p>
            
            <div className="flex items-center gap-3 lg:gap-4 text-xs lg:text-sm">
              <div className="flex items-center gap-1.5 lg:gap-2 text-gray-400">
                <Clock className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span>{dailyTraining.totalDuration} min</span>
              </div>
              <div className="flex items-center gap-1.5 lg:gap-2 text-gray-400">
                <TrendingUp className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span>{dailyTraining.modules.length} módulos</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs lg:text-sm text-gray-400">
          <span>Progresso do Dia</span>
          <span>{completedModules.size} / {dailyTraining.modules.length} concluídos</span>
        </div>
        <div className="w-full h-2 lg:h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Info sobre Prioridades */}
      <div className="p-3 lg:p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-200">
          💡 <strong>Dica:</strong> Complete pelo menos o módulo <strong>🔥 Essencial</strong> para manter seu streak!
        </p>
      </div>

      {/* Botão Iniciar Treino Completo */}
      {dailyTraining.modules.length > 1 && (
        <div className="flex justify-center">
          <Button
            onClick={() => {
              // Navegar para o primeiro módulo e iniciar sequência
              const firstModule = dailyTraining.modules[0];
              window.location.href = getModuleLink(firstModule);
            }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-3"
            size="lg"
          >
            <Play className="w-5 h-5 mr-2" />
            Iniciar Treino Completo ({dailyTraining.totalDuration} min)
          </Button>
        </div>
      )}

      {/* Revisão Espaçada */}
      <div className="space-y-3 lg:space-y-4">
        <SpacedRepetitionReview />
      </div>

      {/* Training Modules */}
      <div className="space-y-3 lg:space-y-4">
        <h3 className="text-lg lg:text-xl font-bold text-white flex items-center gap-2">
          <Play className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-400" />
          Módulos de Treino
        </h3>
        
        {dailyTraining.modules.map((module, index) => {
          const isCompleted = completedModules.has(module.id);
          
          // Determinar prioridade baseado na posição e análise
          // Primeiro módulo = Essencial, segundo = Recomendado, terceiro+ = Opcional
          const priority: 'essential' | 'recommended' | 'optional' = 
            index === 0 ? 'essential' :
            index === 1 && dailyTraining.modules.length > 1 ? 'recommended' :
            'optional';
          
          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4 lg:p-6 bg-white/5 border-white/10 hover:border-purple-400/50 transition-all">
                <div className="flex items-start gap-3 lg:gap-4">
                  {/* Step Number */}
                  <div className={`flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center font-bold text-sm lg:text-base ${
                    isCompleted 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5" /> : index + 1}
                  </div>

                  {/* Module Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base lg:text-lg font-bold text-white flex items-center gap-2">
                            <span className="text-lg lg:text-xl">{module.icon}</span>
                            <span className="truncate">{module.name}</span>
                          </h4>
                          {getPriorityBadge(priority)}
                        </div>
                        <p className="text-xs lg:text-sm text-gray-400 mt-1 line-clamp-2">{module.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`flex-shrink-0 px-2 lg:px-3 py-1 text-xs rounded-full border ${getDifficultyColor(module.difficulty)}`}>
                          {getDifficultyLabel(module.difficulty)}
                        </span>
                      </div>
                    </div>

                    {/* Skills - Limitar em mobile */}
                    <div className="flex flex-wrap gap-1.5 lg:gap-2 mb-3">
                      {module.skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 lg:py-1 text-xs bg-white/5 text-gray-400 rounded">
                          {skill}
                        </span>
                      ))}
                      {module.skills.length > 3 && (
                        <span className="px-2 py-0.5 lg:py-1 text-xs bg-white/5 text-gray-400 rounded">
                          +{module.skills.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Methodology - Ocultar em mobile */}
                    <div className="hidden lg:block p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-4">
                      <p className="text-sm text-blue-300">
                        <strong>Metodologia:</strong> {module.methodology}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:gap-3">
                      <Link href={getModuleLink(module)} className="flex-1 sm:flex-initial">
                        <Button 
                          className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm lg:text-base h-9 lg:h-10"
                          disabled={isCompleted}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1.5 lg:mr-2" />
                              Concluído
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1.5 lg:mr-2" />
                              Iniciar
                            </>
                          )}
                        </Button>
                      </Link>
                      
                      {!isCompleted && (
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 text-sm lg:text-base h-9 lg:h-10"
                          onClick={() => markModuleComplete(module.id)}
                        >
                          <span className="hidden sm:inline">Marcar como Concluído</span>
                          <span className="sm:hidden">Concluir</span>
                        </Button>
                      )}
                      
                      <div className="flex items-center justify-center sm:justify-start gap-1.5 lg:gap-2 text-xs lg:text-sm text-gray-400 sm:ml-auto">
                        <Clock className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                        <span>{module.duration} min</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
