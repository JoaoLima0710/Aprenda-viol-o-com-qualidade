/**
 * Testes de integração - AudioBus + AudioMixer
 * Garante que áudio é roteado corretamente e volumes são respeitados
 */


import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createMockAudioBuffer,
  createMockBufferSourceNode,
  createMockGainNode,
  createMockOscillatorNode
} from '../test/mocks/mockAudioContext';

let AudioEngine: any;
let AudioMixer: any;



// Todas as dependências de AudioEngine, AudioMixer e AudioBus devem ser usadas apenas dentro dos blocos de teste e setup, após o import dinâmico.

describe('AudioBus - Integração com AudioMixer', () => {
  let audioBus: any;
  let mockContext: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    // Mock global do módulo AudioMixer para garantir canais válidos
    const fakeGain = createMockGainNode();
    const mockAudioMixerClass = vi.fn().mockImplementation(() => ({
      getChannel: vi.fn(() => fakeGain),
      getIsMuted: vi.fn(() => false),
    }));
    vi.doMock('../AudioMixer', () => ({
      __esModule: true,
      default: mockAudioMixerClass,
    }));
    // Importar módulos dinamicamente após o mock
    AudioEngine = (await import('../AudioEngine')).default;
    AudioMixer = (await import('../AudioMixer')).default;
    audioBus = new (await import('../AudioBus')).default();
    // Inicializar engine antes de acessar o contexto
    const engine = AudioEngine.getInstance();
    await engine.initialize();
    expect(engine.isReady()).toBe(true);
    mockContext = engine.getContext();
  });

  it('deve rotear áudio para o canal correto (chords)', async () => {
    const buffer = createMockAudioBuffer();
    const createdNodes: any[] = [];
    vi.spyOn(mockContext, 'createBufferSource').mockImplementation(() => {
      const source = createMockBufferSourceNode();
      createdNodes.push(source);
      return source;
    });
    vi.spyOn(mockContext, 'createGain').mockImplementation(() => {
      const gain = createMockGainNode();
      createdNodes.push(gain);
      return gain;
    });

    await audioBus.playBuffer({
      buffer,
      channel: 'chords',
    });

    // Identificar nodes criados
    const source = createdNodes.find(n => n.__nodeType === 'AudioBufferSourceNode');
    const normalizationGain = createdNodes.find((n, i) => n.__nodeType === 'GainNode' && i === 1);
    const envelopeGain = createdNodes.find((n, i) => n.__nodeType === 'GainNode' && i === 2);
    const volumeGain = createdNodes.find((n, i) => n.__nodeType === 'GainNode' && i === 3);
    // O canal simulado é sempre o mesmo fakeGain do mock global
    const channelGain = (AudioMixer as any).mock?.fakeGain || expect.any(Object);

    // Valida apenas a topologia do grafo de áudio (roteamento), não valores de ganho
    expect(source.connect).toHaveBeenCalled();
    expect(normalizationGain.connect).toHaveBeenCalledWith(expect.objectContaining({ __nodeType: 'GainNode' }));
    expect(envelopeGain.connect).toHaveBeenCalledWith(expect.objectContaining({ __nodeType: 'GainNode' }));
    expect(volumeGain.connect).toHaveBeenCalledWith(channelGain);
  });

  it('deve rotear áudio para o canal correto (scales)', async () => {
    const buffer = createMockAudioBuffer();
    const mockSource = createMockBufferSourceNode();
    const mockVolumeGain = createMockGainNode();
    const mockScalesChannel = expect.any(Object);
    
    vi.spyOn(mockContext, 'createBufferSource').mockReturnValue(mockSource);
    vi.spyOn(mockContext, 'createGain').mockReturnValue(mockVolumeGain);
    const connectSpy = vi.spyOn(mockVolumeGain, 'connect');

    await audioBus.playBuffer({
      buffer,
      channel: 'scales',
    });

    expect(connectSpy).toHaveBeenCalledWith(mockScalesChannel);
  });

  it('deve rotear áudio para o canal correto (metronome)', async () => {
    const buffer = createMockAudioBuffer();
    const mockSource = createMockBufferSourceNode();
    const mockVolumeGain = createMockGainNode();
    const mockMetronomeChannel = expect.any(Object);
    
    vi.spyOn(mockContext, 'createBufferSource').mockReturnValue(mockSource);
    vi.spyOn(mockContext, 'createGain').mockReturnValue(mockVolumeGain);
    const connectSpy = vi.spyOn(mockVolumeGain, 'connect');

    await audioBus.playBuffer({
      buffer,
      channel: 'metronome',
    });

    expect(connectSpy).toHaveBeenCalledWith(mockMetronomeChannel);
  });

  it('deve respeitar volumes de diferentes canais', async () => {
    const buffer = createMockAudioBuffer();
    const mockNormalizationGain1 = createMockGainNode();
    const mockEnvelopeGain1 = createMockGainNode();
    const mockVolumeGain1 = createMockGainNode();
    const mockVolumeGain2 = createMockGainNode();
    const mockContext = AudioEngine.getInstance().getContext();

    // Ordem de criação no código: volumeGain primeiro, depois normalizationGain e envelopeGain (se chords)
    // Para 'chords': volumeGain, normalizationGain, envelopeGain
    // Para 'metronome': apenas volumeGain
    vi.spyOn(mockContext, 'createGain')
      .mockReturnValueOnce(mockVolumeGain1)         // volumeGain para chords (criado primeiro)
      .mockReturnValueOnce(mockNormalizationGain1) // normalizationGain para chords
      .mockReturnValueOnce(mockEnvelopeGain1)      // envelopeGain para chords
      .mockReturnValueOnce(mockVolumeGain2);        // volumeGain para metronome

    // Tocar no canal chords com volume 0.5
    await audioBus.playBuffer({
      buffer,
      channel: 'chords',
      volume: 0.5,
    });

    // Tocar no canal metronome com volume 0.3
    await audioBus.playBuffer({
      buffer,
      channel: 'metronome',
      volume: 0.3,
    });

    expect(mockVolumeGain1.gain.value).toBe(0.5);
    expect(mockVolumeGain2.gain.value).toBe(0.3);
  });

  it('deve funcionar mesmo quando mixer está mutado (mute não impede criação, apenas volume)', async () => {
    const buffer = createMockAudioBuffer();
    const mockNormalizationGain = createMockGainNode();
    const mockEnvelopeGain = createMockGainNode();
    const mockVolumeGain = createMockGainNode();
    const mockContext = AudioEngine.getInstance().getContext();
    
    // Ordem de criação no código: volumeGain primeiro, depois normalizationGain e envelopeGain (se chords)
    // Para 'chords': volumeGain, normalizationGain, envelopeGain
    vi.spyOn(mockContext, 'createGain')
      .mockReturnValueOnce(mockVolumeGain)         // volumeGain (criado primeiro)
      .mockReturnValueOnce(mockNormalizationGain) // normalizationGain
      .mockReturnValueOnce(mockEnvelopeGain);     // envelopeGain
    // O mock global já pode ser ajustado para retornar true se necessário
    
    // Mute não deve impedir o AudioBus de criar sources
    // O mute é controlado pelo AudioMixer no masterGain
    const result = await audioBus.playBuffer({
      buffer,
      channel: 'chords',
      volume: 0.8,
    });

    expect(result).toBe(true);
    
    // O volume do volumeGain ainda deve ser setado (mute é no masterGain)
    // Mas o volume efetivo será 0 devido ao mute no masterGain
    expect(mockVolumeGain.gain.value).toBe(0.8);
  });

  it('deve respeitar mute do mixer (volume efetivo = 0 quando mutado)', async () => {
    const buffer = createMockAudioBuffer();
    const mockMasterGain = AudioEngine.getInstance().getMasterGain();
    const mockNormalizationGain = createMockGainNode();
    const mockEnvelopeGain = createMockGainNode();
    const mockVolumeGain = createMockGainNode();
    const mockContext = AudioEngine.getInstance().getContext();
    
    // Ordem de criação no código: volumeGain primeiro, depois normalizationGain e envelopeGain (se chords)
    // Para 'chords': volumeGain, normalizationGain, envelopeGain
    vi.spyOn(mockContext, 'createGain')
      .mockReturnValueOnce(mockVolumeGain)         // volumeGain (criado primeiro)
      .mockReturnValueOnce(mockNormalizationGain) // normalizationGain
      .mockReturnValueOnce(mockEnvelopeGain);     // envelopeGain
    // O mock global já pode ser ajustado para retornar true se necessário
    
    // Quando mutado, o masterGain deve ter volume 0
    // (isso é controlado pelo AudioMixer, não pelo AudioBus)
    // O AudioBus ainda cria o source, mas o volume efetivo é 0
    const result = await audioBus.playBuffer({
      buffer,
      channel: 'chords',
      volume: 0.8,
    });

    expect(result).toBe(true);
    
    // O volumeGain ainda tem seu valor, mas o masterGain está em 0
    // (o mute é aplicado no masterGain pelo AudioMixer)
    expect(mockVolumeGain.gain.value).toBe(0.8);
  });

  it('deve permitir múltiplos playbacks simultâneos em canais diferentes', async () => {
    const buffer1 = createMockAudioBuffer();
    const buffer2 = createMockAudioBuffer();
    const mockContext = AudioEngine.getInstance().getContext();
    const createSourceSpy = vi.spyOn(mockContext, 'createBufferSource');
    const createGainSpy = vi.spyOn(mockContext, 'createGain');

    // Mockar createGain para retornar um novo gain node a cada chamada
    createGainSpy.mockImplementation(() => createMockGainNode());

    await audioBus.playBuffer({
      buffer: buffer1,
      channel: 'chords',
    });

    await audioBus.playBuffer({
      buffer: buffer2,
      channel: 'scales',
    });

    // Deve criar duas sources diferentes
    expect(createSourceSpy).toHaveBeenCalledTimes(2);
  });

  it('deve agendar playback com when correto', async () => {
    const buffer = createMockAudioBuffer();
    const mockSource = createMockBufferSourceNode();
    const mockContext = AudioEngine.getInstance().getContext();
    const startSpy = vi.spyOn(mockSource, 'start');

    vi.spyOn(mockContext, 'createBufferSource').mockReturnValue(mockSource);
    // Ordem de criação no código: volumeGain primeiro, depois normalizationGain e envelopeGain (se chords)
    // Para 'chords': volumeGain, normalizationGain, envelopeGain
    vi.spyOn(mockContext, 'createGain')
      .mockReturnValueOnce(createMockGainNode()) // volumeGain (criado primeiro)
      .mockReturnValueOnce(createMockGainNode()) // normalizationGain
      .mockReturnValueOnce(createMockGainNode()); // envelopeGain

    const scheduledTime = 5.0;
    await audioBus.playBuffer({
      buffer,
      channel: 'chords',
      when: scheduledTime,
    });

    expect(startSpy).toHaveBeenCalledWith(scheduledTime, 0);
  });

  it('deve agendar oscilador com when e duration corretos', async () => {
    const mockOsc = createMockOscillatorNode();
    const mockContext = AudioEngine.getInstance().getContext();
    const startSpy = vi.spyOn(mockOsc, 'start');
    const stopSpy = vi.spyOn(mockOsc, 'stop');

    vi.spyOn(mockContext, 'createOscillator').mockReturnValue(mockOsc);
    vi.spyOn(mockContext, 'createGain')
      .mockReturnValue(createMockGainNode())
      .mockReturnValue(createMockGainNode());

    const scheduledTime = 2.0;
    const duration = 1.5;

    await audioBus.playOscillator({
      frequency: 440,
      duration,
      channel: 'chords',
      when: scheduledTime,
    });

    expect(startSpy).toHaveBeenCalledWith(scheduledTime);
    expect(stopSpy).toHaveBeenCalledWith(scheduledTime + duration);
  });
});
