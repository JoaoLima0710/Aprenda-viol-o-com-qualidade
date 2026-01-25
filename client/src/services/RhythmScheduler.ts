/**
 * 🥁 Rhythm Scheduler with Lookahead
 * 
 * Scheduler especializado para treinos rítmicos com compensação de latência.
 * 
 * OBJETIVO:
 * - Preservar precisão rítmica entre dispositivos
 * - Minimizar impacto da latência
 * 
 * REGRAS:
 * - NÃO exigir hardware específico
 * - Lookahead scheduling para compensar latência
 * - Buffer controlado para reduzir jitter
 * - Feedback visual compensatório
 * 
 * TÉCNICAS:
 * 1. Lookahead scheduling: agenda eventos 50-100ms à frente
 * 2. Buffer controlado: mantém buffer de eventos agendados
 * 3. Feedback visual compensatório: ajusta timing visual
 */

import { unifiedAudioService } from './UnifiedAudioService';
import { audioContextScheduler } from './AudioContextScheduler';

export type RhythmEventType = 'click' | 'beat' | 'downbeat' | 'subdivision';

export interface RhythmEvent {
  id: string;
  type: RhythmEventType;
  audioTime: number; // Tempo no AudioContext
  visualTime: number; // Tempo visual compensado
  callback?: (audioTime: number, visualTime: number) => void;
  data?: any;
}

class RhythmScheduler {
  private audioContext: AudioContext | null = null;
  private scheduledEvents: Map<string, RhythmEvent> = new Map();
  private lookaheadTime: number = 0.1; // 100ms lookahead (ajustável)
  private scheduleInterval: number = 25; // Verificar a cada 25ms
  private scheduleTimer: number | null = null;
  private nextEventId: number = 0;
  private isRunning: boolean = false;
  private startTime: number = 0;
  
  // Latência estimada do sistema (será calibrado)
  private estimatedLatency: number = 0.05; // 50ms padrão
  private visualCompensation: number = 0.03; // 30ms compensação visual

  /**
   * Inicializa o scheduler com AudioContext
   */
  async initialize(): Promise<void> {
    await unifiedAudioService.ensureInitialized();
    const audioContext = unifiedAudioService.getAudioContext();
    
    if (!audioContext) {
      throw new Error('RhythmScheduler: AudioContext não disponível');
    }

    this.audioContext = audioContext;
    audioContextScheduler.initialize(audioContext);
    
    // Calibrar latência estimada baseado no dispositivo
    this.calibrateLatency();
  }

  /**
   * Calibra latência estimada baseado no dispositivo
   */
  private calibrateLatency(): void {
    if (!this.audioContext) return;

    // Detectar dispositivo e ajustar latência estimada
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
    
    if (isTablet) {
      // Tablets geralmente têm mais latência
      this.estimatedLatency = 0.08; // 80ms
      this.visualCompensation = 0.05; // 50ms
    } else if (isMobile) {
      // Mobile tem latência intermediária
      this.estimatedLatency = 0.06; // 60ms
      this.visualCompensation = 0.04; // 40ms
    } else {
      // Desktop geralmente tem menor latência
      this.estimatedLatency = 0.03; // 30ms
      this.visualCompensation = 0.02; // 20ms
    }

    // Ajustar lookahead baseado na latência estimada
    this.lookaheadTime = Math.max(0.05, this.estimatedLatency * 2); // Mínimo 50ms, idealmente 2x latência

    console.log(`🎯 [RhythmScheduler] Latência calibrada: ${(this.estimatedLatency * 1000).toFixed(0)}ms, Lookahead: ${(this.lookaheadTime * 1000).toFixed(0)}ms`);
  }

  /**
   * Agenda um evento rítmico com lookahead
   */
  scheduleEvent(
    type: RhythmEventType,
    delay: number, // Delay em segundos a partir de agora
    callback?: (audioTime: number, visualTime: number) => void,
    data?: any
  ): string {
    if (!this.audioContext) {
      console.error('RhythmScheduler: Não inicializado');
      return '';
    }

    const eventId = `rhythm-${this.nextEventId++}`;
    const currentAudioTime = this.audioContext.currentTime;
    const scheduledAudioTime = currentAudioTime + delay;
    
    // Visual time compensado (antecipa para compensar latência)
    const visualTime = scheduledAudioTime - this.visualCompensation;

    const event: RhythmEvent = {
      id: eventId,
      type,
      audioTime: scheduledAudioTime,
      visualTime: Math.max(0, visualTime), // Não pode ser negativo
      callback,
      data,
    };

    this.scheduledEvents.set(eventId, event);
    this.startScheduler();

    return eventId;
  }

