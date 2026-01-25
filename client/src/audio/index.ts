// Exportar todas as classes do módulo de áudio

export { default as AudioEngine } from './AudioEngine';
export { default as SampleLoader } from './SampleLoader';
export { default as Metronome } from './MetronomeEngine';
export { default as ChordPlayer } from './GuitarSynth';
export { default as ScalePlayer } from './ScalePlayer';
export { default as PitchDetector } from './PitchDetector';
export { default as Tuner } from './TunerEngine';
export { default as AudioMixer } from './AudioMixer';
export { default as AudioBus } from './AudioBus';

// Exportar tipos
export * from './types';

// Instâncias singleton para uso global
import AudioEngine from './AudioEngine';
import SampleLoader from './SampleLoader';
import AudioMixer from './AudioMixer';
import AudioBus from './AudioBus';

let audioMixerInstance: AudioMixer | null = null;
let audioBusInstance: AudioBus | null = null;

/**
 * Inicializa todo o sistema de áudio
 * Deve ser chamado após interação do usuário
 */
export async function initializeAudioSystem(): Promise<void> {
  const audioEngine = AudioEngine.getInstance();
  await audioEngine.initialize();
  
  const sampleLoader = SampleLoader.getInstance();
  
  if (!audioMixerInstance) {
    audioMixerInstance = new AudioMixer();
    await audioMixerInstance.initialize();
    
    // Criar instância única do AudioBus
    audioBusInstance = new AudioBus();
      
      // Pré-carregar samples essenciais em background
      // Usar fallback para navegadores que não suportam requestIdleCallback
      const schedulePreload = () => {
        sampleLoader.preloadChordSamples().catch(console.warn);
      };
      
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(schedulePreload);
      } else {
        // Fallback: usar setTimeout para não bloquear a UI
        setTimeout(schedulePreload, 1000);
      }
      
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
export function getAudioBus(): AudioBus | null {
  return audioBusInstance;
}
