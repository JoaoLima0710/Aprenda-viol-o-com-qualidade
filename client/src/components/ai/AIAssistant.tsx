import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { aiAssistantService, Recommendation, UserProfile } from '@/services/AIAssistantService';
import { advancedAIService, PredictiveAnalysis, UserSimilarity } from '@/services/AdvancedAIService';
import { AIGamificationStats } from './AIGamificationStats';
import { ConversationalTutor } from './ConversationalTutor';
import {
  Sparkles,
  TrendingUp,
  Target,
  Clock,
  ChevronRight,
  Brain,
  Lightbulb,
  MessageSquare,
  AlertTriangle,
  Users,
  Activity,
  Zap,
  Trophy
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';

export function AIAssistant() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [showConversationalTutor, setShowConversationalTutor] = useState(false);
  const [predictiveAnalysis, setPredictiveAnalysis] = useState<PredictiveAnalysis | null>(null);
  const [userSimilarity, setUserSimilarity] = useState<UserSimilarity | null>(null);
  const [isLoadingAdvanced, setIsLoadingAdvanced] = useState(false);

  useEffect(() => {
    loadData();
    loadAdvancedAnalysis();
  }, []);

  const loadData = () => {
    const userProfile = aiAssistantService.getUserProfile();
    const recs = aiAssistantService.generateRecommendations();
    const userInsights = aiAssistantService.getInsights();

    setProfile(userProfile);
    setRecommendations(recs);
    setInsights(userInsights);
  };

  const loadAdvancedAnalysis = async () => {
    if (!profile) return;

    setIsLoadingAdvanced(true);
    try {
      const history = aiAssistantService.getPracticeHistory();

      // Análise preditiva de churn
      const churnAnalysis = await advancedAIService.predictChurnRisk(
        'current_user',
        profile,
        history
      );
      setPredictiveAnalysis(churnAnalysis);

      // Análise de similaridade com outros usuários
      const similarity = await advancedAIService.findSimilarUsers(profile, history);
      setUserSimilarity(similarity);

    } catch (error) {
      console.error('Erro ao carregar análise avançada:', error);
    } finally {
      setIsLoadingAdvanced(false);
    }
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

      {/* Conversational Tutor Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Tutor Conversacional IA</h3>
                <p className="text-sm text-gray-300">Converse comigo sobre sua prática musical</p>
              </div>
            </div>
            <Button
              onClick={() => setShowConversationalTutor(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Conversar
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Advanced AI Analysis */}
      {!isLoadingAdvanced && predictiveAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                predictiveAnalysis.churnRisk > 0.7 ? 'bg-red-500' :
                predictiveAnalysis.churnRisk > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
              }`}>
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  Análise Preditiva
                  <Badge variant="outline" className={
                    predictiveAnalysis.churnRisk > 0.7 ? 'border-red-400 text-red-400' :
                    predictiveAnalysis.churnRisk > 0.4 ? 'border-yellow-400 text-yellow-400' :
                    'border-green-400 text-green-400'
                  }>
                    {Math.round(predictiveAnalysis.churnRisk * 100)}% risco
                  </Badge>
                </h3>
                <p className="text-sm text-gray-300 mb-2">
                  {predictiveAnalysis.churnRisk > 0.7 ?
                    'Alto risco de interrupção da prática' :
                    predictiveAnalysis.churnRisk > 0.4 ?
                    'Risco moderado - vamos manter o foco!' :
                    'Excelente engajamento! Continue assim!'}
                </p>
                {predictiveAnalysis.interventions.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Sugestões para manter o ritmo:</p>
                    <div className="flex flex-wrap gap-1">
                      {predictiveAnalysis.interventions.slice(0, 2).map((intervention, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {intervention}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Similar Users Insights */}
      {!isLoadingAdvanced && userSimilarity && userSimilarity.similarUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Insights de Usuários Similares</h3>
                <p className="text-sm text-gray-300 mb-2">
                  Estratégias bem-sucedidas de músicos no seu nível:
                </p>
                <div className="space-y-2">
                  {userSimilarity.recommendedStrategies.map((strategy, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span className="text-gray-300">{strategy}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

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

      {/* Adaptive Exercise Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Exercício Adaptativo IA</h3>
                <p className="text-sm text-gray-300">Treino personalizado que se adapta em tempo real</p>
              </div>
            </div>
            <Button
              onClick={() => window.location.href = '/practice'}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <Zap className="w-4 h-4 mr-2" />
              Iniciar
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Recommendations */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">🎯 Treinos Recomendados</h3>

        <Card className="p-8 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-500" />
          <p className="text-gray-400 mb-2">Sistema de Recomendações IA</p>
          <p className="text-sm text-gray-500">
            Em desenvolvimento - em breve sugestões personalizadas baseadas no seu progresso!
          </p>
        </Card>
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

      {/* AI Gamification Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-5 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Gamificação IA</h3>
              <p className="text-sm text-gray-400">Ganhe XP conversando e aprendendo com IA</p>
            </div>
          </div>
        <AIGamificationStats compact />
      </Card>
    </motion.div>

      <ConversationalTutor
        isOpen={showConversationalTutor}
        onClose={() => setShowConversationalTutor(false)}
      />
    </div>
  )
}