/**
 * 🎸 Enhanced Chord Practice Component
 * 
 * Componente pedagógico aprimorado para treino de acordes com foco em iniciantes.
 * 
 * Funcionalidades:
 * - Destaca cordas críticas e dedos com risco de erro
 * - Mensagens pedagógicas contextuais
 * - Repetição obrigatória (3 execuções consecutivas)
 * - Feedback visual melhorado
 * 
 * REGRAS:
 * - NÃO altera AudioBus, AudioEngine ou serviços de áudio
 * - NÃO cria novas dependências
 * - NÃO altera paths de samples
 * - NÃO quebra build do Vercel
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioPriorityManager } from '@/services/AudioPriorityManager';
import {
  CheckCircle2,
  XCircle,
  PlayCircle,
  RotateCcw,
  Volume2,
  Timer,
  Target,
  Zap,
  Award,
  AlertCircle,
  Info,
  Lightbulb,
  VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useProgressionStore } from '@/stores/useProgressionStore';
import { usePracticeMetricsStore } from '@/stores/usePracticeMetricsStore';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { feedbackSoundService } from '@/services/FeedbackSoundService';
import type { Chord } from '@/data/chords';

interface ChordFinger {
  string: number;
  fret: number;
  finger: number;
}

interface EnhancedChordPracticeProps {
  chord: Chord;
  fingers: ChordFinger[];
  stringsToPlay: number[];
  onComplete: (accuracy: number, time: number) => void;
  targetRepetitions?: number;
}

// Cores para cada dedo
const fingerColors: Record<number, string> = {
  1: 'bg-blue-500',
  2: 'bg-green-500',
  3: 'bg-yellow-500',
  4: 'bg-red-500',
};

const fingerNames: Record<number, string> = {
  1: 'Indicador',
  2: 'Médio',
  3: 'Anelar',
  4: 'Mindinho',
};

// Identificar cordas críticas e dedos com risco de erro baseado no acorde
function getCriticalStringsAndFingers(
  chord: Chord,
  fingers: ChordFinger[]
): { criticalStrings: number[]; errorProneFingers: number[] } {
  const criticalStrings: number[] = [];
  const errorProneFingers: number[] = [];

  // Cordas que devem ser tocadas mas são frequentemente abafadas
  chord.frets.forEach((fret, index) => {
    const stringNum = 6 - index; // Inverter: frets[0] = corda 6, frets[5] = corda 1
    if (fret !== 'x' && fret !== 0) {
      // Cordas pressionadas (não abertas) são mais críticas
      criticalStrings.push(stringNum);
    }
  });

  // Dedos com maior risco de erro baseado na dificuldade e posição
  fingers.forEach((finger) => {
    // Dedos em trastes mais altos ou com esticamento são mais difíceis
    if (finger.fret >= 3) {
      errorProneFingers.push(finger.finger);
    }
    // Dedos mindinho (4) são sempre mais difíceis
    if (finger.finger === 4) {
      errorProneFingers.push(finger.finger);
    }
    // Acordes com pestana (dedo 1 em múltiplas cordas)
    if (finger.finger === 1 && chord.frets.filter(f => typeof f === 'number' && f > 0).length >= 4) {
      errorProneFingers.push(finger.finger);
    }
  });

  return {
    criticalStrings: [...new Set(criticalStrings)],
    errorProneFingers: [...new Set(errorProneFingers)],
  };
}

// Mensagens pedagógicas contextuais
function getPedagogicalMessage(
  chord: Chord,
  phase: 'learn' | 'practice' | 'complete',
  currentRep: number,
  consecutiveSuccesses: number,
  criticalStrings: number[],
  errorProneFingers: number[]
): string {
  if (phase === 'learn') {
    if (chord.difficulty === 'beginner') {
      return 'Comece posicionando os dedos um por um. Pressione com a ponta dos dedos, não com a polpa.';
    }
    if (chord.difficulty === 'intermediate') {
      return 'Este acorde requer mais coordenação. Pratique cada dedo separadamente antes de formar o acorde completo.';
    }
    return 'Acorde avançado! Foque na técnica correta antes da velocidade.';
  }

  if (phase === 'practice') {
    if (consecutiveSuccesses === 0 && currentRep === 0) {
      return 'Forme o acorde e toque todas as cordas. Se alguma corda não soar, ajuste a posição dos dedos.';
    }
    if (consecutiveSuccesses < 3) {
      const remaining = 3 - consecutiveSuccesses;
      return `Continue! Você precisa de ${remaining} execução${remaining > 1 ? 'ões' : ''} consecutiva${remaining > 1 ? 's' : ''} correta${remaining > 1 ? 's' : ''} para avançar.`;
    }
    if (criticalStrings.length > 0) {
      return `Atenção especial às cordas ${criticalStrings.join(', ')}. Elas são críticas para o som do acorde.`;
    }
    if (errorProneFingers.length > 0) {
      const fingerNamesList = errorProneFingers.map(f => fingerNames[f]).join(', ');
      return `Foque nos dedos ${fingerNamesList}. Eles são os mais desafiadores neste acorde.`;
    }
    return 'Ótimo progresso! Mantenha a consistência.';
  }

  return 'Parabéns! Você dominou este acorde. Continue praticando para consolidar a memória motora.';
}

export function EnhancedChordPractice({
  chord,
  fingers,
  stringsToPlay,
  onComplete,
  targetRepetitions = 3, // Padrão: 3 repetições obrigatórias
}: EnhancedChordPracticeProps) {
  const [phase, setPhase] = useState<'learn' | 'practice' | 'complete'>('learn');
  const [currentRep, setCurrentRep] = useState(0);
  const [consecutiveSuccesses, setConsecutiveSuccesses] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<'correct' | 'muted_string' | 'wrong_fingering' | 'timing' | 'general' | null>(null);
  const [showHint, setShowHint] = useState(true);
  const [timer, setTimer] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState(0);
  const [lastAttempt, setLastAttempt] = useState<'correct' | 'incorrect' | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { addXP } = useGamificationStore();
  const { updateSkillProgress } = useProgressionStore();
  const { recordSession } = usePracticeMetricsStore();

  // Identificar cordas críticas e dedos com risco de erro
  const { criticalStrings, errorProneFingers } = useMemo(
    () => getCriticalStringsAndFingers(chord, fingers),
    [chord, fingers]
  );

  // Mensagem pedagógica contextual
  const pedagogicalMessage = useMemo(
    () =>
      getPedagogicalMessage(
        chord,
        phase,
        currentRep,
        consecutiveSuccesses,
        criticalStrings,
        errorProneFingers
      ),
    [chord, phase, currentRep, consecutiveSuccesses, criticalStrings, errorProneFingers]
  );

  // Iniciar timer quando em modo prática
  useEffect(() => {
    if (phase === 'practice') {
      timerRef.current = setInterval(() => {
        setTimer((t) => t + 100);
      }, 100);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Limpar timeout de feedback
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  // Resetar contador de sucessos consecutivos quando errar
  useEffect(() => {
    if (lastAttempt === 'incorrect') {
      setConsecutiveSuccesses(0);
    }
  }, [lastAttempt]);

  // Gerar feedback explicativo baseado no erro
  const getExplanatoryFeedback = useCallback((isCorrect: boolean, attemptNumber: number): { message: string; type: 'correct' | 'muted_string' | 'wrong_fingering' | 'timing' | 'general' } => {
    if (isCorrect) {
      return {
        message: 'Perfeito! Todas as cordas soaram limpas. Continue assim!',
        type: 'correct'
      };
    }

    // Gerar feedback específico baseado em padrões comuns de erro
    const errorPatterns = [
      {
        type: 'muted_string' as const,
        messages: [
          'Alguma corda está abafada. Verifique se está pressionando com a ponta dos dedos, não com a polpa.',
          'Corda abafada detectada. Pressione mais perto do traste (não no meio) para melhor som.',
          'Alguma corda não está soando. Aumente a pressão dos dedos e verifique se não está tocando outras cordas acidentalmente.'
        ]
      },
      {
        type: 'wrong_fingering' as const,
        messages: [
          'Posição dos dedos incorreta. Verifique o diagrama acima e compare com sua mão.',
          'Dedos na posição errada. Foque especialmente nas cordas críticas destacadas em amarelo.',
          'Dedilhado incorreto. Pratique posicionar um dedo por vez antes de formar o acorde completo.'
        ]
      },
      {
        type: 'timing' as const,
        messages: [
          'Tempo de execução pode melhorar. Pratique formar o acorde mais rápido mantendo a qualidade.',
          'Foque em formar o acorde de forma mais fluida. A velocidade vem com a prática.'
        ]
      },
      {
        type: 'general' as const,
        messages: [
          'Revise a posição dos dedos. Compare com o diagrama e ajuste onde necessário.',
          'Toque cada corda individualmente para verificar se todas estão soando corretamente.',
          'Pratique mais devagar. Forme o acorde com cuidado antes de tocar todas as cordas.'
        ]
      }
    ];

    // Selecionar tipo de erro baseado em tentativas anteriores e cordas críticas
    let selectedType: 'muted_string' | 'wrong_fingering' | 'timing' | 'general' = 'general';
    
    if (errors > 0 && criticalStrings.length > 0) {
      // Se já errou antes e há cordas críticas, provavelmente é problema de dedilhado
      selectedType = 'wrong_fingering';
    } else if (errors > 2) {
      // Muitos erros = provavelmente cordas abafadas
      selectedType = 'muted_string';
    } else {
      // Primeiros erros = feedback geral
      selectedType = 'general';
    }

    const pattern = errorPatterns.find(p => p.type === selectedType) || errorPatterns[3];
    const messageIndex = Math.min(attemptNumber - 1, pattern.messages.length - 1);
    
    return {
      message: pattern.messages[messageIndex],
      type: selectedType
    };
  }, [errors, criticalStrings]);

  // Simular detecção de acorde (pode integrar com detecção real depois)
  const handleChordAttempt = useCallback(
    (correct: boolean) => {
      setLastAttempt(correct ? 'correct' : 'incorrect');
      setFeedback(correct ? 'correct' : 'incorrect');

      // Gerar feedback explicativo
      const explanatoryFeedback = getExplanatoryFeedback(correct, errors + 1);
      setFeedbackMessage(explanatoryFeedback.message);
      setFeedbackType(explanatoryFeedback.type);

      if (correct) {
        // Feedback tátil ao acertar
        import('@/services/HapticFeedbackService').then(({ hapticFeedbackService }) => {
          hapticFeedbackService.success();
        });

        const newConsecutiveSuccesses = consecutiveSuccesses + 1;
        setConsecutiveSuccesses(newConsecutiveSuccesses);
        setStreak((s) => s + 1);

        // Só incrementa repetição se tiver 3 sucessos consecutivos
        if (newConsecutiveSuccesses >= 3) {
          setCurrentRep((r) => r + 1);
          setConsecutiveSuccesses(0); // Reset após contar como repetição válida

          // Atualizar melhor tempo
          if (!bestTime || timer < bestTime) {
            setBestTime(timer);
          }

          // Dar XP
          const baseXP = 10;
          const streakBonus = Math.min(streak, 5) * 2;
          addXP(baseXP + streakBonus);

          // Verificar conclusão
          if (currentRep + 1 >= targetRepetitions) {
            const finalAccuracy = Math.round(
              ((targetRepetitions - errors) / targetRepetitions) * 100
            );
            setAccuracy(finalAccuracy);
            setPhase('complete');

            // Feedback tátil ao completar módulo
            import('@/services/HapticFeedbackService').then(({ hapticFeedbackService }) => {
              hapticFeedbackService.complete();
            });

            // Atualizar progresso da habilidade
            const skillId = `chord-${chord.name.toLowerCase()}`;
            const progress = Math.min(100, finalAccuracy);
            updateSkillProgress(skillId, progress, finalAccuracy);

            // Registrar sessão nas métricas
            const totalAttempts = targetRepetitions * 3; // 3 tentativas por repetição
            const correctAttempts = totalAttempts - errors;
            const consistency = consecutiveSuccesses > 0 
              ? Math.round((consecutiveSuccesses / (consecutiveSuccesses + errors)) * 100)
              : 0;
            
            recordSession({
              type: 'chord',
              duration: Math.round(timer / 1000), // Converter para segundos
              accuracy: finalAccuracy,
              attempts: totalAttempts,
              correct: correctAttempts,
              consistency: Math.max(consistency, finalAccuracy), // Usar acurácia como fallback
              metadata: {
                chordName: chord.name,
              },
            });

            onComplete(finalAccuracy, timer);
          }
        }
      } else {
        // Feedback sonoro de erro de execução (volume baixo para não distrair)
        feedbackSoundService.playFeedback('error_execution', 0.12);

        setStreak(0);
        setErrors((e) => e + 1);
        setConsecutiveSuccesses(0); // Reset contador de sucessos consecutivos
      }

      // Limpar feedback após 2.5 segundos (mais tempo para ler feedback explicativo)
      feedbackTimeoutRef.current = setTimeout(() => {
        setFeedback(null);
        setFeedbackMessage('');
        setFeedbackType(null);
        if (correct && consecutiveSuccesses + 1 >= 3) {
          setTimer(0); // Reset timer apenas quando completar uma repetição válida
        }
      }, 2500);
    },
    [
      timer,
      bestTime,
      streak,
      currentRep,
      targetRepetitions,
      errors,
      chord,
      addXP,
      updateSkillProgress,
      onComplete,
      consecutiveSuccesses,
    ]
  );

  // Tocar som do acorde
  const playChordSound = async () => {
    try {
      await unifiedAudioService.ensureInitialized();
      await unifiedAudioService.playChord(chord.name, 1.0);
    } catch (error) {
      console.error('Erro ao tocar acorde:', error);
    }
  };

  // Definir contexto de treino quando entrar na fase de prática
  useEffect(() => {
    if (phase === 'practice') {
      audioPriorityManager.setContext('training');
    } else if (phase === 'complete') {
      audioPriorityManager.setContext(null);
    }
    // Cleanup: remover contexto ao desmontar
    return () => {
      if (phase === 'practice') {
        audioPriorityManager.setContext(null);
      }
    };
  }, [phase]);

  // Reiniciar exercício com variação controlada
  const restart = () => {
    setPhase('learn');
    setCurrentRep(0);
    setConsecutiveSuccesses(0);
    setFeedback(null);
    setFeedbackMessage('');
    setFeedbackType(null);
    setShowHint(true);
    setTimer(0);
    setBestTime(null);
    setStreak(0);
    setAccuracy(100);
    setErrors(0);
    setLastAttempt(null);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      {/* Header com informações */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Acorde {chord.name}</h2>
          <p className="text-gray-400 text-sm">
            {phase === 'learn'
              ? 'Aprenda o posicionamento'
              : phase === 'practice'
              ? `${currentRep}/${targetRepetitions} repetições completas`
              : 'Exercício Completo!'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {streak > 1 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400"
            >
              <Zap className="w-4 h-4" />
              <span className="text-sm font-bold">{streak}x</span>
            </motion.div>
          )}

          {phase === 'practice' && (
            <div className="flex items-center gap-1 text-gray-400">
              <Timer className="w-4 h-4" />
              <span className="text-sm font-mono">{(timer / 1000).toFixed(1)}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Mensagem Pedagógica Contextual */}
      <AnimatePresence>
        {pedagogicalMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
              phase === 'practice' && consecutiveSuccesses < 3
                ? 'bg-blue-500/20 border border-blue-500/30'
                : 'bg-purple-500/20 border border-purple-500/30'
            }`}
          >
            <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-200 flex-1">{pedagogicalMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador de Sucessos Consecutivos */}
      {phase === 'practice' && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-gray-400">Sucessos consecutivos:</span>
          <div className="flex gap-1">
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  consecutiveSuccesses >= num
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {num}
              </div>
            ))}
          </div>
          {consecutiveSuccesses < 3 && (
            <Badge variant="outline" className="ml-auto text-xs border-orange-500/50 text-orange-400">
              Precisa de {3 - consecutiveSuccesses} mais
            </Badge>
          )}
        </div>
      )}

      {/* Diagrama do Acorde */}
      <div className="relative mb-6">
        {/* Braço do violão */}
        <div className="bg-amber-900/30 rounded-lg p-4 border border-amber-700/30">
          {/* Trastes */}
          <div className="grid grid-cols-5 gap-0">
            {/* Nut (pestana) */}
            <div className="col-span-5 h-2 bg-amber-200/50 rounded mb-2" />

            {/* 4 trastes */}
            {[1, 2, 3, 4].map((fret) => (
              <div
                key={fret}
                className="col-span-5 border-b border-amber-600/30 py-3 relative"
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-amber-500/50 pr-2">
                  {fret}
                </div>

                {/* Cordas e dedos */}
                <div className="flex justify-between px-4">
                  {[6, 5, 4, 3, 2, 1].map((string) => {
                    const finger = fingers.find((f) => f.string === string && f.fret === fret);
                    const isCriticalString = criticalStrings.includes(string);
                    const isErrorProneFinger =
                      finger && errorProneFingers.includes(finger.finger);

                    return (
                      <div key={string} className="relative">
                        {/* Corda com destaque se crítica */}
                        <div
                          className={`w-0.5 h-12 mx-auto ${
                            isCriticalString
                              ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]'
                              : 'bg-amber-400/60'
                          }`}
                        />

                        {/* Dedo com destaque se propenso a erro */}
                        {finger && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                              w-8 h-8 rounded-full ${fingerColors[finger.finger]} 
                              flex items-center justify-center text-white text-sm font-bold
                              shadow-lg ${
                                showHint
                                  ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800'
                                  : ''
                              } ${
                              isErrorProneFinger
                                ? 'ring-2 ring-orange-400 ring-offset-2 ring-offset-gray-800 animate-pulse'
                                : ''
                            }`}
                          >
                            {finger.finger}
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Números das cordas com destaque para críticas */}
          <div className="flex justify-between px-4 mt-2 text-xs">
            {[6, 5, 4, 3, 2, 1].map((string) => {
              const isCritical = criticalStrings.includes(string);
              const shouldPlay = stringsToPlay.includes(string);
              return (
                <span
                  key={string}
                  className={
                    shouldPlay
                      ? isCritical
                        ? 'text-yellow-400 font-bold'
                        : 'text-green-400'
                      : 'text-red-400/50'
                  }
                >
                  {shouldPlay ? string : 'X'}
                </span>
              );
            })}
          </div>
        </div>

        {/* Feedback Visual e Explicativo */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`absolute inset-0 flex flex-col items-center justify-center rounded-lg p-4
                ${feedback === 'correct' 
                  ? 'bg-green-500/20 border-2 border-green-500/50' 
                  : 'bg-red-500/20 border-2 border-red-500/50'}`}
            >
              {feedback === 'correct' ? (
                <>
                  <CheckCircle2 className="w-16 h-16 text-green-400 mb-2" />
                  <p className="text-green-400 font-semibold text-center">Correto!</p>
                </>
              ) : (
                <>
                  <XCircle className="w-16 h-16 text-red-400 mb-2" />
                  <p className="text-red-400 font-semibold text-center mb-1">Precisa ajustar</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legenda dos dedos com destaque para os propensos a erro */}
      {phase === 'learn' && (
        <div className="flex flex-wrap gap-3 mb-6 p-3 rounded-lg bg-white/5">
          {fingers.map((f) => {
            const isErrorProne = errorProneFingers.includes(f.finger);
            return (
              <div
                key={`${f.string}-${f.fret}`}
                className={`flex items-center gap-2 ${
                  isErrorProne ? 'bg-orange-500/20 p-2 rounded border border-orange-500/30' : ''
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full ${fingerColors[f.finger]} flex items-center justify-center text-white text-xs font-bold ${
                    isErrorProne ? 'ring-2 ring-orange-400' : ''
                  }`}
                >
                  {f.finger}
                </div>
                <span className="text-sm text-gray-300">
                  {fingerNames[f.finger]}: {f.string}ª corda, {f.fret}º traste
                  {isErrorProne && (
                    <span className="ml-1 text-orange-400 text-xs">⚠ Atenção</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Progresso */}
      {phase === 'practice' && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Progresso</span>
            <span>{currentRep}/{targetRepetitions}</span>
          </div>
          <Progress value={(currentRep / targetRepetitions) * 100} className="h-2" />
        </div>
      )}

      {/* Resultado Final */}
      {phase === 'complete' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30"
        >
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-10 h-10 text-yellow-400" />
            <div>
              <h3 className="text-xl font-bold text-white">Parabéns!</h3>
              <p className="text-gray-300">Você dominou o acorde {chord.name}!</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-400">{accuracy}%</p>
              <p className="text-xs text-gray-400">Precisão</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-cyan-400">
                {bestTime ? (bestTime / 1000).toFixed(1) : '0.0'}s
              </p>
              <p className="text-xs text-gray-400">Melhor Tempo</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">
                +{(targetRepetitions - errors) * 10 + streak * 2}
              </p>
              <p className="text-xs text-gray-400">XP Ganho</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Ações */}
      <div className="flex gap-3">
        {phase === 'learn' && (
          <>
            <Button
              onClick={playChordSound}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Ouvir Som
            </Button>
            <Button
              onClick={() => {
                setPhase('practice');
                setShowHint(false);
              }}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Começar Prática
            </Button>
          </>
        )}

        {phase === 'practice' && (
          <>
            <Button
              onClick={() => setShowHint(!showHint)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              {showHint ? 'Esconder Dica' : 'Mostrar Dica'}
            </Button>
            <Button
              onClick={() => handleChordAttempt(true)}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Acertei!
            </Button>
            <Button
              onClick={() => handleChordAttempt(false)}
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Errei
            </Button>
          </>
        )}

        {phase === 'complete' && (
          <>
            <Button
              onClick={restart}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Praticar Mais
            </Button>
            <Button
              onClick={() => onComplete(accuracy, timer)}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              <Target className="w-4 h-4 mr-2" />
              Próximo Exercício
            </Button>
          </>
        )}
      </div>

      {/* Feedback Explicativo */}
      <AnimatePresence>
        {feedback && feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`mt-4 p-4 rounded-lg border-2 ${
              feedback === 'correct'
                ? 'bg-green-500/10 border-green-500/30'
                : feedbackType === 'muted_string'
                ? 'bg-orange-500/10 border-orange-500/30'
                : feedbackType === 'wrong_fingering'
                ? 'bg-blue-500/10 border-blue-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <div className="flex items-start gap-3">
              {feedback === 'correct' ? (
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              ) : feedbackType === 'muted_string' ? (
                <VolumeX className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
              ) : feedbackType === 'wrong_fingering' ? (
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-semibold mb-1 ${
                  feedback === 'correct'
                    ? 'text-green-400'
                    : feedbackType === 'muted_string'
                    ? 'text-orange-400'
                    : feedbackType === 'wrong_fingering'
                    ? 'text-blue-400'
                    : 'text-red-400'
                }`}>
                  {feedback === 'correct' ? 'Ótimo!' : feedbackType === 'muted_string' ? 'Corda Abafada' : feedbackType === 'wrong_fingering' ? 'Posição dos Dedos' : 'Ajuste Necessário'}
                </p>
                <p className="text-sm text-gray-300">{feedbackMessage}</p>
                {feedback !== 'correct' && feedbackType === 'muted_string' && criticalStrings.length > 0 && (
                  <p className="text-xs text-orange-300 mt-2">
                    💡 Dica: Preste atenção especial nas cordas {criticalStrings.join(', ')} - elas são críticas para este acorde!
                  </p>
                )}
                {feedback !== 'correct' && feedbackType === 'wrong_fingering' && errorProneFingers.length > 0 && (
                  <p className="text-xs text-blue-300 mt-2">
                    💡 Dica: Os dedos {errorProneFingers.map(f => fingerNames[f]).join(', ')} são os mais desafiadores neste acorde. Pratique-os separadamente!
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meta Clara do Exercício */}
      {phase === 'practice' && (
        <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-400" />
            <h4 className="text-sm font-bold text-white">Meta do Exercício</h4>
          </div>
          <div className="space-y-2 text-sm text-gray-300">
            <p>
              <strong className="text-white">Objetivo:</strong> Executar o acorde {chord.name} corretamente{' '}
              <strong className="text-blue-400">{targetRepetitions} vezes</strong> consecutivas.
            </p>
            <p>
              <strong className="text-white">Requisito:</strong> Cada repetição precisa de{' '}
              <strong className="text-green-400">3 execuções consecutivas corretas</strong> para contar.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              💡 <strong>Dica:</strong> Foque em qualidade, não velocidade. Um acorde limpo é melhor que vários rápidos com erros!
            </p>
          </div>
        </div>
      )}

      {/* Dica de feedback rápido */}
      {phase === 'practice' && !feedback && (
        <p className="text-center text-xs text-gray-500 mt-4">
          Toque o acorde e clique em "Acertei" se o som estiver limpo, ou "Errei" se houver
          zumbido ou cordas abafadas. Você precisa de 3 execuções consecutivas corretas para cada repetição contar.
        </p>
      )}
    </Card>
  );
}
