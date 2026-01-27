import { audioService } from './AudioService';
import { audioServiceWithSamples } from './AudioServiceWithSamples';
import { guitarSetAudioService } from './GuitarSetAudioService';
import { philharmoniaAudioService } from './PhilharmoniaAudioService';
import { useAudioSettingsStore } from '@/stores/useAudioSettingsStore';
import type { AudioEngineType, InstrumentType } from '@/stores/useAudioSettingsStore';
export type { AudioEngineType, InstrumentType };
import {
  AudioError,
  AudioContextError,
  AudioInitializationError,
  AudioPlaybackError,
  SampleLoadError,
  BrowserNotSupportedError,
  handleAudioError,
  checkBrowserSupport,
} from '@/errors/AudioErrors';
import { audioResilienceService } from './AudioResilienceService';
import { toast } from 'sonner';

/**
 * Advanced Audio Manager
 * Exclusive service management to prevent conflicts and ensure perfect audio
 * Optimized for mobile devices and PWA environments
 */
class AudioManager {
  private activeService: any = null;
  private currentEngine: AudioEngineType = 'synthesis';
  private isInitialized = false;
  private initializationPromise: Promise<boolean> | null = null;
  private subscribers: Set<(status: any) => void> = new Set();
  private isMobileDevice = false;
  private isMobile = false;
  private isTablet = false;
  private audioContextState: AudioContextState = 'suspended';
  private lastAudioTime = 0;
  private mobileOptimizations = false;
  private hasUserInteracted = false;
  private hasPlayedActivationRitual = false;

  // Debouncing e re-entry protection para stopAll
  private lastStopTime = 0;
  private readonly STOP_DEBOUNCE_MS = 100;
  private isStopping = false;

