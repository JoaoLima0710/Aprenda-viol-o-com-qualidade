/**
 * AuditoryStimulusConfig
 * 
 * Configuração centralizada para estímulos sonoros de percepção auditiva.
 * Garante máxima clareza, consistência e repetição idêntica quando necessário.
 * 
 * OBJETIVO:
 * - Treinar ouvido funcional
 * - Evitar confusão sonora
 * - Garantir ataque claro
 * - Controlar duração e espaçamento
 * - Garantir repetição idêntica quando necessário
 * - Variar apenas quando pedagogicamente correto
 */

/**
 * Configurações de envelope para máxima clareza auditiva
 */
export const AUDITORY_ENVELOPE = {
  // Ataque claro e definido (5ms) - permite identificação imediata
  attack: 0.005,
  // Decay mínimo (10ms) - transição rápida para sustain
  decay: 0.01,
  // Sustain alto (95%) - volume máximo durante a maior parte do som
  sustain: 0.95,
  // Release suave (150ms) - fade out natural sem clicks
  release: 0.15,
};

/**
 * Durações padronizadas para diferentes tipos de estímulos
 */
export const STIMULUS_DURATIONS = {
  // Nota individual - suficiente para identificar altura
  singleNote: 0.75,
  // Intervalo - tempo para processar relação entre notas
  interval: 0.8,
  // Acorde - tempo para identificar qualidade (maior/menor)
  chord: 1.0,
  // Sequência de memória - curto o suficiente para desafiar, longo o suficiente para reter
  memorySequence: 0.65,
} as const;

/**
 * Espaçamentos padronizados entre estímulos (em ms)
 */
export const STIMULUS_SPACING = {
  // Entre notas individuais - tempo para processar antes da próxima
  betweenNotes: 600,
  // Entre intervalos - tempo para identificar relação
  betweenIntervals: 800,
  // Entre acordes - tempo para identificar qualidade
  betweenChords: 700,
  // Entre notas em sequência de memória - tempo para processar e reter
  betweenMemoryNotes: 450,
  // Entre acordes em progressão - tempo para identificar cada acorde
  betweenProgressionChords: 650,
} as const;

/**
 * Delays para formação de acordes (em ms)
 * Notas do acorde tocam quase simultaneamente, mas com pequeno delay para clareza
 */
export const CHORD_FORMATION_DELAYS = {
  // Delay entre cada nota do acorde (18ms) - forma acorde sem perder clareza
  betweenChordNotes: 18,
} as const;

/**
 * Tipo de oscilador para máxima clareza
 * 'sine' é mais puro e claro para percepção auditiva
 */
export const STIMULUS_OSCILLATOR_TYPE: OscillatorType = 'sine';

/**
 * Volume padrão para estímulos auditivos (0.0 a 1.0)
 * Volume confortável que permite distinguir nuances
 */
export const STIMULUS_VOLUME = 0.7;

/**
 * Calcula o tempo total de um estímulo incluindo envelope
 */
export function getTotalStimulusDuration(duration: number): number {
  return duration + AUDITORY_ENVELOPE.attack + AUDITORY_ENVELOPE.decay + AUDITORY_ENVELOPE.release;
}

/**
 * Aplica envelope de amplitude claro a um GainNode
 * Garante ataque definido e release suave
 */
export function applyClearEnvelope(
  envelopeGain: GainNode,
  audioContext: AudioContext,
  startTime: number,
  duration: number
): void {
  const { attack, decay, sustain, release } = AUDITORY_ENVELOPE;
  
  // Garantir que duration seja suficiente para o envelope
  const minDuration = attack + decay + release;
  const actualDuration = Math.max(duration, minDuration);
  
  // Attack: 0 -> 1.0 (ataque claro e definido)
  const attackEnd = startTime + attack;
  envelopeGain.gain.setValueAtTime(0, startTime);
  envelopeGain.gain.linearRampToValueAtTime(1.0, attackEnd);
  
  // Decay: 1.0 -> sustain level (transição rápida)
  const decayEnd = attackEnd + decay;
  envelopeGain.gain.linearRampToValueAtTime(sustain, decayEnd);
  
  // Sustain: manter até release (volume máximo durante maior parte)
  const releaseStart = startTime + actualDuration - release;
  envelopeGain.gain.setValueAtTime(sustain, releaseStart);
  
  // Release: sustain -> 0 (fade out suave)
  const releaseEnd = releaseStart + release;
  envelopeGain.gain.exponentialRampToValueAtTime(0.001, releaseEnd);
}
