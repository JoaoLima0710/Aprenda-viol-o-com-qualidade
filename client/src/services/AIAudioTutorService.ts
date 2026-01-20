/**
 * AI Audio Tutor Service
 * Integra detecção de áudio em tempo real com IA para feedback pedagógico avançado
 * Atua como professor em tempo real, identificando falhas e dificuldades
 */

import { RealtimeAIFeedbackService, RealtimeFeedback, PlayingError, PracticeContext } from './RealtimeAIFeedbackService';
import { advancedAIService } from './AdvancedAIService';
import { freeLLMService } from './FreeLLMService';
import { aiAssistantService, UserProfile } from './AIAssistantService';

export interface AITutorFeedback {
  // Feedback técnico
  technicalFeedback: RealtimeFeedback;
  
  // Análise pedagógica da IA
  pedagogicalAnalysis: {
    mainIssue: string;
    rootCause: string;
    personalizedAdvice: string;
    specificCorrections: string[];
    practiceRecommendations: string[];
    encouragement: string;
  };
  
  // Padrões identificados
  patterns: {
    recurringErrors: string[];
    improvementAreas: string[];
    strengths: string[];
  };
  
  // Progresso
  progress: {
    qualityTrend: 'improving' | 'stable' | 'declining';
    accuracyImprovement: number;
    consistencyScore: number;
  };
}

export interface SessionAnalysis {
  sessionId: string;
  startTime: number;
  endTime: number;
  totalErrors: number;
  errorBreakdown: Record<string, number>;
  averageQuality: number;
  qualityProgression: number[];
  mainChallenges: string[];
  recommendations: string[];
  aiSummary: string;
}

class AIAudioTutorService {
  private realtimeService: RealtimeAIFeedbackService;
  private currentSession: SessionAnalysis | null = null;
  private feedbackHistory: AITutorFeedback[] = [];
  private errorPatterns: Map<string, number> = new Map();
  private qualityHistory: number[] = [];

  constructor() {
    this.realtimeService = new RealtimeAIFeedbackService();
  }

  /**
   * Inicia sessão de prática com tutor IA
   */
  async startPracticeSession(
    context: PracticeContext,
    onFeedback: (feedback: AITutorFeedback) => void
  ): Promise<boolean> {
    const initialized = await this.realtimeService.initialize();
    if (!initialized) return false;

    // Iniciar sessão
    this.currentSession = {
      sessionId: `session_${Date.now()}`,
      startTime: Date.now(),
      endTime: 0,
      totalErrors: 0,
      errorBreakdown: {},
      averageQuality: 0,
      qualityProgression: [],
      mainChallenges: [],
      recommendations: [],
      aiSummary: ''
    };

    // Iniciar detecção de áudio
    this.realtimeService.startAnalysis(context, async (realtimeFeedback) => {
      // Enriquecer feedback com análise de IA
      const aiFeedback = await this.enrichWithAIAnalysis(realtimeFeedback, context);
      
      // Atualizar estatísticas da sessão
      this.updateSessionStats(realtimeFeedback, aiFeedback);
      
      // Chamar callback com feedback completo
      onFeedback(aiFeedback);
      
      // Armazenar histórico
      this.feedbackHistory.push(aiFeedback);
    });

    return true;
  }

  /**
   * Para sessão e gera análise final com IA
   */
  async stopPracticeSession(): Promise<SessionAnalysis | null> {
    this.realtimeService.stopAnalysis();
    
    if (!this.currentSession) return null;

    this.currentSession.endTime = Date.now();
    this.currentSession.averageQuality = this.calculateAverageQuality();
    this.currentSession.qualityProgression = [...this.qualityHistory];
    this.currentSession.mainChallenges = this.identifyMainChallenges();
    this.currentSession.recommendations = await this.generateAISessionRecommendations();
    this.currentSession.aiSummary = await this.generateAISessionSummary();

    const session = { ...this.currentSession };
    this.currentSession = null;
    this.feedbackHistory = [];
    this.errorPatterns.clear();
    this.qualityHistory = [];

    return session;
  }

