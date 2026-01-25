/**
 * 🛡️ Audio Resilience Service
 * 
 * Torna o sistema de áudio resiliente a falhas.
 * 
 * OBJETIVO:
 * - Nunca falhar silenciosamente
 * - Detectar falhas de carregamento
 * - Oferecer retry automático e manual
 * - Exibir mensagens claras
 * - Fallback sonoro simples
 * 
 * REGRAS:
 * - Sempre reportar erros ao usuário
 * - Retry automático com backoff exponencial
 * - Fallback para síntese quando samples falham
 * - Mensagens claras e acionáveis
 */

import { unifiedAudioService } from './UnifiedAudioService';
import { audioService } from './AudioService';
import { 
  AudioError, 
  SampleLoadError, 
  AudioInitializationError,
  handleAudioError 
} from '@/errors/AudioErrors';
import { toast } from 'sonner';

export type AudioFailureType = 
  | 'initialization' 
  | 'sample_load' 
  | 'playback' 
  | 'context_suspended'
  | 'network'
  | 'permission'
  | 'unknown';

export interface AudioFailure {
  type: AudioFailureType;
  message: string;
  recoverable: boolean;
  timestamp: number;
  retryCount: number;
  originalError?: Error;
}

class AudioResilienceService {
  private failures: Map<string, AudioFailure> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries = 3;
  private retryDelays = [1000, 2000, 4000]; // Backoff exponencial em ms
  private isRetrying = false;
  private fallbackEnabled = true;

  /**
   * Detecta e trata falha de áudio
   */
  async handleFailure(
    error: unknown,
    context: string = 'unknown',
    autoRetry: boolean = true
  ): Promise<boolean> {
    const failure = this.detectFailure(error, context);
    
    // Armazenar falha
    const failureId = `${failure.type}-${context}-${Date.now()}`;
    this.failures.set(failureId, failure);
    
    // Log detalhado
    console.error(`[AudioResilience] Falha detectada:`, {
      type: failure.type,
      message: failure.message,
      context,
      recoverable: failure.recoverable,
      retryCount: failure.retryCount,
    });

    // Sempre exibir mensagem ao usuário (nunca falhar silenciosamente)
    this.showUserMessage(failure, context);

    // Retry automático se recuperável
    if (failure.recoverable && autoRetry && failure.retryCount < this.maxRetries) {
      return await this.attemptRetry(failure, context);
    }

    // Tentar fallback se disponível
    if (this.fallbackEnabled && failure.type === 'sample_load') {
      return await this.attemptFallback(failure, context);
    }

    return false;
  }

