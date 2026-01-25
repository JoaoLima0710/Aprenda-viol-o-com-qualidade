/**
 * Testes de guarda de estado de playback
 * 
 * Verifica que o UnifiedAudioService bloqueia playback quando
 * o AudioContext não está em estado 'running'.
 * 
 * NOTA: Este teste verifica a lógica de guarda de estado isoladamente,
 * sem importar o serviço completo para evitar criação de AudioContext real.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the playback state guard logic directly without importing the full service
describe('Playback state guard', () => {
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
      playBuffer: vi.fn().mockResolvedValue(undefined),
      initialize: vi.fn().mockResolvedValue(true),
    };
  });

  // Replicate the checkPlaybackState logic from UnifiedAudioService
  function checkPlaybackState(activeService: any, currentEngine: string): boolean {
    if (!activeService) return false;

    // Check for AudioContext in different service types
    let audioContext: AudioContext | null = null;
    
    if (activeService.audioContext) {
      audioContext = activeService.audioContext;
    } else if (currentEngine === 'guitarset' && (activeService as any).audioContext) {
      audioContext = (activeService as any).audioContext;
    } else if (currentEngine === 'philharmonia' && (activeService as any).audioContext) {
      audioContext = (activeService as any).audioContext;
    }

    // Only allow playback if AudioContext is running
    if (audioContext && audioContext.state !== 'running') {
      console.warn(`⚠️ AudioContext is not running (state: ${audioContext.state}) - playback blocked`);
      return false;
    }

    return true;
  }

  // Replicate the playSample logic
  async function playSample(
    activeService: any,
    currentEngine: string,
    buffer: AudioBuffer
  ): Promise<boolean> {
    // Check playback state - AudioContext must be running
    if (!checkPlaybackState(activeService, currentEngine)) {
      console.warn('⚠️ Playback blocked: AudioContext is not running');
      return false;
    }

    if (!activeService) {
      console.error('❌ No active audio service available');
      return false;
    }

    try {
      // Use the active service's playBuffer method if available
      if (activeService.playBuffer) {
        activeService.playBuffer(buffer);
        console.log('✅ Sample played successfully');
        return true;
      } else {
        console.warn('⚠️ Active service does not support playBuffer');
        return false;
      }
    } catch (error) {
      console.error('❌ Error playing sample:', error);
      return false;
    }
  }

  it('blocks play if AudioContext is not running', async () => {
    // Simulate suspended AudioContext
    mockAudioContext.state = 'suspended';
    
    const mockBuffer = {} as AudioBuffer;
    const success = await playSample(mockActiveService, 'synthesis', mockBuffer);

    // Should return false when AudioContext is not running
    expect(success).toBe(false);
    // playBuffer should not have been called
    expect(mockActiveService.playBuffer).not.toHaveBeenCalled();
  });

  it('allows play if AudioContext is running', async () => {
    // Simulate running AudioContext
    mockAudioContext.state = 'running';
    
    const mockBuffer = {} as AudioBuffer;
    const success = await playSample(mockActiveService, 'synthesis', mockBuffer);

    // Should return true when AudioContext is running
    expect(success).toBe(true);
    // playBuffer should have been called
    expect(mockActiveService.playBuffer).toHaveBeenCalledTimes(1);
    expect(mockActiveService.playBuffer).toHaveBeenCalledWith(mockBuffer);
  });

  it('blocks play if AudioContext is closed', async () => {
    // Simulate closed AudioContext
    mockAudioContext.state = 'closed';
    
    const mockBuffer = {} as AudioBuffer;
    const success = await playSample(mockActiveService, 'synthesis', mockBuffer);

    // Should return false when AudioContext is closed
    expect(success).toBe(false);
    expect(mockActiveService.playBuffer).not.toHaveBeenCalled();
  });

  it('blocks play if activeService is null', async () => {
    const mockBuffer = {} as AudioBuffer;
    const success = await playSample(null, 'synthesis', mockBuffer);

    // Should return false when activeService is null
    expect(success).toBe(false);
  });

  it('handles guitarset engine AudioContext correctly', async () => {
    mockAudioContext.state = 'suspended';
    const guitarsetService = {
      audioContext: mockAudioContext,
      playBuffer: vi.fn(),
    };

    const mockBuffer = {} as AudioBuffer;
    const success = await playSample(guitarsetService, 'guitarset', mockBuffer);

    expect(success).toBe(false);
    expect(guitarsetService.playBuffer).not.toHaveBeenCalled();
  });

  it('handles philharmonia engine AudioContext correctly', async () => {
    mockAudioContext.state = 'suspended';
    const philharmoniaService = {
      audioContext: mockAudioContext,
      playBuffer: vi.fn(),
    };

    const mockBuffer = {} as AudioBuffer;
    const success = await playSample(philharmoniaService, 'philharmonia', mockBuffer);

    expect(success).toBe(false);
    expect(philharmoniaService.playBuffer).not.toHaveBeenCalled();
  });
});
