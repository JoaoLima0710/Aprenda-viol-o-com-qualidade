/**
 * Testes de UI do AudioInitializer
 * 
 * Verifica que o componente exige interação do usuário antes de habilitar o áudio.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AudioInitializer } from '../AudioInitButton';
import { useAudio } from '../../../hooks/useAudio';

// Mock do hook useAudio
vi.mock('../../../hooks/useAudio');

describe('AudioInitializer UI guard', () => {
  const mockInitialize = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configurar mock padrão: áudio não está pronto
    vi.mocked(useAudio).mockReturnValue({
      isReady: false,
      isInitializing: false,
      error: null,
      initialize: mockInitialize,
      unlock: vi.fn().mockResolvedValue(true),
    });
  });

  it('requires user interaction before enabling audio', async () => {
    // Renderizar componente
    render(
      <AudioInitializer>
        <div>App</div>
      </AudioInitializer>
    );

    // Inicialmente, o prompt não deve estar visível (aguarda 500ms)
    expect(screen.queryByText(/Ativar Áudio/i)).not.toBeInTheDocument();

    // Aguardar o timeout de 500ms para o prompt aparecer
    await waitFor(
      () => {
        // Verificar que pelo menos um elemento com o texto está presente
        const elements = screen.getAllByText(/Ativar Áudio/i);
        expect(elements.length).toBeGreaterThan(0);
      },
      { timeout: 600 }
    );

    // Verificar que o texto está presente (pode haver múltiplos elementos)
    const elements = screen.getAllByText(/Ativar Áudio/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('does not show prompt if audio is already ready', async () => {
    // Mock: áudio já está pronto
    vi.mocked(useAudio).mockReturnValue({
      isReady: true,
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

    // Aguardar mais que 500ms
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
    });

    // O prompt não deve aparecer se o áudio já está pronto
    expect(screen.queryByText(/Ativar Áudio/i)).not.toBeInTheDocument();
  });

  it('shows children even when prompt is displayed', async () => {
    render(
      <AudioInitializer>
        <div>App Content</div>
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

    // Children devem estar visíveis mesmo com o prompt
    expect(screen.getByText('App Content')).toBeInTheDocument();
  });

  it('hides prompt after user clicks initialize', async () => {
    // Mock: após initialize, áudio fica pronto
    let isReady = false;
    vi.mocked(useAudio).mockReturnValue({
      get isReady() {
        return isReady;
      },
      isInitializing: false,
      error: null,
      initialize: async () => {
        await mockInitialize();
        isReady = true;
        // Simular atualização do hook
        vi.mocked(useAudio).mockReturnValue({
          isReady: true,
          isInitializing: false,
          error: null,
          initialize: mockInitialize,
          unlock: vi.fn().mockResolvedValue(true),
        });
      },
      unlock: vi.fn().mockResolvedValue(true),
    });

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

    // Clicar no botão de ativar (usar getAllByRole para pegar o botão)
    const buttons = screen.getAllByRole('button', { name: /Ativar Áudio/i });
    const activateButton = buttons[0];
    await act(async () => {
      activateButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Prompt deve desaparecer após inicialização
    await waitFor(
      () => {
        expect(screen.queryByText(/Ativar Áudio/i)).not.toBeInTheDocument();
      },
      { timeout: 300 }
    );
  });
});
