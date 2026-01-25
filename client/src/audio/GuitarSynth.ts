import AudioEngine from './AudioEngine';
import AudioBus from './AudioBus';
import { getAudioBus } from './index';
import { NOTE_NAMES, A4_FREQUENCY, A4_MIDI_NUMBER } from './types';

/**
 * ChordPlayer - Reproduz acordes com UM sample por acorde
 * 
 * REGRAS ARQUITETURAIS:
 * - ❌ NÃO cria AudioContext, AudioBufferSourceNode ou OscillatorNode
 * - ❌ NÃO chama .start() fora do AudioBus
 * - ❌ NÃO conecta nada diretamente ao masterGain
 * - ✅ Usa AudioBus.playSampleFromUrl() para TODA reprodução
 * - ✅ Canal fixo: "chords"
 * - ✅ Usa UM sample completo por acorde (não monta nota por nota)
 * - ✅ NÃO usa síntese
 * - ✅ NÃO faz strum manual
 * 
 * NORMALIZAÇÃO:
 * - Tabela estática de ganhos por acorde (soft normalization)
 * - Compensação musical legítima: acordes graves acumulam mais energia
 * - Aplicação leve: multiplica volume base pelo ganho do acorde
 * - Sem análise de áudio em runtime
 * - Sem DSP pesado
 * 
 * IMPORTANTE - Normalização dos Samples (fora do código):
 * Todos os samples de acordes devem ser exportados com:
 * - Pico máximo em -1 dBFS (evita clipping)
 * - LUFS integrado entre -16 e -14 (loudness consistente)
 * - Sem limiter agressivo (preserva dinâmica natural)
 * 
 * Isso garante consistência antes do código aplicar a normalização suave.
 */

/**
 * Tabela de ganhos de normalização por acorde
 * Compensação musical legítima: acordes graves acumulam mais energia
 * 
 * Esta tabela aplica ajustes finos após a normalização dos samples.
 * Valores baseados em características acústicas: acordes graves (E, Em, E7)
 * acumulam mais energia e precisam de redução maior.
 */
const CHORD_GAIN_PRESETS: Record<string, number> = {
  'C': 0.9,
  'D': 0.95,
  'E': 0.85,
  'F': 0.9,
  'G': 1.0,
  'A': 0.95,
  'B': 0.9,
  'Am': 0.9,
  'Bm': 0.9,
  'Cm': 0.9,
  'Dm': 0.95,
  'Em': 0.85,
  'Fm': 0.9,
  'Gm': 0.95,
  'A7': 0.95,
  'B7': 0.9,
  'C7': 0.9,
  'D7': 0.95,
  'E7': 0.85,
  'G7': 1.0,
  // Acordes com sustenidos (fallback para valores similares)
  'C#': 0.9,
  'C#m': 0.9,
  'C#7': 0.9,
  'D#': 0.95,
  'D#m': 0.95,
  'D#7': 0.95,
  'F#': 0.9,
  'F#m': 0.9,
  'F#7': 0.9,
  'G#': 1.0,
  'G#m': 0.95,
  'A#': 0.95,
  'A#m': 0.9,
  'A#7': 0.95,
};

class ChordPlayer {
  private audioEngine: AudioEngine;
  
  // Configurações
  private volume: number = 0.7;

  constructor() {
    this.audioEngine = AudioEngine.getInstance();
  }

  /**
   * Obtém ganho de normalização para um acorde
   * Usa tabela estática de presets ou fallback padrão (0.9)
   */
  private getNormalizationGain(chordName: string): number {
    return CHORD_GAIN_PRESETS[chordName] ?? 0.9;
  }

  /**
   * Define o volume (0.0 a 1.0)
   */
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Define a velocidade do strum em ms
   * MANTIDO para compatibilidade com API pública, mas não é mais usado
   */
  public setStrumSpeed(speed: number): void {
    // Não usado mais - acordes usam samples completos
    // Mantido apenas para compatibilidade com API pública
  }

