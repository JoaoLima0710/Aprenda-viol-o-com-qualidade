/**
 * Teste de Navegação e Parada de Áudio
 * 
 * Verifica que o áudio para quando o usuário navega para outra rota.
 * 
 * OBJETIVO:
 * - Garantir que áudio não continua tocando após navegação
 * - Verificar que useAudioNavigationGuard para o áudio corretamente
 */

/**
 * Teste de Navegação e Parada de Áudio
 * 
 * Verifica que o áudio para quando o usuário navega para outra rota.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { Router, Route, useLocation } from 'wouter';
import { metronomeService } from '@/services/MetronomeService';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { getAudioBus } from '@/audio';
import { useAudioNavigationGuard } from '../useAudioNavigationGuard';

// Mock do MetronomeService
vi.mock('@/services/MetronomeService', () => ({
  metronomeService: {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    getIsPlaying: vi.fn(),
  },
}));

// Mock do UnifiedAudioService
vi.mock('@/services/UnifiedAudioService', () => ({
  unifiedAudioService: {
    stopAll: vi.fn(),
    getAudioContext: vi.fn(),
  },
}));

// Mock do AudioBus
const mockAudioBus = {
  isPlaying: vi.fn(),
  stopAll: vi.fn(),
};

vi.mock('@/audio', () => ({
  getAudioBus: vi.fn(() => mockAudioBus),
}));

// Componente de teste que usa o guard
function TestApp() {
  useAudioNavigationGuard();
  const [location, setLocation] = useLocation();

  return (
    <div>
      <div data-testid="current-route">{location}</div>
      <button onClick={() => setLocation('/theory')} data-testid="navigate-theory">
        Go to Theory
      </button>
    </div>
  );
}

// Helper para tocar metrônomo
async function playMetronome() {
  await metronomeService.start(120, '4/4');
  // Simular que está tocando
  vi.mocked(metronomeService.getIsPlaying).mockReturnValue(true);
  mockAudioBus.isPlaying.mockReturnValue(true);
}

// Helper para navegar (simula mudança de rota)
function navigate(path: string) {
  // Simular mudança de rota do wouter
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

describe('Audio Navigation Guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAudioBus.isPlaying.mockReturnValue(false);
    vi.mocked(metronomeService.getIsPlaying).mockReturnValue(false);
  });

  it('stops audio when navigating to another route', async () => {
    // Renderizar app com router
    render(
      <Router>
        <Route path="/practice" component={TestApp} />
        <Route path="/theory" component={TestApp} />
      </Router>
    );

    // Iniciar na rota /practice
    window.history.pushState({}, '', '/practice');

    // Tocar metrônomo
    await act(async () => {
      await playMetronome();
    });

    // Verificar que metrônomo está tocando
    expect(metronomeService.getIsPlaying()).toBe(true);
    expect(getAudioBus()?.isPlaying()).toBe(true);

    // Navegar para /theory
    await act(async () => {
      navigate('/theory');
    });

    // Aguardar e verificar que o áudio parou
    await waitFor(() => {
      expect(unifiedAudioService.stopAll).toHaveBeenCalled();
      expect(metronomeService.stop).toHaveBeenCalled();
      expect(getAudioBus()?.isPlaying()).toBe(false);
    });
  });
});
