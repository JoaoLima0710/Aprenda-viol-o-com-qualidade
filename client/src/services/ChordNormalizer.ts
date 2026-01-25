/**
 * ChordNormalizer
 * 
 * Normaliza volume e aplica envelope consistente para samples de acordes.
 * 
 * OBJETIVO:
 * - Eliminar variações de loudness entre acordes
 * - Tornar referência sonora confiável
 * 
 * REGRAS:
 * - NÃO troca samples
 * - NÃO cria novos canais
 * - Usa AudioBus + AudioMixer existentes
 * 
 * FUNCIONALIDADES:
 * 1. Normalização de ganho por RMS
 * 2. Envelope ADSR padrão
 * 3. Volume máximo consistente
 */

/**
 * Parâmetros do envelope ADSR padrão para acordes
 */
const ADSR_ENVELOPE = {
  attack: 0.01,   // 10ms - ataque rápido para acordes
  decay: 0.05,    // 50ms - decay curto
  sustain: 0.85,  // 85% - sustain level
  release: 0.3,   // 300ms - release suave
};

/**
 * Target RMS para normalização (em dB)
 * Todos os acordes serão normalizados para este nível
 */
const TARGET_RMS_DB = -18; // -18 dB RMS (nível confortável e consistente)

/**
 * Target peak level (em dB)
 * Garante que nenhum acorde ultrapasse este nível
 */
const TARGET_PEAK_DB = -1; // -1 dBFS (evita clipping)

class ChordNormalizer {
  private chordGains: Map<string, number> = new Map();
  private analyzedChords: Set<string> = new Set();

  /**
   * Analisa um AudioBuffer e calcula o ganho de normalização necessário
   * @param buffer AudioBuffer a ser analisado
   * @param chordName Nome do acorde (para cache)
   * @returns Ganho de normalização (0.0 a 1.0+)
   */
  public analyzeAndNormalize(buffer: AudioBuffer, chordName?: string): number {
    // Se já analisamos este acorde, retornar ganho em cache
    if (chordName && this.chordGains.has(chordName)) {
      return this.chordGains.get(chordName)!;
    }

    try {
      // Calcular RMS do buffer
      const rms = this.calculateRMS(buffer);
      const rmsDb = this.linearToDb(rms);

      // Calcular peak do buffer
      const peak = this.calculatePeak(buffer);
      const peakDb = this.linearToDb(peak);

      // Calcular ganho necessário para normalizar RMS
      const rmsGainDb = TARGET_RMS_DB - rmsDb;
      const rmsGain = this.dbToLinear(rmsGainDb);

      // Calcular ganho máximo permitido para não ultrapassar peak target
      const peakGainDb = TARGET_PEAK_DB - peakDb;
      const peakGain = this.dbToLinear(peakGainDb);

      // Usar o menor ganho (mais conservador) para evitar clipping
      const finalGain = Math.min(rmsGain, peakGain);

      // Limitar ganho entre 0.1 e 2.0 (evita ganhos extremos)
      const clampedGain = Math.max(0.1, Math.min(2.0, finalGain));

      // Cache do ganho se chordName foi fornecido
      if (chordName) {
        this.chordGains.set(chordName, clampedGain);
        this.analyzedChords.add(chordName);
      }

      console.log(`[ChordNormalizer] ${chordName || 'Buffer'}: RMS=${rmsDb.toFixed(2)}dB, Peak=${peakDb.toFixed(2)}dB, Gain=${clampedGain.toFixed(3)}`);

      return clampedGain;
    } catch (error) {
      console.error('[ChordNormalizer] Erro ao analisar buffer:', error);
      return 1.0; // Fallback: sem normalização
    }
  }

  /**
   * Calcula o RMS (Root Mean Square) de um AudioBuffer
   */
  private calculateRMS(buffer: AudioBuffer): number {
    const channelData = buffer.getChannelData(0); // Usar primeiro canal
    const length = channelData.length;
    
    let sumSquares = 0;
    for (let i = 0; i < length; i++) {
      const sample = channelData[i];
      sumSquares += sample * sample;
    }
    
    return Math.sqrt(sumSquares / length);
  }

  /**
   * Calcula o peak (valor absoluto máximo) de um AudioBuffer
   */
  private calculatePeak(buffer: AudioBuffer): number {
    const channelData = buffer.getChannelData(0); // Usar primeiro canal
    let peak = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      const absValue = Math.abs(channelData[i]);
      if (absValue > peak) {
        peak = absValue;
      }
    }
    
    return peak;
  }

  /**
   * Converte valor linear para dB
   */
  private linearToDb(linear: number): number {
    if (linear <= 0) return -Infinity;
    return 20 * Math.log10(linear);
  }

  /**
   * Converte dB para valor linear
   */
  private dbToLinear(db: number): number {
    return Math.pow(10, db / 20);
  }

  /**
   * Obtém ganho de normalização para um acorde (se já foi analisado)
   */
  public getNormalizationGain(chordName: string): number {
    return this.chordGains.get(chordName) || 1.0;
  }

  /**
   * Limpa o cache de ganhos
   */
  public clearCache(): void {
    this.chordGains.clear();
    this.analyzedChords.clear();
  }

  /**
   * Retorna estatísticas de normalização
   */
  public getStats(): {
    analyzedChords: number;
    averageGain: number;
    minGain: number;
    maxGain: number;
  } {
    if (this.chordGains.size === 0) {
      return {
        analyzedChords: 0,
        averageGain: 1.0,
        minGain: 1.0,
        maxGain: 1.0,
      };
    }

    const gains = Array.from(this.chordGains.values());
    const sum = gains.reduce((a, b) => a + b, 0);
    const average = sum / gains.length;
    const min = Math.min(...gains);
    const max = Math.max(...gains);

    return {
      analyzedChords: this.chordGains.size,
      averageGain: average,
      minGain: min,
      maxGain: max,
    };
  }
}

/**
 * Aplica envelope ADSR a um GainNode
 * @param envelopeGain GainNode que receberá o envelope
 * @param audioContext AudioContext para agendar eventos
 * @param startTime Tempo de início (AudioContext.currentTime)
 * @param duration Duração total do som
 */
export function applyADSREnvelope(
  envelopeGain: GainNode,
  audioContext: AudioContext,
  startTime: number,
  duration: number
): void {
  const { attack, decay, sustain, release } = ADSR_ENVELOPE;
  
  // Garantir que duration seja suficiente para o envelope
  const minDuration = attack + decay + release;
  const actualDuration = Math.max(duration, minDuration);
  
  // Attack: 0 -> 1.0
  const attackEnd = startTime + attack;
  envelopeGain.gain.setValueAtTime(0, startTime);
  envelopeGain.gain.linearRampToValueAtTime(1.0, attackEnd);
  
  // Decay: 1.0 -> sustain level
  const decayEnd = attackEnd + decay;
  envelopeGain.gain.linearRampToValueAtTime(sustain, decayEnd);
  
  // Sustain: manter até release
  const releaseStart = startTime + actualDuration - release;
  envelopeGain.gain.setValueAtTime(sustain, releaseStart);
  
  // Release: sustain -> 0
  const releaseEnd = releaseStart + release;
  envelopeGain.gain.exponentialRampToValueAtTime(0.001, releaseEnd);
}

// Export singleton instance
export const chordNormalizer = new ChordNormalizer();
export { ADSR_ENVELOPE, TARGET_RMS_DB, TARGET_PEAK_DB };
