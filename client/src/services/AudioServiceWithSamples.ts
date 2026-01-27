import Soundfont from 'soundfont-player';

// Array de notas
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Acordes e suas notas (intervalos em semitons a partir da fundamental)
const CHORD_INTERVALS: Record<string, number[]> = {
  'major': [0, 4, 7],
  'minor': [0, 3, 7],
  '7': [0, 4, 7, 10],
  'm7': [0, 3, 7, 10],
  'maj7': [0, 4, 7, 11],
  'sus2': [0, 2, 7],
  'sus4': [0, 5, 7],
  'dim': [0, 3, 6],
  'aug': [0, 4, 8],
  '6': [0, 4, 7, 9],
  'm6': [0, 3, 7, 9],
  '9': [0, 4, 7, 10, 14],
  'add9': [0, 4, 7, 14],
};

export type InstrumentType = 'nylon-guitar' | 'steel-guitar' | 'piano';

const SOUNDFONT_INSTRUMENTS: Record<InstrumentType, string> = {
  'nylon-guitar': 'acoustic_guitar_nylon',
  'steel-guitar': 'acoustic_guitar_steel',
  'piano': 'acoustic_grand_piano',
};

class AudioServiceWithSamples {
  private instrument: Soundfont.Player | null = null;
  private audioContext: AudioContext | null = null; // Only set by explicit handler
  private isInitialized = false;
  private currentInstrument: InstrumentType = 'nylon-guitar';
  private isLoading = false;
  private preloadedNotes: Set<string> = new Set();
  private preloadInProgress = false;
  private loadErrorCount = 0;
  private maxLoadErrors = 3;
  
  // Volume normalization
  private noteGains: Map<string, number> = new Map(); // Normalized gain per note
  private targetRMS = 0.3; // Target RMS level for normalization (0-1)
  private normalizationEnabled = true;
  
  // Effects chain
  private compressor: DynamicsCompressorNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private eqNodes: BiquadFilterNode[] = [];
  private reverbConvolver: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  /**
   * Explicitly initialize audio (must be called by user gesture handler)
   */
  async initialize() {
    if (this.isInitialized) return true;
    if (this.audioContext) throw new Error('AudioContext already initialized!');
    try {
      // Only allow initialization via explicit handler
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('🎵 AudioContext created');
      this.createEffectsChain();
      const loadSuccess = await this.loadInstrument(this.currentInstrument);
      if (!loadSuccess && this.loadErrorCount >= this.maxLoadErrors) {
        console.warn('⚠️ Samples failed to load multiple times, will use fallback');
        const sampleError = new (await import('@/errors/AudioErrors')).SampleLoadError('Samples failed to load');
        await (await import('./AudioResilienceService')).audioResilienceService.handleFailure(sampleError, 'initialize', true);
        throw sampleError;
      }
      this.isInitialized = true;
      console.log('✅ AudioServiceWithSamples initialized with', this.currentInstrument);
      this.preloadCommonNotes();
      this.normalizeCommonNotes();
      return true;
    } catch (error) {
      console.error('❌ Error initializing AudioServiceWithSamples:', error);
      this.loadErrorCount++;
      const { audioResilienceService } = await import('./AudioResilienceService');
      await audioResilienceService.handleFailure(error, 'initialize', true);
      return false;
    }
  }
  
  /**
   * Create effects chain: Compressor -> EQ -> Reverb -> Limiter -> Destination
   */
  private createEffectsChain() {
    if (!this.audioContext) return;
    
    // Master gain
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.audioContext.destination);
    
    // Limiter (last in chain, prevents clipping)
    this.limiter = this.audioContext.createDynamicsCompressor();
    this.limiter.threshold.value = -1; // -1 dB
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20; // 20:1 (hard limiter)
    this.limiter.attack.value = 0.001; // 1ms
    this.limiter.release.value = 0.01; // 10ms
    this.limiter.connect(this.masterGain);
    
