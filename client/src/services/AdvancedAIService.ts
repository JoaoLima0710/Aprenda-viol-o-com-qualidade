import { PracticeSession, WeakArea, Recommendation, UserProfile } from './AIAssistantService';

/**
 * Advanced AI Service - 2026 Edition
 * Integração com LLMs para tutoria conversacional e análise preditiva
 */

// Tipos para o sistema de IA avançado
export interface ConversationContext {
  userMessage: string;
  userProfile: UserProfile;
  recentSessions: PracticeSession[];
  currentMood?: 'frustrated' | 'motivated' | 'confused' | 'confident' | 'neutral';
  context: string[]; // histórico de conversação
}

export interface LLMResponse {
  response: string;
  recommendations: Recommendation[];
  actions: string[]; // ações específicas sugeridas
  confidence: number; // 0-1, confiança da resposta
  nextSteps: string[];
}

export interface PredictiveAnalysis {
  churnRisk: number; // 0-1, probabilidade de desistência
  reasons: string[];
  interventions: string[];
  timeToAction: number; // dias
}

export interface UserSimilarity {
  similarUsers: Array<{
    similarity: number; // 0-1
    profile: Partial<UserProfile>;
    successfulStrategies: string[];
    commonChallenges: string[];
  }>;
  recommendedStrategies: string[];
}

export interface AdaptiveExercise {
  id: string;
  type: 'chord_progression' | 'rhythm_pattern' | 'ear_training' | 'technique_drill';
  difficulty: number; // 0-1
  content: any; // estrutura específica por tipo
  expectedAccuracy: number;
  timeLimit: number; // segundos
  hints: string[];
  adaptiveParams: {
    minAccuracy: number;
    maxAccuracy: number;
    adjustmentFactor: number;
  };
}

class AdvancedAIService {
  private readonly API_ENDPOINT = 'https://api.openai.com/v1/chat/completions'; // Simulado
  private readonly MODEL = 'gpt-4-turbo'; // Modelo para 2026

  /**
   * Tutoria Conversacional com LLMs
   */
  async getConversationalResponse(context: ConversationContext): Promise<LLMResponse> {
    // Simulação de chamada para LLM (em produção usaria API real)
    const prompt = this.buildConversationPrompt(context);

    // Simular resposta baseada em lógica avançada
    const simulatedResponse = await this.simulateLLMResponse(prompt, context);

    return {
      response: simulatedResponse.message,
      recommendations: simulatedResponse.recommendations,
      actions: simulatedResponse.actions,
      confidence: simulatedResponse.confidence,
      nextSteps: simulatedResponse.nextSteps
    };
  }

  /**
   * Análise Preditiva de Desistência
   */
  async predictChurnRisk(userId: string, profile: UserProfile, history: PracticeSession[]): Promise<PredictiveAnalysis> {
    // Fatores que indicam risco de desistência
    const riskFactors = this.analyzeChurnFactors(profile, history);
    const churnRisk = this.calculateChurnProbability(riskFactors);

    const reasons = this.identifyChurnReasons(riskFactors);
    const interventions = this.suggestInterventions(riskFactors, profile);
    const timeToAction = this.calculateTimeToAction(churnRisk, riskFactors);

    return {
      churnRisk,
      reasons,
      interventions,
      timeToAction
    };
  }

  /**
   * Sistema de Recomendações Baseado em Usuários Similares
   */
  async findSimilarUsers(profile: UserProfile, history: PracticeSession[]): Promise<UserSimilarity> {
    // Em produção, isso seria uma consulta a banco de dados de usuários similares
    // Para simulação, usamos dados mockados baseados em padrões comuns
    const similarUsers = this.simulateSimilarUsers(profile, history);

    const recommendedStrategies = this.extractStrategiesFromSimilarUsers(similarUsers);

    return {
      similarUsers,
      recommendedStrategies
    };
  }

  /**
   * Geração Dinâmica de Exercícios Adaptativos
   */
  async generateAdaptiveExercise(
    profile: UserProfile,
    weakAreas: WeakArea[],
    recentPerformance: PracticeSession[]
  ): Promise<AdaptiveExercise> {
    // Analisar performance recente para ajustar dificuldade
    const performanceTrend = this.analyzePerformanceTrend(recentPerformance);
    const optimalDifficulty = this.calculateOptimalDifficulty(profile, performanceTrend);

    // Escolher tipo de exercício baseado em áreas fracas
    const exerciseType = this.selectExerciseType(weakAreas, profile);

    // Gerar conteúdo adaptativo
    const exercise = await this.createAdaptiveContent(exerciseType, optimalDifficulty, weakAreas);

    return exercise;
  }

