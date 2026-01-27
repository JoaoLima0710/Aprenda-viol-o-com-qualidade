/**
 * Mocks para Web Audio API
 * Usado em testes para evitar dependência de navegador real
 */

import { vi } from 'vitest';

/**
 * Mock de AudioParam
 */
export function createMockAudioParam(value: number = 0): AudioParam {
  return {
    value,
    defaultValue: value,
    minValue: 0,
    maxValue: 1,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    setValueCurveAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
    cancelAndHoldAtTime: vi.fn(),
  } as unknown as AudioParam;
}

/**
 * Mock de GainNode
 */
export function createMockGainNode(id?: string): GainNode {
  const gain = createMockAudioParam(1.0);
  const node: any = {
    gain,
    connect: vi.fn(),
    disconnect: vi.fn(),
    __nodeType: 'GainNode',
    __id: id || Math.random().toString(36).slice(2),
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCount: 2,
    channelCountMode: 'max',
    channelInterpretation: 'speakers',
    context: null,
  };
  return node as GainNode;
}

/**
 * Mock de AudioBufferSourceNode
 */
export function createMockBufferSourceNode(): AudioBufferSourceNode {
  return {
    buffer: null,
    detune: createMockAudioParam(0),
    playbackRate: createMockAudioParam(1),
    loop: false,
    loopStart: 0,
    loopEnd: 0,
    start: vi.fn(),
    stop: vi.fn(),
    onended: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    numberOfInputs: 0,
    numberOfOutputs: 1,
    channelCount: 2,
    channelCountMode: 'max' as ChannelCountMode,
    channelInterpretation: 'speakers' as ChannelInterpretation,
    context: null as any,
  } as unknown as AudioBufferSourceNode;
}

/**
 * Mock de OscillatorNode
 */
export function createMockOscillatorNode(): OscillatorNode {
  return {
    type: 'sine' as OscillatorType,
    frequency: createMockAudioParam(440),
    detune: createMockAudioParam(0),
    start: vi.fn(),
    stop: vi.fn(),
    setPeriodicWave: vi.fn(),
    onended: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    numberOfInputs: 0,
    numberOfOutputs: 1,
    channelCount: 2,
    channelCountMode: 'max' as ChannelCountMode,
    channelInterpretation: 'speakers' as ChannelInterpretation,
    context: null as any,
  } as unknown as OscillatorNode;
}

/**
 * Mock de AudioBuffer
 */
export function createMockAudioBuffer(
  numberOfChannels: number = 2,
  length: number = 44100,
  sampleRate: number = 44100
): AudioBuffer {
  const channelData: Float32Array[] = [];
  for (let i = 0; i < numberOfChannels; i++) {
    channelData.push(new Float32Array(length));
  }

  return {
    sampleRate,
    length,
    duration: length / sampleRate,
    numberOfChannels,
    getChannelData: vi.fn((channel: number) => channelData[channel] || new Float32Array(length)),
    copyFromChannel: vi.fn(),
    copyToChannel: vi.fn(),
  } as unknown as AudioBuffer;
}

/**
 * Mock de AudioContext
 */
export function createMockAudioContext(): AudioContext {
  const currentTime = 0;
  let timeCounter = 0;

  const mockContext = {
    state: 'running' as AudioContextState,
    sampleRate: 44100,
    baseLatency: 0.01,
    outputLatency: 0.01,
    currentTime,
    destination: {} as AudioDestinationNode,
    listener: {} as AudioListener,
    suspend: vi.fn().mockResolvedValue(undefined),
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    createBuffer: vi.fn((numberOfChannels: number, length: number, sampleRate: number) => {
      return createMockAudioBuffer(numberOfChannels, length, sampleRate);
    }),
    createBufferSource: vi.fn(() => {
      return createMockBufferSourceNode();
    }),
    createOscillator: vi.fn(() => {
      return createMockOscillatorNode();
    }),
    createGain: vi.fn(() => {
      return createMockGainNode();
    }),
    createBiquadFilter: vi.fn(),
    createDynamicsCompressor: vi.fn(),
    createAnalyser: vi.fn(),
    createDelay: vi.fn(),
    createScriptProcessor: vi.fn(),
    createStereoPanner: vi.fn(),
    createPanner: vi.fn(),
    createConvolver: vi.fn(),
    createChannelSplitter: vi.fn(),
    createChannelMerger: vi.fn(),
    createMediaStreamSource: vi.fn(),
    createMediaStreamDestination: vi.fn(),
    createMediaElementSource: vi.fn(),
    decodeAudioData: vi.fn().mockResolvedValue(createMockAudioBuffer()),
    onstatechange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    // Propriedade esperada pelo AudioEngine: deve ser um GainNode
    threshold: createMockGainNode('threshold'),
  } as unknown as AudioContext;

  // Simular incremento de currentTime
  Object.defineProperty(mockContext, 'currentTime', {
    get: () => {
      timeCounter += 0.1;
      return timeCounter;
    },
  });

  return mockContext;
}

/**
 * Rastreia chamadas proibidas para testes de regressão arquitetural
 */
export class AudioArchitectureGuard {
  private static forbiddenCalls: Array<{
    method: string;
    location: string;
    stack?: string;
  }> = [];

  static recordForbiddenCall(method: string, location: string, stack?: string): void {
    this.forbiddenCalls.push({ method, location, stack });
  }

  static getForbiddenCalls(): Array<{ method: string; location: string; stack?: string }> {
    return [...this.forbiddenCalls];
  }

  static clear(): void {
    this.forbiddenCalls = [];
  }

  static hasForbiddenCalls(): boolean {
    return this.forbiddenCalls.length > 0;
  }
}