  constructor() {
    this.detectMobileDevice();
    if (this.isMobile || this.isTablet) {
      this.applyMobileOptimizations();
    }

    // Configurar o AudioResilienceService para usar este manager
    audioResilienceService.setInitializationHandler(async () => {
      await this.initialize();
    });

    // Listen to store changes to auto-switch engines
    useAudioSettingsStore.subscribe((state) => {
      const newState = state as any;
      if (newState.audioEngine !== this.currentEngine) {
        console.log('🎵 Audio engine changed from', this.currentEngine, 'to', newState.audioEngine);
        this.switchEngine(newState.audioEngine).catch(e => console.error('Error auto-switching engine:', e));
      }
    });

    // Mobile-specific listeners
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.handleVisibilityChange(document.hidden);
      });
      window.addEventListener('beforeunload', () => this.emergencyCleanup());
    }
  }

  private detectMobileDevice(): void {
    const userAgent = navigator.userAgent || (window as any).vendor || (window as any).opera;
    this.isMobileDevice = /android|iphone|ipad|ipod/i.test(userAgent);
    this.isMobile = /android|iphone|ipod/i.test(userAgent);
    this.isTablet = /ipad/i.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  private applyMobileOptimizations(): void {
    console.log('⚡ Applying mobile audio optimizations...');
    this.mobileOptimizations = true;
    console.log('✅ Mobile optimizations configured');
  }

  private async handleVisibilityChange(hidden: boolean): Promise<void> {
    if (!this.activeService) return;
    try {
      if (hidden) {
        this.stopAll();
        const audioContext = this.activeService.audioContext || (this.activeService as any).audioContext;
        if (audioContext) {
          try {
            await audioContext.suspend();
            this.audioContextState = 'suspended';
          } catch (error) {
            console.warn('⚠️ Erro ao suspender AudioContext:', error);
          }
        }
      } else {
        console.log('📱 App visível, aguardando interação para retomar áudio');
        if (!this.isInitialized && this.activeService) this.isInitialized = true;
      }
    } catch (error) {
      console.warn('⚠️ Error handling visibility change:', error);
      this.isInitialized = false;
    }
  }

  private emergencyCleanup(): void {
    try {
      this.stopAll();
      if (this.activeService && this.activeService.dispose) {
        this.activeService.dispose();
      }
    } catch (error) {
      console.error('❌ Emergency cleanup failed:', error);
    }
  }

  async initialize(): Promise<boolean> {
    if (this.initializationPromise) return this.initializationPromise;
    this.initializationPromise = this._initializeInternal();
    return this.initializationPromise;
  }

  private async _initializeInternal(): Promise<boolean> {
    try {
      console.log('🎵 Initializing AudioManager...', this.isTablet ? '(Tablet Mode)' : this.isMobile ? '(Mobile Mode)' : '(Desktop Mode)');
      const browserSupport = checkBrowserSupport();
      if (!browserSupport.supported) {
        const error = browserSupport.error || new BrowserNotSupportedError();
        const handled = handleAudioError(error);
        toast.error('Navegador não suportado', { description: handled.message });
        return false;
      }

      const { audioEngine, instrument } = useAudioSettingsStore.getState();
      let actualEngine: AudioEngineType = audioEngine;

      if (this.isTablet) {
        actualEngine = 'guitarset';
        console.log('📱 Tablet: Usando GuitarSet para melhor compatibilidade');
      } else if (this.isMobile && audioEngine !== 'synthesis' && audioEngine !== 'guitarset') {
        actualEngine = 'guitarset';
        console.log('📱 Mobile: Usando GuitarSet para melhor performance');
      }

      const success = await this.switchEngine(actualEngine);
      if (success) {
        await this.setInstrument(instrument as any, true);
        if (this.mobileOptimizations || this.isTablet) await this.ensureAudioContext();
        this.isInitialized = true;
        console.log('✅ AudioManager initialized successfully');
      }
      return !!success;
    } catch (error) {
      console.error('❌ AudioManager initialization error:', error);
      return false;
    }
  }

  async ensureInitialized(): Promise<void> {
    if (this.isInitialized) {
      if (this.hasUserInteracted) {
        await this.ensureAudioContext();
        if (!this.hasPlayedActivationRitual) {
          setTimeout(() => this.playActivationRitual(), 150);
        }
      }
      return;
    }

    if (this.initializationPromise) {
      await this.initializationPromise;
    } else {
      await this.initialize();
    }

    if (this.hasUserInteracted) {
      await this.ensureAudioContext();
      if (!this.hasPlayedActivationRitual) {
        setTimeout(() => this.playActivationRitual(), 150);
      }
    }
  }

  private async ensureAudioContext(): Promise<void> {
    if (!this.activeService || !this.hasUserInteracted) return;
    try {
      let audioContext = this.activeService.audioContext || (this.activeService as any).audioContext;

      if (audioContext && audioContext.state === 'suspended') {
        console.log(`📱 Resuming AudioContext (user interaction confirmed)...`);
        await audioContext.resume();
        this.audioContextState = 'running';
        if (this.isTablet) await new Promise(resolve => setTimeout(resolve, 50));
      } else if (audioContext && audioContext.state === 'running') {
        this.audioContextState = 'running';
      }
    } catch (error) {
      console.warn('⚠️ Audio context ensure failed:', error);
    }
  }

  async switchEngine(engine: AudioEngineType): Promise<boolean> {
    try {
      console.log('🔄 Switching audio engine to:', engine);
      if (this.activeService) {
        await this.activeService.dispose();
      }
      this.activeService = null;
      await new Promise(resolve => setTimeout(resolve, 100));

      this.currentEngine = engine;
      if (engine === 'guitarset') this.activeService = guitarSetAudioService;
      else if (engine === 'philharmonia') this.activeService = philharmoniaAudioService;
      else if (engine === 'samples') this.activeService = audioServiceWithSamples;
      else this.activeService = audioService;

      const { lowLatencyMode } = useAudioSettingsStore.getState();
      let success = await this.activeService.initialize(lowLatencyMode);

      if (!success && engine === 'samples') {
        console.warn('⚠️ Samples engine failed, falling back to synthesis');
        toast.info('Usando áudio sintético');
        this.activeService = audioService;
        this.currentEngine = 'synthesis';
        success = await this.activeService.initialize(lowLatencyMode);
        if (success) useAudioSettingsStore.getState().setAudioEngine('synthesis');
      }

      if (success) {
        console.log('✅ Audio engine switched successfully');
        this.notifySubscribers();
      }
      return success;
    } catch (e: any) {
      const error = e instanceof Error ? e : new Error(String(e));
      await audioResilienceService.handleFailure(error, 'switchEngine', true);
      return false;
    }
  }

  getInstrument(): InstrumentType {
    if (!this.activeService) return useAudioSettingsStore.getState().instrument;
    try {
      return this.activeService.getInstrument() as InstrumentType;
    } catch (error) {
      return 'nylon-guitar';
    }
  }

  async setInstrument(instrument: InstrumentType, skipEnsure = false): Promise<void> {
    if (!skipEnsure) await this.ensureInitialized();
    if (!this.activeService) throw new Error('Audio service not initialized');

    try {
      if (this.currentEngine === 'philharmonia') {
        const philInstrument = this.mapToPhilharmoniaInstrument(instrument);
        await this.activeService.setInstrument(philInstrument as any);
      } else {
        await this.activeService.setInstrument(instrument as any);
      }
      this.notifySubscribers();
    } catch (error) {
      console.error('❌ Error setting instrument:', error);
    }
  }

  private mapToPhilharmoniaInstrument(instrument: InstrumentType): any {
    const mapping: Record<string, string> = {
      'violin': 'violin', 'viola': 'viola', 'cello': 'cello', 'double-bass': 'double_bass',
      'flute': 'flute', 'oboe': 'oboe', 'clarinet': 'clarinet', 'saxophone': 'saxophone',
      'trumpet': 'trumpet', 'french-horn': 'french_horn', 'trombone': 'trombone',
      'guitar': 'guitar', 'mandolin': 'mandolin', 'banjo': 'banjo',
      'nylon-guitar': 'guitar', 'steel-guitar': 'guitar', 'piano': 'violin'
    };
    return mapping[instrument] || 'violin';
  }

  private checkAutoplayPolicy(): boolean {
    if (!this.activeService || !this.hasUserInteracted) return false;
    const audioContext = this.activeService.audioContext || (this.activeService as any).audioContext;
    if (audioContext && audioContext.state === 'suspended') return false;
    return true;
  }

  private checkPlaybackState(): boolean {
    const audioContext = this.activeService?.audioContext || (this.activeService as any)?.audioContext;
    return this.checkAutoplayPolicy() && audioContext?.state === 'running';
  }

  async playChord(chordName: string, duration?: number): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.activeService || !this.checkAutoplayPolicy()) return false;

    // Mobile/Tablet overlapping prevention
    const now = Date.now();
    const minDelay = this.isTablet ? 200 : 100;
    if (this.mobileOptimizations && (now - this.lastAudioTime) < minDelay) {
      await new Promise(resolve => setTimeout(resolve, this.isTablet ? 250 : 150));
    }

    try {
      if (this.mobileOptimizations || this.isTablet) await this.ensureAudioContext();

      const { auditoryFatigueReducer } = await import('./AuditoryFatigueReducer');
      const variation = auditoryFatigueReducer.getVariation(`chord-${chordName}`);
      if (variation === null) return false;
      if (variation.timingVariation > 0) await new Promise(resolve => setTimeout(resolve, variation.timingVariation));

      const actualDuration = this.isTablet ? undefined : duration;
      await this.activeService.playChord(chordName, actualDuration);
      this.lastAudioTime = Date.now();
      return true;
    } catch (e: any) {
      const error = e instanceof Error ? e : new Error(String(e));
      const recovered = await audioResilienceService.handleFailure(error, 'playChord', true);
      if (recovered) {
        await this.activeService.playChord(chordName, this.isTablet ? undefined : duration);
        this.lastAudioTime = Date.now();
        return true;
      }
      await audioResilienceService.playSimpleFallback(chordName, duration || 0.5);
      return false;
    }
  }

  async playChordStrummed(chordName: string, duration?: number): Promise<void> {
    await this.ensureInitialized();
    if (!this.activeService || !this.checkAutoplayPolicy()) return;
    if (!this.activeService.playChordStrummed) {
      await this.playChord(chordName, duration);
      return;
    }
    try {
      await this.activeService.playChordStrummed(chordName, duration);
    } catch (error) {
      console.error('❌ Error playing strummed chord:', error);
    }
  }

  async playScale(scaleName: string, root: string, intervals: number[], duration: number = 0.5): Promise<void> {
    await this.ensureInitialized();
    if (!this.activeService || !this.checkAutoplayPolicy()) return;
    try {
      if (this.mobileOptimizations) await this.ensureAudioContext();
      const actualDuration = this.mobileOptimizations ? Math.max(duration, 0.3) : duration;
      await this.activeService.playScale(scaleName, root, intervals, actualDuration);
      this.lastAudioTime = Date.now();
    } catch (error) {
      console.error('❌ Error playing scale:', error);
    }
  }

  async playNote(note: string, duration?: number): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.activeService || !this.checkAutoplayPolicy()) return false;
    try {
      if (this.mobileOptimizations) await this.ensureAudioContext();

      const { auditoryFatigueReducer } = await import('./AuditoryFatigueReducer');
      const variation = auditoryFatigueReducer.getVariation(`note-${note}`);
      if (variation === null) return false;
      if (variation.timingVariation > 0) await new Promise(resolve => setTimeout(resolve, variation.timingVariation));

      let noteWithOctave = note;
      if (!/\d/.test(note)) noteWithOctave = note + '4';

      if (this.activeService.playNote) {
        await this.activeService.playNote(noteWithOctave, duration);
        this.lastAudioTime = Date.now();
        return true;
      } else {
        await this.playScale(note, note.replace(/\d+$/, ''), [0], duration);
        return true;
      }
    } catch (error) {
      console.error('❌ Error playing note:', error);
      if (this.mobileOptimizations) {
        try {
          await this.reinitialize();
          if (this.activeService?.playNote) {
            await this.activeService.playNote(note, duration);
            return true;
          }
        } catch (e) { }
      }
      return false;
    }
  }

  stopAll(): void {
    // Guard 1: Debouncing - ignorar chamadas muito próximas (< 100ms)
    const now = Date.now();
    if (now - this.lastStopTime < this.STOP_DEBOUNCE_MS) {
      console.log('⏭️ [UnifiedAudioService] stopAll debounced (too soon)');
      return;
    }

    // Guard 2: Re-entry protection - prevenir execução simultânea
    if (this.isStopping) {
      console.log('⏭️ [UnifiedAudioService] stopAll in progress, skipping');
      return;
    }

    this.lastStopTime = now;
    this.isStopping = true;

    try {
      console.log('🛑 [UnifiedAudioService] Stopping all audio...');

      // 1. Parar primeiro o serviço ativo (prioridade máxima)
      if (this.activeService?.stopAll) {
        this.activeService.stopAll();
      }

      // 2. Parar motores secundários apenas se não forem o ativo
      if (this.currentEngine !== 'synthesis' && audioService.stopAll) {
        audioService.stopAll();
      }
      if (this.currentEngine !== 'samples' && audioServiceWithSamples.stopAll) {
        audioServiceWithSamples.stopAll();
      }
      if (this.currentEngine !== 'guitarset' && guitarSetAudioService.stopAll) {
        guitarSetAudioService.stopAll();
      }
      if (this.currentEngine !== 'philharmonia' && philharmoniaAudioService.stopAll) {
        philharmoniaAudioService.stopAll();
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    } finally {
      this.isStopping = false;
    }
  }

  async fadeOutAll(fadeOutDuration: number = 0.15): Promise<void> {
    try {
      const { getAudioBus } = await import('@/audio');
      const audioBus = getAudioBus();
      if (audioBus?.fadeOutAll) await audioBus.fadeOutAll(fadeOutDuration);
      this.stopAll();
    } catch (error) {
      this.stopAll();
    }
  }

  setEQ(bass: number, mid: number, treble: number): void {
    try {
      if (this.activeService?.setEQ) this.activeService.setEQ(bass, mid, treble);
      else if (this.currentEngine === 'synthesis') audioService.setEQ(bass, mid, treble);
    } catch (error) { }
  }

  async dispose(): Promise<void> {
    try {
      if (this.activeService) {
        await this.activeService.dispose();
      }
      this.activeService = null;
      this.isInitialized = false;
      this.notifySubscribers();
    } catch (error) { }
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      currentEngine: this.currentEngine,
      hasActiveService: !!this.activeService,
      audioContextState: this.audioContextState,
      hasUserInteracted: this.hasUserInteracted
    };
  }

  async reinitialize(): Promise<boolean> {
    await this.dispose();
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.initialize();
  }

  async playSample({ buffer, channel }: { buffer: AudioBuffer; channel?: string }): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.checkPlaybackState() || !this.activeService) return false;
    try {
      let audioContext: AudioContext | null = null;
      if (this.activeService.audioContext) audioContext = this.activeService.audioContext;
      else if ((this.activeService as any).audioContext) audioContext = (this.activeService as any).audioContext;

      if (!audioContext) return false;
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      const gainNode = this.activeService.gainNode || audioContext.createGain();
      if (!this.activeService.gainNode) gainNode.connect(audioContext.destination);
      source.connect(gainNode);
      source.start(0);
      this.lastAudioTime = Date.now();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 🎵 Ritual Sonoro de Ativação
   */
  private async playActivationRitual(): Promise<void> {
    if (this.hasPlayedActivationRitual || !this.isInitialized || !this.activeService || !this.hasUserInteracted) return;
    try {
      const { getAudioBus } = await import('@/audio');
      const audioBus = getAudioBus();
      if (!audioBus) return;

      const { AudioEngine } = await import('@/audio');
      if (!AudioEngine.getInstance().isReady()) return;

      const success = await audioBus.playOscillator({
        frequency: 440,
        type: 'sine',
        duration: 0.25,
        channel: 'effects',
        volume: 0.08,
      });

      if (success) {
        this.hasPlayedActivationRitual = true;
        console.log('🎵 [AudioManager] Ritual sonoro de ativação tocado');
      }
    } catch (error) {
      console.debug('Ritual failed:', error);
    }
  }

  markUserInteraction(): void {
    if (!this.hasUserInteracted) {
      this.hasUserInteracted = true;
      if (this.isInitialized) {
        this.ensureAudioContext().then(() => {
          setTimeout(() => this.playActivationRitual(), 150);
        });
      }
    }
  }

  hasUserInteractedWithAudio(): boolean {
    return this.hasUserInteracted;
  }

  private notifySubscribers(): void {
    const status = this.getStatus();
    this.subscribers.forEach(sub => sub(status));
  }
}