  /**
   * Avaliação Contínua de Progresso e Ajustes Automáticos
   */
  async evaluateProgress(
    profile: UserProfile,
    recentSessions: PracticeSession[],
    weakAreas: WeakArea[]
  ): Promise<{
    progressScore: number; // 0-1
    areasOfImprovement: string[];
    recommendedAdjustments: string[];
    nextMilestone: string;
    motivationalMessage: string;
  }> {
    const progressScore = this.calculateProgressScore(profile, recentSessions);
    const areasOfImprovement = this.identifyImprovementAreas(weakAreas, recentSessions);
    const recommendedAdjustments = this.suggestAdjustments(profile, progressScore);
    const nextMilestone = this.predictNextMilestone(profile, progressScore);
    const motivationalMessage = this.generateMotivationalMessage(progressScore, profile);

    return {
      progressScore,
      areasOfImprovement,
      recommendedAdjustments,
      nextMilestone,
      motivationalMessage
    };
  }

  // ========== MÉTODOS PRIVADOS DE SUPORTE ==========

  private buildConversationPrompt(context: ConversationContext): string {
    const { userMessage, userProfile, recentSessions, currentMood, context: conversationHistory } = context;

    return `
Você é um tutor de música inteligente e empático para ${userProfile.level === 1 ? 'iniciantes' : userProfile.level < 5 ? 'intermediários' : 'avançados'}.

CONTEXTO DO USUÁRIO:
- Nível: ${userProfile.level}
- Tempo total de prática: ${Math.round(userProfile.totalPracticeTime / 3600)}h
- Precisão média: ${Math.round(userProfile.averageAccuracy)}%
- Ritmo de aprendizado: ${userProfile.learningPace}
- Áreas fortes: ${userProfile.strongAreas.join(', ') || 'nenhuma identificada'}
- Humor atual: ${currentMood || 'neutro'}

SESSÕES RECENTES:
${recentSessions.slice(-3).map(s =>
  `- ${s.type}: ${s.itemName} (${s.accuracy}% precisão, ${Math.round(s.duration/60)}min)`
).join('\n')}

HISTÓRICO DA CONVERSA:
${conversationHistory.slice(-2).join('\n')}

PERGUNTA DO USUÁRIO: "${userMessage}"

INSTRUÇÕES:
1. Seja empático e motivacional
2. Forneça resposta clara e acionável
3. Sugira exercícios específicos quando apropriado
4. Considere o nível e preferências do usuário
5. Incentive prática consistente

RESPONDA DE FORMA NATURAL E ÚTIL:
`;
  }

  private async simulateLLMResponse(prompt: string, context: ConversationContext): Promise<any> {
    // Simulação de resposta LLM baseada em análise do contexto
    const { userProfile, recentSessions, currentMood } = context;

    let response = '';
    let recommendations: Recommendation[] = [];
    let actions: string[] = [];
    let nextSteps: string[] = [];

    // Análise da mensagem do usuário para determinar tipo de resposta
    const message = prompt.toLowerCase();

    if (message.includes('dificuldade') || message.includes('difícil') || message.includes('não consigo')) {
      response = this.generateEncouragementResponse(userProfile, recentSessions);
      recommendations = this.generateDifficultyBasedRecommendations(userProfile);
      actions = ['Praticar exercícios mais fáceis', 'Assistir tutoriais básicos', 'Focar em qualidade sobre quantidade'];
      nextSteps = ['Começar com sequências curtas', 'Aumentar gradualmente a dificuldade', 'Pedir ajuda quando necessário'];

    } else if (message.includes('progresso') || message.includes('melhorando') || message.includes('avançando')) {
      response = this.generateProgressResponse(userProfile, recentSessions);
      recommendations = this.generateProgressionRecommendations(userProfile);
      actions = ['Continuar prática consistente', 'Explorar novas técnicas', 'Compartilhar conquistas'];
      nextSteps = ['Definir próximos objetivos', 'Experimentar gêneros diferentes', 'Ensinar para outros'];

    } else if (message.includes('motivação') || message.includes('desanimado') || message.includes('cansado')) {
      response = this.generateMotivationResponse(currentMood || 'neutral', userProfile);
      recommendations = this.generateMotivationalRecommendations(userProfile);
      actions = ['Definir metas pequenas diárias', 'Praticar em horários fixos', 'Comemorar pequenas vitórias'];
      nextSteps = ['Criar rotina de prática', 'Encontrar parceiro de prática', 'Lembrar do motivo inicial'];

    } else {
      // Resposta genérica baseada no perfil
      response = this.generateGeneralResponse(userProfile, recentSessions);
      recommendations = this.generateGeneralRecommendations(userProfile);
      actions = ['Manter consistência na prática', 'Variar tipos de exercício', 'Acompanhar progresso'];
      nextSteps = ['Revisar metas semanais', 'Explorar novas músicas', 'Compartilhar aprendizado'];
    }

    return {
      message: response,
      recommendations,
      actions,
      confidence: 0.85,
      nextSteps
    };
  }

