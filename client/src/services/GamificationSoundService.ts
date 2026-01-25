/**
 * 🎮 Gamification Sound Service
 * 
 * Serviço para tocar sons de gamificação (recompensas, level up, achievements).
 * 
 * OBJETIVO:
 * - Reforçar comportamento sem distração
 * - Sons curtos, volume baixo, frequência controlada
 * 
 * REGRAS:
 * - Sons curtos (máximo 200ms)
 * - Volume baixo (máximo 0.2)
 * - Limitar frequência por sessão (rate limiting)
 * - Não interromper o fluxo do usuário
 */

import { getAudioBus } from '@/audio';
import { audioPriorityManager } from './AudioPriorityManager';

export type GamificationSoundType = 
  | 'xp_gain'        // Ganho de XP pequeno
  | 'xp_bonus'       // Ganho de XP grande
  | 'level_up'       // Subiu de nível
  | 'achievement'    // Achievement desbloqueado
  | 'mission_complete' // Missão completada
  | 'streak_milestone'; // Marco de streak

class GamificationSoundService {
  private isEnabled = true;
  
  // Rate limiting: controlar frequência de sons
  private lastSoundTime: Map<GamificationSoundType, number> = new Map();
  private soundCounts: Map<GamificationSoundType, number> = new Map();
  private sessionStartTime = Date.now();
  
  // Configurações de rate limiting
  private readonly MIN_INTERVAL_MS = 500; // Mínimo 500ms entre sons do mesmo tipo
  private readonly MAX_SOUNDS_PER_MINUTE = 10; // Máximo 10 sons por minuto por tipo
  private readonly SESSION_RESET_MS = 5 * 60 * 1000; // Reset contadores a cada 5 minutos

  /**
   * Toca som de gamificação com controle de frequência
   * @param type - Tipo de som
   * @param volume - Volume (0.0 a 1.0), será limitado a 0.2 máximo
   */
  async playSound(type: GamificationSoundType, volume: number = 0.15): Promise<void> {
    if (!this.isEnabled) return;

    // Verificar prioridade: gamificação nunca interrompe aprendizado
    if (!audioPriorityManager.canPlaySound('interface')) {
      console.debug(`[GamificationSound] Som bloqueado por prioridade (treino/percepção ativo)`);
      return;
    }

    // Rate limiting: verificar se pode tocar
    if (!this.canPlaySound(type)) {
      console.debug(`[GamificationSound] Rate limit atingido para ${type}`);
      return;
    }

    // Limitar volume máximo a 0.2 (baixo)
    const clampedVolume = Math.min(0.2, Math.max(0, volume));

    try {
      const audioBus = getAudioBus();
      if (!audioBus) {
        console.debug('[GamificationSound] AudioBus não está disponível');
        return;
      }

      // Reset contadores se passou muito tempo
      this.checkSessionReset();

      // Atualizar rate limiting
      this.lastSoundTime.set(type, Date.now());
      const currentCount = this.soundCounts.get(type) || 0;
      this.soundCounts.set(type, currentCount + 1);

      switch (type) {
        case 'xp_gain':
          // Som de XP pequeno: nota aguda e muito curta (E5 = 659.25 Hz)
          audioBus.playOscillator({
            frequency: 659.25, // E5
            type: 'sine',
            duration: 0.1, // 100ms - muito curto
            channel: 'effects',
            volume: clampedVolume * 0.7, // Ainda mais baixo
          });
          break;

        case 'xp_bonus':
          // Som de XP grande: duas notas rápidas (C5 + E5)
          const currentTime = Date.now();
          audioBus.playOscillator({
            frequency: 523.25, // C5
            type: 'sine',
            duration: 0.12, // 120ms
            channel: 'effects',
            volume: clampedVolume,
          });
          // Segunda nota após 50ms
          setTimeout(() => {
            audioBus.playOscillator({
              frequency: 659.25, // E5
              type: 'sine',
              duration: 0.12,
              channel: 'effects',
              volume: clampedVolume,
            });
          }, 50);
          break;

        case 'level_up':
          // Som de level up: arpejo ascendente curto (C5-E5-G5)
          audioBus.playOscillator({
            frequency: 523.25, // C5
            type: 'sine',
            duration: 0.15, // 150ms
            channel: 'effects',
            volume: clampedVolume,
          });
          setTimeout(() => {
            audioBus.playOscillator({
              frequency: 659.25, // E5
              type: 'sine',
              duration: 0.15,
              channel: 'effects',
              volume: clampedVolume,
            });
          }, 60);
          setTimeout(() => {
            audioBus.playOscillator({
              frequency: 783.99, // G5
              type: 'sine',
              duration: 0.15,
              channel: 'effects',
              volume: clampedVolume,
            });
          }, 120);
          break;

        case 'achievement':
          // Som de achievement: nota aguda com glissando (C5 → E5)
          audioBus.playOscillator({
            frequency: 523.25, // C5
            type: 'sine',
            duration: 0.18, // 180ms
            channel: 'effects',
            volume: clampedVolume * 0.9,
          });
          break;

        case 'mission_complete':
          // Som de missão: duas notas rápidas (G4 + C5)
          audioBus.playOscillator({
            frequency: 392.00, // G4
            type: 'sine',
            duration: 0.12,
            channel: 'effects',
            volume: clampedVolume * 0.8,
          });
          setTimeout(() => {
            audioBus.playOscillator({
              frequency: 523.25, // C5
              type: 'sine',
              duration: 0.12,
              channel: 'effects',
              volume: clampedVolume * 0.8,
            });
          }, 80);
          break;

        case 'streak_milestone':
          // Som de streak: nota intermediária (A4 = 440 Hz)
          audioBus.playOscillator({
            frequency: 440.00, // A4
            type: 'sine',
            duration: 0.15,
            channel: 'effects',
            volume: clampedVolume * 0.75,
          });
          break;
      }
    } catch (error) {
      console.debug('[GamificationSound] Áudio não disponível');
    }
  }

  /**
   * Verifica se pode tocar som (rate limiting)
   */
  private canPlaySound(type: GamificationSoundType): boolean {
    const lastTime = this.lastSoundTime.get(type);
    const now = Date.now();

    // Verificar intervalo mínimo
    if (lastTime && (now - lastTime) < this.MIN_INTERVAL_MS) {
      return false;
    }

    // Verificar limite por minuto
    const count = this.soundCounts.get(type) || 0;
    const timeSinceSessionStart = now - this.sessionStartTime;
    const minutesSinceStart = timeSinceSessionStart / 60000;
    
    if (minutesSinceStart > 0 && count / minutesSinceStart > this.MAX_SOUNDS_PER_MINUTE) {
      return false;
    }

    return true;
  }

  /**
   * Verifica se precisa resetar contadores da sessão
   */
  private checkSessionReset(): void {
    const now = Date.now();
    if (now - this.sessionStartTime > this.SESSION_RESET_MS) {
      this.soundCounts.clear();
      this.sessionStartTime = now;
    }
  }

  /**
   * Habilita ou desabilita sons de gamificação
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Verifica se está habilitado
   */
  isEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Reseta contadores (útil para testes ou reset manual)
   */
  resetCounters(): void {
    this.soundCounts.clear();
    this.lastSoundTime.clear();
    this.sessionStartTime = Date.now();
  }
}

// Exportar instância singleton
export const gamificationSoundService = new GamificationSoundService();
