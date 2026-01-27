// Mock realista da Web Audio API para testes
import { vi } from 'vitest';

function createMockAudioParam(defaultValue = 0) {
  let value = defaultValue;
  return {
    value,
    defaultValue,
    setValueAtTime: vi.fn((v) => { value = v; }),
    linearRampToValueAtTime: vi.fn((v) => { value = v; }),
    exponentialRampToValueAtTime: vi.fn((v) => { value = v; }),
    setTargetAtTime: vi.fn(),
    setValueCurveAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
    cancelAndHoldAtTime: vi.fn(),
  };
}

export function createMockGainNode() {
  return {
    gain: createMockAudioParam(1.0),
    connect: vi.fn(),
    disconnect: vi.fn(),
    __nodeType: 'GainNode',
  };
}

export function createMockBufferSourceNode() {
  return {
    buffer: null,
    detune: createMockAudioParam(0),
    playbackRate: createMockAudioParam(1),
    loop: false,
    start: vi.fn(),
    stop: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    __nodeType: 'AudioBufferSourceNode',
  };
}

export function createMockOscillatorNode() {
  return {
    type: 'sine',
    frequency: createMockAudioParam(440),
    detune: createMockAudioParam(0),
    start: vi.fn(),
    stop: vi.fn(),
    setPeriodicWave: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    __nodeType: 'OscillatorNode',
  };
}

export function createMockAnalyserNode() {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    getFloatFrequencyData: vi.fn(),
    getByteTimeDomainData: vi.fn(),
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    __nodeType: 'AnalyserNode',
  };
}

export function createMockAudioBuffer(channels = 2, length = 44100, sampleRate = 44100) {
  return {
    sampleRate,
    length,
    duration: length / sampleRate,
    numberOfChannels: channels,
    getChannelData: vi.fn(() => new Float32Array(length)),
    copyFromChannel: vi.fn(),
    copyToChannel: vi.fn(),
  };
}

export function createMockDynamicsCompressorNode() {
  return {
    threshold: createMockAudioParam(-24),
    knee: createMockAudioParam(30),
    ratio: createMockAudioParam(12),
    attack: createMockAudioParam(0.003),
    release: createMockAudioParam(0.25),
    connect: vi.fn(),
    disconnect: vi.fn(),
    context: {},
    channelCount: 2,
    channelCountMode: 'max',
    channelInterpretation: 'speakers',
    numberOfInputs: 1,
    numberOfOutputs: 1,
    __nodeType: 'DynamicsCompressorNode',
  };
}


export function mockAudioContextFactory() {
  let state = 'suspended';
  const ctx: any = {
    get state() { return state; },
    sampleRate: 44100,
    baseLatency: 0.01,
    outputLatency: 0.01,
    currentTime: 0,
    destination: {},
    listener: {},
    suspend: vi.fn().mockImplementation(() => {
      state = 'suspended';
      if (typeof ctx.onstatechange === 'function') ctx.onstatechange();
      return Promise.resolve();
    }),
    resume: vi.fn().mockImplementation(() => {
      state = 'running';
      if (typeof ctx.onstatechange === 'function') ctx.onstatechange();
      return Promise.resolve();
    }),
    close: vi.fn().mockResolvedValue(undefined),
    createBuffer: vi.fn((channels, length, sampleRate) => createMockAudioBuffer(channels, length, sampleRate)),
    createBufferSource: vi.fn(() => createMockBufferSourceNode()),
    createOscillator: vi.fn(() => createMockOscillatorNode()),
    createGain: vi.fn(() => createMockGainNode()),
    createAnalyser: vi.fn(() => createMockAnalyserNode()),
    createDynamicsCompressor: vi.fn(() => createMockDynamicsCompressorNode()),
    onstatechange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  return ctx;
}
