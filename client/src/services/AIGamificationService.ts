/**
 * AI Gamification Service - 2026 Edition
 * Sistema de gamificação inteligente baseado em IA
 */

import { SentimentAnalysis } from './LLMIntegrationService';

export interface AIInteraction {
  id: string;
  timestamp: number;
  type: 'conversation' | 'exercise_completion' | 'milestone' | 'streak';
  sentiment?: SentimentAnalysis;
  engagement: number; // 0-1
  value: number; // pontos de contribuição
  context: {
    topic?: string;
    mood?: string;
    difficulty?: number;
    success?: boolean;
  };
}

export interface AIAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: number;
  progress: number; // 0-1
  requirements: {
    type: string;
    target: number;
    current: number;
  }[];
}

export interface AIStreak {
  type: 'conversation' | 'practice' | 'learning';
  current: number;
  longest: number;
  lastActivity: number;
  multiplier: number; // bônus baseado na streak
}

export interface AIGamificationState {
  totalXP: number;
  level: number;
  xpToNextLevel: number;
  achievements: AIAchievement[];
  streaks: Record<string, AIStreak>;
  interactionHistory: AIInteraction[];
  weeklyStats: {
    conversations: number;
    exercisesCompleted: number;
    positiveInteractions: number;
    averageSentiment: number;
  };
}

class AIGamificationService {
  private readonly STORAGE_KEY = 'musictutor_ai_gamification';
  private readonly ACHIEVEMENTS_KEY = 'musictutor_ai_achievements';

