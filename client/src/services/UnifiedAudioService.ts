import { audioService } from './AudioService';
import { audioServiceWithSamples } from './AudioServiceWithSamples';
import { guitarSetAudioService } from './GuitarSetAudioService';
import { philharmoniaAudioService } from './PhilharmoniaAudioService';
import { useAudioSettingsStore } from '@/stores/useAudioSettingsStore';
import type { InstrumentType } from './AudioServiceWithSamples';
import type { AudioEngineType } from '@/stores/useAudioSettingsStore';
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
  private hasUserInteracted = false; // Flag para rastrear interação explícita do usuário
  private hasPlayedActivationRitual = false; // Flag para garantir que o ritual toca apenas uma vez por sessão

  constructor() {
    // Detect mobile device for optimizations
    this.detectMobileDevice();

    // Apply mobile-specific optimizations if needed
    if (this.isMobile || this.isTablet) {
      this.applyMobileOptimizations();
    }

    // Listen to store changes to auto-switch engines
    useAudioSettingsStore.subscribe((state) => {
      if (state.audioEngine !== this.currentEngine) {
        console.log('🎵 Audio engine changed from', this.currentEngine, 'to', state.audioEngine);
        this.switchEngine(state.currentEngine);
      }
    });

    // Mobile-specific event listeners
    if (typeof document !== 'undefined') {
      // Listen to visibility changes (important for mobile PWA)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          console.log('📱 App hidden, pausing audio');
          this.handleAppBackground();
          this.handleVisibilityChange(true);
        } else {
          console.log('📱 App visible, mas áudio permanece pausado até interação');
          // NÃO retomar automaticamente - apenas quando houver interação
          this.handleAppForeground();
        }
      });

      // Handle page unload (prevent audio issues)
      window.addEventListener('beforeunload', () => {
        this.emergencyCleanup();
      });
    }
  }

  /**
   * Handle app going to background (mobile optimization)
   */
  private handleAppBackground(): void {
    if (this.mobileOptimizations) {
      console.log('📱 App going to background, suspending audio');
      this.stopAll();
      this.audioContextState = 'suspended';
    }
  }

  /**
   * Handle app coming to foreground (mobile optimization)
   * NÃO retoma automaticamente - apenas quando houver interação do usuário
   */
  private async handleAppForeground(): Promise<void> {
    if (this.mobileOptimizations) {
      console.log('📱 App coming to foreground, mas áudio permanece pausado até interação do usuário');
      // NÃO chamar ensureAudioContext() aqui - apenas quando houver interação explícita
      // O AudioContext será retomado quando o usuário clicar em algo que precise de áudio
    }
  }

  /**
   * Detect mobile devices for specific optimizations
   */
  private detectMobileDevice(): void {
    if (typeof navigator === 'undefined') return;

    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth <= 768;
    const isTabletUA = /ipad|android(?!.*mobile)/i.test(userAgent);

    this.isMobile = isMobileUA && !isTabletUA;
    this.isTablet = isTabletUA || (isMobileUA && window.innerWidth > 768 && window.innerHeight > 1024);
    this.isMobileDevice = this.isMobile || this.isTablet;

    if (this.isMobileDevice) {
      console.log('📱 Mobile/tablet device detected:', {
        isMobile: this.isMobile,
        isTablet: this.isTablet,
        userAgent: userAgent.substring(0, 50) + '...',
        screenSize: `${window.innerWidth}x${window.innerHeight}`
      });

      this.mobileOptimizations = true;

      // Force synthesis engine on mobile/tablet for better performance and compatibility
      const settings = useAudioSettingsStore.getState();
      if (settings.audioEngine !== 'synthesis') {
        console.log('📱 Forcing synthesis engine on mobile/tablet for better performance');
        // Don't change store directly, let the subscription handle it
      }
    } else {
      console.log('🖥️ Desktop device detected');
    }
  }

  /**
   * Apply mobile-specific audio optimizations
   */
  private applyMobileOptimizations(): void {
    console.log('⚡ Applying mobile audio optimizations...');

    // These optimizations will be applied during audio service initialization
    this.mobileOptimizationsConfig = {
      // Reduce reverb for better performance
      reverbWet: 0.1, // Instead of 0.3
      reverbDecay: 1.0, // Instead of 2.5

      // Reduce chorus intensity
      chorusWet: 0.1, // Instead of 0.2
      chorusDepth: 0.3, // Instead of 0.7

      // Shorter note durations for mobile
      defaultNoteDuration: 0.4, // Instead of 0.5-0.6

      // Smaller audio buffers for lower latency
      useSmallerBuffers: true,

      // Disable complex effects on very low-end devices
      disableEffectsOnLowEnd: true
    };

    console.log('✅ Mobile optimizations configured:', this.mobileOptimizationsConfig);
  }

  /**
   * Handle app visibility changes (crucial for mobile PWA)
   */
  private async handleVisibilityChange(hidden: boolean): Promise<void> {
    if (!this.activeService) return;

    try {
      if (hidden) {
        // App going to background - parar todo áudio e suspender contexto
        this.stopAll();
        if (this.currentEngine === 'samples' && this.activeService.audioContext) {
          try {
            await this.activeService.audioContext.suspend();
            this.audioContextState = 'suspended';
          } catch (error) {
            console.warn('⚠️ Erro ao suspender AudioContext:', error);
          }
        }
      } else {
        // App coming to foreground - NÃO retomar automaticamente
        // O AudioContext permanecerá suspenso até interação do usuário
        // Não chamar resume() aqui - apenas quando houver interação explícita
        console.log('📱 App visível, mas AudioContext permanece suspenso até interação do usuário');
        
        // Re-ensure initialization state after visibility change
        // This handles cases where the service might have been reset
        if (!this.isInitialized && this.activeService) {
          // Service exists but flag is false - reset flag
          this.isInitialized = true;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error handling visibility change:', error);
      // On error, mark as not initialized to force re-initialization on next use
      this.isInitialized = false;
    }
  }

  /**
   * Emergency cleanup on page unload
   */
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

  /**
   * Subscribe to audio manager status changes
   */
  subscribe(callback: (status: any) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of status changes
   */
  private notifySubscribers() {
    const status = this.getStatus();
    this.subscribers.forEach(callback => callback(status));
  }

  /**
   * Mark that user has explicitly interacted (required for Chrome autoplay policy)
   * This must be called before any audio playback can occur
   */
  markUserInteraction(): void {
    if (!this.hasUserInteracted) {
      this.hasUserInteracted = true;
      console.log('✅ User interaction detected - audio unlock allowed');
      
      // Tocar ritual sonoro de ativação após interação do usuário
      // Aguardar um pequeno delay para garantir que o sistema está pronto
      setTimeout(() => {
        this.playActivationRitual();
      }, 150);
    }
  }

  /**
   * Check if user has explicitly interacted
   */
  hasUserInteractedWithAudio(): boolean {
    return this.hasUserInteracted;
  }

  /**
   * Ensure audio service is initialized before use
   * Thread-safe: handles concurrent calls gracefully
   * Prevents race conditions during component mount/unmount
   * 
   * NOTE: This method can be called in response to user interaction,
   * but will only resume AudioContext if hasUserInteracted is true.
   */
  async ensureInitialized(): Promise<void> {
    // If already initialized, try to resume AudioContext if suspended
    // BUT ONLY if user has explicitly interacted
    if (this.isInitialized) {
      if (this.hasUserInteracted) {
        await this.ensureAudioContext();
        
        // Tocar ritual sonoro se ainda não tocou
        if (!this.hasPlayedActivationRitual) {
          setTimeout(() => {
            this.playActivationRitual();
          }, 150);
        }
      } else {
        console.warn('⚠️ AudioContext suspended - user interaction required before resume');
      }
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      await this.initializationPromise;
      // After initialization, ensure AudioContext is resumed ONLY if user interacted
      if (this.hasUserInteracted) {
        await this.ensureAudioContext();
        
        // Tocar ritual sonoro após inicialização se ainda não tocou
        if (!this.hasPlayedActivationRitual) {
          setTimeout(() => {
            this.playActivationRitual();
          }, 150);
        }
      } else {
        console.warn('⚠️ AudioContext suspended - user interaction required before resume');
      }
      return;
    }

    // Start initialization
    await this.initialize();
    // After initialization, ensure AudioContext is resumed ONLY if user interacted
    if (this.hasUserInteracted) {
      await this.ensureAudioContext();
      
      // Tocar ritual sonoro após inicialização se ainda não tocou
      if (!this.hasPlayedActivationRitual) {
        setTimeout(() => {
          this.playActivationRitual();
        }, 150);
      }
    } else {
      console.warn('⚠️ AudioContext suspended - user interaction required before resume');
    }
  }

  /**
   * Initialize the audio system with exclusive service management
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      console.log('✅ AudioManager already initialized');
      return true;
    }

    if (this.initializationPromise) {
      console.log('⏳ AudioManager initialization in progress...');
      return this.initializationPromise;
    }

    this.initializationPromise = this._initializeInternal();

    try {
      const result = await this.initializationPromise;
      this.isInitialized = result;
      this.notifySubscribers();
      return result;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async _initializeInternal(): Promise<boolean> {
    try {
      console.log('🎵 Initializing AudioManager...', this.isTablet ? '(Tablet Mode)' : this.isMobile ? '(Mobile Mode)' : '(Desktop Mode)');
      
      // Verificar suporte do navegador
      const browserSupport = checkBrowserSupport();
      if (!browserSupport.supported) {
        const error = browserSupport.error || new BrowserNotSupportedError();
        const handled = handleAudioError(error);
        console.error('❌', handled.message);
        toast.error('Navegador não suportado', {
          description: handled.message,
        });
        return false;
      }

      // Get initial settings
      const { audioEngine, instrument, lowLatencyMode } = useAudioSettingsStore.getState();

      // IMPORTANTE: Em tablets, NÃO forçar synthesis - usar GuitarSet que tem samples reais
      // Tablets têm problemas com Tone.js synthesis, mas funcionam bem com Web Audio API direta
      let actualEngine: AudioEngineType = audioEngine;
      
      if (this.isTablet) {
        // Tablets funcionam melhor com GuitarSet (Web Audio API pura)
        actualEngine = 'guitarset';
        console.log('📱 Tablet: Usando GuitarSet (samples reais) para melhor compatibilidade');
      } else if (this.isMobile && audioEngine !== 'synthesis' && audioEngine !== 'guitarset') {
        // Celulares podem usar synthesis ou guitarset
        actualEngine = 'guitarset';
        console.log('📱 Mobile: Usando GuitarSet para melhor performance');
      }

      // Force initial engine switch to ensure clean state
      const success = await this.switchEngine(actualEngine);

      if (success) {
        // Set initial instrument
        await this.setInstrument(instrument);

        // Mobile/Tablet-specific: Ensure audio context is ready
        if (this.mobileOptimizations || this.isTablet) {
          await this.ensureAudioContext();
        }

        console.log('✅ AudioManager initialized successfully with', actualEngine, 'engine');
      } else {
        console.error('❌ AudioManager initialization failed, trying fallback...');
        // Fallback: tentar synthesis se guitarset falhar
        const fallbackSuccess = await this.switchEngine('synthesis');
        if (fallbackSuccess) {
          console.log('✅ Fallback to synthesis successful');
          return true;
        }
      }

      return success;
    } catch (error) {
      console.error('❌ AudioManager initialization error:', error);
      return false;
    }
  }

  /**
   * Ensure audio context is running (crucial for mobile and tablets)
   * CRITICAL: Only resumes if user has explicitly interacted
   */
  private async ensureAudioContext(): Promise<void> {
    if (!this.activeService) return;

    // CRITICAL: Do not resume AudioContext without explicit user interaction
    if (!this.hasUserInteracted) {
      console.warn('🚫 AudioContext resume blocked - user interaction required');
      return;
    }

    try {
      // Check for AudioContext in different service types
      let audioContext: AudioContext | null = null;
      
      if (this.activeService.audioContext) {
        audioContext = this.activeService.audioContext;
      } else if (this.currentEngine === 'guitarset' && (this.activeService as any).audioContext) {
        audioContext = (this.activeService as any).audioContext;
      } else if (this.currentEngine === 'philharmonia' && (this.activeService as any).audioContext) {
        audioContext = (this.activeService as any).audioContext;
      }

      if (audioContext) {
        if (audioContext.state === 'suspended') {
          // NOTE: This resume() is ONLY called after explicit user interaction
          // hasUserInteracted flag ensures we don't violate autoplay policy
          console.log(`📱 ${this.isTablet ? 'Tablet' : 'Mobile'}: Resuming suspended AudioContext (user interaction confirmed)...`);
          await audioContext.resume();
          this.audioContextState = 'running';
          console.log('✅ Audio context resumed, state:', audioContext.state);
          
          // Additional delay for tablets to ensure context is fully ready
          if (this.isTablet) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        } else if (audioContext.state === 'running') {
          this.audioContextState = 'running';
        }

        // NOTE: Removed testAudioContext() call to prevent any audio playback
        // before explicit user interaction. This ensures Chrome autoplay policy compliance.
        // Audio will only play after user explicitly clicks "Ativar Áudio"
        // No silent test tones are played - full compliance with autoplay policy
      }
    } catch (error) {
      console.warn('⚠️ Audio context ensure failed:', error);
    }
  }

  /**
   * Test audio context with a very brief inaudible tone (helps mobile)
   * 
   * DEPRECATED: This method is no longer used to ensure Chrome autoplay policy compliance.
   * Audio will only play after explicit user interaction via markUserInteraction().
   */
  private async testAudioContext(): Promise<void> {
    // REMOVED: No longer testing audio context to prevent any playback before user interaction
    // This ensures full compliance with Chrome autoplay policy
    console.log('ℹ️ Audio context test skipped (autoplay policy compliance)');
  }

  /**
   * Switch between audio engines exclusively - THE KEY FIX
   */
  async switchEngine(engine: AudioEngineType): Promise<boolean> {
    try {
      console.log('🔄 Switching audio engine to:', engine);

      // CRITICAL: Dispose previous service COMPLETELY
      if (this.activeService) {
        console.log('🗑️ Disposing previous service...');
        try {
          await this.activeService.dispose();
        } catch (e) {
          console.warn('Warning during disposal:', e);
        }
        this.activeService = null;
      }

      // Wait a bit to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create new service
      this.currentEngine = engine;

      if (engine === 'guitarset') {
        console.log('🎸 Creating GuitarSet samples service...');
        this.activeService = guitarSetAudioService;
      } else if (engine === 'philharmonia') {
        console.log('🎼 Creating Philharmonia Orchestra service...');
        this.activeService = philharmoniaAudioService;
      } else if (engine === 'samples') {
        console.log('🎼 Creating Soundfont service...');
        this.activeService = audioServiceWithSamples;
      } else {
        console.log('🎹 Creating Synthesis service...');
        this.activeService = audioService;
      }

      // Initialize new service com modo de baixa latência se habilitado
      const { lowLatencyMode } = useAudioSettingsStore.getState();
      let success = false;
      
      try {
        success = await this.activeService.initialize(lowLatencyMode);
        
        // Se samples falharam e estamos usando samples engine, tentar fallback para synthesis
        if (!success && engine === 'samples') {
          console.warn('⚠️ Samples engine failed, falling back to synthesis');
          const sampleError = new SampleLoadError('Samples failed to load, using synthesis fallback');
          const handled = handleAudioError(sampleError);
          toast.info('Usando áudio sintético', {
            description: handled.message,
          });
          
          const synthesisService = audioService;
          this.activeService = synthesisService;
          this.currentEngine = 'synthesis';
          success = await synthesisService.initialize(lowLatencyMode);
          
          if (success) {
            // Atualizar store para refletir fallback
            useAudioSettingsStore.getState().setAudioEngine('synthesis');
            console.log('✅ Fallback to synthesis successful');
          }
        }
      } catch (error) {
        // Usar AudioResilienceService para tratar falha
        await audioResilienceService.handleFailure(error, 'switchEngine', true);
        success = false;
      }

      if (success) {
        console.log('✅ Audio engine switched successfully to:', engine);
        this.notifySubscribers();
      } else {
        console.error('❌ Failed to initialize new audio engine');
        this.activeService = null;
      }

      return success;
    } catch (error) {
      console.error('❌ Error switching audio engine:', error);
      this.activeService = null;
      return false;
    }
  }

  /**
   * Get current instrument
   */
  getInstrument(): InstrumentType {
    if (!this.activeService) {
      console.warn('⚠️ No active service, returning default instrument');
      return useAudioSettingsStore.getState().instrument;
    }
    try {
      return this.activeService.getInstrument();
    } catch (error) {
      console.error('❌ Error getting instrument:', error);
      return 'nylon-guitar';
    }
  }

  /**
   * Set instrument with proper validation
   */
  async setInstrument(instrument: InstrumentType): Promise<void> {
    // Ensure service is initialized before setting instrument
    await this.ensureInitialized();
    
    // Double-check after ensureInitialized (handles edge cases)
    if (!this.activeService) {
      // Try one more time if service is still not available
      if (!this.isInitialized) {
        await this.initialize();
      }
      if (!this.activeService) {
        throw new Error('Audio service not initialized - call initialize() first');
      }
    }

    console.log('🎸 Setting instrument to:', instrument, 'on engine:', this.currentEngine);

    try {
      // Map InstrumentType to PhilharmoniaInstrument if using philharmonia engine
      if (this.currentEngine === 'philharmonia') {
        const philharmoniaInstrument = this.mapToPhilharmoniaInstrument(instrument);
        await philharmoniaAudioService.setInstrument(philharmoniaInstrument);
      } else {
        await this.activeService.setInstrument(instrument);
      }
      console.log('✅ Instrument set successfully');
    } catch (error) {
      console.error('❌ Error setting instrument:', error);
      throw error;
    }
  }

  /**
   * Map InstrumentType to PhilharmoniaInstrument
   */
  private mapToPhilharmoniaInstrument(instrument: InstrumentType): string {
    const mapping: Record<string, string> = {
      'violin': 'violin',
      'viola': 'viola',
      'cello': 'cello',
      'double-bass': 'double_bass',
      'flute': 'flute',
      'oboe': 'oboe',
      'clarinet': 'clarinet',
      'saxophone': 'saxophone',
      'trumpet': 'trumpet',
      'french-horn': 'french_horn',
      'trombone': 'trombone',
      'guitar': 'guitar',
      'mandolin': 'mandolin',
      'banjo': 'banjo',
      // Fallbacks
      'nylon-guitar': 'guitar',
      'steel-guitar': 'guitar',
      'piano': 'violin', // Piano not available, fallback to violin
    };
    
    return mapping[instrument] || 'violin';
  }

  /**
   * Check if audio context requires user interaction (autoplay policy guard)
   */
  private checkAutoplayPolicy(): boolean {
    if (!this.activeService) {
      console.warn('🚫 Playback blocked: No active audio service');
      return false;
    }

    // CRITICAL: Check if user has explicitly interacted
    if (!this.hasUserInteracted) {
      console.warn('🚫 Playback blocked: User interaction required (Chrome autoplay policy)');
      return false;
    }

    // Check for AudioContext in different service types
    let audioContext: AudioContext | null = null;
    
    if (this.activeService.audioContext) {
      audioContext = this.activeService.audioContext;
    } else if (this.currentEngine === 'guitarset' && (this.activeService as any).audioContext) {
      audioContext = (this.activeService as any).audioContext;
    } else if (this.currentEngine === 'philharmonia' && (this.activeService as any).audioContext) {
      audioContext = (this.activeService as any).audioContext;
    }

    // If AudioContext is suspended, we need user interaction to resume
    // Don't auto-resume - let the user explicitly interact first
    if (audioContext && audioContext.state === 'suspended') {
      console.warn('🚫 Playback blocked: AudioContext is suspended - user interaction required');
      return false;
    }

    return true;
  }

  /**
   * Check if AudioContext is in a valid state for playback
   * Returns false if AudioContext is not 'running'
   * CRITICAL: Also checks if user has explicitly interacted
   */
  private checkPlaybackState(): boolean {
    if (!this.activeService) {
      console.warn('🚫 Playback blocked: No active audio service');
      return false;
    }

    // CRITICAL: Check if user has explicitly interacted
    if (!this.hasUserInteracted) {
      console.warn('🚫 Playback blocked: User interaction required (Chrome autoplay policy)');
      return false;
    }

    // Check for AudioContext in different service types
    let audioContext: AudioContext | null = null;
    
    if (this.activeService.audioContext) {
      audioContext = this.activeService.audioContext;
    } else if (this.currentEngine === 'guitarset' && (this.activeService as any).audioContext) {
      audioContext = (this.activeService as any).audioContext;
    } else if (this.currentEngine === 'philharmonia' && (this.activeService as any).audioContext) {
      audioContext = (this.activeService as any).audioContext;
    }

    // Only allow playback if AudioContext is running
    if (audioContext && audioContext.state !== 'running') {
      console.warn(`🚫 Playback blocked: AudioContext is not running (state: ${audioContext.state}) - user interaction required`);
      return false;
    }

    return true;
  }

  /**
   * Play chord with exclusive service usage and tablet/mobile optimizations
   */
  async playChord(chordName: string, duration?: number): Promise<boolean | void> {
    // Ensure service is initialized before playing
    await this.ensureInitialized();
    
    // Double-check after ensureInitialized (handles edge cases)
    if (!this.activeService) {
      // Try one more time if service is still not available
      if (!this.isInitialized) {
        await this.initialize();
      }
      if (!this.activeService) {
        throw new Error('Audio service not initialized');
      }
    }

    // CRITICAL: Autoplay policy guard - blocks playback before user interaction
    // MUST be checked BEFORE any attempt to resume AudioContext or play audio
    if (!this.checkAutoplayPolicy()) {
      console.warn('🚫 Playback blocked: User interaction required (Chrome autoplay policy)');
      console.warn('   → User must click "Ativar Áudio" button first');
      return false;
    }

    // Tablet/Mobile optimization: Check timing to prevent overlaps
    // Increased delay for tablets to ensure smooth playback
    const now = Date.now();
    const minDelay = this.isTablet ? 200 : 100; // Longer delay for tablets
    if (this.mobileOptimizations && (now - this.lastAudioTime) < minDelay) {
      const delayTime = this.isTablet ? 250 : 150;
      console.log(`📱 ${this.isTablet ? 'Tablet' : 'Mobile'}: Delaying chord play to prevent overlap`);
      await new Promise(resolve => setTimeout(resolve, delayTime));
    }

    console.log('🎸 Playing chord:', chordName, 'with', this.currentEngine, 'engine', this.isTablet ? '(Tablet)' : this.mobileOptimizations ? '(Mobile)' : '');

    try {
      // Ensure audio context is active (critical for tablets)
      // NOTE: This is only called AFTER autoplay policy guard passes
      // If AudioContext was suspended, we already returned false above
      if (this.mobileOptimizations || this.isTablet) {
        await this.ensureAudioContext();
        // Additional small delay for tablets to ensure context is ready
        if (this.isTablet) {
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      }

    // Aplicar mecanismo de redução de fadiga auditiva
    const { auditoryFatigueReducer } = await import('./AuditoryFatigueReducer');
    const soundId = `chord-${chordName}`;
    const variation = auditoryFatigueReducer.getVariation(soundId);
    
    // Se deve pausar, não tocar (pausa auditiva natural)
    if (variation === null) {
      console.debug('[UnifiedAudioService] Pausa auditiva ativa, acorde não tocado');
      return false;
    }
    
    // Aplicar variação de timing (não pitch - manter acorde correto)
    // Variação de volume seria aplicada no serviço de áudio, mas como
    // playChord não aceita volume como parâmetro, aplicamos apenas timing
    const timingDelay = Math.max(0, variation.timingVariation);
    
    // Chamar playChord original com delay se necessário
    if (timingDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, timingDelay));
    }
    
    // For tablets, don't limit duration - let chords play fully
    const actualDuration = this.isTablet ? undefined : duration;
    
    await this.activeService.playChord(chordName, actualDuration);
    this.lastAudioTime = Date.now();

      console.log('✅ Chord played successfully');
      return true;
    } catch (error) {
      // Usar AudioResilienceService para tratar falha
      const recovered = await audioResilienceService.handleFailure(error, 'playChord', true);
      
      if (recovered) {
        // Tentar tocar novamente após recuperação
        try {
          const actualDuration = this.isTablet ? undefined : duration;
          await this.activeService.playChord(chordName, actualDuration);
          this.lastAudioTime = Date.now();
          return true;
        } catch (retryError) {
          // Se ainda falhar, tentar fallback sonoro simples
          await audioResilienceService.playSimpleFallback(chordName, duration || 0.5);
        }
      } else {
        // Se não recuperou, tentar fallback sonoro simples
        await audioResilienceService.playSimpleFallback(chordName, duration || 0.5);
      }

      return false;
    }
  }

  /**
   * Play strummed chord
   */
  async playChordStrummed(chordName: string, duration?: number): Promise<void> {
    // Ensure service is initialized before playing
    await this.ensureInitialized();
    
    // Double-check after ensureInitialized (handles edge cases)
    if (!this.activeService) {
      // Try one more time if service is still not available
      if (!this.isInitialized) {
        await this.initialize();
      }
      if (!this.activeService) {
        throw new Error('Audio service not initialized');
      }
    }

    // CRITICAL: Autoplay policy guard - blocks playback before user interaction
    if (!this.checkAutoplayPolicy()) {
      console.warn('🚫 Playback blocked: User interaction required (Chrome autoplay policy)');
      console.warn('   → User must click "Ativar Áudio" button first');
      return;
    }

    if (!this.activeService.playChordStrummed) {
      console.log('ℹ️ Strummed chords not available for', this.currentEngine, 'engine, using regular chord');
      return this.playChord(chordName, duration);
    }

    console.log('🎸 Playing strummed chord:', chordName);

    try {
      await this.activeService.playChordStrummed(chordName, duration);
      console.log('✅ Strummed chord played successfully');
    } catch (error) {
      console.error('❌ Error playing strummed chord:', error);
      throw error;
    }
  }

  /**
   * Play scale with intelligent note mapping - THE SCALE FIX
   */
  async playScale(scaleName: string, root: string, intervals: number[], duration: number = 0.5): Promise<void> {
    // Ensure service is initialized before playing
    await this.ensureInitialized();
    
    // Double-check after ensureInitialized (handles edge cases)
    if (!this.activeService) {
      // Try one more time if service is still not available
      if (!this.isInitialized) {
        await this.initialize();
      }
      if (!this.activeService) {
        throw new Error('Audio service not initialized');
      }
    }

    // CRITICAL: Autoplay policy guard - blocks playback before user interaction
    if (!this.checkAutoplayPolicy()) {
      console.warn('🚫 Playback blocked: User interaction required (Chrome autoplay policy)');
      console.warn('   → User must click "Ativar Áudio" button first');
      return;
    }

    // Mobile optimization: Adjust timing for better performance
    const actualDuration = this.mobileOptimizations ? Math.max(duration, 0.3) : duration;

    console.log('🎵 Playing scale:', scaleName, 'from', root, 'intervals:', intervals, this.mobileOptimizations ? '(Mobile)' : '');

    try {
      // Mobile: Ensure audio context before playing
      if (this.mobileOptimizations) {
        await this.ensureAudioContext();
      }

      // Generate proper scale notes from intervals
      const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const rootIndex = NOTES.indexOf(root.toUpperCase());

      if (rootIndex === -1) {
        throw new Error(`Invalid root note: ${root}`);
      }

      // Convert intervals to actual notes
      const scaleNotes = intervals.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        return NOTES[noteIndex] + '4'; // Octave 4 for consistency
      });

      // Add octave return note
      scaleNotes.push(root.toUpperCase() + '5');

      console.log('🎼 Generated scale notes:', scaleNotes);

      // Use the active service's native playScale method
      await this.activeService.playScale(scaleName, root, intervals, actualDuration);
      this.lastAudioTime = Date.now();

      console.log('✅ Scale played successfully');

    } catch (error) {
      console.error('❌ Error playing scale:', error);

      // Mobile fallback: Try with simplified approach
      if (this.mobileOptimizations) {
        console.log('📱 Mobile: Attempting simplified scale playback...');
        try {
          // Play individual notes with delays to prevent overlap
          for (let i = 0; i < Math.min(intervals.length, 5); i++) { // Limit to 5 notes for mobile
            const noteIndex = (NOTES.indexOf(root.toUpperCase()) + intervals[i]) % 12;
            const note = NOTES[noteIndex] + '4';
            await this.playNote(note, actualDuration);
            await new Promise(resolve => setTimeout(resolve, 200)); // Longer delay for mobile
          }
          console.log('✅ Simplified scale playback successful');
          return;
        } catch (fallbackError) {
          console.error('❌ Simplified playback also failed:', fallbackError);
        }
      }

      throw error;
    }
  }

  /**
   * Play single note - FIXED VERSION
   */
  async playNote(note: string, duration?: number): Promise<boolean | void> {
    // Ensure service is initialized before playing
    await this.ensureInitialized();
    
    // Double-check after ensureInitialized (handles edge cases)
    if (!this.activeService) {
      // Try one more time if service is still not available
      if (!this.isInitialized) {
        await this.initialize();
      }
      if (!this.activeService) {
        throw new Error('Audio service not initialized');
      }
    }

    // CRITICAL: Autoplay policy guard - blocks playback before user interaction
    // MUST be checked BEFORE any attempt to resume AudioContext or play audio
    if (!this.checkAutoplayPolicy()) {
      console.warn('🚫 Playback blocked: User interaction required (Chrome autoplay policy)');
      console.warn('   → User must click "Ativar Áudio" button first');
      return false;
    }

    // Aplicar mecanismo de redução de fadiga auditiva
    const { auditoryFatigueReducer } = await import('./AuditoryFatigueReducer');
    const soundId = `note-${note}`;
    const variation = auditoryFatigueReducer.getVariation(soundId);
    
    // Se deve pausar, não tocar (pausa auditiva natural)
    if (variation === null) {
      console.debug('[UnifiedAudioService] Pausa auditiva ativa, nota não tocada');
      return false;
    }
    
    // Aplicar variação de timing (microvariação de pitch seria aplicada no serviço de áudio)
    // Por enquanto, aplicamos apenas timing para não alterar o timbre base
    const timingDelay = Math.max(0, variation.timingVariation);
    
    // Chamar playNote original com delay se necessário
    if (timingDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, timingDelay));
    }

    // Ensure note has octave (default to 4 if not specified)
    let noteWithOctave = note;
    if (!/\d/.test(note)) {
      noteWithOctave = note + '4';
    }

    console.log('🎵 Playing note:', noteWithOctave);

    try {
      // Mobile optimization: Ensure audio context
      if (this.mobileOptimizations) {
        await this.ensureAudioContext();
      }

      // Use the active service's playNote method directly
      // Passar a duração fornecida ou usar padrão apenas se não especificada
      if (this.activeService.playNote) {
        await this.activeService.playNote(noteWithOctave, duration);
        this.lastAudioTime = Date.now();
        console.log('✅ Note played successfully', duration ? `(${duration}s)` : '');
        return true;
      } else {
        // Fallback: Use playScale with single note
        const rootNote = note.replace(/\d+$/, '');
        await this.playScale(note, rootNote, [0], duration);
        console.log('✅ Note played via scale fallback');
      }
    } catch (error) {
      console.error('❌ Error playing note:', error);
      
      // Mobile fallback: Try to reinitialize and retry
      if (this.mobileOptimizations) {
        console.log('📱 Mobile: Attempting recovery...');
        try {
          await this.reinitialize();
          await new Promise(resolve => setTimeout(resolve, 200));
          if (this.activeService?.playNote) {
            await this.activeService.playNote(noteWithOctave, duration);
            console.log('✅ Note recovered successfully');
            return;
          }
        } catch (retryError) {
          console.error('❌ Recovery failed:', retryError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Stop all audio immediately with mobile optimizations
   */
  stopAll(): void {
    console.log('🛑 Stopping all audio...', this.mobileOptimizations ? '(Mobile)' : '');

    try {
      // Stop active service
      if (this.activeService && this.activeService.stopAll) {
        this.activeService.stopAll();
      }

      // Safety fallback - try to stop all services
      if (audioService.stopAll) audioService.stopAll();
      if (audioServiceWithSamples.stopAll) audioServiceWithSamples.stopAll();
      if (guitarSetAudioService.stopAll) guitarSetAudioService.stopAll();
      if (philharmoniaAudioService.stopAll) philharmoniaAudioService.stopAll();

      // Mobile-specific: Reset audio context state
      if (this.mobileOptimizations) {
        this.audioContextState = 'suspended';
        this.lastAudioTime = 0;
      }
    } catch (error) {
      console.error('[UnifiedAudioService] Erro ao parar áudio:', error);
    }
  }

  /**
   * Para todo o áudio com fade-out suave
   * @param fadeOutDuration - Duração do fade-out em segundos (padrão: 0.15s)
   * @returns Promise que resolve quando o fade-out termina
   */
  async fadeOutAll(fadeOutDuration: number = 0.15): Promise<void> {
    try {
      // Fade-out no AudioBus (sons de efeitos, feedback, etc.)
      const { getAudioBus } = await import('@/audio');
      const audioBus = getAudioBus();
      if (audioBus && typeof audioBus.fadeOutAll === 'function') {
        await audioBus.fadeOutAll(fadeOutDuration);
      }

      // Fade-out no metrônomo
      const { metronomeService } = await import('@/services/MetronomeService');
      if (metronomeService.getIsPlaying()) {
        await metronomeService.fadeOut(fadeOutDuration);
      }

      // Parar serviços de áudio (samples, acordes, etc.)
      // Estes geralmente são curtos e não precisam de fade-out
      this.stopAll();
    } catch (error) {
      console.error('[UnifiedAudioService] Erro no fade-out, usando stop abrupto:', error);
      // Fallback para stop abrupto
      this.stopAll();
    }
  }

  /**
   * Set EQ (only works with synthesis engine)
   */
  setEQ(bassGain: number, midGain: number, trebleGain: number): void {
    console.log('🎛️ Setting EQ:', { bassGain, midGain, trebleGain });

    try {
      if (this.activeService && this.activeService.setEQ) {
        this.activeService.setEQ(bassGain, midGain, trebleGain);
      } else if (this.currentEngine === 'synthesis') {
        // Fallback for synthesis engine
        audioService.setEQ(bassGain, midGain, trebleGain);
      }
    } catch (error) {
      console.error('❌ Error setting EQ:', error);
    }
  }

  /**
   * Dispose all resources completely
   */
  async dispose(): Promise<void> {
    console.log('🗑️ Disposing AudioManager...');

    try {
      if (this.activeService) {
        await this.activeService.dispose();
        this.activeService = null;
      }

      // Safety cleanup
      await audioService.dispose();
      await audioServiceWithSamples.dispose();
      await guitarSetAudioService.dispose();
      await philharmoniaAudioService.dispose();

      this.isInitialized = false;
      this.notifySubscribers();

      console.log('✅ AudioManager disposed successfully');
    } catch (error) {
      console.error('❌ Error disposing AudioManager:', error);
    }
  }

  /**
   * Get comprehensive status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      currentEngine: this.currentEngine,
      hasActiveService: !!this.activeService,
      serviceType: this.activeService?.constructor?.name || 'None',
      subscribersCount: this.subscribers.size,
      hasUserInteracted: this.hasUserInteracted,
      audioContextState: this.audioContextState,
      timestamp: Date.now()
    };
  }

  /**
   * Force reinitialize (for recovery)
   */
  async reinitialize(): Promise<boolean> {
    console.log('🔄 Force reinitializing AudioManager...');

    await this.dispose();
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for cleanup

    return this.initialize();
  }

  /**
   * Play an audio sample buffer
   * This method checks playback state before allowing playback
   * 
   * NOTE: This is a low-level method that directly plays an AudioBuffer.
   * Most use cases should use playNote, playChord, or playScale instead.
   */
  async playSample({
    buffer,
    channel,
  }: {
    buffer: AudioBuffer;
    channel?: string;
  }): Promise<boolean> {
    // Ensure service is initialized
    await this.ensureInitialized();

    // CRITICAL: Check playback state - blocks if user hasn't interacted
    if (!this.checkPlaybackState()) {
      console.warn('🚫 Playback blocked: User interaction required (Chrome autoplay policy)');
      console.warn('   → User must click "Ativar Áudio" button first');
      return false;
    }

    if (!this.activeService) {
      console.error('❌ No active audio service available');
      return false;
    }

    try {
      // Get AudioContext from active service
      let audioContext: AudioContext | null = null;
      
      if (this.activeService.audioContext) {
        audioContext = this.activeService.audioContext;
      } else if (this.currentEngine === 'guitarset' && (this.activeService as any).audioContext) {
        audioContext = (this.activeService as any).audioContext;
      } else if (this.currentEngine === 'philharmonia' && (this.activeService as any).audioContext) {
        audioContext = (this.activeService as any).audioContext;
      }

      if (!audioContext) {
        console.error('❌ No AudioContext available');
        return false;
      }

      // Create and play the buffer directly
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      
      // Get gain node from active service if available
      let gainNode: GainNode | null = null;
      if (this.activeService.gainNode) {
        gainNode = this.activeService.gainNode;
      } else {
        // Create a temporary gain node
        gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
      }
      
      source.connect(gainNode);
      source.start(0);
      
      this.lastAudioTime = Date.now();
      console.log('✅ Sample played successfully');
      return true;
    } catch (error) {
      console.error('❌ Error playing sample:', error);
      return false;
    }
  }

  /**
   * 🎵 Ritual Sonoro de Ativação
   * 
   * Toca um som curto, neutro e confortável que confirma ao usuário que o sistema
   * de áudio está ativo e pronto para uso.
   * 
   * MOTIVO PEDAGÓGICO:
   * - Confirmação auditiva imediata de que o sistema está funcionando
   * - Estabelece confiança do usuário no sistema de áudio
   * - Feedback não intrusivo que não interfere em treinos ou teoria
   * - Cria uma experiência mais profissional e polida
   * 
   * CARACTERÍSTICAS:
   * - Duração: <300ms (250ms)
   * - Frequência: A4 (440Hz) - tom neutro e confortável
   * - Volume: Baixo (0.08) - não intrusivo
   * - Tipo: Sine wave - som suave e agradável
   * - Canal: 'effects' - não interfere com outros canais
   * 
   * REGRAS:
   * - Toca apenas uma vez por sessão
   * - Fallback silencioso se áudio não estiver pronto
   * - Não bloqueia a inicialização se falhar
   * 
   * LOCAL DE DISPARO:
   * - UnifiedAudioService.markUserInteraction() - após primeira interação
   * - UnifiedAudioService.ensureInitialized() - após inicialização completa
   */
  private async playActivationRitual(): Promise<void> {
    // Garantir que toca apenas uma vez por sessão
    if (this.hasPlayedActivationRitual) {
      return;
    }

    // Verificar se o áudio está pronto
    if (!this.isInitialized || !this.activeService) {
      console.debug('[AudioManager] Ritual sonoro não tocado: áudio não está pronto');
      return;
    }

    // Verificar se há interação do usuário
    if (!this.hasUserInteracted) {
      console.debug('[AudioManager] Ritual sonoro não tocado: sem interação do usuário');
      return;
    }

    try {
      // Obter AudioBus de forma assíncrona para evitar dependência circular
      const { getAudioBus } = await import('@/audio');
      const audioBus = getAudioBus();
      
      if (!audioBus) {
        console.debug('[AudioManager] Ritual sonoro não tocado: AudioBus não disponível');
        return;
      }

      // Verificar se AudioEngine está pronto
      const { AudioEngine } = await import('@/audio');
      const audioEngine = AudioEngine.getInstance();
      
      if (!audioEngine.isReady()) {
        console.debug('[AudioManager] Ritual sonoro não tocado: AudioEngine não está pronto');
        return;
      }

      // Tocar som de confirmação: A4 (440Hz) - tom neutro e confortável
      // Duração: 250ms - curto o suficiente para não distrair
      // Volume: 0.08 - baixo e não intrusivo
      const success = audioBus.playOscillator({
        frequency: 440, // A4 - tom neutro e confortável
        type: 'sine', // Sine wave - som suave e agradável
        duration: 0.25, // 250ms - <300ms conforme requisito
        channel: 'effects', // Canal effects - não interfere com outros canais
        volume: 0.08, // Volume baixo - não intrusivo
      });

      if (success) {
        this.hasPlayedActivationRitual = true;
        console.log('🎵 [AudioManager] Ritual sonoro de ativação tocado');
      } else {
        console.debug('[AudioManager] Ritual sonoro não pôde ser tocado (fallback silencioso)');
      }
    } catch (error) {
      // Fallback silencioso: não interromper o fluxo se o ritual falhar
      console.debug('[AudioManager] Ritual sonoro não pôde ser tocado (fallback silencioso):', error);
    }
  }
}

// Export singleton instance
export const audioManager = new AudioManager();

// Legacy compatibility layer - redirects to new manager
export const unifiedAudioService = {
  initialize: () => audioManager.initialize(),
  ensureInitialized: () => audioManager.ensureInitialized(),
  setInstrument: (instrument: InstrumentType) => audioManager.setInstrument(instrument),
  getInstrument: () => audioManager.getInstrument(),
  playChord: (chordName: string, duration?: number) => audioManager.playChord(chordName, duration),
  playChordStrummed: (chordName: string, duration?: number) => audioManager.playChordStrummed(chordName, duration),
  playScale: (scaleName: string, root: string, intervals: number[], duration?: number) => audioManager.playScale(scaleName, root, intervals, duration),
  playNote: (note: string, duration?: number) => audioManager.playNote(note, duration),
  stopAll: () => audioManager.stopAll(),
  fadeOutAll: (fadeOutDuration?: number) => audioManager.fadeOutAll(fadeOutDuration),
  setEQ: (bassGain: number, midGain: number, trebleGain: number) => audioManager.setEQ(bassGain, midGain, trebleGain),
  dispose: () => audioManager.dispose(),

  // Additional methods for compatibility
  getStatus: () => audioManager.getStatus(),
  reinitialize: () => audioManager.reinitialize(),
  
  // Expose audioManager for testing
  __audioManager: audioManager,
  
  // Singleton getInstance pattern for testing
  getInstance: () => audioManager,
  
  // Play sample method
  playSample: (params: { buffer: AudioBuffer; channel?: string }) => audioManager.playSample(params),
  
  // User interaction methods
  markUserInteraction: () => audioManager.markUserInteraction(),
  hasUserInteractedWithAudio: () => audioManager.hasUserInteractedWithAudio(),
  
  // AudioContext access for scheduling
  getAudioContext: () => {
    // Get AudioContext from active service
    if (!audioManager['activeService']) return null;
    
    const activeService = audioManager['activeService'];
    const currentEngine = audioManager['currentEngine'];
    
    if (activeService.audioContext) {
      return activeService.audioContext;
    } else if (currentEngine === 'guitarset' && (activeService as any).audioContext) {
      return (activeService as any).audioContext;
    } else if (currentEngine === 'philharmonia' && (activeService as any).audioContext) {
      return (activeService as any).audioContext;
    }
    
    return null;
  },
};
