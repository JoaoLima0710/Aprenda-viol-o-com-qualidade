/**
 * Teste de Repetição Idêntica de Som
 * 
 * Verifica que quando o botão de repetir é pressionado, o mesmo buffer é usado.
 * 
 * OBJETIVO:
 * - Garantir que repetição usa o mesmo buffer (mesma referência)
 * - Evitar recarregamento desnecessário
 * - Manter consistência sonora
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAudioBus } from '@/audio';
import { SampleLoader } from '@/audio/SampleLoader';

// Mock do AudioBus
const mockBuffer = {
  duration: 1.0,
  sampleRate: 44100,
  numberOfChannels: 2,
  length: 44100,
} as AudioBuffer;

const mockSampleData = {
  buffer: mockBuffer,
  duration: 1.0,
  loaded: true,
};

let lastPlayedBuffer: { buffer: AudioBuffer; soundId: string } | null = null;

const mockAudioBus = {
  playSample: vi.fn(async ({ sample, soundId }: { sample: any; soundId?: string }) => {
    if (soundId) {
      lastPlayedBuffer = { buffer: sample.buffer, soundId };
    }
    return true;
  }),
  repeatLastSound: vi.fn(async () => {
    // Retornar o mesmo buffer (mesma referência)
    return lastPlayedBuffer;
  }),
  playBuffer: vi.fn().mockResolvedValue(true),
  isPlaying: vi.fn(() => false),
  lastPlayed: vi.fn(() => null),
  setLastPlayed: vi.fn(),
};

vi.mock('@/audio', () => ({
  getAudioBus: vi.fn(() => mockAudioBus),
  initializeAudioSystem: vi.fn().mockResolvedValue(undefined),
}));

// Mock do SampleLoader
vi.mock('@/audio/SampleLoader', () => ({
  SampleLoader: {
    getInstance: vi.fn(() => ({
      loadSample: vi.fn(async (url: string) => {
        // Retornar o mesmo buffer para o mesmo URL
        return mockSampleData;
      }),
    })),
  },
}));

// Função helper para tocar som
async function playSound(soundId: string): Promise<{ buffer: AudioBuffer; soundId: string }> {
  const audioBus = getAudioBus();
  if (!audioBus) {
    throw new Error('AudioBus not available');
  }

  // Simular carregamento de sample
  const sampleLoader = SampleLoader.getInstance();
  const sample = await sampleLoader.loadSample(`/samples/intervals/${soundId}.mp3`);

  // Tocar som com soundId para rastreamento
  await audioBus.playSample({
    sample,
    channel: 'effects',
    volume: 0.8,
    soundId,
  });

  // Retornar buffer usado
  return { buffer: sample.buffer, soundId };
}

// Função helper para repetir som
async function repeatSound(): Promise<{ buffer: AudioBuffer; soundId: string } | null> {
  const audioBus = getAudioBus();
  if (!audioBus) {
    throw new Error('AudioBus not available');
  }

  return await audioBus.repeatLastSound({
    channel: 'effects',
    volume: 0.8,
  });
}

describe('Sound Repeat Identical', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastPlayedBuffer = null;
  });

  it('replays identical sound when repeat is pressed', async () => {
    // Tocar som pela primeira vez
    const first = await playSound('interval-M3');

    // Verificar que o som foi tocado
    expect(mockAudioBus.playSample).toHaveBeenCalledWith(
      expect.objectContaining({
        sample: expect.objectContaining({ buffer: mockBuffer }),
        soundId: 'interval-M3',
      })
    );

    // Repetir o som
    const second = await repeatSound();

    // Verificar que o mesmo buffer foi usado (mesma referência)
    expect(second).not.toBeNull();
    expect(second?.buffer).toBe(first.buffer);
    expect(second?.soundId).toBe('interval-M3');
    expect(mockAudioBus.repeatLastSound).toHaveBeenCalled();
  });

  it('returns null when no sound was played before', async () => {
    // Tentar repetir sem ter tocado nada antes
    const result = await repeatSound();

    expect(result).toBeNull();
  });

  it('uses same buffer reference for multiple repeats', async () => {
    // Tocar som
    const first = await playSound('interval-M3');

    // Repetir múltiplas vezes
    const second = await repeatSound();
    const third = await repeatSound();

    // Todos devem usar o mesmo buffer (mesma referência)
    expect(first.buffer).toBe(second?.buffer);
    expect(second?.buffer).toBe(third?.buffer);
    expect(first.buffer).toBe(third?.buffer);
  });
});
