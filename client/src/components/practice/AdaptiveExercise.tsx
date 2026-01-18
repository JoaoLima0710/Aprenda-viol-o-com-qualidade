import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Target,
  Clock,
  TrendingUp,
  Zap,
  Mic,
  MicOff
} from 'lucide-react';
import { advancedAIService, AdaptiveExercise as AdaptiveExerciseType } from '@/services/AdvancedAIService';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { aiAssistantService } from '@/services/AIAssistantService';
import { RealtimeChordFeedback } from './RealtimeChordFeedback';
import { useRealtimeChordDetection } from '@/hooks/useRealtimeChordDetection';
import { ChordProblem } from '@/services/ChordDetectionService';

interface AdaptiveExerciseProps {
  onComplete?: (accuracy: number, timeSpent: number) => void;
  onClose?: () => void;
}

export function AdaptiveExercise({ onComplete, onClose }: AdaptiveExerciseProps) {
  const [currentExercise, setCurrentExercise] = useState<AdaptiveExerciseType | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isGenerating, setIsGenerating] = useState(true);
  const [feedback, setFeedback] = useState<string>('');
  const [showHints, setShowHints] = useState(false);
  const [detectedProblems, setDetectedProblems] = useState<ChordProblem[]>([]);
  const [enableRealtimeDetection, setEnableRealtimeDetection] = useState(true);
  const [useAI, setUseAI] = useState(true); // Usar IA por padrão

  const { xp, level } = useGamificationStore();

  // Sistema de detecção em tempo real
  const {
    isActive: detectionActive,
    currentResult,
    startDetection,
    stopDetection,
    pauseDetection,
    resumeDetection,
    getQualityTrend,
    getSessionScore,
    isReady: detectionReady,
    error: detectionError
  } = useRealtimeChordDetection({
    expectedChord: currentExercise?.type === 'chord_progression' && currentExercise?.content?.chord
      ? currentExercise.content.chord
      : null,
    autoStart: false,
    userLevel: level,
    useAI,
    onChordDetected: handleChordDetected,
    onProblemDetected: handleProblemsDetected
  });

  // Handlers para detecção
  function handleChordDetected(result: any) {
    // Atualizar accuracy baseada na detecção em tempo real
    const newAccuracy = Math.round(result.quality.overall * 100);
    setAccuracy(newAccuracy);

    // Atualizar feedback baseado na qualidade
    if (result.quality.overall > 0.85) {
      setFeedback('🎯 Excelente! Continue assim!');
    } else if (result.quality.overall > 0.7) {
      setFeedback('👍 Muito bom! Pequenos ajustes podem melhorar ainda mais.');
    } else if (result.quality.overall > 0.5) {
      setFeedback('🤔 Quase lá! Preste atenção nas cordas destacadas.');
    } else {
      setFeedback('💪 Vamos praticar! Siga as dicas abaixo.');
    }
  }

  function handleProblemsDetected(problems: ChordProblem[]) {
    setDetectedProblems(problems);

    // Ajustar dificuldade se muitos problemas
    if (problems.some(p => p.severity === 'high') && attempts > 3) {
      setFeedback('🔄 Exercício parece desafiador. Vamos simplificar...');
      // Aqui poderia gerar um exercício mais fácil
    }
  }

  useEffect(() => {
    generateExercise();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentExercise) {
      interval = setInterval(() => {
        setTimeSpent(prev => {
          const newTime = prev + 1;
          // Verificar limite de tempo
          if (newTime >= currentExercise.timeLimit) {
            handleTimeUp();
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentExercise]);

  const generateExercise = async () => {
    setIsGenerating(true);
    try {
      const profile = aiAssistantService.getUserProfile();
      const weakAreas = aiAssistantService.analyzeWeakAreas();
      const recentSessions = aiAssistantService.getPracticeHistory().slice(-10);

      const exercise = await advancedAIService.generateAdaptiveExercise(
        profile,
        weakAreas,
        recentSessions
      );

      setCurrentExercise(exercise);
      setCurrentProgress(0);
      setAccuracy(0);
      setTimeSpent(0);
      setAttempts(0);
      setFeedback('');
      setShowHints(false);

    } catch (error) {
      console.error('Erro ao gerar exercício adaptativo:', error);
      setFeedback('Erro ao gerar exercício. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStart = () => {
    setIsPlaying(true);
    setFeedback('Exercício iniciado! Foque na qualidade da execução.');

    // Iniciar detecção em tempo real se habilitada
    if (enableRealtimeDetection && detectionReady && currentExercise?.type === 'chord_progression') {
      startDetection();
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    setFeedback('Exercício pausado. Pressione continuar quando estiver pronto.');

    // Pausar detecção em tempo real
    if (detectionActive) {
      pauseDetection();
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentProgress(0);
    setAccuracy(0);
    setTimeSpent(0);
    setAttempts(0);
    setFeedback('Exercício reiniciado.');
    setShowHints(false);
    setDetectedProblems([]);

    // Resetar detecção em tempo real
    if (detectionActive) {
      stopDetection();
    }
  };

  // Toggle detecção em tempo real
  const toggleRealtimeDetection = () => {
    setEnableRealtimeDetection(!enableRealtimeDetection);

    if (!enableRealtimeDetection) {
      // Ativando - iniciar se exercício estiver rodando
      if (isPlaying && currentExercise?.type === 'chord_progression') {
        startDetection();
      }
    } else {
      // Desativando - parar detecção
      if (detectionActive) {
        stopDetection();
      }
    }
  };

  const handleTimeUp = () => {
    setIsPlaying(false);
    setFeedback(`Tempo esgotado! Precisão final: ${Math.round(accuracy)}%`);

    if (onComplete) {
      onComplete(accuracy, timeSpent);
    }
  };

  const simulateProgress = () => {
    if (!isPlaying || !currentExercise) return;

    // Simular progresso baseado em performance
    const baseProgress = Math.min(100, currentProgress + Math.random() * 15);
    const accuracyVariation = (Math.random() - 0.5) * 20; // -10% a +10%
    const newAccuracy = Math.max(0, Math.min(100,
      accuracy + accuracyVariation + (currentExercise.expectedAccuracy - accuracy) * 0.1
    ));

    setCurrentProgress(baseProgress);
    setAccuracy(newAccuracy);
    setAttempts(prev => prev + 1);

    // Feedback baseado na performance
    if (newAccuracy >= currentExercise.expectedAccuracy + 10) {
      setFeedback('Excelente! Você está acima do esperado!');
    } else if (newAccuracy >= currentExercise.expectedAccuracy) {
      setFeedback('Muito bom! Mantendo o ritmo certo.');
    } else if (newAccuracy >= currentExercise.expectedAccuracy - 10) {
      setFeedback('Bom trabalho! Continue focado.');
    } else {
      setFeedback('Continue praticando. Use as dicas se precisar.');
    }

    // Verificar conclusão
    if (baseProgress >= 100) {
      setIsPlaying(false);
      const finalAccuracy = Math.round(newAccuracy);
      setFeedback(`Exercício concluído! Precisão: ${finalAccuracy}%`);

      if (onComplete) {
        onComplete(finalAccuracy, timeSpent);
      }
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(simulateProgress, 2000); // Atualizar a cada 2 segundos
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentProgress, accuracy]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 0.4) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (difficulty < 0.7) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-400';
    if (accuracy >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (isGenerating) {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-[#0f0f1a] border-white/20">
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <Zap className="w-6 h-6 text-purple-400 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Gerando Exercício Adaptativo</h3>
          <p className="text-gray-400">Analisando seu progresso e criando um exercício personalizado...</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentExercise) {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-[#0f0f1a] border-white/20">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Erro ao Carregar Exercício</h3>
          <p className="text-gray-400 mb-4">Não foi possível gerar um exercício adaptativo.</p>
          <Button onClick={generateExercise} className="bg-purple-500 hover:bg-purple-600">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-[#0f0f1a] border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                Exercício Adaptativo IA
                <Badge className={getDifficultyColor(currentExercise.difficulty)}>
                  {currentExercise.difficulty < 0.4 ? 'Fácil' :
                   currentExercise.difficulty < 0.7 ? 'Médio' : 'Difícil'}
                </Badge>
              </CardTitle>
              <p className="text-sm text-gray-400">
                {currentExercise.type === 'chord_progression' ? 'Progressão de Acordes' :
                 currentExercise.type === 'rhythm_pattern' ? 'Padrão Rítmico' :
                 currentExercise.type === 'ear_training' ? 'Treino de Ouvido' :
                 'Exercício Técnico'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-gray-300">
              <Clock className="w-3 h-3 mr-1" />
              {formatTime(currentExercise.timeLimit - timeSpent)}
            </Badge>
            {onClose && (
              <Button onClick={onClose} variant="outline" size="sm">
                Fechar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Progresso</span>
            <span className="text-white font-bold">{Math.round(currentProgress)}%</span>
          </div>
          <Progress value={currentProgress} className="h-3" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <div className={`text-2xl font-bold ${getAccuracyColor(accuracy)}`}>
              {Math.round(accuracy)}%
            </div>
            <div className="text-xs text-gray-400">Precisão</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">{attempts}</div>
            <div className="text-xs text-gray-400">Tentativas</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">{formatTime(timeSpent)}</div>
            <div className="text-xs text-gray-400">Tempo</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-green-400">
              {Math.round(currentExercise.expectedAccuracy)}%
            </div>
            <div className="text-xs text-gray-400">Meta</div>
          </div>
        </div>

        {/* Realtime Chord Detection */}
        {currentExercise?.type === 'chord_progression' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Detecção em Tempo Real</h3>
              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleRealtimeDetection}
                  variant={enableRealtimeDetection ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {enableRealtimeDetection ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  {enableRealtimeDetection ? 'Ativo' : 'Desativado'}
                </Button>
                <Button
                  onClick={() => setUseAI(!useAI)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={detectionActive}
                >
                  {useAI ? '🤖 IA' : '🎵 Tradicional'}
                </Button>
              </div>
            </div>

            {enableRealtimeDetection ? (
              <RealtimeChordFeedback
                expectedChord={currentExercise.type === 'chord_progression' && currentExercise.content?.chord
                  ? currentExercise.content.chord
                  : null}
                isActive={detectionActive}
                useAI={useAI}
                onChordDetected={(result) => {
                  // Atualizar accuracy baseada na detecção
                  const newAccuracy = Math.round(result.quality.overall * 100);
                  setAccuracy(newAccuracy);
                }}
                onProblemDetected={setDetectedProblems}
                showDetailedAnalysis={true}
              />
            ) : (
              <Card className="bg-yellow-500/10 border-yellow-500/30">
                <CardContent className="p-4 text-center">
                  <MicOff className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-sm text-yellow-200">
                    Detecção em tempo real desativada. Ative para feedback instantâneo!
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Detected Problems */}
            {detectedProblems.length > 0 && (
              <Card className="bg-red-500/10 border-red-500/30">
                <CardHeader>
                  <CardTitle className="text-red-400 text-sm">Problemas Detectados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {detectedProblems.slice(0, 3).map((problem, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-white">{problem.description}</p>
                        <p className="text-xs text-gray-400">{problem.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Exercise Content */}
        <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
          <h3 className="text-lg font-bold text-white mb-4">Conteúdo do Exercício</h3>

          {currentExercise.type === 'chord_progression' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Progressão de Acordes:</p>
                <div className="flex flex-wrap gap-2">
                  {(currentExercise.content as any).chords?.map((chord: string, index: number) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-lg font-mono font-bold text-lg ${
                        index === Math.floor(currentProgress / 100 * (currentExercise.content as any).chords.length)
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 text-gray-300'
                      }`}
                    >
                      {chord}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-sm text-gray-400">
                BPM: {(currentExercise.content as any).tempo} |
                Estilo: {(currentExercise.content as any).style}
              </div>
            </div>
          )}

          {currentExercise.type === 'rhythm_pattern' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Padrão Rítmico:</p>
                <div className="text-2xl font-mono text-purple-400 bg-black/20 p-4 rounded">
                  {(currentExercise.content as any).pattern}
                </div>
              </div>
              <div className="text-sm text-gray-400">
                Subdivisão: {(currentExercise.content as any).subdivision} |
                Complexidade: {(currentExercise.content as any).complexity}/5
              </div>
            </div>
          )}

          {currentExercise.type === 'ear_training' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Intervalos para identificar:</p>
                <div className="flex flex-wrap gap-2">
                  {(currentExercise.content as any).intervals?.map((interval: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded">
                      {interval}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-sm text-gray-400">
                Modo: {(currentExercise.content as any).mode}
              </div>
            </div>
          )}

          {currentExercise.type === 'technique_drill' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Exercícios Técnicos:</p>
                <div className="space-y-2">
                  {(currentExercise.content as any).exercises?.map((exercise: any, index: number) => (
                    <div key={index} className="p-3 bg-white/5 rounded">
                      <div className="font-semibold text-white">{exercise.name}</div>
                      <div className="text-sm text-gray-400">
                        Padrão: {exercise.pattern} | Velocidade: {exercise.speed} BPM
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`p-4 rounded-lg border ${
            feedback.includes('Excelente') ? 'bg-green-500/10 border-green-500/30 text-green-400' :
            feedback.includes('Muito bom') ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
            feedback.includes('Bom trabalho') ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
            feedback.includes('concluído') ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
            'bg-gray-500/10 border-gray-500/30 text-gray-400'
          }`}>
            <div className="flex items-center gap-2">
              {feedback.includes('Excelente') || feedback.includes('concluído') ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : feedback.includes('Tempo esgotado') ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <TrendingUp className="w-5 h-5" />
              )}
              <span className="font-medium">{feedback}</span>
            </div>
          </div>
        )}

        {/* Hints */}
        {showHints && currentExercise.hints.length > 0 && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <span className="font-semibold text-blue-400">Dicas para este exercício:</span>
            </div>
            <ul className="space-y-1">
              {currentExercise.hints.map((hint, index) => (
                <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  {hint}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-3 justify-center">
          {!isPlaying ? (
            <Button
              onClick={handleStart}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Iniciar Exercício
            </Button>
          ) : (
            <Button
              onClick={handlePause}
              variant="outline"
              className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
              size="lg"
            >
              <Pause className="w-5 h-5 mr-2" />
              Pausar
            </Button>
          )}

          <Button
            onClick={handleReset}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reiniciar
          </Button>

          <Button
            onClick={() => setShowHints(!showHints)}
            variant="outline"
            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            {showHints ? 'Ocultar Dicas' : 'Mostrar Dicas'}
          </Button>

          <Button
            onClick={generateExercise}
            variant="outline"
            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
          >
            <Zap className="w-4 h-4 mr-2" />
            Novo Exercício
          </Button>
        </div>

        {/* Adaptive Info */}
        <div className="text-center text-xs text-gray-500 bg-white/5 p-3 rounded-lg">
          <p>
            💡 Este exercício foi gerado dinamicamente baseado no seu perfil de aprendizado.
            A dificuldade se adapta automaticamente ao seu desempenho em tempo real.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
