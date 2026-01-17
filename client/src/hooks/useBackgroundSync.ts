import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface PracticeSession {
  id: string;
  type: 'chord' | 'scale' | 'song' | 'ear_training';
  duration: number; // minutes
  accuracy?: number; // percentage
  notesPlayed?: number;
  timestamp: number;
  synced: boolean;
}

export function useBackgroundSync() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSessions, setPendingSessions] = useState<PracticeSession[]>([]);

  useEffect(() => {
    // Check if Background Sync is supported
    if ('serviceWorker' in navigator) {
      // @ts-ignore - Background Sync API not in TypeScript types yet
      const syncSupported = 'sync' in ServiceWorkerRegistration.prototype;
      setIsSupported(syncSupported);
      loadPendingSessions();
    }

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPendingSessions = () => {
    const stored = localStorage.getItem('pending_practice_sessions');
    if (stored) {
      const sessions: PracticeSession[] = JSON.parse(stored);
      setPendingSessions(sessions.filter(s => !s.synced));
    }
  };

  const savePendingSessions = (sessions: PracticeSession[]) => {
    localStorage.setItem('pending_practice_sessions', JSON.stringify(sessions));
    setPendingSessions(sessions.filter(s => !s.synced));
  };

  const handleOnline = () => {
    console.log('[BackgroundSync] Back online, syncing...');
    toast.info('Conectado! Sincronizando progresso...', {
      duration: 2000,
    });
    syncPendingSessions();
  };

  const handleOffline = () => {
    console.log('[BackgroundSync] Offline mode');
    toast.warning('Modo offline ativado', {
      description: 'Seu progresso será sincronizado quando voltar online',
      duration: 3000,
    });
  };

  const savePracticeSession = async (session: Omit<PracticeSession, 'id' | 'timestamp' | 'synced'>) => {
    const newSession: PracticeSession = {
      ...session,
      id: generateId(),
      timestamp: Date.now(),
      synced: false,
    };

    // Save to localStorage
    const stored = localStorage.getItem('pending_practice_sessions');
    const sessions: PracticeSession[] = stored ? JSON.parse(stored) : [];
    sessions.push(newSession);
    savePendingSessions(sessions);

    console.log('[BackgroundSync] Practice session saved locally:', newSession);

    // Try to sync immediately if online
    if (navigator.onLine) {
      await syncPendingSessions();
    } else {
      // Register background sync
      if (isSupported) {
        try {
          const registration = await navigator.serviceWorker.ready;
          // @ts-ignore - Background Sync API not in TypeScript types yet
          await registration.sync?.register('sync-practice-data');
          console.log('[BackgroundSync] Background sync registered');
        } catch (error) {
          console.error('[BackgroundSync] Failed to register sync:', error);
        }
      }

      toast.info('Sessão salva offline', {
        description: 'Será sincronizada quando voltar online',
      });
    }

    return newSession;
  };

  const syncPendingSessions = async () => {
    const stored = localStorage.getItem('pending_practice_sessions');
    if (!stored) return;

    const sessions: PracticeSession[] = JSON.parse(stored);
    const unsynced = sessions.filter(s => !s.synced);

    if (unsynced.length === 0) {
      console.log('[BackgroundSync] No pending sessions to sync');
      return;
    }

    setIsSyncing(true);

    try {
      // In production, this would send to your backend API
      // For now, we'll simulate the sync
      console.log('[BackgroundSync] Syncing sessions:', unsynced);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mark all as synced
      const updatedSessions = sessions.map(s => ({
        ...s,
        synced: true,
      }));

      savePendingSessions(updatedSessions);

      toast.success(`${unsynced.length} sessão(ões) sincronizada(s)! ✅`, {
        description: 'Seu progresso foi salvo',
      });

      console.log('[BackgroundSync] Sync complete');
    } catch (error) {
      console.error('[BackgroundSync] Sync failed:', error);
      toast.error('Erro ao sincronizar', {
        description: 'Tentaremos novamente em breve',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const clearSyncedSessions = () => {
    const stored = localStorage.getItem('pending_practice_sessions');
    if (!stored) return;

    const sessions: PracticeSession[] = JSON.parse(stored);
    const unsynced = sessions.filter(s => !s.synced);
    savePendingSessions(unsynced);
  };

  const getPracticeStats = () => {
    const stored = localStorage.getItem('pending_practice_sessions');
    if (!stored) return { total: 0, synced: 0, pending: 0 };

    const sessions: PracticeSession[] = JSON.parse(stored);
    return {
      total: sessions.length,
      synced: sessions.filter(s => s.synced).length,
      pending: sessions.filter(s => !s.synced).length,
    };
  };

  return {
    isSupported,
    isSyncing,
    pendingSessions,
    savePracticeSession,
    syncPendingSessions,
    clearSyncedSessions,
    getPracticeStats,
  };
}

// Helper function to generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