    // Reverb (using simple delay-based reverb)
    this.reverbGain = this.audioContext.createGain();
    this.reverbGain.gain.value = 0.2; // Wet mix
    this.reverbGain.connect(this.limiter);
    
    // Create simple reverb with delay nodes
    const delay1 = this.audioContext.createDelay(0.1);
    delay1.delayTime.value = 0.03; // 30ms
    const delay2 = this.audioContext.createDelay(0.1);
    delay2.delayTime.value = 0.05; // 50ms
    
    const feedbackGain1 = this.audioContext.createGain();
    feedbackGain1.gain.value = 0.3;
    const feedbackGain2 = this.audioContext.createGain();
    feedbackGain2.gain.value = 0.2;
    
    delay1.connect(feedbackGain1);
    feedbackGain1.connect(delay1);
    delay1.connect(delay2);
    delay2.connect(feedbackGain2);
    feedbackGain2.connect(delay2);
    delay2.connect(this.reverbGain);
    
    // EQ - 5 band parametric
    // Low Shelf (80 Hz)
    const lowShelf = this.audioContext.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 80;
    lowShelf.gain.value = 0;
    lowShelf.Q.value = 0.7;
    
    // Low Mid (250 Hz)
    const lowMid = this.audioContext.createBiquadFilter();
    lowMid.type = 'peaking';
    lowMid.frequency.value = 250;
    lowMid.gain.value = 0;
    lowMid.Q.value = 1;
    
    // Mid (1000 Hz)
    const mid = this.audioContext.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = 1000;
    mid.gain.value = 0;
    mid.Q.value = 1;
    
    // High Mid (4000 Hz)
    const highMid = this.audioContext.createBiquadFilter();
    highMid.type = 'peaking';
    highMid.frequency.value = 4000;
    highMid.gain.value = 0;
    highMid.Q.value = 1;
    
    // High Shelf (10000 Hz)
    const highShelf = this.audioContext.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 10000;
    highShelf.gain.value = 0;
    highShelf.Q.value = 0.7;
    
    this.eqNodes = [lowShelf, lowMid, mid, highMid, highShelf];
    
    // Connect EQ chain
    lowShelf.connect(lowMid);
    lowMid.connect(mid);
    mid.connect(highMid);
    highMid.connect(highShelf);
    highShelf.connect(delay1); // Connect to reverb
    
    // Compressor (first in chain)
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -20; // -20 dB
    this.compressor.knee.value = 6; // 6 dB
    this.compressor.ratio.value = 4; // 4:1
    this.compressor.attack.value = 0.005; // 5ms
    this.compressor.release.value = 0.1; // 100ms
    this.compressor.connect(lowShelf);
    
    // Dry/Wet mix for reverb
    this.dryGain = this.audioContext.createGain();
    this.dryGain.gain.value = 0.8; // 80% dry
    this.dryGain.connect(this.limiter);
    
    this.wetGain = this.audioContext.createGain();
    this.wetGain.gain.value = 0.2; // 20% wet
    this.wetGain.connect(delay1);
    
    // Connect dry path
    this.compressor.connect(this.dryGain);
    
