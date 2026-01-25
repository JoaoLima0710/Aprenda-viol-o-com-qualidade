import AudioEngine from './AudioEngine';
import AudioMixer from './AudioMixer';
import { SampleData } from './types';

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

  constructor() {
    this.audioEngine = AudioEngine.getInstance();
    this.audioMixer = new AudioMixer();
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
  public playBuffer({
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
  }): boolean {
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

      // Conectar: source -> volumeGain -> channelGain (que já está conectado ao masterGain)
      source.connect(volumeGain);
      volumeGain.connect(channelGain);

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
  }: {
    frequency: number;
    type?: OscillatorType;
    duration: number;
    channel: string;
    volume?: number;
    when?: number;
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
      envelopeGain.gain.setValueAtTime(0, startTime);
      envelopeGain.gain.linearRampToValueAtTime(1.0, startTime + 0.01);
      envelopeGain.gain.setValueAtTime(1.0, endTime - 0.1);
      envelopeGain.gain.exponentialRampToValueAtTime(0.001, endTime);

      // Conectar: osc -> envelopeGain -> volumeGain -> channelGain
      osc.connect(envelopeGain);
      envelopeGain.connect(volumeGain);
      volumeGain.connect(channelGain);

      // Agendar playback (ÚNICO lugar onde isso acontece)
      osc.start(startTime);
      osc.stop(endTime);

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
  public playSample({
    sample,
    channel,
    volume = 1.0,
    when,
    offset = 0,
    duration,
  }: {
    sample: SampleData;
    channel: string;
    volume?: number;
    when?: number;
    offset?: number;
    duration?: number;
  }): boolean {
    if (!sample || !sample.buffer) {
      console.error('[AudioBus] playSample falhou: sample inválido');
      return false;
    }

    return this.playBuffer({
      buffer: sample.buffer,
      channel,
      volume,
      when,
      offset,
      duration,
    });
  }
}

export default AudioBus;