  private analyzeChurnFactors(profile: UserProfile, history: PracticeSession[]): any {
    const factors = {
      lowPracticeFrequency: 0,
      decliningAccuracy: 0,
      highErrorRate: 0,
      longTimeSinceLastPractice: 0,
      lowEngagement: 0,
      plateau: 0
    };

    // Análise de frequência
    const recentSessions = history.slice(-14); // últimas 2 semanas
    const practiceDays = new Set(recentSessions.map(s =>
      new Date(s.timestamp).toDateString()
    )).size;

    factors.lowPracticeFrequency = practiceDays < 3 ? 0.8 : practiceDays < 5 ? 0.4 : 0;

    // Análise de tendência de precisão
    if (history.length >= 10) {
      const firstHalf = history.slice(0, Math.floor(history.length / 2));
      const secondHalf = history.slice(Math.floor(history.length / 2));

      const firstAvg = firstHalf.reduce((sum, s) => sum + s.accuracy, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, s) => sum + s.accuracy, 0) / secondHalf.length;

      factors.decliningAccuracy = secondAvg < firstAvg - 5 ? 0.6 : 0;
    }

    // Tempo desde última prática
    const lastSession = history[history.length - 1];
    const daysSinceLastPractice = lastSession ?
      (Date.now() - lastSession.timestamp) / (1000 * 60 * 60 * 24) : 999;

    factors.longTimeSinceLastPractice = daysSinceLastPractice > 7 ? 0.7 : daysSinceLastPractice > 3 ? 0.4 : 0;

