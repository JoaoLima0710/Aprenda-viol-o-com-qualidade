import { useState, useEffect, useCallback, useRef } from 'react';
import { chordDetectionService, ChordDetectionResult, ChordProblem } from '@/services/ChordDetectionService';
import { audioProcessingService, AudioAnalysisResult } from '@/services/AudioProcessingService';
import { competenceSystem } from '@/services/CompetenceSystem';

export interface ChordDetectionState {
  isInitialized: boolean;
  isActive: boolean;
  currentResult: ChordDetectionResult | null;
  recentResults: ChordDetectionResult[];
  performanceStats: {
    latency: number;
    detectionRate: number;
    accuracy: number;
  };
  error: string | null;
}

export interface UseRealtimeChordDetectionOptions {
  expectedChord?: string | null;
  autoStart?: boolean;
  userLevel?: number;
  useAI?: boolean; // Usar IA ou método tradicional
  onChordDetected?: (result: ChordDetectionResult) => void;
  onProblemDetected?: (problems: ChordProblem[]) => void;
  onAudioAnalysis?: (analysis: AudioAnalysisResult) => void;
  onError?: (error: string) => void;
}

export function useRealtimeChordDetection(options: UseRealtimeChordDetectionOptions = {}) {
  const {
    expectedChord = null,
    autoStart = false,
    userLevel,
    useAI = true, // Padrão: usar IA
    onChordDetected,
    onProblemDetected,
    onAudioAnalysis,
    onError
  } = options;

  const [state, setState] = useState<ChordDetectionState>({
    isInitialized: false,
    isActive: false,
    currentResult: null,
    recentResults: [],
    performanceStats: {
      latency: 0,
      detectionRate: 0,
      accuracy: 0
    },
    error: null
  });

  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastResultRef = useRef<ChordDetectionResult | null>(null);

  // Inicializar serviço
  useEffect(() => {
    const initialize = async () => {
      try {
        let success = false;

        if (useAI) {
          // Usar novo sistema de IA
          success = await audioProcessingService.initialize();
        } else {
          // Usar sistema tradicional
          success = await chordDetectionService.initialize();
        }

        if (success) {
          // Configurar baseado no nível do usuário
          const level = userLevel || competenceSystem.getOverallLevel();

          if (useAI) {
            // Configurações para IA já foram aplicadas no initialize
          } else {
            chordDetectionService.updateConfig({
              userLevel: level,
              adaptiveTolerance: true,
              sensitivity: 0.7,
              maxLatency: 80
            });
          }

          setState(prev => ({
            ...prev,
            isInitialized: true,
            error: null
          }));

          if (autoStart && expectedChord) {
            startDetection();
          }
        } else {
          setState(prev => ({
            ...prev,
            error: 'Falha ao inicializar processamento de áudio. Verifique as permissões.'
          }));
          onError?.('Falha ao inicializar processamento de áudio. Verifique as permissões.');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        setState(prev => ({
          ...prev,
          error: errorMessage
        }));
        onError?.(errorMessage);
      }
    };

    initialize();

    return () => {
      if (useAI) {
        audioProcessingService.dispose();
      } else {
        chordDetectionService.dispose();
      }
    };
  }, [autoStart, expectedChord, userLevel, useAI, onError]);

  // Handler para análise de áudio (IA)
  const handleAudioAnalysis = useCallback((analysis: AudioAnalysisResult) => {
    // Converter resultado da IA para formato compatível
    const result: ChordDetectionResult = {
      detectedChord: analysis.chordDetection?.chord || null,
      confidence: analysis.chordDetection?.confidence || 0,
      timing: analysis.chordDetection?.timestamp || Date.now(),
      quality: {
        overall: analysis.quality.clarity * 0.4 + analysis.quality.stability * 0.4 + (analysis.chunk.rms > 0.1 ? 0.2 : 0),
        noteAccuracy: analysis.chordDetection?.confidence || 0,
        clarity: analysis.quality.clarity,
        sustain: analysis.quality.stability
      },
      individualStrings: [], // IA ainda não implementa análise por corda detalhada
      problems: [], // Implementar problemas baseados na análise de qualidade
      suggestions: []
    };

    setState(prev => ({
      ...prev,
      currentResult: result,
      recentResults: [result, ...prev.recentResults.slice(0, 9)],
      error: null
    }));

    onAudioAnalysis?.(analysis);
    onChordDetected?.(result);

    lastResultRef.current = result;
  }, [onAudioAnalysis, onChordDetected]);

  // Handler para resultados de detecção (tradicional)
  const handleDetectionResult = useCallback((result: ChordDetectionResult) => {
    setState(prev => ({
      ...prev,
      currentResult: result,
      recentResults: [result, ...prev.recentResults.slice(0, 9)], // Manter últimos 10
      error: null
    }));

    // Verificar se mudou significativamente para feedback
    const lastResult = lastResultRef.current;
    const qualityChanged = lastResult &&
      Math.abs(result.quality.overall - lastResult.quality.overall) > 0.2;

    if (qualityChanged || !lastResult) {
      onChordDetected?.(result);
    }

    if (result.problems.length > 0) {
      onProblemDetected?.(result.problems);
    }

    lastResultRef.current = result;
  }, [onChordDetected, onProblemDetected]);

  // Iniciar detecção
  const startDetection = useCallback(() => {
    if (!state.isInitialized) {
      setState(prev => ({
        ...prev,
        error: 'Serviço não inicializado'
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isActive: true,
      error: null
    }));

    if (useAI) {
      // Usar processamento de áudio com IA
      audioProcessingService.startProcessing(handleAudioAnalysis);

      // Iniciar atualização de estatísticas
      const updateStats = () => {
        const audioStats = audioProcessingService.getPerformanceStats();
        setState(prev => ({
          ...prev,
          performanceStats: {
            latency: audioStats.averageLatency,
            detectionRate: audioStats.chunksProcessed > 0 ? 1000 / (audioStats.averageLatency || 1) : 0,
            accuracy: 0.85 // Placeholder - implementar cálculo real
          }
        }));
      };

      updateStats();
      detectionTimeoutRef.current = setInterval(updateStats, 1000);
    } else {
      // Usar método tradicional
      if (!expectedChord) {
        setState(prev => ({
          ...prev,
          error: 'Acorde esperado não definido'
        }));
        return;
      }

      chordDetectionService.startDetection(expectedChord, handleDetectionResult);

      // Iniciar atualização de estatísticas
      const updateStats = () => {
        setState(prev => ({
          ...prev,
          performanceStats: chordDetectionService.getPerformanceStats()
        }));
      };

      updateStats();
      detectionTimeoutRef.current = setInterval(updateStats, 1000);
    }
  }, [state.isInitialized, expectedChord, useAI, handleDetectionResult, handleAudioAnalysis]);

  // Parar detecção
  const stopDetection = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      currentResult: null
    }));

    if (useAI) {
      audioProcessingService.stopProcessing();
    } else {
      chordDetectionService.stopDetection();
    }

    if (detectionTimeoutRef.current) {
      clearInterval(detectionTimeoutRef.current);
      detectionTimeoutRef.current = null;
    }
  }, [useAI]);

  // Pausar detecção temporariamente
  const pauseDetection = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false
    }));
    chordDetectionService.stopDetection();
  }, []);

  // Retomar detecção
  const resumeDetection = useCallback(() => {
    if (expectedChord) {
      startDetection();
    }
  }, [expectedChord, startDetection]);

  // Atualizar acorde esperado
  const updateExpectedChord = useCallback((chord: string | null) => {
    if (state.isActive) {
      // Reiniciar detecção com novo acorde
      stopDetection();
      if (chord) {
        setTimeout(() => startDetection(), 100); // Pequeno delay
      }
    }
  }, [state.isActive, stopDetection, startDetection]);

  // Limpar estado
  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentResult: null,
      recentResults: [],
      error: null
    }));
    lastResultRef.current = null;
  }, []);

  // Obter estatísticas de qualidade recentes
  const getQualityTrend = useCallback(() => {
    const recentResults = state.recentResults.slice(0, 5);
    if (recentResults.length === 0) return null;

    const avgQuality = recentResults.reduce((sum, r) => sum + r.quality.overall, 0) / recentResults.length;
    const trend = recentResults.length >= 2 ?
      (recentResults[0].quality.overall - recentResults[recentResults.length - 1].quality.overall) : 0;

    return {
      average: avgQuality,
      trend: trend > 0.1 ? 'improving' : trend < -0.1 ? 'declining' : 'stable',
      sampleSize: recentResults.length
    };
  }, [state.recentResults]);

  // Obter problemas mais comuns
  const getCommonProblems = useCallback(() => {
    const allProblems = state.recentResults.flatMap(r => r.problems);
    const problemCount: Record<string, number> = {};

    allProblems.forEach(problem => {
      problemCount[problem.type] = (problemCount[problem.type] || 0) + 1;
    });

    return Object.entries(problemCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => ({ type, count }));
  }, [state.recentResults]);

  // Calcular score de sessão baseado nos resultados
  const getSessionScore = useCallback(() => {
    if (state.recentResults.length === 0) return null;

    const totalResults = state.recentResults.length;
    const goodResults = state.recentResults.filter(r => r.quality.overall > 0.7).length;
    const excellentResults = state.recentResults.filter(r => r.quality.overall > 0.85).length;

    const consistency = state.recentResults.length > 1 ?
      1 - (state.recentResults.reduce((sum, r, i, arr) => {
        if (i === 0) return 0;
        return sum + Math.abs(r.quality.overall - arr[i-1].quality.overall);
      }, 0) / (state.recentResults.length - 1)) : 1;

    return {
      overall: (goodResults / totalResults) * 100,
      consistency: consistency * 100,
      excellentRate: (excellentResults / totalResults) * 100,
      totalAttempts: totalResults
    };
  }, [state.recentResults]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (detectionTimeoutRef.current) {
        clearInterval(detectionTimeoutRef.current);
      }
      chordDetectionService.dispose();
    };
  }, []);

  return {
    // Estado
    ...state,

    // Controles
    startDetection,
    stopDetection,
    pauseDetection,
    resumeDetection,
    updateExpectedChord,
    clearResults,

    // Análises
    getQualityTrend,
    getCommonProblems,
    getSessionScore,

    // Utilitários
    isReady: state.isInitialized && !state.error,
    hasRecentResults: state.recentResults.length > 0,
    averageQuality: state.recentResults.length > 0 ?
      state.recentResults.reduce((sum, r) => sum + r.quality.overall, 0) / state.recentResults.length : 0
  };
}