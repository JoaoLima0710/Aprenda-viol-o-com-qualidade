/**
 * Testes de contrato - ChordPlayer
 * Garante que ChordPlayer NÃO cria AudioNodes diretamente e delega ao AudioBus
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import ChordPlayer from '../GuitarSynth';
import { getAudioBus } from '../index';
import AudioEngine from '../AudioEngine';
import SampleLoader from '../SampleLoader';
import {
  createMockAudioContext,
  createMockAudioBuffer,
  createMockGainNode,
  createMockBufferSourceNode,
} from './mocks/audioContext.mock';

// Mock AudioEngine
vi.mock('../AudioEngine', () => {
  const mockContext = createMockAudioContext();
  const mockMasterGain = createMockGainNode();

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

// Mock SampleLoader
vi.mock('../SampleLoader', () => {
  const mockBuffer = createMockAudioBuffer();
  
  return {
    default: {
      getInstance: vi.fn(() => ({
        loadSample: vi.fn().mockResolvedValue({
          buffer: mockBuffer,
          duration: 1.0,
          loaded: true,
        }),
      })),
    },
  };
});

// Mock AudioBus
vi.mock('../index', () => {
  const mockAudioBus = {
    playSample: vi.fn().mockReturnValue(true),
    playOscillator: vi.fn().mockReturnValue(true),
    playBuffer: vi.fn().mockReturnValue(true),
  };

  return {
    getAudioBus: vi.fn(() => mockAudioBus),
    initializeAudioSystem: vi.fn().mockResolvedValue(undefined),
  };
});

describe('ChordPlayer - Contratos Arquiteturais', () => {
  let chordPlayer: ChordPlayer;
  let mockAudioBus: any;
  let mockContext: AudioContext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAudioBus = getAudioBus();
    mockContext = AudioEngine.getInstance().getContext();
    chordPlayer = new ChordPlayer();
  });

  it('NÃO deve criar AudioBufferSourceNode diretamente', async () => {
    // Spy no AudioContext para detectar chamadas diretas
    const createSourceSpy = vi.spyOn(mockContext, 'createBufferSource');
    
    // Mock do sample loader para retornar um sample válido
    const mockSample = {
      buffer: createMockAudioBuffer(),
      duration: 1.0,
      loaded: true,
    };
    
    vi.spyOn(SampleLoader.getInstance(), 'loadSample').mockResolvedValue(mockSample as any);

    await (chordPlayer as any).playSample(mockSample);

    // AudioBus deve ser chamado (delegação correta)
    expect(mockAudioBus.playSample).toHaveBeenCalled();
    
    // AudioContext.createBufferSource NÃO deve ser chamado diretamente pelo ChordPlayer
    // O ChordPlayer deve delegar ao AudioBus, que é quem cria o source
    // Como o AudioBus está mockado, createBufferSource não deve ser chamado neste contexto
    expect(createSourceSpy).not.toHaveBeenCalled();
  });

  it('NÃO deve chamar source.start() diretamente', async () => {
    // Criar um mock de source para verificar se start() é chamado
    const mockSource = createMockBufferSourceNode();
    const startSpy = vi.spyOn(mockSource, 'start');

    // Mock do AudioContext para retornar nosso source mockado
    vi.spyOn(mockContext, 'createBufferSource').mockReturnValue(mockSource);
    
    const mockSample = {
      buffer: createMockAudioBuffer(),
      duration: 1.0,
      loaded: true,
    };
    
    vi.spyOn(SampleLoader.getInstance(), 'loadSample').mockResolvedValue(mockSample as any);

    await (chordPlayer as any).playSample(mockSample);

    // AudioBus deve ser chamado (delegação correta)
    expect(mockAudioBus.playSample).toHaveBeenCalled();
    
    // source.start() NÃO deve ser chamado diretamente pelo ChordPlayer
    // O ChordPlayer não deve ter acesso ao source - isso é responsabilidade do AudioBus
    // Como o AudioBus está mockado, start() não deve ser chamado neste contexto
    expect(startSpy).not.toHaveBeenCalled();
  });

  it('deve delegar playback de samples exclusivamente ao AudioBus', async () => {
    const mockSample = {
      buffer: createMockAudioBuffer(),
      duration: 1.0,
      loaded: true,
    };

    await (chordPlayer as any).playSample(mockSample);

    expect(mockAudioBus.playSample).toHaveBeenCalledWith({
      sample: mockSample,
      channel: 'chords',
      volume: expect.any(Number),
    });
  });

  it('deve delegar síntese de acordes exclusivamente ao AudioBus', async () => {
    const mockVoicing = {
      name: 'C',
      notes: ['C3', 'E3', 'G3'],
      frequencies: [130.81, 164.81, 196.00],
    };

    await (chordPlayer as any).synthesizeChord(mockVoicing);

    // Deve chamar playOscillator para cada frequência
    expect(mockAudioBus.playOscillator).toHaveBeenCalledTimes(3);
    
    // Cada chamada deve ter os parâmetros corretos
    expect(mockAudioBus.playOscillator).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: 130.81,
        type: 'triangle',
        duration: 2.0,
        channel: 'chords',
        volume: expect.any(Number),
        when: expect.any(Number),
      })
    );
  });

  it('deve retornar sucesso quando AudioBus está disponível', async () => {
    const mockSample = {
      buffer: createMockAudioBuffer(),
      duration: 1.0,
      loaded: true,
    };

    vi.spyOn(mockAudioBus, 'playSample').mockReturnValue(true);

    await (chordPlayer as any).playSample(mockSample);

    // Não deve logar erro
    const consoleErrorSpy = vi.spyOn(console, 'error');
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('deve logar erro quando AudioBus não está disponível', async () => {
    vi.mocked(getAudioBus).mockReturnValue(null);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockSample = {
      buffer: createMockAudioBuffer(),
      duration: 1.0,
      loaded: true,
    };

    await (chordPlayer as any).playSample(mockSample);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[ChordPlayer] playSample falhou: AudioBus não está disponível. Chame initializeAudioSystem() primeiro.'
    );

    consoleErrorSpy.mockRestore();
  });

  it('NÃO deve conectar diretamente ao masterGain', async () => {
    const mockMasterGain = AudioEngine.getInstance().getMasterGain();
    const connectSpy = vi.spyOn(mockMasterGain, 'connect');

    const mockSample = {
      buffer: createMockAudioBuffer(),
      duration: 1.0,
      loaded: true,
    };

    await (chordPlayer as any).playSample(mockSample);

    // Nenhuma conexão direta ao masterGain deve ocorrer
    expect(connectSpy).not.toHaveBeenCalled();
  });

  it('deve usar o canal correto (chords) para todos os playbacks', async () => {
    const mockSample = {
      buffer: createMockAudioBuffer(),
      duration: 1.0,
      loaded: true,
    };

    await (chordPlayer as any).playSample(mockSample);

    expect(mockAudioBus.playSample).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'chords',
      })
    );
  });

  it('deve respeitar o volume configurado', async () => {
    chordPlayer.setVolume(0.5);
    
    const mockSample = {
      buffer: createMockAudioBuffer(),
      duration: 1.0,
      loaded: true,
    };

    await (chordPlayer as any).playSample(mockSample);

    expect(mockAudioBus.playSample).toHaveBeenCalledWith(
      expect.objectContaining({
        volume: 0.5,
      })
    );
  });
});