  /**
   * Registra uma interação com IA
   */
  recordInteraction(interaction: Omit<AIInteraction, 'id' | 'timestamp'>): void {
    const fullInteraction: AIInteraction = {
      ...interaction,
      id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    const state = this.getGamificationState();
    state.interactionHistory.push(fullInteraction);

    // Limitar histórico a últimas 1000 interações
    if (state.interactionHistory.length > 1000) {
      state.interactionHistory = state.interactionHistory.slice(-1000);
    }

    // Atualizar estatísticas
    this.updateStats(state, fullInteraction);

    // Verificar conquistas
    this.checkAchievements(state);

    // Calcular e aplicar XP
    const xpGained = this.calculateXP(fullInteraction);
    this.addXP(state, xpGained);

    this.saveGamificationState(state);
  }

  /**
   * Calcula XP baseado na interação
   */
  private calculateXP(interaction: AIInteraction): number {
    let baseXP = 10;

    // Bônus por engajamento
    baseXP *= (0.5 + interaction.engagement * 0.5);

    // Bônus por sentimento positivo
    if (interaction.sentiment) {
      if (interaction.sentiment.sentiment === 'positive') baseXP *= 1.5;
      if (interaction.sentiment.sentiment === 'motivated') baseXP *= 1.3;
      if (interaction.sentiment.sentiment === 'frustrated') baseXP *= 0.8;
    }

    // Bônus por tipo de interação
    const typeMultipliers = {
      conversation: 1.0,
      exercise_completion: 2.0,
      milestone: 3.0,
      streak: 1.5
    };

    baseXP *= typeMultipliers[interaction.type] || 1.0;

    // Bônus por contexto
    if (interaction.context.success) baseXP *= 1.2;
    if (interaction.context.difficulty) baseXP *= (1 + interaction.context.difficulty * 0.5);

    return Math.round(baseXP);
  }

  /**
   * Adiciona XP e verifica level up
   */
  private addXP(state: AIGamificationState, xp: number): void {
    state.totalXP += xp;

    // Calcular novo nível (progressão exponencial)
    const newLevel = Math.floor(Math.sqrt(state.totalXP / 100)) + 1;

    if (newLevel > state.level) {
      // Level up!
      const previousXP = ((state.level - 1) ** 2) * 100;
      state.xpToNextLevel = (newLevel ** 2 * 100) - state.totalXP;
      state.level = newLevel;

      // Registrar milestone
      this.recordInteraction({
        type: 'milestone',
        engagement: 1.0,
        value: newLevel,
        context: { topic: 'level_up', success: true }
      });
    } else {
      state.xpToNextLevel = (state.level ** 2 * 100) - state.totalXP;
    }
  }

  /**
   * Atualiza estatísticas semanais
   */
  private updateStats(state: AIGamificationState, interaction: AIInteraction): void {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    // Filtrar interações da semana atual
    const weekInteractions = state.interactionHistory.filter(
      i => i.timestamp >= weekStart.getTime()
    );

    state.weeklyStats = {
      conversations: weekInteractions.filter(i => i.type === 'conversation').length,
      exercisesCompleted: weekInteractions.filter(i => i.type === 'exercise_completion').length,
      positiveInteractions: weekInteractions.filter(i =>
        i.sentiment?.sentiment === 'positive' || i.sentiment?.sentiment === 'motivated'
      ).length,
      averageSentiment: weekInteractions
        .filter(i => i.sentiment)
        .reduce((sum, i) => sum + (i.sentiment?.confidence || 0), 0) /
        Math.max(1, weekInteractions.filter(i => i.sentiment).length)
    };
  }

  /**
   * Verifica e desbloqueia conquistas
   */
  private checkAchievements(state: AIGamificationState): void {
    const achievements = this.getAllAchievements();

    achievements.forEach(achievement => {
      if (achievement.unlockedAt) return; // Já desbloqueada

      const isUnlocked = achievement.requirements.every(req => {
        switch (req.type) {
          case 'conversations':
            return state.weeklyStats.conversations >= req.target;
          case 'exercises_completed':
            return state.weeklyStats.exercisesCompleted >= req.target;
          case 'positive_interactions':
            return state.weeklyStats.positiveInteractions >= req.target;
          case 'total_xp':
            return state.totalXP >= req.target;
          case 'level':
            return state.level >= req.target;
          case 'streak_conversation':
            return (state.streaks.conversation?.current || 0) >= req.target;
          default:
            return false;
        }
      });

      if (isUnlocked && !achievement.unlockedAt) {
        achievement.unlockedAt = Date.now();
        achievement.progress = 1.0;
      } else {
        // Calcular progresso
        achievement.progress = Math.min(1.0, achievement.requirements.reduce((sum, req) => {
          let current = req.current;
          switch (req.type) {
            case 'conversations':
              current = state.weeklyStats.conversations;
              break;
            case 'exercises_completed':
              current = state.weeklyStats.exercisesCompleted;
              break;
            case 'positive_interactions':
              current = state.weeklyStats.positiveInteractions;
              break;
            case 'total_xp':
              current = state.totalXP;
              break;
            case 'level':
              current = state.level;
              break;
          }
          return sum + Math.min(1, current / req.target);
        }, 0) / achievement.requirements.length);
      }
    });

    this.saveAchievements(achievements);
  }

  /**
   * Obtém todas as conquistas disponíveis
   */
  getAllAchievements(): AIAchievement[] {
    const saved = localStorage.getItem(this.ACHIEVEMENTS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }

    // Conquistas padrão
    const achievements: AIAchievement[] = [
      {
        id: 'first_conversation',
        title: 'Primeira Conversa',
        description: 'Iniciou sua primeira conversa com o Tutor IA',
        icon: '💬',
        rarity: 'common',
        progress: 0,
        requirements: [{ type: 'conversations', target: 1, current: 0 }]
      },
      {
        id: 'chatty',
        title: 'Conversa Fiada',
        description: 'Teve 10 conversas com o Tutor IA em uma semana',
        icon: '🗣️',
        rarity: 'common',
        progress: 0,
        requirements: [{ type: 'conversations', target: 10, current: 0 }]
      },
      {
        id: 'motivation_master',
        title: 'Mestre da Motivação',
        description: 'Teve 15 interações positivas em uma semana',
        icon: '🚀',
        rarity: 'rare',
        progress: 0,
        requirements: [{ type: 'positive_interactions', target: 15, current: 0 }]
      },
      {
        id: 'exercise_champion',
        title: 'Campeão de Exercícios',
        description: 'Completou 20 exercícios gerados por IA',
        icon: '🏆',
        rarity: 'rare',
        progress: 0,
        requirements: [{ type: 'exercises_completed', target: 20, current: 0 }]
      },
      {
        id: 'conversation_streak',
        title: 'Fala Sem Parar',
        description: 'Mantém uma streak de 7 dias conversando com IA',
        icon: '🔥',
        rarity: 'epic',
        progress: 0,
        requirements: [{ type: 'streak_conversation', target: 7, current: 0 }]
      },
      {
        id: 'ai_master',
        title: 'Mestre da IA',
        description: 'Alcançou nível 10 no sistema de gamificação IA',
        icon: '🤖',
        rarity: 'legendary',
        progress: 0,
        requirements: [{ type: 'level', target: 10, current: 0 }]
      }
    ];

    return achievements;
  }

  /**
   * Obtém estado atual da gamificação
   */
  getGamificationState(): AIGamificationState {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }

    // Estado inicial
    return {
      totalXP: 0,
      level: 1,
      xpToNextLevel: 100,
      achievements: [],
      streaks: {
        conversation: { type: 'conversation', current: 0, longest: 0, lastActivity: 0, multiplier: 1 },
        practice: { type: 'practice', current: 0, longest: 0, lastActivity: 0, multiplier: 1 },
        learning: { type: 'learning', current: 0, longest: 0, lastActivity: 0, multiplier: 1 }
      },
      interactionHistory: [],
      weeklyStats: {
        conversations: 0,
        exercisesCompleted: 0,
        positiveInteractions: 0,
        averageSentiment: 0
      }
    };
  }

