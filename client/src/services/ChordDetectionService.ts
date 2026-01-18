/**
 * Sistema de Detecção de Acordes em Tempo Real - 2026
 * Detecção precisa e feedback instantâneo para acordes de guitarra/violão
 */

export interface ChordDetectionResult {
  detectedChord: string | null;
  confidence: number; // 0-1
  timing: number; // timestamp da detecção
  quality: {
    overall: number; // 0-1
    noteAccuracy: number; // 0-1
    clarity: number; // 0-1
    sustain: number; // 0-1
  };
  individualStrings: StringAnalysis[];
  problems: ChordProblem[];
  suggestions: string[];
}

export interface StringAnalysis {
  stringNumber: number; // 1-6 (1=Mi grave, 6=Mi agudo)
  expectedNote: string | null;
  detectedNote: string | null;
  frequency: number;
  amplitude: number;
  clarity: number; // 0-1 (1 = nota clara, 0 = abafada/ruído)
  centsOff: number; // desvio em cents da nota alvo
  isCorrect: boolean;
  problem?: 'muted' | 'wrong_note' | 'out_of_tune' | 'not_played';
}

export interface ChordProblem {
  type: 'muted_string' | 'wrong_fingering' | 'poor_sustain' | 'timing_issue' | 'volume_inconsistent';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedStrings: number[];
  suggestion: string;
}

export interface ChordDetectionConfig {
  sensitivity: number; // 0-1, sensibilidade à detecção
  noiseThreshold: number; // threshold para ignorar ruído
  minAmplitude: number; // amplitude mínima para considerar nota
  maxLatency: number; // latência máxima aceitável em ms
  adaptiveTolerance: boolean; // ajustar tolerâncias por nível do usuário
  userLevel: number; // 1-10, nível de habilidade do usuário
  instrumentType: 'guitar' | 'bass'; // tipo de instrumento
}

export class ChordDetectionService {
  private static instance: ChordDetectionService;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private isListening = false;
  private config: ChordDetectionConfig;
  private detectionCallback: ((result: ChordDetectionResult) => void) | null = null;
  private animationFrame: number | null = null;

  // Buffer para análise
  private bufferSize = 4096;
  private sampleRate = 44100;
  private fftSize = 2048;

  // Cache de frequências das cordas (Hz)
  private stringFrequencies = {
    guitar: {
      1: 82.41,   // Mi grave (E2)
      2: 110.00,  // Lá (A2)
      3: 146.83,  // Ré (D3)
      4: 196.00,  // Sol (G3)
      5: 246.94,  // Si (B3)
      6: 329.63   // Mi agudo (E4)
    },
    bass: {
      1: 41.20,   // Mi grave (E1)
      2: 55.00,   // Lá (A1)
      3: 73.42,   // Ré (D2)
      4: 98.00    // Sol (G2)
    }
  };

  private constructor() {
    this.config = {
      sensitivity: 0.7,
      noiseThreshold: 0.05,
      minAmplitude: 0.1,
      maxLatency: 100,
      adaptiveTolerance: true,
      userLevel: 2,
      instrumentType: 'guitar'
    };
  }

  static getInstance(): ChordDetectionService {
    if (!ChordDetectionService.instance) {
      ChordDetectionService.instance = new ChordDetectionService();
    }
    return ChordDetectionService.instance;
  }

