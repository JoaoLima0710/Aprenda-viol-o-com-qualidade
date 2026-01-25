import AudioEngine from './AudioEngine';

/**
 * AudioMixer - Controle de volumes e mixagem
 */
class AudioMixer {
  private audioEngine: AudioEngine;
  
  // Canais de áudio
  private channels: Map<string, GainNode> = new Map();
  
  // Volumes
  private masterVolume: number = 0.8;
  private channelVolumes: Map<string, number> = new Map();
  
  // Mute state
  private isMuted: boolean = false;
  private previousVolume: number = 0.8;

  constructor() {
    this.audioEngine = AudioEngine.getInstance();
  }

  /**
   * Inicializa os canais de mixagem
   * Sincroniza volume com store global se disponível
   */
  public async initialize(): Promise<void> {
    await this.audioEngine.initialize();
    
    // Criar canais padrão
    this.createChannel('chords', 0.8);
    this.createChannel('scales', 0.8);
    this.createChannel('metronome', 0.7);
    this.createChannel('effects', 0.5);
    
    // Sincronizar volume master com store global (se disponível)
    try {
      const { useAudioSettingsStore } = await import('@/stores/useAudioSettingsStore');
      const store = useAudioSettingsStore.getState();
      if (store.masterVolume !== undefined) {
        this.masterVolume = store.masterVolume;
        this.previousVolume = store.masterVolume;
        // Aplicar volume ao AudioEngine
        this.audioEngine.setMasterVolume(this.isMuted ? 0 : this.masterVolume);
        console.log(`[AudioMixer] Volume sincronizado com store: ${Math.round(this.masterVolume * 100)}%`);
      }
    } catch (error) {
      // Store pode não estar disponível ainda, usar padrão
      console.debug('[AudioMixer] Store não disponível, usando volume padrão');
    }
  }

  /**
   * Cria um canal de áudio
   */
  public createChannel(name: string, volume: number = 0.8): GainNode {
    const audioContext = this.audioEngine.getContext();
    const masterGain = this.audioEngine.getMasterGain();
    
    const channelGain = audioContext.createGain();
    channelGain.gain.value = volume;
    channelGain.connect(masterGain);
    
    this.channels.set(name, channelGain);
    this.channelVolumes.set(name, volume);
    
    return channelGain;
  }

  /**
   * Retorna um canal existente
   */
  public getChannel(name: string): GainNode | null {
    return this.channels.get(name) || null;
  }

  /**
   * Define o volume de um canal
   */
  public setChannelVolume(name: string, volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    const channel = this.channels.get(name);
    
    if (channel) {
      const audioContext = this.audioEngine.getContext();
      channel.gain.setTargetAtTime(clampedVolume, audioContext.currentTime, 0.01);
      this.channelVolumes.set(name, clampedVolume);
    }
  }

  /**
   * Retorna o volume de um canal
   */
  public getChannelVolume(name: string): number {
    return this.channelVolumes.get(name) || 0;
  }

  /**
   * Define o volume master
   * Sincroniza com store global automaticamente
   */
  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.audioEngine.setMasterVolume(this.isMuted ? 0 : this.masterVolume);
    
    // Sincronizar com store global (se disponível)
    // Nota: Não atualizar store aqui para evitar loop - store atualiza AudioMixer
    // O VolumeControl já atualiza o store diretamente
  }

  /**
   * Retorna o volume master
   */
  public getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * Muta todo o áudio
   */
  public mute(): void {
    if (!this.isMuted) {
      this.previousVolume = this.masterVolume;
      this.isMuted = true;
      this.audioEngine.setMasterVolume(0);
    }
  }

  /**
   * Desmuta o áudio
   */
  public unmute(): void {
    if (this.isMuted) {
      this.isMuted = false;
      this.audioEngine.setMasterVolume(this.previousVolume);
    }
  }

  /**
   * Alterna mute
   */
  public toggleMute(): void {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  /**
   * Retorna se está mutado
   */
  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Retorna todos os volumes
   */
  public getAllVolumes(): { master: number; channels: Record<string, number> } {
    const channels: Record<string, number> = {};
    this.channelVolumes.forEach((volume, name) => {
      channels[name] = volume;
    });
    
    return {
      master: this.masterVolume,
      channels,
    };
  }

  /**
   * Fade out gradual
   */
  public fadeOut(duration: number = 0.5): void {
    const audioContext = this.audioEngine.getContext();
    const masterGain = this.audioEngine.getMasterGain();
    
    masterGain.gain.setValueAtTime(masterGain.gain.value, audioContext.currentTime);
    masterGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
  }

  /**
   * Fade in gradual
   */
  public fadeIn(duration: number = 0.5): void {
    const audioContext = this.audioEngine.getContext();
    const masterGain = this.audioEngine.getMasterGain();
    
    masterGain.gain.setValueAtTime(0, audioContext.currentTime);
    masterGain.gain.linearRampToValueAtTime(this.masterVolume, audioContext.currentTime + duration);
  }
}

export default AudioMixer;
