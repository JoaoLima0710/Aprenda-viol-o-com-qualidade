import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { AudioBootstrap } from '@/audio/AudioBootstrap';
import { AudioEngine } from '@/audio/AudioEngine';
import React from 'react';

// Mock global AudioContext with guard for multiple instances
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
  createGain = vi.fn();
  createAnalyser = vi.fn();
  createMediaStreamSource = vi.fn();
}

vi.stubGlobal('AudioContext', GuardedAudioContext);

function TestComponent() {
  return (
    <button data-testid="audio-btn" onClick={e => AudioBootstrap.getInstance().initialize(e)}>
      Ativar Áudio
    </button>
  );
}

describe('AudioContext Architecture CI Guard', () => {
  beforeEach(() => {
    GuardedAudioContext.createdCount = 0;
    AudioEngine.getInstance().state.isInitialized = false;
  });

  it('NÃO cria AudioContext no mount', () => {
    render(<TestComponent />);
    expect(GuardedAudioContext.createdCount).toBe(0);
  });

  it('NÃO cria AudioContext por useEffect', () => {
    render(<TestComponent />);
    // Simula tick de useEffect
    expect(GuardedAudioContext.createdCount).toBe(0);
  });

  it('cria AudioContext SOMENTE após AudioBootstrap', async () => {
    render(<TestComponent />);
    const btn = screen.getByTestId('audio-btn');
    await fireEvent.click(btn);
    expect(GuardedAudioContext.createdCount).toBe(1);
  });

  it('NUNCA existe mais de um AudioContext', async () => {
    render(<TestComponent />);
    const btn = screen.getByTestId('audio-btn');
    await fireEvent.click(btn);
    expect(GuardedAudioContext.createdCount).toBe(1);
    // Segunda tentativa não pode criar novo contexto
    await fireEvent.click(btn);
    expect(GuardedAudioContext.createdCount).toBe(1);
  });

  it('Falha CI se qualquer regra for violada', async () => {
    // Simula violação: cria contexto manualmente
    expect(() => new GuardedAudioContext()).not.toThrow();
    expect(() => new GuardedAudioContext()).toThrow('Mais de um AudioContext criado!');
  });
});
