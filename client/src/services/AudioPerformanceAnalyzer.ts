/**
 * Analisador de Performance de Áudio Multidimensional - 2026
 * Sistema avançado para avaliação detalhada da execução musical
 */

export interface AudioPerformanceMetrics {
  // Precisão de Notas (0-1)
  noteAccuracy: {
    overall: number;
    individual: Array<{
      expectedNote: string;
      detectedNote: string;
      accuracy: number;
      centsOff: number;
    }>;
    correctNotes: number;
    totalNotes: number;
  };

  // Precisão Rítmica (0-1)
  rhythmicAccuracy: {
    overall: number;
    timingDeviations: number[]; // desvios em ms
    averageDeviation: number;
    consistency: number; // variabilidade dos desvios
    tempoStability: number;
  };

  // Clareza de Som (0-1)
  soundClarity: {
    overall: number;
    buzzDetected: boolean;
    unwantedNoise: number;
    stringClarity: number; // clareza individual por corda
    sustainQuality: number;
  };

  // Dinâmica e Expressão (0-1)
  dynamics: {
    overall: number;
    volumeConsistency: number;
    attackQuality: number;
    expression: number;
  };

  // Consistência Geral (0-1)
  consistency: {
    overall: number;
    performanceStability: number;
    fatigueIndicators: boolean;
  };

  // Score Geral (0-100)
  overallScore: number;

  // Feedback Específico
  feedback: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    nextFocus: string;
  };
}

export interface PerformanceContext {
  exerciseType: 'chord_formation' | 'chord_transition' | 'rhythm_practice' | 'scale_practice' | 'song_performance';
  expectedNotes?: string[];
  expectedTiming?: number[];
  tempo?: number;
  targetDifficulty: number;
  userLevel: number;
}

export class AudioPerformanceAnalyzer {
  private static instance: AudioPerformanceAnalyzer;

  private constructor() {}

  static getInstance(): AudioPerformanceAnalyzer {
    if (!AudioPerformanceAnalyzer.instance) {
      AudioPerformanceAnalyzer.instance = new AudioPerformanceAnalyzer();
    }
    return AudioPerformanceAnalyzer.instance;
  }

  /**
   * Analisa performance completa baseada em dados de áudio
   */
  analyzePerformance(
    audioData: Float32Array,
    sampleRate: number,
    context: PerformanceContext
  ): AudioPerformanceMetrics {
    // Simulação de análise - em produção usaria bibliotecas como Meyda ou Web Audio API
    const analysis = this.performDetailedAnalysis(audioData, sampleRate, context);

    // Calcular métricas agregadas
    const overallScore = this.calculateOverallScore(analysis);

    // Gerar feedback específico
    const feedback = this.generateDetailedFeedback(analysis, context);

    return {
      ...analysis,
      overallScore,
      feedback
    };
  }

  /**
   * Executa análise detalhada dos dados de áudio
   */
  private performDetailedAnalysis(
    audioData: Float32Array,
    sampleRate: number,
    context: PerformanceContext
  ): Omit<AudioPerformanceMetrics, 'overallScore' | 'feedback'> {
    // Simulação de detecção de notas (pitch detection)
    const detectedNotes = this.detectNotes(audioData, sampleRate);

    // Análise de precisão de notas
    const noteAccuracy = this.analyzeNoteAccuracy(detectedNotes, context.expectedNotes || []);

    // Análise rítmica
    const rhythmicAccuracy = this.analyzeRhythmicAccuracy(audioData, sampleRate, context);

    // Análise de clareza
    const soundClarity = this.analyzeSoundClarity(audioData, sampleRate, context);

    // Análise dinâmica
    const dynamics = this.analyzeDynamics(audioData);

    // Análise de consistência
    const consistency = this.analyzeConsistency(detectedNotes, rhythmicAccuracy);

    return {
      noteAccuracy,
      rhythmicAccuracy,
      soundClarity,
      dynamics,
      consistency
    };
  }

