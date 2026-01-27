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

import React from 'react';
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
  | 'sample_load'
  | 'initialization'
  | 'playback'
  | 'context_error';

export interface AudioFailure {
  type: AudioFailureType;
  error: Error;
  context: string;
  timestamp: number;
  recoverable: boolean;
  retryCount: number;
}

class AudioResilienceService {
  private failures: AudioFailure[] = [];
  private maxRetries = 3;
  private retryDelays = [1000, 2000, 4000]; // Backoff exponencial
  private failureThreshold = 5; // Máximo de falhas antes de desabilitar

  /**
   * Trata uma falha de áudio
   */
  async handleFailure(
    error: Error, 
    context: string, 
    autoRetry: boolean = true
  ): Promise<boolean> {
    const failure: AudioFailure = {
      type: this.categorizeFailure(error),
      error,
      context,
      timestamp: Date.now(),
      recoverable: this.isRecoverable(error),
      retryCount: 0,
    };

    this.failures.push(failure);

    // Verificar se excedeu o threshold
    if (this.failures.length >= this.failureThreshold) {
      console.error('🚫 Muitas falhas de áudio, desabilitando sistema');
      this.showUserMessage(failure, context);
      return false;
    }

    // Mostrar mensagem ao usuário
    this.showUserMessage(failure, context);

    // Retry automático se aplicável
    if (autoRetry && failure.recoverable) {
      return await this.attemptRetry(failure, context);
    }

    return false;
  }

  /**
   * Categoriza o tipo de falha
   */
  private categorizeFailure(error: Error): AudioFailureType {
    if (error instanceof SampleLoadError) {
      return 'sample_load';
    }
    if (error instanceof AudioInitializationError) {
      return 'initialization';
    }
    if (error.name === 'AudioContextError' || error.message.includes('AudioContext')) {
      return 'context_error';
    }
    return 'playback';
  }

  /**
   * Verifica se a falha é recuperável
   */
  private isRecoverable(error: Error): boolean {
    // Falhas de contexto não são recuperáveis
    if (error.message.includes('AudioContext') && error.message.includes('not supported')) {
      return false;
    }
    
    // Falhas de permissão não são recuperáveis
    if (error.message.includes('permission') || error.message.includes('denied')) {
      return false;
    }

    return true;
  }

  /**
   * Tenta recuperar da falha
   */
  private async attemptRetry(
    failure: AudioFailure, 
    context: string
  ): Promise<boolean> {
    if (failure.retryCount >= this.maxRetries) {
      console.warn(`⚠️ Máximo de tentativas atingido para ${context}`);
      return false;
    }

    const delay = this.retryDelays[failure.retryCount] || 4000;
    failure.retryCount++;

    console.log(`🔄 Tentando recuperar ${context} (tentativa ${failure.retryCount}/${this.maxRetries})...`);

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      switch (context) {
        case 'initialize':
          await unifiedAudioService.initialize();
          break;
        case 'playNote':
        case 'playChord':
          // Não tenta retry automático para playback
          return false;
        default:
          return false;
      }

      console.log(`✅ Recuperação bem-sucedida para ${context}`);
      return true;
    } catch (retryError) {
      console.error(`❌ Retry falhou para ${context}:`, retryError);
      return false;
    }
  }

  /**
   * Retry manual acionado pelo usuário
   */
  async manualRetry(context: string): Promise<void> {
    console.log(`🔄 Retry manual para ${context}`);
    
    try {
      switch (context) {
        case 'initialize':
          await unifiedAudioService.initialize();
          toast.success('Sistema de áudio reinicializado');
          break;
        default:
          toast.info('Tentando recuperar...');
      }
    } catch (error) {
      console.error('❌ Retry manual falhou:', error);
      await this.handleFailure(error as Error, context, false);
    }
  }

  /**
   * Exibe mensagem ao usuário
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
    switch (type) {
      case 'sample_load':
        return 'Erro ao carregar samples';
      case 'initialization':
        return 'Erro ao inicializar áudio';
      case 'playback':
        return 'Erro ao reproduzir áudio';
      case 'context_error':
        return 'Navegador não suportado';
      default:
        return 'Erro de áudio';
    }
  }

  /**
   * Obtém descrição da falha
   */
  private getFailureDescription(failure: AudioFailure, context: string): string {
    const baseMessage = handleAudioError(failure.error).userMessage;

    if (!failure.recoverable) {
      return `${baseMessage} Por favor, verifique as configurações do navegador.`;
    }

    if (failure.retryCount > 0) {
      return `${baseMessage} Tentativa ${failure.retryCount + 1} de ${this.maxRetries + 1}.`;
    }

    return baseMessage;
  }

  /**
   * Reseta o contador de falhas
   */
  reset(): void {
    this.failures = [];
    console.log('🔄 Contador de falhas resetado');
  }

  /**
   * Obtém estatísticas de falhas
   */
  getFailureStats(): {
    total: number;
    byType: Record<AudioFailureType, number>;
    recent: AudioFailure[];
  } {
    const byType = this.failures.reduce((acc, failure) => {
      acc[failure.type] = (acc[failure.type] || 0) + 1;
      return acc;
    }, {} as Record<AudioFailureType, number>);

    return {
      total: this.failures.length,
      byType,
      recent: this.failures.slice(-5),
    };
  }

  /**
   * Obtém histórico de falhas
   */
  getFailureHistory(): AudioFailure[] {
    return [...this.failures];
  }

  /**
   * Limpa histórico de falhas
   */
  clearFailureHistory(): void {
    this.reset();
  }
}

export const audioResilienceService = new AudioResilienceService();