  /**
   * Agenda eventos repetitivos (metrônomo)
   */
  scheduleRepeating(
    type: RhythmEventType,
    interval: number, // Intervalo entre eventos em segundos
    callback: (audioTime: number, visualTime: number, beat: number) => void,
    startDelay: number = 0
  ): string {
    if (!this.audioContext) {
      console.error('RhythmScheduler: Não inicializado');
      return '';
    }

    const eventId = `rhythm-repeat-${this.nextEventId++}`;
    let beatCount = 0;
    const currentAudioTime = this.audioContext.currentTime;
    const firstEventTime = currentAudioTime + startDelay;
    const repeatingEvents = new Set<string>(); // Rastrear IDs de eventos relacionados

    // Agendar primeiro evento
    const scheduleNext = (baseTime: number) => {
      if (!this.isRunning) return; // Parar se scheduler foi parado
      
      const nextTime = baseTime + (beatCount * interval);
      const visualTime = nextTime - this.visualCompensation;
      const individualEventId = `${eventId}-${beatCount}`;

      const event: RhythmEvent = {
        id: individualEventId,
        type,
        audioTime: nextTime,
        visualTime: Math.max(0, visualTime),
        callback: (audioTime, visualTime) => {
          callback(audioTime, visualTime, beatCount);
          beatCount++;
          repeatingEvents.delete(individualEventId);
          // Agendar próximo evento
          if (this.isRunning) {
            scheduleNext(baseTime);
          }
        },
        data: { parentId: eventId }, // Armazenar ID pai para cancelamento
      };

      repeatingEvents.add(individualEventId);
      this.scheduledEvents.set(individualEventId, event);
    };

    scheduleNext(firstEventTime);
    this.startScheduler();

    // Armazenar mapeamento de ID pai para IDs filhos para cancelamento
    (this as any).repeatingEventMap = (this as any).repeatingEventMap || new Map();
    (this as any).repeatingEventMap.set(eventId, repeatingEvents);

    return eventId;
  }

  /**
   * Inicia o loop de agendamento com lookahead
   */
  private startScheduler(): void {
    if (this.isRunning || !this.audioContext) return;

    this.isRunning = true;
    this.startTime = this.audioContext.currentTime;

    const schedule = () => {
      if (!this.isRunning || !this.audioContext) {
        this.stopScheduler();
        return;
      }

      const currentTime = this.audioContext.currentTime;
      const scheduleAheadTime = currentTime + this.lookaheadTime;

      // Processar eventos que devem ser executados
      const eventsToExecute: RhythmEvent[] = [];

      for (const [id, event] of this.scheduledEvents.entries()) {
        // Se o evento está dentro do lookahead window e ainda não foi executado
        if (event.audioTime <= scheduleAheadTime && event.audioTime >= currentTime - 0.01) {
          eventsToExecute.push(event);
        }
      }

      // Executar eventos
      for (const event of eventsToExecute) {
        try {
          if (event.callback) {
            // Usar AudioContext.currentTime como fonte de verdade
            const actualAudioTime = this.audioContext.currentTime;
            event.callback(actualAudioTime, event.visualTime);
          }
          this.scheduledEvents.delete(event.id);
        } catch (error) {
          console.error(`[RhythmScheduler] Erro ao executar evento ${event.id}:`, error);
          this.scheduledEvents.delete(event.id);
        }
      }

      // Continuar agendamento se houver eventos pendentes
      if (this.scheduledEvents.size > 0) {
        this.scheduleTimer = window.setTimeout(schedule, this.scheduleInterval);
      } else {
        this.stopScheduler();
      }
    };

    // Iniciar loop
    this.scheduleTimer = window.setTimeout(schedule, this.scheduleInterval);
  }

  /**
   * Para o scheduler
   */
  private stopScheduler(): void {
    this.isRunning = false;
    if (this.scheduleTimer !== null) {
      clearTimeout(this.scheduleTimer);
      this.scheduleTimer = null;
    }
  }

  /**
   * Cancela um evento específico ou todos os eventos relacionados (para eventos repetitivos)
   */
  cancelEvent(eventId: string): void {
    // Verificar se é um evento repetitivo (tem eventos filhos)
    const repeatingEventMap = (this as any).repeatingEventMap;
    if (repeatingEventMap && repeatingEventMap.has(eventId)) {
      // Cancelar todos os eventos filhos
      const childEvents = repeatingEventMap.get(eventId);
      for (const childId of childEvents) {
        this.scheduledEvents.delete(childId);
      }
      repeatingEventMap.delete(eventId);
    } else {
      // Cancelar evento único
      this.scheduledEvents.delete(eventId);
    }
    
    // Se não houver mais eventos, parar scheduler
    if (this.scheduledEvents.size === 0) {
      this.stopScheduler();
    }
  }

  /**
   * Cancela todos os eventos
   */
  cancelAll(): void {
    this.scheduledEvents.clear();
    this.stopScheduler();
  }

  /**
   * Ajusta lookahead time dinamicamente
   */
  setLookaheadTime(time: number): void {
    this.lookaheadTime = Math.max(0.05, Math.min(0.5, time)); // Entre 50ms e 500ms
    console.log(`🎯 [RhythmScheduler] Lookahead ajustado para ${(this.lookaheadTime * 1000).toFixed(0)}ms`);
  }

  /**
   * Ajusta compensação visual
   */
  setVisualCompensation(time: number): void {
    this.visualCompensation = Math.max(0, Math.min(0.1, time)); // Entre 0 e 100ms
    console.log(`🎯 [RhythmScheduler] Compensação visual ajustada para ${(this.visualCompensation * 1000).toFixed(0)}ms`);
  }

  /**
   * Obtém tempo visual compensado para feedback
   */
  getCompensatedVisualTime(audioTime: number): number {
    return Math.max(0, audioTime - this.visualCompensation);
  }

  /**
   * Obtém latência estimada
   */
  getEstimatedLatency(): number {
    return this.estimatedLatency;
  }

  /**
   * Limpa recursos
   */
  cleanup(): void {
    this.cancelAll();
    this.audioContext = null;
    this.isRunning = false;
  }
}

// Export singleton instance
export const rhythmScheduler = new RhythmScheduler();
