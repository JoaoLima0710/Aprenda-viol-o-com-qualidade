import AudioEngine from './AudioEngine';
import AudioMixer from './AudioMixer';
import SampleLoader from './SampleLoader';
import { SampleData } from './types';
import { applyClearEnvelope } from '../services/AuditoryStimulusConfig';

/**
 * AudioBus - Única camada de autoridade de playback
 * 
 * REGRAS RÍGIDAS:
 * - Único lugar onde AudioBufferSourceNode e OscillatorNode são criados
 * - Todo roteamento obrigatoriamente passa pelo AudioMixer
 * - Valida se AudioEngine está pronto antes de tocar
 * - Retorna sucesso ou falha em toda tentativa de play
 * - Registra logs claros quando algo não puder tocar
 */
class AudioBus {
  private audioEngine: AudioEngine;
  private audioMixer: AudioMixer;
  private sampleLoader: SampleLoader;
  private activeSources: Set<AudioBufferSourceNode | OscillatorNode> = new Set();
  private lastPlayedSound: string | null = null;
  private lastPlayedBuffer: { buffer: AudioBuffer; soundId: string } | null = null;

  constructor() {
    this.audioEngine = AudioEngine.getInstance();
    this.audioMixer = new AudioMixer();
    this.sampleLoader = SampleLoader.getInstance();
  }

  /**
   * Verifica se há áudio tocando atualmente
   */
  public isPlaying(): boolean {
    return this.activeSources.size > 0;
  }

  /**
   * Retorna o último som tocado (para testes)
   */
  public lastPlayed(): string | null {
    return this.lastPlayedSound;
  }

  /**
   * Marca o último som tocado (usado por FeedbackSoundService)
   */
  public setLastPlayed(soundId: string): void {
    this.lastPlayedSound = soundId;
  }

  /**
   * Reproduz um AudioBuffer através de um canal do mixer
   * 
   * @param buffer - AudioBuffer a ser reproduzido
   * @param channel - Nome do canal (ex: 'chords', 'scales', 'metronome')
   * @param volume - Volume adicional (0.0 a 1.0), multiplicado pelo volume do canal
   * @param when - Tempo de início (em segundos, relativo ao currentTime)
   * @param offset - Offset no buffer (em segundos)
   * @param duration - Duração a tocar (em segundos, undefined = tocar tudo)
   * @returns true se o áudio foi agendado com sucesso, false caso contrário
   */
  public async playBuffer({
    buffer,
    channel,
    volume = 1.0,
    when,
    offset = 0,
    duration,
  }: {
    buffer: AudioBuffer;
    channel: string;
    volume?: number;
    when?: number;
    offset?: number;
    duration?: number;
  }): Promise<boolean> {
    // Validação 1: AudioEngine deve estar pronto
    if (!this.audioEngine.isReady()) {
      console.error('[AudioBus] playBuffer falhou: AudioEngine não está pronto');
      return false;
    }

    // Validação 2: Buffer deve existir
    if (!buffer) {
      console.error('[AudioBus] playBuffer falhou: buffer é null ou undefined');
      return false;
    }

    // Validação 3: Canal deve existir no mixer
    const channelGain = this.audioMixer.getChannel(channel);
    if (!channelGain) {
      console.error(`[AudioBus] playBuffer falhou: canal '${channel}' não existe no AudioMixer`);
      return false;
    }

    try {
      const audioContext = this.audioEngine.getContext();
      const currentTime = audioContext.currentTime;
      const startTime = when !== undefined ? when : currentTime;

      // Criar source (ÚNICO lugar onde isso acontece)
      const source = audioContext.createBufferSource();
      source.buffer = buffer;

      // Criar gain para volume adicional (não é o gain final - o canal já tem seu próprio gain)
      const volumeGain = audioContext.createGain();
      const clampedVolume = Math.max(0, Math.min(1, volume));
      volumeGain.gain.value = clampedVolume;

      // Normalização e envelope ADSR para acordes (se canal for 'chords')
      let normalizationGainNode: GainNode | null = null;
      let envelopeGain: GainNode | null = null;
      
      if (channel === 'chords') {
        // Analisar e normalizar volume do buffer usando RMS/LUFS
        // Isso garante que todos os acordes tenham loudness consistente
        const { chordNormalizer } = await import('../services/ChordNormalizer');
        const normalizationGain = chordNormalizer.analyzeAndNormalize(buffer);
        
        // Criar gain para normalização (aplicado antes do envelope)
        normalizationGainNode = audioContext.createGain();
        normalizationGainNode.gain.value = normalizationGain;
        
        // Criar envelope ADSR padrão para consistência
        envelopeGain = audioContext.createGain();
        const bufferDuration = duration ?? buffer.duration;
        const { applyADSREnvelope } = await import('../services/ChordNormalizer');
        applyADSREnvelope(envelopeGain, audioContext, startTime, bufferDuration);
      }

      // Conectar: source -> (normalizationGain?) -> (envelopeGain?) -> volumeGain -> channelGain
      if (normalizationGainNode && envelopeGain) {
        // Acorde: source -> normalization -> envelope -> volume -> channel
        source.connect(normalizationGainNode);
        normalizationGainNode.connect(envelopeGain);
        envelopeGain.connect(volumeGain);
      } else if (envelopeGain) {
        // Apenas envelope (não deveria acontecer, mas por segurança)
        source.connect(envelopeGain);
        envelopeGain.connect(volumeGain);
      } else {
        // Sem normalização/envelope: source -> volume -> channel
        source.connect(volumeGain);
      }
      volumeGain.connect(channelGain);

      // Rastrear source ativo
      this.activeSources.add(source);
      source.onended = () => {
        this.activeSources.delete(source);
      };

      // Agendar playback
      if (duration !== undefined) {
        source.start(startTime, offset, duration);
      } else {
        source.start(startTime, offset);
      }

      console.log(`[AudioBus] Buffer agendado no canal '${channel}' para ${startTime.toFixed(3)}s`);
      return true;
    } catch (error) {
      console.error('[AudioBus] playBuffer erro ao agendar:', error);
      return false;
    }
  }