    console.log('✅ Effects chain created');
  }
  
  /**
   * Set EQ gains (5 bands)
   */
  setEQ(bassGain: number, midGain: number, trebleGain: number) {
    if (this.eqNodes.length < 5) return;
    
    // Map 3-band EQ to 5-band
    this.eqNodes[0].gain.value = bassGain; // Low Shelf
    this.eqNodes[1].gain.value = bassGain * 0.5; // Low Mid
    this.eqNodes[2].gain.value = midGain; // Mid
    this.eqNodes[3].gain.value = trebleGain * 0.5; // High Mid
    this.eqNodes[4].gain.value = trebleGain; // High Shelf
    
    console.log('🎚️ EQ updated:', { bass: bassGain, mid: midGain, treble: trebleGain });
  }
  
  /**
   * Enable/disable volume normalization
   */
  setNormalizationEnabled(enabled: boolean) {
    this.normalizationEnabled = enabled;
    console.log('📊 Volume normalization:', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Set target RMS level for normalization (0-1)
   */
  setTargetRMS(targetRMS: number) {
    this.targetRMS = Math.max(0.01, Math.min(1.0, targetRMS));
    // Clear cached gains to recalculate with new target
    this.noteGains.clear();
    console.log('📊 Target RMS set to:', this.targetRMS);
  }

  /**
   * Get normalization statistics
   */
  getNormalizationStats() {
    const gains = Array.from(this.noteGains.values());
    if (gains.length === 0) {
      return { count: 0, avgGain: 1.0, minGain: 1.0, maxGain: 1.0 };
    }

    const avgGain = gains.reduce((a, b) => a + b, 0) / gains.length;
    const minGain = Math.min(...gains);
    const maxGain = Math.max(...gains);

    return {
      count: gains.length,
      avgGain: avgGain.toFixed(2),
      minGain: minGain.toFixed(2),
      maxGain: maxGain.toFixed(2),
    };
  }

  /**
   * Set reverb amount (0-1)
   */
  setReverbAmount(amount: number) {
    if (this.reverbGain && this.dryGain && this.wetGain) {
      const wet = Math.max(0, Math.min(1, amount));
      const dry = 1 - wet;
      
      this.reverbGain.gain.value = wet;
      this.dryGain.gain.value = dry;
      this.wetGain.gain.value = wet;
      
      console.log('🏛️ Reverb amount:', amount);
    }
  }
  
  /**
   * Preload common notes (C3-C5 for guitar) to reduce latency
   */
  private async preloadCommonNotes() {
    if (this.preloadInProgress || !this.instrument) return;
    
    this.preloadInProgress = true;
    console.log('📦 Preloading common notes...');
    
    try {
      const commonNotes: string[] = [];
      
      // Preload C3 to C5 (common range for guitar)
      for (let octave = 3; octave <= 5; octave++) {
        for (const note of NOTES) {
          commonNotes.push(note + octave);
        }
      }
      
      // Preload in batches to avoid overwhelming
      const batchSize = 10;
      for (let i = 0; i < commonNotes.length; i += batchSize) {
        const batch = commonNotes.slice(i, i + batchSize);
        
        // Trigger play with very short duration to cache samples
        const currentTime = this.audioContext!.currentTime;
        batch.forEach(note => {
          try {
            // Play with 0 duration to just cache the sample
            this.instrument!.play(note, currentTime, { duration: 0.001 });
            this.preloadedNotes.add(note);
          } catch (e) {
            // Ignore individual note errors
          }
        });
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      console.log(`✅ Preloaded ${this.preloadedNotes.size} common notes`);
    } catch (error) {
      console.warn('⚠️ Error during preload:', error);
    } finally {
      this.preloadInProgress = false;
    }
  }

  private async loadInstrument(instrumentType: InstrumentType) {
    if (this.isLoading) {
      console.log('⏳ Already loading an instrument...');
      return;
    }

    this.isLoading = true;

    try {
      if (!this.audioContext) {
        throw new Error('AudioContext not initialized');
      }

      const soundfontName = SOUNDFONT_INSTRUMENTS[instrumentType];
      console.log('🎸 Loading instrument:', soundfontName);

      // Dispose old instrument
      if (this.instrument) {
        this.instrument = null;
      }

      // Load new instrument from CDN with timeout
      // Note: soundfont-player connects directly to audioContext.destination
      // To apply effects, we need to intercept via AudioContext's destination
      // For now, we'll create the instrument and route through effects manually if needed
      const loadPromise = Soundfont.instrument(this.audioContext, soundfontName as any, {
        soundfont: 'MusyngKite', // High-quality soundfont
        nameToUrl: (name: string, soundfont: string) => {
          return `https://gleitz.github.io/midi-js-soundfonts/${soundfont}/${name}-mp3.js`;
        },
        // Try to use custom destination if supported
        ...(this.compressor && { destination: this.compressor }),
      });
      
      // Add timeout (10 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Load timeout')), 10000);
      });
      
      this.instrument = await Promise.race([loadPromise, timeoutPromise]) as Soundfont.Player;
      
      // If custom destination didn't work, we'll need to patch the play method
      // to route through effects chain (future enhancement)

      console.log('✅ Instrument loaded:', soundfontName);
      this.loadErrorCount = 0; // Reset error count on success
      return true;
    } catch (error) {
      console.error('❌ Error loading instrument:', error);
      this.loadErrorCount++;
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  async setInstrument(instrumentType: InstrumentType) {
    console.log('🎸 Changing instrument to:', instrumentType);
    this.currentInstrument = instrumentType;
    
    if (this.isInitialized) {
      await this.loadInstrument(instrumentType);
    }
  }

  getInstrument(): InstrumentType {
    return this.currentInstrument;
  }

  private getNoteFromInterval(root: string, interval: number): string {
    const rootIndex = NOTES.indexOf(root);
    if (rootIndex === -1) return 'C4';
    
    const noteIndex = (rootIndex + interval) % 12;
    const octave = 4 + Math.floor((rootIndex + interval) / 12);
    
    return NOTES[noteIndex] + octave;
  }

  private getChordNotes(root: string, chordType: string): string[] {
    const intervals = CHORD_INTERVALS[chordType] || CHORD_INTERVALS['major'];
    return intervals.map(interval => this.getNoteFromInterval(root, interval));
  }

  /**
   * Analyze and normalize volume of a sample
   * Uses a more efficient approach: analyze during actual playback
   * Returns normalized gain value (0-1)
   */
  private async analyzeAndNormalizeNote(note: string): Promise<number> {
    if (!this.audioContext || !this.normalizationEnabled) {
      return 1.0; // No normalization
    }

    // Check if we already have the gain for this note
    if (this.noteGains.has(note)) {
      return this.noteGains.get(note)!;
    }

    try {
      // Create analyser for RMS measurement
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.8;

      // Create a temporary gain node to capture audio
      const captureGain = this.audioContext.createGain();
      captureGain.gain.value = 0.1; // Play at low volume for analysis
      captureGain.connect(analyser);
      
      // Connect analyser to destination (we need to hear it to analyze)
      analyser.connect(this.audioContext.destination);

      // Play note at low volume and capture RMS
      const currentTime = this.audioContext.currentTime;
      if (this.instrument) {
        this.instrument.play(note, currentTime, { 
          duration: 0.3, // Longer duration for better analysis
          gain: 0.1 // Low volume for analysis
        });
      }

      // Wait for audio to play and analyze
      await new Promise(resolve => setTimeout(resolve, 350));

      // Get time domain data
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);
      analyser.getFloatTimeDomainData(dataArray);

      // Calculate RMS (Root Mean Square)
      let sum = 0;
      let sampleCount = 0;
      for (let i = 0; i < bufferLength; i++) {
        const sample = dataArray[i];
        if (Math.abs(sample) > 0.001) { // Only count non-silent samples
          sum += sample * sample;
          sampleCount++;
        }
      }
      
      const rms = sampleCount > 0 ? Math.sqrt(sum / sampleCount) : 0;

      // Calculate normalization gain
      let normalizedGain = 1.0;
      if (rms > 0.001) {
        // Normalize to target RMS
        // Since we played at 0.1 gain, adjust calculation
        const actualRMS = rms / 0.1; // Estimate actual RMS
        normalizedGain = this.targetRMS / actualRMS;
        
        // Clamp to reasonable range (0.2 to 2.5)
        // This prevents extreme gain values that could cause distortion
        normalizedGain = Math.max(0.2, Math.min(2.5, normalizedGain));
      }

      // Store normalized gain
      this.noteGains.set(note, normalizedGain);

      // Cleanup
      analyser.disconnect();
      captureGain.disconnect();

      console.log(`📊 Normalized ${note}: RMS=${rms.toFixed(3)}, Gain=${normalizedGain.toFixed(2)}`);
      
      return normalizedGain;
    } catch (error) {
      console.warn(`⚠️ Could not normalize ${note}, using default gain:`, error);
      this.noteGains.set(note, 1.0);
      return 1.0;
    }
  }

  /**
   * Batch normalize common notes during preload
   * Runs in background to avoid blocking initialization
   */
  private async normalizeCommonNotes() {
    if (!this.normalizationEnabled || !this.instrument) return;

    // Run normalization in background (don't await)
    setTimeout(async () => {
      console.log('📊 Normalizing volume of common notes...');

      const commonNotes: string[] = [];
      // Focus on most common notes first (middle octave)
      for (let octave = 4; octave <= 4; octave++) {
        for (const note of NOTES) {
          commonNotes.push(note + octave);
        }
      }

      // Normalize sequentially to avoid audio conflicts
      for (const note of commonNotes) {
        if (!this.noteGains.has(note)) {
          await this.analyzeAndNormalizeNote(note);
          // Small delay between notes
          await new Promise(resolve => setTimeout(resolve, 400));
        }
      }

      // Then normalize other octaves in background
      for (let octave = 3; octave <= 5; octave++) {
        if (octave === 4) continue; // Already done
        
        for (const note of NOTES) {
          const noteWithOctave = note + octave;
          if (!this.noteGains.has(noteWithOctave)) {
            await this.analyzeAndNormalizeNote(noteWithOctave);
            await new Promise(resolve => setTimeout(resolve, 400));
          }
        }
      }

      console.log(`✅ Normalized ${this.noteGains.size} notes`);
      
      // Log statistics
      const stats = this.getNormalizationStats();
      console.log('📊 Normalization stats:', stats);
    }, 2000); // Start after 2 seconds to not interfere with initialization
  }

  async playNote(note: string, duration: number = 0.5): Promise<void> {
    try {
      const initialized = await this.initialize();
      if (!initialized || !this.instrument) {
        console.error('❌ Instrument not loaded');
        throw new Error('Instrument not available - fallback to synthesis recommended');
      }

      // Ensure note has octave (default to 4 if not specified)
      let noteWithOctave = note;
      if (!/\d/.test(note)) {
        noteWithOctave = note + '4';
      }

      // Get normalized gain for this note
      let gain = 1.0;
      if (this.normalizationEnabled) {
        if (this.noteGains.has(noteWithOctave)) {
          gain = this.noteGains.get(noteWithOctave)!;
        } else {
          // Normalize on-the-fly if not cached
          gain = await this.analyzeAndNormalizeNote(noteWithOctave);
        }
      }

      console.log('🎵 Playing note:', noteWithOctave, `(gain: ${gain.toFixed(2)})`);

      const currentTime = this.audioContext!.currentTime;
      
      // Apply normalized gain when playing
      this.instrument.play(noteWithOctave, currentTime, { 
        duration,
        gain: gain // Apply normalized gain
      });

      console.log('✅ Note played successfully');
    } catch (error) {
      console.error('❌ Error playing note:', error);
      throw error; // Re-throw to allow fallback handling
    }
  }

  async playScale(scaleName: string, root: string, intervals: number[], duration: number = 0.5): Promise<void> {
    try {
      await this.initialize();
      if (!this.instrument) {
        console.error('❌ Instrument not loaded');
        return;
      }

      console.log('🎵 Playing scale:', scaleName, 'from', root);

      const rootIndex = NOTES.indexOf(root);
      if (rootIndex === -1) {
        console.error('❌ Invalid root note:', root);
        return;
      }

      // Generate scale notes (ascending)
      const scaleNotes = intervals.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        return NOTES[noteIndex] + '4';
      });

      // Add octave note
      scaleNotes.push(root + '5');

      // Play notes in sequence with normalized gains
      let currentTime = this.audioContext!.currentTime;
      
      for (const note of scaleNotes) {
        // Get normalized gain for each note
        let gain = 1.0;
        if (this.normalizationEnabled && this.noteGains.has(note)) {
          gain = this.noteGains.get(note)!;
        } else if (this.normalizationEnabled) {
          gain = await this.analyzeAndNormalizeNote(note);
        }
        
        this.instrument!.play(note, currentTime, { 
          duration,
          gain 
        });
        currentTime += duration;
      }

      console.log('✅ Scale played:', scaleNotes.length, 'notes');
    } catch (error) {
      console.error('❌ Error playing scale:', error);
    }
  }

  async playChord(chordName: string, duration: number = 2): Promise<void> {
    console.log('🎸 playChord called:', chordName);
    
    const initialized = await this.initialize();
    if (!initialized || !this.instrument) {
      console.error('❌ Instrument not available');
      return;
    }

    try {
      // Parse chord name (e.g., "C", "Am", "G7")
      const match = chordName.match(/^([A-G][#b]?)(.*)/);
      if (!match) {
        console.error('❌ Invalid chord name:', chordName);
        return;
      }

      const root = match[1];
      let chordType = match[2] || 'major';
      
      // Map common chord suffixes
      if (chordType === 'm') chordType = 'minor';
      if (chordType === '') chordType = 'major';

      console.log('🎵 Parsed:', { root, chordType });

      const notes = this.getChordNotes(root, chordType);
      console.log('🎶 Notes:', notes);

      // Play chord as arpeggio with normalized gains
      const currentTime = this.audioContext!.currentTime;
      const noteDelay = 0.08; // 80ms between notes for arpeggio
      
      notes.forEach(async (note, index) => {
        // Get normalized gain for each note
        let gain = 1.0;
        if (this.normalizationEnabled && this.noteGains.has(note)) {
          gain = this.noteGains.get(note)!;
        } else if (this.normalizationEnabled) {
          gain = await this.analyzeAndNormalizeNote(note);
        }
        
        this.instrument!.play(note, currentTime + index * noteDelay, { 
          duration,
          gain 
        });
      });

      console.log('✅ Chord played successfully');
    } catch (error) {
      console.error('❌ Error playing chord:', error);
    }
  }

  async playChordStrummed(chordName: string, duration: number = 2.5) {
    const initialized = await this.initialize();
    if (!initialized || !this.instrument) {
      console.error('❌ Instrument not available');
      return;
    }

    try {
      const match = chordName.match(/^([A-G][#b]?)(.*)/);
      if (!match) return;

      const root = match[1];
      let chordType = match[2] || 'major';
      if (chordType === 'm') chordType = 'minor';
      if (chordType === '') chordType = 'major';

      const notes = this.getChordNotes(root, chordType);

      // Play all notes together (strummed) with normalized gains
      const currentTime = this.audioContext!.currentTime;
      
      // Get gains for all notes
      const noteGains = await Promise.all(
        notes.map(async (note) => {
          if (this.normalizationEnabled && this.noteGains.has(note)) {
            return this.noteGains.get(note)!;
          } else if (this.normalizationEnabled) {
            return await this.analyzeAndNormalizeNote(note);
          }
          return 1.0;
        })
      );
      
      notes.forEach((note, index) => {
        this.instrument!.play(note, currentTime, { 
          duration,
          gain: noteGains[index]
        });
      });

      console.log('✅ Strummed chord played');
    } catch (error) {
      console.error('❌ Error playing strummed chord:', error);
    }
  }

  stopAll() {
    if (this.instrument) {
      this.instrument.stop();
      console.log('🛑 All notes stopped');
    }
  }

  dispose() {
    this.stopAll();
    if (this.instrument) {
      this.instrument = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isInitialized = false;
    this.loadErrorCount = 0;
    this.preloadedNotes.clear();
    this.noteGains.clear();
    this.preloadInProgress = false;
    console.log('🗑️ AudioServiceWithSamples disposed');
  }
}

export const audioServiceWithSamples = new AudioServiceWithSamples();
