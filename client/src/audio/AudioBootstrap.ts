// AudioBootstrap.ts
// ÚNICO ponto de inicialização do AudioContext

import { AudioEngine } from '@/audio/AudioEngine';

class AudioBootstrap {
  private static instance: AudioBootstrap;
  private ready: boolean = false;

  private constructor() {}

  static getInstance(): AudioBootstrap {
    if (!AudioBootstrap.instance) {
      AudioBootstrap.instance = new AudioBootstrap();
    }
    return AudioBootstrap.instance;
  }

  async initialize(userGesture: Event): Promise<void> {
    if (this.ready) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('[AudioBootstrap] AudioContext já inicializado. Ignorando gesto duplicado.');
      }
      return;
    }
    try {
      // Inicializa AudioEngine (singleton)
      const engine = AudioEngine.getInstance();
      await engine.initialize();
      this.ready = true;
      if (process.env.NODE_ENV === 'production') {
        console.log('[AudioBootstrap] AudioContext inicializado com sucesso após gesto:', userGesture.type);
      }
    } catch (err) {
      console.error('[AudioBootstrap] Falha ao inicializar AudioContext:', err);
      throw err;
    }
  }

  isReady(): boolean {
    return this.ready;
  }
}

export const audioBootstrap = AudioBootstrap.getInstance();

// Exemplo de uso em componente React:
// <button onClick={e => audioBootstrap.initialize(e)}>Ativar Áudio</button>
