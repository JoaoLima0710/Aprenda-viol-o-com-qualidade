import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import AudioEngine from '../AudioEngine';

let mockResume: ReturnType<typeof vi.fn>;

beforeAll(() => {
  const mockAudioContext = {
    state: 'suspended',
    sampleRate: 44100,
    resume: vi.fn().mockResolvedValue(undefined),
    suspend: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    createGain: vi.fn(() => ({
      connect: vi.fn(),
      gain: { value: 1 }
    })),

    createDynamicsCompressor: vi.fn(() => ({
      connect: vi.fn(),
      threshold: { value: 0 },
      knee: { value: 0 },
      ratio: { value: 1 },
      attack: { value: 0 },
      release: { value: 0 }
    })),

    createAnalyser: vi.fn(() => ({
      connect: vi.fn(),
      disconnect: vi.fn(),
      fftSize: 2048,
      frequencyBinCount: 1024,
      getByteFrequencyData: vi.fn(),
      getByteTimeDomainData: vi.fn()
    })),

    createBuffer: vi.fn((channels: number, length: number, sampleRate: number) => ({
      numberOfChannels: channels,
      length,
      sampleRate,
      getChannelData: vi.fn(() => new Float32Array(length))
    })),

    destination: {}
  };

  vi.stubGlobal('AudioContext', vi.fn(() => mockAudioContext));
  vi.stubGlobal('webkitAudioContext', vi.fn(() => mockAudioContext));
});

describe('AudioEngine', () => {
  let audioEngine: AudioEngine;

  beforeEach(() => {
    audioEngine = AudioEngine.getInstance();
  });

  it('should resume audio context', async () => {
    const audioEngine = AudioEngine.getInstance();
    await audioEngine.initialize();
    audioEngine.getContext().resume();
    expect(audioEngine.getContext().resume).toHaveBeenCalled();
  });

  it('should suspend audio context', async () => {
    const audioEngine = AudioEngine.getInstance();
    await audioEngine.initialize();
    audioEngine.getContext().suspend();
    expect(audioEngine.getContext().suspend).toHaveBeenCalled();
  });

  it('should close audio context', async () => {
    const audioEngine = AudioEngine.getInstance();
    await audioEngine.initialize();
    audioEngine.getContext().close();
    expect(audioEngine.getContext().close).toHaveBeenCalled();
  });
});
