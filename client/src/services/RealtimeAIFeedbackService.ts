/**
 * Realtime AI Feedback Service
 * Analisa áudio em tempo real e fornece feedback imediato sobre erros
 */

import { pitchDetectionService, PitchDetectionResult } from './PitchDetectionService';

export interface PlayingError {
  type: 'wrong_note' | 'timing' | 'intonation' | 'muted_string' | 'buzz' | 'rhythm';
  description: string;
  correction: string;
  severity: 'low' | 'medium' | 'high';
  detectedNote?: string;
  expectedNote?: string;
  timestamp: number;
}

export interface RealtimeFeedback {
  isCorrect: boolean;
  quality: number; // 0-100
  errors: PlayingError[];
  suggestions: string[];
  encouragement: string;
  detectedNotes: string[];
  expectedNotes: string[];
}

export interface PracticeContext {
  type: 'chord' | 'scale' | 'note' | 'song';
  target: string; // Nome do acorde, escala ou nota esperada
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tempo?: number;
}

// Notas para mapeamento
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Acordes e suas notas
const CHORD_NOTES: Record<string, string[]> = {
  'C': ['C', 'E', 'G'],
  'D': ['D', 'F#', 'A'],
  'E': ['E', 'G#', 'B'],
  'F': ['F', 'A', 'C'],
  'G': ['G', 'B', 'D'],
  'A': ['A', 'C#', 'E'],
  'B': ['B', 'D#', 'F#'],
  'Am': ['A', 'C', 'E'],
  'Bm': ['B', 'D', 'F#'],
  'Cm': ['C', 'D#', 'G'],
  'Dm': ['D', 'F', 'A'],
  'Em': ['E', 'G', 'B'],
  'Fm': ['F', 'G#', 'C'],
  'Gm': ['G', 'A#', 'D'],
  'C7': ['C', 'E', 'G', 'A#'],
  'D7': ['D', 'F#', 'A', 'C'],
  'E7': ['E', 'G#', 'B', 'D'],
  'G7': ['G', 'B', 'D', 'F'],
  'A7': ['A', 'C#', 'E', 'G'],
};

// Escalas e suas notas
const SCALE_NOTES: Record<string, number[]> = {
  'major': [0, 2, 4, 5, 7, 9, 11],
  'minor': [0, 2, 3, 5, 7, 8, 10],
  'pentatonic_major': [0, 2, 4, 7, 9],
  'pentatonic_minor': [0, 3, 5, 7, 10],
  'blues': [0, 3, 5, 6, 7, 10],
};

class RealtimeAIFeedbackService {
  private isInitialized = false;
  private isActive = false;
  private currentContext: PracticeContext | null = null;
  private detectionHistory: PitchDetectionResult[] = [];
  private errorHistory: PlayingError[] = [];
  private onFeedbackCallback: ((feedback: RealtimeFeedback) => void) | null = null;
  private feedbackInterval: NodeJS.Timeout | null = null;
  private lastFeedbackTime = 0;

