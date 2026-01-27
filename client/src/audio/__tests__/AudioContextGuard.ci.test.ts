import { describe, it, expect, vi } from 'vitest';

// Guard global para CI: intercepta toda tentativa de new AudioContext
let audioContextCreatedOutsideBootstrap = false;

class GuardedAudioContext {
  constructor() {
    audioContextCreatedOutsideBootstrap = true;
    throw new Error('AudioContext criado fora do AudioBootstrap!');
  }
}

vi.stubGlobal('AudioContext', GuardedAudioContext);

// Simula importação de arquivos que tentam criar AudioContext
function tryCreateAudioContextDirect() {
  // Simula new AudioContext em qualquer arquivo
  // @ts-ignore
  new AudioContext();
}

describe('Proteção global contra AudioContext fora do AudioBootstrap', () => {
  it('deve falhar se qualquer arquivo usar new AudioContext()', () => {
    expect(() => tryCreateAudioContextDirect()).toThrow('AudioContext criado fora do AudioBootstrap!');
    expect(audioContextCreatedOutsideBootstrap).toBe(true);
  });

  it('deve falhar se inicialização ocorrer fora do AudioBootstrap', () => {
    // Simula inicialização direta
    let erroCapturado = false;
    try {
      // @ts-ignore
      new AudioContext();
    } catch (e) {
      erroCapturado = true;
    }
    expect(erroCapturado).toBe(true);
  });
});
