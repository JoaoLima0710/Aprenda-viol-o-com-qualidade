import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Mic,
  MicOff,
  Settings,
  Target,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { chordDetectionService, ChordDetectionResult, StringAnalysis, ChordProblem } from '@/services/ChordDetectionService';
import { competenceSystem } from '@/services/CompetenceSystem';

interface RealtimeChordFeedbackProps {
  expectedChord: string | null;
  isActive: boolean;
  useAI?: boolean;
  onChordDetected?: (result: ChordDetectionResult) => void;
  onProblemDetected?: (problems: ChordProblem[]) => void;
  compact?: boolean;
  showDetailedAnalysis?: boolean;
}

export function RealtimeChordFeedback({
  expectedChord,
  isActive,
  useAI = true,
  onChordDetected,
  onProblemDetected,
  compact = false,
  showDetailedAnalysis = true
}: RealtimeChordFeedbackProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentResult, setCurrentResult] = useState<ChordDetectionResult | null>(null);
  const [detectionHistory, setDetectionHistory] = useState<ChordDetectionResult[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [performanceStats, setPerformanceStats] = useState({
    latency: 0,
    detectionRate: 0,
    accuracy: 0
  });

  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFeedbackRef = useRef<number>(0);

  // Inicializar serviço de detecção
  useEffect(() => {
    const initializeDetection = async () => {
      const success = await chordDetectionService.initialize();
      setIsInitialized(success);

      if (success) {
        // Configurar baseado no nível do usuário
        const userLevel = competenceSystem.getOverallLevel();
        chordDetectionService.updateConfig({
          userLevel,
          adaptiveTolerance: true,
          sensitivity: 0.7,
          maxLatency: 80 // < 100ms para sensação de instantâneo
        });
      }
    };

    initializeDetection();

    return () => {
      chordDetectionService.dispose();
    };
  }, []);

  // Controlar detecção baseada em props
  useEffect(() => {
    if (isActive && isInitialized && expectedChord) {
      setIsListening(true);
      chordDetectionService.startDetection(expectedChord, handleDetectionResult);
    } else {
      setIsListening(false);
      chordDetectionService.stopDetection();
      setCurrentResult(null);
    }

    return () => {
      chordDetectionService.stopDetection();
    };
  }, [isActive, isInitialized, expectedChord]);

  // Atualizar estatísticas periodicamente
  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        setPerformanceStats(chordDetectionService.getPerformanceStats());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isListening]);

  // Handler para resultados de detecção
  const handleDetectionResult = useCallback((result: ChordDetectionResult) => {
    setCurrentResult(result);
    onChordDetected?.(result);

    // Adicionar ao histórico (manter últimos 10)
    setDetectionHistory(prev => [result, ...prev.slice(0, 9)]);

    // Processar problemas
    if (result.problems.length > 0) {
      onProblemDetected?.(result.problems);
    }

    // Feedback háptico baseado na qualidade
    triggerHapticFeedback(result.quality.overall);

    // Limpar feedback anterior
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    // Feedback automático se qualidade mudar significativamente
    const now = Date.now();
    if (now - lastFeedbackRef.current > 2000) { // Máximo 1 feedback por 2s
      lastFeedbackRef.current = now;
    }
  }, [onChordDetected, onProblemDetected]);

  // Feedback háptico
  const triggerHapticFeedback = (quality: number) => {
    if (!navigator.vibrate) return;

    if (quality > 0.8) {
      // Excelente - vibração suave e positiva
      navigator.vibrate([50, 50, 50]);
    } else if (quality > 0.6) {
      // Bom - vibração simples
      navigator.vibrate(100);
    } else if (quality < 0.4) {
      // Ruim - vibração de alerta
      navigator.vibrate([200, 100, 200]);
    }
  };

  // Renderizar análise de cordas individuais
  const renderStringAnalysis = (strings: StringAnalysis[]) => {
    if (compact) return null;

    return (
      <div className="grid grid-cols-6 gap-1 mt-4">
        {strings.map((string, index) => (
          <div key={index} className="text-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
              string.isCorrect
                ? 'bg-green-500/20 border border-green-500'
                : string.problem === 'muted'
                ? 'bg-red-500/20 border border-red-500'
                : string.problem === 'not_played'
                ? 'bg-gray-500/20 border border-gray-500'
                : 'bg-yellow-500/20 border border-yellow-500'
            }`}>
              {string.isCorrect ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : string.problem === 'muted' ? (
                <XCircle className="w-4 h-4 text-red-400" />
              ) : string.problem === 'not_played' ? (
                <VolumeX className="w-4 h-4 text-gray-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
              )}
            </div>
            <div className="text-xs text-gray-400">
              {string.stringNumber}
            </div>
            {string.problem && (
              <div className="text-xs text-red-400 mt-1">
                {string.problem === 'muted' ? 'Abafada' :
                 string.problem === 'not_played' ? 'Não tocada' :
                 string.problem === 'out_of_tune' ? 'Desaf.' :
                 'Nota errada'}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Renderizar problemas detectados
  const renderProblems = (problems: ChordProblem[]) => {
    if (problems.length === 0 || compact) return null;

    return (
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-semibold text-white mb-2">Problemas Detectados:</h4>
        {problems.map((problem, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-3 rounded-lg border ${
              problem.severity === 'high' ? 'bg-red-500/10 border-red-500/30' :
              problem.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
              'bg-blue-500/10 border-blue-500/30'
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                problem.severity === 'high' ? 'text-red-400' :
                problem.severity === 'medium' ? 'text-yellow-400' :
                'text-blue-400'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{problem.description}</p>
                <p className="text-xs text-gray-400 mt-1">{problem.suggestion}</p>
                {problem.affectedStrings.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {problem.affectedStrings.map(stringNum => (
                      <Badge key={stringNum} variant="outline" className="text-xs">
                        Corda {stringNum}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  // Renderizar sugestões
  const renderSuggestions = (suggestions: string[]) => {
    if (suggestions.length === 0 || compact) return null;

    return (
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-white mb-2">💡 Sugestões:</h4>
        <ul className="space-y-1">
          {suggestions.slice(0, 3).map((suggestion, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-sm text-gray-300 flex items-start gap-2"
            >
              <Target className="w-3 h-3 mt-0.5 text-blue-400 flex-shrink-0" />
              {suggestion}
            </motion.li>
          ))}
        </ul>
      </div>
    );
  };

  // Renderizar status de detecção
  const renderDetectionStatus = () => {
    if (!isInitialized) {
      return (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Settings className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="text-sm text-gray-400">Inicializando detecção de acordes...</p>
        </div>
      );
    }

    if (!isListening) {
      return (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <MicOff className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-400">Detecção pausada</p>
          <p className="text-xs text-gray-500 mt-1">Ative para receber feedback em tempo real</p>
        </div>
      );
    }

    return (
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-3 h-3 bg-green-500 rounded-full"
          />
          <Mic className="w-5 h-5 text-green-400" />
          <span className="text-sm text-green-400 font-medium">Ouvindo...</span>
        </div>

        {/* Status de performance */}
        <div className="flex justify-center gap-4 mt-3 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            <span>{performanceStats.latency}ms</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>{performanceStats.detectionRate}fps</span>
          </div>
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
        {/* Status de detecção */}
        <div className={`w-3 h-3 rounded-full ${
          !isInitialized ? 'bg-yellow-500' :
          !isListening ? 'bg-gray-500' :
          (currentResult?.quality?.overall ?? 0) > 0.8 ? 'bg-green-500' :
          (currentResult?.quality?.overall ?? 0) > 0.6 ? 'bg-yellow-500' :
          'bg-red-500'
        }`} />

        {/* Qualidade atual */}
        {currentResult && (
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white">
                {currentResult.detectedChord || 'Detectando...'}
              </span>
              <span className="text-sm text-gray-400">
                {Math.round(currentResult.confidence * 100)}%
              </span>
            </div>
            <Progress value={currentResult.quality.overall * 100} className="h-2" />
          </div>
        )}

        {/* Controles */}
        <Button
          onClick={() => setShowSettings(!showSettings)}
          variant="ghost"
          size="sm"
          className="p-1"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="bg-[#0f0f1a]/95 backdrop-blur-md border-white/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          Detecção de Acordes
          <Badge variant="outline" className={`ml-2 ${useAI ? 'border-blue-400 text-blue-300' : 'border-green-400 text-green-300'}`}>
            {useAI ? '🤖 IA' : '🎵 Tradicional'}
          </Badge>
          {expectedChord && (
            <Badge variant="outline" className="ml-auto">
              Acorde: {expectedChord}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status de detecção */}
        {renderDetectionStatus()}

        {/* Resultado atual */}
        <AnimatePresence>
          {currentResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Qualidade geral */}
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">
                  {currentResult.quality.overall > 0.8 ? '🎯' :
                   currentResult.quality.overall > 0.6 ? '👍' :
                   currentResult.quality.overall > 0.4 ? '🤔' : '❌'}
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {currentResult.detectedChord || '---'}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Progress
                    value={currentResult.quality.overall * 100}
                    className="w-32 h-3"
                  />
                  <span className="text-sm text-gray-400">
                    {Math.round(currentResult.quality.overall * 100)}%
                  </span>
                </div>
              </div>

              {/* Métricas detalhadas */}
              {showDetailedAnalysis && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-400">
                      {Math.round(currentResult.quality.noteAccuracy * 100)}%
                    </div>
                    <div className="text-xs text-gray-400">Notas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-400">
                      {Math.round(currentResult.quality.clarity * 100)}%
                    </div>
                    <div className="text-xs text-gray-400">Clareza</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-400">
                      {Math.round(currentResult.quality.sustain * 100)}%
                    </div>
                    <div className="text-xs text-gray-400">Sustain</div>
                  </div>
                </div>
              )}

              {/* Análise de cordas */}
              {renderStringAnalysis(currentResult.individualStrings)}

              {/* Problemas detectados */}
              {renderProblems(currentResult.problems)}

              {/* Sugestões */}
              {renderSuggestions(currentResult.suggestions)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Histórico recente */}
        {detectionHistory.length > 1 && showDetailedAnalysis && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <h4 className="text-sm font-semibold text-white mb-2">Histórico Recente:</h4>
            <div className="flex gap-2">
              {detectionHistory.slice(0, 5).map((result, index) => (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-full border-2 ${
                    result.quality.overall > 0.8 ? 'bg-green-500 border-green-400' :
                    result.quality.overall > 0.6 ? 'bg-yellow-500 border-yellow-400' :
                    'bg-red-500 border-red-400'
                  }`}
                  title={`${Math.round(result.quality.overall * 100)}%`}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}