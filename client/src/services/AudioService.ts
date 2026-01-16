import * as Tone from 'tone';

// Mapeamento de notas para frequências
const NOTE_FREQUENCIES: Record<string, number> = {
  'C': 261.63,
  'C#': 277.18,
  'Db': 277.18,
  'D': 293.66,
  'D#': 311.13,
  'Eb': 311.13,
  'E': 329.63,
  'F': 349.23,
  'F#': 369.99,
  'Gb': 369.99,
  'G': 392.00,
  'G#': 415.30,
  'Ab': 415.30,
  'A': 440.00,
  'A#': 466.16,
  'Bb': 466.16,
  'B': 493.88,
};

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

class AudioService {
  private synth: Tone.PolySynth | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) {
      console.log('✅ AudioService already initialized');
      return true;
    }

    try {
      console.log('🎵 Initializing AudioService...');
      
      // Start Tone.js context
      await Tone.start();
      console.log('✅ Tone.js context started');
      
      // Create synth with warm, guitar-like sound
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'sine8', // Sine wave with 8 harmonics for warmth
        },
        envelope: {
          attack: 0.008,
          decay: 0.4,
          sustain: 0.3,
          release: 2.0,
        },
      }).toDestination();
      
      // Add reverb for natural ambience
      const reverb = new Tone.Reverb({
        decay: 1.5,
        wet: 0.3,
      }).toDestination();
      
      this.synth.connect(reverb);

      // Set volume
      this.synth.volume.value = -8;

      this.isInitialized = true;
      console.log('✅ AudioService initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize AudioService:', error);
      return false;
    }
  }

  private parseChordName(chordName: string): { root: string; type: string } {
    // Remove espaços
    chordName = chordName.trim();
    
    // Exemplos: C, Cm, C7, Cmaj7, etc
    const match = chordName.match(/^([A-G][#b]?)(.*)?$/);
    
    if (!match) {
      console.warn('Invalid chord name:', chordName);
      return { root: 'C', type: 'major' };
    }

    const root = match[1];
    let type = match[2] || '';

    // Mapear tipos de acordes
    const typeMap: Record<string, string> = {
      '': 'major',
      'm': 'minor',
      'min': 'minor',
      '7': '7',
      'm7': 'm7',
      'maj7': 'maj7',
      'sus2': 'sus2',
      'sus4': 'sus4',
      'dim': 'dim',
      'aug': 'aug',
      '6': '6',
      'm6': 'm6',
      '9': '9',
      'add9': 'add9',
    };

    type = typeMap[type] || 'major';

    return { root, type };
  }

  private getChordNotes(root: string, chordType: string): number[] {
    const rootFreq = NOTE_FREQUENCIES[root] || NOTE_FREQUENCIES['C'];
    const intervals = CHORD_INTERVALS[chordType] || CHORD_INTERVALS['major'];
    
    return intervals.map(interval => {
      // Calcular frequência usando a fórmula: f = f0 * 2^(n/12)
      return rootFreq * Math.pow(2, interval / 12);
    });
  }

  async playChord(chordName: string, duration: number = 2.5) {
    console.log('🎸 playChord called:', chordName);
    
    const initialized = await this.initialize();
    if (!initialized || !this.synth) {
      console.error('❌ Synth not available');
      return;
    }

    try {
      // Stop any playing notes
      this.stopAll();

      const { root, type } = this.parseChordName(chordName);
      console.log('📝 Parsed chord:', { root, type });
      
      const frequencies = this.getChordNotes(root, type);
      console.log('🎼 Frequencies:', frequencies);
      
      // Play chord with slight arpeggio
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          console.log(`🎵 Playing note ${index + 1}:`, freq.toFixed(2), 'Hz');
          this.synth?.triggerAttackRelease(freq, duration, Tone.now(), 0.7);
        }, index * 50);
      });
      
      console.log('✅ Chord playing');
    } catch (error) {
      console.error('❌ Error playing chord:', error);
    }
  }

  async playChordStrummed(chordName: string, duration: number = 2.5) {
    console.log('🎸 playChordStrummed called:', chordName);
    
    const initialized = await this.initialize();
    if (!initialized || !this.synth) {
      console.error('❌ Synth not available');
      return;
    }

    try {
      this.stopAll();

      const { root, type } = this.parseChordName(chordName);
      const frequencies = this.getChordNotes(root, type);
      
      // Play all notes together
      this.synth.triggerAttackRelease(frequencies, duration, Tone.now(), 0.8);
      
      console.log('✅ Strummed chord playing');
    } catch (error) {
      console.error('❌ Error playing strummed chord:', error);
    }
  }

  async playScale(scaleName: string, root: string = 'C', pattern: 'ascending' | 'descending' | 'both' = 'ascending') {
    const initialized = await this.initialize();
    if (!initialized || !this.synth) {
      console.error('❌ Synth not available');
      return;
    }

    try {
      this.stopAll();

      // Scale intervals (major scale as example)
      const scaleIntervals = [0, 2, 4, 5, 7, 9, 11, 12];
      const rootFreq = NOTE_FREQUENCIES[root] || NOTE_FREQUENCIES['C'];
      
      const frequencies = scaleIntervals.map(interval => 
        rootFreq * Math.pow(2, interval / 12)
      );

      let notesToPlay = frequencies;
      
      if (pattern === 'descending') {
        notesToPlay = [...frequencies].reverse();
      } else if (pattern === 'both') {
        notesToPlay = [...frequencies, ...frequencies.slice(0, -1).reverse()];
      }

      // Play scale
      notesToPlay.forEach((freq, index) => {
        setTimeout(() => {
          this.synth?.triggerAttackRelease(freq, '8n', Tone.now(), 0.6);
        }, index * 250);
      });
      
      console.log('✅ Scale playing');
    } catch (error) {
      console.error('❌ Error playing scale:', error);
    }
  }

  async playSingleNote(note: string, duration: number = 1) {
    const initialized = await this.initialize();
    if (!initialized || !this.synth) {
      console.error('❌ Synth not available');
      return;
    }

    try {
      const frequency = NOTE_FREQUENCIES[note] || NOTE_FREQUENCIES['C'];
      this.synth.triggerAttackRelease(frequency, duration, Tone.now(), 0.7);
      console.log('✅ Note playing:', note, frequency, 'Hz');
    } catch (error) {
      console.error('❌ Error playing note:', error);
    }
  }

  stopAll() {
    if (this.synth) {
      this.synth.releaseAll();
      console.log('🛑 All notes stopped');
    }
  }

  setVolume(volume: number) {
    if (this.synth) {
      // Volume em dB (-60 a 0)
      this.synth.volume.value = volume;
      console.log('🔊 Volume set to:', volume, 'dB');
    }
  }

  dispose() {
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
      this.isInitialized = false;
      console.log('🗑️ AudioService disposed');
    }
  }
}

// Singleton instance
export const audioService = new AudioService();