  /**
   * Salva estado da gamificação
   */
  private saveGamificationState(state: AIGamificationState): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
  }

  /**
   * Salva conquistas
   */
  private saveAchievements(achievements: AIAchievement[]): void {
    localStorage.setItem(this.ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  }

  /**
   * Obtém conquistas desbloqueadas
   */
  getUnlockedAchievements(): AIAchievement[] {
    return this.getAllAchievements().filter(a => a.unlockedAt);
  }

  /**
   * Obtém conquistas em progresso
   */
  getProgressAchievements(): AIAchievement[] {
    return this.getAllAchievements()
      .filter(a => !a.unlockedAt && a.progress > 0)
      .sort((a, b) => b.progress - a.progress);
  }

  /**
   * Calcula bônus baseado em streaks
   */
  getStreakBonus(type: keyof AIGamificationState['streaks']): number {
    const state = this.getGamificationState();
    const streak = state.streaks[type];

    if (!streak) return 1;

    // Bônus cresce com streak (máximo 2x)
    return Math.min(2.0, 1 + (streak.current * 0.1));
  }

  /**
   * Atualiza streak
   */
  updateStreak(type: keyof AIGamificationState['streaks'], activity: boolean): void {
    const state = this.getGamificationState();
    const streak = state.streaks[type];
    const now = Date.now();

    if (activity) {
      // Verificar se é continuação da streak (atividade no mesmo dia)
      const lastActivityDate = new Date(streak.lastActivity).toDateString();
      const todayDate = new Date(now).toDateString();

      if (lastActivityDate === todayDate) {
        // Já contou hoje, não incrementa
        return;
      }

      // Verificar se é o próximo dia
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toDateString();

      if (lastActivityDate === yesterdayDate || streak.lastActivity === 0) {
        // Continuar streak
        streak.current++;
        streak.longest = Math.max(streak.longest, streak.current);
      } else {
        // Reset streak
        streak.current = 1;
      }

      streak.lastActivity = now;
      streak.multiplier = Math.min(2.0, 1 + (streak.current * 0.05));
    } else {
      // Sem atividade hoje, verificar se deve resetar
      const lastActivityDate = new Date(streak.lastActivity).toDateString();
      const todayDate = new Date(now).toDateString();

      if (lastActivityDate !== todayDate) {
        // Não teve atividade hoje, reset
        streak.current = 0;
        streak.multiplier = 1;
      }
    }

    this.saveGamificationState(state);
  }

  /**
   * Obtém estatísticas de engajamento
   */
  getEngagementStats(): {
    level: number;
    totalXP: number;
    xpToNextLevel: number;
    weeklyConversations: number;
    weeklyExercises: number;
    currentStreaks: Record<string, number>;
    unlockedAchievements: number;
    progressAchievements: number;
  } {
    const state = this.getGamificationState();
    const achievements = this.getAllAchievements();

    return {
      level: state.level,
      totalXP: state.totalXP,
      xpToNextLevel: state.xpToNextLevel,
      weeklyConversations: state.weeklyStats.conversations,
      weeklyExercises: state.weeklyStats.exercisesCompleted,
      currentStreaks: Object.fromEntries(
        Object.entries(state.streaks).map(([key, streak]) => [key, streak.current])
      ),
      unlockedAchievements: achievements.filter(a => a.unlockedAt).length,
      progressAchievements: achievements.filter(a => !a.unlockedAt && a.progress > 0).length
    };
  }
}

export const aiGamificationService = new AIGamificationService();
