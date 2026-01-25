/**
 * 🔊 Feedback Sound Service
 * 
 * Serviço para tocar sons de feedback suaves e pedagógicos nos treinos de acordes.
 * 
 * OBJETIVO:
 * - Transformar erro em informação pedagógica através de som
 * - Sons curtos, suaves e não agressivos
 * - Diferenciação clara entre tipos de erro
 * 
 * REGRAS:
 * - NÃO adiciona sons agressivos
 * - NÃO aumenta volume
 * - Usa AudioBus para respeitar arquitetura
 * - Sincroniza com ação do usuário
 */

import { getAudioBus } from '@/audio';
import { audioPriorityManager } from './AudioPriorityManager';
import { auditoryFatigueReducer } from './AuditoryFatigueReducer';

export type FeedbackType = 'success' | 'error_execution' | 'error_timing';

class FeedbackSoundService {
  private isEnabled = true;

  /**
   * Toca som de feedback baseado no tipo
   * @param type - Tipo de feedback (sucesso, erro de execução, erro de tempo)
   * @param volume - Volume (0.0 a 1.0), padrão 0.15 para sons suaves e baixos
   */
  async playFeedback(type: FeedbackType, volume: number = 0.15): Promise<void> {
    if (!this.isEnabled) return;

    // Verificar prioridade: sons de treino têm prioridade máxima
    if (!audioPriorityManager.canPlaySound('training')) {
      console.debug('[FeedbackSound] Som bloqueado por prioridade');
      return;
    }

    try {
      // Obter instância do AudioBus
      const audioBus = getAudioBus();
      if (!audioBus) {
        console.debug('[FeedbackSound] AudioBus não está disponível');
        return;
      }

      // Garantir que AudioBus está pronto
      // Nota: AudioBus valida internamente se AudioEngine está pronto
      
      // Limitar volume máximo a 0.2 (baixo) para não distrair
      const clampedVolume = Math.min(0.2, Math.max(0, volume));

      // Obter variação para reduzir fadiga auditiva
      const soundId = `feedback-${type}`;
      const variation = auditoryFatigueReducer.getVariation(soundId);
      
      // Se deve pausar, não tocar
      if (variation === null) {
        console.debug('[FeedbackSound] Pausa auditiva ativa, som não tocado');
        return;
      }

      // Aplicar variações controladas
      const baseFrequency = type === 'success' ? 523.25 : type === 'error_execution' ? 293.66 : 329.63;
      const variedFrequency = auditoryFatigueReducer.applyPitchVariation(baseFrequency, variation);
      const variedVolume = auditoryFatigueReducer.applyVolumeVariation(clampedVolume, variation);
      const baseDuration = type === 'success' ? 0.12 : type === 'error_execution' ? 0.1 : 0.09;
      const variedTiming = auditoryFatigueReducer.applyTimingVariation(0, variation);

      switch (type) {
        case 'success':
          // Som de sucesso: nota aguda e suave (C5 = 523.25 Hz)
          // Tom curto e discreto para transmitir positividade sem distração
          // Aplicar variação após delay se necessário
          setTimeout(() => {
            audioBus.playOscillator({
              frequency: variedFrequency, // Frequência com microvariação
              type: 'sine', // Sine é mais suave que triangle
              duration: baseDuration, // Duração base (não varia)
              channel: 'effects', // Usar canal effects para feedback
              volume: variedVolume, // Volume com microvariação
            });
          }, Math.max(0, variedTiming));
          break;

        case 'error_execution':
          /**
           * 🎓 Som de Erro de Execução - Pedagógico e Informativo
           * 
           * JUSTIFICATIVA PEDAGÓGICA:
           * - Usa intervalo de quarta justa ascendente (D4 → G4)
           * - O movimento ascendente sugere "ajuste para cima" ou "tente novamente"
           * - Não é punitivo: não usa frequências graves que podem causar stress
           * - É informativo: comunica que há algo a ajustar, não que está "errado"
           * - Tom suave e encorajador, não desencorajador
           * 
           * CARACTERÍSTICAS:
           * - Intervalo: D4 (293.66 Hz) → G4 (392.00 Hz) - quarta justa ascendente
           * - Duração: 100ms cada nota, 50ms entre notas
           * - Volume: 0.06 (muito baixo, não distrativo)
           * - Tipo: Sine wave - som suave
           * 
           * ONDE É DISPARADO:
           * - EnhancedChordPractice.tsx - quando acorde é tocado incorretamente
           * - PracticeMode.tsx - quando acorde é tocado incorretamente
           * 
           * DIFERENÇA DO SUCESSO:
           * - Sucesso: C5 (523.25 Hz) - nota única aguda e positiva
           * - Erro: D4 → G4 - intervalo ascendente que sugere correção
           * - Claramente distintos em frequência e padrão
           */
          // Aplicar variação com delay se necessário
          const errorDelay = Math.max(0, variedTiming);
          
          setTimeout(() => {
            // Primeira nota: D4 (293.66 Hz) - tom neutro e confortável
            // Aplicar variação de pitch apenas na primeira nota (manter intervalo)
            const firstNoteFreq = auditoryFatigueReducer.applyPitchVariation(293.66, variation);
            const firstNoteVolume = auditoryFatigueReducer.applyVolumeVariation(clampedVolume * 0.5, variation);
            
            audioBus.playOscillator({
              frequency: firstNoteFreq, // D4 com microvariação
              type: 'sine',
              duration: 0.1, // 100ms - curto
              channel: 'effects',
              volume: firstNoteVolume, // Volume com microvariação
            });
            
            // Segunda nota após 50ms: G4 (392.00 Hz) - movimento ascendente
            // Manter intervalo relativo (quarta justa)
            const intervalRatio = 392.00 / 293.66; // Razão do intervalo
            const secondNoteFreq = firstNoteFreq * intervalRatio;
            const secondNoteVolume = firstNoteVolume;
            
            setTimeout(() => {
              audioBus.playOscillator({
                frequency: secondNoteFreq, // G4 mantendo intervalo relativo
                type: 'sine',
                duration: 0.1, // 100ms
                channel: 'effects',
                volume: secondNoteVolume, // Volume com microvariação
              });
            }, 50);
          }, errorDelay);
          
          // Marcar como "error-soft" para rastreamento em testes
          audioBus.setLastPlayed('error-soft');
          break;

        case 'error_timing':
          /**
           * 🎓 Som de Erro de Tempo - Pedagógico e Informativo
           * 
           * JUSTIFICATIVA PEDAGÓGICA:
           * - Usa intervalo de terça menor ascendente (E4 → G4)
           * - O movimento ascendente sugere "ajuste sutil" ou "sincronize melhor"
           * - Não é punitivo: frequência intermediária, não grave
           * - É informativo: comunica que o timing precisa de ajuste
           * - Tom neutro e encorajador
           * 
           * CARACTERÍSTICAS:
           * - Intervalo: E4 (329.63 Hz) → G4 (392.00 Hz) - terça menor ascendente
           * - Duração: 90ms cada nota, 40ms entre notas
           * - Volume: 0.065 (muito baixo, não distrativo)
           * - Tipo: Sine wave - som suave
           * 
           * ONDE É DISPARADO:
           * - ChordProgressionPractice.tsx - quando troca de acorde no tempo errado
           * 
           * DIFERENÇA DO SUCESSO:
           * - Sucesso: C5 (523.25 Hz) - nota única aguda
           * - Erro de tempo: E4 → G4 - intervalo ascendente mais curto
           * - Claramente distintos em frequência e padrão
           */
          // Aplicar variação com delay se necessário
          const timingDelay = Math.max(0, variedTiming);
          
          setTimeout(() => {
            // Primeira nota: E4 (329.63 Hz) - tom intermediário
            // Aplicar variação de pitch apenas na primeira nota (manter intervalo)
            const firstNoteFreq = auditoryFatigueReducer.applyPitchVariation(329.63, variation);
            const firstNoteVolume = auditoryFatigueReducer.applyVolumeVariation(clampedVolume * 0.55, variation);
            
            audioBus.playOscillator({
              frequency: firstNoteFreq, // E4 com microvariação
              type: 'sine',
              duration: 0.09, // 90ms - mais curto que erro de execução
              channel: 'effects',
              volume: firstNoteVolume, // Volume com microvariação
            });
            
            // Segunda nota após 40ms: G4 (392.00 Hz) - movimento ascendente sutil
            // Manter intervalo relativo (terça menor)
            const intervalRatio = 392.00 / 329.63; // Razão do intervalo
            const secondNoteFreq = firstNoteFreq * intervalRatio;
            const secondNoteVolume = firstNoteVolume;
            
            setTimeout(() => {
              audioBus.playOscillator({
                frequency: secondNoteFreq, // G4 mantendo intervalo relativo
                type: 'sine',
                duration: 0.09, // 90ms
                channel: 'effects',
                volume: secondNoteVolume, // Volume com microvariação
              });
            }, 40);
          }, timingDelay);
          break;
      }
    } catch (error) {
      // Silenciosamente falhar se AudioBus não estiver pronto
      // Não queremos interromper o fluxo do usuário
      console.debug('[FeedbackSound] Áudio não disponível para feedback');
    }
  }

  /**
   * Habilita ou desabilita feedback sonoro
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Verifica se feedback está habilitado
   */
  isFeedbackEnabled(): boolean {
    return this.isEnabled;
  }
}

// Exportar instância singleton
export const feedbackSoundService = new FeedbackSoundService();
