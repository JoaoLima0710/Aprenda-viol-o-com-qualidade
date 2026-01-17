import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { aiAssistantService, Recommendation, UserProfile } from '@/services/AIAssistantService';
import { Sparkles, TrendingUp, Target, Clock, ChevronRight, Brain, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';

export function AIAssistant() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const userProfile = aiAssistantService.getUserProfile();
    const recs = aiAssistantService.generateRecommendations();
    const userInsights = aiAssistantService.getInsights();

    setProfile(userProfile);
    setRecommendations(recs);
    setInsights(userInsights);
  };

  if (!profile) {
    return null;
  }

  const progressToNextLevel = (profile.totalPracticeTime % 3600) / 3600 * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Assistente IA
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </h2>
          <p className="text-sm text-gray-400">Recomendações personalizadas para você</p>
        </div>
      </div>

      {/* Profile Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <p className="text-xs text-gray-400">Nível</p>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{profile.level}</p>
          <Progress value={progressToNextLevel} className="h-2" />
          <p className="text-xs text-gray-500 mt-1">{Math.round(progressToNextLevel)}% para próximo nível</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-400" />
            <p className="text-xs text-gray-400">Precisão Média</p>
          </div>
          <p className="text-3xl font-bold text-white">{Math.round(profile.averageAccuracy)}%</p>
          <p className="text-xs text-gray-500 mt-1">
            {profile.averageAccuracy > 80 ? 'Excelente!' : 
             profile.averageAccuracy > 60 ? 'Bom progresso' : 'Continue praticando'}
          </p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <p className="text-xs text-gray-400">Tempo Total</p>
          </div>
          <p className="text-3xl font-bold text-white">
            {Math.floor(profile.totalPracticeTime / 3600)}h
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Ritmo: {profile.learningPace === 'fast' ? 'Rápido 🚀' :
                     profile.learningPace === 'medium' ? 'Médio 📈' : 'Constante 🎯'}
          </p>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="p-5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-bold text-white">Insights</h3>
          </div>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <p key={index} className="text-sm text-gray-300">
                {insight}
              </p>
            ))}
          </div>
        </Card>
      )}

      {/* Strong Areas */}
      {profile.strongAreas.length > 0 && (
        <Card className="p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
          <h3 className="text-lg font-bold text-white mb-3">✨ Suas Áreas Fortes</h3>
          <div className="flex flex-wrap gap-2">
            {profile.strongAreas.map((area, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-sm text-green-400"
              >
                {area}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Weak Areas */}
      {profile.weakAreas.length > 0 && (
        <Card className="p-5 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
          <h3 className="text-lg font-bold text-white mb-3">💪 Áreas para Melhorar</h3>
          <div className="space-y-3">
            {profile.weakAreas.slice(0, 3).map((area, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{area.category}</p>
                  <p className="text-xs text-gray-400">
                    Taxa de erro: {Math.round(area.errorRate * 100)}%
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-orange-400">
                    Prioridade: {area.priority}/10
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">🎯 Treinos Recomendados</h3>
        
        {recommendations.length === 0 ? (
          <Card className="p-8 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-500" />
            <p className="text-gray-400 mb-2">Comece a praticar para receber recomendações!</p>
            <p className="text-sm text-gray-500">
              O assistente IA aprenderá com seu progresso e sugerirá treinos personalizados
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {recommendations.slice(0, 5).map((rec, index) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-5 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10 hover:border-purple-500/50 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">
                          {rec.type === 'exercise' ? '🎯' :
                           rec.type === 'song' ? '🎵' :
                           rec.type === 'lesson' ? '📚' : '🔄'}
                        </span>
                        <div>
                          <h4 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                            {rec.title}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {rec.estimatedTime} min · {rec.difficulty === 'beginner' ? 'Iniciante' :
                                                       rec.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-300 mb-2">{rec.description}</p>
                      
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-purple-400">
                          {rec.reason}
                        </span>
                        <span className="text-gray-500">
                          Foco: {rec.targetWeakArea}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Prioridade</p>
                        <p className="text-2xl font-bold text-purple-400">{rec.priority}</p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        Iniciar
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <Card className="p-5 bg-[#1a1a2e]/60 backdrop-blur-xl border-white/10">
        <h4 className="text-lg font-bold text-white mb-3">💡 Como Funciona o Assistente IA</h4>
        <ul className="space-y-2 text-sm text-gray-300">
          <li>• <strong>Analisa seu histórico:</strong> Identifica padrões de prática e áreas de dificuldade</li>
          <li>• <strong>Recomendações personalizadas:</strong> Sugere treinos específicos para suas necessidades</li>
          <li>• <strong>Adapta-se ao seu ritmo:</strong> Ajusta dificuldade conforme seu progresso</li>
          <li>• <strong>Insights em tempo real:</strong> Fornece feedback sobre consistência e desempenho</li>
          <li>• <strong>Prioriza áreas fracas:</strong> Foca no que você mais precisa melhorar</li>
        </ul>
      </Card>
    </div>
  );
}
