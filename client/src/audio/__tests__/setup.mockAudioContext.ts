import { vi } from 'vitest';

const mockAudioContext = {
  state: 'running',
  destination: {},
  resume: vi.fn().mockResolvedValue(undefined),
  close: vi.fn(),

  createGain: vi.fn(() => ({
    gain: { value: 1 },
    connect: vi.fn(),
  })),

  createBufferSource: vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
  })),

  createOscillator: vi.fn(() => ({
    frequency: { value: 440 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),

  createAnalyser: vi.fn(() => ({
    connect: vi.fn(),
  })),

  createBuffer: vi.fn(() => ({})),
};

// ⚠️ ANTES DE QUALQUER IMPORT
vi.stubGlobal('AudioContext', vi.fn(() => mockAudioContext));