  /**
   * Inicializa o serviço de feedback
   */
  async initialize(): Promise<boolean> {
    try {
      const success = await pitchDetectionService.initialize();
      if (success) {
        this.isInitialized = true;
        console.log('✅ RealtimeAIFeedbackService initialized');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to initialize RealtimeAIFeedbackService:', error);
      return false;
    }
  }

  /**
   * Inicia a análise em tempo real
   */
  startAnalysis(
    context: PracticeContext,
    onFeedback: (feedback: RealtimeFeedback) => void
  ): void {
    if (!this.isInitialized) {
      console.error('Service not initialized');
      return;
    }

    this.currentContext = context;
    this.onFeedbackCallback = onFeedback;
    this.isActive = true;
    this.detectionHistory = [];
    this.errorHistory = [];

    // Iniciar detecção de pitch
    pitchDetectionService.start((result) => {
      if (result && result.clarity > 0.7) {
        this.handlePitchDetection(result);
      }
    });

    // Gerar feedback periodicamente (a cada 500ms)
    this.feedbackInterval = setInterval(() => {
      this.generateFeedback();
    }, 500);

    console.log('🎤 Started realtime analysis for:', context);
  }

  /**
   * Para a análise
   */
  stopAnalysis(): void {
    this.isActive = false;
    pitchDetectionService.stop();

    if (this.feedbackInterval) {
      clearInterval(this.feedbackInterval);
      this.feedbackInterval = null;
    }

    console.log('🛑 Stopped realtime analysis');
  }

  /**
   * Processa detecção de pitch
   */
  private handlePitchDetection(result: PitchDetectionResult): void {
    // Adicionar ao histórico (manter últimas 20 detecções)
    this.detectionHistory.push(result);
    if (this.detectionHistory.length > 20) {
      this.detectionHistory.shift();
    }
  }

  /**
   * Gera feedback baseado nas detecções recentes
   */
  private generateFeedback(): void {
    if (!this.currentContext || !this.onFeedbackCallback) return;

    const now = Date.now();
    
    // Evitar feedback muito frequente
    if (now - this.lastFeedbackTime < 400) return;
    this.lastFeedbackTime = now;

    const feedback = this.analyzePractice();
    this.onFeedbackCallback(feedback);
  }

  /**
   * Analisa a prática atual
   */
  private analyzePractice(): RealtimeFeedback {
    const context = this.currentContext!;
    const recentDetections = this.detectionHistory.slice(-10);

    // Obter notas detectadas
    const detectedNotes = recentDetections.map(d => d.note);
    const uniqueDetectedNotes = [...new Set(detectedNotes)];

    // Obter notas esperadas
    const expectedNotes = this.getExpectedNotes(context);

    // Analisar erros
    const errors = this.detectErrors(uniqueDetectedNotes, expectedNotes, context);

    // Calcular qualidade
    const quality = this.calculateQuality(recentDetections, expectedNotes);

    // Gerar sugestões
    const suggestions = this.generateSuggestions(errors, context);

    // Gerar encorajamento
    const encouragement = this.generateEncouragement(quality, errors);

    return {
      isCorrect: errors.filter(e => e.severity === 'high').length === 0,
      quality,
      errors,
      suggestions,
      encouragement,
      detectedNotes: uniqueDetectedNotes,
      expectedNotes,
    };
  }

  /**
   * Obtém notas esperadas baseado no contexto
   */
  private getExpectedNotes(context: PracticeContext): string[] {
    switch (context.type) {
      case 'chord':
        return CHORD_NOTES[context.target] || [];

      case 'scale': {
        const [root, scaleType] = context.target.split(' ');
        const rootIndex = NOTE_NAMES.indexOf(root);
        if (rootIndex === -1) return [];
        
        const intervals = SCALE_NOTES[scaleType.toLowerCase()] || SCALE_NOTES['major'];
        return intervals.map(i => NOTE_NAMES[(rootIndex + i) % 12]);
      }

      case 'note':
        return [context.target.replace(/\d/g, '')];

      default:
        return [];
    }
  }

  /**
   * Detecta erros na execução
   */
  private detectErrors(
    detected: string[],
    expected: string[],
    context: PracticeContext
  ): PlayingError[] {
    const errors: PlayingError[] = [];
    const now = Date.now();

    // Verificar notas erradas
    detected.forEach(note => {
      if (!expected.includes(note) && expected.length > 0) {
        errors.push({
          type: 'wrong_note',
          description: `Nota ${note} não pertence ao ${context.type === 'chord' ? 'acorde' : context.type === 'scale' ? 'escala' : 'esperado'}`,
          correction: this.getNoteCorrection(note, expected, context),
          severity: 'high',
          detectedNote: note,
          expectedNote: this.findClosestNote(note, expected),
          timestamp: now,
        });
      }
    });

    // Verificar notas faltando
    const missingNotes = expected.filter(note => !detected.includes(note));
    if (missingNotes.length > 0 && context.type === 'chord') {
      errors.push({
        type: 'muted_string',
        description: `Nota(s) ${missingNotes.join(', ')} não detectada(s)`,
        correction: `Verifique se as cordas estão soando. As notas ${missingNotes.join(', ')} podem estar abafadas.`,
        severity: 'medium',
        expectedNote: missingNotes[0],
        timestamp: now,
      });
    }

    // Verificar afinação (cents)
    const recentDetections = this.detectionHistory.slice(-5);
    const avgCents = recentDetections.reduce((sum, d) => sum + Math.abs(d.cents), 0) / (recentDetections.length || 1);
    
    if (avgCents > 30) {
      errors.push({
        type: 'intonation',
        description: `Afinação imprecisa (${avgCents > 0 ? 'agudo' : 'grave'})`,
        correction: 'Verifique a afinação do seu instrumento ou ajuste a pressão nos trastes',
        severity: avgCents > 40 ? 'high' : 'medium',
        timestamp: now,
      });
    }

    return errors;
  }

  /**
   * Gera correção para nota errada
   */
  private getNoteCorrection(wrongNote: string, expected: string[], context: PracticeContext): string {
    const closestNote = this.findClosestNote(wrongNote, expected);
    
    if (context.type === 'chord') {
      return `Você tocou ${wrongNote}, mas o acorde ${context.target} usa ${expected.join(', ')}. ` +
             `Verifique a posição do(s) dedo(s) para a nota ${closestNote}.`;
    } else if (context.type === 'scale') {
      return `A nota ${wrongNote} não faz parte da escala. Tente ${closestNote} que está mais próxima.`;
    }
    return `Tente tocar ${closestNote} ao invés de ${wrongNote}.`;
  }

  /**
   * Encontra nota mais próxima
   */
  private findClosestNote(note: string, expected: string[]): string {
    if (expected.length === 0) return note;
    
    const noteIndex = NOTE_NAMES.indexOf(note);
    let closestNote = expected[0];
    let minDistance = 12;

    expected.forEach(exp => {
      const expIndex = NOTE_NAMES.indexOf(exp);
      const distance = Math.min(
        Math.abs(noteIndex - expIndex),
        12 - Math.abs(noteIndex - expIndex)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestNote = exp;
      }
    });

    return closestNote;
  }

  /**
   * Calcula qualidade da execução
   */
  private calculateQuality(detections: PitchDetectionResult[], expected: string[]): number {
    if (detections.length === 0) return 0;

    // Clareza média
    const avgClarity = detections.reduce((sum, d) => sum + d.clarity, 0) / detections.length;

    // Precisão das notas
    const correctNotes = detections.filter(d => expected.includes(d.note)).length;
    const noteAccuracy = detections.length > 0 ? correctNotes / detections.length : 0;

    // Precisão de afinação
    const avgCents = detections.reduce((sum, d) => sum + Math.abs(d.cents), 0) / detections.length;
    const tuningAccuracy = Math.max(0, 1 - avgCents / 50);

    // Calcular qualidade final (0-100)
    const quality = (avgClarity * 0.3 + noteAccuracy * 0.5 + tuningAccuracy * 0.2) * 100;

    return Math.round(quality);
  }

  /**
   * Gera sugestões baseadas nos erros
   */
  private generateSuggestions(errors: PlayingError[], context: PracticeContext): string[] {
    const suggestions: string[] = [];

    errors.forEach(error => {
      switch (error.type) {
        case 'wrong_note':
          if (context.type === 'chord') {
            suggestions.push(`🎯 Posicione o dedo mais próximo do traste para a nota ${error.expectedNote}`);
            suggestions.push(`👆 Verifique se está pressionando a corda correta`);
          } else {
            suggestions.push(`🎯 A nota correta é ${error.expectedNote}`);
          }
          break;

        case 'muted_string':
          suggestions.push(`🤚 Curve mais os dedos para não abafar outras cordas`);
          suggestions.push(`👀 Verifique se todos os dedos estão posicionados corretamente`);
          break;

        case 'intonation':
          suggestions.push(`🎸 Verifique a afinação do instrumento`);
          suggestions.push(`👆 Pressione as cordas mais próximas aos trastes`);
          break;

        case 'buzz':
          suggestions.push(`💪 Pressione as cordas com mais firmeza`);
          suggestions.push(`📏 Posicione os dedos mais perto dos trastes`);
          break;
      }
    });

    // Adicionar sugestões gerais se poucos erros
    if (suggestions.length === 0) {
      suggestions.push(`✨ Continue assim! Sua execução está boa.`);
      if (context.difficulty === 'beginner') {
        suggestions.push(`💡 Tente manter um ritmo constante`);
      }
    }

    return [...new Set(suggestions)].slice(0, 4); // Máximo 4 sugestões únicas
  }

  /**
   * Gera mensagem de encorajamento
   */
  private generateEncouragement(quality: number, errors: PlayingError[]): string {
    const highSeverityErrors = errors.filter(e => e.severity === 'high').length;

    if (quality >= 90) {
      return '🌟 Excelente! Sua execução está perfeita!';
    } else if (quality >= 75) {
      return '👏 Muito bem! Continue praticando assim!';
    } else if (quality >= 60) {
      return '💪 Bom progresso! Alguns ajustes e ficará perfeito.';
    } else if (quality >= 40) {
      return '🎯 Você está no caminho certo. Foque nos pontos destacados.';
    } else if (highSeverityErrors > 0) {
      return '📚 Vamos devagar - pratique cada nota separadamente primeiro.';
    } else {
      return '🎸 Continue tentando! A prática leva à perfeição.';
    }
  }

  /**
   * Obtém histórico de erros da sessão
   */
  getErrorHistory(): PlayingError[] {
    return [...this.errorHistory];
  }

  /**
   * Obtém resumo da sessão
   */
  getSessionSummary(): {
    totalDetections: number;
    commonErrors: string[];
    averageQuality: number;
    recommendations: string[];
  } {
    const errorCounts: Record<string, number> = {};
    this.errorHistory.forEach(e => {
      errorCounts[e.type] = (errorCounts[e.type] || 0) + 1;
    });

    const commonErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);

    const recommendations: string[] = [];
    
    if (commonErrors.includes('wrong_note')) {
      recommendations.push('Pratique as posições de dedos lentamente antes de acelerar');
    }
    if (commonErrors.includes('muted_string')) {
      recommendations.push('Trabalhe na curvatura dos dedos para evitar abafar cordas');
    }
    if (commonErrors.includes('intonation')) {
      recommendations.push('Verifique a afinação do instrumento regularmente');
    }

    return {
      totalDetections: this.detectionHistory.length,
      commonErrors,
      averageQuality: this.calculateAverageQuality(),
      recommendations,
    };
  }

  /**
   * Calcula qualidade média da sessão
   */
  private calculateAverageQuality(): number {
    if (this.detectionHistory.length === 0) return 0;
    
    const avgClarity = this.detectionHistory.reduce((sum, d) => sum + d.clarity, 0) / this.detectionHistory.length;
    return Math.round(avgClarity * 100);
  }

  /**
   * Libera recursos
   */
  dispose(): void {
    this.stopAnalysis();
    pitchDetectionService.dispose();
    this.isInitialized = false;
  }
}

export const realtimeAIFeedbackService = new RealtimeAIFeedbackService();