  /**
   * Enriquece feedback técnico com análise pedagógica da IA
   */
  private async enrichWithAIAnalysis(
    technicalFeedback: RealtimeFeedback,
    context: PracticeContext
  ): Promise<AITutorFeedback> {
    const userProfile = aiAssistantService.getUserProfile();
    
    // Análise imediata dos erros
    const mainIssue = this.identifyMainIssue(technicalFeedback);
    const rootCause = await this.analyzeRootCause(technicalFeedback, userProfile, context);
    const personalizedAdvice = await this.generatePersonalizedAdvice(
      technicalFeedback,
      userProfile,
      context,
      mainIssue,
      rootCause
    );
    const specificCorrections = await this.generateSpecificCorrections(
      technicalFeedback,
      userProfile,
      context
    );
    const practiceRecommendations = await this.generatePracticeRecommendations(
      technicalFeedback,
      userProfile,
      context
    );
    const encouragement = this.generateEncouragement(technicalFeedback, userProfile);

    // Identificar padrões
    const patterns = this.identifyPatterns(technicalFeedback);

    // Calcular progresso
    const progress = this.calculateProgress();

    return {
      technicalFeedback,
      pedagogicalAnalysis: {
        mainIssue,
        rootCause,
        personalizedAdvice,
        specificCorrections,
        practiceRecommendations,
        encouragement
      },
      patterns,
      progress
    };
  }

  /**
   * Identifica o problema principal
   */
  private identifyMainIssue(feedback: RealtimeFeedback): string {
    if (feedback.errors.length === 0) {
      return 'Nenhum erro detectado. Execução correta!';
    }

    const highSeverityErrors = feedback.errors.filter(e => e.severity === 'high');
    if (highSeverityErrors.length > 0) {
      const error = highSeverityErrors[0];
      switch (error.type) {
        case 'wrong_note':
          return `Nota incorreta: você tocou ${error.detectedNote} mas deveria ser ${error.expectedNote}`;
        case 'muted_string':
          return 'Corda(s) abafada(s) - algumas notas não estão soando';
        case 'intonation':
          return 'Problema de afinação - as notas estão um pouco fora do tom';
        case 'timing':
          return 'Problema de ritmo/timing';
        case 'buzz':
          return 'Ruído de zumbido nas cordas';
        default:
          return error.description;
      }
    }

    return feedback.errors[0].description;
  }

  /**
   * Analisa causa raiz usando IA
   */
  private async analyzeRootCause(
    feedback: RealtimeFeedback,
    userProfile: UserProfile,
    context: PracticeContext
  ): Promise<string> {
    const errorSummary = feedback.errors.map(e => e.type).join(', ');
    const quality = feedback.quality;
    
    const prompt = `Como tutor de música especializado, analise a causa raiz do problema:

CONTEXTO:
- Aluno: nível ${userProfile.level}/10, precisão média ${userProfile.averageAccuracy}%
- Praticando: ${context.type} - ${context.target}
- Qualidade atual: ${quality}%
- Erros detectados: ${errorSummary}

ERROS ESPECÍFICOS:
${feedback.errors.map(e => `- ${e.description}: ${e.correction}`).join('\n')}

NOTAS DETECTADAS: ${feedback.detectedNotes.join(', ')}
NOTAS ESPERADAS: ${feedback.expectedNotes.join(', ')}

Identifique a CAUSA RAIZ do problema (ex: posição incorreta dos dedos, falta de força, técnica inadequada, etc.).
Seja específico e técnico, mas em linguagem acessível para nível ${userProfile.level}/10.

Responda em 1-2 frases diretas:`;

    try {
      const response = await freeLLMService.callLLM([
        { role: 'system', content: 'Você é um tutor de música experiente que identifica causas raiz de problemas técnicos.' },
        { role: 'user', content: prompt }
      ]);

      return response.content || 'Análise em andamento...';
    } catch (error) {
      console.error('Erro ao analisar causa raiz:', error);
      return this.fallbackRootCauseAnalysis(feedback);
    }
  }

  /**
   * Fallback para análise de causa raiz
   */
  private fallbackRootCauseAnalysis(feedback: RealtimeFeedback): string {
    const errorTypes = feedback.errors.map(e => e.type);
    
    if (errorTypes.includes('wrong_note')) {
      return 'Posição dos dedos pode estar incorreta ou você está tocando a corda errada.';
    }
    if (errorTypes.includes('muted_string')) {
      return 'Dedos podem estar abafando outras cordas ou não estão pressionando com força suficiente.';
    }
    if (errorTypes.includes('intonation')) {
      return 'Afinação do instrumento pode estar incorreta ou você precisa pressionar mais próximo dos trastes.';
    }
    
    return 'Verifique a posição dos dedos e a pressão nas cordas.';
  }

