/**
 * Componente de Feedback de Áudio com Tutor IA
 * Integra detecção de áudio com IA para feedback pedagógico em tempo real
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Mic,
  MicOff,
  Music,
  AlertTriangle,
  CheckCircle2,
  Volume2,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Target,
  Sparkles
} from 'lucide-react';
import {
  aiAudioTutorService,
  AITutorFeedback,
  PracticeContext,
  SessionAnalysis
} from '@/services/AIAudioTutorService';

interface AITutorAudioFeedbackProps {
  practiceType?: 'chord' | 'scale' | 'note';
  target?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  showControls?: boolean;
  autoStart?: boolean;
  onSessionEnd?: (analysis: SessionAnalysis) => void;
}

export function AITutorAudioFeedback({
  practiceType = 'chord',
  target = 'C',
  difficulty = 'beginner',
  showControls = true,
  autoStart = false,
  onSessionEnd
}: AITutorAudioFeedbackProps) {
  const [isListening, setIsListening] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AITutorFeedback | null>(null);
  const [sessionAnalysis, setSessionAnalysis] = useState<SessionAnalysis | null>(null);

  const startListening = useCallback(async () => {
    setIsInitializing(true);
    setError(null);

    try {
      const context: PracticeContext = {
        type: practiceType,
        target,
        difficulty
      };

      const success = await aiAudioTutorService.startPracticeSession(
        context,
        (newFeedback) => {
          setFeedback(newFeedback);
        }
      );

      if (success) {
        setIsListening(true);
      } else {
        setError('Não foi possível inicializar o tutor de áudio. Verifique as permissões do microfone.');
      }
    } catch (err) {
      setError('Erro ao inicializar tutor de áudio.');
      console.error('Audio init error:', err);
    } finally {
      setIsInitializing(false);
    }
  }, [practiceType, target, difficulty]);

  const stopListening = useCallback(async () => {
    const analysis = await aiAudioTutorService.stopPracticeSession();
    setIsListening(false);
    setFeedback(null);
    
    if (analysis) {
      setSessionAnalysis(analysis);
      onSessionEnd?.(analysis);
    }
  }, [onSessionEnd]);

  useEffect(() => {
    if (autoStart && !isListening) {
      startListening();
    }
    return () => {
      if (isListening) {
        aiAudioTutorService.stopPracticeSession();
      }
    };
  }, [autoStart, isListening, startListening]);

  const getQualityColor = (quality: number) => {
    if (quality >= 75) return 'text-green-400';
    if (quality >= 50) return 'text-yellow-400';
    if (quality >= 25) return 'text-orange-400';
    return 'text-red-400';
  };

  const getQualityBgColor = (quality: number) => {
    if (quality >= 75) return 'bg-green-500';
    if (quality >= 50) return 'bg-yellow-500';
    if (quality >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Tutor IA em Tempo Real
          </CardTitle>
          {showControls && (
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isInitializing}
              size="sm"
              variant={isListening ? "destructive" : "default"}
              className={isListening ? '' : 'bg-gradient-to-r from-green-500 to-emerald-500'}
            >
              {isInitializing ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                  Iniciando...
                </>
              ) : isListening ? (
                <>
                  <MicOff className="w-3 h-3 mr-1" />
                  Parar
                </>
              ) : (
                <>
                  <Mic className="w-3 h-3 mr-1" />
                  Iniciar
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-400">Alvo:</span>
            <Badge variant="outline" className="border-purple-400 text-purple-400">
              {practiceType === 'chord' ? 'Acorde' : practiceType === 'scale' ? 'Escala' : 'Nota'}: {target}
            </Badge>
          </div>
          {isListening && (
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-green-400 animate-pulse" />
              <span className="text-xs text-green-400">Ouvindo...</span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-lg">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          </div>
        )}

        {/* Feedback em Tempo Real */}
        {isListening && feedback && (
          <div className="space-y-4">
            {/* Qualidade e Progresso */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Qualidade</span>
                <div className="flex items-center gap-2">
                  {getTrendIcon(feedback.progress.qualityTrend)}
                  <span className={`font-bold ${getQualityColor(feedback.technicalFeedback.quality)}`}>
                    {feedback.technicalFeedback.quality}%
                  </span>
                </div>
              </div>
              <Progress 
                value={feedback.technicalFeedback.quality} 
                className="h-2"
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Consistência: {Math.round(feedback.progress.consistencyScore * 100)}%</span>
                {feedback.progress.accuracyImprovement !== 0 && (
                  <span className={feedback.progress.accuracyImprovement > 0 ? 'text-green-400' : 'text-red-400'}>
                    {feedback.progress.accuracyImprovement > 0 ? '+' : ''}{feedback.progress.accuracyImprovement}%
                  </span>
                )}
              </div>
            </div>

            {/* Análise Pedagógica da IA */}
            <div className="p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">Análise do Tutor IA</span>
              </div>

              {/* Problema Principal */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs text-gray-400">Problema Principal</span>
                </div>
                <p className="text-sm text-white">{feedback.pedagogicalAnalysis.mainIssue}</p>
              </div>

              {/* Causa Raiz */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-3 h-3 text-blue-400" />
                  <span className="text-xs text-gray-400">Causa Raiz</span>
                </div>
                <p className="text-sm text-gray-300">{feedback.pedagogicalAnalysis.rootCause}</p>
              </div>

              {/* Conselho Personalizado */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs text-gray-400">Conselho Personalizado</span>
                </div>
                <p className="text-sm text-white font-medium">{feedback.pedagogicalAnalysis.personalizedAdvice}</p>
              </div>

              {/* Correções Específicas */}
              {feedback.pedagogicalAnalysis.specificCorrections.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-gray-400">Correções Específicas</span>
                  </div>
                  <ul className="space-y-1">
                    {feedback.pedagogicalAnalysis.specificCorrections.map((correction, i) => (
                      <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>{correction}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recomendações de Prática */}
              {feedback.pedagogicalAnalysis.practiceRecommendations.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-gray-400">Exercícios Recomendados</span>
                  </div>
                  <ul className="space-y-1">
                    {feedback.pedagogicalAnalysis.practiceRecommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                        <span className="text-blue-400 mt-1">→</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Encorajamento */}
              <div className="pt-2 border-t border-purple-500/30">
                <p className="text-sm text-purple-300 font-medium">
                  {feedback.pedagogicalAnalysis.encouragement}
                </p>
              </div>
            </div>

            {/* Padrões Identificados */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="text-xs text-red-400 mb-1">Erros Recorrentes</div>
                <div className="text-xs text-white">
                  {feedback.patterns.recurringErrors.length > 0 
                    ? feedback.patterns.recurringErrors.join(', ')
                    : 'Nenhum'}
                </div>
              </div>
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="text-xs text-yellow-400 mb-1">Melhorias</div>
                <div className="text-xs text-white">
                  {feedback.patterns.improvementAreas.length > 0
                    ? feedback.patterns.improvementAreas.join(', ')
                    : 'Nenhuma'}
                </div>
              </div>
              <div className="p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="text-xs text-green-400 mb-1">Pontos Fortes</div>
                <div className="text-xs text-white">
                  {feedback.patterns.strengths.join(', ')}
                </div>
              </div>
            </div>

            {/* Notas Detectadas */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">Notas:</span>
              {feedback.technicalFeedback.detectedNotes.length > 0 ? (
                feedback.technicalFeedback.detectedNotes.map((note, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={
                      feedback.technicalFeedback.expectedNotes.includes(note)
                        ? 'border-green-400 text-green-400'
                        : 'border-red-400 text-red-400'
                    }
                  >
                    <Music className="w-2 h-2 mr-1" />
                    {note}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-gray-500 italic">Aguardando som...</span>
              )}
            </div>
          </div>
        )}

        {/* Aguardando Input */}
        {isListening && !feedback && (
          <div className="flex items-center justify-center gap-2 py-4">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-gray-400">Analisando... toque seu instrumento!</span>
          </div>
        )}

        {/* Resumo da Sessão */}
        {sessionAnalysis && (
          <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-white">Resumo da Sessão</span>
            </div>
            <p className="text-sm text-gray-300">{sessionAnalysis.aiSummary}</p>
            {sessionAnalysis.recommendations.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-gray-400 mb-2">Recomendações:</div>
                <ul className="space-y-1">
                  {sessionAnalysis.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
