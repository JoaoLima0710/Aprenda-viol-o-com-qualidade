/**
 * Detector de Acordes em Tempo Real - 2026
 * Sistema avançado para detecção precisa de acordes musicais
 * com feedback acionável e baixa latência
 */

export interface ChordDetectionResult {
  detectedChord: string | null;
  confidence: number; // 0-1
  notesDetected: string[];
  expectedChord: string;
  accuracy: number; // 0-1
  issues: ChordIssue[];
  suggestions: string[];
  timestamp: number;
  processingTime: number; // ms
}

export interface ChordIssue {
  type: 'muted_string' | 'wrong_finger_position' | 'insufficient_pressure' | 'incorrect_note' | 'buzz' | 'timing';
  severity: 'low' | 'medium' | 'high';
  string?: number; // 1-6 (cordas da guitarra)
  description: string;
  actionableFix: string;
}

export interface ChordDetectionConfig {
  sensitivity: number; // 0-1, quanto mais alto mais permissivo
  minConfidence: number; // 0-1, confiança mínima para aceitar detecção
  maxLatency: number; // ms, latência máxima aceitável
  noiseThreshold: number; // nível de ruído para ignorar
  feedbackMode: 'strict' | 'encouraging' | 'adaptive';
  instrument: 'guitar' | 'ukulele' | 'bass';
}

export interface RealTimeChordFeedback {
  status: 'listening' | 'detecting' | 'success' | 'error';
  chordName: string;
  visualFeedback: {
    correctNotes: number[];
    incorrectNotes: number[];
    mutedStrings: number[];
    stringColors: Array<'green' | 'red' | 'yellow' | 'gray'>;
  };
  audioFeedback: {
    playCorrectChord: boolean;
    highlightErrors: boolean;
    successSound: boolean;
  };
  message: string;
  encouragement: string;
}

export class ChordDetectorService {
  private static instance: ChordDetectorService;

  private config: ChordDetectionConfig = {
    sensitivity: 0.7,
    minConfidence: 0.6,
    maxLatency: 150, // 150ms para feedback instantâneo
    noiseThreshold: 0.05,
    feedbackMode: 'adaptive',
    instrument: 'guitar'
  };

  // Definição de acordes com suas frequências fundamentais e harmônicos
  private chordDefinitions: Record<string, {
    root: string;
    quality: string;
    notes: string[]; // Notas que devem estar presentes
    fundamentalFreqs: number[]; // Frequências fundamentais esperadas
    harmonics: number[][]; // Padrões harmônicos característicos
    commonIssues: ChordIssue[];
  }> = {
    'C': {
      root: 'C',
      quality: 'major',
      notes: ['C4', 'E4', 'G4'],
      fundamentalFreqs: [261.63, 329.63, 392.00], // C4, E4, G4
      harmonics: [
        [523.25, 1046.50], // C5, C6
        [659.25, 1318.51], // E5, E6
        [783.99, 1567.98]  // G5, G6
      ],
      commonIssues: [
        {
          type: 'muted_string',
          severity: 'high',
          string: 2,
          description: 'Corda A (2ª corda) não está soando',
          actionableFix: 'Pressione mais forte o dedo no 1º traste da 2ª corda'
        },
        {
          type: 'wrong_finger_position',
          severity: 'medium',
          string: 5,
          description: 'Dedo não está no traste correto na corda D',
          actionableFix: 'Mova o dedo indicador para o 3º traste da corda D'
        }
      ]
    },
    'G': {
      root: 'G',
      quality: 'major',
      notes: ['G3', 'B3', 'D4', 'G4'],
      fundamentalFreqs: [196.00, 246.94, 293.66, 392.00], // G3, B3, D4, G4
      harmonics: [
        [392.00, 783.99], // G4, G5
        [493.88, 987.77], // B4, B5
        [587.33, 1174.66] // D5, D6
      ],
      commonIssues: [
        {
          type: 'insufficient_pressure',
          severity: 'high',
          string: 6,
          description: 'Corda mais grave não está soando claramente',
          actionableFix: 'Pressione a corda mais grossa (6ª corda) com mais força'
        }
      ]
    },
    'Am': {
      root: 'A',
      quality: 'minor',
      notes: ['A3', 'C4', 'E4', 'A4'],
      fundamentalFreqs: [220.00, 261.63, 329.63, 440.00], // A3, C4, E4, A4
      harmonics: [
        [440.00, 880.00], // A4, A5
        [523.25, 1046.50], // C5, C6
        [659.25, 1318.51]  // E5, E6
      ],
      commonIssues: [
        {
          type: 'muted_string',
          severity: 'medium',
          string: 4,
          description: 'Corda D (4ª corda) está abafada',
          actionableFix: 'Certifique-se de que todos os dedos estão pressionando corretamente'
        }
      ]
    },
    'F': {
      root: 'F',
      quality: 'major',
      notes: ['F3', 'A3', 'C4', 'F4'],
      fundamentalFreqs: [174.61, 220.00, 261.63, 349.23], // F3, A3, C4, F4
      harmonics: [
        [349.23, 698.46], // F4, F5
        [440.00, 880.00], // A4, A5
        [523.25, 1046.50] // C5, C6
      ],
      commonIssues: [
        {
          type: 'wrong_finger_position',
          severity: 'high',
          string: 6,
          description: 'Dedo não está barrando corretamente',
          actionableFix: 'Certifique-se de que o dedo indicador barra todas as cordas no 1º traste'
        },
        {
          type: 'insufficient_pressure',
          severity: 'medium',
          description: 'Pressão insuficiente no barré',
          actionableFix: 'Aumente a pressão do dedo indicador e incline a mão'
        }
      ]
    },
    'Em': {
      root: 'E',
      quality: 'minor',
      notes: ['E3', 'B3', 'E4', 'G4'],
      fundamentalFreqs: [164.81, 246.94, 329.63, 392.00], // E3, B3, E4, G4
      harmonics: [
        [329.63, 659.25], // E4, E5
        [493.88, 987.77], // B4, B5
        [783.99, 1567.98] // G5, G6
      ],
      commonIssues: [
        {
          type: 'muted_string',
          severity: 'low',
          string: 5,
          description: 'Corda A está levemente abafada',
          actionableFix: 'Ajuste a posição dos dedos para tocar todas as cordas'
        }
      ]
    }
  };