  /**
   * Gera conselho personalizado usando IA
   */
  private async generatePersonalizedAdvice(
    feedback: RealtimeFeedback,
    userProfile: UserProfile,
    context: PracticeContext,
    mainIssue: string,
    rootCause: string
  ): Promise<string> {
    const prompt = `Como tutor de música, dê um conselho PERSONALIZADO e ESPECÍFICO:

PERFIL DO ALUNO:
- Nível: ${userProfile.level}/10 (${userProfile.level <= 3 ? 'iniciante' : userProfile.level <= 6 ? 'intermediário' : 'avançado'})
- Precisão média: ${userProfile.averageAccuracy}%
- Pontos fortes: ${userProfile.strongAreas.join(', ') || 'em desenvolvimento'}
- Áreas fracas: ${userProfile.weakAreas?.slice(0, 2).map(w => w.category).join(', ') || 'a definir'}

SITUAÇÃO ATUAL:
- Praticando: ${context.type} - ${context.target}
- Qualidade: ${feedback.quality}%
- Problema principal: ${mainIssue}
- Causa raiz: ${rootCause}

ERROS DETECTADOS:
${feedback.errors.slice(0, 3).map(e => `- ${e.description}`).join('\n')}

Dê um conselho PRÁTICO, ESPECÍFICO e MOTIVADOR adaptado ao nível do aluno.
Seja direto, use exemplos concretos (posições de dedos, técnicas), e sugira um próximo passo claro.
Máximo 3-4 frases:`;

    try {
      const response = await freeLLMService.callLLM([
        { role: 'system', content: 'Você é um tutor de música empático que dá conselhos práticos e personalizados.' },
        { role: 'user', content: prompt }
      ]);

      return response.content || 'Continue praticando com foco na técnica.';
    } catch (error) {
      console.error('Erro ao gerar conselho:', error);
      return feedback.suggestions[0] || 'Continue praticando com atenção aos detalhes.';
    }
  }

  /**
   * Gera correções específicas usando IA
   */
  private async generateSpecificCorrections(
    feedback: RealtimeFeedback,
    userProfile: UserProfile,
    context: PracticeContext
  ): Promise<string[]> {
    if (feedback.errors.length === 0) {
      return ['Continue assim! Sua execução está correta.'];
    }

    const prompt = `Como tutor de música, liste correções ESPECÍFICAS e PRÁTICAS:

CONTEXTO:
- Aluno nível ${userProfile.level}/10
- Praticando: ${context.type} - ${context.target}
- Qualidade: ${feedback.quality}%

ERROS:
${feedback.errors.map((e, i) => `${i + 1}. ${e.description}`).join('\n')}

NOTAS DETECTADAS: ${feedback.detectedNotes.join(', ')}
NOTAS ESPERADAS: ${feedback.expectedNotes.join(', ')}

Liste 3-4 correções ESPECÍFICAS e PRÁTICAS (ex: "Pressione o dedo indicador mais próximo do traste 1", "Curve mais os dedos para não abafar cordas").
Uma correção por linha, numeradas, diretas e acionáveis:`;

    try {
      const response = await freeLLMService.callLLM([
        { role: 'system', content: 'Você é um tutor de música que dá instruções técnicas precisas.' },
        { role: 'user', content: prompt }
      ]);

      // Parsear resposta em lista
      const corrections = response.content
        .split('\n')
        .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter(line => line.length > 0 && line.length < 100)
        .slice(0, 4);

      return corrections.length > 0 ? corrections : feedback.errors.map(e => e.correction);
    } catch (error) {
      console.error('Erro ao gerar correções:', error);
      return feedback.errors.map(e => e.correction);
    }
  }

