/**
 * 🎸 Chord Progression Practice Component
 * 
 * Treino de troca de acordes com progressão pedagógica real.
 * 
 * Funcionalidades:
 * - Progressões reais (C → G → Am → F, etc.)
 * - Loop por compassos
 * - Controle de tempo via metrônomo existente
 * - Travamento de BPM até atingir consistência mínima
 * - Feedback de timing (adiantou/atrasou)
 * 
 * REGRAS:
 * - NÃO cria novos serviços de áudio
 * - NÃO toca em GuitarSetAudioService ou AudioBus
 * - NÃO usa Web Audio API diretamente
 * - NÃO altera testes existentes
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Award,
  Lock,
  Unlock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { metronomeService } from '@/services/MetronomeService';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { feedbackSoundService } from '@/services/FeedbackSoundService';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { usePracticeMetricsStore } from '@/stores/usePracticeMetricsStore';
import { HARMONIC_PROGRESSIONS, type HarmonicProgression } from '@/data/progressions';
import { chords, type Chord } from '@/data/chords';

interface ChordProgressionPracticeProps {
  progressionId?: string;
  onComplete?: (accuracy: number, bpm: number) => void;
  onExit?: () => void;
}

interface TimingFeedback {
  type: 'early' | 'late' | 'perfect' | null;
  message: string;
}

// Configurações de progressão pedagógica
const BPM_PROGRESSION = {
  beginner: { start: 60, increment: 5, minConsistency: 0.8, requiredSuccesses: 3 },
  intermediate: { start: 80, increment: 5, minConsistency: 0.85, requiredSuccesses: 4 },
  advanced: { start: 100, increment: 10, minConsistency: 0.9, requiredSuccesses: 5 },
};

const TIMING_TOLERANCE_MS = 200; // Tolerância de ±200ms para considerar "perfeito"

export function ChordProgressionPractice({
  progressionId,
  onComplete,
  onExit,
}: ChordProgressionPracticeProps) {
  // Estado principal
  const [selectedProgression, setSelectedProgression] = useState<HarmonicProgression | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChordIndex, setCurrentChordIndex] = useState(0);
  const [currentMeasure, setCurrentMeasure] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [bpm, setBpm] = useState(60);
  const [isBpmLocked, setIsBpmLocked] = useState(true);
  
  // Progressão e consistência
  const [consecutiveSuccesses, setConsecutiveSuccesses] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [successfulChanges, setSuccessfulChanges] = useState(0);
  const [consistency, setConsistency] = useState(0);
  const [timingHistory, setTimingHistory] = useState<number[]>([]);
  
  // Feedback
  const [timingFeedback, setTimingFeedback] = useState<TimingFeedback>({ type: null, message: '' });
  const [currentChord, setCurrentChord] = useState<string>('');
  const [nextChord, setNextChord] = useState<string>('');
  
  // Refs
  const expectedChangeTimeRef = useRef<number>(0);
  const actualChangeTimeRef = useRef<number>(0);
  const beatCallbackRef = useRef<((beat: number, isDownbeat: boolean) => void) | null>(null);
  const timingFeedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number>(0);
  
  const { addXP } = useGamificationStore();
  const { recordSession } = usePracticeMetricsStore();

  // Inicializar progressão
  useEffect(() => {
    const progression = progressionId
      ? HARMONIC_PROGRESSIONS.find(p => p.id === progressionId)
      : HARMONIC_PROGRESSIONS.find(p => p.difficulty === 'beginner');
    
    if (progression) {
      setSelectedProgression(progression);
      const config = BPM_PROGRESSION[progression.difficulty];
      setBpm(config.start);
      setCurrentChord(progression.chords[0]);
      if (progression.chords.length > 1) {
        setNextChord(progression.chords[1]);
      }
    }
  }, [progressionId]);

  // Configurar callback do metrônomo
  useEffect(() => {
    if (!selectedProgression) return;

    beatCallbackRef.current = (beat: number, isDownbeat: boolean) => {
      setCurrentBeat(beat);
      
      // Trocar acorde no primeiro tempo do compasso (downbeat)
      if (isDownbeat && isPlaying) {
        const expectedTime = Date.now();
        expectedChangeTimeRef.current = expectedTime;
        
        // Avançar para próximo acorde
        setCurrentChordIndex((prev) => {
          const nextIndex = (prev + 1) % selectedProgression.chords.length;
          const nextChordName = selectedProgression.chords[nextIndex];
          const followingChordName = selectedProgression.chords[(nextIndex + 1) % selectedProgression.chords.length];
          
          setCurrentChord(nextChordName);
          setNextChord(followingChordName);
          
          // Incrementar compasso quando volta ao início
          if (nextIndex === 0) {
            setCurrentMeasure((m) => m + 1);
          }
          
          return nextIndex;
        });
      }
    };

    metronomeService.onBeat(beatCallbackRef.current);

    return () => {
      if (beatCallbackRef.current) {
        metronomeService.onBeat(() => {}); // Limpar callback
      }
    };
  }, [selectedProgression, isPlaying]);

  // Calcular consistência
  useEffect(() => {
    if (totalAttempts > 0) {
      const newConsistency = successfulChanges / totalAttempts;
      setConsistency(newConsistency);
      
      // Verificar se pode desbloquear BPM
      if (selectedProgression) {
        const config = BPM_PROGRESSION[selectedProgression.difficulty];
        if (newConsistency >= config.minConsistency && consecutiveSuccesses >= config.requiredSuccesses) {
          setIsBpmLocked(false);
        } else {
          setIsBpmLocked(true);
        }
      }
    }
  }, [successfulChanges, totalAttempts, consecutiveSuccesses, selectedProgression]);

  // Limpar feedback de timing
  useEffect(() => {
    return () => {
      if (timingFeedbackTimeoutRef.current) {
        clearTimeout(timingFeedbackTimeoutRef.current);
      }
    };
  }, []);

  // Handler para quando usuário troca acorde
  const handleChordChange = useCallback(() => {
    if (!isPlaying || !selectedProgression) return;

    const actualTime = Date.now();
    const expectedTime = expectedChangeTimeRef.current;
    const timingDiff = actualTime - expectedTime;
    const absTimingDiff = Math.abs(timingDiff);

    setTotalAttempts((prev) => prev + 1);
    setTimingHistory((prev) => [...prev.slice(-9), timingDiff]); // Manter últimas 10

    let feedback: TimingFeedback = { type: null, message: '' };

    if (absTimingDiff <= TIMING_TOLERANCE_MS) {
      // Perfeito
      feedback = { type: 'perfect', message: 'Perfeito! 🎯' };
      setSuccessfulChanges((prev) => prev + 1);
      setConsecutiveSuccesses((prev) => prev + 1);
      addXP(5);
    } else if (timingDiff < 0) {
      // Adiantou
      const absDiff = Math.abs(timingDiff);
      let message = '';
      let suggestion = '';
      
      if (absDiff < 100) {
        message = `Adiantou ${Math.round(absDiff)}ms - quase perfeito!`;
        suggestion = 'Aguarde um pouquinho mais antes de trocar o acorde. Você está quase lá!';
      } else if (absDiff < 200) {
        message = `Adiantou ${Math.round(absDiff)}ms - está trocando cedo demais`;
        suggestion = 'Aguarde o tempo do metrônomo. Conte mentalmente: "1, 2, 3, 4" e troque no "1" do próximo compasso.';
      } else {
        message = `Adiantou ${Math.round(absDiff)}ms - troca muito antecipada`;
        suggestion = 'Você está trocando o acorde antes do tempo. Pratique contar os tempos em voz alta e trocar apenas no primeiro tempo do compasso.';
      }
      
      feedback = {
        type: 'early',
        message: `${message} ${suggestion}`,
      };
      setConsecutiveSuccesses(0);
      
      // Feedback sonoro de erro de tempo
      feedbackSoundService.playFeedback('error_timing', 0.12);
    } else {
      // Atrasou
      let message = '';
      let suggestion = '';
      
      if (timingDiff < 100) {
        message = `Atrasou ${Math.round(timingDiff)}ms - quase perfeito!`;
        suggestion = 'Antecipe a troca um pouquinho mais. Você está quase lá!';
      } else if (timingDiff < 200) {
        message = `Atrasou ${Math.round(timingDiff)}ms - está trocando tarde`;
        suggestion = 'Antecipe a troca de acorde. Comece a mover os dedos um pouco antes do tempo para trocar no momento certo.';
      } else {
        message = `Atrasou ${Math.round(timingDiff)}ms - troca muito atrasada`;
        suggestion = 'Você está trocando o acorde depois do tempo. Pratique preparar os dedos antes do tempo e trocar no primeiro tempo do compasso.';
      }
      
      feedback = {
        type: 'late',
        message: `${message} ${suggestion}`,
      };
      setConsecutiveSuccesses(0);
      
      // Feedback sonoro de erro de tempo
      feedbackSoundService.playFeedback('error_timing', 0.12);
    }

    setTimingFeedback(feedback);

    // Limpar feedback após 1.5s
    if (timingFeedbackTimeoutRef.current) {
      clearTimeout(timingFeedbackTimeoutRef.current);
    }
    timingFeedbackTimeoutRef.current = setTimeout(() => {
      setTimingFeedback({ type: null, message: '' });
    }, 1500);
  }, [isPlaying, selectedProgression, addXP]);

  // Iniciar prática
  const handleStart = async () => {
    if (!selectedProgression) return;

    try {
      // Registrar sessão de lifecycle
      const { audioLifecycleManager } = await import('@/services/AudioLifecycleManager');
      audioLifecycleManager.startSession('training', 'ChordProgressionPractice', true);
      
      // Definir contexto de treino (prioridade máxima)
      const { audioPriorityManager } = await import('@/services/AudioPriorityManager');
      audioPriorityManager.setContext('training');
      
      // Feedback sonoro de início de treino
      const { actionFeedbackService } = await import('@/services/ActionFeedbackService');
      actionFeedbackService.playActionFeedback('training_start');
      
      await metronomeService.initialize();
      await metronomeService.start(bpm, '4/4');
      setIsPlaying(true);
      setCurrentChordIndex(0);
      setCurrentMeasure(0);
      setCurrentBeat(0);
      setConsecutiveSuccesses(0);
      setTotalAttempts(0);
      setSuccessfulChanges(0);
      setTimingHistory([]);
      setCurrentChord(selectedProgression.chords[0]);
      setNextChord(selectedProgression.chords[1] || selectedProgression.chords[0]);
      sessionStartTimeRef.current = Date.now();
    } catch (error) {
      console.error('Erro ao iniciar metrônomo:', error);
    }
  };

  // Pausar prática (registrar métricas se houver tentativas)
  const handlePause = () => {
    // Pausar sessão de lifecycle
    import('@/services/AudioLifecycleManager').then(({ audioLifecycleManager }) => {
      audioLifecycleManager.pauseSession();
    });
    
    // Remover contexto de treino
    import('@/services/AudioPriorityManager').then(({ audioPriorityManager }) => {
      audioPriorityManager.setContext(null);
    });
    
    metronomeService.stop();
    setIsPlaying(false);
    
    // Registrar sessão se houver tentativas
    if (totalAttempts > 0 && selectedProgression) {
      const duration = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
      const accuracy = Math.round((successfulChanges / totalAttempts) * 100);
      const currentConsistency = Math.round(consistency * 100);
      
      recordSession({
        type: 'chord_progression',
        duration,
        accuracy,
        attempts: totalAttempts,
        correct: successfulChanges,
        consistency: currentConsistency,
        metadata: {
          progressionName: selectedProgression.name,
          bpm,
        },
      });
      
      if (onComplete) {
        onComplete(accuracy, bpm);
      }
    }
  };

  // Parar e resetar (com variação controlada - mantém progressão mas reseta estado)
  const handleReset = () => {
    metronomeService.stop();
    setIsPlaying(false);
    setCurrentChordIndex(0);
    setCurrentMeasure(0);
    setCurrentBeat(0);
    setConsecutiveSuccesses(0);
    setTotalAttempts(0);
    setSuccessfulChanges(0);
    setTimingHistory([]);
    setConsistency(0);
    setTimingFeedback({ type: null, message: '' });
    if (selectedProgression) {
      const config = BPM_PROGRESSION[selectedProgression.difficulty];
      setBpm(config.start);
      setIsBpmLocked(true);
      setCurrentChord(selectedProgression.chords[0]);
      setNextChord(selectedProgression.chords[1] || selectedProgression.chords[0]);
    }
  };

  // Aumentar BPM (se desbloqueado)
  const handleIncreaseBpm = () => {
    if (isBpmLocked || !selectedProgression) return;
    
    const config = BPM_PROGRESSION[selectedProgression.difficulty];
    const newBpm = Math.min(200, bpm + config.increment);
    setBpm(newBpm);
    metronomeService.setBpm(newBpm);
    setIsBpmLocked(true); // Travar novamente até atingir consistência
    setConsecutiveSuccesses(0); // Reset contador
  };

  // Tocar acorde atual
  const handlePlayChord = async () => {
    try {
      await unifiedAudioService.ensureInitialized();
      await new Promise((resolve) => setTimeout(resolve, 50));
      await unifiedAudioService.playChord(currentChord, 1.5);
    } catch (error) {
      console.error('Erro ao tocar acorde:', error);
    }
  };

  if (!selectedProgression) {
    return (
      <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <p className="text-gray-400 text-center">Carregando progressão...</p>
      </Card>
    );
  }

  const config = BPM_PROGRESSION[selectedProgression.difficulty];
  const canIncreaseBpm = !isBpmLocked && consistency >= config.minConsistency;
  const progress = selectedProgression.chords.length > 0
    ? ((currentChordIndex + 1) / selectedProgression.chords.length) * 100
    : 0;

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-white">{selectedProgression.name}</h2>
          {onExit && (
            <Button onClick={onExit} variant="ghost" size="sm" className="text-gray-400">
              Sair
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-400">{selectedProgression.description}</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl p-3 bg-white/5 border border-white/10 text-center">
          <p className="text-xs text-gray-400 mb-1">BPM</p>
          <p className="text-xl font-bold text-white">{bpm}</p>
        </div>
        <div className="rounded-xl p-3 bg-white/5 border border-white/10 text-center">
          <p className="text-xs text-gray-400 mb-1">Consistência</p>
          <p className="text-xl font-bold text-cyan-400">{Math.round(consistency * 100)}%</p>
        </div>
        <div className="rounded-xl p-3 bg-white/5 border border-white/10 text-center">
          <p className="text-xs text-gray-400 mb-1">Compassos</p>
          <p className="text-xl font-bold text-purple-400">{currentMeasure}</p>
        </div>
        <div className="rounded-xl p-3 bg-white/5 border border-white/10 text-center">
          <p className="text-xs text-gray-400 mb-1">Sucessos</p>
          <p className="text-xl font-bold text-green-400">{consecutiveSuccesses}/{config.requiredSuccesses}</p>
        </div>
      </div>

      {/* Indicadores de compasso */}
      {isPlaying && (
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2, 3].map((beat) => (
            <div
              key={beat}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                currentBeat === beat
                  ? beat === 0
                    ? 'bg-orange-500 scale-125 shadow-lg shadow-orange-500/50'
                    : 'bg-purple-500 scale-110'
                  : 'bg-gray-700'
              }`}
            >
              <span className="text-white font-bold">{beat + 1}</span>
            </div>
          ))}
        </div>
      )}

      {/* Acorde atual e próximo */}
      <div className="mb-6">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-400 mb-2">Acorde Atual</p>
          <motion.div
            key={currentChord}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block px-8 py-6 rounded-2xl bg-gradient-to-r from-[#06b6d4] to-[#0891b2] shadow-lg shadow-[#06b6d4]/30 mb-4"
          >
            <span className="text-5xl font-bold text-white font-mono">{currentChord}</span>
          </motion.div>
        </div>

        {nextChord && nextChord !== currentChord && (
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Próximo: {nextChord}</p>
            <div className="inline-block px-4 py-2 rounded-lg bg-gray-700/50 border border-gray-600">
              <span className="text-lg font-semibold text-gray-300">{nextChord}</span>
            </div>
          </div>
        )}
      </div>

      {/* Progresso */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Progresso na Progressão</span>
          <span>{currentChordIndex + 1}/{selectedProgression.chords.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Feedback de timing explicativo */}
      <AnimatePresence>
        {timingFeedback.type && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 p-4 rounded-lg border-2 ${
              timingFeedback.type === 'perfect'
                ? 'bg-green-500/10 border-green-500/50'
                : timingFeedback.type === 'early'
                ? 'bg-yellow-500/10 border-yellow-500/50'
                : 'bg-red-500/10 border-red-500/50'
            }`}
          >
            <div className="flex items-start gap-3">
              {timingFeedback.type === 'perfect' && <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />}
              {timingFeedback.type === 'early' && <TrendingUp className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />}
              {timingFeedback.type === 'late' && <TrendingDown className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />}
              <div className="flex-1">
                <p
                  className={`text-sm font-semibold mb-1 ${
                    timingFeedback.type === 'perfect'
                      ? 'text-green-400'
                      : timingFeedback.type === 'early'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}
                >
                  {timingFeedback.type === 'perfect' ? 'Timing Perfeito!' : timingFeedback.type === 'early' ? 'Troca Antecipada' : 'Troca Atrasada'}
                </p>
                <p className="text-sm text-gray-300">{timingFeedback.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meta Clara do Exercício */}
      {selectedProgression && (
        <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-400" />
            <h4 className="text-sm font-bold text-white">Meta do Exercício</h4>
          </div>
          <div className="space-y-2 text-sm text-gray-300">
            <p>
              <strong className="text-white">Objetivo:</strong> Trocar acordes no tempo certo (dentro de ±{TIMING_TOLERANCE_MS}ms).
            </p>
            <p>
              <strong className="text-white">Para aumentar BPM:</strong> Você precisa de{' '}
              <strong className="text-green-400">{config.requiredSuccesses} trocas consecutivas perfeitas</strong> e{' '}
              <strong className="text-cyan-400">{Math.round(config.minConsistency * 100)}% de consistência</strong>.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              💡 <strong>Dica:</strong> Prepare os dedos antes do tempo. Antecipe a troca para que ela aconteça exatamente no primeiro tempo do compasso!
            </p>
          </div>
        </div>
      )}

      {/* Status de BPM */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {isBpmLocked ? (
          <>
            <Lock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-400">
              Alcance {Math.round(config.minConsistency * 100)}% de consistência e {config.requiredSuccesses} sucessos consecutivos para aumentar BPM
            </span>
          </>
        ) : (
          <>
            <Unlock className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400 font-semibold">BPM desbloqueado! Você pode aumentar a velocidade.</span>
          </>
        )}
      </div>

      {/* Controles */}
      <div className="space-y-3">
        {!isPlaying ? (
          <Button
            onClick={handleStart}
            size="lg"
            className="w-full bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#34d399] hover:to-[#10b981] text-white font-bold"
          >
            <Play className="w-5 h-5 mr-2" />
            Iniciar Prática
          </Button>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handlePause}
                size="lg"
                variant="outline"
                className="bg-transparent border-white/20 text-gray-300 hover:bg-white/5"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pausar
              </Button>
              <Button
                onClick={handleReset}
                size="lg"
                variant="outline"
                className="bg-transparent border-white/20 text-gray-300 hover:bg-white/5"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Resetar
              </Button>
            </div>
            
            <Button
              onClick={handleChordChange}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
            >
              <Target className="w-5 h-5 mr-2" />
              Troquei o Acorde
            </Button>
            
            <Button
              onClick={handlePlayChord}
              size="sm"
              variant="outline"
              className="w-full bg-transparent border-white/20 text-gray-300 hover:bg-white/5"
            >
              <Play className="w-4 h-4 mr-2" />
              Ouvir Acorde Atual
            </Button>
          </>
        )}

        {/* Botão para aumentar BPM */}
        {canIncreaseBpm && (
          <Button
            onClick={handleIncreaseBpm}
            size="lg"
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Aumentar BPM (+{config.increment})
          </Button>
        )}
      </div>

      {/* Progressão de acordes */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <p className="text-xs text-gray-400 mb-2">Progressão:</p>
        <div className="flex flex-wrap gap-2">
          {selectedProgression.chords.map((chord, index) => (
            <Badge
              key={index}
              variant={index === currentChordIndex ? 'default' : 'outline'}
              className={
                index === currentChordIndex
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-800 text-gray-300 border-gray-600'
              }
            >
              {chord}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}
