/**
 * 🎚️ Audio Priority Manager
 * 
 * Gerencia hierarquia sonora entre contextos do app para evitar competição entre sons.
 * 
 * OBJETIVO:
 * - Sons de treino têm prioridade máxima
 * - Sons de UI nunca competem com sons pedagógicos
 * - Teoria musical permite pausa e repetição manual
 * - Gamificação nunca interrompe aprendizado
 * 
 * REGRAS:
 * - NÃO cria múltiplos AudioContexts
 * - NÃO reescreve sistema de prioridade atual, apenas organiza
 * - Consulta antes de tocar som
 */

export type AudioContextType = 
  | 'training'           // Treino (prioridade máxima)
  | 'auditory_perception' // Percepção auditiva
  | 'music_theory'       // Teoria musical
  | 'interface';         // Interface/gamificação (prioridade mínima)

/**
 * Prioridades numéricas (maior = mais prioridade)
 */
const PRIORITIES: Record<AudioContextType, number> = {
  training: 4,              // Prioridade máxima
  auditory_perception: 3,  // Alta prioridade
  music_theory: 2,         // Prioridade média
  interface: 1,            // Prioridade mínima
};

class AudioPriorityManager {
  private currentContext: AudioContextType | null = null;
  private contextStartTime: number | null = null;
  private isTrainingActive: boolean = false;
  private isTheoryPlaying: boolean = false; // Para permitir pausa manual

  /**
   * Define o contexto atual de áudio
   * @param context - Tipo de contexto
   */
  setContext(context: AudioContextType | null): void {
    if (this.currentContext !== context) {
      console.log(`[AudioPriority] Contexto mudou: ${this.currentContext} → ${context}`);
      this.currentContext = context;
      this.contextStartTime = context ? Date.now() : null;
      
      // Atualizar flag de treino ativo
      this.isTrainingActive = context === 'training';
    }
  }

  /**
   * Verifica se um som pode ser tocado baseado na prioridade
   * @param requestedContext - Contexto do som que quer tocar
   * @returns true se pode tocar, false se deve ser bloqueado
   */
  canPlaySound(requestedContext: AudioContextType): boolean {
    // Se não há contexto ativo, sempre permite
    if (!this.currentContext) {
      return true;
    }

    const currentPriority = PRIORITIES[this.currentContext];
    const requestedPriority = PRIORITIES[requestedContext];

    // Regra 1: Sons de treino sempre tocam (prioridade máxima)
    if (requestedContext === 'training') {
      return true;
    }

    // Regra 2: Sons de interface nunca competem com sons pedagógicos
    if (requestedContext === 'interface') {
      // Bloquear se há treino ativo
      if (this.isTrainingActive) {
        console.debug('[AudioPriority] Interface bloqueada: treino ativo');
        return false;
      }
      // Bloquear se há percepção auditiva ativa
      if (this.currentContext === 'auditory_perception') {
        console.debug('[AudioPriority] Interface bloqueada: percepção auditiva ativa');
        return false;
      }
      // Permitir durante teoria (mas teoria pode pausar manualmente)
      return true;
    }

    // Regra 3: Sons de percepção auditiva não competem com treino
    if (requestedContext === 'auditory_perception') {
      // Bloquear se há treino ativo
      if (this.isTrainingActive) {
        console.debug('[AudioPriority] Percepção auditiva bloqueada: treino ativo');
        return false;
      }
      // Permitir se não há contexto ou se é teoria/interface
      return true;
    }

    // Regra 4: Teoria musical permite pausa manual
    if (requestedContext === 'music_theory') {
      // Se teoria está tocando, verificar se pode interromper
      if (this.isTheoryPlaying && this.currentContext === 'music_theory') {
        // Teoria pode ser pausada manualmente (retorna true para permitir)
        return true;
      }
      // Bloquear se há treino ativo
      if (this.isTrainingActive) {
        console.debug('[AudioPriority] Teoria bloqueada: treino ativo');
        return false;
      }
      // Permitir se não há contexto ou se é interface
      return true;
    }

    // Regra padrão: permitir se prioridade é igual ou maior
    return requestedPriority >= currentPriority;
  }

  /**
   * Marca que teoria musical está tocando (para permitir pausa manual)
   */
  setTheoryPlaying(playing: boolean): void {
    this.isTheoryPlaying = playing;
  }

  /**
   * Verifica se teoria musical está tocando
   */
  isTheoryCurrentlyPlaying(): boolean {
    return this.isTheoryPlaying;
  }

  /**
   * Retorna o contexto atual
   */
  getCurrentContext(): AudioContextType | null {
    return this.currentContext;
  }

  /**
   * Verifica se treino está ativo
   */
  isTrainingCurrentlyActive(): boolean {
    return this.isTrainingActive;
  }

  /**
   * Reseta o gerenciador (útil para testes ou reset manual)
   */
  reset(): void {
    this.currentContext = null;
    this.contextStartTime = null;
    this.isTrainingActive = false;
    this.isTheoryPlaying = false;
  }
}

// Exportar instância singleton
export const audioPriorityManager = new AudioPriorityManager();
