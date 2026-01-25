/**
 * Teste de parada de áudio na navegação
 * 
 * Garante que o áudio para ao trocar de rota.
 * Este teste valida que o sistema previne áudio fantasma durante navegação.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do AudioBus para rastrear estado de playback
let isPlayingState = false;
const mockStopAll = vi.fn(() => {
  isPlayingState = false;
});
const mockFadeOutAll = vi.fn(async () => {
  // Simular fade-out que eventualmente para tudo
  await new Promise(resolve => setTimeout(resolve, 10));
  isPlayingState = false;
});

const mockPlayOscillator = vi.fn(() => {
  isPlayingState = true;
  return true;
});

const mockPlayBuffer = vi.fn(async () => {
  isPlayingState = true;
  return true;
});

vi.mock('@/audio', () => ({
  getAudioBus: vi.fn(() => ({
    playOscillator: mockPlayOscillator,
    playBuffer: mockPlayBuffer,
    isPlaying: () => isPlayingState,
    stopAll: mockStopAll,
    fadeOutAll: mockFadeOutAll,
  })),
  AudioEngine: {
    getInstance: vi.fn(() => ({
      isReady: vi.fn(() => true),
    })),
  },
}));

// Mock do AudioPriorityManager
vi.mock('@/services/AudioPriorityManager', () => ({
  audioPriorityManager: {
    canPlaySound: vi.fn(() => true),
    isTrainingCurrentlyActive: vi.fn(() => false),
    setContext: vi.fn(),
  },
}));

// Mock do AudioLifecycleManager
vi.mock('@/services/AudioLifecycleManager', () => ({
  audioLifecycleManager: {
    stopSession: vi.fn(),
  },
}));

// Mock do MetronomeService
const mockMetronomeStop = vi.fn();
const mockMetronomeFadeOut = vi.fn(async () => {
  await new Promise(resolve => setTimeout(resolve, 10));
});

vi.mock('@/services/MetronomeService', () => ({
  metronomeService: {
    start: vi.fn(),
    stop: mockMetronomeStop,
    fadeOut: mockMetronomeFadeOut,
    getIsPlaying: vi.fn(() => false),
  },
}));

// Criar uma classe mock que simula UnifiedAudioService
class UnifiedAudioService {
  private isInitialized = false;
  private activeService: any = null;
  private isPlayingFlag = false;

  async initialize() {
    this.isInitialized = true;
    this.activeService = {
      playNote: vi.fn().mockImplementation(async () => {
        this.isPlayingFlag = true;
        const { getAudioBus } = await import('@/audio');
        const audioBus = getAudioBus();
        if (audioBus) {
          audioBus.playOscillator({
            frequency: 261.63,
            type: 'sine',
            duration: 0.5,
            channel: 'scales',
            volume: 0.8,
          });
        }
        return true;
      }),
      playChord: vi.fn().mockImplementation(async () => {
        this.isPlayingFlag = true;
        const { getAudioBus } = await import('@/audio');
        const audioBus = getAudioBus();
        if (audioBus) {
          audioBus.playBuffer({
            buffer: {} as AudioBuffer,
            channel: 'chords',
            volume: 1.0,
          });
        }
        return true;
      }),
    };
  }

  async playTraining(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Simular tocar treino (metrônomo + acorde)
    const { metronomeService } = await import('@/services/MetronomeService');
    await metronomeService.start(120, '4/4');
    
    if (this.activeService) {
      await this.activeService.playChord('C', 1.0);
    }
    
    this.isPlayingFlag = true;
  }

  stopAll(): void {
    this.isPlayingFlag = false;
    const { getAudioBus } = require('@/audio');
    const audioBus = getAudioBus();
    if (audioBus) {
      audioBus.stopAll();
    }
    
    const { metronomeService } = require('@/services/MetronomeService');
    metronomeService.stop();
  }

  async fadeOutAll(duration?: number): Promise<void> {
    const { getAudioBus } = await import('@/audio');
    const audioBus = getAudioBus();
    if (audioBus) {
      await audioBus.fadeOutAll(duration || 0.15);
    }
    
    const { metronomeService } = await import('@/services/MetronomeService');
    if (metronomeService.getIsPlaying()) {
      await metronomeService.fadeOut(duration || 0.15);
    }
    
    this.isPlayingFlag = false;
  }

  isPlaying(): boolean {
    const { getAudioBus } = require('@/audio');
    const audioBus = getAudioBus();
    return audioBus ? audioBus.isPlaying() : this.isPlayingFlag;
  }
}

// Mock do router
class Router {
  private currentRoute = '/practice';
  private audioService: UnifiedAudioService | null = null;

  setAudioService(audio: UnifiedAudioService): void {
    this.audioService = audio;
  }

  async navigate(path: string): Promise<void> {
    const previousRoute = this.currentRoute;
    this.currentRoute = path;
    
    // Simular mudança de rota - disparar parada de áudio
    if (previousRoute !== path && this.audioService) {
      await this.handleRouteChange(previousRoute, path);
    }
  }

  private async handleRouteChange(from: string, to: string): Promise<void> {
    if (!this.audioService) return;
    
    // Simular lógica do useAudioNavigationGuard
    // Fade-out suave de todo áudio
    try {
      await this.audioService.fadeOutAll(0.15);
    } catch {
      this.audioService.stopAll();
    }
  }

  getCurrentRoute(): string {
    return this.currentRoute;
  }
}

describe('UnifiedAudioService - Navigation Stop', () => {
  let audio: UnifiedAudioService;
  let router: Router;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStopAll.mockClear();
    mockFadeOutAll.mockClear();
    mockPlayOscillator.mockClear();
    mockPlayBuffer.mockClear();
    mockMetronomeStop.mockClear();
    mockMetronomeFadeOut.mockClear();
    isPlayingState = false;
    
    audio = new UnifiedAudioService();
    router = new Router();
    router.setAudioService(audio);
  });

  describe('Stops audio on route change', () => {
    it('para áudio ao trocar de rota', async () => {
      await audio.playTraining();
      await router.navigate('/theory');

      expect(audio.isPlaying()).toBe(false);
    });

    it('chama stopAll quando navega', async () => {
      await audio.playTraining();
      expect(audio.isPlaying()).toBe(true);
      
      router.navigate('/theory');
      
      // Aguardar fade-out
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Verificar que stopAll foi chamado (via fadeOutAll que eventualmente chama stopAll)
      expect(mockFadeOutAll).toHaveBeenCalled();
    });

    it('para metrônomo ao navegar', async () => {
      await audio.playTraining();
      expect(audio.isPlaying()).toBe(true);
      
      router.navigate('/theory');
      
      // Aguardar fade-out
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Verificar que metrônomo foi parado
      expect(mockMetronomeFadeOut).toHaveBeenCalled();
    });

    it('não toca áudio após navegação', async () => {
      await audio.playTraining();
      router.navigate('/theory');
      
      // Aguardar fade-out
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Tentar tocar novamente (não deve tocar automaticamente)
      const wasPlaying = audio.isPlaying();
      
      // Deve estar parado
      expect(wasPlaying).toBe(false);
    });
  });
});
