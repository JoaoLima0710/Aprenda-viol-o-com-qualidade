import AudioEngine from './AudioEngine';
import { SampleData, AudioErrorType } from './types';

/**
 * SampleLoader - Gerencia carregamento e cache de samples de áudio
 */
class SampleLoader {
  private static instance: SampleLoader | null = null;

  private audioEngine: AudioEngine;
  private cache: Map<string, SampleData> = new Map();
  private loadingPromises: Map<string, Promise<SampleData>> = new Map();
  private preloadQueue: string[] = [];
  private isPreloading: boolean = false;

  // Configurações
  private readonly MAX_CACHE_SIZE = 100; // Máximo de samples em cache
  private readonly PRELOAD_BATCH_SIZE = 5; // Samples por batch de preload

  private constructor() {
    this.audioEngine = AudioEngine.getInstance();
  }

  public static getInstance(): SampleLoader {
    if (!SampleLoader.instance) {
      SampleLoader.instance = new SampleLoader();
    }
    return SampleLoader.instance;
  }

  /**
   * Carrega um sample de áudio
   */
  public async loadSample(url: string): Promise<SampleData> {
    // Verificar cache primeiro
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    // Verificar se já está carregando
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    // Criar promise de carregamento
    const loadPromise = this.fetchAndDecode(url);
    this.loadingPromises.set(url, loadPromise);

    try {
      const sampleData = await loadPromise;

      // Gerenciar tamanho do cache
      this.manageCacheSize();

      // Adicionar ao cache
      this.cache.set(url, sampleData);

      return sampleData;
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  /**
   * Busca e decodifica um arquivo de áudio
   */
  private async fetchAndDecode(url: string): Promise<SampleData> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioContext = this.audioEngine.getContext();

      // Decodificar o áudio
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      return {
        buffer: audioBuffer,
        duration: audioBuffer.duration,
        loaded: true,
      };
    } catch (error) {
      console.error(`[SampleLoader] Erro ao carregar ${url}:`, error);
      throw this.createError('SAMPLE_LOAD_FAILED', `Falha ao carregar sample: ${url}`, error as Error);
    }
  }

  /**
   * Pré-carrega uma lista de samples
   */
  public async preloadSamples(urls: string[]): Promise<void> {
    this.preloadQueue.push(...urls.filter(url => !this.cache.has(url)));

    if (!this.isPreloading) {
      await this.processPreloadQueue();
    }
  }

  /**
   * Processa a fila de preload em batches
   */
  private async processPreloadQueue(): Promise<void> {
    this.isPreloading = true;

    while (this.preloadQueue.length > 0) {
      const batch = this.preloadQueue.splice(0, this.PRELOAD_BATCH_SIZE);

      await Promise.allSettled(
        batch.map(url => this.loadSample(url))
      );

      // Dar tempo para outras operações
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.isPreloading = false;
  }

  /**
   * Pré-carrega samples de acordes
   * Exclui acordes bloqueados (sem samples disponíveis)
   */
  public async preloadChordSamples(): Promise<void> {
    // Lista de acordes bloqueados (samples não disponíveis)
    const BLOCKED_CHORDS = new Set(['B7', 'E7', 'G7']);

    const chordNames = [
      'A', 'Am', 'A7',
      'B', 'Bm', // B7 bloqueado
      'C', 'Cm', 'C7',
      'D', 'Dm', 'D7',
      'E', 'Em', // E7 bloqueado
      'F', 'Fm', // F7 bloqueado (arquivo faltando)
      'G', 'Gm', // G7 bloqueado
    ].filter(chord => !BLOCKED_CHORDS.has(chord));

    const urls = chordNames.map(chord => `/samples/chords/${chord}.wav`);
    await this.preloadSamples(urls);
  }

  /**
   * Pré-carrega samples de notas individuais
   */
  public async preloadNoteSamples(): Promise<void> {
    const notes = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']; // Cordas soltas
    const frets = [0, 1, 2, 3, 4, 5]; // Primeiras casas

    const urls: string[] = [];

    for (const note of notes) {
      for (const fret of frets) {
        urls.push(`/samples/notes/${note}_fret${fret}.wav`);
      }
    }

    await this.preloadSamples(urls);
  }

  /**
   * Gera um sample sintetizado (fallback quando não há sample real)
   */
  public generateSynthesizedNote(frequency: number, duration: number = 1): SampleData {
    const audioContext = this.audioEngine.getContext();
    const sampleRate = audioContext.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Sintetizar som de violão simples (múltiplos harmônicos)
    const harmonics = [1, 2, 3, 4, 5, 6];
    const amplitudes = [1, 0.5, 0.25, 0.15, 0.1, 0.05];

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // Envelope ADSR simplificado
      const attack = 0.005;
      const decay = 0.1;
      const sustain = 0.7;
      const release = duration - 0.3;

      let envelope = 0;
      if (t < attack) {
        envelope = t / attack;
      } else if (t < attack + decay) {
        envelope = 1 - (1 - sustain) * ((t - attack) / decay);
      } else if (t < release) {
        envelope = sustain;
      } else {
        envelope = sustain * (1 - (t - release) / (duration - release));
      }

      // Somar harmônicos
      for (let h = 0; h < harmonics.length; h++) {
        sample += amplitudes[h] * Math.sin(2 * Math.PI * frequency * harmonics[h] * t);
      }

      data[i] = sample * envelope * 0.3;
    }

    return {
      buffer,
      duration,
      loaded: true,
    };
  }

  /**
   * Gera um sample de clique para metrônomo
   */
  public generateClickSound(frequency: number = 1000, duration: number = 0.05): SampleData {
    const audioContext = this.audioEngine.getContext();
    const sampleRate = audioContext.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Envelope exponencial
      const envelope = Math.exp(-t * 50);
      // Tom puro com leve ruído
      const tone = Math.sin(2 * Math.PI * frequency * t);
      const noise = (Math.random() * 2 - 1) * 0.1;
      data[i] = (tone + noise) * envelope * 0.5;
    }

    return {
      buffer,
      duration,
      loaded: true,
    };
  }

  /**
   * Gerencia o tamanho do cache
   */
  private manageCacheSize(): void {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Remover os mais antigos (FIFO)
      const keysToRemove = Array.from(this.cache.keys()).slice(0, 10);
      keysToRemove.forEach(key => this.cache.delete(key));
    }
  }

  /**
   * Verifica se um sample está em cache
   */
  public isCached(url: string): boolean {
    return this.cache.has(url);
  }

  /**
   * Retorna estatísticas do cache
   */
  public getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: 0, // Implementar tracking se necessário
    };
  }

  /**
   * Limpa o cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Cria erro padronizado
   */
  private createError(code: AudioErrorType['code'], message: string, originalError?: Error): AudioErrorType {
    return { code, message, originalError };
  }
}

export default SampleLoader;