  /**
   * Detecta tipo de falha e cria objeto de falha
   */
  private detectFailure(error: unknown, context: string): AudioFailure {
    const handled = handleAudioError(error);
    const retryCount = this.retryAttempts.get(context) || 0;

    let type: AudioFailureType = 'unknown';
    
    if (error instanceof SampleLoadError) {
      type = 'sample_load';
    } else if (error instanceof AudioInitializationError) {
      type = 'initialization';
    } else if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        type = 'permission';
      } else if (error.name === 'NotSupportedError') {
        type = 'initialization';
      }
    } else if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        type = 'network';
      } else if (error.message.includes('playback') || error.message.includes('play')) {
        type = 'playback';
      }
    }

    return {
      type,
      message: handled.message,
      recoverable: handled.recoverable,
      timestamp: Date.now(),
      retryCount,
      originalError: error instanceof Error ? error : undefined,
    };
  }

  /**
   * Exibe mensagem clara ao usuário
   */
  private showUserMessage(failure: AudioFailure, context: string): void {
    const title = this.getFailureTitle(failure.type);
    const description = this.getFailureDescription(failure, context);
    const action = failure.recoverable ? 'Tentar Novamente' : 'Ver Configurações';

    // Toast com ação de retry
    toast.error(title, {
      description: (
        <div className="space-y-2">
          <p>{description}</p>
          {failure.recoverable && (
            <button
              onClick={() => this.manualRetry(context)}
              className="text-sm underline hover:no-underline"
            >
              {action}
            </button>
          )}
        </div>
      ),
      duration: failure.recoverable ? 8000 : 5000,
      action: failure.recoverable ? {
        label: action,
        onClick: () => this.manualRetry(context),
      } : undefined,
    });
  }

  /**
   * Obtém título da falha
   */
  private getFailureTitle(type: AudioFailureType): string {
    const titles: Record<AudioFailureType, string> = {
      initialization: 'Erro ao Inicializar Áudio',
      sample_load: 'Erro ao Carregar Samples',
      playback: 'Erro ao Reproduzir Áudio',
      context_suspended: 'Áudio Pausado',
      network: 'Erro de Rede',
      permission: 'Permissão Negada',
      unknown: 'Erro de Áudio',
    };
    return titles[type] || titles.unknown;
  }

  /**
   * Obtém descrição detalhada da falha
   */
  private getFailureDescription(failure: AudioFailure, context: string): string {
    if (failure.type === 'sample_load') {
      return 'Não foi possível carregar os samples de áudio. Usando síntese como alternativa.';
    }
    
    if (failure.type === 'initialization') {
      return 'Não foi possível inicializar o sistema de áudio. Verifique se seu navegador suporta Web Audio API.';
    }
    
    if (failure.type === 'playback') {
      return 'Não foi possível reproduzir o áudio. Tente novamente ou verifique as configurações.';
    }
    
    if (failure.type === 'permission') {
      return 'Permissão de áudio negada. Por favor, permita o acesso nas configurações do navegador.';
    }
    
    if (failure.type === 'network') {
      return 'Erro de rede ao carregar áudio. Verifique sua conexão e tente novamente.';
    }

    return failure.message || 'Ocorreu um erro inesperado no sistema de áudio.';
  }

  /**
   * Tenta retry automático com backoff exponencial
   */
  private async attemptRetry(failure: AudioFailure, context: string): Promise<boolean> {
    if (this.isRetrying) {
      console.log('[AudioResilience] Retry já em andamento, ignorando...');
      return false;
    }

    const retryCount = failure.retryCount;
    if (retryCount >= this.maxRetries) {
      console.log('[AudioResilience] Máximo de retries atingido');
      return false;
    }

    this.isRetrying = true;
    const delay = this.retryDelays[retryCount] || this.retryDelays[this.retryDelays.length - 1];
    
    console.log(`[AudioResilience] Tentando retry ${retryCount + 1}/${this.maxRetries} em ${delay}ms...`);

    // Aguardar delay (backoff exponencial)
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      // Tentar reinicializar
      const success = await unifiedAudioService.reinitialize();
      
      if (success) {
        console.log('[AudioResilience] ✅ Retry bem-sucedido!');
        this.retryAttempts.delete(context);
        this.isRetrying = false;
        
        toast.success('Áudio Recuperado', {
          description: 'O sistema de áudio foi reinicializado com sucesso.',
          duration: 3000,
        });
        
        return true;
      } else {
        // Incrementar contador e tentar novamente
        this.retryAttempts.set(context, retryCount + 1);
        failure.retryCount = retryCount + 1;
        this.isRetrying = false;
        
        if (retryCount + 1 < this.maxRetries) {
          // Tentar novamente
          return await this.attemptRetry(failure, context);
        }
      }
    } catch (error) {
      console.error('[AudioResilience] Erro no retry:', error);
      this.retryAttempts.set(context, retryCount + 1);
      failure.retryCount = retryCount + 1;
      this.isRetrying = false;
    }

    return false;
  }

  /**
   * Tenta fallback para síntese quando samples falham
   */
  private async attemptFallback(failure: AudioFailure, context: string): Promise<boolean> {
    if (failure.type !== 'sample_load') {
      return false;
    }

    console.log('[AudioResilience] Tentando fallback para síntese...');

    try {
      // Verificar se já está usando síntese
      const currentEngine = unifiedAudioService.getCurrentEngine();
      if (currentEngine === 'synthesis') {
        console.log('[AudioResilience] Já está usando síntese, fallback não necessário');
        return true;
      }

      // Tentar mudar para síntese
      const success = await unifiedAudioService.switchEngine('synthesis');
      
      if (success) {
        console.log('[AudioResilience] ✅ Fallback para síntese bem-sucedido!');
        
        toast.info('Usando Áudio Sintético', {
          description: 'Samples não disponíveis. Usando síntese como alternativa.',
          duration: 5000,
        });
        
        return true;
      }
    } catch (error) {
      console.error('[AudioResilience] Erro no fallback:', error);
    }

    return false;
  }

  /**
   * Retry manual (chamado pelo usuário)
   */
  async manualRetry(context: string = 'manual'): Promise<boolean> {
    console.log('[AudioResilience] Retry manual solicitado...');
    
    // Resetar contadores
    this.retryAttempts.delete(context);
    
    try {
      const success = await unifiedAudioService.reinitialize();
      
      if (success) {
        toast.success('Áudio Reinicializado', {
          description: 'O sistema de áudio foi reinicializado com sucesso.',
          duration: 3000,
        });
        return true;
      } else {
        toast.error('Falha ao Reinicializar', {
          description: 'Não foi possível reinicializar o áudio. Verifique as configurações.',
          duration: 5000,
        });
        return false;
      }
    } catch (error) {
      await this.handleFailure(error, context, false);
      return false;
    }
  }

  /**
   * Cria fallback sonoro simples (oscilador básico)
   */
  async playSimpleFallback(note: string, duration: number = 0.5): Promise<boolean> {
    try {
      const audioContext = unifiedAudioService.getAudioContext();
      if (!audioContext) {
        return false;
      }

      // Converter nota para frequência
      const frequency = this.noteToFrequency(note);
      
      // Criar oscilador simples
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
      
      return true;
    } catch (error) {
      console.error('[AudioResilience] Erro no fallback sonoro:', error);
      return false;
    }
  }

  /**
   * Converte nota para frequência (fallback simples)
   */
  private noteToFrequency(note: string): number {
    // Mapeamento básico de notas para frequências
    const noteMap: Record<string, number> = {
      'C': 261.63,
      'C#': 277.18, 'Db': 277.18,
      'D': 293.66,
      'D#': 311.13, 'Eb': 311.13,
      'E': 329.63,
      'F': 349.23,
      'F#': 369.99, 'Gb': 369.99,
      'G': 392.00,
      'G#': 415.30, 'Ab': 415.30,
      'A': 440.00,
      'A#': 466.16, 'Bb': 466.16,
      'B': 493.88,
    };

    // Extrair nota e oitava (ex: "C4" -> "C" e 4)
    const match = note.match(/^([A-G][#b]?)(\d+)$/);
    if (!match) {
      return 440; // A4 padrão
    }

    const [, noteName, octave] = match;
    const baseFreq = noteMap[noteName] || 440;
    const octaveNum = parseInt(octave, 10);
    const octaveMultiplier = Math.pow(2, octaveNum - 4); // A4 é referência

    return baseFreq * octaveMultiplier;
  }

  /**
   * Obtém histórico de falhas
   */
  getFailureHistory(): AudioFailure[] {
    return Array.from(this.failures.values());
  }

  /**
   * Limpa histórico de falhas
   */
  clearFailureHistory(): void {
    this.failures.clear();
    this.retryAttempts.clear();
  }

  /**
   * Habilita/desabilita fallback
   */
  setFallbackEnabled(enabled: boolean): void {
    this.fallbackEnabled = enabled;
  }
}

// Export singleton instance
export const audioResilienceService = new AudioResilienceService();
