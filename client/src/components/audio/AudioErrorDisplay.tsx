/**
 * 🛡️ Audio Error Display Component
 * 
 * Exibe erros de áudio de forma clara e oferece ações de recuperação.
 * 
 * OBJETIVO:
 * - Nunca falhar silenciosamente
 * - Mensagens claras e acionáveis
 * - Retry manual
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Settings, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { audioResilienceService } from '@/services/AudioResilienceService';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import type { AudioFailure } from '@/services/AudioResilienceService';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioErrorDisplayProps {
  onDismiss?: () => void;
  compact?: boolean;
}

export function AudioErrorDisplay({ onDismiss, compact = false }: AudioErrorDisplayProps) {
  const [failures, setFailures] = useState<AudioFailure[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Atualizar lista de falhas periodicamente
    const updateFailures = () => {
      const recentFailures = audioResilienceService
        .getFailureHistory()
        .filter(f => Date.now() - f.timestamp < 60000); // Últimos 60 segundos
      setFailures(recentFailures);
    };

    updateFailures();
    const interval = setInterval(updateFailures, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const success = await audioResilienceService.manualRetry('manual');
      if (success) {
        setFailures([]);
        onDismiss?.();
      }
    } catch (error) {
      console.error('[AudioErrorDisplay] Erro no retry:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDismiss = () => {
    audioResilienceService.clearFailureHistory();
    setFailures([]);
    onDismiss?.();
  };

  if (failures.length === 0) {
    return null;
  }

  // Pegar a falha mais recente
  const latestFailure = failures[failures.length - 1];

  if (compact) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-20 right-4 z-50 max-w-sm"
        >
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-red-300 font-medium truncate">
                    {latestFailure.message}
                  </p>
                  {latestFailure.recoverable && (
                    <Button
                      onClick={handleRetry}
                      size="sm"
                      variant="outline"
                      className="mt-2 h-7 text-xs border-red-500/50 text-red-400 hover:bg-red-500/10"
                      disabled={isRetrying}
                    >
                      {isRetrying ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          Tentando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Tentar Novamente
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <Card className="bg-gray-900 border-red-500/30 max-w-md w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Erro de Áudio</CardTitle>
                  <Badge 
                    variant="outline" 
                    className={`mt-1 ${
                      latestFailure.recoverable 
                        ? 'border-yellow-500/50 text-yellow-400' 
                        : 'border-red-500/50 text-red-400'
                    }`}
                  >
                    {latestFailure.recoverable ? 'Recuperável' : 'Crítico'}
                  </Badge>
                </div>
              </div>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-300 mb-2">{latestFailure.message}</p>
              <p className="text-xs text-gray-500">
                Tipo: {latestFailure.type} • Tentativas: {latestFailure.retryCount}/{3}
              </p>
            </div>

            {latestFailure.recoverable && (
              <div className="flex gap-2">
                <Button
                  onClick={handleRetry}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                  disabled={isRetrying}
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Tentando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tentar Novamente
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    // Abrir configurações (se disponível)
                    window.location.href = '/settings';
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </Button>
              </div>
            )}

            {failures.length > 1 && (
              <div className="pt-2 border-t border-gray-700">
                <p className="text-xs text-gray-500 mb-2">
                  Outras falhas recentes ({failures.length - 1})
                </p>
                <div className="space-y-1">
                  {failures.slice(0, -1).reverse().map((failure, index) => (
                    <div key={index} className="text-xs text-gray-600 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-gray-600" />
                      {failure.type} - {new Date(failure.timestamp).toLocaleTimeString()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
