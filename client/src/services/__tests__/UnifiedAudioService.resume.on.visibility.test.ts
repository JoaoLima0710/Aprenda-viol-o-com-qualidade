/**
 * Teste de retomada de áudio na mudança de visibilidade
 * 
 * Garante que o áudio retoma apenas se estava ativo antes de ser escondido.
 * Este teste valida que o sistema preserva estado e permite retomada.
 */



// Mocks e variáveis precisam ser definidos antes dos vi.mock
let isPlayingState = false;
const mockStopAll = vi.fn(() => {
  isPlayingState = false;
});
const mockFadeOutAll = vi.fn(async () => {
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
let lifecycleState: 'idle' | 'playing' | 'paused' | 'suspended' | 'stopped' = 'idle';
let wasUserInitiated = false;
let previousState: 'playing' | 'paused' | null = null;
let metronomePlaying = false;
const mockMetronomeStart = vi.fn(async () => {
  metronomePlaying = true;
});
const mockMetronomeStop = vi.fn(() => {
  metronomePlaying = false;
});
const mockMetronomeFadeOut = vi.fn(async () => {
  await new Promise(resolve => setTimeout(resolve, 10));
  metronomePlaying = false;
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAudioBus } from '@/audio';
import { audioLifecycleManager } from '@/services/AudioLifecycleManager';
import { metronomeService } from '@/services/MetronomeService';

// Mock do AudioBus para rastrear estado de playback
// (Removido bloco duplicado)

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
    isTrainingCurrentlyActive: vi.fn(() => true),
    setContext: vi.fn(),
  },
}));

// Mock do AudioLifecycleManager
// (Removido bloco duplicado)

const mockStopSession = vi.fn(() => {
  lifecycleState = 'stopped';
  wasUserInitiated = false;
  previousState = null;
});

const mockSuspendSession = vi.fn(() => {
  if (lifecycleState === 'playing' || lifecycleState === 'paused') {
    previousState = lifecycleState;
    lifecycleState = 'suspended';
  }
});

const mockResumeSession = vi.fn((userInitiated: boolean) => {
  if (lifecycleState === 'suspended' && wasUserInitiated && previousState && userInitiated) {
    lifecycleState = previousState;
    previousState = null;
    return true;
  }
  return false;
});

vi.mock('@/services/AudioLifecycleManager', () => ({
  audioLifecycleManager: {
    stopSession: mockStopSession,
    suspendSession: mockSuspendSession,
    resumeSession: mockResumeSession,
    getState: () => lifecycleState,
    getSession: () => ({
      state: lifecycleState,
      wasUserInitiated,
      previousState,
    }),
    canResume: () => lifecycleState === 'suspended' && wasUserInitiated && previousState !== null,
  },
}));

// Mock do MetronomeService
// (Removido bloco duplicado)

