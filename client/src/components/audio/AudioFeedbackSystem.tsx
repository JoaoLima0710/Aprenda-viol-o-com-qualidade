import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Activity,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AudioSignal {
  level: number; // 0-1, intensidade do sinal
  quality: 'none' | 'weak' | 'ok' | 'good' | 'strong';
  stability: number; // 0-1, quão estável é o sinal
  pitch?: number; // frequência detectada
  targetPitch?: number; // frequência alvo
  centsOff?: number; // desvio em cents
  confidence: number; // 0-1, confiança da detecção
}

export interface AudioFeedbackProps {
  signal: AudioSignal;
  isListening: boolean;
  onPermissionRequest: () => void;
  onRetry: () => void;
  compact?: boolean;
  showDetailed?: boolean;
}

export function AudioFeedbackSystem({
  signal,
  isListening,
  onPermissionRequest,
  onRetry,
  compact = false,
  showDetailed = false
}: AudioFeedbackProps) {
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Simulação de checagem de permissões
  useEffect(() => {
    if (isListening && signal.quality === 'none' && signal.level < 0.01) {
      // Verificar se é problema de permissão
      navigator.permissions?.query({ name: 'microphone' as PermissionName })
        .then(result => {
          setPermissionStatus(result.state as any);
          if (result.state === 'denied') {
            setErrorMessage('Microfone bloqueado. Permita acesso nas configurações do navegador.');
            setShowError(true);
          }
        })
        .catch(() => {
          // Fallback para navegadores sem suporte
          setPermissionStatus('unknown');
        });
    }
  }, [isListening, signal.quality, signal.level]);

  const getSignalColor = (quality: string) => {
    switch (quality) {
      case 'strong':
      case 'good': return 'text-green-400';
      case 'ok': return 'text-yellow-400';
      case 'weak': return 'text-orange-400';
      case 'none': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSignalIcon = (quality: string) => {
    switch (quality) {
      case 'strong':
      case 'good':
      case 'ok': return <CheckCircle2 className="w-4 h-4" />;
      case 'weak': return <AlertTriangle className="w-4 h-4" />;
      case 'none': return <MicOff className="w-4 h-4" />;
      default: return <Mic className="w-4 h-4" />;
    }
  };

  const getStabilityColor = (stability: number) => {
    if (stability >= 0.8) return 'bg-green-500';
    if (stability >= 0.6) return 'bg-yellow-500';
    if (stability >= 0.4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPitchAccuracyColor = (centsOff?: number) => {
    if (!centsOff) return 'text-gray-400';
    if (Math.abs(centsOff) <= 5) return 'text-green-400';
    if (Math.abs(centsOff) <= 15) return 'text-yellow-400';
    if (Math.abs(centsOff) <= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  const formatFrequency = (freq?: number) => {
    if (!freq) return '--';
    return freq.toFixed(1) + ' Hz';
  };

  const formatCents = (cents?: number) => {
    if (!cents) return '--';
    const sign = cents > 0 ? '+' : '';
    return sign + cents.toFixed(0) + '¢';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
        {/* Signal indicator */}
        <div className={`flex items-center gap-2 ${getSignalColor(signal.quality)}`}>
          {getSignalIcon(signal.quality)}
          <span className="text-sm font-medium capitalize">
            {signal.quality === 'none' ? 'Sem sinal' :
             signal.quality === 'weak' ? 'Fraco' :
             signal.quality === 'ok' ? 'Ok' :
             signal.quality === 'good' ? 'Bom' :
             'Forte'}
          </span>
        </div>

        {/* Level bar */}
        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            style={{ width: `${signal.level * 100}%` }}
            animate={{ width: `${signal.level * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Stability indicator */}
        {signal.stability > 0 && (
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-gray-400" />
            <div className="w-8 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getStabilityColor(signal.stability)}`}
                style={{ width: `${signal.stability * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main feedback card */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${getSignalColor(signal.quality)} bg-current/10`}>
                {getSignalIcon(signal.quality)}
              </div>
              <div>
                <h3 className="font-semibold text-white">Detecção de Áudio</h3>
                <p className="text-sm text-gray-400">
                  {isListening ? 'Ouvindo...' : 'Pausado'}
                </p>
              </div>
            </div>

            <Badge
              variant="outline"
              className={`${getSignalColor(signal.quality)} border-current/30`}
            >
              {signal.quality === 'none' ? 'Sem sinal' :
               signal.quality === 'weak' ? 'Sinal fraco' :
               signal.quality === 'ok' ? 'Sinal ok' :
               signal.quality === 'good' ? 'Sinal bom' :
               'Sinal forte'}
            </Badge>
          </div>

          {/* Three-layer feedback */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Signal Level */}
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">Nível do Sinal</div>
              <div className="relative">
                <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
                    style={{ width: `${signal.level * 100}%` }}
                    animate={{ width: `${signal.level * 100}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-mono text-white drop-shadow">
                    {Math.round(signal.level * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Stability */}
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">Estabilidade</div>
              <div className="relative">
                <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full transition-all duration-300 ${getStabilityColor(signal.stability)}`}
                    style={{ width: `${signal.stability * 100}%` }}
                    animate={{ width: `${signal.stability * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-mono text-white drop-shadow">
                    {Math.round(signal.stability * 100)}%
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {signal.stability >= 0.8 ? 'Estável' :
                 signal.stability >= 0.6 ? 'Razoável' :
                 signal.stability >= 0.4 ? 'Instável' : 'Muito instável'}
              </div>
            </div>

            {/* 3. Pitch Accuracy */}
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">Afinação</div>
              <div className="relative">
                <div className="w-full h-8 bg-gray-700 rounded-full overflow-hidden flex items-center">
                  {/* Target zone indicator */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-8 bg-green-500/30 border-x-2 border-green-400 rounded" />

                  {/* Current position */}
                  {signal.centsOff !== undefined && (
                    <motion.div
                      className="w-1 h-6 bg-white rounded-full"
                      style={{
                        marginLeft: `${50 + (signal.centsOff / 50) * 40}%`
                      }}
                      animate={{
                        marginLeft: `${50 + (signal.centsOff / 50) * 40}%`
                      }}
                      transition={{ duration: 0.1 }}
                    />
                  )}
                </div>
              </div>
              <div className={`text-sm font-mono mt-1 ${getPitchAccuracyColor(signal.centsOff)}`}>
                {formatCents(signal.centsOff)}
              </div>
            </div>
          </div>

          {/* Detailed info */}
          {showDetailed && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Frequência detectada:</span>
                  <div className="font-mono text-white">{formatFrequency(signal.pitch)}</div>
                </div>
                <div>
                  <span className="text-gray-400">Frequência alvo:</span>
                  <div className="font-mono text-white">{formatFrequency(signal.targetPitch)}</div>
                </div>
                <div>
                  <span className="text-gray-400">Confiança:</span>
                  <div className="font-mono text-white">{Math.round(signal.confidence * 100)}%</div>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <div className={`font-medium ${getSignalColor(signal.quality)}`}>
                    {signal.quality === 'none' ? 'Aguardando sinal' :
                     signal.quality === 'weak' ? 'Sinal muito fraco' :
                     signal.quality === 'ok' ? 'Pronto para avaliar' :
                     signal.quality === 'good' ? 'Boa detecção' :
                     'Detecção excelente'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error states */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-400 mb-1">Problema de Áudio Detectado</h4>
                    <p className="text-sm text-red-300 mb-3">{errorMessage}</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={onPermissionRequest}
                        size="sm"
                        className="bg-red-500 hover:bg-red-600"
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        Permitir Microfone
                      </Button>
                      <Button
                        onClick={onRetry}
                        variant="outline"
                        size="sm"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        Tentar Novamente
                      </Button>
                      <Button
                        onClick={() => setShowError(false)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                      >
                        Fechar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips for better audio */}
      {signal.quality === 'weak' && !showError && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-400 mb-1">Dicas para Melhorar o Sinal</h4>
                <ul className="text-sm text-yellow-200 space-y-1">
                  <li>• Aproxime o microfone do instrumento</li>
                  <li>• Reduza ruído ambiente</li>
                  <li>• Use fones com microfone embutido</li>
                  <li>• Ajuste o volume do instrumento</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success feedback */}
      {signal.quality === 'good' || signal.quality === 'strong' && signal.stability > 0.8 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">Detecção funcionando perfeitamente!</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Hook para usar o sistema de feedback de áudio
export function useAudioFeedback() {
  const [signal, setSignal] = useState<AudioSignal>({
    level: 0,
    quality: 'none',
    stability: 0,
    confidence: 0
  });

  const [isListening, setIsListening] = useState(false);

  // Simulação de detecção de áudio
  useEffect(() => {
    if (!isListening) return;

    const interval = setInterval(() => {
      // Simular sinal de áudio realista
      const baseLevel = Math.random() * 0.8;
      const stability = Math.random();
      const quality = baseLevel > 0.7 ? 'strong' :
                     baseLevel > 0.5 ? 'good' :
                     baseLevel > 0.3 ? 'ok' :
                     baseLevel > 0.1 ? 'weak' : 'none';

      const pitch = quality !== 'none' ? 440 + (Math.random() - 0.5) * 100 : undefined;
      const targetPitch = 440;
      const centsOff = pitch && targetPitch ? (Math.log2(pitch / targetPitch) * 1200) : undefined;

      setSignal({
        level: baseLevel,
        quality: quality as any,
        stability,
        pitch,
        targetPitch,
        centsOff,
        confidence: Math.min(1, baseLevel * 2)
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isListening]);

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop immediately
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  };

  const startListening = () => setIsListening(true);
  const stopListening = () => setIsListening(false);

  return {
    signal,
    isListening,
    startListening,
    stopListening,
    requestPermission
  };
}