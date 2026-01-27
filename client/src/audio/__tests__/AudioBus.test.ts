/**
 * Testes unitários para AudioBus
 * Foca em validações de estado e contratos de execução
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import AudioBus from '../AudioBus';
import AudioEngine from '../AudioEngine';
import AudioMixer from '../AudioMixer';
import {
  createMockAudioContext,
  createMockAudioBuffer,
  createMockGainNode,
  createMockBufferSourceNode,
  createMockOscillatorNode,
} from './mocks/audioContext.mock';

// Mock AudioEngine
const mockContext = createMockAudioContext();
const mockMasterGain = createMockGainNode();

vi.mock('../AudioEngine', () => {
  return {
    default: {
      getInstance: vi.fn(() => ({
        getContext: vi.fn(() => mockContext),
        getMasterGain: vi.fn(() => mockMasterGain),
        isReady: vi.fn(() => true),
        initialize: vi.fn().mockResolvedValue(undefined),
        ensureResumed: vi.fn().mockResolvedValue(undefined),
      })),
    },
  };
});

// Mock AudioMixer
const mockChordsChannel = createMockGainNode();
const mockScalesChannel = createMockGainNode();
const mockMetronomeChannel = createMockGainNode();

vi.mock('../AudioMixer', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      initialize: vi.fn().mockResolvedValue(undefined),
      getChannel: vi.fn((name: string) => {
        if (name === 'chords') return mockChordsChannel;
        if (name === 'scales') return mockScalesChannel;
        if (name === 'metronome') return mockMetronomeChannel;
        return null;
      }),
      createChannel: vi.fn((name: string) => {
        const channel = createMockGainNode();
        if (name === 'chords') return mockChordsChannel;
        if (name === 'scales') return mockScalesChannel;
        if (name === 'metronome') return mockMetronomeChannel;
        return channel;
      }),
      setChannelVolume: vi.fn(),
      getChannelVolume: vi.fn(() => 0.8),
      setMasterVolume: vi.fn(),
      getMasterVolume: vi.fn(() => 0.8),
      mute: vi.fn(),
      unmute: vi.fn(),
      toggleMute: vi.fn(),
      getIsMuted: vi.fn(() => false),
    })),
  };
});

describe('AudioBus', () => {
  let audioBus: AudioBus;
  let mockAudioEngine: any;
  let mockAudioMixer: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Obter instâncias mockadas (já criadas no vi.mock)
    mockAudioEngine = AudioEngine.getInstance();
    mockAudioMixer = new AudioMixer();
    
    audioBus = new AudioBus();
  });

  describe('playBuffer', () => {
    it('deve retornar false se AudioEngine não estiver pronto', async () => {
      // Mock isReady para retornar false
      const getInstanceSpy = vi.spyOn(AudioEngine, 'getInstance');
      const mockEngineNotReady = {
        getContext: vi.fn(() => mockContext),
        getMasterGain: vi.fn(() => mockMasterGain),
        isReady: vi.fn(() => false), // Não está pronto
        initialize: vi.fn().mockResolvedValue(undefined),
        ensureResumed: vi.fn().mockResolvedValue(undefined),
      };
      getInstanceSpy.mockReturnValue(mockEngineNotReady as any);
      
      const audioBusNotReady = new AudioBus();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const buffer = createMockAudioBuffer();
      const result = await audioBusNotReady.playBuffer({
        buffer,
        channel: 'chords',
      });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[AudioBus] playBuffer falhou: AudioEngine não está pronto'
      );
      
      consoleSpy.mockRestore();
      getInstanceSpy.mockRestore();
    });

    it('deve retornar false se buffer for null', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await audioBus.playBuffer({
        buffer: null as any,
        channel: 'chords',
      });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[AudioBus] playBuffer falhou: buffer é null ou undefined'
      );
      
      consoleSpy.mockRestore();
    });

    it('deve retornar false se canal não existir no AudioMixer', async () => {
      vi.spyOn(mockAudioMixer, 'getChannel').mockReturnValue(null);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const buffer = createMockAudioBuffer();
      const result = await audioBus.playBuffer({
        buffer,
        channel: 'inexistente',
      });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        "[AudioBus] playBuffer falhou: canal 'inexistente' não existe no AudioMixer"
      );
      
      consoleSpy.mockRestore();
    });

    it('deve retornar true quando todas as condições são válidas', async () => {
      const buffer = createMockAudioBuffer();
      const mockSource = createMockBufferSourceNode();
      const mockVolumeGain = createMockGainNode();
      
      // Mockar métodos do contexto
      const createSourceSpy = vi.spyOn(mockContext, 'createBufferSource').mockReturnValue(mockSource);
      const createGainSpy = vi.spyOn(mockContext, 'createGain').mockReturnValue(mockVolumeGain);

      const result = await audioBus.playBuffer({
        buffer,
        channel: 'chords',
        volume: 0.8,
      });

      expect(result).toBe(true);
      expect(createSourceSpy).toHaveBeenCalled();
      expect(mockSource.buffer).toBe(buffer);
      expect(mockSource.start).toHaveBeenCalled();
    });

    it('deve criar AudioBufferSourceNode e chamar start() apenas dentro do AudioBus', async () => {
      const buffer = createMockAudioBuffer();
      const mockSource = createMockBufferSourceNode();
      const mockVolumeGain = createMockGainNode();
      
      const createSourceSpy = vi.spyOn(mockContext, 'createBufferSource').mockReturnValue(mockSource);
      const createGainSpy = vi.spyOn(mockContext, 'createGain').mockReturnValue(mockVolumeGain);
      const startSpy = vi.spyOn(mockSource, 'start');

      await audioBus.playBuffer({
        buffer,
        channel: 'chords',
      });

      expect(createSourceSpy).toHaveBeenCalledTimes(1);
      expect(startSpy).toHaveBeenCalledTimes(1);
    });

    it('deve conectar source -> volumeGain -> channelGain (não diretamente ao masterGain)', async () => {
      const buffer = createMockAudioBuffer();
      const mockSource = createMockBufferSourceNode();
      const mockVolumeGain = createMockGainNode();
      const mockChannelGain = mockChordsChannel; // Usar o canal mockado

      const createSourceSpy = vi.spyOn(mockContext, 'createBufferSource').mockReturnValue(mockSource);
      const createGainSpy = vi.spyOn(mockContext, 'createGain').mockReturnValue(mockVolumeGain);

      await audioBus.playBuffer({
        buffer,
        channel: 'chords',
      });

      // Verificar que source conecta no volumeGain
      expect(mockSource.connect).toHaveBeenCalledWith(mockVolumeGain);
      
      // Verificar que volumeGain conecta no channelGain (não no masterGain)
      expect(mockVolumeGain.connect).toHaveBeenCalledWith(mockChannelGain);
      
      // Verificar que NÃO conecta diretamente no masterGain
      const masterGain = mockAudioEngine.getMasterGain();
      expect(mockSource.connect).not.toHaveBeenCalledWith(masterGain);
      expect(mockVolumeGain.connect).not.toHaveBeenCalledWith(masterGain);
    });

    it('deve aplicar volume corretamente', async () => {
      const buffer = createMockAudioBuffer();
      const mockSource = createMockBufferSourceNode();
      const mockVolumeGain = createMockGainNode();

      vi.spyOn(mockContext, 'createBufferSource').mockReturnValue(mockSource);
      vi.spyOn(mockContext, 'createGain').mockReturnValue(mockVolumeGain);

      // Usar canal 'scales' para evitar normalização de acordes
      await audioBus.playBuffer({
        buffer,
        channel: 'scales',
        volume: 0.5,
      });

      // O volume é setado no gain.value diretamente
      expect(mockVolumeGain.gain.value).toBe(0.5);
    });

    it('deve clamp volume entre 0 e 1', async () => {
      const buffer = createMockAudioBuffer();
      const mockSource1 = createMockBufferSourceNode();
      const mockSource2 = createMockBufferSourceNode();
      const mockVolumeGain1 = createMockGainNode();
      const mockVolumeGain2 = createMockGainNode();

      vi.spyOn(mockContext, 'createBufferSource')
        .mockReturnValueOnce(mockSource1)
        .mockReturnValueOnce(mockSource2);
      vi.spyOn(mockContext, 'createGain')
        .mockReturnValueOnce(mockVolumeGain1)
        .mockReturnValueOnce(mockVolumeGain2);

      // Usar canal 'scales' para evitar normalização de acordes
      // Testar volume > 1
      await audioBus.playBuffer({
        buffer,
        channel: 'scales',
        volume: 1.5,
      });
      expect(mockVolumeGain1.gain.value).toBe(1.0);

      // Testar volume < 0
      await audioBus.playBuffer({
        buffer,
        channel: 'scales',
        volume: -0.5,
      });
      expect(mockVolumeGain2.gain.value).toBe(0.0);
    });
  });

  describe('playOscillator', () => {
    it('deve retornar false se AudioEngine não estiver pronto', async () => {
      const getInstanceSpy = vi.spyOn(AudioEngine, 'getInstance');
      const mockEngineNotReady = {
        getContext: vi.fn(() => mockContext),
        getMasterGain: vi.fn(() => mockMasterGain),
        isReady: vi.fn(() => false),
        initialize: vi.fn().mockResolvedValue(undefined),
        ensureResumed: vi.fn().mockResolvedValue(undefined),
      };
      getInstanceSpy.mockReturnValue(mockEngineNotReady as any);
      
      const audioBusNotReady = new AudioBus();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await audioBusNotReady.playOscillator({
        frequency: 440,
        duration: 1.0,
        channel: 'chords',
      });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[AudioBus] playOscillator falhou: AudioEngine não está pronto'
      );
      
      consoleSpy.mockRestore();
      getInstanceSpy.mockRestore();
    });

    it('deve retornar false se frequência for inválida', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Frequência <= 0
      expect(await audioBus.playOscillator({
        frequency: 0,
        duration: 1.0,
        channel: 'chords',
      })).toBe(false);

      // Frequência negativa
      expect(await audioBus.playOscillator({
        frequency: -100,
        duration: 1.0,
        channel: 'chords',
      })).toBe(false);

      // Frequência infinita
      expect(await audioBus.playOscillator({
        frequency: Infinity,
        duration: 1.0,
        channel: 'chords',
      })).toBe(false);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('deve retornar false se duração for inválida', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Duração <= 0
      expect(await audioBus.playOscillator({
        frequency: 440,
        duration: 0,
        channel: 'chords',
      })).toBe(false);

      // Duração negativa
      expect(await audioBus.playOscillator({
        frequency: 440,
        duration: -1,
        channel: 'chords',
      })).toBe(false);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('deve retornar false se canal não existir', async () => {
      vi.spyOn(mockAudioMixer, 'getChannel').mockReturnValue(null);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await audioBus.playOscillator({
        frequency: 440,
        duration: 1.0,
        channel: 'inexistente',
      });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        "[AudioBus] playOscillator falhou: canal 'inexistente' não existe no AudioMixer"
      );
      
      consoleSpy.mockRestore();
    });

    it('deve retornar true quando todas as condições são válidas', async () => {
      const mockOsc = createMockOscillatorNode();
      const mockEnvelopeGain = createMockGainNode();
      const mockVolumeGain = createMockGainNode();

      const createOscSpy = vi.spyOn(mockContext, 'createOscillator').mockReturnValue(mockOsc);
      const createGainSpy = vi.spyOn(mockContext, 'createGain')
        .mockReturnValueOnce(mockEnvelopeGain)
        .mockReturnValueOnce(mockVolumeGain);

      const result = await audioBus.playOscillator({
        frequency: 440,
        type: 'triangle',
        duration: 1.0,
        channel: 'chords',
        volume: 0.8,
      });

      expect(result).toBe(true);
      expect(createOscSpy).toHaveBeenCalled();
      expect(mockOsc.frequency.value).toBe(440);
      expect(mockOsc.type).toBe('triangle');
      expect(mockOsc.start).toHaveBeenCalled();
      expect(mockOsc.stop).toHaveBeenCalled();
    });

    it('deve criar OscillatorNode e chamar start() apenas dentro do AudioBus', async () => {
      const mockOsc = createMockOscillatorNode();
      const mockEnvelopeGain = createMockGainNode();
      const mockVolumeGain = createMockGainNode();
      
      const createOscSpy = vi.spyOn(mockContext, 'createOscillator').mockReturnValue(mockOsc);
      const createGainSpy = vi.spyOn(mockContext, 'createGain')
        .mockReturnValueOnce(mockEnvelopeGain)
        .mockReturnValueOnce(mockVolumeGain);
      const startSpy = vi.spyOn(mockOsc, 'start');

      await audioBus.playOscillator({
        frequency: 440,
        duration: 1.0,
        channel: 'chords',
      });

      expect(createOscSpy).toHaveBeenCalledTimes(1);
      expect(startSpy).toHaveBeenCalledTimes(1);
    });

    it('deve conectar osc -> envelopeGain -> volumeGain -> channelGain', async () => {
      // Grafo de conexões
      const connections: Array<{ from: any, to: any }> = [];

      // Intercepta todas as conexões
      function interceptConnect(node: any) {
        const originalConnect = node.connect;
        node.connect = function (dest: any) {
          connections.push({ from: node, to: dest });
          return originalConnect.call(this, dest);
        };
      }

      // Mock AudioContext para interceptar todos os nodes
      vi.spyOn(mockContext, 'createOscillator').mockImplementation(() => {
        const osc = createMockOscillatorNode();
        // Não atribuir __nodeType em nodes reais
        interceptConnect(osc);
        return osc;
      });
      vi.spyOn(mockContext, 'createGain').mockImplementation(() => {
        const gain = createMockGainNode();
        // Não atribuir __nodeType em nodes reais
        interceptConnect(gain);
        return gain;
      });

      // Intercepta channelGain
      interceptConnect(mockChordsChannel);

      await audioBus.playOscillator({
        frequency: 440,
        duration: 1.0,
        channel: 'chords',
      });

      // Funções utilitárias para identificar nós
      function isOscillator(node: any) {
        return node.__nodeType === 'OscillatorNode' || node.frequency;
      }
      function isGain(node: any) {
        return node.__nodeType === 'GainNode' || node.gain;
      }
      function isChannel(node: any) {
        return node === mockChordsChannel;
      }

      // Encontra cadeia: osc -> gain -> gain -> channel
      const oscNode = connections.find(c => isOscillator(c.from));
      expect(oscNode).toBeDefined();
      const firstGain = oscNode ? oscNode.to : null;
      expect(isGain(firstGain)).toBe(true);

      // O primeiro GainNode conecta a outro GainNode
      const gainChain = connections.find(c => c.from === firstGain);
      expect(gainChain).toBeDefined();
      const secondGain = gainChain ? gainChain.to : null;
      expect(isGain(secondGain)).toBe(true);

      // O segundo GainNode conecta ao channelGain
      const channelConn = connections.find(c => c.from === secondGain);
      expect(channelConn).toBeDefined();
      expect(channelConn).toBeDefined();
      if (!channelConn) throw new Error('channelConn não definido');
      expect(isChannel(channelConn.to)).toBe(true);

      // Assertivas de ouro
      // Oscillator NÃO conecta direto ao channelGain
      expect(channelConn).toBeDefined();
      expect(oscNode).toBeDefined();
      if (!channelConn || !oscNode) throw new Error('channelConn ou oscNode não definido');
      expect(channelConn.from).not.toBe(oscNode.from);
      // Existe pelo menos DOIS GainNodes entre osc e channel
      expect(isGain(firstGain)).toBe(true);
      expect(isGain(secondGain)).toBe(true);
      // channelGain é sempre o último
      expect(channelConn).toBeDefined();
      if (!channelConn) throw new Error('channelConn não definido');
      expect(isChannel(channelConn.to)).toBe(true);
      // Nenhuma conexão direta ao master
      // (não há masterGain no mock, mas pode ser validado se existir)
      // Falha explícita se cadeia incompleta
      if (!oscNode || !firstGain || !secondGain || !channelConn) {
        throw new Error('Grafo de áudio inválido: cadeia incompleta');
      }
    });
  });

  describe('playSample', () => {
    it('deve retornar false se sample for inválido', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(await audioBus.playSample({
        sample: null as any,
        channel: 'chords',
      })).toBe(false);

      expect(await audioBus.playSample({
        sample: { buffer: null } as any,
        channel: 'chords',
      })).toBe(false);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('deve chamar playBuffer com os parâmetros corretos', async () => {
      const buffer = createMockAudioBuffer();
      const sample = { buffer, duration: 1.0, loaded: true };
      const playBufferSpy = vi.spyOn(audioBus as any, 'playBuffer').mockResolvedValue(true);

      await audioBus.playSample({
        sample,
        channel: 'chords',
        volume: 0.7,
        when: 1.0,
      });

      expect(playBufferSpy).toHaveBeenCalledWith({
        buffer,
        channel: 'chords',
        volume: 0.7,
        when: 1.0,
        offset: 0,
        duration: undefined,
      });
    });
  });
});