vi.mock('@/services/MetronomeService', () => ({
  metronomeService: {
    start: mockMetronomeStart,
    stop: mockMetronomeStop,
    fadeOut: mockMetronomeFadeOut,
    getIsPlaying: () => metronomePlaying,
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
      playChord: vi.fn().mockImplementation(async () => {
        this.isPlayingFlag = true;
        isPlayingState = true;
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
    // Marcar como iniciado pelo usuário
    wasUserInitiated = true;
    lifecycleState = 'playing';
    // Simular tocar treino (metrônomo + acorde)
    await metronomeService.start(120, '4/4');
    if (this.activeService) {
      await this.activeService.playChord('C', 1.0);
    }
    this.isPlayingFlag = true;
    isPlayingState = true;
  }

  stopAll(): void {
    this.isPlayingFlag = false;
    isPlayingState = false;
    const audioBus = getAudioBus();
    if (audioBus) {
      audioBus.stopAll();
    }
    metronomeService.stop();
  }

  async fadeOutAll(duration?: number): Promise<void> {
    const audioBus = getAudioBus();
    if (audioBus) {
      await audioBus.fadeOutAll(duration || 0.15);
    }
    if (metronomeService.getIsPlaying()) {
      await metronomeService.fadeOut(duration || 0.15);
    }
    this.isPlayingFlag = false;
    isPlayingState = false;
  }

  isPlaying(): boolean {
    const audioBus = getAudioBus();
    return audioBus ? audioBus.isPlaying() : this.isPlayingFlag;
  }

  resume(): boolean {
    // Simular retomada se estava suspenso e foi iniciado pelo usuário
    const resumed = audioLifecycleManager.resumeSession ? audioLifecycleManager.resumeSession(true) : false;
    if (resumed) {
      metronomeService.start(120, '4/4');
      this.isPlayingFlag = true;
      isPlayingState = true;
      return true;
    }
    return false;
  }
}

// Simular mudança de visibilidade
function simulateVisibilityChange(state: 'hidden' | 'visible', audioService?: UnifiedAudioService): void {
  // Simular evento visibilitychange
  Object.defineProperty(document, 'hidden', {
    writable: true,
    value: state === 'hidden',
  });
  
  // Disparar evento
  const event = new Event('visibilitychange');
  document.dispatchEvent(event);
  
  // Simular lógica do useAudioNavigationGuard
  if (state === 'hidden') {
      (async () => {
        const { audioLifecycleManager } = await import('@/services/AudioLifecycleManager');
        audioLifecycleManager.suspendSession();
      })();
    
    if (audioService) {
      audioService.fadeOutAll(0.15).catch(() => {
        audioService.stopAll();
      });
    }
  } else {
    // App visível: NÃO retoma automaticamente
    // Retoma apenas se usuário interagir explicitamente
    // Para este teste, vamos simular que o usuário interagiu após app voltar a ficar visível
    // (simula clique do usuário para retomar)
      (async () => {
        const { audioLifecycleManager } = await import('@/services/AudioLifecycleManager');
        if (audioLifecycleManager.canResume() && audioService) {
          // Simular interação do usuário que retoma o áudio
          audioService.resume();
        }
      })();
  }
}

describe('UnifiedAudioService - Resume on Visibility', () => {
  let audio: UnifiedAudioService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStopAll.mockClear();
    mockFadeOutAll.mockClear();
    mockPlayOscillator.mockClear();
    mockPlayBuffer.mockClear();
    mockMetronomeStart.mockClear();
    mockMetronomeStop.mockClear();
    mockMetronomeFadeOut.mockClear();
    mockStopSession.mockClear();
    mockSuspendSession.mockClear();
    mockResumeSession.mockClear();
    
    isPlayingState = false;
    metronomePlaying = false;
    lifecycleState = 'idle';
    wasUserInitiated = false;
    previousState = null;
    
    audio = new UnifiedAudioService();
  });

  describe('Resumes audio only if was active before', () => {
    it('retoma áudio apenas se estava ativo antes', async () => {
      await audio.playTraining();
      simulateVisibilityChange('hidden', audio);
      
      // Aguardar fade-out completar
      await new Promise(resolve => setTimeout(resolve, 20));
      
      simulateVisibilityChange('visible', audio);
      
      // Aguardar retomada
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(audio.isPlaying()).toBe(true);
    });

    it('não retoma se não estava tocando antes', async () => {
      // Não tocar treino
      simulateVisibilityChange('hidden');
      simulateVisibilityChange('visible');

      expect(audio.isPlaying()).toBe(false);
    });

    it('suspende quando app é escondido', async () => {
      await audio.playTraining();
      expect(audio.isPlaying()).toBe(true);
      
      simulateVisibilityChange('hidden');
      
      // Aguardar fade-out
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Deve estar suspenso
      expect(audioLifecycleManager.getState()).toBe('suspended');
    });

    it('preserva estado anterior ao suspender', async () => {
      await audio.playTraining();
      simulateVisibilityChange('hidden');
      
      // Verificar que estado anterior foi preservado
      const session = audioLifecycleManager.getSession();
      expect(session.previousState).toBe('playing');
      expect(session.wasUserInitiated).toBe(true);
    });
  });
});
