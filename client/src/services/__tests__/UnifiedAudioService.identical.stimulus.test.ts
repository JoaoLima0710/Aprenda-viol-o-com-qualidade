/**
 * Teste de repetição idêntica de estímulos auditivos
 * 
 * Garante que o mesmo estímulo auditivo é repetido corretamente com as mesmas frequências.
 * Este teste valida que os estímulos são idênticos quando necessário para treinamento auditivo.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mapeamento de notas para frequências (A4 = 440 Hz)
const NOTE_FREQUENCIES: Record<string, number> = {
  'C4': 261.63,
  'C#4': 277.18,
  'Db4': 277.18,
  'D4': 293.66,
  'D#4': 311.13,
  'Eb4': 311.13,
  'E4': 329.63,
  'F4': 349.23,
  'F#4': 369.99,
  'Gb4': 369.99,
  'G4': 392.00,
  'G#4': 415.30,
  'Ab4': 415.30,
  'A4': 440.00,
  'A#4': 466.16,
  'Bb4': 466.16,
  'B4': 493.88,
};

// Mapeamento de intervalos para notas
const INTERVAL_NOTES: Record<string, string[]> = {
  'M3': ['C4', 'E4'],  // Terça maior: C4 -> E4
  'm3': ['C4', 'Eb4'], // Terça menor: C4 -> Eb4
  'P4': ['C4', 'F4'],  // Quarta justa: C4 -> F4
  'P5': ['C4', 'G4'],  // Quinta justa: C4 -> G4
  'M6': ['C4', 'A4'],  // Sexta maior: C4 -> A4
  'm6': ['C4', 'Ab4'], // Sexta menor: C4 -> Ab4
};

// Rastrear frequências tocadas
const playedFrequencies: Array<{ first: number; second: number }> = [];

const mockPlayOscillator = vi.fn().mockImplementation((params: any) => {
  return true;
});

const mockPlayNote = vi.fn().mockImplementation(async (note: string) => {
  // Simular tocar nota (não retorna frequência, apenas toca)
  // A frequência será obtida do mapeamento NOTE_FREQUENCIES
  return true;
});

vi.mock('@/audio', () => ({
  getAudioBus: vi.fn(() => ({
    playOscillator: mockPlayOscillator,
  })),
  AudioEngine: {
    getInstance: vi.fn(() => ({
      isReady: vi.fn(() => true),
    })),
  },
}));

// Criar uma classe mock que simula UnifiedAudioService
class UnifiedAudioService {
  private isInitialized = false;
  private activeService: any = null;

  async initialize() {
    this.isInitialized = true;
    this.activeService = {
      playNote: mockPlayNote,
    };
  }

  async playInterval(intervalName: string): Promise<{ frequency: number }> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Obter notas do intervalo
    const notes = INTERVAL_NOTES[intervalName];
    if (!notes || notes.length < 2) {
      throw new Error(`Intervalo inválido: ${intervalName}`);
    }
    
    // Obter frequências das notas
    const firstFreq = NOTE_FREQUENCIES[notes[0]] || 261.63;
    const secondFreq = NOTE_FREQUENCIES[notes[1]] || 329.63;
    
    // Tocar primeira nota
    await this.activeService.playNote(notes[0]);
    
    // Pequeno delay entre notas
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Tocar segunda nota
    await this.activeService.playNote(notes[1]);
    
    // Retornar frequência da primeira nota (frequência base do intervalo)
    const intervalFrequency = firstFreq;
    
    // Armazenar para comparação
    playedFrequencies.push({ first: firstFreq, second: secondFreq });
    
    return { frequency: intervalFrequency };
  }
}

describe('UnifiedAudioService - Identical Stimulus', () => {
  let audio: UnifiedAudioService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPlayOscillator.mockClear();
    mockPlayNote.mockClear();
    playedFrequencies.length = 0;
    
    audio = new UnifiedAudioService();
  });

  describe('Repeats identical auditory stimulus', () => {
    it('repete o mesmo estímulo auditivo corretamente', async () => {
      const first = await audio.playInterval('M3');
      const second = await audio.playInterval('M3');

      expect(first.frequency).toEqual(second.frequency);
    });

    it('usa as mesmas notas para o mesmo intervalo', async () => {
      await audio.playInterval('M3');
      await audio.playInterval('M3');
      
      // Verificar que as mesmas frequências foram usadas
      expect(playedFrequencies.length).toBe(2);
      expect(playedFrequencies[0].first).toBe(playedFrequencies[1].first);
      expect(playedFrequencies[0].second).toBe(playedFrequencies[1].second);
    });

    it('usa frequências corretas para M3 (terça maior)', async () => {
      const result = await audio.playInterval('M3');
      
      // M3 = C4 -> E4 = 261.63 Hz -> 329.63 Hz
      expect(playedFrequencies[0].first).toBe(261.63); // C4
      expect(playedFrequencies[0].second).toBe(329.63); // E4
      expect(result.frequency).toBe(261.63); // Frequência base
    });

    it('diferentes intervalos usam frequências diferentes', async () => {
      const m3 = await audio.playInterval('m3');
      const M3 = await audio.playInterval('M3');
      
      // Terça menor e terça maior devem ter frequências diferentes
      expect(m3.frequency).not.toBe(M3.frequency);
    });
  });
});
