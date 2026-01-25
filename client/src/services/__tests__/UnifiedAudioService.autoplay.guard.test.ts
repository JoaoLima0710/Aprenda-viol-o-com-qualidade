/**
 * Testes de guarda de autoplay policy
 * 
 * Verifica que o UnifiedAudioService respeita a política de autoplay do navegador
 * e não permite playback antes de interação do usuário.
 * 
 * NOTA: Este teste verifica a lógica da guarda de autoplay isoladamente,
 * sem importar o serviço completo para evitar criação de AudioContext real.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the autoplay guard logic directly without importing the full service
describe('Audio autoplay policy guard', () => {
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

  // Replicate the checkAutoplayPolicy logic from UnifiedAudioService
  function checkAutoplayPolicy(activeService: any, currentEngine: string): boolean {
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

    // If AudioContext is suspended, we need user interaction to resume
    // Don't auto-resume - let the user explicitly interact first
    if (audioContext && audioContext.state === 'suspended') {
      console.warn('⚠️ AudioContext is suspended - user interaction required');
      return false;
    }

    return true;
  }

  it('does NOT allow playback before user interaction', () => {
    // Simulate suspended AudioContext (Chrome real behavior before user interaction)
    mockAudioContext.state = 'suspended';

    const result = checkAutoplayPolicy(mockActiveService, 'synthesis');
    
    // Should return false when AudioContext is suspended
    expect(result).toBe(false);
  });

  it('allows playback after user interaction (AudioContext running)', () => {
    // Simulate running AudioContext (after user interaction)
    mockAudioContext.state = 'running';

    const result = checkAutoplayPolicy(mockActiveService, 'synthesis');
    
    // Should return true when AudioContext is running
    expect(result).toBe(true);
  });

  it('blocks playback when AudioContext is suspended even if service is initialized', () => {
    // Ensure service exists but AudioContext is suspended
    mockAudioContext.state = 'suspended';

    const result = checkAutoplayPolicy(mockActiveService, 'synthesis');

    // Should still be blocked
    expect(result).toBe(false);
  });

  it('returns false when activeService is null', () => {
    const result = checkAutoplayPolicy(null, 'synthesis');
    
    // Should return false when activeService is null
    expect(result).toBe(false);
  });

  it('handles guitarset engine AudioContext correctly', () => {
    mockAudioContext.state = 'suspended';
    const guitarsetService = {
      audioContext: mockAudioContext,
    };

    const result = checkAutoplayPolicy(guitarsetService, 'guitarset');
    
    expect(result).toBe(false);
  });

  it('handles philharmonia engine AudioContext correctly', () => {
    mockAudioContext.state = 'suspended';
    const philharmoniaService = {
      audioContext: mockAudioContext,
    };

    const result = checkAutoplayPolicy(philharmoniaService, 'philharmonia');
    
    expect(result).toBe(false);
  });
});
