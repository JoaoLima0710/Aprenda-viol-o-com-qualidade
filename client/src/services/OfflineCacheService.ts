/**
 * Offline Cache Service
 * Gerencia cache de músicas e sincronização de progresso offline
 */

import { Song } from '@/data/songs';
import { PracticeSession } from './AIAssistantService';

interface CachedSong extends Song {
  cachedAt: number;
  lastAccessed: number;
}

interface PendingSync {
  id: string;
  type: 'practice_session' | 'favorite' | 'progress';
  data: any;
  timestamp: number;
  synced: boolean;
}

class OfflineCacheService {
  private readonly CACHE_KEY = 'musictutor_cached_songs';
  private readonly PENDING_SYNC_KEY = 'musictutor_pending_sync';
  private readonly MAX_CACHED_SONGS = 20;
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias

  /**
   * Verifica se está online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Cacheia uma música para uso offline
   */
  cacheSong(song: Song): void {
    const cached = this.getCachedSongs();
    
    const cachedSong: CachedSong = {
      ...song,
      cachedAt: Date.now(),
      lastAccessed: Date.now(),
    };

    // Remove música antiga se já existe
    const filtered = cached.filter(s => s.id !== song.id);
    
    // Adiciona nova versão
    filtered.unshift(cachedSong);

    // Limita número de músicas em cache
    const limited = filtered.slice(0, this.MAX_CACHED_SONGS);

    localStorage.setItem(this.CACHE_KEY, JSON.stringify(limited));
  }

  /**
   * Obtém músicas em cache
   */
  getCachedSongs(): CachedSong[] {
    const data = localStorage.getItem(this.CACHE_KEY);
    if (!data) return [];

    const songs: CachedSong[] = JSON.parse(data);
    
    // Remove músicas expiradas
    const now = Date.now();
    const valid = songs.filter(s => now - s.cachedAt < this.CACHE_DURATION);

    if (valid.length !== songs.length) {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(valid));
    }

    return valid;
  }

  /**
   * Obtém música do cache
   */
  getCachedSong(songId: string): CachedSong | null {
    const songs = this.getCachedSongs();
    const song = songs.find(s => s.id === songId);

    if (song) {
      // Atualiza último acesso
      song.lastAccessed = Date.now();
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(songs));
    }

    return song || null;
  }

  /**
   * Remove música do cache
   */
  removeCachedSong(songId: string): void {
    const songs = this.getCachedSongs();
    const filtered = songs.filter(s => s.id !== songId);
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(filtered));
  }

  /**
   * Limpa todo o cache
   */
  clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }

  /**
   * Obtém tamanho do cache (aproximado em MB)
   */
  getCacheSize(): number {
    const data = localStorage.getItem(this.CACHE_KEY);
    if (!data) return 0;
    
    // Tamanho aproximado em MB
    return new Blob([data]).size / (1024 * 1024);
  }

  /**
   * Adiciona item à fila de sincronização
   */
  addToSyncQueue(type: PendingSync['type'], data: any): void {
    const queue = this.getSyncQueue();
    
    const item: PendingSync = {
      id: `${type}_${Date.now()}_${Math.random()}`,
      type,
      data,
      timestamp: Date.now(),
      synced: false,
    };

    queue.push(item);
    localStorage.setItem(this.PENDING_SYNC_KEY, JSON.stringify(queue));

    // Tentar sincronizar imediatamente se estiver online
    if (this.isOnline()) {
      this.syncPendingItems();
    }
  }

  /**
   * Obtém fila de sincronização
   */
  getSyncQueue(): PendingSync[] {
    const data = localStorage.getItem(this.PENDING_SYNC_KEY);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Sincroniza itens pendentes
   */
  async syncPendingItems(): Promise<void> {
    if (!this.isOnline()) {
      console.log('📴 Offline - sincronização adiada');
      return;
    }

    const queue = this.getSyncQueue();
    const pending = queue.filter(item => !item.synced);

    if (pending.length === 0) {
      return;
    }

    console.log(`🔄 Sincronizando ${pending.length} itens...`);

    // Simular sincronização (em produção, fazer chamadas API reais)
    for (const item of pending) {
      try {
        await this.syncItem(item);
        item.synced = true;
      } catch (error) {
        console.error(`❌ Erro ao sincronizar ${item.id}:`, error);
      }
    }

    // Atualizar fila
    localStorage.setItem(this.PENDING_SYNC_KEY, JSON.stringify(queue));

    // Remover itens sincronizados antigos (mais de 7 dias)
    const now = Date.now();
    const filtered = queue.filter(item => 
      !item.synced || (now - item.timestamp < 7 * 24 * 60 * 60 * 1000)
    );

    localStorage.setItem(this.PENDING_SYNC_KEY, JSON.stringify(filtered));

    console.log('✅ Sincronização completa');
  }

  /**
   * Sincroniza um item individual
   */
  private async syncItem(item: PendingSync): Promise<void> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 100));

    // Em produção, fazer chamada API real baseada no tipo
    switch (item.type) {
      case 'practice_session':
        console.log('📊 Sincronizando sessão de prática:', item.data);
        // await api.savePracticeSession(item.data);
        break;
      
      case 'favorite':
        console.log('❤️ Sincronizando favorito:', item.data);
        // await api.toggleFavorite(item.data);
        break;
      
      case 'progress':
        console.log('📈 Sincronizando progresso:', item.data);
        // await api.saveProgress(item.data);
        break;
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): {
    cachedSongs: number;
    cacheSize: number;
    pendingSync: number;
    isOnline: boolean;
  } {
    return {
      cachedSongs: this.getCachedSongs().length,
      cacheSize: this.getCacheSize(),
      pendingSync: this.getSyncQueue().filter(i => !i.synced).length,
      isOnline: this.isOnline(),
    };
  }

  /**
   * Cacheia músicas mais praticadas automaticamente
   */
  autoCache(songs: Song[], practiceHistory: PracticeSession[]): void {
    // Contar práticas por música
    const songPracticeCount = new Map<string, number>();
    
    practiceHistory
      .filter(s => s.type === 'song')
      .forEach(session => {
        const count = songPracticeCount.get(session.itemId) || 0;
        songPracticeCount.set(session.itemId, count + 1);
      });

    // Ordenar por mais praticadas
    const sorted = Array.from(songPracticeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Top 10

    // Cachear as mais praticadas
    sorted.forEach(([songId]) => {
      const song = songs.find(s => s.id === songId);
      if (song) {
        this.cacheSong(song);
      }
    });
  }

  /**
   * Registra listener para mudanças de conectividade
   */
  setupConnectivityListener(): void {
    window.addEventListener('online', () => {
      console.log('🌐 Conexão restaurada - sincronizando...');
      this.syncPendingItems();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Conexão perdida - modo offline ativado');
    });
  }
}

export const offlineCacheService = new OfflineCacheService();

// Inicializar listener de conectividade
offlineCacheService.setupConnectivityListener();
