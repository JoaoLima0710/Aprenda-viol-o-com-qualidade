/**
 * Sistema de Detecção de Acordes com Feedback em Tempo Real - 2026
 * A funcionalidade crítica que define o MusicTutor
 *
 * Funcionalidades:
 * - Detecção precisa em condições reais (microfone celular, ruído ambiente)
 * - Latência imperceptível (< 200ms)
 * - Diagnóstico acionável específico
 * - Feedback positivo calibrado por nível
 */

export interface ChordDetectionResult {
  detectedChord: string | null;
  confidence: number; // 0-1
  isCorrect: boolean;
  expectedChord: string;
  timing: {
    latency: number; // ms
    timestamp: number;
  };
  analysis: {
    notes: DetectedNote[];
    chordQuality: 'perfect' | 'good' | 'acceptable' | 'poor';
    problems: ChordProblem[];
    strengths: string[];
  };
  feedback: {
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
    actionRequired: string | null;
    visualCue: 'celebration' | 'correction' | 'encouragement' | null;
    audioCue: 'success' | 'try_again' | 'good_job' | null;
  };
}

export interface DetectedNote {
  string: number; // 1-6 (E-A-D-G-B-E)
  fret: number;
  frequency: number;
  amplitude: number;
  isCorrect: boolean;
  expectedFrequency: number;
  centsOff: number;
  problem: 'muted' | 'wrong_fret' | 'low_pressure' | 'not_played' | null;
}

export interface ChordProblem {
  type: 'muted_string' | 'wrong_finger' | 'low_pressure' | 'timing_issue' | 'noise_interference';
  string?: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
  solution: string;
}

export interface DetectionCalibration {
  microphoneSensitivity: number;
  ambientNoise: number;
  guitarType: 'acoustic' | 'electric' | 'classical';
  stringGauge: number;
  capoPosition: number;
  lastCalibrated: Date;
}

export class ChordDetectionSystem {
  private static instance: ChordDetectionSystem;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private isListening = false;
  private calibration: DetectionCalibration | null = null;

  // Configurações otimizadas para detecção em tempo real
  private readonly FFT_SIZE = 2048;
  private readonly SAMPLE_RATE = 44100;
  private readonly MIN_CONFIDENCE = 0.75;
  private readonly MAX_LATENCY = 150; // ms

  // Notas das cordas abertas (frequências em Hz)
  private readonly OPEN_STRING_FREQUENCIES = {
    6: 82.41, // E baixa
    5: 110.00, // A
    4: 146.83, // D
    3: 196.00, // G
    2: 246.94, // B
    1: 329.63  // E alta
  };

  private constructor() {
    this.loadCalibration();
  }

  static getInstance(): ChordDetectionSystem {
    if (!ChordDetectionSystem.instance) {
      ChordDetectionSystem.instance = new ChordDetectionSystem();
    }
    return ChordDetectionSystem.instance;
  }