export const audioManager = new AudioManager();
export const unifiedAudioService = {
  initialize: () => audioManager.initialize(),
  ensureInitialized: () => audioManager.ensureInitialized(),
  setInstrument: (inst: InstrumentType) => audioManager.setInstrument(inst),
  getInstrument: () => audioManager.getInstrument(),
  playChord: (name: string, dur?: number) => audioManager.playChord(name, dur),
  playChordStrummed: (name: string, dur?: number) => audioManager.playChordStrummed(name, dur),
  playScale: (name: string, root: string, intervals: number[], dur?: number) => audioManager.playScale(name, root, intervals, dur),
  playNote: (note: string, dur?: number) => audioManager.playNote(note, dur),
  stopAll: () => audioManager.stopAll(),
  fadeOutAll: (dur?: number) => audioManager.fadeOutAll(dur),
  setEQ: (b: number, m: number, t: number) => audioManager.setEQ(b, m, t),
  dispose: () => audioManager.dispose(),
  getStatus: () => audioManager.getStatus(),
  reinitialize: () => audioManager.reinitialize(),
  __audioManager: audioManager,
  getInstance: () => audioManager,
  playSample: (params: any) => audioManager.playSample(params),
  markUserInteraction: () => audioManager.markUserInteraction(),
  hasUserInteractedWithAudio: () => audioManager.hasUserInteractedWithAudio(),
  getAudioContext: () => {
    const mgr = audioManager as any;
    if (!mgr.activeService) return null;
    return mgr.activeService.audioContext || (mgr.activeService as any).audioContext;
  }
};
