// client/src/audio/index.ts

export { default as AudioEngine } from './AudioEngine';
export { default as SampleLoader } from './SampleLoader';
export { default as Metronome } from './MetronomeEngine';
export { default as ChordPlayer } from './GuitarSynth';
export { default as ScalePlayer } from './ScalePlayer';
export { default as PitchDetector } from './PitchDetector';
export { default as Tuner } from './TunerEngine';
export { default as AudioMixer } from './AudioMixer';

export * from './types';

import AudioEngine from './AudioEngine';
import SampleLoader from './SampleLoader';
import AudioMixer from './AudioMixer';

let audioMixerInstance: AudioMixer | null = null;

/**
 * Inicializa todo o sistema de áudio
 * Deve ser chamado após interação do usuário
 */
export async function initializeAudioSystem(): Promise<void> {
  const audioEngine = AudioEngine.getInstance();
  await audioEngine.initialize();

  const sampleLoader = SampleLoader.getInstance();

  audioMixerInstance = new AudioMixer();
  await audioMixerInstance.initialize();

  // Criar instância única do AudioBus
  if (!audioBusInstance) {
    audioBusInstance = new AudioBus();
  }

  requestIdleCallback(() => {
    sampleLoader.preloadChordSamples().catch(console.warn);
  });

  console.log('[AudioSystem] Sistema de áudio inicializado');
}

/**
 * Retorna a instância do mixer
 */
export function getAudioMixer(): AudioMixer | null {
  return audioMixerInstance;
}

/**
 * Verifica se o sistema de áudio está pronto
 */
export function isAudioReady(): boolean {
  return AudioEngine.getInstance().isReady();
}

/**
 * Retorna a instância do AudioBus
 */
import AudioBus from './AudioBus';

let audioBusInstance: AudioBus | null = null;

export function getAudioBus(): AudioBus | null {
  if (!audioBusInstance) {
    audioBusInstance = new AudioBus();
  }
  return audioBusInstance;
}
