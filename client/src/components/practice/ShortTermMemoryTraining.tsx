/**
 * Treino de Memória Auditiva Curta
 * Desenvolve retenção sonora e ajuda reconhecimento em músicas reais
 * Sem criar novo sistema de avaliação - feedback simples e imediato
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Brain, CheckCircle2, XCircle, Volume2, RotateCcw } from 'lucide-react';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  STIMULUS_DURATIONS,
  STIMULUS_SPACING,
} from '@/services/AuditoryStimulusConfig';

// Notas básicas para sequências (oitava 4)
const BASIC_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];

// Tipos de exercício
type ExerciseType = 'identification' | 'repetition';

interface Exercise {
  sequence: string[]; // Sequência de notas
  correctAnswer: string; // Para identificação: sequência correta
  options?: string[]; // Opções para escolha (apenas identificação)
  type: ExerciseType;
}

export function ShortTermMemoryTraining() {
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sequenceLength, setSequenceLength] = useState(2); // Começar com 2 notas
  const [exerciseType, setExerciseType] = useState<ExerciseType>('identification');
  const [userAnswer, setUserAnswer] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [hasPlayed, setHasPlayed] = useState(false);

  // Gerar exercício
  const generateExercise = (length: number, type: ExerciseType): Exercise => {
    // Gerar sequência aleatória de notas
    const sequence: string[] = [];
    for (let i = 0; i < length; i++) {
      const randomNote = BASIC_NOTES[Math.floor(Math.random() * BASIC_NOTES.length)];
      sequence.push(randomNote);
    }

    if (type === 'identification') {
      // Criar opções: uma correta e outras incorretas
      const options: string[] = [sequence.join(' → ')]; // Resposta correta
      
      // Gerar opções incorretas (sequências diferentes)
      while (options.length < 4) {
        const wrongSequence: string[] = [];
        for (let i = 0; i < length; i++) {
          const randomNote = BASIC_NOTES[Math.floor(Math.random() * BASIC_NOTES.length)];
          wrongSequence.push(randomNote);
        }
        const wrongOption = wrongSequence.join(' → ');
        
        // Garantir que não seja igual à correta
        if (!options.includes(wrongOption)) {
          options.push(wrongOption);
        }
      }
      
      // Embaralhar opções
      const shuffled = options.sort(() => Math.random() - 0.5);
      
      return {
        sequence,
        correctAnswer: sequence.join(' → '),
        options: shuffled,
        type: 'identification',
      };
    } else {
      // Tipo repetição: usuário vai clicar nas notas na ordem
      return {
        sequence,
        correctAnswer: sequence.join(' → '),
        type: 'repetition',
      };
    }
  };

  // Tocar sequência
  const playSequence = async (sequence?: string[]) => {
    const sequenceToPlay = sequence || currentExercise?.sequence;
    if (!sequenceToPlay || isPlaying) return;
    
    setIsPlaying(true);
    setHasPlayed(true);
    
    try {
      await unifiedAudioService.ensureInitialized();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Usar durações e espaçamentos padronizados para máxima clareza
      const noteDuration = STIMULUS_DURATIONS.memorySequence;
      const delayBetweenNotes = STIMULUS_SPACING.betweenMemoryNotes;
      
      console.log('🧠 [Memória Auditiva] Tocando sequência:', sequenceToPlay);
      
      for (let i = 0; i < sequenceToPlay.length; i++) {
        const note = sequenceToPlay[i];
        await unifiedAudioService.playNote(note, noteDuration);
        
        // Delay padronizado entre notas (exceto após a última)
        if (i < sequenceToPlay.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenNotes));
        }
      }
      
      console.log('✅ [Memória Auditiva] Sequência tocada');
    } catch (error) {
      console.error('❌ Erro ao tocar sequência:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  // Adicionar nota à resposta do usuário (modo repetição)
  const addNoteToAnswer = (note: string) => {
    if (exerciseType !== 'repetition' || showResult || !hasPlayed) return;
    
    setUserAnswer(prev => [...prev, note]);
    
    // Tocar feedback sonoro curto
    unifiedAudioService.playNote(note, 0.3).catch(() => {});
  };

  // Verificar resposta
  const checkAnswer = () => {
    if (!currentExercise || !hasPlayed) return;
    
    let isCorrect = false;
    
    if (exerciseType === 'identification') {
      isCorrect = selectedOption === currentExercise.correctAnswer;
    } else {
      // Modo repetição: verificar se a sequência está correta
      const userSequence = userAnswer.join(' → ');
      isCorrect = userSequence === currentExercise.correctAnswer;
    }
    
    setShowResult(true);
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    
    console.log(`🎯 [Memória Auditiva] Resposta: ${isCorrect ? 'Correta' : 'Incorreta'}`);
  };

  // Próximo exercício
  const nextExercise = () => {
    // Aumentar comprimento gradualmente após acertos consecutivos
    const newLength = score.total > 0 && score.correct === score.total && score.total % 3 === 0
      ? Math.min(sequenceLength + 1, 6) // Máximo 6 notas
      : sequenceLength;
    
    setSequenceLength(newLength);
    
    const newExercise = generateExercise(newLength, exerciseType);
    setCurrentExercise(newExercise);
    setUserAnswer([]);
    setSelectedOption(null);
    setShowResult(false);
    setHasPlayed(false);
    
    // Pausa auditiva antes de tocar próximo
    setTimeout(() => {
      playSequence(newExercise.sequence);
    }, 1500);
  };

  // Reiniciar exercício
  const resetExercise = () => {
    setSequenceLength(2);
    setScore({ correct: 0, total: 0 });
    const exercise = generateExercise(2, exerciseType);
    setCurrentExercise(exercise);
    setUserAnswer([]);
    setSelectedOption(null);
    setShowResult(false);
    setHasPlayed(false);
    
    setTimeout(() => {
      playSequence(exercise.sequence);
    }, 500);
  };

  // Inicializar primeiro exercício
  useEffect(() => {
    const exercise = generateExercise(sequenceLength, exerciseType);
    setCurrentExercise(exercise);
    setTimeout(() => {
      playSequence(exercise.sequence);
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseType]);

  // Atualizar exercício quando mudar tipo ou comprimento
  useEffect(() => {
    if (currentExercise) {
      const exercise = generateExercise(sequenceLength, exerciseType);
      setCurrentExercise(exercise);
      setUserAnswer([]);
      setSelectedOption(null);
      setShowResult(false);
      setHasPlayed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseType, sequenceLength]);

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  const isCorrect = showResult && currentExercise && (
    exerciseType === 'identification'
      ? selectedOption === currentExercise.correctAnswer
      : userAnswer.join(' → ') === currentExercise.correctAnswer
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            Memória Auditiva Curta
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Desenvolva retenção sonora - lembre-se de sequências curtas
          </p>
        </div>
        
        {/* Estatísticas */}
        {score.total > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{score.correct}/{score.total}</div>
            <div className="text-sm text-gray-400">{accuracy}% de precisão</div>
            <div className="text-xs text-gray-500 mt-1">
              Sequência: {sequenceLength} nota{sequenceLength !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* Seletor de Tipo de Exercício */}
      <div className="flex gap-2">
        <Button
          onClick={() => {
            setExerciseType('identification');
            setSequenceLength(2);
            setScore({ correct: 0, total: 0 });
          }}
          variant={exerciseType === 'identification' ? 'default' : 'outline'}
          className={
            exerciseType === 'identification'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              : 'border-white/20 text-white hover:bg-white/10'
          }
          size="sm"
        >
          Identificação
        </Button>
        <Button
          onClick={() => {
            setExerciseType('repetition');
            setSequenceLength(2);
            setScore({ correct: 0, total: 0 });
          }}
          variant={exerciseType === 'repetition' ? 'default' : 'outline'}
          className={
            exerciseType === 'repetition'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              : 'border-white/20 text-white hover:bg-white/10'
          }
          size="sm"
        >
          Repetição
        </Button>
        <Button
          onClick={resetExercise}
          variant="outline"
          size="sm"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Reiniciar
        </Button>
      </div>

      {/* Exercício Atual */}
      {currentExercise && (
        <Card className="p-6 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10">
          {/* Instruções */}
          <div className="text-center mb-6">
            <h4 className="text-lg font-bold text-white mb-2">
              {exerciseType === 'identification'
                ? 'Ouça a sequência e identifique qual foi tocada:'
                : 'Ouça a sequência e repita clicando nas notas na ordem:'}
            </h4>
            <p className="text-gray-300 text-sm">
              {exerciseType === 'identification'
                ? `Sequência de ${sequenceLength} nota${sequenceLength !== 1 ? 's' : ''} - escolha a opção correta`
                : `Sequência de ${sequenceLength} nota${sequenceLength !== 1 ? 's' : ''} - clique nas notas na ordem que você ouviu`}
            </p>
          </div>

          {/* Botão de Tocar */}
          <div className="flex justify-center mb-6">
            <Button
              onClick={() => playSequence()}
              disabled={isPlaying}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Play className="w-5 h-5 mr-2" />
              {isPlaying ? 'Tocando...' : 'Ouvir Sequência'}
            </Button>
          </div>

          {/* Modo Identificação */}
          {exerciseType === 'identification' && currentExercise.options && (
            <div className="space-y-3 mb-4">
              {currentExercise.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => {
                    if (!showResult) {
                      setSelectedOption(option);
                    }
                  }}
                  disabled={showResult}
                  className={`w-full h-auto py-4 text-left justify-start ${
                    showResult
                      ? option === currentExercise.correctAnswer
                        ? 'bg-green-500/20 border-2 border-green-500/50'
                        : selectedOption === option
                        ? 'bg-red-500/20 border-2 border-red-500/50'
                        : 'bg-white/5 border border-white/10'
                      : selectedOption === option
                      ? 'bg-purple-500/20 border-2 border-purple-500/50'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {showResult && option === currentExercise.correctAnswer && (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    )}
                    {showResult && selectedOption === option && option !== currentExercise.correctAnswer && (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-white font-semibold">{option}</span>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {/* Modo Repetição */}
          {exerciseType === 'repetition' && (
            <div className="space-y-4 mb-4">
              {/* Botões de Notas */}
              <div className="grid grid-cols-7 gap-2">
                {BASIC_NOTES.map((note) => (
                  <Button
                    key={note}
                    onClick={() => addNoteToAnswer(note)}
                    disabled={showResult || !hasPlayed}
                    className={`h-16 ${
                      showResult
                        ? 'bg-white/5 border border-white/10'
                        : 'bg-white/10 border border-white/20 hover:bg-white/20'
                    }`}
                  >
                    <span className="text-white font-bold">{note.replace('4', '')}</span>
                  </Button>
                ))}
              </div>
              
              {/* Sequência do Usuário */}
              {userAnswer.length > 0 && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm text-gray-400 mb-2">Sua sequência:</p>
                  <p className="text-white font-semibold">
                    {userAnswer.join(' → ')}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {userAnswer.length}/{sequenceLength} nota{sequenceLength !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Botão Verificar */}
          {hasPlayed && !showResult && (
            <div className="flex justify-center mt-4">
              <Button
                onClick={checkAnswer}
                disabled={
                  (exerciseType === 'identification' && !selectedOption) ||
                  (exerciseType === 'repetition' && userAnswer.length !== sequenceLength)
                }
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                Verificar Resposta
              </Button>
            </div>
          )}

          {/* Resultado */}
          {showResult && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 mt-4"
              >
                {/* Feedback */}
                <div className={`p-4 rounded-lg border-2 ${
                  isCorrect
                    ? 'bg-green-500/20 border-green-500/50'
                    : 'bg-red-500/20 border-red-500/50'
                }`}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                        <span className="text-xl font-bold text-green-400">Correto! 🎉</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-6 h-6 text-red-400" />
                        <span className="text-xl font-bold text-red-400">Não foi dessa vez</span>
                      </>
                    )}
                  </div>
                  
                  <div className="text-center text-gray-300 text-sm space-y-1">
                    <p>
                      <strong className="text-white">Sequência correta:</strong> {currentExercise.correctAnswer}
                    </p>
                    {exerciseType === 'repetition' && (
                      <p>
                        <strong className="text-white">Sua sequência:</strong> {userAnswer.join(' → ') || '(vazia)'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Dica Contextual */}
                {!isCorrect && (
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-xs text-blue-300 text-center">
                      💡 <strong>Dica:</strong> Tente cantar mentalmente a sequência enquanto ouve. 
                      Isso ajuda a reter na memória!
                    </p>
                  </div>
                )}

                {/* Botão Próximo */}
                <Button
                  onClick={nextExercise}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  Próximo Exercício
                </Button>
              </motion.div>
            </AnimatePresence>
          )}
        </Card>
      )}

      {/* Dicas */}
      <Card className="p-5 bg-[#1a1a2e]/60 backdrop-blur-xl border-white/10">
        <h4 className="text-lg font-bold text-white mb-3">💡 Como Treinar</h4>
        <ul className="space-y-2 text-sm text-gray-300">
          <li>• <strong>Ouça com atenção:</strong> Foque na sequência completa, não apenas nas notas individuais</li>
          <li>• <strong>Cante mentalmente:</strong> Repetir a sequência "na cabeça" ajuda a reter</li>
          <li>• <strong>Comece devagar:</strong> O comprimento aumenta gradualmente conforme você melhora</li>
          <li>• <strong>Pratique regularmente:</strong> 5-10 minutos por dia desenvolvem memória auditiva</li>
          <li>• <strong>Aplicável a músicas:</strong> Essa habilidade ajuda você a reconhecer melodias e progressões</li>
        </ul>
      </Card>
    </div>
  );
}
