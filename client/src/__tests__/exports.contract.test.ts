/**
 * Testes de Contrato de Export
 * 
 * Garantem que componentes críticos estejam exportados corretamente
 * para evitar erros de build no Vercel/Rollup.
 * 
 * IMPORTANTE: Estes testes devem FALHAR se alguém remover ou renomear
 * exports essenciais, prevenindo erros de build antes do deploy.
 */

import { describe, it, expect } from 'vitest';

describe('Contrato de Export - AudioPlayChordButton', () => {
  it('deve exportar AudioPlayChordButton como named export', async () => {
    const module = await import('@/components/audio/AudioPlayChordButton');
    
    // Verificar que AudioPlayChordButton existe como named export
    expect(module).toHaveProperty('AudioPlayChordButton');
    expect(typeof module.AudioPlayChordButton).toBe('function');
  });

  it('deve exportar ChordPlayButton como named export', async () => {
    const module = await import('@/components/audio/AudioPlayChordButton');
    
    // Verificar que ChordPlayButton existe como named export
    expect(module).toHaveProperty('ChordPlayButton');
    expect(typeof module.ChordPlayButton).toBe('function');
  });

  it('deve exportar default export (ChordPlayButton)', async () => {
    const module = await import('@/components/audio/AudioPlayChordButton');
    
    // Verificar que existe default export
    expect(module).toHaveProperty('default');
    expect(typeof module.default).toBe('function');
  });

  it('deve garantir que AudioPlayChordButton e ChordPlayButton são o mesmo componente', async () => {
    const module = await import('@/components/audio/AudioPlayChordButton');
    
    // AudioPlayChordButton deve ser um alias para ChordPlayButton
    expect(module.AudioPlayChordButton).toBe(module.ChordPlayButton);
    expect(module.AudioPlayChordButton).toBe(module.default);
  });
});

describe('Contrato de Export - Módulos de Áudio', () => {
  it('deve exportar AudioBus corretamente', async () => {
    const module = await import('@/audio/AudioBus');
    
    // AudioBus deve ter default export
    expect(module).toHaveProperty('default');
    expect(typeof module.default).toBe('function');
  });

  it('deve exportar AudioEngine corretamente', async () => {
    const module = await import('@/audio/AudioEngine');
    
    // AudioEngine deve ter default export
    expect(module).toHaveProperty('default');
    expect(typeof module.default).toBe('function');
  });

  it('deve exportar ChordPlayer (GuitarSynth) corretamente', async () => {
    const module = await import('@/audio/GuitarSynth');
    
    // ChordPlayer deve ter default export
    expect(module).toHaveProperty('default');
    expect(typeof module.default).toBe('function');
  });

  it('deve exportar getAudioBus do index', async () => {
    const module = await import('@/audio/index');
    
    // getAudioBus deve estar disponível
    expect(module).toHaveProperty('getAudioBus');
    expect(typeof module.getAudioBus).toBe('function');
  });
});
