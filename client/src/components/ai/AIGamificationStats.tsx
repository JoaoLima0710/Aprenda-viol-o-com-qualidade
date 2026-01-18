import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { aiGamificationService, AIAchievement } from '@/services/AIGamificationService';
import {
  Trophy,
  Star,
  Flame,
  MessageSquare,
  Target,
  Zap,
  Award,
  TrendingUp,
  Crown
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AIGamificationStatsProps {
  compact?: boolean;
}

export function AIGamificationStats({ compact = false }: AIGamificationStatsProps) {
  const [stats, setStats] = useState(aiGamificationService.getEngagementStats());
  const [unlockedAchievements, setUnlockedAchievements] = useState<AIAchievement[]>([]);
  const [progressAchievements, setProgressAchievements] = useState<AIAchievement[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setStats(aiGamificationService.getEngagementStats());
    setUnlockedAchievements(aiGamificationService.getUnlockedAchievements());
    setProgressAchievements(aiGamificationService.getProgressAchievements());
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400 text-gray-400 bg-gray-500/10';
      case 'rare': return 'border-blue-400 text-blue-400 bg-blue-500/10';
      case 'epic': return 'border-purple-400 text-purple-400 bg-purple-500/10';
      case 'legendary': return 'border-yellow-400 text-yellow-400 bg-yellow-500/10';
      default: return 'border-gray-400 text-gray-400 bg-gray-500/10';
    }
  };

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">Nível {stats.level}</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.totalXP} XP
                  </Badge>
                </div>
                <div className="text-xs text-gray-400">
                  {stats.xpToNextLevel} XP para o próximo nível
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Trophy className="w-3 h-3 mr-1" />
                {unlockedAchievements.length}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Flame className="w-3 h-3 mr-1" />
                {stats.currentStreaks.conversation}
              </Badge>
            </div>
          </div>
          <Progress
            value={(stats.totalXP / (stats.totalXP + stats.xpToNextLevel)) * 100}
            className="mt-3 h-2"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <CardContent className="p-4 text-center">
            <Crown className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.level}</div>
            <div className="text-xs text-gray-400">Nível IA</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <Zap className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.totalXP}</div>
            <div className="text-xs text-gray-400">Total XP</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.weeklyConversations}</div>
            <div className="text-xs text-gray-400">Conversas (semana)</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
          <CardContent className="p-4 text-center">
            <Flame className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.currentStreaks.conversation}</div>
            <div className="text-xs text-gray-400">Streak Conversas</div>
          </CardContent>
        </Card>
      </div>

      {/* XP Progress */}
      <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Progresso de Nível
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Nível {stats.level}</span>
              <span className="text-sm text-gray-400">Nível {stats.level + 1}</span>
            </div>
            <Progress
              value={(stats.totalXP / (stats.totalXP + stats.xpToNextLevel)) * 100}
              className="h-3"
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{stats.totalXP} XP</span>
              <span>{stats.xpToNextLevel} XP restantes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Conquistas Desbloqueadas ({unlockedAchievements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {unlockedAchievements.slice(0, 6).map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border ${getRarityColor(achievement.rarity)}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-white text-sm">{achievement.title}</div>
                      <div className="text-xs text-gray-400">{achievement.description}</div>
                      {achievement.unlockedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Desbloqueado em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Achievements */}
      {progressAchievements.length > 0 && (
        <Card className="bg-gradient-to-br from-gray-500/10 to-slate-500/10 border-gray-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5" />
              Conquistas em Progresso ({progressAchievements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {progressAchievements.slice(0, 3).map((achievement) => (
                <div key={achievement.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{achievement.icon}</span>
                      <span className="font-semibold text-white text-sm">{achievement.title}</span>
                      <Badge variant="outline" className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                        {achievement.rarity}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-400">
                      {Math.round(achievement.progress * 100)}%
                    </span>
                  </div>
                  <Progress value={achievement.progress * 100} className="h-2" />
                  <div className="text-xs text-gray-500">{achievement.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Stats */}
      <Card className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border-teal-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="w-5 h-5" />
            Estatísticas Semanais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.weeklyConversations}</div>
              <div className="text-xs text-gray-400">Conversas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.weeklyExercises}</div>
              <div className="text-xs text-gray-400">Exercícios</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
