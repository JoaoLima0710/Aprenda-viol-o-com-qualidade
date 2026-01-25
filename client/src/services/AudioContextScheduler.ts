/**
 * AudioContextScheduler
 * 
 * Sincroniza eventos visuais com o tempo do AudioContext.
 * Usa AudioContext.currentTime como fonte de verdade para eliminar
 * atrasos perceptíveis entre som e UI.
 * 
 * REGRAS:
 * - NÃO usa setTimeout/setInterval como referência primária
 * - AudioContext.currentTime é a fonte de verdade
 * - Eventos visuais são derivados do scheduler de áudio
 */

type ScheduledCallback = (audioTime: number, visualTime: number) => void;
type ScheduledEvent = {
  id: string;
  callback: ScheduledCallback;
  startTime: number; // AudioContext.currentTime quando foi agendado
  duration?: number; // Duração em segundos (opcional)
  interval?: number; // Intervalo em segundos para eventos repetitivos
  lastTriggered?: number; // Último tempo em que foi disparado
};

class AudioContextScheduler {
  private audioContext: AudioContext | null = null;
  private scheduledEvents: Map<string, ScheduledEvent> = new Map();
  private animationFrameId: number | null = null;
  private isRunning = false;
  private startTime: number = 0; // AudioContext.currentTime quando scheduler iniciou

  /**
   * Inicializa o scheduler com um AudioContext
   */
  initialize(audioContext: AudioContext): void {
    if (this.audioContext && this.audioContext !== audioContext) {
      console.warn('⚠️ AudioContextScheduler: AudioContext changed, cleaning up');
      this.cleanup();
    }

    this.audioContext = audioContext;
    this.startTime = audioContext.currentTime;
  }

  /**
   * Obtém o AudioContext atual
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Obtém o tempo atual do AudioContext (fonte de verdade)
   */
  getCurrentTime(): number {
    if (!this.audioContext) {
      console.warn('⚠️ AudioContextScheduler: No AudioContext available, falling back to Date.now()');
      return Date.now() / 1000; // Converter para segundos
    }
    return this.audioContext.currentTime;
  }

  /**
   * Obtém o tempo decorrido desde o início do scheduler
   */
  getElapsedTime(): number {
    if (!this.audioContext) {
      return 0;
    }
    return this.audioContext.currentTime - this.startTime;
  }

  /**
   * Agenda um evento único para um tempo específico
   * @param id Identificador único do evento
   * @param callback Função a ser chamada
   * @param delay Tempo em segundos a partir de agora
   */
  scheduleOnce(id: string, callback: ScheduledCallback, delay: number = 0): void {
    if (!this.audioContext) {
      console.error('❌ AudioContextScheduler: Cannot schedule event without AudioContext');
      return;
    }

    const scheduledTime = this.audioContext.currentTime + delay;

    this.scheduledEvents.set(id, {
      id,
      callback,
      startTime: scheduledTime,
      duration: delay,
    });

    this.start();
  }

  /**
   * Agenda um evento repetitivo com intervalo fixo
   * @param id Identificador único do evento
   * @param callback Função a ser chamada
   * @param interval Intervalo em segundos entre chamadas
   * @param startDelay Atraso inicial em segundos (opcional)
   */
  scheduleRepeating(
    id: string,
    callback: ScheduledCallback,
    interval: number,
    startDelay: number = 0
  ): void {
    if (!this.audioContext) {
      console.error('❌ AudioContextScheduler: Cannot schedule event without AudioContext');
      return;
    }

    const firstTriggerTime = this.audioContext.currentTime + startDelay;

    this.scheduledEvents.set(id, {
      id,
      callback,
      startTime: firstTriggerTime,
      interval,
      lastTriggered: undefined,
    });

    this.start();
  }

  /**
   * Cancela um evento agendado
   */
  cancel(id: string): void {
    this.scheduledEvents.delete(id);

    if (this.scheduledEvents.size === 0) {
      this.stop();
    }
  }

  /**
   * Cancela todos os eventos
   */
  cancelAll(): void {
    this.scheduledEvents.clear();
    this.stop();
  }

  /**
   * Inicia o loop de atualização baseado em requestAnimationFrame
   */
  private start(): void {
    if (this.isRunning) {
      return;
    }

    if (!this.audioContext) {
      console.error('❌ AudioContextScheduler: Cannot start without AudioContext');
      return;
    }

    this.isRunning = true;
    this.startTime = this.audioContext.currentTime;

    const update = () => {
      if (!this.isRunning || !this.audioContext) {
        return;
      }

      const currentAudioTime = this.audioContext.currentTime;
      const visualTime = performance.now() / 1000; // Converter para segundos

      // Processar todos os eventos agendados
      for (const [id, event] of this.scheduledEvents.entries()) {
        // Evento único
        if (event.duration !== undefined && event.interval === undefined) {
          if (currentAudioTime >= event.startTime && currentAudioTime < event.startTime + event.duration) {
            event.callback(currentAudioTime, visualTime);
            // Remover após execução
            this.scheduledEvents.delete(id);
          }
        }
        // Evento repetitivo
        else if (event.interval !== undefined) {
          const nextTriggerTime = event.lastTriggered
            ? event.lastTriggered + event.interval
            : event.startTime;

          if (currentAudioTime >= nextTriggerTime) {
            event.callback(currentAudioTime, visualTime);
            event.lastTriggered = currentAudioTime;
          }
        }
      }

      // Continuar loop se ainda houver eventos
      if (this.scheduledEvents.size > 0) {
        this.animationFrameId = requestAnimationFrame(update);
      } else {
        this.stop();
      }
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  /**
   * Para o loop de atualização
   */
  private stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Limpa todos os recursos
   */
  cleanup(): void {
    this.cancelAll();
    this.audioContext = null;
    this.startTime = 0;
  }

  /**
   * Reinicia o scheduler (útil quando AudioContext é recriado)
   */
  reset(): void {
    if (this.audioContext) {
      this.startTime = this.audioContext.currentTime;
    }
  }
}

// Export singleton instance
export const audioContextScheduler = new AudioContextScheduler();
