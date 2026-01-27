import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { AudioBootstrap } from '@/audio/AudioBootstrap';
import { AudioEngine } from '@/audio/AudioEngine';
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
  createGain = vi.fn();
  createAnalyser = vi.fn();
  createMediaStreamSource = vi.fn();
}

vi.stubGlobal('AudioContext', MockAudioContext);

function TestComponent() {
  return (
    <button data-testid="audio-btn" onClick={e => AudioBootstrap.getInstance().initialize(e)}>
      Ativar Áudio
    </button>
  );
}

describe('AudioBootstrap/AudioEngine integration', () => {
  beforeEach(() => {
    MockAudioContext.created = false;
    AudioEngine.getInstance().state.isInitialized = false;
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
