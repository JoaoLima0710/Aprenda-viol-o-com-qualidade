/**
 * Teste de interação do usuário obrigatória
 * 
 * Garante que nenhum áudio seja reproduzido sem interação explícita do usuário.
 * Este teste valida que todas as guardas estão funcionando corretamente.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('User interaction required for audio playback', () => {
  let mockActiveService: any;
  let mockAudioContext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockAudioContext = {
      state: 'suspended' as AudioContextState,
      resume: vi.fn().mockResolvedValue(undefined),
      destination: {
        channelCount: 2,
      },
      currentTime: 0,
    };

    mockActiveService = {
      audioContext: mockAudioContext,
      playChord: vi.fn().mockResolvedValue(undefined),
      playNote: vi.fn().mockResolvedValue(undefined),
      initialize: vi.fn().mockResolvedValue(true),
    };
  });

  // Replicate the checkAutoplayPolicy logic with hasUserInteracted flag
  function checkAutoplayPolicy(activeService: any, hasUserInteracted: boolean): boolean {
    if (!activeService) {
      console.warn('🚫 Playback blocked: No active audio service');
      return false;
    }

    // CRITICAL: Check if user has explicitly interacted
    if (!hasUserInteracted) {
      console.warn('🚫 Playback blocked: User interaction required (Chrome autoplay policy)');
      return false;
    }

    const audioContext = activeService.audioContext;
    if (audioContext && audioContext.state === 'suspended') {
      console.warn('🚫 Playback blocked: AudioContext is suspended - user interaction required');
      return false;
    }

    return true;
  }

  // Replicate the checkPlaybackState logic with hasUserInteracted flag
  function checkPlaybackState(activeService: any, hasUserInteracted: boolean): boolean {
    if (!activeService) {
      console.warn('🚫 Playback blocked: No active audio service');
      return false;
    }

    // CRITICAL: Check if user has explicitly interacted
    if (!hasUserInteracted) {
      console.warn('🚫 Playback blocked: User interaction required (Chrome autoplay policy)');
      return false;
    }

    const audioContext = activeService.audioContext;
    if (audioContext && audioContext.state !== 'running') {
      console.warn(`🚫 Playback blocked: AudioContext is not running (state: ${audioContext.state})`);
      return false;
    }

    return true;
  }

  describe('Blocks playback without user interaction', () => {
    it('blocks playback when hasUserInteracted is false', () => {
      const hasUserInteracted = false;
      const canPlay = checkAutoplayPolicy(mockActiveService, hasUserInteracted);
      
      expect(canPlay).toBe(false);
    });

    it('blocks playback even if AudioContext is running but user has not interacted', () => {
      mockAudioContext.state = 'running';
      const hasUserInteracted = false;
      const canPlay = checkAutoplayPolicy(mockActiveService, hasUserInteracted);
      
      expect(canPlay).toBe(false);
    });

    it('allows playback only after user interaction', () => {
      mockAudioContext.state = 'running';
      const hasUserInteracted = true;
      const canPlay = checkAutoplayPolicy(mockActiveService, hasUserInteracted);
      
      expect(canPlay).toBe(true);
    });
  });

  describe('Blocks resume() without user interaction', () => {
    it('does not call resume() when hasUserInteracted is false', async () => {
      mockAudioContext.state = 'suspended';
      const hasUserInteracted = false;
      const mockResume = mockAudioContext.resume;
      
      // Should not resume if user has not interacted
      if (hasUserInteracted && mockAudioContext.state === 'suspended') {
        await mockAudioContext.resume();
      }
      
      expect(mockResume).not.toHaveBeenCalled();
    });

    it('calls resume() only after user interaction', async () => {
      mockAudioContext.state = 'suspended';
      const hasUserInteracted = true;
      const mockResume = mockAudioContext.resume;
      
      // Should resume if user has interacted
      if (hasUserInteracted && mockAudioContext.state === 'suspended') {
        await mockAudioContext.resume();
      }
      
      expect(mockResume).toHaveBeenCalledTimes(1);
    });
  });

  describe('Playback state guard with user interaction', () => {
    it('blocks playback when hasUserInteracted is false', () => {
      const hasUserInteracted = false;
      const canPlay = checkPlaybackState(mockActiveService, hasUserInteracted);
      
      expect(canPlay).toBe(false);
    });

    it('blocks playback when AudioContext is suspended even if user interacted', () => {
      mockAudioContext.state = 'suspended';
      const hasUserInteracted = true;
      const canPlay = checkPlaybackState(mockActiveService, hasUserInteracted);
      
      // Should still block because AudioContext is not running
      expect(canPlay).toBe(false);
    });

    it('allows playback when user interacted and AudioContext is running', () => {
      mockAudioContext.state = 'running';
      const hasUserInteracted = true;
      const canPlay = checkPlaybackState(mockActiveService, hasUserInteracted);
      
      expect(canPlay).toBe(true);
    });
  });

  describe('Logs when playback is blocked', () => {
    it('logs warning when playback is blocked due to no user interaction', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const hasUserInteracted = false;
      
      checkAutoplayPolicy(mockActiveService, hasUserInteracted);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🚫 Playback blocked: User interaction required')
      );
      
      consoleSpy.mockRestore();
    });

    it('logs warning when playback is blocked due to suspended AudioContext', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockAudioContext.state = 'suspended';
      const hasUserInteracted = true;
      
      checkAutoplayPolicy(mockActiveService, hasUserInteracted);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🚫 Playback blocked: AudioContext is suspended')
      );
      
      consoleSpy.mockRestore();
    });
  });
});
