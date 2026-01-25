/**
 * 🔄 Audio Lifecycle Manager
 * 
 * Gerencia o ciclo de vida do áudio de forma previsível e robusta.
 * 
 * OBJETIVO:
 * - Retomar áudio de forma previsível após interrupções
 * - Não tocar áudio inesperado
 * - Retomar apenas se o usuário iniciou antes
 * - Manter estado auditivo consistente
 * 
 * CENÁRIOS:
 * - Minimizar app
 * - Trocar de aba
 * - Pausar treino
 * - Retornar à tela anterior
 */

export type AudioState = 
  | 'idle'           // Nenhum áudio ativo
  | 'playing'         // Áudio tocando normalmente
  | 'paused'         // Áudio pausado pelo usuário
  | 'suspended'      // Áudio suspenso (app minimizado/aba trocada)
  | 'stopped';        // Áudio parado (navegação)

export type AudioContext = 
  | 'none'           // Sem contexto
  | 'training'       // Treino ativo
  | 'auditory_perception'  // Percepção auditiva
  | 'music_theory'   // Teoria musical
  | 'interface';     // Interface/gamificação

interface AudioSession {
  state: AudioState;
  context: AudioContext;
  wasUserInitiated: boolean;  // Se o usuário iniciou o áudio
  previousState: AudioState | null;  // Estado antes de suspender
  suspendedAt: number | null;  // Timestamp quando foi suspenso
  componentId: string | null;  // ID do componente que iniciou
}

class AudioLifecycleManager {
  private currentSession: AudioSession = {
    state: 'idle',
    context: 'none',
    wasUserInitiated: false,
    previousState: null,
    suspendedAt: null,
    componentId: null,
  };

  private listeners: Set<(session: AudioSession) => void> = new Set();

  /**
   * Registra um listener para mudanças de estado
   */
  subscribe(listener: (session: AudioSession) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notifica todos os listeners
   */
  private notify(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentSession);
      } catch (error) {
        console.error('[AudioLifecycle] Erro ao notificar listener:', error);
      }
    });
  }

  /**
   * Inicia uma sessão de áudio
   * @param context - Contexto do áudio
   * @param componentId - ID do componente que iniciou
   * @param userInitiated - Se foi iniciado pelo usuário
   */
  startSession(
    context: AudioContext,
    componentId: string,
    userInitiated: boolean = true
  ): void {
    // Só permite iniciar se estiver idle ou stopped
    if (this.currentSession.state !== 'idle' && this.currentSession.state !== 'stopped') {
      console.warn('[AudioLifecycle] Tentativa de iniciar sessão em estado inválido:', this.currentSession.state);
      return;
    }

    this.currentSession = {
      state: 'playing',
      context,
      wasUserInitiated: userInitiated,
      previousState: null,
      suspendedAt: null,
      componentId,
    };

    console.log(`[AudioLifecycle] Sessão iniciada: ${context} (${componentId})`);
    this.notify();
  }

  /**
   * Pausa a sessão atual (pelo usuário)
   */
  pauseSession(): void {
    if (this.currentSession.state !== 'playing') {
      console.warn('[AudioLifecycle] Tentativa de pausar sessão em estado inválido:', this.currentSession.state);
      return;
    }

    this.currentSession = {
      ...this.currentSession,
      state: 'paused',
      previousState: 'playing',
    };

    console.log('[AudioLifecycle] Sessão pausada pelo usuário');
    this.notify();
  }

  /**
   * Suspende a sessão (app minimizado/aba trocada)
   */
  suspendSession(): void {
    // Só suspende se estiver playing ou paused
    if (this.currentSession.state !== 'playing' && this.currentSession.state !== 'paused') {
      return; // Já está suspenso ou parado
    }

    this.currentSession = {
      ...this.currentSession,
      previousState: this.currentSession.state,
      state: 'suspended',
      suspendedAt: Date.now(),
    };

    console.log(`[AudioLifecycle] Sessão suspensa (estado anterior: ${this.currentSession.previousState})`);
    this.notify();
  }

  /**
   * Retoma a sessão suspensa (apenas se válida)
   * @param userInitiated - Se foi retomado pelo usuário
   * @returns true se retomou, false se não era válido retomar
   */
  resumeSession(userInitiated: boolean = true): boolean {
    if (this.currentSession.state !== 'suspended') {
      console.debug('[AudioLifecycle] Tentativa de retomar sessão não suspensa:', this.currentSession.state);
      return false;
    }

    // Só retoma se:
    // 1. Foi iniciado pelo usuário antes
    // 2. Há um estado anterior válido
    // 3. Foi retomado pelo usuário agora
    if (!this.currentSession.wasUserInitiated) {
      console.log('[AudioLifecycle] Não retomando: sessão não foi iniciada pelo usuário');
      this.stopSession();
      return false;
    }

    if (!this.currentSession.previousState) {
      console.log('[AudioLifecycle] Não retomando: sem estado anterior válido');
      this.stopSession();
      return false;
    }

    if (!userInitiated) {
      console.log('[AudioLifecycle] Não retomando: retomada não foi iniciada pelo usuário');
      return false;
    }

    // Retomar para o estado anterior
    this.currentSession = {
      ...this.currentSession,
      state: this.currentSession.previousState === 'playing' ? 'playing' : 'paused',
      previousState: null,
      suspendedAt: null,
    };

    console.log(`[AudioLifecycle] Sessão retomada: ${this.currentSession.state}`);
    this.notify();
    return true;
  }

  /**
   * Para a sessão (navegação ou fim)
   */
  stopSession(): void {
    this.currentSession = {
      state: 'stopped',
      context: 'none',
      wasUserInitiated: false,
      previousState: null,
      suspendedAt: null,
      componentId: null,
    };

    console.log('[AudioLifecycle] Sessão parada');
    this.notify();
  }

  /**
   * Reseta para estado idle
   */
  reset(): void {
    this.currentSession = {
      state: 'idle',
      context: 'none',
      wasUserInitiated: false,
      previousState: null,
      suspendedAt: null,
      componentId: null,
    };

    console.log('[AudioLifecycle] Estado resetado para idle');
    this.notify();
  }

  /**
   * Retorna o estado atual
   */
  getState(): AudioState {
    return this.currentSession.state;
  }

  /**
   * Retorna o contexto atual
   */
  getContext(): AudioContext {
    return this.currentSession.context;
  }

  /**
   * Retorna a sessão completa
   */
  getSession(): AudioSession {
    return { ...this.currentSession };
  }

  /**
   * Verifica se pode retomar
   */
  canResume(): boolean {
    return (
      this.currentSession.state === 'suspended' &&
      this.currentSession.wasUserInitiated &&
      this.currentSession.previousState !== null
    );
  }

  /**
   * Verifica se está em estado que requer retomada
   */
  needsResume(): boolean {
    return this.currentSession.state === 'suspended' && this.canResume();
  }
}

// Exportar instância singleton
export const audioLifecycleManager = new AudioLifecycleManager();
