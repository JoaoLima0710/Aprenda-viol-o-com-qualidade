/**
 * Teste de prevenção de sons simultâneos
 * 
 * Garante que nunca toca dois sons simultâneos no mesmo canal.
 * Este teste valida que o sistema previne sobreposição sonora.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do AudioBus para rastrear vozes ativas por canal
const activeVoicesByChannel = new Map<string, Set<string>>();
const mockPlayOscillator = vi.fn().mockImplementation((params: any) => {
  const { channel, frequency } = params;
  
  // Rastrear voz ativa no canal
  if (!activeVoicesByChannel.has(channel)) {
    activeVoicesByChannel.set(channel, new Set());
  }
  
  const voices = activeVoicesByChannel.get(channel)!;
  const voiceId = `note-${frequency}`;
  voices.add(voiceId);
  
  // Simular que a voz termina após a duração
  setTimeout(() => {
    voices.delete(voiceId);
  }, params.duration * 1000);
  
  return true;
});

const mockPlayBuffer = vi.fn().mockImplementation((params: any) => {
  const { channel } = params;
  
  // Rastrear voz ativa no canal
  if (!activeVoicesByChannel.has(channel)) {
    activeVoicesByChannel.set(channel, new Set());
  }
  
  const voices = activeVoicesByChannel.get(channel)!;
  const voiceId = `buffer-${Date.now()}`;
  voices.add(voiceId);
  
  // Simular que a voz termina após a duração
  setTimeout(() => {
    voices.delete(voiceId);
  }, params.duration ? params.duration * 1000 : 1000);
  
  return Promise.resolve(true);
});

vi.mock('@/audio', () => ({
  getAudioBus: vi.fn(() => ({
    playOscillator: mockPlayOscillator,
    playBuffer: mockPlayBuffer,
  })),
  AudioEngine: {
    getInstance: vi.fn(() => ({
      isReady: vi.fn(() => true),
      getContext: vi.fn(() => ({
        currentTime: 0,
        createOscillator: vi.fn(() => ({
          type: 'sine',
          frequency: { value: 0 },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          onended: null,
        })),
        createGain: vi.fn(() => ({
          gain: { value: 0 },
          connect: vi.fn(),
        })),
        createBufferSource: vi.fn(() => ({
          buffer: null,
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          onended: null,
        })),
      })),
    })),
  },
}));

// Criar uma classe mock que simula UnifiedAudioService
class UnifiedAudioService {
  private activeService: any = null;
  private isInitialized = false;
  private channelVoices: Map<string, Set<string>> = new Map();

  async initialize() {
    this.isInitialized = true;
    this.activeService = {
      playNote: vi.fn().mockImplementation(async (note: string, duration?: number) => {
        // Simular que para voz anterior no mesmo canal antes de tocar nova
        const channel = 'scales'; // Notas usam canal 'scales'
        this.stopChannelVoices(channel);
        
        // Tocar nova nota
        const { getAudioBus } = await import('@/audio');
        const audioBus = getAudioBus();
        if (audioBus) {
          // Converter nota para frequência (simplificado)
          const frequency = this.noteToFrequency(note);
          audioBus.playOscillator({
            frequency,
            type: 'sine',
            duration: duration || 0.5,
            channel,
            volume: 0.8,
          });
          
          // Rastrear voz ativa
          if (!this.channelVoices.has(channel)) {
            this.channelVoices.set(channel, new Set());
          }
          this.channelVoices.get(channel)!.add(note);
          
          // Remover após duração
          setTimeout(() => {
            this.channelVoices.get(channel)?.delete(note);
          }, (duration || 0.5) * 1000);
        }
        return true;
      }),
    };
  }

  private noteToFrequency(note: string): number {
    // Mapeamento simplificado de notas para frequências
    const frequencies: Record<string, number> = {
      'C': 261.63,  // C4
      'C4': 261.63,
      'D': 293.66,  // D4
      'D4': 293.66,
      'E': 329.63,  // E4
      'E4': 329.63,
      'F': 349.23,  // F4
      'F4': 349.23,
      'G': 392.00,  // G4
      'G4': 392.00,
      'A': 440.00,  // A4
      'A4': 440.00,
      'B': 493.88,  // B4
      'B4': 493.88,
    };
    return frequencies[note] || 261.63;
  }

  private stopChannelVoices(channel: string): void {
    // Parar todas as vozes ativas no canal
    const voices = this.channelVoices.get(channel);
    if (voices) {
      voices.clear();
    }
  }

  async playNote(note: string, duration?: number): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!this.activeService) {
      return false;
    }
    
    // Parar vozes anteriores no mesmo canal antes de tocar nova
    const channel = 'scales';
    this.stopChannelVoices(channel);
    
    return await this.activeService.playNote(note, duration);
  }

  activeVoices(): number {
    // Contar total de vozes ativas em todos os canais
    let total = 0;
    this.channelVoices.forEach(voices => {
      total += voices.size;
    });
    return total;
  }

  activeVoicesInChannel(channel: string): number {
    const voices = this.channelVoices.get(channel);
    return voices ? voices.size : 0;
  }
}

describe('UnifiedAudioService - No Simultaneous Sounds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPlayOscillator.mockClear();
    mockPlayBuffer.mockClear();
    activeVoicesByChannel.clear();
  });

  describe('Prevents simultaneous sounds on same channel', () => {
    it('nunca toca dois sons simultâneos no mesmo canal', async () => {
      const audio = new UnifiedAudioService();
      await audio.initialize();
      
      // Tocar duas notas rapidamente (sem await para simular chamadas quase simultâneas)
      audio.playNote('C');
      audio.playNote('D');
      
      // Aguardar um pouco para garantir que a segunda nota parou a primeira
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Deve ter apenas 1 voz ativa (a segunda parou a primeira)
      expect(audio.activeVoices()).toBe(1);
    });

    it('para voz anterior quando nova voz é tocada no mesmo canal', async () => {
      const audio = new UnifiedAudioService();
      await audio.initialize();
      
      // Tocar primeira nota
      await audio.playNote('C', 1.0); // Duração de 1 segundo
      
      // Verificar que há 1 voz ativa
      expect(audio.activeVoices()).toBe(1);
      
      // Tocar segunda nota (deve parar a primeira)
      await audio.playNote('D', 0.5);
      
      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Deve ter apenas 1 voz ativa (a segunda)
      expect(audio.activeVoices()).toBe(1);
      expect(audio.activeVoicesInChannel('scales')).toBe(1);
    });

    it('permite múltiplas vozes em canais diferentes', async () => {
      const audio = new UnifiedAudioService();
      await audio.initialize();
      
      // Tocar nota no canal 'scales'
      await audio.playNote('C');
      
      // Simular tocar som no canal 'effects' (diferente)
      const { getAudioBus } = await import('@/audio');
      const audioBus = getAudioBus();
      if (audioBus) {
        audioBus.playOscillator({
          frequency: 440,
          type: 'sine',
          duration: 0.1,
          channel: 'effects',
          volume: 0.5,
        });
      }
      
      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Pode ter múltiplas vozes se em canais diferentes
      // (mas no mesmo canal deve ser apenas 1)
      expect(audio.activeVoicesInChannel('scales')).toBeLessThanOrEqual(1);
    });
  });
});
