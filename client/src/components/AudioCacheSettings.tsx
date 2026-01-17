import { Download, Trash2, HardDrive, Check, Loader2 } from 'lucide-react';
import { useAudioCache, InstrumentType } from '@/hooks/useAudioCache';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';

export function AudioCacheSettings() {
  const {
    isSupported,
    cachedInstruments,
    isDownloading,
    downloadProgress,
    cacheInstrument,
    clearInstrumentCache,
    clearAllCache,
    getCacheSize,
  } = useAudioCache();

  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    loadCacheSize();
  }, [cachedInstruments]);

  const loadCacheSize = async () => {
    const size = await getCacheSize();
    setCacheSize(size);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getInstrumentLabel = (instrument: InstrumentType): string => {
    const labels: Record<InstrumentType, string> = {
      acoustic_guitar_nylon: 'Violão Nylon',
      acoustic_guitar_steel: 'Violão Aço',
      acoustic_grand_piano: 'Piano',
    };
    return labels[instrument];
  };

  if (!isSupported) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-slate-400">
          <HardDrive className="w-5 h-5" />
          <div>
            <p className="font-medium">Cache não suportado</p>
            <p className="text-sm">Seu navegador não suporta cache offline</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-500 to-cyan-500 p-2 rounded-lg">
            <HardDrive className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Cache de Áudio</h3>
            <p className="text-sm text-slate-400">
              Baixe instrumentos para uso offline
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm text-slate-400">Espaço usado</p>
          <p className="text-white font-semibold">{formatBytes(cacheSize)}</p>
        </div>
      </div>

      {isDownloading && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            <p className="text-purple-400 text-sm font-medium">
              Baixando... {Math.round(downloadProgress)}%
            </p>
          </div>
          <Progress value={downloadProgress} className="h-2" />
        </div>
      )}

      <div className="border-t border-slate-800 pt-6 space-y-3">
        {cachedInstruments.map((status) => (
          <div
            key={status.instrument}
            className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                status.cached
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {status.cached ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-white font-medium">
                  {getInstrumentLabel(status.instrument)}
                </p>
                <p className="text-sm text-slate-400">
                  {status.cached ? 'Disponível offline' : 'Não baixado'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {status.cached ? (
                <Button
                  onClick={() => clearInstrumentCache(status.instrument)}
                  size="sm"
                  variant="outline"
                  className="text-red-400 border-red-400/20 hover:bg-red-400/10"
                  disabled={isDownloading}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Limpar
                </Button>
              ) : (
                <Button
                  onClick={() => cacheInstrument(status.instrument)}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                  disabled={isDownloading}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Baixar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800 pt-6">
        <Button
          onClick={clearAllCache}
          variant="outline"
          size="sm"
          className="w-full text-red-400 border-red-400/20 hover:bg-red-400/10"
          disabled={isDownloading || cachedInstruments.every(s => !s.cached)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Limpar Todo o Cache
        </Button>
      </div>

      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
        <p className="text-cyan-400 text-sm">
          <strong>💡 Dica:</strong> Baixe os instrumentos que você mais usa para praticar offline
          sem depender de conexão com a internet.
        </p>
      </div>
    </Card>
  );
}
