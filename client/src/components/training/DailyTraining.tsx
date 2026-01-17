import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Clock, Target, Brain, TrendingUp, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { trainingMethodologyService, DailyTraining as DailyTrainingType, TrainingModule } from '@/services/TrainingMethodologyService';
import { Link } from 'wouter';

export function DailyTraining() {
  const [dailyTraining, setDailyTraining] = useState<DailyTrainingType | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDailyTraining();
  }, []);

  const loadDailyTraining = async () => {
    setLoading(true);
    try {
      const training = await trainingMethodologyService.generateDailyTraining();
      setDailyTraining(training);
    } catch (error) {
      console.error('Erro ao carregar treino do dia:', error);
    } finally {
      setLoading(false);
    }
  };

  const markModuleComplete = (moduleId: string) => {
    setCompletedModules(prev => new Set(prev).add(moduleId));
  };

  const getModuleLink = (module: TrainingModule): string => {
    const linkMap: Record<string, string> = {
      'chords': '/chords',
      'scales': '/scales',
      'rhythm': '/practice',
      'ear-training': '/practice',
      'songs': '/songs',
      'technique': '/practice',
    };
    return linkMap[module.category] || '/practice';
  };

  const getCategoryIcon = (category: string): string => {
    const iconMap: Record<string, string> = {
      'chords': '🎸',
      'scales': '🎵',
      'rhythm': '🥁',
      'ear-training': '👂',
      'songs': '🎤',
      'technique': '🧘',
    };
    return iconMap[category] || '🎯';
  };

  const getDifficultyColor = (difficulty: number): string => {
    if (difficulty <= 2) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (difficulty <= 3) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const getDifficultyLabel = (difficulty: number): string => {
    if (difficulty <= 2) return 'Iniciante';
    if (difficulty <= 3) return 'Intermediário';
    return 'Avançado';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!dailyTraining) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Não foi possível carregar o treino do dia</p>
        <Button onClick={loadDailyTraining} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  const progress = (completedModules.size / dailyTraining.modules.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <Target className="w-8 h-8 text-purple-400" />
          Treino do Dia
        </h2>
        <p className="text-gray-400">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </motion.div>

      {/* Focus Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-500/20 rounded-lg">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">Foco de Hoje: {dailyTraining.focus}</h3>
            <p className="text-gray-300 mb-4">{dailyTraining.rationale}</p>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{dailyTraining.totalDuration} minutos</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <TrendingUp className="w-4 h-4" />
                <span>{dailyTraining.modules.length} módulos</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Progresso do Dia</span>
          <span>{completedModules.size} / {dailyTraining.modules.length} concluídos</span>
        </div>
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Training Modules */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Play className="w-5 h-5 text-cyan-400" />
          Módulos de Treino
        </h3>
        
        {dailyTraining.modules.map((module, index) => {
          const isCompleted = completedModules.has(module.id);
          
          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 bg-white/5 border-white/10 hover:border-purple-400/50 transition-all">
                <div className="flex items-start gap-4">
                  {/* Step Number */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    isCompleted 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                  </div>

                  {/* Module Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                          <span>{module.icon}</span>
                          {module.name}
                        </h4>
                        <p className="text-sm text-gray-400 mt-1">{module.description}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full border ${getDifficultyColor(module.difficulty)}`}>
                        {getDifficultyLabel(module.difficulty)}
                      </span>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {module.skills.map((skill, i) => (
                        <span key={i} className="px-2 py-1 text-xs bg-white/5 text-gray-400 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Methodology */}
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-4">
                      <p className="text-sm text-blue-300">
                        <strong>Metodologia:</strong> {module.methodology}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <Link href={getModuleLink(module)}>
                        <Button 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                          disabled={isCompleted}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Concluído
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Iniciar Treino
                            </>
                          )}
                        </Button>
                      </Link>
                      
                      {!isCompleted && (
                        <Button
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => markModuleComplete(module.id)}
                        >
                          Marcar como Concluído
                        </Button>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-400 ml-auto">
                        <Clock className="w-4 h-4" />
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

      {/* Pedagogical Approach */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl"
      >
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5 text-cyan-400" />
          Abordagem Pedagógica
        </h3>
        <p className="text-gray-300 leading-relaxed">
          {dailyTraining.pedagogicalApproach}
        </p>
      </motion.div>

      {/* Completion Message */}
      {progress === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-2">🎉 Parabéns!</h3>
          <p className="text-gray-300 mb-4">
            Você completou o treino do dia! Continue assim para alcançar seus objetivos musicais.
          </p>
          <Button
            onClick={loadDailyTraining}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white"
          >
            <ChevronRight className="w-4 h-4 mr-2" />
            Gerar Novo Treino
          </Button>
        </motion.div>
      )}
    </div>
  );
}
