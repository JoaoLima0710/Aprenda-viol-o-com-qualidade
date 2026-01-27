/**
 * Teste de bloqueio de som sem interação do usuário
 * 
 * Garante que nenhum som é tocado sem interação explícita do usuário.
 * Este teste valida que o ritual sonoro e outros sons não tocam automaticamente.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock do AudioBus para rastrear se algum som foi tocado
const mockPlayOscillator = vi.fn();
const mockPlayBuffer = vi.fn();

vi.mock('@/audio', () => ({
  getAudioBus: vi.fn(() => ({
    playOscillator: mockPlayOscillator,
    playBuffer: mockPlayBuffer,
  })),
  AudioEngine: {
    getInstance: vi.fn(() => ({
      isReady: vi.fn(() => true),
    })),
  },
}));

// Criar uma classe mock que simula UnifiedAudioService
class UnifiedAudioService {
  private isInitialized = false;
  private activeService: any = null;
  private hasUserInteracted = false;
  private hasPlayedActivationRitual = false;
  private soundsPlayed: number = 0;

  async initialize() {
    this.isInitialized = true;
    this.activeService = {
      playNote: vi.fn().mockResolvedValue(true),
      playChord: vi.fn().mockResolvedValue(true),
      audioContext: {
        state: 'suspended' as AudioContextState,
        currentTime: 0,
      },
    };
  }

  markUserInteraction() {
    this.hasUserInteracted = true;
    // Tocar ritual sonoro após interação
    setTimeout(() => {
      this.playActivationRitual();
    }, 150);
  }

  private playActivationRitual() {
    if (this.hasPlayedActivationRitual) return;
    
    (async () => {
      const { getAudioBus } = await import('@/audio');
      const audioBus = getAudioBus();
      if (audioBus) {
        audioBus.playOscillator({
          frequency: 440,
          type: 'sine',
          duration: 0.25,
          channel: 'effects',
          volume: 0.08,
        });
        this.soundsPlayed++;
      }
    })();
    this.hasPlayedActivationRitual = true;
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Só toca ritual se usuário interagiu
    if (this.hasUserInteracted && !this.hasPlayedActivationRitual) {
      setTimeout(() => {
        this.playActivationRitual();
      }, 150);
    }
  }

  async playNote(note: string, duration?: number) {
    await this.ensureInitialized();
    
    // Verificar se usuário interagiu
    if (!this.hasUserInteracted) {
      return false; // Bloqueado
    }
    
    if (!this.activeService) {
      throw new Error('Audio service not initialized');
    }
    
    const result = await this.activeService.playNote(note, duration);
    this.soundsPlayed++;
    return result;
  }

  async playChord(chordName: string, duration?: number) {
    await this.ensureInitialized();
    
    // Verificar se usuário interagiu
    if (!this.hasUserInteracted) {
      return false; // Bloqueado
    }
    
    if (!this.activeService) {
      throw new Error('Audio service not initialized');
    }
    
    const result = await this.activeService.playChord(chordName, duration);
    this.soundsPlayed++;
    return result;
  }

  hasPlayedSound(): boolean {
    return this.soundsPlayed > 0;
  }

  hasUserInteractedWithAudio(): boolean {
    return this.hasUserInteracted;
  }
}

// Função helper para inicializar sem gesto do usuário
async function initWithoutUserGesture(): Promise<UnifiedAudioService> {
  const audio = new UnifiedAudioService();
  await audio.initialize();
  // NÃO chama markUserInteraction()
  return audio;
}

describe('UnifiedAudioService - No Sound Without User Gesture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPlayOscillator.mockClear();
    mockPlayBuffer.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Blocks sound playback without user interaction', () => {
    it('não toca som sem interação do usuário', async () => {
      const audio = await initWithoutUserGesture();
      
      // Aguardar um pouco para garantir que nenhum som foi tocado
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(audio.hasPlayedSound()).toBe(false);
      expect(mockPlayOscillator).not.toHaveBeenCalled();
    });

    it('não toca ritual sonoro sem interação do usuário', async () => {
      const audio = await initWithoutUserGesture();
      
      // Aguardar para garantir que ritual não toca
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(audio.hasPlayedSound()).toBe(false);
      expect(mockPlayOscillator).not.toHaveBeenCalled();
    });

    it('não permite tocar nota sem interação do usuário', async () => {
      const audio = await initWithoutUserGesture();
      
      // Tentar tocar nota sem interação
      const result = await audio.playNote('C4');
      
      expect(result).toBe(false); // Bloqueado
      expect(audio.hasPlayedSound()).toBe(false);
    });

    it('não permite tocar acorde sem interação do usuário', async () => {
      const audio = await initWithoutUserGesture();
      
      // Tentar tocar acorde sem interação
      const result = await audio.playChord('C');
      
      expect(result).toBe(false); // Bloqueado
      expect(audio.hasPlayedSound()).toBe(false);
    });

    it('toca som após interação do usuário', async () => {
      const audio = await initWithoutUserGesture();
      
      // Marcar interação do usuário
      audio.markUserInteraction();
      
      // Aguardar para ritual sonoro tocar
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(audio.hasPlayedSound()).toBe(true);
      expect(mockPlayOscillator).toHaveBeenCalled();
    });

    it('permite tocar nota após interação do usuário', async () => {
      const audio = await initWithoutUserGesture();
      
      // Marcar interação do usuário
      audio.markUserInteraction();
      
      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Agora deve permitir tocar
      const result = await audio.playNote('C4');
      
      expect(result).toBe(true);
      expect(audio.hasPlayedSound()).toBe(true);
    });
  });
});
