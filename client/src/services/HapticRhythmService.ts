/**
 * Haptic Rhythm Service - 2026 Edition
 * Sistema de feedback háptico rítmico para metrônomo
 */

export interface RhythmPattern {
  bpm: number;
  timeSignature: '4/4' | '3/4' | '6/8' | '2/4';
  accentPattern: number[]; // quais batidas são acentuadas (1-indexed)
  subdivision: 'quarter' | 'eighth' | 'sixteenth';
  intensity: 'subtle' | 'normal' | 'strong';
}

export interface HapticConfig {
  enabled: boolean;
  vibrationSupported: boolean;
  pattern: RhythmPattern;
  continuousMode: boolean; // vibração contínua vs. apenas batidas
  adaptiveIntensity: boolean; // ajustar intensidade baseada na performance
  visualFeedback: boolean; // feedback visual simultâneo
}

class HapticRhythmService {
  private config: HapticConfig = {
    enabled: true,
    vibrationSupported: false,
    pattern: {
      bpm: 120,
      timeSignature: '4/4',
      accentPattern: [1], // primeira batida sempre acentuada
      subdivision: 'quarter',
      intensity: 'normal'
    },
    continuousMode: false,
    adaptiveIntensity: false,
    visualFeedback: true
  };

  private intervalId: NodeJS.Timeout | null = null;
  private currentBeat = 0;
  private isPlaying = false;
  private onBeatCallback: ((beat: number, isAccent: boolean) => void) | null = null;

  constructor() {
    this.checkVibrationSupport();
  }

  /**
   * Verifica suporte à vibração
   */
  private checkVibrationSupport(): void {
    this.config.vibrationSupported = 'vibrate' in navigator;
  }

  /**
   * Inicia o metrônomo háptico
   */
  start(pattern?: Partial<RhythmPattern>): void {
    if (pattern) {
      this.config.pattern = { ...this.config.pattern, ...pattern };
    }

    if (!this.config.enabled || !this.config.vibrationSupported) {
      console.warn('Haptic feedback not supported or disabled');
      return;
    }

    this.isPlaying = true;
    this.currentBeat = 0;

    this.startRhythmLoop();
  }

  /**
   * Para o metrônomo háptico
   */
  stop(): void {
    this.isPlaying = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Parar qualquer vibração em andamento
    if (this.config.vibrationSupported) {
      navigator.vibrate(0);
    }
  }

  /**
   * Atualiza padrão rítmico
   */
  updatePattern(pattern: Partial<RhythmPattern>): void {
    this.config.pattern = { ...this.config.pattern, ...pattern };

    if (this.isPlaying) {
      this.stop();
      this.start();
    }
  }

  /**
   * Define callback para batidas
   */
  onBeat(callback: (beat: number, isAccent: boolean) => void): void {
    this.onBeatCallback = callback;
  }

  /**
   * Ativa/desativa feedback háptico
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;

    if (!enabled) {
      this.stop();
    }
  }

  /**
   * Ativa/desativa modo contínuo
   */
  setContinuousMode(enabled: boolean): void {
    this.config.continuousMode = enabled;
  }

  /**
   * Ativa/desativa intensidade adaptativa
   */
  setAdaptiveIntensity(enabled: boolean): void {
    this.config.adaptiveIntensity = enabled;
  }

  /**
   * Feedback háptico único (para confirmações)
   */
  singleVibration(duration: number = 50, intensity: 'subtle' | 'normal' | 'strong' = 'normal'): void {
    if (!this.config.enabled || !this.config.vibrationSupported) return;

    const durationMap = {
      subtle: 30,
      normal: 50,
      strong: 100
    };

    navigator.vibrate(durationMap[intensity]);
  }

  /**
   * Sequência de vibrações (para erros ou sucessos)
   */
  vibrationSequence(pattern: number[]): void {
    if (!this.config.enabled || !this.config.vibrationSupported) return;

    navigator.vibrate(pattern);
  }

  /**
   * Feedback háptico contextual baseado na performance
   */
  performanceFeedback(accuracy: number, type: 'chord' | 'rhythm' | 'pitch'): void {
    if (!this.config.enabled || !this.config.vibrationSupported) return;

    if (accuracy > 0.9) {
      // Sucesso perfeito - vibração curta e suave
      this.singleVibration(30, 'subtle');
    } else if (accuracy > 0.7) {
      // Bom - vibração normal
      this.singleVibration(50, 'normal');
    } else if (accuracy > 0.5) {
      // Regular - vibração mais longa
      this.singleVibration(80, 'normal');
    } else {
      // Ruim - padrão de erro (duas vibrações curtas)
      this.vibrationSequence([50, 50, 50]);
    }
  }