  /**
   * Reproduz um oscilador através de um canal do mixer
   * 
   * @param frequency - Frequência em Hz
   * @param type - Tipo de onda ('sine', 'square', 'sawtooth', 'triangle')
   * @param duration - Duração em segundos
   * @param channel - Nome do canal
   * @param volume - Volume adicional (0.0 a 1.0)
   * @param when - Tempo de início (em segundos, relativo ao currentTime)
   * @returns true se o áudio foi agendado com sucesso, false caso contrário
   */
  public playOscillator({
    frequency,
    type = 'triangle',
    duration,
    channel,
    volume = 1.0,
    when,
    useClearEnvelope = false,
  }: {
    frequency: number;
    type?: OscillatorType;
    duration: number;
    channel: string;
    volume?: number;
    when?: number;
    useClearEnvelope?: boolean;
  }): boolean {
    // Validação 1: AudioEngine deve estar pronto
    if (!this.audioEngine.isReady()) {
      console.error('[AudioBus] playOscillator falhou: AudioEngine não está pronto');
      return false;
    }

    // Validação 2: Frequência deve ser válida
    if (frequency <= 0 || !isFinite(frequency)) {
      console.error(`[AudioBus] playOscillator falhou: frequência inválida ${frequency}`);
      return false;
    }

    // Validação 3: Duração deve ser válida
    if (duration <= 0 || !isFinite(duration)) {
      console.error(`[AudioBus] playOscillator falhou: duração inválida ${duration}`);
      return false;
    }

    // Validação 4: Canal deve existir no mixer
    const channelGain = this.audioMixer.getChannel(channel);
    if (!channelGain) {
      console.error(`[AudioBus] playOscillator falhou: canal '${channel}' não existe no AudioMixer`);
      return false;
    }

    try {
      const audioContext = this.audioEngine.getContext();
      const currentTime = audioContext.currentTime;
      const startTime = when !== undefined ? when : currentTime;
      const endTime = startTime + duration;

      // Criar oscilador (ÚNICO lugar onde isso acontece)
      const osc = audioContext.createOscillator();
      osc.type = type;
      osc.frequency.value = frequency;

      // Criar gain para volume adicional
      const volumeGain = audioContext.createGain();
      const clampedVolume = Math.max(0, Math.min(1, volume));
      volumeGain.gain.value = clampedVolume;

      // Criar envelope de amplitude
      const envelopeGain = audioContext.createGain();
      
      if (useClearEnvelope) {
        // Usar envelope claro para percepção auditiva (ataque mais definido)
        applyClearEnvelope(envelopeGain, audioContext, startTime, duration);
      } else {
        // Envelope padrão (compatibilidade)
        envelopeGain.gain.setValueAtTime(0, startTime);
        envelopeGain.gain.linearRampToValueAtTime(1.0, startTime + 0.01);
        envelopeGain.gain.setValueAtTime(1.0, endTime - 0.1);
        envelopeGain.gain.exponentialRampToValueAtTime(0.001, endTime);
      }

      // Conectar: osc -> envelopeGain -> volumeGain -> channelGain
      osc.connect(envelopeGain);
      envelopeGain.connect(volumeGain);
      volumeGain.connect(channelGain);

      // Rastrear oscilador ativo
      this.activeSources.add(osc);
      osc.onended = () => {
        this.activeSources.delete(osc);
      };

      // Agendar playback (ÚNICO lugar onde isso acontece)
      osc.start(startTime);
      osc.stop(endTime);

      // Marcar último som tocado baseado na frequência (para testes)
      // error-soft é marcado pelo FeedbackSoundService, mas podemos detectar aqui também
      if (channel === 'effects' && frequency === 130.81) {
        this.setLastPlayed('error-soft');
      }

      console.log(`[AudioBus] Oscillator ${frequency.toFixed(1)}Hz agendado no canal '${channel}' para ${startTime.toFixed(3)}s`);
      return true;
    } catch (error) {
      console.error('[AudioBus] playOscillator erro ao agendar:', error);
      return false;
    }
  }

