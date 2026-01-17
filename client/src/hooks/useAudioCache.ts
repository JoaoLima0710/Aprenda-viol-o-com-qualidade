import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export type InstrumentType = 'acoustic_guitar_nylon' | 'acoustic_guitar_steel' | 'acoustic_grand_piano';

interface CacheStatus {
  instrument: InstrumentType;
  cached: boolean;
  size?: number;
  timestamp?: number;
}

export function useAudioCache() {
  const [isSupported, setIsSupported] = useState(false);
  const [cachedInstruments, setCachedInstruments] = useState<CacheStatus[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    // Check if Cache API is supported
    if ('caches' in window) {
      setIsSupported(true);
      loadCacheStatus();
    }
  }, []);

  const loadCacheStatus = async () => {
    if (!isSupported) return;

    const instruments: InstrumentType[] = [
      'acoustic_guitar_nylon',
      'acoustic_guitar_steel',
      'acoustic_grand_piano',
    ];

    const statuses: CacheStatus[] = [];

    for (const instrument of instruments) {
      const cached = await isInstrumentCached(instrument);
      statuses.push({
        instrument,
        cached,
      });
    }

    setCachedInstruments(statuses);
  };

  const isInstrumentCached = async (instrument: InstrumentType): Promise<boolean> => {
    try {
      const cache = await caches.open('musictutor-audio-cache');
      const keys = await cache.keys();
      
      // Check if any soundfont files for this instrument are cached
      const instrumentCached = keys.some(request => 
        request.url.includes(instrument) || 
        request.url.includes('soundfont')
      );

      return instrumentCached;
    } catch (error) {
      console.error('[AudioCache] Error checking cache:', error);
      return false;
    }
  };

  const cacheInstrument = async (instrument: InstrumentType) => {
    if (!isSupported) {
      toast.error('Cache não suportado neste navegador');
      return false;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      toast.info(`Baixando ${getInstrumentLabel(instrument)}...`, {
        description: 'Isso pode levar alguns minutos',
        duration: 5000,
      });

      // Soundfont URLs (these are CDN URLs used by soundfont-player)
      const soundfontUrls = getSoundfontUrls(instrument);

      const cache = await caches.open('musictutor-audio-cache');
      let downloaded = 0;

      for (const url of soundfontUrls) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
            downloaded++;
            setDownloadProgress((downloaded / soundfontUrls.length) * 100);
          }
        } catch (error) {
          console.warn(`[AudioCache] Failed to cache ${url}:`, error);
        }
      }

      // Update cache status
      await loadCacheStatus();

      toast.success(`${getInstrumentLabel(instrument)} baixado! 🎵`, {
        description: 'Agora você pode usar offline',
      });

      console.log(`[AudioCache] Cached ${instrument}: ${downloaded}/${soundfontUrls.length} files`);
      return true;
    } catch (error) {
      console.error('[AudioCache] Failed to cache instrument:', error);
      toast.error('Erro ao baixar instrumento', {
        description: 'Tente novamente mais tarde',
      });
      return false;
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const clearInstrumentCache = async (instrument: InstrumentType) => {
    try {
      const cache = await caches.open('musictutor-audio-cache');
      const keys = await cache.keys();

      let deleted = 0;
      for (const request of keys) {
        if (request.url.includes(instrument)) {
          await cache.delete(request);
          deleted++;
        }
      }

      await loadCacheStatus();

      toast.success(`Cache de ${getInstrumentLabel(instrument)} limpo`, {
        description: `${deleted} arquivo(s) removido(s)`,
      });

      console.log(`[AudioCache] Cleared ${instrument}: ${deleted} files`);
      return true;
    } catch (error) {
      console.error('[AudioCache] Failed to clear cache:', error);
      toast.error('Erro ao limpar cache');
      return false;
    }
  };

  const clearAllCache = async () => {
    try {
      await caches.delete('musictutor-audio-cache');
      await loadCacheStatus();

      toast.success('Todo cache de áudio limpo');
      console.log('[AudioCache] All audio cache cleared');
      return true;
    } catch (error) {
      console.error('[AudioCache] Failed to clear all cache:', error);
      toast.error('Erro ao limpar cache');
      return false;
    }
  };

  const getCacheSize = async (): Promise<number> => {
    if (!('storage' in navigator && 'estimate' in navigator.storage)) {
      return 0;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    } catch (error) {
      console.error('[AudioCache] Failed to get cache size:', error);
      return 0;
    }
  };

  return {
    isSupported,
    cachedInstruments,
    isDownloading,
    downloadProgress,
    cacheInstrument,
    clearInstrumentCache,
    clearAllCache,
    getCacheSize,
    loadCacheStatus,
  };
}

// Helper functions

function getInstrumentLabel(instrument: InstrumentType): string {
  const labels: Record<InstrumentType, string> = {
    acoustic_guitar_nylon: 'Violão Nylon',
    acoustic_guitar_steel: 'Violão Aço',
    acoustic_grand_piano: 'Piano',
  };
  return labels[instrument];
}

function getSoundfontUrls(instrument: InstrumentType): string[] {
  // Soundfont-player uses MusyngKite soundfonts from gleitz/midi-js-soundfonts
  // These are the base URLs for the soundfont files
  const baseUrl = 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite';
  
  // Each instrument has multiple note files (mp3 format)
  // For simplicity, we'll cache the main instrument file
  // In production, you'd want to cache all individual note files
  
  const urls: string[] = [];
  
  // Add main instrument URL
  urls.push(`${baseUrl}/${instrument}-mp3.js`);
  
  // In a real implementation, you would:
  // 1. Fetch the instrument manifest
  // 2. Get all individual note URLs (e.g., C3.mp3, D3.mp3, etc.)
  // 3. Cache each note file
  
  // For now, we'll just cache the main file as a proof of concept
  return urls;
}
