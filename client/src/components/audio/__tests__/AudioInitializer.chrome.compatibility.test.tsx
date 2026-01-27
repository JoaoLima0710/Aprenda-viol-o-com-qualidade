import React from 'react';
/**
 * Testes de compatibilidade Chrome para AudioInitializer
 * 
 * Garante que o componente exige clique explícito antes de habilitar áudio,
 * respeitando a política de autoplay do Chrome.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AudioInitializer } from '../AudioInitButton';
import { useAudio } from '../../../hooks/useAudio';

// Mock do hook useAudio
vi.mock('../../../hooks/useAudio');

describe('AudioInitializer Chrome Compatibility', () => {
  const mockInitialize = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configurar mock padrão: áudio não está pronto (simula Chrome antes de interação)
    vi.mocked(useAudio).mockReturnValue({
      isReady: false,
      isInitializing: false,
      error: null,
      initialize: mockInitialize,
      unlock: vi.fn().mockResolvedValue(true),
    });
  });

  describe('Explicit click requirement', () => {
    it('requires explicit user click before enabling audio', async () => {
      render(
        <AudioInitializer>
          <div>App</div>
        </AudioInitializer>
      );

      // Aguardar prompt aparecer
      await waitFor(
        () => {
          const elements = screen.getAllByText(/Ativar Áudio/i);
          expect(elements.length).toBeGreaterThan(0);
        },
        { timeout: 600 }
      );

      // Verificar que initialize não foi chamado automaticamente
      expect(mockInitialize).not.toHaveBeenCalled();
    });

    it('calls initialize() only after user clicks button', async () => {
      render(
        <AudioInitializer>
          <div>App</div>
        </AudioInitializer>
      );

      // Aguardar prompt aparecer
      await waitFor(
        () => {
          const elements = screen.getAllByText(/Ativar Áudio/i);
          expect(elements.length).toBeGreaterThan(0);
        },
        { timeout: 600 }
      );

      // Clicar no botão
      const buttons = screen.getAllByRole('button', { name: /Ativar Áudio/i });
      fireEvent.click(buttons[0]);

      // Aguardar initialize ser chamado
      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalledTimes(1);
      });
    });

    it('does not auto-initialize on mount', async () => {
      render(
        <AudioInitializer>
          <div>App</div>
        </AudioInitializer>
      );

      // Aguardar um tempo suficiente
      await new Promise(resolve => setTimeout(resolve, 100));

      // initialize não deve ser chamado automaticamente
      expect(mockInitialize).not.toHaveBeenCalled();
    });
  });

  describe('Chrome autoplay policy compliance', () => {
    it('shows prompt when audio is not ready (suspended state)', async () => {
      vi.mocked(useAudio).mockReturnValue({
        isReady: false, // Simula AudioContext suspended
        isInitializing: false,
        error: null,
        initialize: mockInitialize,
        unlock: vi.fn().mockResolvedValue(true),
      });

      render(
        <AudioInitializer>
          <div>App</div>
        </AudioInitializer>
      );

      // Prompt deve aparecer após timeout
      await waitFor(
        () => {
          const elements = screen.getAllByText(/Ativar Áudio/i);
          expect(elements.length).toBeGreaterThan(0);
        },
        { timeout: 600 }
      );
    });

    it('does not show prompt when audio is ready (running state)', async () => {
      vi.mocked(useAudio).mockReturnValue({
        isReady: true, // Simula AudioContext running
        isInitializing: false,
        error: null,
        initialize: mockInitialize,
        unlock: vi.fn().mockResolvedValue(true),
      });

      render(
        <AudioInitializer>
          <div>App</div>
        </AudioInitializer>
      );

      // Aguardar mais que o timeout
      await new Promise(resolve => setTimeout(resolve, 600));

      // Prompt não deve aparecer
      expect(screen.queryByText(/Ativar Áudio/i)).not.toBeInTheDocument();
    });
  });

  describe('No silent playback', () => {
    it('does not attempt silent playback before user interaction', async () => {
      render(
        <AudioInitializer>
          <div>App</div>
        </AudioInitializer>
      );

      // Aguardar um tempo
      await new Promise(resolve => setTimeout(resolve, 100));

      // initialize não deve ser chamado (sem interação)
      expect(mockInitialize).not.toHaveBeenCalled();
    });

    it('only initializes after explicit user click', async () => {
      render(
        <AudioInitializer>
          <div>App</div>
        </AudioInitializer>
      );

      // Aguardar prompt
      await waitFor(
        () => {
          const elements = screen.getAllByText(/Ativar Áudio/i);
          expect(elements.length).toBeGreaterThan(0);
        },
        { timeout: 600 }
      );

      // Clicar explicitamente
      const buttons = screen.getAllByRole('button', { name: /Ativar Áudio/i });
      fireEvent.click(buttons[0]);

      // Agora initialize deve ser chamado
      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('UX protection', () => {
    it('shows clear message to user about audio activation', async () => {
      render(
        <AudioInitializer>
          <div>App</div>
        </AudioInitializer>
      );

      await waitFor(
        () => {
          const elements = screen.getAllByText(/Ativar Áudio/i);
          expect(elements.length).toBeGreaterThan(0);
        },
        { timeout: 600 }
      );

      // Verificar que há mensagem explicativa
      expect(screen.getByText(/Para uma experiência completa/i)).toBeInTheDocument();
    });

    it('allows user to continue without audio', async () => {
      render(
        <AudioInitializer>
          <div>App</div>
        </AudioInitializer>
      );

      await waitFor(
        () => {
          const elements = screen.getAllByText(/Ativar Áudio/i);
          expect(elements.length).toBeGreaterThan(0);
        },
        { timeout: 600 }
      );

      // Verificar botão "Continuar sem áudio"
      const skipButton = screen.getByText(/Continuar sem áudio/i);
      expect(skipButton).toBeInTheDocument();
    });
  });
});