  /**
   * Reproduz um SampleData (wrapper para playBuffer)
   */
  public async playSample({
    sample,
    channel,
    volume = 1.0,
    when,
    offset = 0,
    duration,
    soundId,
  }: {
    sample: SampleData;
    channel: string;
    volume?: number;
    when?: number;
    offset?: number;
    duration?: number;
    soundId?: string;
  }): Promise<boolean> {
    if (!sample || !sample.buffer) {
      console.error('[AudioBus] playSample falhou: sample inválido');
      return false;
    }

    // Armazenar buffer para repetição se soundId for fornecido
    if (soundId) {
      this.lastPlayedBuffer = { buffer: sample.buffer, soundId };
    }

    return await this.playBuffer({
      buffer: sample.buffer,
      channel,
      volume,
      when,
      offset,
      duration,
    });
  }

  /**
   * Repete o último som tocado (retorna o mesmo buffer)
   */
  public async repeatLastSound({
    channel,
    volume = 1.0,
    when,
    offset = 0,
    duration,
  }: {
    channel?: string;
    volume?: number;
    when?: number;
    offset?: number;
    duration?: number;
  }): Promise<{ buffer: AudioBuffer; soundId: string } | null> {
    if (!this.lastPlayedBuffer) {
      console.warn('[AudioBus] Nenhum som para repetir');
      return null;
    }

    const { buffer, soundId } = this.lastPlayedBuffer;
    const actualChannel = channel || 'effects';

    // Reproduzir usando o mesmo buffer
    await this.playBuffer({
      buffer,
      channel: actualChannel,
      volume,
      when,
      offset,
      duration,
    });

    // Retornar o mesmo buffer (mesma referência)
    return { buffer, soundId };
  }

