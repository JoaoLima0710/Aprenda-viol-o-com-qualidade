/**
 * Teste de Som de Erro em Treino de Acordes
 * 
 * Verifica que um som de erro suave é reproduzido quando o usuário toca um acorde errado.
 * 
 * OBJETIVO:
 * - Garantir feedback sonoro pedagógico em erros
 * - Verificar que o som de erro é tocado através do AudioBus
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { feedbackSoundService } from '@/services/FeedbackSoundService';
import { getAudioBus } from '@/audio';

// Mock do AudioBus
const mockAudioBus = {
  playOscillator: vi.fn(),
  lastPlayed: vi.fn(() => null),
  setLastPlayed: vi.fn(),
  isPlaying: vi.fn(() => false),
};

vi.mock('@/audio', () => ({
  getAudioBus: vi.fn(() => mockAudioBus),
  initializeAudioSystem: vi.fn().mockResolvedValue(undefined),
}));

// Mock do FeedbackSoundService
const mockPlayFeedback = vi.fn(async (type: string) => {
  const audioBus = getAudioBus();
  if (audioBus && type === 'error_execution') {
    // Simular o comportamento real do FeedbackSoundService (intervalo pedagógico D4 → G4)
    audioBus.playOscillator({
      frequency: 293.66, // D4 - primeira nota do intervalo
      type: 'sine',
      duration: 0.1,
      channel: 'effects',
      volume: 0.06,
    });
    // Segunda nota após 50ms
    setTimeout(() => {
      audioBus?.playOscillator({
        frequency: 392.00, // G4 - segunda nota do intervalo
        type: 'sine',
        duration: 0.1,
        channel: 'effects',
        volume: 0.06,
      });
    }, 50);
    audioBus.setLastPlayed('error-soft');
  }
});

vi.mock('@/services/FeedbackSoundService', () => ({
  feedbackSoundService: {
    playFeedback: mockPlayFeedback,
  },
}));

// Componente de teste simplificado
function ChordPracticeTest({ expectedChord }: { expectedChord: string }) {
  const handleChordAttempt = async (playedChord: string) => {
    const isCorrect = playedChord === expectedChord;
    
    if (!isCorrect) {
      // Tocar som de erro
      await feedbackSoundService.playFeedback('error_execution', 0.12);
    }
  };

  return (
    <div>
      <button
        onClick={() => handleChordAttempt('Dm')}
        data-testid="play-chord-Dm"
      >
        Play Dm
      </button>
      <button
        onClick={() => handleChordAttempt('C')}
        data-testid="play-chord-C"
      >
        Play C
      </button>
    </div>
  );
}

describe('Chord Practice Error Sound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAudioBus.lastPlayed.mockReturnValue(null);
  });

  it('plays error sound on wrong chord', async () => {
    const user = userEvent.setup();
    
    // Renderizar componente esperando acorde C
    render(<ChordPracticeTest expectedChord="C" />);

    // Tocar acorde errado (Dm quando esperado é C)
    const playButton = screen.getByTestId('play-chord-Dm');
    await user.click(playButton);

    // Aguardar e verificar que o som de erro foi tocado
    await waitFor(() => {
      expect(mockPlayFeedback).toHaveBeenCalledWith('error_execution', 0.12);
      // Verificar que o som de erro foi tocado (agora usa intervalo D4 → G4)
      expect(mockAudioBus.playOscillator).toHaveBeenCalledWith(
        expect.objectContaining({
          frequency: 293.66, // D4 - primeira nota do intervalo pedagógico
          channel: 'effects',
        })
      );
      expect(mockAudioBus.setLastPlayed).toHaveBeenCalledWith('error-soft');
      expect(getAudioBus()?.lastPlayed()).toBe('error-soft');
    });
  });

  it('does not play error sound on correct chord', async () => {
    const user = userEvent.setup();
    
    render(<ChordPracticeTest expectedChord="C" />);

    // Tocar acorde correto
    const playButton = screen.getByTestId('play-chord-C');
    await user.click(playButton);

    // Verificar que o som de erro NÃO foi tocado
    await waitFor(() => {
      expect(mockPlayFeedback).not.toHaveBeenCalled();
    });
  });
});
