import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { audioBootstrap } from '@/audio/AudioBootstrap';
import AudioEngine from '@/audio/AudioEngine';
import React from 'react';

// Mock global AudioContext
class MockAudioContext {
  constructor() {
    if (MockAudioContext.created) {
      throw new Error('AudioContext already created');
    }
    MockAudioContext.created = true;
  }
  static created = false;
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

vi.stubGlobal('AudioContext', MockAudioContext);
vi.stubGlobal('webkitAudioContext', MockAudioContext); // Fallback for AudioEngine

function TestComponent() {
  return (
    <button data-testid="audio-btn" onClick={e => audioBootstrap.initialize(e)}>
      Ativar Áudio
    </button>
  );
}

describe('AudioBootstrap/AudioEngine integration', () => {
  beforeEach(async () => {
    MockAudioContext.created = false;
    // Limpar singletons para garantir isolamento entre testes
    try {
      await AudioEngine.getInstance().dispose();
    } catch {}
    // Não é mais necessário resetar _instance, pois audioBootstrap é singleton exportado
  });

  it('não cria AudioContext no mount', () => {
    render(<TestComponent />);
    expect(MockAudioContext.created).toBe(false);
  });

  it('cria AudioContext apenas após click', async () => {
    render(<TestComponent />);
    const btn = screen.getByTestId('audio-btn');
    await fireEvent.click(btn);
    expect(MockAudioContext.created).toBe(true);
  });

  it('segunda inicialização falha silenciosamente', async () => {
    render(<TestComponent />);
    const btn = screen.getByTestId('audio-btn');
    await fireEvent.click(btn);
    expect(MockAudioContext.created).toBe(true);
    // Segunda tentativa não cria novo contexto
    await fireEvent.click(btn);
    expect(MockAudioContext.created).toBe(true);
  });
});