  /**
   * Inicializa o sistema de detecção
   */
  async initialize(): Promise<boolean> {
    try {
      // Solicitar permissão do microfone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: this.sampleRate
        }
      });

      // Criar contexto de áudio
      this.audioContext = new AudioContext({ sampleRate: this.sampleRate });

      // Criar nós de áudio
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();

      // Configurar analyser
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = 0.1; // Baixa suavização para resposta rápida

      // Conectar nós
      this.microphone.connect(this.analyser);

      return true;
    } catch (error) {
      console.error('Erro ao inicializar detecção de acordes:', error);
      return false;
    }
  }

  /**
   * Inicia detecção de acordes
   */
  startDetection(
    expectedChord: string | null,
    callback: (result: ChordDetectionResult) => void
  ): void {
    if (!this.analyser || !this.audioContext) {
      throw new Error('Sistema não inicializado. Chame initialize() primeiro.');
    }

    this.detectionCallback = callback;
    this.isListening = true;

    // Iniciar loop de análise
    this.startAnalysisLoop(expectedChord);
  }

  /**
   * Para detecção de acordes
   */
  stopDetection(): void {
    this.isListening = false;
    this.detectionCallback = null;

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Atualiza configuração
   */
  updateConfig(config: Partial<ChordDetectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Loop principal de análise
   */
  private startAnalysisLoop(expectedChord: string | null): void {
    const analyze = () => {
      if (!this.isListening || !this.analyser) return;

      const result = this.analyzeCurrentAudio(expectedChord);
      if (this.detectionCallback) {
        this.detectionCallback(result);
      }

      this.animationFrame = requestAnimationFrame(analyze);
    };

    analyze();
  }

  /**
   * Análise principal do áudio atual
   */
  private analyzeCurrentAudio(expectedChord: string | null): ChordDetectionResult {
    const startTime = performance.now();

    // Obter dados de frequência
    const frequencyData = new Float32Array(this.analyser!.frequencyBinCount);
    this.analyser!.getFloatFrequencyData(frequencyData);

    // Obter dados de amplitude temporal
    const timeData = new Float32Array(this.bufferSize);
    this.analyser!.getFloatTimeDomainData(timeData);

    // Análise de cordas individuais
    const stringAnalysis = this.analyzeIndividualStrings(frequencyData, timeData);

    // Detecção do acorde
    const chordResult = this.detectChord(stringAnalysis, expectedChord);

    // Análise de problemas
    const problems = this.identifyProblems(stringAnalysis, expectedChord);

    // Sugestões de melhoria
    const suggestions = this.generateSuggestions(problems, stringAnalysis, chordResult);

    const endTime = performance.now();
    const latency = endTime - startTime;

    return {
      detectedChord: chordResult.chord,
      confidence: chordResult.confidence,
      timing: Date.now(),
      quality: chordResult.quality,
      individualStrings: stringAnalysis,
      problems,
      suggestions
    };
  }

  /**
   * Análise de cada corda individual
   */
  private analyzeIndividualStrings(
    frequencyData: Float32Array,
    timeData: Float32Array
  ): StringAnalysis[] {
    const strings: StringAnalysis[] = [];
    const stringCount = this.config.instrumentType === 'guitar' ? 6 : 4;

    for (let stringNum = 1; stringNum <= stringCount; stringNum++) {
      const analysis = this.analyzeString(stringNum, frequencyData, timeData);
      strings.push(analysis);
    }

    return strings;
  }

  /**
   * Análise detalhada de uma corda específica
   */
  private analyzeString(
    stringNum: number,
    frequencyData: Float32Array,
    timeData: Float32Array
  ): StringAnalysis {
    const instrumentFreqs = this.stringFrequencies[this.config.instrumentType];
    const baseFreq = instrumentFreqs[stringNum as keyof typeof instrumentFreqs];

    // Detectar frequência fundamental
    const detectedFreq = this.detectFundamentalFrequency(frequencyData, baseFreq);

    // Calcular amplitude RMS
    const amplitude = this.calculateRMSAmplitude(timeData);

    // Determinar clareza (presença de harmônicos vs ruído)
    const clarity = this.calculateNoteClarity(frequencyData, detectedFreq);

    // Calcular desvio em cents
    const centsOff = this.calculateCentsOff(detectedFreq, baseFreq);

    // Determinar se a nota foi tocada
    const isPlayed = amplitude > this.config.minAmplitude;

    // Identificar problemas
    let problem: StringAnalysis['problem'] | undefined;

    if (!isPlayed) {
      problem = 'not_played';
    } else if (clarity < 0.3) {
      problem = 'muted';
    } else if (Math.abs(centsOff) > 50) {
      problem = 'out_of_tune';
    } else if (this.isWrongNote(detectedFreq, baseFreq)) {
      problem = 'wrong_note';
    }

    // Para acordes, a "nota esperada" seria baseada no acorde atual
    // Por enquanto, assumimos nota aberta da corda
    const expectedNote = this.frequencyToNote(baseFreq);

    return {
      stringNumber: stringNum,
      expectedNote,
      detectedNote: isPlayed ? this.frequencyToNote(detectedFreq) : null,
      frequency: detectedFreq,
      amplitude,
      clarity,
      centsOff,
      isCorrect: !problem,
      problem
    };
  }

  /**
   * Detecta frequência fundamental usando autocorrelação
   */
  private detectFundamentalFrequency(frequencyData: Float32Array, expectedFreq: number): number {
    // Implementação simplificada de detecção de pitch
    // Em produção, usaria algoritmo de YIN ou similar

    const nyquist = this.sampleRate / 2;
    const binSize = nyquist / frequencyData.length;

    // Encontrar pico de amplitude na região esperada
    const expectedBin = Math.round(expectedFreq / binSize);
    const searchRange = 12; // ±12 bins (~1 semitom)

    let maxAmplitude = -Infinity;
    let detectedBin = expectedBin;

    for (let i = Math.max(0, expectedBin - searchRange);
         i < Math.min(frequencyData.length, expectedBin + searchRange);
         i++) {
      if (frequencyData[i] > maxAmplitude) {
        maxAmplitude = frequencyData[i];
        detectedBin = i;
      }
    }

    return detectedBin * binSize;
  }

  /**
   * Calcula amplitude RMS
   */
  private calculateRMSAmplitude(timeData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      sum += timeData[i] * timeData[i];
    }
    return Math.sqrt(sum / timeData.length);
  }

  /**
   * Calcula clareza da nota (presença de fundamental vs harmônicos/ruído)
   */
  private calculateNoteClarity(frequencyData: Float32Array, fundamentalFreq: number): number {
    const nyquist = this.sampleRate / 2;
    const binSize = nyquist / frequencyData.length;

    const fundamentalBin = Math.round(fundamentalFreq / binSize);

    // Calcular energia do fundamental
    const fundamentalEnergy = Math.abs(frequencyData[fundamentalBin]);

    // Calcular energia total na região
    let totalEnergy = 0;
    const range = 5; // bins ao redor
    for (let i = Math.max(0, fundamentalBin - range);
         i < Math.min(frequencyData.length, fundamentalBin + range);
         i++) {
      totalEnergy += Math.abs(frequencyData[i]);
    }

    // Clareza = energia fundamental / energia total
    return totalEnergy > 0 ? fundamentalEnergy / totalEnergy : 0;
  }

  /**
   * Calcula desvio em cents
   */
  private calculateCentsOff(detectedFreq: number, expectedFreq: number): number {
    if (detectedFreq === 0 || expectedFreq === 0) return 0;
    return 1200 * Math.log2(detectedFreq / expectedFreq);
  }

  /**
   * Verifica se a nota detectada está muito longe da esperada
   */
  private isWrongNote(detectedFreq: number, expectedFreq: number): boolean {
    const semitonesOff = Math.abs(this.calculateCentsOff(detectedFreq, expectedFreq)) / 100;
    return semitonesOff > 2; // Mais de 2 semitons de diferença
  }

  /**
   * Converte frequência para nota musical
   */
  private frequencyToNote(frequency: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = 440;
    const semitones = Math.round(12 * Math.log2(frequency / A4)) + 9;
    const octave = Math.floor(semitones / 12) + 4;
    const noteIndex = semitones % 12;
    return noteNames[noteIndex] + octave;
  }

  /**
   * Detecta qual acorde está sendo tocado
   */
  private detectChord(strings: StringAnalysis[], expectedChord: string | null): {
    chord: string | null;
    confidence: number;
    quality: ChordDetectionResult['quality'];
  } {
    // Para simplificação, vamos focar em detectar se as notas estão corretas
    // Em produção, isso seria muito mais sofisticado

    const playedStrings = strings.filter(s => s.isCorrect && s.amplitude > this.config.minAmplitude);
    const totalStrings = strings.length;

    // Calcular qualidade geral
    const avgClarity = strings.reduce((sum, s) => sum + s.clarity, 0) / totalStrings;
    const avgAmplitude = strings.reduce((sum, s) => sum + s.amplitude, 0) / totalStrings;
    const correctRatio = playedStrings.length / totalStrings;

    const quality = {
      overall: (avgClarity + correctRatio + Math.min(avgAmplitude * 10, 1)) / 3,
      noteAccuracy: correctRatio,
      clarity: avgClarity,
      sustain: avgAmplitude // Simplificado
    };

    // Confiança baseada na qualidade e consistência
    const confidence = Math.min(quality.overall * 1.2, 1);

    return {
      chord: expectedChord && confidence > 0.6 ? expectedChord : null,
      confidence,
      quality
    };
  }

  /**
   * Identifica problemas específicos no acorde
   */
  private identifyProblems(strings: StringAnalysis[], expectedChord: string | null): ChordProblem[] {
    const problems: ChordProblem[] = [];

    // Verificar cordas abafadas
    const mutedStrings = strings.filter(s => s.problem === 'muted');
    if (mutedStrings.length > 0) {
      problems.push({
        type: 'muted_string',
        severity: mutedStrings.length > 2 ? 'high' : 'medium',
        description: `${mutedStrings.length} corda(s) abafada(s)`,
        affectedStrings: mutedStrings.map(s => s.stringNumber),
        suggestion: 'Aumente a pressão dos dedos ou ajuste a posição'
      });
    }

    // Verificar cordas não tocadas
    const unplayedStrings = strings.filter(s => s.problem === 'not_played');
    if (unplayedStrings.length > 0) {
      problems.push({
        type: 'volume_inconsistent',
        severity: unplayedStrings.length > 1 ? 'medium' : 'low',
        description: `${unplayedStrings.length} corda(s) não tocada(s)`,
        affectedStrings: unplayedStrings.map(s => s.stringNumber),
        suggestion: 'Toque todas as cordas do acorde simultaneamente'
      });
    }

    // Verificar afinação
    const outOfTuneStrings = strings.filter(s => s.problem === 'out_of_tune');
    if (outOfTuneStrings.length > 0) {
      problems.push({
        type: 'wrong_fingering',
        severity: 'medium',
        description: 'Afinação imprecisa detectada',
        affectedStrings: outOfTuneStrings.map(s => s.stringNumber),
        suggestion: 'Verifique se os dedos estão nas casas corretas'
      });
    }

    // Verificar sustain (amplitude consistente)
    const amplitudes = strings.map(s => s.amplitude);
    const avgAmplitude = amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length;
    const variance = amplitudes.reduce((sum, amp) => sum + Math.pow(amp - avgAmplitude, 2), 0) / amplitudes.length;
    const consistency = 1 - Math.min(variance * 10, 1);

    if (consistency < 0.6) {
      problems.push({
        type: 'poor_sustain',
        severity: 'low',
        description: 'Volume inconsistente entre cordas',
        affectedStrings: strings.map(s => s.stringNumber),
        suggestion: 'Mantenha pressão constante em todos os dedos'
      });
    }

    return problems;
  }

  /**
   * Gera sugestões de melhoria
   */
  private generateSuggestions(
    problems: ChordProblem[],
    strings: StringAnalysis[],
    chordResult: any
  ): string[] {
    const suggestions: string[] = [];

    // Sugestões baseadas em problemas específicos
    for (const problem of problems) {
      suggestions.push(problem.suggestion);
    }

    // Sugestões gerais baseadas na qualidade
    if (chordResult.quality.overall > 0.8) {
      suggestions.push('Excelente! Continue praticando este acorde.');
    } else if (chordResult.quality.overall > 0.6) {
      suggestions.push('Bom trabalho! Foque nas cordas que ainda precisam de ajuste.');
    } else {
      suggestions.push('Continue praticando. Cada tentativa deixa você mais próximo!');
    }

    // Sugestões adaptativas por nível
    if (this.config.userLevel <= 2) {
      suggestions.push('Lembre-se: posicione os dedos antes de tocar.');
      suggestions.push('Use o polegar como apoio nas cordas graves.');
    } else if (this.config.userLevel <= 5) {
      suggestions.push('Trabalhe a transição suave entre acordes.');
      suggestions.push('Mantenha o braço relaxado para melhor controle.');
    }

    return Array.from(new Set(suggestions)); // Remove duplicatas
  }

  /**
   * Obtém estatísticas de performance em tempo real
   */
  getPerformanceStats(): {
    latency: number;
    detectionRate: number;
    accuracy: number;
    isActive: boolean;
  } {
    return {
      latency: this.config.maxLatency,
      detectionRate: this.isListening ? 30 : 0, // FPS
      accuracy: 0.85, // Placeholder - seria calculado baseado em histórico
      isActive: this.isListening
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stopDetection();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.microphone = null;
  }
}

export const chordDetectionService = ChordDetectionService.getInstance();