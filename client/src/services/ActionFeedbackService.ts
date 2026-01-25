/**
 * 🎯 Action Feedback Service
 * 
 * Serviço centralizado para feedback sonoro consistente em ações válidas do usuário.
 * 
 * OBJETIVO:
 * - Feedback sonoro consistente para toda ação válida que altera estado
 * - Mesma ação sempre produz o mesmo som
 * - Sons reutilizáveis entre telas
 * - Volume baixo e não distrativo
 * - Latência perceptiva mínima
 * 
 * REGRAS:
 * - NÃO duplicar sons já existentes (FeedbackSoundService, GamificationSoundService)
 * - NÃO criar sons decorativos
 * - NÃO tocar som em ações inválidas ou bloqueadas
 * - NÃO alterar lógica de navegação
 * - Prevenir sobreposição sonora
 */

import { getAudioBus } from '@/audio';
import { audioPriorityManager } from './AudioPriorityManager';

/**
 * Tipos de ações que precisam de feedback sonoro
 */
export type ActionType =
  | 'button_click'      // Clique em botão genérico
  | 'training_start'    // Início de treino
  | 'confirmation'      // Confirmação de escolha
  | 'step_progress';     // Avanço de etapa

class ActionFeedbackService {
  private isEnabled = true;
  
  // Prevenção de sobreposição: rastrear último som tocado
  private lastSoundTime: number = 0;
  private readonly MIN_INTERVAL_MS = 50; // Mínimo 50ms entre sons (prevenir sobreposição)
  
  // Cache de AudioBus para latência mínima
  private audioBusCache: ReturnType<typeof getAudioBus> | null = null;

  /**
   * Toca feedback sonoro para uma ação do usuário
   * 
   * @param action - Tipo de ação
   * @param volume - Volume (0.0 a 1.0), será limitado a 0.1 máximo
   */
  async playActionFeedback(action: ActionType, volume: number = 0.08): Promise<void> {
    if (!this.isEnabled) return;

    // Verificar prioridade: sons de interface nunca competem com pedagógicos
    if (!audioPriorityManager.canPlaySound('interface')) {
      console.debug('[ActionFeedback] Som bloqueado por prioridade (treino/percepção ativo)');
      return;
    }

    // Prevenir sobreposição sonora
    const now = Date.now();
    if (now - this.lastSoundTime < this.MIN_INTERVAL_MS) {
      console.debug('[ActionFeedback] Som ignorado: sobreposição prevenida');
      return;
    }

    try {
      // Obter AudioBus (usar cache se disponível)
      let audioBus = this.audioBusCache;
      if (!audioBus) {
        audioBus = getAudioBus();
        if (audioBus) {
          this.audioBusCache = audioBus;
        }
      }

      if (!audioBus) {
        console.debug('[ActionFeedback] AudioBus não está disponível');
        return;
      }

      // Verificar se AudioEngine está pronto
      const { AudioEngine } = await import('@/audio');
      const audioEngine = AudioEngine.getInstance();
      
      if (!audioEngine.isReady()) {
        console.debug('[ActionFeedback] AudioEngine não está pronto');
        return;
      }

      // Limitar volume máximo a 0.1 (muito baixo para não distrair)
      const clampedVolume = Math.min(0.1, Math.max(0, volume));

      // Atualizar timestamp para prevenir sobreposição
      this.lastSoundTime = now;

      // Tocar som baseado no tipo de ação
      switch (action) {
        case 'button_click':
          // Som de clique: nota intermediária curta (D4 = 293.66 Hz)
          // Tom neutro e discreto para feedback de interação
          audioBus.playOscillator({
            frequency: 293.66, // D4 - tom neutro
            type: 'sine',
            duration: 0.08, // 80ms - muito curto para latência mínima
            channel: 'effects',
            volume: clampedVolume,
          });
          break;

        case 'training_start':
          // Som de início de treino: duas notas rápidas ascendentes (C4 → E4)
          // Tom positivo mas discreto
          audioBus.playOscillator({
            frequency: 261.63, // C4
            type: 'sine',
            duration: 0.1, // 100ms
            channel: 'effects',
            volume: clampedVolume,
          });
          // Segunda nota após 40ms
          setTimeout(() => {
            audioBus?.playOscillator({
              frequency: 329.63, // E4
              type: 'sine',
              duration: 0.1,
              channel: 'effects',
              volume: clampedVolume,
            });
          }, 40);
          break;

        case 'confirmation':
          // Som de confirmação: nota aguda curta (F5 = 698.46 Hz)
          // Tom positivo e claro
          audioBus.playOscillator({
            frequency: 698.46, // F5 - tom agudo e positivo
            type: 'sine',
            duration: 0.1, // 100ms
            channel: 'effects',
            volume: clampedVolume,
          });
          break;

        case 'step_progress':
          // Som de avanço: nota intermediária com leve glissando (G4 = 392.00 Hz)
          // Tom neutro e suave
          audioBus.playOscillator({
            frequency: 392.00, // G4 - tom intermediário
            type: 'sine',
            duration: 0.12, // 120ms
            channel: 'effects',
            volume: clampedVolume * 0.9, // Ligeiramente mais baixo
          });
          break;
      }
    } catch (error) {
      // Fallback silencioso: não interromper o fluxo se o feedback falhar
      console.debug('[ActionFeedback] Feedback não pôde ser tocado (fallback silencioso):', error);
    }
  }

  /**
   * Habilita ou desabilita feedback sonoro de ações
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Verifica se feedback está habilitado
   */
  isEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Limpa cache de AudioBus (útil para testes ou reset)
   */
  clearCache(): void {
    this.audioBusCache = null;
  }
}

// Exportar instância singleton
export const actionFeedbackService = new ActionFeedbackService();