  /**
   * Obtém status atual
   */
  getStatus(): {
    isPlaying: boolean;
    currentBeat: number;
    pattern: RhythmPattern;
    supported: boolean;
    enabled: boolean;
  } {
    return {
      isPlaying: this.isPlaying,
      currentBeat: this.currentBeat,
      pattern: this.config.pattern,
      supported: this.config.vibrationSupported,
      enabled: this.config.enabled
    };
  }

  /**
   * Obtém configurações atuais
   */
  getConfig(): HapticConfig {
    return { ...this.config };
  }

  // ========== MÉTODOS PRIVADOS ==========

  private startRhythmLoop(): void {
    const { bpm, timeSignature, accentPattern, subdivision, intensity } = this.config.pattern;

    // Calcular duração entre batidas em ms
    const beatsPerMinute = bpm;
    const subdivisionMultiplier = {
      quarter: 1,
      eighth: 2,
      sixteenth: 4
    };

    const effectiveBPM = beatsPerMinute * subdivisionMultiplier[subdivision];
    const intervalMs = (60 / effectiveBPM) * 1000;

    // Obter número de batidas por compasso
    const beatsPerMeasure = this.getBeatsPerMeasure(timeSignature);

    this.intervalId = setInterval(() => {
      if (!this.isPlaying) return;

      const isAccent = accentPattern.includes(this.currentBeat + 1);
      const vibrationDuration = this.getVibrationDuration(intensity, isAccent);

      // Vibração háptica
      if (this.config.vibrationSupported) {
        if (this.config.continuousMode) {
          // Vibração contínua suave
          navigator.vibrate(0); // Para vibração anterior
          navigator.vibrate(vibrationDuration);
        } else {
          // Apenas nas batidas
          navigator.vibrate(vibrationDuration);
        }
      }

      // Feedback visual simultâneo
      if (this.config.visualFeedback) {
        this.triggerVisualFeedback(isAccent);
      }

      // Callback para componentes
      this.onBeatCallback?.(this.currentBeat, isAccent);

      // Próxima batida
      this.currentBeat = (this.currentBeat + 1) % beatsPerMeasure;
    }, intervalMs);
  }

  private getBeatsPerMeasure(timeSignature: string): number {
    const measures: Record<string, number> = {
      '4/4': 4,
      '3/4': 3,
      '6/8': 6,
      '2/4': 2
    };
    return measures[timeSignature] || 4;
  }

  private getVibrationDuration(intensity: string, isAccent: boolean): number {
    const baseDurations = {
      subtle: 30,
      normal: 50,
      strong: 100
    };

    let duration = baseDurations[intensity as keyof typeof baseDurations] || 50;

    // Aumentar para batidas acentuadas
    if (isAccent) {
      duration *= 1.5;
    }

    return Math.round(duration);
  }

  private triggerVisualFeedback(isAccent: boolean): void {
    // Criar efeito visual pulsante na borda da tela
    const pulseColor = isAccent ? '#FFD700' : '#00FFFF';
    const pulseIntensity = isAccent ? '0.6' : '0.3';

    // Adicionar classe CSS temporária
    document.body.classList.add('haptic-pulse');

    // Criar estilo dinâmico
    const style = document.createElement('style');
    style.textContent = `
      .haptic-pulse {
        box-shadow: inset 0 0 20px rgba(${isAccent ? '255, 215, 0' : '0, 255, 255'}, ${pulseIntensity}) !important;
        transition: box-shadow 0.1s ease-out !important;
      }
    `;
    document.head.appendChild(style);

    // Remover após 100ms
    setTimeout(() => {
      document.body.classList.remove('haptic-pulse');
      document.head.removeChild(style);
    }, 100);
  }

  /**
   * Predefinições de padrões rítmicos para gêneros musicais
   */
  getPresetPatterns(): Record<string, RhythmPattern> {
    return {
      rock: {
        bpm: 120,
        timeSignature: '4/4',
        accentPattern: [1, 3], // Backbeat
        subdivision: 'quarter',
        intensity: 'normal'
      },
      samba: {
        bpm: 100,
        timeSignature: '2/4',
        accentPattern: [1],
        subdivision: 'quarter',
        intensity: 'strong'
      },
      bossaNova: {
        bpm: 130,
        timeSignature: '4/4',
        accentPattern: [1, 3],
        subdivision: 'eighth',
        intensity: 'subtle'
      },
      funk: {
        bpm: 110,
        timeSignature: '4/4',
        accentPattern: [1, 3],
        subdivision: 'eighth',
        intensity: 'strong'
      },
      ballad: {
        bpm: 70,
        timeSignature: '4/4',
        accentPattern: [1],
        subdivision: 'quarter',
        intensity: 'subtle'
      }
    };
  }

  /**
   * Aplica predefinição
   */
  applyPreset(presetName: string): void {
    const presets = this.getPresetPatterns();
    const preset = presets[presetName];

    if (preset) {
      this.updatePattern(preset);
    }
  }
}

export const hapticRhythmService = new HapticRhythmService();