  /**
   * Gera recomendações de prática usando IA
   */
  private async generatePracticeRecommendations(
    feedback: RealtimeFeedback,
    userProfile: UserProfile,
    context: PracticeContext
  ): Promise<string[]> {
    const prompt = `Como tutor de música, sugira exercícios de prática ESPECÍFICOS:

PERFIL:
- Nível: ${userProfile.level}/10
- Precisão: ${userProfile.averageAccuracy}%
- Praticando: ${context.type} - ${context.target}
- Qualidade atual: ${feedback.quality}%

ERROS PRINCIPAIS:
${feedback.errors.slice(0, 2).map(e => `- ${e.type}: ${e.description}`).join('\n')}

Sugira 2-3 exercícios PRÁTICOS e ESPECÍFICOS para melhorar (ex: "Pratique o acorde F lentamente, segurando cada nota por 3 segundos", "Faça exercícios de pestana com apenas 2 cordas primeiro").
Um exercício por linha, direto e acionável:`;

    try {
      const response = await freeLLMService.callLLM([
        { role: 'system', content: 'Você é um tutor de música que cria exercícios práticos personalizados.' },
        { role: 'user', content: prompt }
      ]);

      const recommendations = response.content
        .split('\n')
        .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter(line => line.length > 0 && line.length < 120)
        .slice(0, 3);

      return recommendations.length > 0 ? recommendations : ['Continue praticando regularmente'];
    } catch (error) {
      console.error('Erro ao gerar recomendações:', error);
      return ['Continue praticando com foco na técnica'];
    }
  }

  /**
   * Gera encorajamento personalizado
   */
  private generateEncouragement(feedback: RealtimeFeedback, userProfile: UserProfile): string {
    if (feedback.quality >= 90) {
      return '🌟 Excelente! Sua execução está quase perfeita!';
    } else if (feedback.quality >= 75) {
      return '👏 Muito bem! Você está no caminho certo.';
    } else if (feedback.quality >= 60) {
      return '💪 Bom progresso! Continue praticando.';
    } else if (feedback.quality >= 40) {
      return '🎯 Você está melhorando! Foque nos pontos destacados.';
    } else {
      return '📚 Vamos devagar - cada erro é uma oportunidade de aprender.';
    }
  }

  /**
   * Identifica padrões de erro
   */
  private identifyPatterns(feedback: RealtimeFeedback): {
    recurringErrors: string[];
    improvementAreas: string[];
    strengths: string[];
  } {
    // Atualizar contagem de erros
    feedback.errors.forEach(error => {
      const count = this.errorPatterns.get(error.type) || 0;
      this.errorPatterns.set(error.type, count + 1);
    });

    // Identificar erros recorrentes
    const recurringErrors = Array.from(this.errorPatterns.entries())
      .filter(([_, count]) => count >= 2)
      .map(([type, _]) => type)
      .slice(0, 3);

    // Áreas de melhoria baseadas em erros
    const improvementAreas = feedback.errors
      .filter(e => e.severity === 'high')
      .map(e => e.type)
      .slice(0, 2);

    // Pontos fortes (quando não há erros ou qualidade alta)
    const strengths: string[] = [];
    if (feedback.quality >= 80) {
      strengths.push('Execução precisa');
    }
    if (feedback.errors.length === 0) {
      strengths.push('Sem erros detectados');
    }
    if (feedback.detectedNotes.every(note => feedback.expectedNotes.includes(note))) {
      strengths.push('Notas corretas');
    }

    return {
      recurringErrors,
      improvementAreas,
      strengths: strengths.length > 0 ? strengths : ['Em desenvolvimento']
    };
  }

  /**
   * Calcula progresso
   */
  private calculateProgress(): {
    qualityTrend: 'improving' | 'stable' | 'declining';
    accuracyImprovement: number;
    consistencyScore: number;
  } {
    this.qualityHistory.push(this.feedbackHistory[this.feedbackHistory.length - 1]?.technicalFeedback.quality || 0);
    
    if (this.qualityHistory.length < 2) {
      return {
        qualityTrend: 'stable',
        accuracyImprovement: 0,
        consistencyScore: 0.5
      };
    }

    const recent = this.qualityHistory.slice(-5);
    const older = this.qualityHistory.slice(-10, -5);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0 
      ? older.reduce((a, b) => a + b, 0) / older.length 
      : recentAvg;

    const improvement = recentAvg - olderAvg;
    const trend = improvement > 5 ? 'improving' : improvement < -5 ? 'declining' : 'stable';

    // Consistência (quanto menor a variação, maior a consistência)
    const variance = recent.reduce((sum, q) => sum + Math.pow(q - recentAvg, 2), 0) / recent.length;
    const consistencyScore = Math.max(0, 1 - variance / 100);

    return {
      qualityTrend: trend,
      accuracyImprovement: Math.round(improvement),
      consistencyScore: Math.round(consistencyScore * 100) / 100
    };
  }

