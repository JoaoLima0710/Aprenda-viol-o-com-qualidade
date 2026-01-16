import * as Tone from 'tone';

// Mapeamento de notas para frequências
const NOTE_FREQUENCIES: Record<string, string> = {
  'C': 'C3',
  'C#': 'C#3',
  'Db': 'Db3',
  'D': 'D3',
  'D#': 'D#3',
  'Eb': 'Eb3',
  'E': 'E3',
  'F': 'F3',
  'F#': 'F#3',
  'Gb': 'Gb3',
  'G': 'G3',
  'G#': 'G#3',
  'Ab': 'Ab3',
  'A': 'A3',
  'A#': 'A#3',
  'Bb': 'Bb3',
  'B': 'B3',
};

// Intervalos das escalas (em semitons)
const SCALE_INTERVALS: Record<string, number[]> = {
  'major': [0, 2, 4, 5, 7, 9, 11, 12],
  'minor': [0, 2, 3, 5, 7, 8, 10, 12],
  'pentatonic-minor': [0, 3, 5, 7, 10, 12],
  'pentatonic-major': [0, 2, 4, 7, 9, 12],
  'blues': [0, 3, 5, 6, 7, 10, 12],
  'dorian': [0, 2, 3, 5, 7, 9, 10, 12],
  'phrygian': [0, 1, 3, 5, 7, 8, 10, 12],
  'lydian': [0, 2, 4, 6, 7, 9, 11, 12],
  'mixolydian': [0, 2, 4, 5, 7, 9, 10, 12],
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
  private currentNotes: string[] = [];

  async initialize() {
    if (this.isInitialized) return;

    try {
      await Tone.start();
      
      // Criar sintetizador com som de violão simulado
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'triangle',
        },
        envelope: {
          attack: 0.005,
          decay: 0.3,
          sustain: 0.4,
          release: 1.2,
        },
      }).toDestination();

      // Ajustar volume
      this.synth.volume.value = -8;

      this.isInitialized = true;
      console.log('AudioService initialized');
    } catch (error) {
      console.error('Failed to initialize AudioService:', error);
    }
  }

  private getChordNotes(root: string, chordType: string): string[] {
    const rootNote = NOTE_FREQUENCIES[root] || 'C3';
    const intervals = CHORD_INTERVALS[chordType] || CHORD_INTERVALS['major'];
    
    const rootMidi = Tone.Frequency(rootNote).toMidi();
    
    return intervals.map(interval => {
      const noteMidi = rootMidi + interval;
      return Tone.Frequency(noteMidi, 'midi').toNote();
    });
  }

  private parseChordName(chordName: string): { root: string; type: string } {
    // Exemplos: C, Cm, C7, Cmaj7, etc
    const match = chordName.match(/^([A-G][#b]?)(.*)?$/);
    
    if (!match) {
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

  async playChord(chordName: string, duration: number = 2) {
    await this.initialize();
    
    if (!this.synth) {
      console.error('Synth not initialized');
      return;
    }

    // Parar notas anteriores
    this.stopAll();

    const { root, type } = this.parseChordName(chordName);
    const notes = this.getChordNotes(root, type);
    
    this.currentNotes = notes;
    
    // Tocar acorde com arpejo suave
    notes.forEach((note, index) => {
      setTimeout(() => {
        this.synth?.triggerAttackRelease(note, duration, Tone.now(), 0.6);
      }, index * 50); // 50ms de delay entre cada nota
    });
  }

  async playChordStrummed(chordName: string, duration: number = 2) {
    await this.initialize();
    
    if (!this.synth) {
      console.error('Synth not initialized');
      return;
    }

    this.stopAll();

    const { root, type } = this.parseChordName(chordName);
    const notes = this.getChordNotes(root, type);
    
    this.currentNotes = notes;
    
    // Tocar todas as notas juntas (dedilhado)
    this.synth.triggerAttackRelease(notes, duration, Tone.now(), 0.7);
  }

  async playScale(scaleName: string, root: string = 'C', pattern: 'ascending' | 'descending' | 'both' = 'ascending') {
    await this.initialize();
    
    if (!this.synth) {
      console.error('Synth not initialized');
      return;
    }

    this.stopAll();

    const rootNote = NOTE_FREQUENCIES[root] || 'C3';
    const intervals = SCALE_INTERVALS[scaleName] || SCALE_INTERVALS['major'];
    
    const rootMidi = Tone.Frequency(rootNote).toMidi();
    
    const ascendingNotes = intervals.map(interval => {
      const noteMidi = rootMidi + interval;
      return Tone.Frequency(noteMidi, 'midi').toNote();
    });

    let notesToPlay = ascendingNotes;
    
    if (pattern === 'descending') {
      notesToPlay = [...ascendingNotes].reverse();
    } else if (pattern === 'both') {
      notesToPlay = [...ascendingNotes, ...ascendingNotes.slice(0, -1).reverse()];
    }

    // Tocar escala com timing
    const noteLength = '8n';
    const now = Tone.now();
    
    notesToPlay.forEach((note, index) => {
      this.synth?.triggerAttackRelease(note, noteLength, now + index * 0.25, 0.6);
    });
  }

  async playSingleNote(note: string, duration: number = 1) {
    await this.initialize();
    
    if (!this.synth) {
      console.error('Synth not initialized');
      return;
    }

    const frequency = NOTE_FREQUENCIES[note] || 'C3';
    this.synth.triggerAttackRelease(frequency, duration, Tone.now(), 0.7);
  }

  stopAll() {
    if (this.synth) {
      this.synth.releaseAll();
      this.currentNotes = [];
    }
  }

  setVolume(volume: number) {
    if (this.synth) {
      // Volume em dB (-60 a 0)
      this.synth.volume.value = volume;
    }
  }

  dispose() {
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
      this.isInitialized = false;
    }
  }
}

// Singleton instance
export const audioService = new AudioService();
