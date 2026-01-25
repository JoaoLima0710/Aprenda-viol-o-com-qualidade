/**
 * Testes de Inicialização do AudioContext
 * 
 * Verifica que o AudioContext não inicia antes da interação do usuário
 * e inicia corretamente após o clique no botão "Ativar áudio".
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudioInitButton } from '../AudioInitButton';
import { unifiedAudioService } from '@/services/UnifiedAudioService';

// Mock do UnifiedAudioService
vi.mock('@/services/UnifiedAudioService', () => ({
  unifiedAudioService: {
    getAudioContext: vi.fn(),
    ensureInitialized: vi.fn(),
    markUserInteraction: vi.fn(),
    reinitialize: vi.fn(),
  },
}));

// Mock do hook useAudio
const mockUseAudioReturn = {
  isReady: false,
  isInitializing: false,
  error: null as Error | null,
  initialize: vi.fn(),
  unlock: vi.fn().mockResolvedValue(true),
};

vi.mock('../../../hooks/useAudio', () => ({
  useAudio: () => mockUseAudioReturn,
}));

describe('Audio Initialization', () => {
  let mockAudioContext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Resetar estado do mock
    mockUseAudioReturn.isReady = false;
    mockUseAudioReturn.isInitializing = false;
    mockUseAudioReturn.error = null;
    
    // Configurar mockInitialize para atualizar estado e AudioContext
    mockUseAudioReturn.initialize = vi.fn(async () => {
      mockUseAudioReturn.isInitializing = true;
      try {
        // Simular inicialização
        await unifiedAudioService.ensureInitialized();
        unifiedAudioService.markUserInteraction();
        
        // Simular AudioContext ficando "running" após interação
        const mockRunningContext = {
          state: 'running' as AudioContextState,
          resume: vi.fn().mockResolvedValue(undefined),
          destination: { channelCount: 2 },
          currentTime: 0,
        };
        vi.mocked(unifiedAudioService.getAudioContext).mockReturnValue(mockRunningContext as any);
        
        mockUseAudioReturn.isReady = true;
        mockUseAudioReturn.isInitializing = false;
      } catch (err) {
        mockUseAudioReturn.error = err as Error;
        mockUseAudioReturn.isInitializing = false;
      }
    });
    
    // Mock AudioContext inicialmente suspenso (comportamento padrão do Chrome)
    mockAudioContext = {
      state: 'suspended' as AudioContextState,
      resume: vi.fn().mockResolvedValue(undefined),
      destination: {
        channelCount: 2,
      },
      currentTime: 0,
    };

    // Configurar mock inicial: AudioContext suspenso
    vi.mocked(unifiedAudioService.getAudioContext).mockReturnValue(mockAudioContext);
    vi.mocked(unifiedAudioService.ensureInitialized).mockResolvedValue(undefined);
    vi.mocked(unifiedAudioService.markUserInteraction).mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does NOT start AudioContext before user interaction', async () => {
    // Renderizar componente
    render(<AudioInitButton />);

    // Verificar que AudioContext está suspenso antes da interação
    const audioContext = unifiedAudioService.getAudioContext();
    expect(audioContext).toBeDefined();
    expect(audioContext?.state).not.toBe('running');
    expect(audioContext?.state).toBe('suspended');
  });

  it('starts AudioContext after user click', async () => {
    const user = userEvent.setup();
    
    // Renderizar componente
    render(<AudioInitButton />);

    // Verificar estado inicial: suspenso
    let audioContext = unifiedAudioService.getAudioContext();
    expect(audioContext?.state).toBe('suspended');

    // Encontrar e clicar no botão "Ativar áudio"
    const activateButton = screen.getByText('Ativar Áudio');
    await user.click(activateButton);

    // Aguardar inicialização
    await waitFor(
      () => {
        audioContext = unifiedAudioService.getAudioContext();
        expect(audioContext?.state).toBe('running');
      },
      { timeout: 2000 }
    );

    // Verificar que AudioContext está running após interação
    audioContext = unifiedAudioService.getAudioContext();
    expect(audioContext?.state).toBe('running');
    
    // Verificar que markUserInteraction foi chamado
    expect(unifiedAudioService.markUserInteraction).toHaveBeenCalled();
    
    // Verificar que ensureInitialized foi chamado
    expect(unifiedAudioService.ensureInitialized).toHaveBeenCalled();
  });

  it('does not show button when audio is already ready', () => {
    // Mock: áudio já está pronto
    mockUseAudioReturn.isReady = true;
    const mockReadyContext = {
      state: 'running' as AudioContextState,
      resume: vi.fn().mockResolvedValue(undefined),
      destination: { channelCount: 2 },
      currentTime: 0,
    };
    vi.mocked(unifiedAudioService.getAudioContext).mockReturnValue(mockReadyContext as any);

    // Renderizar componente
    render(<AudioInitButton />);

    // Botão não deve estar visível quando áudio está pronto
    expect(screen.queryByText('Ativar Áudio')).not.toBeInTheDocument();
  });

  it('calls resume() on AudioContext after user interaction', async () => {
    const user = userEvent.setup();
    const resumeSpy = vi.fn().mockResolvedValue(undefined);
    
    // Mock AudioContext com resume spy
    mockAudioContext.resume = resumeSpy;
    vi.mocked(unifiedAudioService.getAudioContext).mockReturnValue(mockAudioContext);

    // Renderizar componente
    render(<AudioInitButton />);

    // Clicar no botão
    const activateButton = screen.getByText('Ativar Áudio');
    await user.click(activateButton);

    // Aguardar e verificar que resume foi chamado
    await waitFor(
      () => {
        expect(resumeSpy).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );
  });

  it('handles initialization errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock: ensureInitialized lança erro
    vi.mocked(unifiedAudioService.ensureInitialized).mockRejectedValue(
      new Error('Failed to initialize audio')
    );

    // Renderizar componente
    render(<AudioInitButton />);

    // Clicar no botão
    const activateButton = screen.getByText('Ativar Áudio');
    await user.click(activateButton);

    // Aguardar e verificar que erro é exibido
    await waitFor(
      () => {
        expect(screen.getByText('Erro de Áudio')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});
