/**
 * 🔄 Audio Resume Hook
 * 
 * Hook para retomar áudio de forma segura após interrupções.
 * 
 * OBJETIVO:
 * - Retomar apenas se o usuário iniciou antes
 * - Não tocar áudio inesperado
 * - Verificar se pode retomar antes de tentar
 */

import { useEffect, useState, useCallback } from 'react';
import { audioLifecycleManager } from '@/services/AudioLifecycleManager';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import type { AudioState } from '@/services/AudioLifecycleManager';

/**
 * Hook para gerenciar retomada de áudio
 * @param componentId - ID do componente que usa o hook
 * @param onResume - Callback quando áudio é retomado
 */
export function useAudioResume(
  componentId: string,
  onResume?: () => void
) {
  const [canResume, setCanResume] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>('idle');

  // Atualizar estado quando lifecycle muda
  useEffect(() => {
    const updateState = () => {
      const session = audioLifecycleManager.getSession();
      setAudioState(session.state);
      setCanResume(audioLifecycleManager.canResume() && session.componentId === componentId);
    };

    // Estado inicial
    updateState();

    // Subscrever mudanças
    const unsubscribe = audioLifecycleManager.subscribe(updateState);

    return unsubscribe;
  }, [componentId]);

  /**
   * Retoma áudio se possível
   * @param userInitiated - Se foi iniciado pelo usuário
   */
  const resume = useCallback(async (userInitiated: boolean = true) => {
    if (!canResume || !userInitiated) {
      console.debug('[useAudioResume] Não pode retomar:', { canResume, userInitiated });
      return false;
    }

    // Verificar se pode retomar
    const resumed = audioLifecycleManager.resumeSession(userInitiated);
    
    if (resumed) {
      console.log('[useAudioResume] Áudio retomado com sucesso');
      
      // Garantir que AudioContext está ativo
      try {
        await unifiedAudioService.ensureInitialized();
        
        // Callback de retomada
        if (onResume) {
          onResume();
        }
      } catch (error) {
        console.error('[useAudioResume] Erro ao garantir inicialização:', error);
      }
      
      return true;
    }

    return false;
  }, [canResume, onResume]);

  return {
    canResume,
    audioState,
    resume,
  };
}
