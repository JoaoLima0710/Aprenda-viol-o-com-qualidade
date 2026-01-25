import * as Tone from 'tone';

export type TimeSignature = '4/4' | '3/4' | '6/8' | '2/4';

class MetronomeService {
  private synth: Tone.MembraneSynth | null = null;
  private loop: Tone.Loop | null = null;
  private isInitialized = false;
  private isPlaying = false;
  private currentBpm = 120;
  private currentTimeSignature: TimeSignature = '4/4';
  private currentBeat = 0;
  private onBeatCallback: ((beat: number, isDownbeat: boolean) => void) | null = null;
  
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      await Tone.start();
      
      // Criar sintetizador para o som do metrônomo
      this.synth = new Tone.MembraneSynth({
        pitchDecay: 0.008,
        octaves: 2,
        envelope: {
          attack: 0.0006,
          decay: 0.5,
          sustain: 0,
        },
      }).toDestination();
      
      this.synth.volume.value = -10;
      
      this.isInitialized = true;
      console.log('MetronomeService initialized');
    } catch (error) {
      console.error('Failed to initialize MetronomeService:', error);
    }
  }
  
  private getBeatsPerMeasure(): number {
    switch (this.currentTimeSignature) {
      case '4/4':
        return 4;
      case '3/4':
        return 3;
      case '6/8':
        return 6;
      case '2/4':
        return 2;
      default:
        return 4;
    }
  }
  
  private playClick(isDownbeat: boolean) {
    if (!this.synth) return;
    
    // Downbeat (primeiro tempo) é mais agudo
    const note = isDownbeat ? 'C5' : 'C4';
    const velocity = isDownbeat ? 1 : 0.6;
    
    this.synth.triggerAttackRelease(note, '32n', Tone.now(), velocity);
  }
  
  async start(bpm: number = this.currentBpm, timeSignature: TimeSignature = this.currentTimeSignature) {
    await this.initialize();
    
    if (this.isPlaying) {
      this.stop();
    }
    
    this.currentBpm = bpm;
    this.currentTimeSignature = timeSignature;
    this.currentBeat = 0;
    
    Tone.getTransport().bpm.value = bpm;
    
    const beatsPerMeasure = this.getBeatsPerMeasure();
    
    this.loop = new Tone.Loop((time) => {
      const isDownbeat = this.currentBeat === 0;
      
      // Play click
      this.playClick(isDownbeat);
      
      // Callback for visual feedback
      if (this.onBeatCallback) {
        // Schedule callback slightly ahead for smooth animation
        Tone.Draw.schedule(() => {
          this.onBeatCallback?.(this.currentBeat, isDownbeat);
        }, time);
      }
      
      // Increment beat
      this.currentBeat = (this.currentBeat + 1) % beatsPerMeasure;
    }, '4n'); // Quarter note
    
    this.loop.start(0);
    Tone.getTransport().start();
    
    this.isPlaying = true;
  }
  
  stop() {
    if (this.loop) {
      this.loop.stop();
      this.loop.dispose();
      this.loop = null;
    }
    
    Tone.getTransport().stop();
    this.currentBeat = 0;
    this.isPlaying = false;
  }

  /**
   * Para o metrônomo com fade-out suave
   * @param fadeOutDuration - Duração do fade-out em segundos (padrão: 0.15s)
   */
  async fadeOut(fadeOutDuration: number = 0.15): Promise<void> {
    if (!this.isPlaying || !this.synth) {
      return;
    }

    try {
      // Aplicar fade-out no volume do synth
      const now = Tone.now();
      const currentVolume = this.synth.volume.value;
      
      // Fade-out linear
      this.synth.volume.setValueAtTime(currentVolume, now);
      this.synth.volume.linearRampToValueAtTime(-Infinity, now + fadeOutDuration);

      // Aguardar fade-out terminar
      await new Promise(resolve => setTimeout(resolve, fadeOutDuration * 1000 + 50));

      // Parar metrônomo após fade-out
      this.stop();
      
      // Restaurar volume
      if (this.synth) {
        this.synth.volume.setValueAtTime(-10, Tone.now());
      }
    } catch (error) {
      console.error('[MetronomeService] Erro no fade-out, usando stop abrupto:', error);
      // Fallback para stop abrupto
      this.stop();
    }
  }
  
  setBpm(bpm: number) {
    this.currentBpm = bpm;
    if (this.isPlaying) {
      Tone.getTransport().bpm.value = bpm;
    }
  }
  
  setTimeSignature(timeSignature: TimeSignature) {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.stop();
    }
    
    this.currentTimeSignature = timeSignature;
    
    if (wasPlaying) {
      this.start(this.currentBpm, timeSignature);
    }
  }
  
  setVolume(volume: number) {
    if (this.synth) {
      // Volume em dB (-60 a 0)
      this.synth.volume.value = volume;
    }
  }
  
  onBeat(callback: (beat: number, isDownbeat: boolean) => void) {
    this.onBeatCallback = callback;
  }
  
  getIsPlaying(): boolean {
    return this.isPlaying;
  }
  
  getBpm(): number {
    return this.currentBpm;
  }
  
  getTimeSignature(): TimeSignature {
    return this.currentTimeSignature;
  }
  
  // Tap tempo functionality
  private tapTimes: number[] = [];
  
  tap(): number | null {
    const now = Date.now();
    this.tapTimes.push(now);
    
    // Keep only last 4 taps
    if (this.tapTimes.length > 4) {
      this.tapTimes.shift();
    }
    
    // Need at least 2 taps to calculate BPM
    if (this.tapTimes.length < 2) {
      return null;
    }
    
    // Calculate average interval
    const intervals: number[] = [];
    for (let i = 1; i < this.tapTimes.length; i++) {
      intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = Math.round(60000 / avgInterval);
    
    // Clamp BPM to reasonable range
    return Math.max(40, Math.min(240, bpm));
  }
  
  resetTap() {
    this.tapTimes = [];
  }
  
  dispose() {
    this.stop();
    
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
    
    this.isInitialized = false;
  }
}

// Singleton instance
export const metronomeService = new MetronomeService();