  /**
   * Detecta notas no sinal de áudio
   */
  private detectNotes(audioData: Float32Array, sampleRate: number): Array<{
    frequency: number;
    amplitude: number;
    time: number;
    note: string;
    centsOff: number;
  }> {
    // Simulação de detecção de pitch usando autocorrelação
    const notes: Array<{
      frequency: number;
      amplitude: number;
      time: number;
      note: string;
      centsOff: number;
    }> = [];

    // Dividir áudio em janelas de análise
    const windowSize = Math.floor(sampleRate * 0.1); // 100ms windows
    const stepSize = Math.floor(windowSize / 2);

    for (let i = 0; i < audioData.length - windowSize; i += stepSize) {
      const window = audioData.slice(i, i + windowSize);
      const analysis = this.analyzeWindow(window, sampleRate);

      if (analysis.amplitude > 0.01) { // Threshold para detecção
        notes.push({
          frequency: analysis.frequency,
          amplitude: analysis.amplitude,
          time: i / sampleRate,
          note: this.frequencyToNote(analysis.frequency),
          centsOff: analysis.centsOff
        });
      }
    }

    return notes;
  }

  /**
   * Analisa uma janela de áudio
   */
  private analyzeWindow(window: Float32Array, sampleRate: number): {
    frequency: number;
    amplitude: number;
    centsOff: number;
  } {
    // Simulação de análise de frequência usando autocorrelação simplificada
    const amplitude = this.calculateRMS(window);

    // Detectar frequência fundamental (simplificado)
    const frequency = this.detectFundamentalFrequency(window, sampleRate);

    // Calcular desvio em cents (simplificado)
    const centsOff = Math.random() * 100 - 50; // ±50 cents aleatório para simulação

    return {
      frequency,
      amplitude,
      centsOff
    };
  }

  /**
   * Análise de precisão de notas
   */
  private analyzeNoteAccuracy(
    detectedNotes: Array<{ note: string; centsOff: number; amplitude: number }>,
    expectedNotes: string[]
  ): AudioPerformanceMetrics['noteAccuracy'] {
    if (detectedNotes.length === 0) {
      return {
        overall: 0,
        individual: [],
        correctNotes: 0,
        totalNotes: expectedNotes.length
      };
    }

    const individual = detectedNotes.map((detected, index) => {
      const expectedNote = expectedNotes[index] || expectedNotes[0];
      const isCorrect = this.notesMatch(detected.note, expectedNote);
      const accuracy = isCorrect ? Math.max(0, 1 - Math.abs(detected.centsOff) / 50) : 0;

      return {
        expectedNote,
        detectedNote: detected.note,
        accuracy,
        centsOff: detected.centsOff
      };
    });

    const correctNotes = individual.filter(item => item.accuracy > 0.8).length;
    const overall = individual.length > 0 ?
      individual.reduce((sum, item) => sum + item.accuracy, 0) / individual.length : 0;

    return {
      overall,
      individual,
      correctNotes,
      totalNotes: expectedNotes.length
    };
  }

  /**
   * Análise de precisão rítmica
   */
  private analyzeRhythmicAccuracy(
    audioData: Float32Array,
    sampleRate: number,
    context: PerformanceContext
  ): AudioPerformanceMetrics['rhythmicAccuracy'] {
    // Simulação de análise rítmica
    const timingDeviations = Array.from({ length: 10 }, () => Math.random() * 100 - 50); // ±50ms
    const averageDeviation = timingDeviations.reduce((a, b) => a + b, 0) / timingDeviations.length;

    // Calcular consistência (variabilidade)
    const variance = timingDeviations.reduce((sum, dev) => sum + Math.pow(dev - averageDeviation, 2), 0) / timingDeviations.length;
    const consistency = Math.max(0, 1 - Math.sqrt(variance) / 100);

    // Estabilidade de tempo (simplificado)
    const tempoStability = Math.max(0, 1 - Math.abs(averageDeviation) / 50);

    const overall = (consistency + tempoStability) / 2;

    return {
      overall,
      timingDeviations,
      averageDeviation,
      consistency,
      tempoStability
    };
  }

  /**
   * Análise de clareza do som
   */
  private analyzeSoundClarity(
    audioData: Float32Array,
    sampleRate: number,
    context: PerformanceContext
  ): AudioPerformanceMetrics['soundClarity'] {
    // Simulação de análise de clareza
    const buzzDetected = Math.random() < 0.2; // 20% chance de detectar buzz
    const unwantedNoise = Math.random() * 0.3; // 0-30% de ruído indesejado
    const stringClarity = Math.max(0.5, 1 - unwantedNoise - (buzzDetected ? 0.2 : 0));
    const sustainQuality = Math.random() * 0.4 + 0.6; // 60-100% sustain

    const overall = (stringClarity + sustainQuality) / 2 * (1 - unwantedNoise);

    return {
      overall,
      buzzDetected,
      unwantedNoise,
      stringClarity,
      sustainQuality
    };
  }