  /**
   * Atualiza estatísticas da sessão
   */
  private updateSessionStats(feedback: RealtimeFeedback, aiFeedback: AITutorFeedback): void {
    if (!this.currentSession) return;

    this.currentSession.totalErrors += feedback.errors.length;
    feedback.errors.forEach(error => {
      this.currentSession!.errorBreakdown[error.type] = 
        (this.currentSession!.errorBreakdown[error.type] || 0) + 1;
    });
    this.currentSession.qualityProgression.push(feedback.quality);
  }

  /**
   * Calcula qualidade média
   */
  private calculateAverageQuality(): number {
    if (this.qualityHistory.length === 0) return 0;
    return Math.round(
      this.qualityHistory.reduce((a, b) => a + b, 0) / this.qualityHistory.length
    );
  }

  /**
   * Identifica principais desafios
   */
  private identifyMainChallenges(): string[] {
    const errorCounts = Array.from(this.errorPatterns.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    return errorCounts.map(([type, _]) => {
      const typeNames: Record<string, string> = {
        'wrong_note': 'Notas incorretas',
        'muted_string': 'Cordas abafadas',
        'intonation': 'Problemas de afinação',
        'timing': 'Problemas de ritmo',
        'buzz': 'Zumbido nas cordas'
      };
      return typeNames[type] || type;
    });
  }

  /**
   * Gera recomendações de sessão usando IA
   */
  private async generateAISessionRecommendations(): Promise<string[]> {
    if (!this.currentSession) return [];

    const prompt = `Como tutor de música, dê recomendações finais baseadas na sessão:

ESTATÍSTICAS DA SESSÃO:
- Duração: ${Math.round((this.currentSession.endTime - this.currentSession.startTime) / 1000 / 60)} minutos
- Total de erros: ${this.currentSession.totalErrors}
- Qualidade média: ${this.currentSession.averageQuality}%
- Principais desafios: ${this.currentSession.mainChallenges.join(', ')}

DISTRIBUIÇÃO DE ERROS:
${Object.entries(this.currentSession.errorBreakdown)
  .map(([type, count]) => `- ${type}: ${count} vezes`)
  .join('\n')}

Dê 3-4 recomendações ESPECÍFICAS para a próxima sessão de prática.
Uma por linha, diretas e acionáveis:`;

    try {
      const response = await freeLLMService.callLLM([
        { role: 'system', content: 'Você é um tutor de música que analisa sessões e dá recomendações práticas.' },
        { role: 'user', content: prompt }
      ]);

      return response.content
        .split('\n')
        .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter(line => line.length > 0 && line.length < 120)
        .slice(0, 4);
    } catch (error) {
      console.error('Erro ao gerar recomendações:', error);
      return ['Continue praticando regularmente', 'Foque nas áreas de maior dificuldade'];
    }
  }

  /**
   * Gera resumo da sessão usando IA
   */
  private async generateAISessionSummary(): Promise<string> {
    if (!this.currentSession) return '';

    const prompt = `Como tutor de música, faça um resumo motivador e construtivo da sessão:

ESTATÍSTICAS:
- Qualidade média: ${this.currentSession.averageQuality}%
- Total de erros: ${this.currentSession.totalErrors}
- Principais desafios: ${this.currentSession.mainChallenges.join(', ')}
- Progresso: ${this.currentSession.qualityProgression.length > 1 
  ? (this.currentSession.qualityProgression[this.currentSession.qualityProgression.length - 1] > this.currentSession.qualityProgression[0] 
    ? 'Melhorou durante a sessão' 
    : 'Manteve consistência')
  : 'Primeira análise'}

Faça um resumo de 2-3 frases, motivador mas honesto, destacando pontos positivos e áreas de melhoria:`;

    try {
      const response = await freeLLMService.callLLM([
        { role: 'system', content: 'Você é um tutor de música que faz resumos motivadores e construtivos.' },
        { role: 'user', content: prompt }
      ]);

      return response.content || 'Boa sessão de prática! Continue assim.';
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      return `Sessão concluída com qualidade média de ${this.currentSession.averageQuality}%. Continue praticando!`;
    }
  }
}

export const aiAudioTutorService = new AIAudioTutorService();
