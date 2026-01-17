/**
 * AI Assistant Service
 * Analisa histórico de prática e fornece recomendações personalizadas
 */

export interface PracticeSession {
  id: string;
  timestamp: number;
  type: 'chord' | 'scale' | 'song' | 'ear_training';
  itemId: string;
  itemName: string;
  duration: number; // segundos
  accuracy: number; // 0-100
  errors: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface WeakArea {
  category: string;
  items: string[];
  errorRate: number;
  lastPracticed: number;
  priority: number; // 1-10
}

export interface Recommendation {
  id: string;
  type: 'exercise' | 'song' | 'lesson' | 'review';
  title: string;
  description: string;
  reason: string;
  priority: number;
  estimatedTime: number; // minutos
  targetWeakArea: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface UserProfile {
  level: number;
  totalPracticeTime: number;
  averageAccuracy: number;
  strongAreas: string[];
  weakAreas: WeakArea[];
  learningPace: 'slow' | 'medium' | 'fast';
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
}

class AIAssistantService {
  private readonly STORAGE_KEY = 'musictutor_practice_history';
  private readonly PROFILE_KEY = 'musictutor_user_profile';

  /**
   * Salva sessão de prática
   */
  savePracticeSession(session: PracticeSession): void {
    const history = this.getPracticeHistory();
    history.push(session);
    
    // Manter apenas últimas 100 sessões
    if (history.length > 100) {
      history.shift();
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    
    // Atualizar perfil do usuário
    this.updateUserProfile();
  }

  /**
   * Obtém histórico de prática
   */
  getPracticeHistory(): PracticeSession[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Analisa áreas fracas do usuário
   */
  analyzeWeakAreas(): WeakArea[] {
    const history = this.getPracticeHistory();
    
    if (history.length < 5) {
      return [];
    }

    // Agrupar por categoria
    const categoryStats = new Map<string, {
      total: number;
      errors: number;
      lastPracticed: number;
      items: Set<string>;
    }>();

    history.forEach(session => {
      const category = session.type;
      const stats = categoryStats.get(category) || {
        total: 0,
        errors: 0,
        lastPracticed: 0,
        items: new Set(),
      };

      stats.total++;
      stats.errors += (100 - session.accuracy) / 100;
      stats.lastPracticed = Math.max(stats.lastPracticed, session.timestamp);
      stats.items.add(session.itemName);

      categoryStats.set(category, stats);
    });

    // Calcular áreas fracas
    const weakAreas: WeakArea[] = [];
    
    categoryStats.forEach((stats, category) => {
      const errorRate = stats.errors / stats.total;
      const daysSinceLastPractice = (Date.now() - stats.lastPracticed) / (1000 * 60 * 60 * 24);
      
      // Considerar área fraca se:
      // 1. Taxa de erro > 30%
      // 2. Não praticou nos últimos 7 dias
      if (errorRate > 0.3 || daysSinceLastPractice > 7) {
        const priority = Math.min(10, Math.round(errorRate * 10 + daysSinceLastPractice / 7));
        
        weakAreas.push({
          category: this.getCategoryName(category),
          items: Array.from(stats.items),
          errorRate,
          lastPracticed: stats.lastPracticed,
          priority,
        });
      }
    });

    // Ordenar por prioridade
    return weakAreas.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Gera recomendações personalizadas
   */
  generateRecommendations(): Recommendation[] {
    const profile = this.getUserProfile();
    const weakAreas = this.analyzeWeakAreas();
    const history = this.getPracticeHistory();
    const recommendations: Recommendation[] = [];

    // 1. Recomendações baseadas em áreas fracas
    weakAreas.slice(0, 3).forEach((weakArea, index) => {
      recommendations.push({
        id: `weak_area_${index}`,
        type: 'exercise',
        title: `Fortalecer ${weakArea.category}`,
        description: `Pratique exercícios focados em ${weakArea.category} para melhorar sua precisão`,
        reason: `Você teve ${Math.round(weakArea.errorRate * 100)}% de erros nesta área`,
        priority: weakArea.priority,
        estimatedTime: 15,
        targetWeakArea: weakArea.category,
        difficulty: profile.preferredDifficulty,
      });
    });

    // 2. Recomendação de revisão (se não praticou recentemente)
    const daysSinceLastPractice = history.length > 0
      ? (Date.now() - history[history.length - 1].timestamp) / (1000 * 60 * 60 * 24)
      : 999;

    if (daysSinceLastPractice > 2) {
      recommendations.push({
        id: 'review_practice',
        type: 'review',
        title: 'Revisar Conteúdo Anterior',
        description: 'Revise o que você praticou anteriormente para consolidar o aprendizado',
        reason: `Você não pratica há ${Math.round(daysSinceLastPractice)} dias`,
        priority: Math.min(10, Math.round(daysSinceLastPractice)),
        estimatedTime: 20,
        targetWeakArea: 'Revisão Geral',
        difficulty: profile.preferredDifficulty,
      });
    }

    // 3. Recomendação de progressão (se está indo bem)
    if (profile.averageAccuracy > 80 && history.length > 10) {
      const nextDifficulty = profile.preferredDifficulty === 'beginner' ? 'intermediate' :
                             profile.preferredDifficulty === 'intermediate' ? 'advanced' : 'advanced';
      
      if (nextDifficulty !== profile.preferredDifficulty) {
        recommendations.push({
          id: 'level_up',
          type: 'lesson',
          title: 'Avançar para Próximo Nível',
          description: `Você está pronto para desafios de nível ${this.getDifficultyName(nextDifficulty)}`,
          reason: `Sua precisão média é de ${Math.round(profile.averageAccuracy)}%`,
          priority: 7,
          estimatedTime: 30,
          targetWeakArea: 'Progressão',
          difficulty: nextDifficulty,
        });
      }
    }

    // 4. Recomendação de variedade (se está focando muito em uma área)
    const recentSessions = history.slice(-10);
    const typeCount = new Map<string, number>();
    recentSessions.forEach(session => {
      typeCount.set(session.type, (typeCount.get(session.type) || 0) + 1);
    });

    const mostPracticedType = Array.from(typeCount.entries())
      .sort((a, b) => b[1] - a[1])[0];

    if (mostPracticedType && mostPracticedType[1] > 7) {
      const otherTypes = ['chord', 'scale', 'song', 'ear_training']
        .filter(t => t !== mostPracticedType[0]);
      const suggestedType = otherTypes[Math.floor(Math.random() * otherTypes.length)];

      recommendations.push({
        id: 'variety',
        type: 'exercise',
        title: `Praticar ${this.getCategoryName(suggestedType)}`,
        description: 'Varie seus treinos para um desenvolvimento mais equilibrado',
        reason: `Você tem focado muito em ${this.getCategoryName(mostPracticedType[0])}`,
        priority: 5,
        estimatedTime: 15,
        targetWeakArea: this.getCategoryName(suggestedType),
        difficulty: profile.preferredDifficulty,
      });
    }

    // 5. Recomendação de treino de ouvido (sempre importante)
    const earTrainingSessions = history.filter(s => s.type === 'ear_training');
    if (earTrainingSessions.length < history.length * 0.2) {
      recommendations.push({
        id: 'ear_training',
        type: 'exercise',
        title: 'Treino de Ouvido',
        description: 'Desenvolva seu ouvido musical com exercícios de intervalos e acordes',
        reason: 'Treino de ouvido é fundamental para qualquer músico',
        priority: 6,
        estimatedTime: 10,
        targetWeakArea: 'Percepção Musical',
        difficulty: profile.preferredDifficulty,
      });
    }

    // Ordenar por prioridade
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Atualiza perfil do usuário
   */
  private updateUserProfile(): void {
    const history = this.getPracticeHistory();
    
    if (history.length === 0) {
      return;
    }

    // Calcular estatísticas
    const totalPracticeTime = history.reduce((sum, s) => sum + s.duration, 0);
    const averageAccuracy = history.reduce((sum, s) => sum + s.accuracy, 0) / history.length;
    
    // Determinar ritmo de aprendizado
    const recentSessions = history.slice(-10);
    const recentAccuracy = recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length;
    const improvementRate = recentAccuracy - averageAccuracy;
    
    const learningPace: 'slow' | 'medium' | 'fast' = 
      improvementRate > 5 ? 'fast' :
      improvementRate > 0 ? 'medium' : 'slow';

    // Determinar dificuldade preferida
    const difficultyCount = new Map<string, number>();
    history.forEach(s => {
      difficultyCount.set(s.difficulty, (difficultyCount.get(s.difficulty) || 0) + 1);
    });
    
    const preferredDifficulty = Array.from(difficultyCount.entries())
      .sort((a, b) => b[1] - a[1])[0][0] as 'beginner' | 'intermediate' | 'advanced';

    // Identificar áreas fortes
    const categoryAccuracy = new Map<string, number[]>();
    history.forEach(s => {
      const accuracies = categoryAccuracy.get(s.type) || [];
      accuracies.push(s.accuracy);
      categoryAccuracy.set(s.type, accuracies);
    });

    const strongAreas: string[] = [];
    categoryAccuracy.forEach((accuracies, category) => {
      const avg = accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length;
      if (avg > 80) {
        strongAreas.push(this.getCategoryName(category));
      }
    });

    const profile: UserProfile = {
      level: Math.floor(totalPracticeTime / 3600) + 1, // 1 nível por hora
      totalPracticeTime,
      averageAccuracy,
      strongAreas,
      weakAreas: this.analyzeWeakAreas(),
      learningPace,
      preferredDifficulty,
    };

    localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
  }

  /**
   * Obtém perfil do usuário
   */
  getUserProfile(): UserProfile {
    const data = localStorage.getItem(this.PROFILE_KEY);
    
    if (data) {
      return JSON.parse(data);
    }

    // Perfil padrão
    return {
      level: 1,
      totalPracticeTime: 0,
      averageAccuracy: 0,
      strongAreas: [],
      weakAreas: [],
      learningPace: 'medium',
      preferredDifficulty: 'beginner',
    };
  }

  /**
   * Obtém insights personalizados
   */
  getInsights(): string[] {
    const profile = this.getUserProfile();
    const history = this.getPracticeHistory();
    const insights: string[] = [];

    // Insight sobre consistência
    if (history.length > 0) {
      const daysSinceLastPractice = (Date.now() - history[history.length - 1].timestamp) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastPractice < 1) {
        insights.push('🔥 Ótimo! Você está mantendo uma prática consistente!');
      } else if (daysSinceLastPractice > 3) {
        insights.push('⏰ Tente praticar com mais frequência para melhores resultados');
      }
    }

    // Insight sobre precisão
    if (profile.averageAccuracy > 85) {
      insights.push('🎯 Sua precisão está excelente! Considere aumentar a dificuldade');
    } else if (profile.averageAccuracy < 60) {
      insights.push('💪 Continue praticando! A consistência traz melhoria');
    }

    // Insight sobre áreas fortes
    if (profile.strongAreas.length > 0) {
      insights.push(`✨ Você está se destacando em: ${profile.strongAreas.join(', ')}`);
    }

    // Insight sobre ritmo de aprendizado
    if (profile.learningPace === 'fast') {
      insights.push('🚀 Você está progredindo rapidamente! Continue assim!');
    }

    // Insight sobre tempo de prática
    const hoursToday = history
      .filter(s => Date.now() - s.timestamp < 24 * 60 * 60 * 1000)
      .reduce((sum, s) => sum + s.duration, 0) / 3600;

    if (hoursToday > 1) {
      insights.push(`⏱️ Você já praticou ${hoursToday.toFixed(1)}h hoje!`);
    }

    return insights;
  }

  /**
   * Helpers
   */
  private getCategoryName(type: string): string {
    const names: Record<string, string> = {
      'chord': 'Acordes',
      'scale': 'Escalas',
      'song': 'Músicas',
      'ear_training': 'Treino de Ouvido',
    };
    return names[type] || type;
  }

  private getDifficultyName(difficulty: string): string {
    const names: Record<string, string> = {
      'beginner': 'Iniciante',
      'intermediate': 'Intermediário',
      'advanced': 'Avançado',
    };
    return names[difficulty] || difficulty;
  }

  /**
   * Limpa histórico (para testes)
   */
  clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.PROFILE_KEY);
  }
}

export const aiAssistantService = new AIAssistantService();