  /**
   * Análise de dinâmica
   */
  private analyzeDynamics(audioData: Float32Array): AudioPerformanceMetrics['dynamics'] {
    // Simulação de análise dinâmica
    const volumeConsistency = Math.max(0.6, 1 - Math.random() * 0.4); // 60-100%
    const attackQuality = Math.random() * 0.3 + 0.7; // 70-100%
    const expression = Math.random() * 0.5 + 0.5; // 50-100%

    const overall = (volumeConsistency + attackQuality + expression) / 3;

    return {
      overall,
      volumeConsistency,
      attackQuality,
      expression
    };
  }

  /**
   * Análise de consistência
   */
  private analyzeConsistency(
    detectedNotes: Array<{ amplitude: number; time: number }>,
    rhythmicAccuracy: AudioPerformanceMetrics['rhythmicAccuracy']
  ): AudioPerformanceMetrics['consistency'] {
    // Análise de estabilidade de performance
    const performanceStability = detectedNotes.length > 1 ?
      1 - (this.calculateVariance(detectedNotes.map(n => n.amplitude)) / 0.1) : 0.5;

    // Detectar fadiga (diminuição gradual de amplitude)
    const amplitudes = detectedNotes.map(n => n.amplitude);
    const fatigueIndicators = amplitudes.length > 5 &&
      amplitudes.slice(-3).reduce((a, b) => a + b, 0) / 3 <
      amplitudes.slice(0, 3).reduce((a, b) => a + b, 0) / 3;

    const overall = (performanceStability + rhythmicAccuracy.consistency) / 2;

    return {
      overall,
      performanceStability,
      fatigueIndicators
    };
  }

  /**
   * Calcula score geral baseado em todas as métricas
   */
  private calculateOverallScore(metrics: Omit<AudioPerformanceMetrics, 'overallScore' | 'feedback'>): number {
    const weights = {
      noteAccuracy: 0.35,
      rhythmicAccuracy: 0.25,
      soundClarity: 0.20,
      dynamics: 0.10,
      consistency: 0.10
    };

    const score = (
      metrics.noteAccuracy.overall * weights.noteAccuracy +
      metrics.rhythmicAccuracy.overall * weights.rhythmicAccuracy +
      metrics.soundClarity.overall * weights.soundClarity +
      metrics.dynamics.overall * weights.dynamics +
      metrics.consistency.overall * weights.consistency
    ) * 100;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Gera feedback detalhado e acionável
   */
  private generateDetailedFeedback(
    metrics: Omit<AudioPerformanceMetrics, 'overallScore' | 'feedback'>,
    context: PerformanceContext
  ): AudioPerformanceMetrics['feedback'] {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];
    let nextFocus = '';

    // Analisar pontos fortes
    if (metrics.noteAccuracy.overall > 0.8) {
      strengths.push('Excelente precisão de afinação!');
    } else if (metrics.noteAccuracy.overall > 0.6) {
      strengths.push('Boa precisão geral de notas');
    }

    if (metrics.rhythmicAccuracy.consistency > 0.8) {
      strengths.push('Ritmo muito consistente');
    } else if (metrics.rhythmicAccuracy.consistency > 0.6) {
      strengths.push('Bom controle rítmico');
    }

    if (metrics.soundClarity.overall > 0.8) {
      strengths.push('Som muito claro e definido');
    }

    // Analisar pontos fracos e gerar recomendações
    if (metrics.noteAccuracy.overall < 0.6) {
      weaknesses.push('Precisão de afinação precisa melhorar');
      recommendations.push('Pratique afinação isolada antes de combinar com ritmo');
      if (!nextFocus) nextFocus = 'note_accuracy';
    }

    if (metrics.rhythmicAccuracy.consistency < 0.6) {
      weaknesses.push('Ritmo inconsistente');
      recommendations.push('Use metrônomo em velocidade mais baixa primeiro');
      recommendations.push('Conte em voz alta enquanto toca');
      if (!nextFocus) nextFocus = 'rhythm';
    }

    if (metrics.soundClarity.buzzDetected) {
      weaknesses.push('Detectado som de corda solta (buzz)');
      recommendations.push('Ajuste posição dos dedos - pode estar muito baixo na casa');
      recommendations.push('Verifique se a corda está completamente pressionada');
      if (!nextFocus) nextFocus = 'clarity';
    }

    if (metrics.soundClarity.unwantedNoise > 0.2) {
      weaknesses.push('Muito ruído na execução');
      recommendations.push('Reduza velocidade para ganhar precisão');
      recommendations.push('Pratique dedilhado individual antes de acordes');
      if (!nextFocus) nextFocus = 'noise';
    }

    if (metrics.consistency.fatigueIndicators) {
      weaknesses.push('Possível fadiga muscular detectada');
      recommendations.push('Faça pausas mais frequentes entre exercícios');
      recommendations.push('Pratique alongamentos antes de tocar');
    }

    // Recomendações contextuais por tipo de exercício
    switch (context.exerciseType) {
      case 'chord_formation':
        if (metrics.noteAccuracy.overall < 0.7) {
          recommendations.push('Para formação de acordes: foque em um dedo de cada vez');
          recommendations.push('Use espelho para verificar posição dos dedos');
        }
        break;

      case 'chord_transition':
        if (metrics.rhythmicAccuracy.consistency < 0.7) {
          recommendations.push('Para transições: pratique mudança lenta primeiro, depois acelere');
          recommendations.push('Identifique o "dedo âncora" que fica na mesma posição');
        }
        break;

      case 'rhythm_practice':
        if (metrics.dynamics.volumeConsistency < 0.7) {
          recommendations.push('Para ritmo: mantenha pressão constante nos acordes');
          recommendations.push('Use metrônomo com cliques mais altos inicialmente');
        }
        break;
    }

    // Fallback para foco se nenhum foi identificado
    if (!nextFocus) {
      if (metrics.noteAccuracy.overall <= metrics.rhythmicAccuracy.overall &&
          metrics.noteAccuracy.overall <= metrics.soundClarity.overall) {
        nextFocus = 'note_accuracy';
      } else if (metrics.rhythmicAccuracy.overall <= metrics.soundClarity.overall) {
        nextFocus = 'rhythm';
      } else {
        nextFocus = 'clarity';
      }
    }

    return {
      strengths: strengths.length > 0 ? strengths : ['Continue praticando!'],
      weaknesses,
      recommendations,
      nextFocus
    };
  }

