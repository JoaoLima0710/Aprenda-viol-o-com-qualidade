import { AudioEngineState, AudioErrorType, AudioEventCallback } from './types';

/**
 * AudioEngine - Singleton que gerencia o AudioContext principal
 * Responsável por inicialização, estado e gerenciamento do contexto de áudio
 */
class AudioEngine {
  private static instance: AudioEngine | null = null;
  private static audioContextCreated: boolean = false; // Global guard
  
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  
  private state: AudioEngineState = {
    isInitialized: false,
    isResumed: false,
    sampleRate: 44100,
    latency: 0,
  };
  
  private eventListeners: Map<string, Set<AudioEventCallback>> = new Map();
  private unlockAttempted: boolean = false;

  private constructor() {
    // Singleton - construtor privado
  }

  /**
   * Obtém a instância única do AudioEngine
   */
  /**
   * Obtém a instância única do AudioEngine
   * Garante que nunca haverá mais de um AudioContext global
   */
  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Inicializa o AudioContext
   * Deve ser chamado após interação do usuário (click, touch, keypress)
   */
  /**
   * Inicializa o AudioContext
   * Deve ser chamado após interação do usuário (click, touch, keypress)
   * Global guard: nunca cria mais de um AudioContext
   */
  public async initialize(): Promise<void> {
    if (this.state.isInitialized && this.audioContext) {
      await this.ensureResumed();
      return;
    }

    if (AudioEngine.audioContextCreated) {
      // Defensive: nunca cria mais de um AudioContext
      throw this.createError('CONTEXT_FAILED', 'Tentativa de criar múltiplos AudioContext! Use AudioEngine singleton.');
    }

    try {
      // Criar AudioContext com fallback para webkit
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw this.createError('CONTEXT_FAILED', 'Web Audio API não suportada neste navegador');
      }

      this.audioContext = new AudioContextClass({
        latencyHint: 'interactive',
        sampleRate: 44100,
      });
      AudioEngine.audioContextCreated = true;

      // Criar nós de processamento
      this.setupAudioGraph();

      // Atualizar estado
      this.state.isInitialized = true;
      this.state.sampleRate = this.audioContext.sampleRate;
      this.state.latency = (this.audioContext.baseLatency || 0) + (this.audioContext.outputLatency || 0);

      // Garantir que o contexto está ativo
      await this.ensureResumed();

      // Configurar listeners para mudanças de estado
      this.setupStateChangeListeners();

      this.emit('initialized', this.state);
      console.log('[AudioEngine] Inicializado com sucesso', {
        sampleRate: this.state.sampleRate,
        latency: this.state.latency,
        state: this.audioContext.state,
      });

    } catch (error) {
      const audioError = this.createError('CONTEXT_FAILED', 'Falha ao inicializar AudioContext', error as Error);
      this.emit('error', audioError);
      throw audioError;
    }
  }

  /**
   * Configura o grafo de áudio (chain de processamento)
   */
  private setupAudioGraph(): void {
    if (!this.audioContext) return;

    // Master gain para controle de volume geral
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.8;

    // Compressor para normalização de dinâmica
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    // Analyser para visualizações e detecção
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    // Conectar: source -> masterGain -> compressor -> analyser -> destination
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  /**
   * Configura listeners para mudanças de estado do contexto
   */
  private setupStateChangeListeners(): void {
    if (!this.audioContext) return;

    this.audioContext.onstatechange = () => {
      if (this.audioContext) {
        this.state.isResumed = this.audioContext.state === 'running';
        this.emit('statechange', { state: this.audioContext.state });
        console.log('[AudioEngine] Estado alterado:', this.audioContext.state);
      }
    };

    // Handler para quando a página perde visibilidade
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.audioContext?.state === 'running') {
        // Opcionalmente suspender quando a aba não está visível
        // this.audioContext.suspend();
      } else if (!document.hidden && this.audioContext?.state === 'suspended') {
        this.ensureResumed();
      }
    });
  }

  /**
   * Garante que o AudioContext está em estado 'running'
   */
  public async ensureResumed(): Promise<void> {
    if (!this.audioContext) {
      throw this.createError('CONTEXT_FAILED', 'AudioContext não inicializado');
    }

    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        this.state.isResumed = true;
        this.emit('resumed');
      } catch (error) {
        console.warn('[AudioEngine] Falha ao resumir contexto:', error);
      }
    }
  }

  /**
   * Tenta desbloquear o áudio em dispositivos móveis
   * Deve ser chamado em resposta a interação do usuário
   */
  public async unlockAudio(): Promise<boolean> {
    if (this.unlockAttempted && this.state.isResumed) {
      return true;
    }

    this.unlockAttempted = true;

    try {
      await this.initialize();

      // Tocar som silencioso para desbloquear em iOS
      if (this.audioContext) {
        const silentBuffer = this.audioContext.createBuffer(1, 1, this.audioContext.sampleRate);
        const source = this.audioContext.createBufferSource();
        source.buffer = silentBuffer;
        source.connect(this.audioContext.destination);
        source.start(0);
        source.stop(0.001);
      }

      await this.ensureResumed();
      return this.state.isResumed;
    } catch (error) {
      console.error('[AudioEngine] Falha ao desbloquear áudio:', error);
      return false;
    }
  }

  /**
   * Retorna o AudioContext (uso interno)
   */
  public getContext(): AudioContext {
    if (!this.audioContext) {
      throw this.createError('CONTEXT_FAILED', 'AudioContext não inicializado. Chame initialize() primeiro.');
    }
    return this.audioContext;
  }

  /**
   * Retorna o nó de ganho master para conexão de sources
   */
  public getMasterGain(): GainNode {
    if (!this.masterGain) {
      throw this.createError('CONTEXT_FAILED', 'AudioEngine não inicializado');
    }
    return this.masterGain;
  }

  /**
   * Retorna o analyser para visualizações
   */
  public getAnalyser(): AnalyserNode {
    if (!this.analyser) {
      throw this.createError('CONTEXT_FAILED', 'AudioEngine não inicializado');
    }
    return this.analyser;
  }

  /**
   * Define o volume master (0.0 a 1.0)
   */
  public setMasterVolume(volume: number): void {
    if (this.masterGain) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      this.masterGain.gain.setTargetAtTime(clampedVolume, this.audioContext?.currentTime || 0, 0.01);
    }
  }

  /**
   * Retorna o tempo atual do contexto de áudio (alta precisão)
   */
  public getCurrentTime(): number {
    return this.audioContext?.currentTime || 0;
  }

  /**
   * Retorna o estado atual do engine
   */
  public getState(): AudioEngineState {
    return { ...this.state };
  }

  /**
   * Verifica se o engine está pronto para uso
   */
  public isReady(): boolean {
    return this.state.isInitialized && this.state.isResumed;
  }

  /**
   * Registra um listener de eventos
   */
  public on(event: string, callback: AudioEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Remove um listener de eventos
   */
  public off(event: string, callback: AudioEventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * Emite um evento
   */
  private emit(event: string, data?: unknown): void {
    this.eventListeners.get(event)?.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('[AudioEngine] Erro em event listener:', error);
      }
    });
  }

  /**
   * Cria um objeto de erro padronizado
   */
  private createError(code: AudioErrorType['code'], message: string, originalError?: Error): AudioErrorType {
    return { code, message, originalError };
  }

  /**
   * Libera recursos e fecha o contexto
   */
  public async dispose(): Promise<void> {
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
      this.compressor = null;
      this.analyser = null;
      this.state.isInitialized = false;
      this.state.isResumed = false;
      this.emit('disposed');
      AudioEngine.audioContextCreated = false;
    }
    AudioEngine.instance = null;
  }
}

export default AudioEngine;
