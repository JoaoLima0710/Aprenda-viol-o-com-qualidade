/**
 * Componente de Feedback de Áudio em Tempo Real
 * Pode ser usado em qualquer lugar da aplicação para fornecer feedback instantâneo
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
  AlertCircle,
  Sparkles,
  Target,
  Settings
} from 'lucide-react';
import {
  realtimeAIFeedbackService,
  RealtimeFeedback,
  PracticeContext,
  PlayingError
} from '@/services/RealtimeAIFeedbackService';

interface RealtimeAudioFeedbackProps {
  // Configuração do alvo
  practiceType?: 'chord' | 'scale' | 'note';
  target?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  
  // Opções de exibição
  showControls?: boolean;
  showDetailedFeedback?: boolean;
  compact?: boolean;
  autoStart?: boolean;
  
  // Callbacks
  onFeedback?: (feedback: RealtimeFeedback) => void;
  onError?: (error: PlayingError) => void;
  onSessionEnd?: (summary: ReturnType<typeof realtimeAIFeedbackService.getSessionSummary>) => void;
}

export function RealtimeAudioFeedback({
  practiceType = 'chord',
  target = 'C',
  difficulty = 'beginner',
  showControls = true,
  showDetailedFeedback = true,
  compact = false,
  autoStart = false,
  onFeedback,
  onError,
  onSessionEnd
}: RealtimeAudioFeedbackProps) {
  const [isListening, setIsListening] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<RealtimeFeedback | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [localTarget, setLocalTarget] = useState(target);
  const [localType, setLocalType] = useState(practiceType);

  // Auto-start se configurado
  useEffect(() => {
    if (autoStart && !isListening) {
      startListening();
    }
    return () => {
      if (isListening) {
        realtimeAIFeedbackService.stopAnalysis();
      }
    };
  }, [autoStart]);

  // Atualizar alvo quando props mudam
  useEffect(() => {
    setLocalTarget(target);
    setLocalType(practiceType);
  }, [target, practiceType]);

  const startListening = useCallback(async () => {
    setIsInitializing(true);
    setError(null);

    try {
      const initialized = await realtimeAIFeedbackService.initialize();
      if (initialized) {
        const context: PracticeContext = {
          type: localType,
          target: localTarget,
          difficulty
        };

        realtimeAIFeedbackService.startAnalysis(context, (newFeedback) => {
          setFeedback(newFeedback);
          onFeedback?.(newFeedback);

          // Callback para erros graves
          const highErrors = newFeedback.errors.filter(e => e.severity === 'high');
          if (highErrors.length > 0) {
            onError?.(highErrors[0]);
          }
        });

        setIsListening(true);
      } else {
        setError('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
      }
    } catch (err) {
      setError('Erro ao inicializar captação de áudio.');
      console.error('Audio init error:', err);
    } finally {
      setIsInitializing(false);
    }
  }, [localTarget, localType, difficulty, onFeedback, onError]);

  const stopListening = useCallback(() => {
    realtimeAIFeedbackService.stopAnalysis();
    setIsListening(false);
    
    const summary = realtimeAIFeedbackService.getSessionSummary();
    onSessionEnd?.(summary);
    
    setFeedback(null);
  }, [onSessionEnd]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Obter cor da qualidade
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

  // Renderização compacta
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
        <Button
          onClick={toggleListening}
          disabled={isInitializing}
          size="sm"
          variant={isListening ? "destructive" : "default"}
          className={isListening ? '' : 'bg-green-500 hover:bg-green-600'}
        >
          {isInitializing ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isListening ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </Button>
        
        {isListening && feedback && (
          <>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${getQualityBgColor(feedback.quality)}`}
                style={{ width: `${feedback.quality}%` }}
              />
            </div>
            <span className={`text-sm font-bold ${getQualityColor(feedback.quality)}`}>
              {feedback.quality}%
            </span>
            {feedback.isCorrect && <CheckCircle2 className="w-4 h-4 text-green-400" />}
            {!feedback.isCorrect && feedback.errors.length > 0 && (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            )}
          </>
        )}
        
        {isListening && !feedback && (
          <Volume2 className="w-4 h-4 text-green-400 animate-pulse" />
        )}
      </div>
    );
  }

  // Renderização completa
  return (
    <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-white/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Mic className={`w-4 h-4 ${isListening ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
            Feedback de Áudio em Tempo Real
          </CardTitle>
          
          {showControls && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowSettings(!showSettings)}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                onClick={toggleListening}
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
                    Ouvir
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Configurações */}
        {showSettings && !isListening && (
          <div className="flex gap-2 p-2 bg-white/5 rounded-lg">
            <select
              value={localType}
              onChange={(e) => setLocalType(e.target.value as 'chord' | 'scale' | 'note')}
              className="text-xs bg-white/10 border border-white/20 rounded px-2 py-1 text-white"
            >
              <option value="chord">Acorde</option>
              <option value="scale">Escala</option>
              <option value="note">Nota</option>
            </select>
            <select
              value={localTarget}
              onChange={(e) => setLocalTarget(e.target.value)}
              className="flex-1 text-xs bg-white/10 border border-white/20 rounded px-2 py-1 text-white"
            >
              {localType === 'chord' && (
                <>
                  <option value="C">C (Dó Maior)</option>
                  <option value="D">D (Ré Maior)</option>
                  <option value="E">E (Mi Maior)</option>
                  <option value="F">F (Fá Maior)</option>
                  <option value="G">G (Sol Maior)</option>
                  <option value="A">A (Lá Maior)</option>
                  <option value="Am">Am (Lá menor)</option>
                  <option value="Dm">Dm (Ré menor)</option>
                  <option value="Em">Em (Mi menor)</option>
                </>
              )}
              {localType === 'scale' && (
                <>
                  <option value="C major">C Maior</option>
                  <option value="G major">G Maior</option>
                  <option value="A minor">A Menor</option>
                  <option value="A pentatonic_minor">A Pentatônica</option>
                </>
              )}
              {localType === 'note' && (
                <>
                  <option value="E">E (Mi)</option>
                  <option value="A">A (Lá)</option>
                  <option value="D">D (Ré)</option>
                  <option value="G">G (Sol)</option>
                  <option value="B">B (Si)</option>
                </>
              )}
            </select>
          </div>
        )}

        {/* Alvo atual */}
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-gray-400">Alvo:</span>
          <Badge variant="outline" className="border-purple-400 text-purple-400">
            {localType === 'chord' ? 'Acorde' : localType === 'scale' ? 'Escala' : 'Nota'}: {localTarget}
          </Badge>
        </div>

        {/* Erro de inicialização */}
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-400 p-2 bg-red-500/10 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Feedback em tempo real */}
        {isListening && feedback && showDetailedFeedback && (
          <div className="space-y-3">
            {/* Barra de qualidade */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Qualidade</span>
                <span className={`font-bold ${getQualityColor(feedback.quality)}`}>
                  {feedback.quality}%
                </span>
              </div>
              <Progress 
                value={feedback.quality} 
                className="h-2"
              />
            </div>

            {/* Notas detectadas */}
            <div className="space-y-1">
              <span className="text-xs text-gray-400">Notas detectadas:</span>
              <div className="flex flex-wrap gap-1">
                {feedback.detectedNotes.length > 0 ? (
                  feedback.detectedNotes.map((note, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className={
                        feedback.expectedNotes.includes(note)
                          ? 'border-green-400 text-green-400'
                          : 'border-red-400 text-red-400'
                      }
                    >
                      <Music className="w-2 h-2 mr-1" />
                      {note}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-gray-500 italic">
                    <Volume2 className="w-3 h-3 inline mr-1 animate-pulse" />
                    Aguardando som...
                  </span>
                )}
              </div>
            </div>

            {/* Erros */}
            {feedback.errors.length > 0 && (
              <div className="space-y-2">
                {feedback.errors.slice(0, 2).map((err, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-lg ${
                      err.severity === 'high'
                        ? 'bg-red-500/20 border border-red-500/40'
                        : err.severity === 'medium'
                        ? 'bg-yellow-500/20 border border-yellow-500/40'
                        : 'bg-blue-500/20 border border-blue-500/40'
                    }`}
                  >
                    <div className={`flex items-center gap-1 text-xs mb-1 ${
                      err.severity === 'high' ? 'text-red-400' :
                      err.severity === 'medium' ? 'text-yellow-400' :
                      'text-blue-400'
                    }`}>
                      <AlertTriangle className="w-3 h-3" />
                      {err.description}
                    </div>
                    <p className="text-xs text-gray-300">{err.correction}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Sugestões */}
            {feedback.suggestions.length > 0 && !feedback.errors.length && (
              <div className="space-y-1">
                {feedback.suggestions.slice(0, 2).map((suggestion, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
                    {suggestion}
                  </div>
                ))}
              </div>
            )}

            {/* Encorajamento */}
            {feedback.isCorrect && (
              <div className="flex items-center gap-2 p-2 bg-green-500/20 rounded-lg border border-green-500/40">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-400">{feedback.encouragement}</span>
              </div>
            )}
          </div>
        )}

        {/* Aguardando input */}
        {isListening && !feedback && (
          <div className="flex items-center justify-center gap-2 py-4">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-gray-400">Ouvindo... toque seu instrumento!</span>
          </div>
        )}

        {/* Instrução quando parado */}
        {!isListening && !error && (
          <div className="text-center py-2">
            <p className="text-xs text-gray-400">
              Clique em "Ouvir" para começar a receber feedback em tempo real
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