  // Cache para detecções recentes (para reduzir latência)
  private detectionCache = new Map<string, ChordDetectionResult>();
  private lastDetectionTime = 0;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): ChordDetectorService {
    if (!ChordDetectorService.instance) {
      ChordDetectorService.instance = new ChordDetectorService();
    }
    return ChordDetectorService.instance;
  }

  /**
   * Inicializa o detector de acordes
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Solicitar permissão de microfone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      // Criar contexto de áudio
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();

      // Configurar analyser para análise em tempo real
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.1; // Baixo smoothing para resposta rápida
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

      // Conectar microfone
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      this.isInitialized = true;
    } catch (error) {
      console.error('Erro ao inicializar detector de acordes:', error);
      throw new Error('Não foi possível acessar o microfone');
    }
  }

  /**
   * Detecta acorde em tempo real
   */
  async detectChord(
    expectedChord: string,
    audioBuffer?: Float32Array
  ): Promise<ChordDetectionResult> {
    const startTime = performance.now();

    if (!this.isInitialized || !this.analyser) {
      throw new Error('Detector não inicializado');
    }

    // Usar buffer fornecido ou capturar em tempo real
    const buffer = audioBuffer || this.captureAudioBuffer();

    // Análise espectral
    const frequencyData = this.performFFT(buffer);

    // Detectar notas presentes
    const detectedNotes = this.detectNotesFromSpectrum(frequencyData);

    // Comparar com acordes conhecidos
    const detectionResult = this.matchChord(detectedNotes, expectedChord);

    // Identificar problemas específicos
    const issues = this.identifyIssues(detectedNotes, expectedChord, buffer);

    // Gerar sugestões acionáveis
    const suggestions = this.generateSuggestions(issues, detectionResult);

    const processingTime = performance.now() - startTime;

    const result: ChordDetectionResult = {
      detectedChord: detectionResult.chord,
      confidence: detectionResult.confidence,
      notesDetected: detectedNotes,
      expectedChord,
      accuracy: detectionResult.accuracy,
      issues,
      suggestions,
      timestamp: Date.now(),
      processingTime
    };

    // Cache para reduzir latência em detecções similares
    this.detectionCache.set(expectedChord, result);
    this.lastDetectionTime = Date.now();

    return result;
  }

  /**
   * Fornece feedback em tempo real para interface
   */
  async getRealTimeFeedback(
    expectedChord: string,
    detectionResult: ChordDetectionResult
  ): Promise<RealTimeChordFeedback> {
    const chordDef = this.chordDefinitions[expectedChord];
    if (!chordDef) {
      return {
        status: 'error',
        chordName: expectedChord,
        visualFeedback: {
          correctNotes: [],
          incorrectNotes: [],
          mutedStrings: [],
          stringColors: ['gray', 'gray', 'gray', 'gray', 'gray', 'gray']
        },
        audioFeedback: {
          playCorrectChord: false,
          highlightErrors: false,
          successSound: false
        },
        message: 'Acorde não reconhecido',
        encouragement: 'Vamos tentar um acorde mais simples primeiro'
      };
    }

    // Determinar status baseado na confiança e precisão
    let status: RealTimeChordFeedback['status'] = 'detecting';
    if (detectionResult.confidence > 0.8 && detectionResult.accuracy > 0.8) {
      status = 'success';
    } else if (detectionResult.confidence < 0.3) {
      status = 'listening';
    }

    // Feedback visual por corda
    const stringColors = this.calculateStringColors(detectionResult, expectedChord);
    const visualFeedback = {
      correctNotes: detectionResult.issues.filter(i => i.severity === 'low').map(i => i.string || 0),
      incorrectNotes: detectionResult.issues.filter(i => i.severity === 'high').map(i => i.string || 0),
      mutedStrings: detectionResult.issues.filter(i => i.type === 'muted_string').map(i => i.string || 0),
      stringColors
    };

    // Feedback de áudio
    const audioFeedback = {
      playCorrectChord: status === 'success' && this.config.feedbackMode === 'encouraging',
      highlightErrors: detectionResult.issues.length > 0,
      successSound: status === 'success'
    };

    // Mensagem principal
    const message = this.generateMainMessage(detectionResult, expectedChord);

    // Mensagem de encorajamento
    const encouragement = this.generateEncouragement(detectionResult);

    return {
      status,
      chordName: expectedChord,
      visualFeedback,
      audioFeedback,
      message,
      encouragement
    };
  }

  /**
   * Configura parâmetros do detector
   */
  updateConfig(newConfig: Partial<ChordDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): ChordDetectionConfig {
    return { ...this.config };
  }

  /**
   * Limpa cache e reinicializa
   */
  reset(): void {
    this.detectionCache.clear();
    this.lastDetectionTime = 0;
    this.isInitialized = false;

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  // Private methods

  private captureAudioBuffer(): Float32Array {
    if (!this.analyser) throw new Error('Analyser not initialized');

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    this.analyser.getFloatFrequencyData(dataArray);

    return dataArray;
  }

  private performFFT(audioBuffer: Float32Array): Float32Array {
    // Simplified FFT - in production would use a proper FFT library
    // This is a basic frequency domain representation
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const fftSize = 2048;
    const frequencyData = new Float32Array(fftSize / 2);

    // Simple peak detection (not a real FFT)
    for (let i = 0; i < audioBuffer.length; i++) {
      const frequency = (i * sampleRate) / audioBuffer.length;
      const magnitude = Math.abs(audioBuffer[i]);

      if (frequency > 80 && frequency < 1000) { // Guitar frequency range
        const binIndex = Math.floor((frequency / (sampleRate / 2)) * (fftSize / 2));
        if (binIndex < frequencyData.length) {
          frequencyData[binIndex] = Math.max(frequencyData[binIndex], magnitude);
        }
      }
    }

    return frequencyData;
  }

  private detectNotesFromSpectrum(frequencyData: Float32Array): string[] {
    const detectedNotes: string[] = [];
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const threshold = this.config.noiseThreshold;

    // Find peaks in frequency spectrum
    for (let i = 1; i < frequencyData.length - 1; i++) {
      const frequency = (i * sampleRate) / (2 * frequencyData.length);
      const magnitude = frequencyData[i];

      if (magnitude > threshold &&
          magnitude > frequencyData[i - 1] &&
          magnitude > frequencyData[i + 1]) {

        const note = this.frequencyToNote(frequency);
        if (note && !detectedNotes.includes(note)) {
          detectedNotes.push(note);
        }
      }
    }

    return detectedNotes.slice(0, 6); // Maximum 6 strings
  }

  private matchChord(detectedNotes: string[], expectedChord: string): {
    chord: string | null;
    confidence: number;
    accuracy: number;
  } {
    const chordDef = this.chordDefinitions[expectedChord];
    if (!chordDef) {
      return { chord: null, confidence: 0, accuracy: 0 };
    }

    // Check if expected notes are present
    const expectedNotes = chordDef.notes;
    const matchedNotes = detectedNotes.filter(note =>
      expectedNotes.some(expected => this.notesMatch(note, expected))
    );

    const accuracy = matchedNotes.length / expectedNotes.length;
    const confidence = Math.min(accuracy * 1.2, 1); // Bonus for high accuracy

    // Consider it a match if accuracy is above threshold
    const chord = accuracy >= this.config.minConfidence ? expectedChord : null;

    return { chord, confidence, accuracy };
  }

  private identifyIssues(
    detectedNotes: string[],
    expectedChord: string,
    audioBuffer: Float32Array
  ): ChordIssue[] {
    const issues: ChordIssue[] = [];
    const chordDef = this.chordDefinitions[expectedChord];

    if (!chordDef) return issues;

    // Check for muted strings
    for (let i = 0; i < chordDef.notes.length; i++) {
      const expectedNote = chordDef.notes[i];
      const isDetected = detectedNotes.some(note => this.notesMatch(note, expectedNote));

      if (!isDetected) {
        const issue = chordDef.commonIssues.find(issue =>
          issue.string === (i + 1) || issue.type === 'muted_string'
        ) || {
          type: 'muted_string' as const,
          severity: 'medium' as const,
          string: i + 1,
          description: `Corda ${i + 1} não está soando`,
          actionableFix: `Verifique se o dedo está pressionando corretamente a corda ${i + 1}`
        };

        issues.push(issue);
      }
    }

    // Check for buzz (rapid amplitude changes)
    const buzzDetected = this.detectBuzz(audioBuffer);
    if (buzzDetected.strings.length > 0) {
      buzzDetected.strings.forEach(stringIndex => {
        issues.push({
          type: 'buzz',
          severity: 'high',
          string: stringIndex + 1,
          description: `Corda ${stringIndex + 1} está vibrando excessivamente (buzz)`,
          actionableFix: `Reduza a pressão do dedo ou ajuste a posição na corda ${stringIndex + 1}`
        });
      });
    }

    // Check for timing issues (chord not sustained)
    const sustainQuality = this.analyzeSustain(audioBuffer);
    if (sustainQuality < 0.6) {
      issues.push({
        type: 'timing',
        severity: 'medium',
        description: 'O acorde não foi sustentado por tempo suficiente',
        actionableFix: 'Mantenha o acorde pressionado por pelo menos 2 segundos'
      });
    }

    return issues;
  }

  private generateSuggestions(issues: ChordIssue[], detection: any): string[] {
    const suggestions: string[] = [];

    if (issues.length === 0 && detection.accuracy > 0.8) {
      suggestions.push('Excelente! Continue praticando este acorde.');
      suggestions.push('Tente tocar o acorde mais rápido agora.');
    }

    // Group issues by type and provide consolidated suggestions
    const mutedStrings = issues.filter(i => i.type === 'muted_string');
    if (mutedStrings.length > 0) {
      suggestions.push(`Foque nas cordas: ${mutedStrings.map(i => i.string).join(', ')}`);
      suggestions.push('Certifique-se de que todos os dedos estão tocando as cordas');
    }

    const buzzIssues = issues.filter(i => i.type === 'buzz');
    if (buzzIssues.length > 0) {
      suggestions.push('Reduza a pressão dos dedos para evitar vibração');
      suggestions.push('Verifique se está tocando exatamente no traste');
    }

    const positionIssues = issues.filter(i => i.type === 'wrong_finger_position');
    if (positionIssues.length > 0) {
      suggestions.push('Verifique o diagrama e ajuste a posição dos dedos');
      suggestions.push('Use um espelho para ver sua mão enquanto toca');
    }

    return suggestions;
  }

  private calculateStringColors(
    detection: ChordDetectionResult,
    expectedChord: string
  ): Array<'green' | 'red' | 'yellow' | 'gray'> {
    const colors: Array<'green' | 'red' | 'yellow' | 'gray'> = ['gray', 'gray', 'gray', 'gray', 'gray', 'gray'];
    const chordDef = this.chordDefinitions[expectedChord];

    if (!chordDef) return colors;

    // Set colors based on detection accuracy
    detection.issues.forEach(issue => {
      if (issue.string && issue.string >= 1 && issue.string <= 6) {
        const stringIndex = issue.string - 1;

        switch (issue.severity) {
          case 'high':
            colors[stringIndex] = 'red';
            break;
          case 'medium':
            colors[stringIndex] = 'yellow';
            break;
          case 'low':
            colors[stringIndex] = 'green';
            break;
        }
      }
    });

    // Mark correct strings as green
    if (detection.accuracy > 0.7) {
      chordDef.notes.forEach((_, index) => {
        if (index < colors.length) {
          colors[index] = 'green';
        }
      });
    }

    return colors;
  }

  private generateMainMessage(detection: ChordDetectionResult, expectedChord: string): string {
    if (detection.accuracy > 0.9) {
      return `🎸 ${expectedChord} perfeito!`;
    } else if (detection.accuracy > 0.7) {
      return `👍 ${expectedChord} quase lá!`;
    } else if (detection.accuracy > 0.4) {
      return `🔧 ${expectedChord} precisa de ajustes`;
    } else {
      return `🎯 Tente tocar ${expectedChord} novamente`;
    }
  }

  private generateEncouragement(detection: ChordDetectionResult): string {
    if (detection.accuracy > 0.8) {
      return 'Você está tocando cada vez melhor! Continue assim! 🎉';
    } else if (detection.accuracy > 0.5) {
      return 'Você está no caminho certo. Pratique mais um pouco! 💪';
    } else {
      return 'Não desanime! Todo mundo começa assim. Vamos tentar de novo! 🌟';
    }
  }

  // Utility methods

  private frequencyToNote(frequency: number): string | null {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = 440;

    if (frequency <= 0) return null;

    const semitones = Math.round(12 * Math.log2(frequency / A4));
    const noteIndex = (semitones % 12 + 12) % 12;
    const octave = Math.floor((semitones + 9) / 12) + 4;

    return noteNames[noteIndex] + octave;
  }

  private notesMatch(note1: string, note2: string): boolean {
    // Simple note matching (ignores octave for now)
    const note1Base = note1.replace(/\d/, '');
    const note2Base = note2.replace(/\d/, '');
    return note1Base === note2Base;
  }

  private detectBuzz(audioBuffer: Float32Array): { detected: boolean; strings: number[] } {
    // Simplified buzz detection based on amplitude variations
    const threshold = 0.3; // High variation threshold
    let maxVariation = 0;
    const windowSize = 256;

    for (let i = 0; i < audioBuffer.length - windowSize; i += windowSize) {
      const window = audioBuffer.slice(i, i + windowSize);
      const variation = this.calculateVariation(window);
      maxVariation = Math.max(maxVariation, variation);
    }

    return {
      detected: maxVariation > threshold,
      strings: maxVariation > threshold ? [0, 1, 2] : [] // Assume first 3 strings
    };
  }

  private analyzeSustain(audioBuffer: Float32Array): number {
    // Analyze if the chord is sustained consistently
    const chunks = 10;
    const chunkSize = Math.floor(audioBuffer.length / chunks);
    let totalAmplitude = 0;
    let consistentChunks = 0;

    for (let i = 0; i < chunks; i++) {
      const chunk = audioBuffer.slice(i * chunkSize, (i + 1) * chunkSize);
      const amplitude = this.calculateRMS(chunk);

      if (amplitude > 0.1) { // Above noise threshold
        totalAmplitude += amplitude;
        consistentChunks++;
      }
    }

    return consistentChunks / chunks; // Percentage of sustained chunks
  }

  private calculateVariation(buffer: Float32Array): number {
    let sum = 0;
    let sumSquares = 0;

    for (const value of buffer) {
      sum += value;
      sumSquares += value * value;
    }

    const mean = sum / buffer.length;
    const variance = (sumSquares / buffer.length) - (mean * mean);

    return Math.sqrt(variance);
  }

  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (const value of buffer) {
      sum += value * value;
    }
    return Math.sqrt(sum / buffer.length);
  }
}

export const chordDetectorService = ChordDetectorService.getInstance();