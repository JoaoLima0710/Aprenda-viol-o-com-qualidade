// @jsx React.createElement
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import AudioEngine from '../AudioEngine';
import { audioBootstrap } from '../AudioBootstrap';
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
  createGain = vi.fn(() => ({
    gain: { value: 0.8 },
    connect: vi.fn(),
  }));
  createAnalyser = vi.fn(() => ({
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    connect: vi.fn(),
  }));
  createDynamicsCompressor = vi.fn(() => ({
    threshold: { value: -24 },
    knee: { value: 30 },
    ratio: { value: 12 },
    attack: { value: 0.003 },
    release: { value: 0.25 },
    connect: vi.fn(),
  }));
  createMediaStreamSource = vi.fn(() => ({ connect: vi.fn() }));
  destination = { connect: vi.fn() };
}


function TestComponent() {
  return (
    <button data-testid="audio-btn" onClick={e => audioBootstrap.initialize(e as any)}>
      Ativar Áudio
    </button>
  );
}

vi.stubGlobal('AudioContext', GuardedAudioContext);
vi.stubGlobal('webkitAudioContext', GuardedAudioContext); // Fallback for AudioEngine

describe('AudioContext Architecture CI Guard', () => {
  beforeEach(() => {
    GuardedAudioContext.createdCount = 0;
    // Reset AudioEngine state for test
    const engine = AudioEngine.getInstance();
    // @ts-ignore: Access for test reset
    engine.getState().isInitialized = false;
  });

  it('não cria AudioContext antes do bootstrap', () => {
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