  /**
   * Reproduz um acorde pelo nome usando UM sample completo
   * REFATORADO: Usa sample único por acorde, não monta nota por nota
   * 
   * Comportamento:
   * 1. Resolve o nome do acorde (ex: "C", "Am", "G7")
   * 2. Monta URL: /samples/chords/{chordName}.mp3
   * 3. Aplica normalização via metadata (ganho leve)
   * 4. Reproduz usando AudioBus.playSampleFromUrl()
   * 
   * ⚠️ ChordPlayer NÃO carrega sample (AudioBus faz isso)
   * ⚠️ ChordPlayer NÃO agenda tempo (AudioBus faz isso)
   * ⚠️ ChordPlayer NÃO mistura notas (usa sample único)
   * ⚠️ Normalização: aplicação leve via metadata, sem análise de áudio
   */
  public async playChord(chordName: string): Promise<void> {
    await this.audioEngine.ensureResumed();

    const audioBus = getAudioBus();
    if (!audioBus) {
      if (import.meta.env.DEV) {
        console.error('[ChordPlayer] playChord falhou: AudioBus não está disponível. Chame initializeAudioSystem() primeiro.');
      }
      return;
    }

    // Resolver o nome do acorde e montar URL
    // Estrutura: /samples/chords/{chordName}.mp3 (ou .wav como fallback)
    // Exemplos: C.mp3, D.mp3, Am.mp3, C7.mp3
    // Fallback: tenta .wav se .mp3 não existir
    const normalizationGain = this.getNormalizationGain(chordName);
    const finalVolume = this.volume * normalizationGain;

    // Tentar .mp3 primeiro, depois .wav como fallback
    let sampleUrl = `/samples/chords/${chordName}.mp3`;
    let success = await audioBus.playSampleFromUrl({
      sampleUrl,
      channel: 'chords',
      volume: finalVolume,
    });

    // Se .mp3 não existir, tentar .wav
    if (!success) {
      sampleUrl = `/samples/chords/${chordName}.wav`;
      success = await audioBus.playSampleFromUrl({
        sampleUrl,
        channel: 'chords',
        volume: finalVolume,
      });
    }

    if (!success) {
      // Fail safe: se sample não existir, não tocar nada (silenciosamente)
      if (import.meta.env.DEV) {
        console.warn(`[ChordPlayer] Sample não encontrado para acorde '${chordName}' em ${sampleUrl}`);
      }
      return;
    }

    if (import.meta.env.DEV) {
      const gainInfo = normalizationGain !== 1.0 ? ` (ganho: ${normalizationGain.toFixed(2)})` : '';
      console.log(`[ChordPlayer] Acorde '${chordName}' tocado usando sample único${gainInfo}`);
    }
  }

  /**
   * Para todas as notas ativas
   * NOTA: Com AudioBus, não temos mais controle direto sobre sources ativas
   * Este método é mantido para compatibilidade, mas não faz nada
   */
  public stopAll(): void {
    // Após migração para AudioBus, não temos mais referência direta aos nodes
    // O AudioBus gerencia o ciclo de vida dos sources automaticamente
    if (import.meta.env.DEV) {
      console.log('[ChordPlayer] stopAll() chamado - não há mais controle direto sobre sources (gerenciado pelo AudioBus)');
    }
  }

  /**
   * Converte nome de nota para frequência
   */
  public noteToFrequency(noteName: string): number {
    const match = noteName.match(/^([A-G]#?)(\d)$/);
    if (!match) return 440;

    const note = match[1];
    const octave = parseInt(match[2]);
    
    const noteIndex = NOTE_NAMES.indexOf(note as any);
    if (noteIndex === -1) return 440;

    const midiNumber = (octave + 1) * 12 + noteIndex;
    return A4_FREQUENCY * Math.pow(2, (midiNumber - A4_MIDI_NUMBER) / 12);
  }

  /**
   * Lista todos os acordes disponíveis
   */
  public getAvailableChords(): string[] {
    return [
      'C', 'D', 'E', 'F', 'G', 'A', 'B',
      'Am', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'Gm',
      'A7', 'B7', 'C7', 'D7', 'E7', 'G7'
    ];
  }
}

export default ChordPlayer;
