import { describe, it, expect, vi } from 'vitest';
import AudioEngine from '../AudioEngine';
import { audioBootstrap } from '../AudioBootstrap';

let createdCount = 0;
class GuardedAudioContext {
  static createdCount = 0;
  constructor() {
    GuardedAudioContext.createdCount++;
    if (GuardedAudioContext.createdCount > 1) {
      throw new Error('Mais de um AudioContext criado!');
    }
  }
  resume = vi.fn();
  close = vi.fn();
  state = 'suspended';
}

describe('AudioContext Regression Guard', () => {
  beforeEach(async () => {
    GuardedAudioContext.createdCount = 0;
    vi.stubGlobal('AudioContext', GuardedAudioContext);
    vi.stubGlobal('webkitAudioContext', GuardedAudioContext);
    try {
      await AudioEngine.getInstance().dispose();
    } catch {}
  });

  it('não cria AudioContext automaticamente', () => {
    expect(GuardedAudioContext.createdCount).toBe(0);
  });


  it('cria AudioContext SOMENTE após gesto do usuário', async () => {
    await audioBootstrap.initialize({ type: 'click' } as any);
    expect(GuardedAudioContext.createdCount).toBe(1);
  });


  it('falha se mais de um AudioContext for criado', async () => {
    await audioBootstrap.initialize({ type: 'click' } as any);
    expect(() => new GuardedAudioContext()).toThrow('Mais de um AudioContext criado!');
  });

  it('falha se inicializar áudio sem gesto do usuário', async () => {
    // Simula chamada sem evento de usuário
    await expect(AudioEngine.getInstance().initialize()).rejects.toThrow();
  });
});