  // Utility functions

  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  private detectFundamentalFrequency(window: Float32Array, sampleRate: number): number {
    // Simplificação extrema - em produção usaria algoritmo de autocorrelação real
    return 440 + (Math.random() - 0.5) * 200; // 240-640 Hz
  }

  private frequencyToNote(frequency: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = 440;
    const semitones = Math.round(12 * Math.log2(frequency / A4));
    const octave = Math.floor((semitones + 9) / 12) + 4;
    const noteIndex = (semitones % 12 + 12) % 12;
    return noteNames[noteIndex] + octave;
  }

  private notesMatch(note1: string, note2: string): boolean {
    // Simplificação - compara apenas nome da nota ignorando oitava
    return note1.replace(/\d/, '') === note2.replace(/\d/, '');
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  }

  /**
   * Converte métricas em dados para registro no sistema de competências
   */
  convertToCompetenceEvent(
    metrics: AudioPerformanceMetrics,
    context: PerformanceContext
  ): { competenceId: string; performance: number; context: any } {
    // Mapear tipo de exercício para competência principal
    const competenceMapping = {
      'chord_formation': 'chord-formation',
      'chord_transition': 'chord-transitions',
      'rhythm_practice': 'rhythmic-precision',
      'scale_practice': 'finger-technique',
      'song_performance': 'chord-transitions'
    };

    const competenceId = competenceMapping[context.exerciseType] || 'chord-formation';

    // Calcular performance baseada no score geral e dificuldade
    const adjustedPerformance = metrics.overallScore / 100;
    const difficultyMultiplier = Math.min(1 + (context.targetDifficulty - 3) * 0.1, 1.3);

    return {
      competenceId,
      performance: Math.min(1, adjustedPerformance * difficultyMultiplier),
      context: {
        difficulty: context.targetDifficulty,
        exerciseType: context.exerciseType,
        duration: 5, // minutos estimados
        metrics: {
          noteAccuracy: metrics.noteAccuracy.overall,
          rhythmicAccuracy: metrics.rhythmicAccuracy.overall,
          soundClarity: metrics.soundClarity.overall
        }
      }
    };
  }
}

export const audioPerformanceAnalyzer = AudioPerformanceAnalyzer.getInstance();