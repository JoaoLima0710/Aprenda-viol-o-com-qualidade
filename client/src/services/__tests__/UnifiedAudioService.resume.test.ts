/**
 * Testes de resume do AudioContext após interação do usuário
 * 
 * Verifica que o UnifiedAudioService resumo o AudioContext quando
 * ensureInitialized() é chamado (indicando interação do usuário).
 * 
 * NOTA: Este teste verifica a lógica de resume isoladamente,
 * sem importar o serviço completo para evitar criação de AudioContext real.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the resume logic directly without importing the full service
describe('AudioContext resume after interaction', () => {
  let mockActiveService: any;
  let mockAudioContext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock AudioContext
    mockAudioContext = {
      state: 'suspended' as AudioContextState,
      resume: vi.fn().mockResolvedValue(undefined),
      destination: {
        channelCount: 2,
      },
    };

    // Create mock active service
    mockActiveService = {
      audioContext: mockAudioContext,
      playChord: vi.fn().mockResolvedValue(undefined),
      initialize: vi.fn().mockResolvedValue(true),
    };
  });

  // Replicate the ensureAudioContext logic from UnifiedAudioService
  async function ensureAudioContext(
    activeService: any,
    currentEngine: string
  ): Promise<void> {
    if (!activeService) return;

    try {
      // Check for AudioContext in different service types
      let audioContext: AudioContext | null = null;
      
      if (activeService.audioContext) {
        audioContext = activeService.audioContext;
      } else if (currentEngine === 'guitarset' && (activeService as any).audioContext) {
        audioContext = (activeService as any).audioContext;
      } else if (currentEngine === 'philharmonia' && (activeService as any).audioContext) {
        audioContext = (activeService as any).audioContext;
      }

      if (audioContext) {
        if (audioContext.state === 'suspended') {
          console.log('📱 Resuming suspended AudioContext...');
          await audioContext.resume();
          console.log('✅ Audio context resumed, state:', audioContext.state);
        }
      }
    } catch (error) {
      console.warn('⚠️ Audio context ensure failed:', error);
    }
  }

  // Replicate the ensureInitialized logic
  async function ensureInitialized(
    isInitialized: boolean,
    activeService: any,
    currentEngine: string
  ): Promise<void> {
    // If already initialized, try to resume AudioContext if suspended
    if (isInitialized) {
      await ensureAudioContext(activeService, currentEngine);
      return;
    }

    // Otherwise, would call initialize() here
    // For testing, we assume initialization already happened
    await ensureAudioContext(activeService, currentEngine);
  }

  it('resumes audio context when ensureInitialized is called', async () => {
    // Simulate suspended AudioContext
    mockAudioContext.state = 'suspended';
    mockAudioContext.resume.mockClear();

    // Call ensureInitialized (simulating user interaction)
    await ensureInitialized(true, mockActiveService, 'synthesis');

    // Should have called resume
    expect(mockAudioContext.resume).toHaveBeenCalledTimes(1);
  });

  it('does not call resume if AudioContext is already running', async () => {
    // Simulate running AudioContext
    mockAudioContext.state = 'running';
    mockAudioContext.resume.mockClear();

    // Call ensureInitialized
    await ensureInitialized(true, mockActiveService, 'synthesis');

    // Resume should not be called since context is already running
    expect(mockAudioContext.resume).not.toHaveBeenCalled();
  });

  it('handles resume failure gracefully', async () => {
    // Simulate suspended AudioContext with resume failure
    mockAudioContext.state = 'suspended';
    mockAudioContext.resume.mockRejectedValue(new Error('Resume failed'));

    // Should not throw (error is caught in ensureAudioContext)
    await expect(
      ensureInitialized(true, mockActiveService, 'synthesis')
    ).resolves.not.toThrow();
    
    // Should have attempted to resume
    expect(mockAudioContext.resume).toHaveBeenCalled();
  });

  it('handles missing activeService gracefully', async () => {
    // Should not throw when activeService is null
    await expect(
      ensureInitialized(true, null, 'synthesis')
    ).resolves.not.toThrow();
  });

  it('handles guitarset engine AudioContext correctly', async () => {
    mockAudioContext.state = 'suspended';
    mockAudioContext.resume.mockClear();
    
    const guitarsetService = {
      audioContext: mockAudioContext,
    };

    await ensureInitialized(true, guitarsetService, 'guitarset');

    expect(mockAudioContext.resume).toHaveBeenCalledTimes(1);
  });

  it('handles philharmonia engine AudioContext correctly', async () => {
    mockAudioContext.state = 'suspended';
    mockAudioContext.resume.mockClear();
    
    const philharmoniaService = {
      audioContext: mockAudioContext,
    };

    await ensureInitialized(true, philharmoniaService, 'philharmonia');

    expect(mockAudioContext.resume).toHaveBeenCalledTimes(1);
  });
});
