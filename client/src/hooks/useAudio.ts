import { useState, useEffect, useCallback } from 'react';
import { AudioEngine, initializeAudioSystem, isAudioReady } from '../audio';

interface UseAudioReturn {
  isReady: boolean;
  isInitializing: boolean;
  error: Error | null;
  initialize: () => Promise<void>;
  unlock: () => Promise<boolean>;
}

/**
 * Hook para gerenciar inicialização do sistema de áudio
 */
export function useAudio(): UseAudioReturn {
  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Verificar estado inicial
  useEffect(() => {
    setIsReady(isAudioReady());
  }, []);

  // Listener para mudanças de estado
  useEffect(() => {
    const audioEngine = AudioEngine.getInstance();
    
    const handleStateChange = () => {
      setIsReady(audioEngine.isReady());
    };

    audioEngine.on('initialized', handleStateChange);
    audioEngine.on('resumed', handleStateChange);
    audioEngine.on('statechange', handleStateChange);

    return () => {
      audioEngine.off('initialized', handleStateChange);
      audioEngine.off('resumed', handleStateChange);
      audioEngine.off('statechange', handleStateChange);
    };
  }, []);

  const initialize = useCallback(async () => {
    if (isReady || isInitializing) return;

    setIsInitializing(true);
    setError(null);

    try {
      // CRITICAL: Mark user interaction BEFORE initializing
      // This ensures AudioContext.resume() can be called
      const { unifiedAudioService } = await import('../services/UnifiedAudioService');
      unifiedAudioService.markUserInteraction();
      
      await initializeAudioSystem();
      setIsReady(true);
    } catch (err) {
      setError(err as Error);
      console.error('[useAudio] Erro na inicialização:', err);
    } finally {
      setIsInitializing(false);
    }
  }, [isReady, isInitializing]);

  const unlock = useCallback(async (): Promise<boolean> => {
    const audioEngine = AudioEngine.getInstance();
    const success = await audioEngine.unlockAudio();
    setIsReady(success);
    return success;
  }, []);

  return {
    isReady,
    isInitializing,
    error,
    initialize,
    unlock,
  };
}
