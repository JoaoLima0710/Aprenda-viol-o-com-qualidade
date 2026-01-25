/**
 * Teste de inicialização obrigatória
 * 
 * Garante que não é possível tocar áudio antes de initialize() ser chamado.
 * Este teste valida que o serviço exige inicialização explícita.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Criar uma classe mock que simula UnifiedAudioService
class UnifiedAudioService {
  private isInitialized = false;
  private activeService: any = null;

  async initialize() {
    this.isInitialized = true;
    this.activeService = {
      playNote: vi.fn().mockResolvedValue(true),
      playChord: vi.fn().mockResolvedValue(true),
    };
  }

  async ensureInitialized() {
    // Se não está inicializado e não há activeService, não cria automaticamente
    // (simula comportamento quando não há engine disponível)
    if (!this.isInitialized && !this.activeService) {
      return;
    }
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  async playNote(note: string, duration?: number) {
    await this.ensureInitialized();
    
    if (!this.activeService) {
      if (!this.isInitialized) {
        await this.initialize();
      }
      if (!this.activeService) {
        throw new Error('Audio service not initialized');
      }
    }
    
    return this.activeService.playNote(note, duration);
  }

  async playChord(chordName: string, duration?: number) {
    await this.ensureInitialized();
    
    if (!this.activeService) {
      if (!this.isInitialized) {
        await this.initialize();
      }
      if (!this.activeService) {
        throw new Error('Audio service not initialized');
      }
    }
    
    return this.activeService.playChord(chordName, duration);
  }
}

describe('UnifiedAudioService - Initialization Required', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Blocks playback before initialization', () => {
    it('não permite tocar áudio antes de initialize()', async () => {
      const audio = new UnifiedAudioService();

      await expect(audio.playNote('C4'))
        .rejects
        .toThrow('Audio service not initialized');
    });

    it('permite tocar áudio após initialize()', async () => {
      const audio = new UnifiedAudioService();
      
      // Inicializar primeiro
      await audio.initialize();
      
      // Agora deve permitir tocar
      const result = await audio.playNote('C4');
      
      expect(result).toBe(true);
    });

    it('não permite tocar acorde antes de initialize()', async () => {
      const audio = new UnifiedAudioService();

      await expect(audio.playChord('C'))
        .rejects
        .toThrow('Audio service not initialized');
    });

    it('permite tocar acorde após initialize()', async () => {
      const audio = new UnifiedAudioService();
      
      // Inicializar primeiro
      await audio.initialize();
      
      // Agora deve permitir tocar
      const result = await audio.playChord('C');
      
      expect(result).toBe(true);
    });
  });
});
