import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { offlineCacheService } from '@/services/OfflineCacheService';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [stats, setStats] = useState(offlineCacheService.getStats());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      updateStats();
      toast.success('Conexão restaurada!');
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateStats();
      toast.warning('Modo offline ativado');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Atualizar stats periodicamente
    const interval = setInterval(updateStats, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const updateStats = () => {
    setStats(offlineCacheService.getStats());
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await offlineCacheService.syncPendingItems();
      updateStats();
      toast.success('Sincronização completa!');
    } catch (error) {
      toast.error('Erro na sincronização');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {(!isOnline || stats.pendingSync > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              {/* Status Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isOnline ? 'bg-green-500/20' : 'bg-orange-500/20'
              }`}>
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-400" />
                ) : (
                  <WifiOff className="w-5 h-5 text-orange-400" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">
                  {isOnline ? 'Online' : 'Modo Offline'}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {stats.pendingSync > 0 && (
                    <>
                      <CloudOff className="w-3 h-3" />
                      <span>{stats.pendingSync} pendente{stats.pendingSync > 1 ? 's' : ''}</span>
                    </>
                  )}
                  {stats.cachedSongs > 0 && (
                    <>
                      <span>•</span>
                      <span>{stats.cachedSongs} música{stats.cachedSongs > 1 ? 's' : ''} em cache</span>
                    </>
                  )}
                </div>
              </div>

              {/* Sync Button */}
              {isOnline && stats.pendingSync > 0 && (
                <Button
                  size="sm"
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
