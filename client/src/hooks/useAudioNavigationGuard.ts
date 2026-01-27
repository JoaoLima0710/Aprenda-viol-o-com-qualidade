/**
 * 🛡️ Audio Navigation Guard Hook
 * 
 * Garante que o áudio seja parado ao trocar de rota e pausado ao esconder o app.
 * 
 * OBJETIVO:
 * - Eliminar áudio fantasma
 * - Evitar estados quebrados
 * - Tornar estados de áudio previsíveis
 * 
 * REGRAS:
 * - NÃO resetar AudioContext global
 * - NÃO quebrar sessões
 * - Stop explícito ao trocar de rota
 * - Pause ao esconder app
 * - Resume apenas com interação
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { audioLifecycleManager } from '@/services/AudioLifecycleManager';

/**
 * Hook para proteger áudio durante navegação
 * Para áudio ao trocar de rota e pausa ao esconder app
 */
export function useAudioNavigationGuard() {
  const [location] = useLocation();
  const previousLocationRef = useRef<string | null>(null);
  const isPausedByVisibilityRef = useRef<boolean>(false);

  // Parar áudio ao trocar de rota
  useEffect(() => {
    // Ignorar primeira renderização
    if (previousLocationRef.current === null) {
      previousLocationRef.current = location;
      return;
    }

    // Se mudou de rota, fazer fade-out suave e limpar schedulers
    if (previousLocationRef.current !== location) {
      console.log(`🛑 [AudioGuard] Rota mudou de ${previousLocationRef.current} para ${location}, fazendo fade-out suave`);

      // Parar sessão de lifecycle (navegação = stop)
      audioLifecycleManager.stopSession();

      // Verificar se há treino ativo (prioridade máxima)
      import('@/services/AudioPriorityManager').then(({ audioPriorityManager }) => {
        const isTrainingActive = audioPriorityManager.isTrainingCurrentlyActive();
        const fadeOutDuration = isTrainingActive ? 0.2 : 0.15; // Fade-out um pouco mais longo para treino

        // Fade-out suave de todo áudio
        unifiedAudioService.fadeOutAll(fadeOutDuration).catch((error) => {
          console.error('[AudioGuard] Erro no fade-out, usando stop abrupto:', error);
          unifiedAudioService.stopAll();
        });
      }).catch(() => {
        // Fallback se AudioPriorityManager não estiver disponível
        unifiedAudioService.fadeOutAll(0.15).catch(() => {
          unifiedAudioService.stopAll();
        });
      });

      // Limpar AudioContextScheduler (cancelar eventos agendados)
      // Fazer isso após fade-out começar para não interromper
      setTimeout(() => {
        import('@/services/AudioContextScheduler').then(({ audioContextScheduler }) => {
          audioContextScheduler.cancelAll();
          audioContextScheduler.cleanup();
        }).catch(() => {
          // Ignorar se não estiver disponível
        });
      }, 50); // Pequeno delay para não interromper fade-out

      // Remover contexto de áudio após fade-out
      setTimeout(() => {
        import('@/services/AudioPriorityManager').then(({ audioPriorityManager }) => {
          audioPriorityManager.setContext(null);
        }).catch(() => { });
      }, 200); // Após fade-out terminar

      previousLocationRef.current = location;
    }
  }, [location]);

  // Pausar áudio ao esconder app (mas NÃO retomar automaticamente)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App escondido: suspender sessão e fazer fade-out suave
        console.log('📱 [AudioGuard] App escondido, suspendendo sessão e fazendo fade-out suave');
        isPausedByVisibilityRef.current = true;

        // Suspender sessão de lifecycle
        audioLifecycleManager.suspendSession();

        try {
          // Fade-out suave de todo áudio
          unifiedAudioService.fadeOutAll(0.15).catch((error) => {
            console.error('[AudioGuard] Erro no fade-out, usando stop abrupto:', error);
            unifiedAudioService.stopAll();
          });

          // Limpar AudioContextScheduler após fade-out começar
          setTimeout(() => {
            import('@/services/AudioContextScheduler').then(({ audioContextScheduler }) => {
              audioContextScheduler.cancelAll();
              audioContextScheduler.cleanup();
            }).catch(() => {
              // Ignorar se não estiver disponível
            });
          }, 50);
        } catch (error) {
          console.error('[AudioGuard] Erro ao pausar áudio:', error);
        }
      } else {
        // App visível: NÃO retomar automaticamente
        // O áudio só será retomado quando o usuário interagir explicitamente
        console.log('📱 [AudioGuard] App visível, mas áudio permanece suspenso até interação do usuário');
        isPausedByVisibilityRef.current = false;
        // NÃO chamar resume() aqui - apenas quando houver interação
        // O AudioLifecycleManager rastreia se pode retomar
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      try {
        // Apenas parar se houver algo realmente tocando e o serviço estiver inicializado
        const status = unifiedAudioService.getStatus();
        if (status.initialized && status.hasActiveService) {
          unifiedAudioService.stopAll();
        }
      } catch (error) {
        console.error('[AudioGuard] Erro no cleanup:', error);
      }
    };
  }, []);
}
