/**
 * 🎧 Auditory Fatigue Reducer
 * 
 * Reduz fadiga auditiva em sessões longas através de:
 * - Microvariação controlada de sons repetidos
 * - Pausas auditivas naturais
 * - Limite de repetição idêntica
 * - Manutenção de previsibilidade
 * 
 * OBJETIVO:
 * - Evitar fadiga auditiva em sessões longas
 * - Manter previsibilidade pedagógica
 * - Variar apenas o necessário
 * 
 * REGRAS:
 * - NÃO randomizar de forma caótica
 * - NÃO alterar timbre base
 * - Variar apenas pitch, volume e timing de forma controlada
 * - Inserir pausas naturais após repetições
 */

type SoundIdentifier = string; // Ex: 'chord-C', 'note-C4', 'feedback-success'

interface SoundRepetition {
  soundId: SoundIdentifier;
  count: number;
  lastPlayed: number;
  lastVariation: number; // Última variação aplicada
}

interface VariationConfig {
  pitchVariation: number; // ±cents (100 cents = 1 semitom)
  volumeVariation: number; // ±percent (0.0 a 1.0)
  timingVariation: number; // ±ms
}

class AuditoryFatigueReducer {
  private repetitions: Map<SoundIdentifier, SoundRepetition> = new Map();
  private sessionStartTime: number = Date.now();
  
  // Configurações
  private readonly MAX_IDENTICAL_REPETITIONS = 5; // Máximo de repetições idênticas
  private readonly PAUSE_AFTER_REPETITIONS = 8; // Pausa após N repetições
  private readonly PAUSE_DURATION_MS = 2000; // 2 segundos de pausa
  private readonly VARIATION_RANGE = {
    pitch: 15, // ±15 cents (microvariação, imperceptível como mudança de nota)
    volume: 0.05, // ±5% de volume
    timing: 30, // ±30ms de timing
  };
  
  // Rastreamento de pausas
  private lastPauseTime: number = 0;
  private isInPause: boolean = false;

  /**
   * Calcula variação controlada para um som repetido
   * @param soundId - Identificador do som
   * @returns Variação a ser aplicada (ou null se deve pausar)
   */
  getVariation(soundId: SoundIdentifier): VariationConfig | null {
    const now = Date.now();
    const repetition = this.repetitions.get(soundId) || {
      soundId,
      count: 0,
      lastPlayed: 0,
      lastVariation: 0,
    };

    // Se está em pausa, verificar se já passou
    if (this.isInPause && (now - this.lastPauseTime) < this.PAUSE_DURATION_MS) {
      return null; // Ainda em pausa
    }

    // Pausa terminou
    if (this.isInPause) {
      this.isInPause = false;
      // Reset contador após pausa
      repetition.count = 0;
    }

    // Atualizar contador ANTES de verificar pausa
    repetition.count += 1;
    repetition.lastPlayed = now;

    // Verificar se deve pausar (após incrementar contador)
    if (this.shouldPause(repetition, now)) {
      this.isInPause = true;
      this.lastPauseTime = now;
      // Reset contador para próxima vez
      repetition.count = 0;
      this.repetitions.set(soundId, repetition);
      return null; // Indica que deve pausar
    }

    // Se excedeu limite de repetições idênticas, aplicar variação
    if (repetition.count > this.MAX_IDENTICAL_REPETITIONS) {
      // Calcular variação determinística (não aleatória)
      // Usa hash do soundId + count para garantir consistência
      const variationSeed = this.hashString(soundId + repetition.count);
      
      // Variação de pitch: ±15 cents (microvariação)
      const pitchVariation = ((variationSeed % 31) - 15) / 100; // -15 a +15 cents
      
      // Variação de volume: ±5%
      const volumeVariation = ((variationSeed % 11) - 5) / 100; // -5% a +5%
      
      // Variação de timing: ±30ms
      const timingVariation = ((variationSeed % 61) - 30); // -30ms a +30ms
      
      repetition.lastVariation = variationSeed;
      this.repetitions.set(soundId, repetition);
      
      return {
        pitchVariation,
        volumeVariation,
        timingVariation,
      };
    }

    // Sem variação ainda (dentro do limite)
    this.repetitions.set(soundId, repetition);
    return {
      pitchVariation: 0,
      volumeVariation: 0,
      timingVariation: 0,
    };
  }

  /**
   * Verifica se deve inserir pausa auditiva
   */
  private shouldPause(repetition: SoundRepetition, now: number): boolean {
    // Pausa após N repetições do mesmo som
    if (repetition.count >= this.PAUSE_AFTER_REPETITIONS) {
      // Verificar se já passou tempo suficiente desde última pausa
      if (now - this.lastPauseTime > this.PAUSE_DURATION_MS + 1000) {
        return true;
      }
    }
    return false;
  }

  /**
   * Hash simples para variação determinística
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Aplica variação a uma frequência (em Hz)
   */
  applyPitchVariation(baseFrequency: number, variation: VariationConfig): number {
    if (variation.pitchVariation === 0) return baseFrequency;
    
    // Converter cents para multiplicador
    // 1 cent = 2^(1/1200) ≈ 1.00057779
    const centsMultiplier = Math.pow(2, variation.pitchVariation / 1200);
    return baseFrequency * centsMultiplier;
  }

  /**
   * Aplica variação a um volume (0.0 a 1.0)
   */
  applyVolumeVariation(baseVolume: number, variation: VariationConfig): number {
    if (variation.volumeVariation === 0) return baseVolume;
    
    const adjusted = baseVolume * (1 + variation.volumeVariation);
    return Math.max(0, Math.min(1, adjusted)); // Clamp entre 0 e 1
  }

  /**
   * Aplica variação a um timing (em ms)
   */
  applyTimingVariation(baseTiming: number, variation: VariationConfig): number {
    return baseTiming + variation.timingVariation;
  }

  /**
   * Reseta contadores de repetição (útil para nova sessão)
   */
  reset(): void {
    this.repetitions.clear();
    this.sessionStartTime = Date.now();
    this.lastPauseTime = 0;
    this.isInPause = false;
  }

  /**
   * Reseta contador de um som específico
   */
  resetSound(soundId: SoundIdentifier): void {
    this.repetitions.delete(soundId);
  }

  /**
   * Retorna estatísticas de repetição
   */
  getStats(): { totalSounds: number; mostRepeated: SoundIdentifier | null } {
    let maxCount = 0;
    let mostRepeated: SoundIdentifier | null = null;
    
    this.repetitions.forEach((rep, soundId) => {
      if (rep.count > maxCount) {
        maxCount = rep.count;
        mostRepeated = soundId;
      }
    });
    
    return {
      totalSounds: this.repetitions.size,
      mostRepeated,
    };
  }
}

// Exportar instância singleton
export const auditoryFatigueReducer = new AuditoryFatigueReducer();