    return factors;
  }

  private calculateChurnProbability(factors: any): number {
    const weights = {
      lowPracticeFrequency: 0.3,
      decliningAccuracy: 0.25,
      highErrorRate: 0.2,
      longTimeSinceLastPractice: 0.15,
      lowEngagement: 0.05,
      plateau: 0.05
    };

    let risk = 0;
    Object.entries(factors).forEach(([factor, value]) => {
      risk += (value as number) * weights[factor as keyof typeof weights];
    });

    return Math.min(1, risk);
  }

  private identifyChurnReasons(factors: any): string[] {
    const reasons = [];

    if (factors.lowPracticeFrequency > 0.5) {
      reasons.push('Frequência de prática muito baixa');
    }
    if (factors.decliningAccuracy > 0.5) {
      reasons.push('Precisão em declínio constante');
    }
    if (factors.longTimeSinceLastPractice > 0.5) {
      reasons.push('Longo período sem prática');
    }

    return reasons.length > 0 ? reasons : ['Engajamento consistente'];
  }

  private suggestInterventions(factors: any, profile: UserProfile): string[] {
    const interventions = [];

    if (factors.lowPracticeFrequency > 0) {
      interventions.push('Enviar lembretes diários de prática');
      interventions.push('Sugerir sessões de 10 minutos em vez de 30');
    }

    if (factors.decliningAccuracy > 0) {
      interventions.push('Oferecer exercícios de reforço nas áreas fracas');
      interventions.push('Sugerir tutoriais específicos para dificuldades');
    }

    if (factors.longTimeSinceLastPractice > 0) {
      interventions.push('Enviar mensagem motivacional personalizada');
      interventions.push('Oferecer plano de retorno gradual');
    }

    return interventions;
  }

  private calculateTimeToAction(risk: number, factors: any): number {
    if (risk < 0.3) return 14; // 2 semanas
    if (risk < 0.6) return 7;  // 1 semana
    if (risk < 0.8) return 3;  // 3 dias
    return 1; // 1 dia
  }

  private simulateSimilarUsers(profile: UserProfile, history: PracticeSession[]): any[] {
    // Simulação de usuários similares baseada em padrões comuns
    const similarUsers = [
      {
        similarity: 0.85,
        profile: {
          level: profile.level,
          learningPace: profile.learningPace,
          preferredDifficulty: profile.preferredDifficulty
        },
        successfulStrategies: [
          'Prática diária de 15 minutos',
          'Foco em progressões de acordes antes de músicas completas',
          'Uso de metrônomo desde o início'
        ],
        commonChallenges: ['Transições rápidas', 'Ritmo constante']
      },
      {
        similarity: 0.72,
        profile: {
          level: profile.level + 1,
          learningPace: 'fast',
          preferredDifficulty: profile.preferredDifficulty
        },
        successfulStrategies: [
          'Aprendizado através de músicas favoritas',
          'Gravação e análise de própria performance',
          'Combinação de teoria e prática'
        ],
        commonChallenges: ['Motivação consistente', 'Técnica avançada']
      }
    ];

    return similarUsers;
  }

  private extractStrategiesFromSimilarUsers(similarUsers: any[]): string[] {
    const allStrategies = similarUsers.flatMap(user => user.successfulStrategies);
    const strategyCount = new Map<string, number>();

    allStrategies.forEach(strategy => {
      strategyCount.set(strategy, (strategyCount.get(strategy) || 0) + 1);
    });

    return Array.from(strategyCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([strategy]) => strategy);
  }

  private analyzePerformanceTrend(recentSessions: PracticeSession[]): any {
    if (recentSessions.length < 5) {
      return { trend: 'stable', averageAccuracy: 70, consistency: 0.5 };
    }

    const accuracies = recentSessions.map(s => s.accuracy);
    const averageAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;

    // Calcular tendência (regressão linear simples)
    const n = accuracies.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = accuracies.reduce((sum, acc) => sum + acc, 0);
    const sumXY = accuracies.reduce((sum, acc, i) => sum + acc * i, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const trend = slope > 0.5 ? 'improving' : slope < -0.5 ? 'declining' : 'stable';

    // Consistência (desvio padrão inverso)
    const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - averageAccuracy, 2), 0) / n;
    const consistency = Math.max(0, 1 - Math.sqrt(variance) / 50); // Normalizado 0-1

    return { trend, averageAccuracy, consistency, slope };
  }

  private calculateOptimalDifficulty(profile: UserProfile, performanceTrend: any): number {
    const baseDifficulty = profile.preferredDifficulty === 'beginner' ? 0.3 :
                         profile.preferredDifficulty === 'intermediate' ? 0.6 : 0.8;

    let adjustment = 0;

    if (performanceTrend.trend === 'improving') {
      adjustment = 0.1; // Aumentar dificuldade
    } else if (performanceTrend.trend === 'declining') {
      adjustment = -0.1; // Diminuir dificuldade
    }

    // Considerar consistência
    if (performanceTrend.consistency < 0.6) {
      adjustment -= 0.05; // Mais fácil se inconsistente
    }

    return Math.max(0.1, Math.min(0.9, baseDifficulty + adjustment));
  }

  private selectExerciseType(weakAreas: WeakArea[], profile: UserProfile): string {
    if (weakAreas.length === 0) {
      // Exercício baseado no perfil
      const types = ['chord_progression', 'rhythm_pattern', 'ear_training', 'technique_drill'];
      return types[Math.floor(Math.random() * types.length)];
    }

    // Escolher baseado na área mais fraca
    const topWeakArea = weakAreas[0];
    const typeMap: Record<string, string> = {
      'Acordes': 'chord_progression',
      'Escalas': 'technique_drill',
      'Músicas': 'chord_progression',
      'Treino de Ouvido': 'ear_training',
      'Ritmo': 'rhythm_pattern'
    };

    return typeMap[topWeakArea.category] || 'chord_progression';
  }

  private async createAdaptiveContent(
    type: string,
    difficulty: number,
    weakAreas: WeakArea[]
  ): Promise<AdaptiveExercise> {
    const baseContent = this.generateBaseContent(type, difficulty);
    const adaptiveParams = {
      minAccuracy: Math.max(0.6, difficulty - 0.2),
      maxAccuracy: Math.min(0.95, difficulty + 0.2),
      adjustmentFactor: 0.1
    };

    return {
      id: `adaptive_${type}_${Date.now()}`,
      type: type as any,
      difficulty,
      content: baseContent,
      expectedAccuracy: difficulty * 80 + 20, // 20-100%
      timeLimit: Math.max(30, Math.min(300, 60 + difficulty * 180)), // 30s-5min
      hints: this.generateHints(type, weakAreas),
      adaptiveParams
    };
  }

  private generateBaseContent(type: string, difficulty: number): any {
    switch (type) {
      case 'chord_progression':
        return {
          chords: this.generateChordProgression(difficulty),
          tempo: Math.round(80 + difficulty * 80), // 80-160 BPM
          style: difficulty < 0.5 ? 'simple' : 'complex'
        };

      case 'rhythm_pattern':
        return {
          pattern: this.generateRhythmPattern(difficulty),
          subdivision: difficulty < 0.5 ? 'quarter' : 'eighth',
          complexity: Math.floor(difficulty * 3) + 1
        };

      case 'ear_training':
        return {
          intervals: this.generateIntervals(difficulty),
          chords: this.generateChordRecognition(difficulty),
          mode: difficulty < 0.5 ? 'basic' : 'advanced'
        };

      case 'technique_drill':
        return {
          exercises: this.generateTechniqueExercises(difficulty),
          focus: 'finger_independence',
          repetitions: Math.max(3, Math.floor(difficulty * 10))
        };

      default:
        return {};
    }
  }

  private generateHints(type: string, weakAreas: WeakArea[]): string[] {
    const hints: string[] = [];

    weakAreas.slice(0, 2).forEach(area => {
      switch (area.category) {
        case 'Acordes':
          hints.push('Lembre-se de posicionar os dedos antes de pressionar as cordas');
          hints.push('Mantenha os dedos curvos para evitar ruído');
          break;
        case 'Ritmo':
          hints.push('Concentre-se no clique do metrônomo');
          hints.push('Pratique primeiro devagar, depois acelere');
          break;
        case 'Treino de Ouvido':
          hints.push('Cante a nota ou acorde antes de responder');
          hints.push('Compare com notas/acordes que você conhece');
          break;
      }
    });

    return hints.length > 0 ? hints : ['Respire fundo e vá devagar', 'Foco na qualidade, não na velocidade'];
  }

  private calculateProgressScore(profile: UserProfile, recentSessions: PracticeSession[]): number {
    if (recentSessions.length === 0) return 0;

    const recentAccuracy = recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length;
    const consistencyBonus = this.calculateConsistencyBonus(recentSessions);
    const levelProgress = Math.min(1, profile.level / 10); // Meta: nível 10

    return (recentAccuracy / 100 * 0.5) + (consistencyBonus * 0.3) + (levelProgress * 0.2);
  }

  private calculateConsistencyBonus(sessions: PracticeSession[]): number {
    if (sessions.length < 7) return 0;

    // Verificar prática em dias consecutivos
    const dates = sessions.map(s => new Date(s.timestamp).toDateString());
    const uniqueDates = new Set(dates);

    let consecutiveDays = 0;
    let maxConsecutive = 0;
    let lastDate: Date | null = null;

    Array.from(uniqueDates).sort().forEach(dateStr => {
      const currentDate = new Date(dateStr);
      if (lastDate) {
        const diffDays = (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
          consecutiveDays++;
          maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
        } else {
          consecutiveDays = 1;
        }
      } else {
        consecutiveDays = 1;
      }
      lastDate = currentDate;
    });

    return Math.min(1, maxConsecutive / 7); // Máximo 7 dias consecutivos
  }

  // ========== MÉTODOS DE GERAÇÃO DE CONTEÚDO ==========

  private generateChordProgression(difficulty: number): string[] {
    const basicChords = ['C', 'D', 'Em', 'G', 'Am', 'F'];
    const intermediateChords = ['C7', 'Dm', 'Em7', 'G7', 'Am7', 'Fmaj7', 'Bb', 'A7'];
    const advancedChords = ['C7M', 'Dm7b5', 'Em9', 'G7b9', 'Am11', 'F#7#11', 'Bb13', 'A7sus4'];

    let chordPool = basicChords;
    if (difficulty > 0.4) chordPool = chordPool.concat(intermediateChords);
    if (difficulty > 0.7) chordPool = chordPool.concat(advancedChords);

    const length = Math.floor(3 + difficulty * 4); // 3-7 acordes
    const progression: string[] = [];

    for (let i = 0; i < length; i++) {
      progression.push(chordPool[Math.floor(Math.random() * chordPool.length)]);
    }

    return progression;
  }

  private generateRhythmPattern(difficulty: number): string {
    const basic = ['1', '1', '1', '1'];
    const intermediate = ['1', '1', '2', '1', '1', '2'];
    const advanced = ['1', '2', '3', '1', '2', '4', '1', '2'];

    if (difficulty < 0.4) return basic.join('-');
    if (difficulty < 0.7) return intermediate.join('-');
    return advanced.join('-');
  }

  private generateIntervals(difficulty: number): string[] {
    const basic = ['uníssono', 'terça menor', 'terça maior', 'quarta justa', 'quinta justa'];
    const intermediate = basic.concat(['sexta menor', 'sexta maior', 'oitava']);
    const advanced = intermediate.concat(['sétima menor', 'sétima maior', 'novena menor']);

    const count = Math.floor(3 + difficulty * 5); // 3-8 intervalos
    const intervals = difficulty < 0.4 ? basic : difficulty < 0.7 ? intermediate : advanced;

    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(intervals[Math.floor(Math.random() * intervals.length)]);
    }

    return result;
  }

  private generateChordRecognition(difficulty: number): string[] {
    const basic = ['C', 'Dm', 'Em', 'G', 'Am', 'F'];
    const intermediate = basic.concat(['C7', 'Dm7', 'Em7', 'G7', 'Am7', 'Fmaj7']);
    const advanced = intermediate.concat(['C7M', 'Dm7b5', 'G7b9', 'Bb13']);

    const count = Math.floor(2 + difficulty * 4); // 2-6 acordes
    const chords = difficulty < 0.4 ? basic : difficulty < 0.7 ? intermediate : advanced;

    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(chords[Math.floor(Math.random() * chords.length)]);
    }

    return result;
  }

  private generateTechniqueExercises(difficulty: number): any[] {
    return [
      {
        name: 'Dedilhado alternado',
        strings: [1, 2, 3],
        pattern: 'i-m-a-m',
        speed: Math.floor(60 + difficulty * 60) // 60-120 BPM
      },
      {
        name: 'Pestana móvel',
        chords: ['A', 'Bb', 'B', 'C'],
        transitions: 4,
        holdTime: Math.max(2, 4 - difficulty * 2)
      }
    ];
  }

  // ========== MÉTODOS DE RESPOSTA CONVERSACIONAL ==========

  private generateEncouragementResponse(profile: UserProfile, sessions: PracticeSession[]): string {
    const recentAccuracy = sessions.length > 0 ?
      sessions.slice(-3).reduce((sum, s) => sum + s.accuracy, 0) / Math.min(3, sessions.length) : 0;

    let response = "Entendo que está enfrentando dificuldades! Isso é completamente normal no aprendizado musical. ";

    if (profile.level <= 3) {
      response += "Como você está começando, é importante focar nos fundamentos. ";
    } else {
      response += "Mesmo com experiência, alguns conceitos podem ser desafiadores. ";
    }

    if (recentAccuracy < 60) {
      response += "Sua precisão recente está em torno de " + Math.round(recentAccuracy) +
                 "%. Que tal diminuirmos um pouco o ritmo e focarmos na qualidade? ";
    }

    response += "Lembre-se: todo músico passou por isso. A chave é a prática consistente e paciente. ";

    return response;
  }

  private generateProgressResponse(profile: UserProfile, sessions: PracticeSession[]): string {
    const recentAccuracy = sessions.slice(-5).reduce((sum, s) => sum + s.accuracy, 0) / Math.min(5, sessions.length);

    let response = "Que ótimo ver seu progresso! ";

    if (recentAccuracy > 80) {
      response += "Sua precisão está excelente (" + Math.round(recentAccuracy) + "%). ";
    }

    response += "Você já praticou por " + Math.round(profile.totalPracticeTime / 3600) +
               " horas totais, chegando ao nível " + profile.level + ". ";

    if (profile.strongAreas.length > 0) {
      response += "Você se destaca especialmente em " + profile.strongAreas.join(' e ') + ". ";
    }

    response += "Continue assim! O próximo nível está cada vez mais próximo. ";

    return response;
  }

  private generateMotivationResponse(mood: string, profile: UserProfile): string {
    const responses = {
      frustrated: "Frustração é sinal de que você se importa com seu progresso! Isso é bom. ",
      motivated: "Que energia positiva! Vamos canalizar isso para uma prática produtiva. ",
      confused: "Confusão é parte do processo de aprendizado. Vamos esclarecer as dúvidas juntos. ",
      confident: "Confiança é construída através de prática consistente. Continue assim! ",
      neutral: "Vamos encontrar uma maneira de tornar sua prática mais engajadora. "
    };

    let response = responses[mood as keyof typeof responses] || responses.neutral;

    response += "Lembre-se do motivo que te trouxe aqui: " +
               (profile.level <= 3 ? "aprender a tocar suas músicas favoritas" : "se tornar um músico melhor") + ". ";

    response += "Cada sessão de prática, por menor que seja, te aproxima desse objetivo. ";

    return response;
  }

  private generateGeneralResponse(profile: UserProfile, sessions: PracticeSession[]): string {
    const recentSessions = sessions.slice(-3);
    const avgAccuracy = recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length || 0;

    let response = "Olá! Como está indo sua jornada musical? ";

    if (recentSessions.length > 0) {
      response += "Vejo que você praticou recentemente " +
                 recentSessions.map(s => s.itemName).join(', ') + ". ";
    }

    if (avgAccuracy > 0) {
      response += "Sua precisão média nas últimas sessões está em " + Math.round(avgAccuracy) + "%. ";
    }

    response += "Estou aqui para ajudar no que precisar - seja com exercícios, dicas ou motivação. ";

    return response;
  }

  // ========== MÉTODOS DE GERAÇÃO DE RECOMENDAÇÕES ==========

  private generateDifficultyBasedRecommendations(profile: UserProfile): Recommendation[] {
    return [
      {
        id: 'simplify_practice',
        type: 'exercise',
        title: 'Prática Simplificada',
        description: 'Quebre os exercícios em partes menores e pratique devagar',
        reason: 'Reduz ansiedade e constrói confiança gradualmente',
        priority: 9,
        estimatedTime: 15,
        targetWeakArea: 'Fundamentos',
        difficulty: 'beginner'
      },
      {
        id: 'tutorial_review',
        type: 'lesson',
        title: 'Revisar Tutoriais Básicos',
        description: 'Assista novamente os tutoriais das técnicas que estão te desafiando',
        reason: 'Reforça conceitos fundamentais',
        priority: 8,
        estimatedTime: 20,
        targetWeakArea: 'Técnica',
        difficulty: 'beginner'
      }
    ];
  }

  private generateProgressionRecommendations(profile: UserProfile): Recommendation[] {
    return [
      {
        id: 'challenge_yourself',
        type: 'exercise',
        title: 'Novo Desafio',
        description: 'Experimente aumentar ligeiramente a dificuldade em uma área que domina',
        reason: 'Mantém o aprendizado interessante e progressivo',
        priority: 7,
        estimatedTime: 25,
        targetWeakArea: 'Progressão',
        difficulty: profile.preferredDifficulty === 'beginner' ? 'intermediate' : 'advanced'
      }
    ];
  }

  private generateMotivationalRecommendations(profile: UserProfile): Recommendation[] {
    return [
      {
        id: 'small_wins',
        type: 'review',
        title: 'Celebre Pequenas Vitórias',
        description: 'Anote e celebre cada pequena melhoria em sua prática',
        reason: 'Constrói momentum positivo',
        priority: 8,
        estimatedTime: 5,
        targetWeakArea: 'Motivação',
        difficulty: 'beginner'
      },
      {
        id: 'practice_routine',
        type: 'lesson',
        title: 'Criar Rotina de Prática',
        description: 'Estabeleça horários fixos e metas realistas diárias',
        reason: 'Cria hábitos sustentáveis',
        priority: 9,
        estimatedTime: 10,
        targetWeakArea: 'Consistência',
        difficulty: 'beginner'
      }
    ];
  }

  private generateGeneralRecommendations(profile: UserProfile): Recommendation[] {
    const recommendations: Recommendation[] = [];

    recommendations.push({
      id: 'consistency_focus',
      type: 'review',
      title: 'Foco na Consistência',
      description: 'Pratique um pouco todos os dias em vez de muito em alguns dias',
      reason: 'Constrói hábitos duradouros e melhoria gradual',
      priority: 6,
      estimatedTime: 20,
      targetWeakArea: 'Hábitos',
      difficulty: profile.preferredDifficulty
    });

    if (profile.averageAccuracy > 75) {
      recommendations.push({
        id: 'variety_explore',
        type: 'exercise',
        title: 'Explorar Novos Estilos',
        description: 'Experimente tocar em diferentes estilos musicais',
        reason: 'Mantém o aprendizado interessante e desenvolve versatilidade',
        priority: 5,
        estimatedTime: 30,
        targetWeakArea: 'Versatilidade',
        difficulty: profile.preferredDifficulty
      });
    }

    return recommendations;
  }

  // ========== MÉTODOS DE AVALIAÇÃO DE PROGRESSO ==========

  private identifyImprovementAreas(weakAreas: WeakArea[], recentSessions: PracticeSession[]): string[] {
    const areas: string[] = [];

    weakAreas.forEach(area => {
      if (area.errorRate > 0.4) {
        areas.push(`${area.category} (taxa de erro alta)`);
      } else if (area.lastPracticed > 7 * 24 * 60 * 60 * 1000) { // 7 dias
        areas.push(`${area.category} (tempo sem prática)`);
      }
    });

    // Verificar consistência
    const sessionDates = recentSessions.map(s => new Date(s.timestamp).toDateString());
    const uniqueDays = new Set(sessionDates).size;
    const totalDays = recentSessions.length > 0 ?
      Math.ceil((Date.now() - recentSessions[0].timestamp) / (1000 * 60 * 60 * 24)) : 1;

    if (uniqueDays / totalDays < 0.5) {
      areas.push('Consistência na prática');
    }

    return areas;
  }

  private suggestAdjustments(profile: UserProfile, progressScore: number): string[] {
    const adjustments: string[] = [];

    if (progressScore < 0.4) {
      adjustments.push('Reduzir dificuldade temporariamente');
      adjustments.push('Aumentar sessões curtas diárias');
      adjustments.push('Focar em exercícios de reforço');
    } else if (progressScore > 0.7) {
      adjustments.push('Aumentar gradualmente a dificuldade');
      adjustments.push('Introduzir novos desafios');
      adjustments.push('Expandir repertório');
    }

    if (profile.learningPace === 'slow') {
      adjustments.push('Dar mais tempo para assimilação');
      adjustments.push('Quebrar exercícios em partes menores');
    }

    return adjustments;
  }

  private predictNextMilestone(profile: UserProfile, progressScore: number): string {
    const milestones = [
      'Completar primeira música',
      'Dominar acordes básicos',
      'Manter ritmo constante por 5 minutos',
      'Tocar sem olhar as cordas',
      'Improvisar simples progressões',
      'Ensinar para alguém',
      'Gravar primeira música completa',
      'Juntar-se a uma banda',
      'Tocar em público'
    ];

    const currentMilestoneIndex = Math.min(milestones.length - 1,
      Math.floor(profile.level / 2) + Math.floor(progressScore * 3));

    return milestones[currentMilestoneIndex];
  }

  private generateMotivationalMessage(progressScore: number, profile: UserProfile): string {
    const messages = {
      low: [
        "Cada mestre já foi principiante. Sua dedicação já está te transformando!",
        "Progresso musical é como construir uma casa: tijolo por tijolo, dia após dia.",
        "Lembre-se: você está mais avançado hoje do que ontem. Continue!",
      ],
      medium: [
        "Você está no caminho certo! Consistência é a chave do sucesso musical.",
        "Cada sessão de prática é um investimento no seu futuro musical.",
        "Você já percorreu um longo caminho. O melhor ainda está por vir!",
      ],
      high: [
        "Sua dedicação está dando resultados incríveis! Continue brilhando!",
        "Você é um exemplo de perseverança. Outros músicos aprendem com você!",
        "O céu é o limite! Seu talento musical está florescendo.",
      ]
    };

    const category = progressScore < 0.4 ? 'low' : progressScore < 0.7 ? 'medium' : 'high';
    const messageList = messages[category as keyof typeof messages];

    return messageList[Math.floor(Math.random() * messageList.length)];
  }
}

export const advancedAIService = new AdvancedAIService();
