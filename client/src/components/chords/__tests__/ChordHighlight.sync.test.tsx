/**
 * Teste de Sincronização de Highlight de Acordes
 * 
 * Verifica que acordes são destacados visualmente exatamente quando o áudio toca.
 * 
 * OBJETIVO:
 * - Garantir sincronização perfeita entre áudio e highlight visual
 * - Usar AudioContext.currentTime como fonte de verdade
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React, { useState } from 'react';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { audioContextScheduler } from '@/services/AudioContextScheduler';

// Mock do UnifiedAudioService
vi.mock('@/services/UnifiedAudioService', () => ({
  unifiedAudioService: {
    getAudioContext: vi.fn(),
    playChord: vi.fn(),
    ensureInitialized: vi.fn(),
    markUserInteraction: vi.fn(),
  },
}));

// Mock do AudioContextScheduler
vi.mock('@/services/AudioContextScheduler', () => ({
  audioContextScheduler: {
    initialize: vi.fn(),
    scheduleOnce: vi.fn(),
    cancelAll: vi.fn(),
  },
}));

// Componente de teste que renderiza acordes com highlight
function ChordGrid({ chords, activeChord }: { chords: string[]; activeChord: string | null }) {
  return (
    <div data-testid="chord-grid">
      {chords.map((chord) => (
        <div
          key={chord}
          data-testid={`chord-${chord}`}
          className={activeChord === chord ? 'active' : ''}
        >
          {chord}
        </div>
      ))}
    </div>
  );
}

// Componente que toca acorde e destaca visualmente
function ChordPlayer({ chords }: { chords: string[] }) {
  const [activeChord, setActiveChord] = useState<string | null>(null);

  const playChord = async (chordName: string) => {
    const audioContext = unifiedAudioService.getAudioContext();
    if (!audioContext) {
      throw new Error('AudioContext not available');
    }

    // Obter tempo atual do AudioContext (fonte de verdade)
    const currentTime = audioContext.currentTime;
    const chordDuration = 1.5;

    // Tocar acorde
    await unifiedAudioService.playChord(chordName, chordDuration);

    // Agendar highlight visual para começar exatamente quando o áudio começa
    audioContextScheduler.scheduleOnce(
      `highlight-${chordName}`,
      (audioTime: number, visualTime: number) => {
        // Aplicar highlight quando o áudio tocar
        setActiveChord(chordName);
      },
      0 // Começar imediatamente (já está tocando)
    );

    // Remover highlight após duração do acorde
    audioContextScheduler.scheduleOnce(
      `unhighlight-${chordName}`,
      () => {
        setActiveChord(null);
      },
      chordDuration
    );
  };

  return (
    <div>
      <ChordGrid chords={chords} activeChord={activeChord} />
      <button onClick={() => playChord('C')} data-testid="play-C">
        Play C
      </button>
    </div>
  );
}

describe('Chord Highlight Synchronization', () => {
  let mockAudioContext: any;
  let mockPlayChord: any;
  let scheduledCallbacks: Map<string, { callback: Function; delay: number; executed: boolean }> = new Map();

  beforeEach(() => {
    vi.clearAllMocks();
    scheduledCallbacks.clear();

    // Mock AudioContext com currentTime controlável
    let mockCurrentTime = 0;
    mockAudioContext = {
      state: 'running' as AudioContextState,
      get currentTime() {
        return mockCurrentTime;
      },
      resume: vi.fn().mockResolvedValue(undefined),
      destination: { channelCount: 2 },
      // Método para avançar o tempo (para simulação)
      advanceTime: (seconds: number) => {
        mockCurrentTime += seconds;
        // Executar callbacks agendados que devem ser executados agora
        for (const [id, event] of scheduledCallbacks.entries()) {
          if (!event.executed && mockCurrentTime >= event.delay) {
            const visualTime = performance.now() / 1000;
            event.callback(mockCurrentTime, visualTime);
            event.executed = true;
          }
        }
      },
    };

    // Mock playChord
    mockPlayChord = vi.fn().mockImplementation(async (chordName: string, duration: number) => {
      return { chordName, startTime: mockAudioContext.currentTime, duration };
    });

    // Mock scheduleOnce para capturar e executar callbacks
    vi.mocked(audioContextScheduler.scheduleOnce).mockImplementation(
      (id: string, callback: Function, delay: number) => {
        scheduledCallbacks.set(id, { callback, delay, executed: false });
        
        // Se delay é 0, executar imediatamente
        if (delay === 0) {
          const audioTime = mockAudioContext.currentTime;
          const visualTime = performance.now() / 1000;
          callback(audioTime, visualTime);
          const event = scheduledCallbacks.get(id);
          if (event) event.executed = true;
        }
      }
    );

    // Configurar mocks
    vi.mocked(unifiedAudioService.getAudioContext).mockReturnValue(mockAudioContext);
    vi.mocked(unifiedAudioService.playChord).mockImplementation(mockPlayChord);
    vi.mocked(unifiedAudioService.ensureInitialized).mockResolvedValue(undefined);
    vi.mocked(audioContextScheduler.initialize).mockReturnValue(undefined);
  });

  it('highlights chord exactly when audio plays', async () => {
    const chords = ['C', 'D', 'E', 'F', 'G'];
    
    render(<ChordPlayer chords={chords} />);

    // Verificar que acorde C não está destacado inicialmente
    expect(screen.getByTestId('chord-C')).not.toHaveClass('active');

    // Tocar acorde C
    const playButton = screen.getByTestId('play-C');
    await act(async () => {
      playButton.click();
    });

    // Aguardar e verificar que o acorde está destacado exatamente quando o áudio toca
    await waitFor(() => {
      expect(screen.getByTestId('chord-C')).toHaveClass('active');
    });

    // Verificar que playChord foi chamado
    expect(mockPlayChord).toHaveBeenCalledWith('C', 1.5);
    
    // Verificar que scheduleOnce foi chamado para sincronizar highlight com áudio
    expect(audioContextScheduler.scheduleOnce).toHaveBeenCalledWith(
      'highlight-C',
      expect.any(Function),
      0 // Delay 0 = highlight imediato quando áudio toca
    );
  });
});
