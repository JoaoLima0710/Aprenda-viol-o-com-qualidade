import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Check, X, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { audioRecorderService } from '@/services/AudioRecorderService';

interface PracticeModeProps {
  chords: string[];
  bpm: number;
  onComplete?: (accuracy: number) => void;
}

export function PracticeMode({ chords, bpm, onComplete }: PracticeModeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChordIndex, setCurrentChordIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const currentChord = chords[currentChordIndex];
  const progress = ((currentChordIndex + 1) / chords.length) * 100;
  const accuracy = attempts > 0 ? Math.round((score / attempts) * 100) : 0;
  
  // Countdown before start
  useEffect(() => {
    if (isPlaying && countdown === null) {
      setCountdown(3);
    }
  }, [isPlaying, countdown]);
  
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
    }
  }, [countdown]);
  
  const handleStart = async () => {
    setIsPlaying(true);
    setCurrentChordIndex(0);
    setScore(0);
    setAttempts(0);
    setFeedback(null);
    
    // Start recording
    const started = await audioRecorderService.startRecording();
    setIsRecording(started);
  };
  
  const handlePause = async () => {
    setIsPlaying(false);
    setCountdown(null);
    
    // Stop recording
    if (isRecording) {
      await audioRecorderService.stopRecording();
      setIsRecording(false);
    }
  };
  
  const handleReset = async () => {
    setIsPlaying(false);
    setCurrentChordIndex(0);
    setScore(0);
    setAttempts(0);
    setFeedback(null);
    setCountdown(null);
    
    // Stop recording
    if (isRecording) {
      await audioRecorderService.stopRecording();
      setIsRecording(false);
    }
  };
  
  const handleChordAttempt = async (isCorrect: boolean) => {
    setAttempts(prev => prev + 1);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      setFeedback('correct');
      
      // Feedback tátil ao acertar
      const { hapticFeedbackService } = await import('@/services/HapticFeedbackService');
      hapticFeedbackService.success();

      // Feedback sonoro de sucesso (volume baixo para não distrair)
      feedbackSoundService.playFeedback('success', 0.15);
      
      // CRÍTICO para tablets: Inicializar áudio primeiro
      try {
        await unifiedAudioService.ensureInitialized();
        
        // Obter AudioContext e inicializar scheduler
        const audioContext = unifiedAudioService.getAudioContext();
        if (audioContext) {
          const { audioContextScheduler } = await import('@/services/AudioContextScheduler');
          audioContextScheduler.initialize(audioContext);
          
          // Tocar acorde usando AudioContext time
          await unifiedAudioService.playChord(currentChord, 1.5);
          
          // Agendar próxima ação usando AudioContext time (1.5s após início do acorde)
          const currentTime = audioContext.currentTime;
          audioContextScheduler.scheduleOnce('practice-next-chord', async () => {
            if (currentChordIndex < chords.length - 1) {
              setCurrentChordIndex(prev => prev + 1);
              setFeedback(null);
            } else {
              // Practice complete
              setIsPlaying(false);
              
              // Feedback tátil ao completar módulo
              const { hapticFeedbackService } = await import('@/services/HapticFeedbackService');
              hapticFeedbackService.complete();
              
              // Stop recording and save
              if (isRecording) {
                const recording = await audioRecorderService.stopRecording();
                setIsRecording(false);
                
                if (recording && onComplete) {
                  onComplete(accuracy);
                }
              } else if (onComplete) {
                onComplete(accuracy);
              }
            }
          }, 1.5); // 1.5 segundos após início do acorde
        } else {
          // Fallback se AudioContext não estiver disponível
          await unifiedAudioService.playChord(currentChord, 1.5);
          setTimeout(async () => {
            if (currentChordIndex < chords.length - 1) {
              setCurrentChordIndex(prev => prev + 1);
              setFeedback(null);
            } else {
              setIsPlaying(false);
              const { hapticFeedbackService } = await import('@/services/HapticFeedbackService');
              hapticFeedbackService.complete();
              if (isRecording) {
                const recording = await audioRecorderService.stopRecording();
                setIsRecording(false);
                if (recording && onComplete) {
                  onComplete(accuracy);
                }
              } else if (onComplete) {
                onComplete(accuracy);
              }
            }
          }, 1500);
        }
      } catch (error) {
        console.error('Erro ao tocar acorde:', error);
      }
    } else {
      setFeedback('incorrect');
      
      // Feedback sonoro de erro de execução
      feedbackSoundService.playFeedback('error_execution', 0.12);
      
      // Feedback explicativo baseado em tentativas
      const errorMessages = [
        'Revise a posição dos dedos. Compare com o diagrama do acorde.',
        'Verifique se todas as cordas estão soando. Alguma pode estar abafada.',
        'Pratique formar o acorde mais devagar. Qualidade é mais importante que velocidade.',
        'Toque cada corda individualmente para identificar qual não está soando corretamente.',
      ];
      
      const messageIndex = Math.min(attempts - score - 1, errorMessages.length - 1);
      (window as any).__practiceModeFeedbackMessage = errorMessages[messageIndex];
      
      // Clear feedback after delay
      setTimeout(() => {
        setFeedback(null);
        (window as any).__practiceModeFeedbackMessage = '';
      }, 2000);
    }
  };
  
  const handlePlayChord = async () => {
    try {
      // CRÍTICO para tablets: Garantir inicialização primeiro
      await unifiedAudioService.ensureInitialized();
      await new Promise(resolve => setTimeout(resolve, 50));
      console.log('🎸 Tocando acorde:', currentChord);
      await unifiedAudioService.playChord(currentChord, 2);
    } catch (error) {
      console.error('Erro ao tocar acorde:', error);
    }
  };
  
  return (
    <div className="rounded-3xl p-8 bg-gradient-to-br from-[#1a1a2e] to-[#16162a] border border-white/10 shadow-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-white mb-2">Modo de Prática</h3>
        <p className="text-gray-400">Toque os acordes na sequência correta</p>
      </div>
      
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">Progresso</span>
          <span className="text-white font-semibold">{currentChordIndex + 1}/{chords.length}</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl p-4 bg-white/5 border border-white/10 text-center">
          <p className="text-xs text-gray-400 mb-1">Acertos</p>
          <p className="text-2xl font-bold text-[#10b981]">{score}</p>
        </div>
        <div className="rounded-2xl p-4 bg-white/5 border border-white/10 text-center">
          <p className="text-xs text-gray-400 mb-1">Tentativas</p>
          <p className="text-2xl font-bold text-white">{attempts}</p>
        </div>
        <div className="rounded-2xl p-4 bg-white/5 border border-white/10 text-center">
          <p className="text-xs text-gray-400 mb-1">Acurácia</p>
          <p className="text-2xl font-bold text-[#06b6d4]">{accuracy}%</p>
        </div>
      </div>
      
      {/* Countdown */}
      <AnimatePresence>
        {countdown !== null && countdown > 0 && (
          <motion.div
            className="flex items-center justify-center mb-8"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#a855f7] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-[#a855f7]/50">
              <span className="text-6xl font-bold text-white">{countdown}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Current Chord */}
      {isPlaying && countdown === null && (
        <motion.div
          key={currentChordIndex}
          className="mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center mb-6">
            <p className="text-sm text-gray-400 mb-2">Toque este acorde:</p>
            <div className="inline-block px-8 py-4 rounded-2xl bg-gradient-to-r from-[#06b6d4] to-[#0891b2] shadow-lg shadow-[#06b6d4]/30">
              <span className="text-5xl font-bold text-white font-mono">{currentChord}</span>
            </div>
          </div>
          
          <div className="flex justify-center mb-6">
            <Button
              onClick={handlePlayChord}
              variant="outline"
              className="bg-transparent border-white/20 text-gray-300 hover:bg-white/5"
            >
              <Play className="w-4 h-4 mr-2" />
              Ouvir Acorde
            </Button>
          </div>
          
          {/* Feedback Explicativo */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                className={`p-4 rounded-xl border-2 ${
                  feedback === 'correct'
                    ? 'bg-[#10b981]/10 border-[#10b981]/50'
                    : 'bg-[#ef4444]/10 border-[#ef4444]/50'
                }`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <div className="flex items-start gap-3">
                  {feedback === 'correct' ? (
                    <>
                      <Check className="w-6 h-6 text-[#10b981] mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-lg font-bold text-[#10b981] mb-1">Correto! 🎉</p>
                        <p className="text-sm text-gray-300">Ótimo trabalho! Continue para o próximo acorde.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <X className="w-6 h-6 text-[#ef4444] mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-lg font-bold text-[#ef4444] mb-1">Precisa ajustar</p>
                        {(window as any).__practiceModeFeedbackMessage && (
                          <p className="text-sm text-gray-300">{(window as any).__practiceModeFeedbackMessage}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Meta Clara do Exercício */}
          <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-400" />
              <h4 className="text-sm font-bold text-white">Meta do Exercício</h4>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                <strong className="text-white">Objetivo:</strong> Tocar todos os acordes da sequência corretamente.
              </p>
              <p>
                <strong className="text-white">Para melhorar:</strong> Foque em{' '}
                <strong className="text-green-400">qualidade do som</strong> - todas as cordas devem soar limpas, sem zumbido.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                💡 <strong>Dica:</strong> Se alguma corda não está soando, verifique se está pressionando com força suficiente e na posição correta!
              </p>
            </div>
          </div>
          
          {/* Practice Buttons */}
          {!feedback && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleChordAttempt(true)}
                size="lg"
                className="bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#34d399] hover:to-[#10b981] text-white font-bold"
              >
                <Check className="w-5 h-5 mr-2" />
                Acertei!
              </Button>
              <Button
                onClick={() => handleChordAttempt(false)}
                size="lg"
                className="bg-gradient-to-r from-[#ef4444] to-[#dc2626] hover:from-[#f87171] hover:to-[#ef4444] text-white font-bold"
              >
                <X className="w-5 h-5 mr-2" />
                Errei
              </Button>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Control Buttons */}
      <div className="flex gap-3">
        {!isPlaying ? (
          <Button
            onClick={handleStart}
            size="lg"
            className="flex-1 bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#34d399] hover:to-[#10b981] text-white font-bold"
          >
            <Play className="w-5 h-5 mr-2" />
            {attempts > 0 ? 'Recomeçar' : 'Iniciar Prática'}
          </Button>
        ) : (
          <>
            <Button
              onClick={handlePause}
              size="lg"
              className="flex-1 bg-gradient-to-r from-[#f97316] to-[#ea580c] hover:from-[#fb923c] hover:to-[#f97316] text-white font-bold"
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
              <RotateCcw className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>
      
      {/* Completion Message */}
      {!isPlaying && attempts > 0 && currentChordIndex >= chords.length - 1 && (
        <motion.div
          className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-[#10b981]/20 to-[#059669]/20 border border-[#10b981]/50"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="text-center">
            <h4 className="text-2xl font-bold text-white mb-2">🎉 Prática Concluída!</h4>
            <p className="text-gray-300">
              Você acertou <span className="font-bold text-[#10b981]">{score}</span> de{' '}
              <span className="font-bold">{chords.length}</span> acordes
            </p>
            <p className="text-3xl font-bold text-[#06b6d4] mt-2">{accuracy}% de acurácia</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