  /**
   * Reproduz um sample a partir de uma URL
   * Carrega o sample internamente e agenda o playback
   * 
   * @param sampleUrl - URL do sample (ex: '/samples/strings/E2.mp3')
   * @param channel - Nome do canal
   * @param volume - Volume adicional (0.0 a 1.0)
   * @param when - Tempo de início (em segundos, relativo ao currentTime)
   * @param offset - Offset no buffer (em segundos)
   * @param duration - Duração a tocar (em segundos, undefined = tocar tudo)
   * @param soundId - ID do som para rastreamento e repetição
   * @returns Promise que resolve com true se o áudio foi agendado com sucesso, false caso contrário
   */
  public async playSampleFromUrl({
    sampleUrl,
    channel,
    volume = 1.0,
    when,
    offset = 0,
    duration,
    soundId,
  }: {
    sampleUrl: string;
    channel: string;
    volume?: number;
    when?: number;
    offset?: number;
    duration?: number;
    soundId?: string;
  }): Promise<boolean> {
    try {
      // Carregar sample internamente (AudioBus é responsável pelo carregamento)
      const sample = await this.sampleLoader.loadSample(sampleUrl);
      
      // Reproduzir usando playSample
      return this.playSample({
        sample,
        channel,
        volume,
        when,
        offset,
        duration,
        soundId,
      });
    } catch (error) {
      // Fail safe: se sample não existir, não tocar nada (silenciosamente)
      if (import.meta.env.DEV) {
        console.warn(`[AudioBus] Sample não encontrado para ${sampleUrl}:`, error);
      }
      return false;
    }
  }

  /**
   * Para todo o áudio ativo (stop abrupto)
   */
  public stopAll(): void {
    const sourcesToStop = Array.from(this.activeSources);
    sourcesToStop.forEach(source => {
      try {
        if (source instanceof AudioBufferSourceNode || source instanceof OscillatorNode) {
          source.stop();
        }
      } catch (error) {
        // Source pode já ter terminado
      }
    });
    this.activeSources.clear();
  }

  /**
   * Faz fade-out suave de todo o áudio ativo
   * @param fadeOutDuration - Duração do fade-out em segundos (padrão: 0.15s)
   * @returns Promise que resolve quando o fade-out termina
   */
  public async fadeOutAll(fadeOutDuration: number = 0.15): Promise<void> {
    if (this.activeSources.size === 0) {
      return;
    }

    try {
      const audioContext = this.audioEngine.getContext();
      if (!audioContext) {
        // Fallback para stop abrupto se não houver contexto
        this.stopAll();
        return;
      }

      const currentTime = audioContext.currentTime;
      const fadeOutEndTime = currentTime + fadeOutDuration;

      // Para cada source ativo, aplicar fade-out através do gain do canal
      const sourcesToFade = Array.from(this.activeSources);
      const channelGains = new Map<string, GainNode>();

      // Coletar todos os canais únicos e criar gain nodes para fade-out
      sourcesToFade.forEach(source => {
        // Para aplicar fade-out, precisamos acessar o gain do canal
        // Como não temos acesso direto ao gain do canal de cada source,
        // vamos usar uma abordagem alternativa: reduzir volume do canal no mixer
        // ou aplicar fade-out diretamente no source se possível
      });

      // Aplicar fade-out através do AudioMixer (reduzir volume de todos os canais)
      const channels = ['chords', 'scales', 'metronome', 'effects', 'voice'];
      channels.forEach(channelName => {
        const channelGain = this.audioMixer.getChannel(channelName);
        if (channelGain) {
          // Salvar volume atual
          const currentVolume = channelGain.gain.value;
          
          // Aplicar fade-out
          channelGain.gain.setValueAtTime(currentVolume, currentTime);
          channelGain.gain.linearRampToValueAtTime(0, fadeOutEndTime);
        }
      });

      // Aguardar fade-out terminar e então parar sources
      await new Promise(resolve => setTimeout(resolve, fadeOutDuration * 1000 + 50)); // +50ms de margem

      // Parar todos os sources após fade-out
      sourcesToFade.forEach(source => {
        try {
          if (source instanceof AudioBufferSourceNode || source instanceof OscillatorNode) {
            source.stop();
          }
        } catch (error) {
          // Source pode já ter terminado
        }
      });

      // Restaurar volumes dos canais
      channels.forEach(channelName => {
        const channelGain = this.audioMixer.getChannel(channelName);
        if (channelGain) {
          // Restaurar volume padrão (1.0)
          channelGain.gain.setValueAtTime(1.0, audioContext.currentTime);
        }
      });

      this.activeSources.clear();
      console.log(`[AudioBus] Fade-out completo de ${sourcesToFade.length} sources em ${fadeOutDuration}s`);
    } catch (error) {
      console.error('[AudioBus] Erro no fade-out, usando stop abrupto:', error);
      // Fallback para stop abrupto em caso de erro
      this.stopAll();
    }
  }
}

export default AudioBus;