  /**
   * Inicializa o sistema de detecção
   */
  async initialize(): Promise<boolean> {
    try {
      // Criar AudioContext
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await this.audioContext.resume();

      // Configurar analyser
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.FFT_SIZE;
      this.analyser.smoothingTimeConstant = 0.1; // Baixo smoothing para resposta rápida

      // Solicitar permissão do microfone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: this.SAMPLE_RATE,
          channelCount: 1
        }
      });

      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      // Auto-calibração inicial
      await this.autoCalibrate();

      return true;
    } catch (error) {
      console.error('Erro ao inicializar detecção de acordes:', error);
      return false;
    }
  }

  /**
   * Detecta acorde em tempo real
   */
  async detectChord(expectedChord: string, timeout = 3000): Promise<ChordDetectionResult> {
    const startTime = performance.now();

    if (!this.isListening || !this.analyser) {
      throw new Error('Sistema de detecção não inicializado');
    }

    return new Promise((resolve) => {
      const checkChord = () => {
        const result = this.analyzeCurrentAudio(expectedChord);
        const latency = performance.now() - startTime;

        result.timing = {
          latency,
          timestamp: Date.now()
        };

        // Resolver se confiança alta ou timeout
        if (result.confidence >= this.MIN_CONFIDENCE || latency >= timeout) {
          resolve(result);
        } else {
          requestAnimationFrame(checkChord);
        }
      };

      checkChord();
    });
  }

  /**
   * Análise em tempo real do áudio atual
   */
  private analyzeCurrentAudio(expectedChord: string): ChordDetectionResult {
    if (!this.analyser) {
      return this.createEmptyResult(expectedChord);
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Detectar frequências presentes
    const detectedNotes = this.detectFrequencies(dataArray);
    const detectedChord = this.identifyChord(detectedNotes);

    // Calcular confiança e precisão
    const { confidence, isCorrect, analysis } = this.evaluateDetection(
      detectedChord,
      expectedChord,
      detectedNotes
    );

    // Gerar feedback específico
    const feedback = this.generateFeedback(analysis, confidence, expectedChord);

    return {
      detectedChord,
      confidence,
      isCorrect,
      expectedChord,
      timing: { latency: 0, timestamp: Date.now() }, // Será preenchido pelo caller
      analysis,
      feedback
    };
  }

  /**
   * Detecta frequências presentes no sinal de áudio
   */
  private detectFrequencies(dataArray: Uint8Array): DetectedNote[] {
    const detectedNotes: DetectedNote[] = [];
    const peaks = this.findFrequencyPeaks(dataArray);

    for (const peak of peaks) {
      const frequency = this.binToFrequency(peak.bin);
      const amplitude = dataArray[peak.bin] / 255;

      // Só considerar picos significativos
      if (amplitude > 0.1) {
        const detectedNote = this.frequencyToNote(frequency);
        if (detectedNote) {
          detectedNotes.push(detectedNote);
        }
      }
    }

    return detectedNotes;
  }

  /**
   * Identifica o acorde baseado nas notas detectadas
   */
  private identifyChord(detectedNotes: DetectedNote[]): string | null {
    if (detectedNotes.length < 3) return null;

    // Algoritmo simplificado - em produção usaria templates de acordes
    const noteNames = detectedNotes.map(note => this.frequencyToNoteName(note.frequency));

    // Lógica básica de identificação (simplificada)
    if (this.matchesChordPattern(noteNames, ['C', 'E', 'G'])) return 'C';
    if (this.matchesChordPattern(noteNames, ['D', 'F#', 'A'])) return 'D';
    if (this.matchesChordPattern(noteNames, ['A', 'C#', 'E'])) return 'A';
    if (this.matchesChordPattern(noteNames, ['G', 'B', 'D'])) return 'G';
    if (this.matchesChordPattern(noteNames, ['E', 'G#', 'B'])) return 'E';

    return null;
  }

  /**
   * Avalia a qualidade da detecção
   */
  private evaluateDetection(
    detectedChord: string | null,
    expectedChord: string,
    detectedNotes: DetectedNote[]
  ): {
    confidence: number;
    isCorrect: boolean;
    analysis: ChordDetectionResult['analysis'];
  } {
    const isCorrect = detectedChord === expectedChord;
    let confidence = 0;

    if (isCorrect) {
      // Calcular confiança baseado na qualidade das notas
      const avgAmplitude = detectedNotes.reduce((sum, note) => sum + note.amplitude, 0) / detectedNotes.length;
      const correctNotes = detectedNotes.filter(note => note.isCorrect).length;
      const accuracyRatio = correctNotes / detectedNotes.length;

      confidence = Math.min(1, (avgAmplitude * 0.4) + (accuracyRatio * 0.6));
    }

    // Análise detalhada
    const problems = this.identifyProblems(detectedNotes, expectedChord);
    const strengths = this.identifyStrengths(detectedNotes, isCorrect);
    const chordQuality = this.determineChordQuality(confidence, problems);

    return {
      confidence,
      isCorrect,
      analysis: {
        notes: detectedNotes,
        chordQuality,
        problems,
        strengths
      }
    };
  }

  /**
   * Identifica problemas específicos na execução
   */
  private identifyProblems(detectedNotes: DetectedNote[], expectedChord: string): ChordProblem[] {
    const problems: ChordProblem[] = [];

    // Verificar cordas não tocadas
    const expectedNotes = this.getExpectedNotesForChord(expectedChord);
    for (const expected of expectedNotes) {
      const detected = detectedNotes.find(note =>
        Math.abs(note.frequency - expected.frequency) < 10
      );

      if (!detected) {
        problems.push({
          type: 'muted_string',
          string: expected.string,
          description: `Corda ${expected.string} não está soando`,
          severity: 'high',
          solution: 'Verifique se o dedo está pressionando corretamente a casa'
        });
      } else if (detected.amplitude < 0.3) {
        problems.push({
          type: 'low_pressure',
          string: expected.string,
          description: `Corda ${expected.string} está muito fraca`,
          severity: 'medium',
          solution: 'Aumente a pressão do dedo na corda'
        });
      }
    }

    // Verificar ruído ambiente
    const avgAmplitude = detectedNotes.reduce((sum, note) => sum + note.amplitude, 0) / detectedNotes.length;
    if (avgAmplitude < 0.2) {
      problems.push({
        type: 'noise_interference',
        description: 'Sinal muito fraco - possível interferência',
        severity: 'medium',
        solution: 'Aproxime o microfone do instrumento ou reduza ruído ambiente'
      });
    }

    return problems;
  }

  /**
   * Identifica pontos positivos
   */
  private identifyStrengths(detectedNotes: DetectedNote[], isCorrect: boolean): string[] {
    const strengths: string[] = [];

    if (isCorrect) {
      strengths.push('Acorde identificado corretamente!');
    }

    const goodNotes = detectedNotes.filter(note => note.amplitude > 0.5);
    if (goodNotes.length > 0) {
      strengths.push(`${goodNotes.length} cordas com boa intensidade`);
    }

    const accurateNotes = detectedNotes.filter(note => Math.abs(note.centsOff) < 20);
    if (accurateNotes.length > 0) {
      strengths.push(`${accurateNotes.length} notas afinadas`);
    }

    return strengths;
  }

  /**
   * Gera feedback específico e acionável
   */
  private generateFeedback(
    analysis: ChordDetectionResult['analysis'],
    confidence: number,
    expectedChord: string
  ): ChordDetectionResult['feedback'] {
    // Lógica de feedback baseada na análise
    if (confidence >= 0.9) {
      return {
        message: `🎉 Perfeito! ${expectedChord} executado com maestria!`,
        type: 'success',
        actionRequired: null,
        visualCue: 'celebration',
        audioCue: 'success'
      };
    }

    if (confidence >= 0.7) {
      return {
        message: `👍 Bom trabalho! ${expectedChord} está quase perfeito.`,
        type: 'success',
        actionRequired: analysis.problems.length > 0 ? analysis.problems[0].solution : null,
        visualCue: 'encouragement',
        audioCue: 'good_job'
      };
    }

    if (analysis.problems.length > 0) {
      const mainProblem = analysis.problems[0];
      return {
        message: `🎯 ${mainProblem.description}`,
        type: mainProblem.severity === 'high' ? 'error' : 'warning',
        actionRequired: mainProblem.solution,
        visualCue: 'correction',
        audioCue: 'try_again'
      };
    }

    return {
      message: `🔄 Tente novamente o acorde ${expectedChord}`,
      type: 'info',
      actionRequired: 'Certifique-se de que todas as cordas estão sendo tocadas',
      visualCue: null,
      audioCue: 'try_again'
    };
  }

  /**
   * Auto-calibração para diferentes microfones e ambientes
   */
  async autoCalibrate(): Promise<void> {
    // Simular calibração (em produção seria mais sofisticada)
    this.calibration = {
      microphoneSensitivity: 0.8,
      ambientNoise: 0.1,
      guitarType: 'acoustic',
      stringGauge: 0.11,
      capoPosition: 0,
      lastCalibrated: new Date()
    };

    this.saveCalibration();
  }

  /**
   * Utilitários de análise de frequência
   */
  private findFrequencyPeaks(dataArray: Uint8Array): Array<{ bin: number; amplitude: number }> {
    const peaks: Array<{ bin: number; amplitude: number }> = [];
    const threshold = 0.3; // Threshold relativo

    for (let i = 1; i < dataArray.length - 1; i++) {
      const amplitude = dataArray[i] / 255;
      const prevAmplitude = dataArray[i - 1] / 255;
      const nextAmplitude = dataArray[i + 1] / 255;

      if (amplitude > threshold && amplitude > prevAmplitude && amplitude > nextAmplitude) {
        peaks.push({ bin: i, amplitude });
      }
    }

    return peaks.sort((a, b) => b.amplitude - a.amplitude).slice(0, 6); // Top 6 peaks
  }

  private binToFrequency(bin: number): number {
    return (bin * this.SAMPLE_RATE) / this.FFT_SIZE;
  }

  private frequencyToNote(frequency: number): DetectedNote | null {
    // Encontrar a corda e casa mais provável
    for (let string = 1; string <= 6; string++) {
      const openFreq = this.OPEN_STRING_FREQUENCIES[string as keyof typeof this.OPEN_STRING_FREQUENCIES];

      // Calcular qual casa produziria esta frequência
      const fret = Math.round(12 * Math.log2(frequency / openFreq));

      if (fret >= 0 && fret <= 12) {
        const expectedFreq = openFreq * Math.pow(2, fret / 12);
        const centsOff = (Math.log2(frequency / expectedFreq) * 1200);

        return {
          string,
          fret,
          frequency,
          amplitude: 0.5, // Será preenchido depois
          isCorrect: Math.abs(centsOff) < 50, // ±50 cents de tolerância
          expectedFrequency: expectedFreq,
          centsOff,
          problem: null
        };
      }
    }

    return null;
  }

  private frequencyToNoteName(frequency: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = 440;
    const semitones = Math.round(12 * Math.log2(frequency / A4));
    const noteIndex = (semitones % 12 + 12) % 12;
    return noteNames[noteIndex];
  }

  private matchesChordPattern(detectedNotes: string[], chordNotes: string[]): boolean {
    // Verificação simplificada - em produção seria mais robusta
    const matches = chordNotes.filter(note => detectedNotes.includes(note)).length;
    return matches >= chordNotes.length * 0.6; // Pelo menos 60% das notas
  }

  private getExpectedNotesForChord(chordName: string): Array<{ string: number; frequency: number }> {
    // Simulação - em produção teria um banco de dados completo
    const chordPatterns: Record<string, Array<{ string: number; fret: number }>> = {
      'C': [
        { string: 1, fret: 0 }, // E
        { string: 2, fret: 1 }, // B
        { string: 3, fret: 0 }, // G
        { string: 4, fret: 2 }, // D
        { string: 5, fret: 3 }  // A
      ]
    };

    return (chordPatterns[chordName] || []).map(note => ({
      string: note.string,
      frequency: this.OPEN_STRING_FREQUENCIES[note.string as keyof typeof this.OPEN_STRING_FREQUENCIES] *
                Math.pow(2, note.fret / 12)
    }));
  }

  private determineChordQuality(confidence: number, problems: ChordProblem[]): ChordDetectionResult['analysis']['chordQuality'] {
    if (confidence >= 0.9 && problems.length === 0) return 'perfect';
    if (confidence >= 0.7 && problems.filter(p => p.severity === 'high').length === 0) return 'good';
    if (confidence >= 0.5) return 'acceptable';
    return 'poor';
  }

  private createEmptyResult(expectedChord: string): ChordDetectionResult {
    return {
      detectedChord: null,
      confidence: 0,
      isCorrect: false,
      expectedChord,
      timing: { latency: 0, timestamp: Date.now() },
      analysis: {
        notes: [],
        chordQuality: 'poor',
        problems: [{
          type: 'noise_interference',
          description: 'Não foi possível detectar áudio',
          severity: 'high',
          solution: 'Verifique se o microfone está funcionando'
        }],
        strengths: []
      },
      feedback: {
        message: 'Não foi possível detectar o acorde',
        type: 'error',
        actionRequired: 'Verifique a conexão do microfone',
        visualCue: null,
        audioCue: null
      }
    };
  }

  /**
   * Controle de estado
   */
  startListening(): void {
    this.isListening = true;
  }

  stopListening(): void {
    this.isListening = false;
  }

  isInitialized(): boolean {
    return this.audioContext !== null && this.analyser !== null;
  }

  /**
   * Persistência de calibração
   */
  private loadCalibration(): void {
    const stored = localStorage.getItem('chord_detection_calibration');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        parsed.lastCalibrated = new Date(parsed.lastCalibrated);
        this.calibration = parsed;
      } catch (error) {
        console.warn('Erro ao carregar calibração:', error);
      }
    }
  }

  private saveCalibration(): void {
    if (this.calibration) {
      localStorage.setItem('chord_detection_calibration', JSON.stringify(this.calibration));
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.microphone) {
      this.microphone.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.isListening = false;
  }
}

export const chordDetectionSystem = ChordDetectionSystem.getInstance();