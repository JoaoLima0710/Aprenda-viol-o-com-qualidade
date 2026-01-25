import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Volume2, CheckCircle2, XCircle, Trophy, Target } from 'lucide-react';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { toast } from 'sonner';
import {
  STIMULUS_DURATIONS,
  STIMULUS_SPACING,
  CHORD_FORMATION_DELAYS,
} from '@/services/AuditoryStimulusConfig';

type ExerciseType = 'intervals' | 'chords' | 'melodies';

interface Exercise {
  type: ExerciseType;
  question: string;
  options: string[];
  correctAnswer: string;
  notes: string[];
}

const INTERVALS = [
  { name: 'Segunda Menor', semitones: 1, notes: ['C4', 'Db4'] },
  { name: 'Segunda Maior', semitones: 2, notes: ['C4', 'D4'] },
  { name: 'Terça Menor', semitones: 3, notes: ['C4', 'Eb4'] },
  { name: 'Terça Maior', semitones: 4, notes: ['C4', 'E4'] },
  { name: 'Quarta Justa', semitones: 5, notes: ['C4', 'F4'] },
  { name: 'Quinta Justa', semitones: 7, notes: ['C4', 'G4'] },
  { name: 'Sexta Menor', semitones: 8, notes: ['C4', 'Ab4'] },
  { name: 'Sexta Maior', semitones: 9, notes: ['C4', 'A4'] },
  { name: 'Oitava', semitones: 12, notes: ['C4', 'C5'] },
];

const CHORD_TYPES = [
  { name: 'Maior', notes: ['C4', 'E4', 'G4'] },
  { name: 'Menor', notes: ['C4', 'Eb4', 'G4'] },
  { name: 'Diminuto', notes: ['C4', 'Eb4', 'Gb4'] },
  { name: 'Aumentado', notes: ['C4', 'E4', 'G#4'] },
];

const MELODIES = [
  { name: 'Parabéns pra Você', notes: ['C4', 'C4', 'D4', 'C4', 'F4', 'E4'] },
  { name: 'Asa Branca', notes: ['G4', 'E4', 'G4', 'A4', 'G4', 'E4'] },
  { name: 'Ciranda Cirandinha', notes: ['C4', 'D4', 'E4', 'F4', 'G4'] },
];

export function EarTraining() {
  const [exerciseType, setExerciseType] = useState<ExerciseType>('intervals');
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showResult, setShowResult] = useState(false);

  const generateExercise = (type: ExerciseType): Exercise => {
    switch (type) {
      case 'intervals': {
        const interval = INTERVALS[Math.floor(Math.random() * INTERVALS.length)];
        const otherIntervals = INTERVALS.filter(i => i.name !== interval.name)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        const options = [interval.name, ...otherIntervals.map(i => i.name)]
          .sort(() => Math.random() - 0.5);
        
        return {
          type: 'intervals',
          question: 'Qual intervalo você ouviu?',
          options,
          correctAnswer: interval.name,
          notes: interval.notes,
        };
      }
      
      case 'chords': {
        const chord = CHORD_TYPES[Math.floor(Math.random() * CHORD_TYPES.length)];
        const otherChords = CHORD_TYPES.filter(c => c.name !== chord.name);
        const options = [chord.name, ...otherChords.map(c => c.name)]
          .sort(() => Math.random() - 0.5);
        
        return {
          type: 'chords',
          question: 'Qual tipo de acorde você ouviu?',
          options,
          correctAnswer: chord.name,
          notes: chord.notes,
        };
      }
      
      case 'melodies': {
        const melody = MELODIES[Math.floor(Math.random() * MELODIES.length)];
        const otherMelodies = MELODIES.filter(m => m.name !== melody.name);
        const options = [melody.name, ...otherMelodies.map(m => m.name)]
          .sort(() => Math.random() - 0.5);
        
        return {
          type: 'melodies',
          question: 'Qual melodia você ouviu?',
          options,
          correctAnswer: melody.name,
          notes: melody.notes,
        };
      }
    }
  };

  const startNewExercise = () => {
    const exercise = generateExercise(exerciseType);
    setCurrentExercise(exercise);
    setSelectedAnswer(null);
    setShowResult(false);
    playExercise(exercise.notes);
  };

  const playExercise = async (notes: string[]) => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    
    try {
      // Definir contexto de percepção auditiva
      const { audioPriorityManager } = await import('@/services/AudioPriorityManager');
      audioPriorityManager.setContext('auditory_perception');
      
      // Garantir que o audioService está inicializado
      console.log('🎵 Garantindo inicialização do audio service para treino de ouvido...');
      
      // Primeiro, garantir inicialização
      await unifiedAudioService.ensureInitialized();
      
      // Pequeno delay para garantir que tudo está pronto
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('✅ Audio service inicializado, tocando exercício:', exerciseType);
      console.log('🎼 Notas a tocar:', notes);
      
      // Configurações otimizadas para percepção auditiva:
      // - Duração consistente para melhor distinção
      // - Delay adequado entre notas para clareza
      // - Volumes normalizados
      
      if (exerciseType === 'chords') {
        // Para acordes, tocar as notas quase simultaneamente com duração otimizada
        console.log('🎸 [Ear Training] Tocando acorde:', notes);
        
        // Duração otimizada para acordes: suficiente para distinguir, não muito longo
        // Usar duração padronizada para acordes
        
        // Tocar todas as notas quase simultaneamente com delay padronizado
        const playPromises = notes.map((note, index) => {
          return new Promise<void>((resolve) => {
            setTimeout(async () => {
              try {
                // Duração padronizada para todos os acordes
                await unifiedAudioService.playNote(note, STIMULUS_DURATIONS.chord);
                resolve();
              } catch (error) {
                console.error(`Erro ao tocar nota ${note}:`, error);
                resolve();
              }
            }, index * CHORD_FORMATION_DELAYS.betweenChordNotes); // Delay padronizado
          });
        });
        
        await Promise.all(playPromises);
        console.log('✅ [Ear Training] Acorde tocado com sucesso');
        
      } else if (exerciseType === 'intervals') {
        // Para intervalos, tocar as duas notas sequencialmente com duração padronizada
        console.log('🎵 [Ear Training] Tocando intervalo:', notes);
        
        // Usar durações e espaçamentos padronizados para máxima clareza
        const intervalDuration = STIMULUS_DURATIONS.interval;
        const intervalDelay = STIMULUS_SPACING.betweenIntervals;
        
        for (let i = 0; i < notes.length; i++) {
          const note = notes[i];
          console.log(`🎼 [Ear Training] Tocando nota ${i + 1}/${notes.length}:`, note);
          
          // Duração padronizada para melhor comparação entre intervalos
          await unifiedAudioService.playNote(note, intervalDuration);
          
          // Delay padronizado entre notas (exceto após a última)
          if (i < notes.length - 1) {
            await new Promise(resolve => setTimeout(resolve, intervalDelay));
          }
        }
        console.log('✅ [Ear Training] Intervalo tocado com sucesso');
        
      } else {
        // Para melodias, tocar sequência de notas com duração padronizada
        console.log('🎶 [Ear Training] Tocando melodia:', notes);
        
        // Usar durações e espaçamentos padronizados para máxima clareza
        const melodyDuration = STIMULUS_DURATIONS.singleNote;
        const melodyDelay = STIMULUS_SPACING.betweenNotes;
        
        for (let i = 0; i < notes.length; i++) {
          const note = notes[i];
          console.log(`🎼 [Ear Training] Tocando nota ${i + 1}/${notes.length}:`, note);
          
          // Duração padronizada para melhor reconhecimento melódico
          await unifiedAudioService.playNote(note, melodyDuration);
          
          // Delay padronizado entre notas (exceto após a última)
          if (i < notes.length - 1) {
            await new Promise(resolve => setTimeout(resolve, melodyDelay));
          }
        }
        console.log('✅ [Ear Training] Melodia tocada com sucesso');
      }
      
    } catch (error) {
      console.error('❌ Erro ao tocar exercício:', error);
      toast.error('Erro ao reproduzir áudio', {
        description: error instanceof Error ? error.message : 'Verifique se o áudio está habilitado no navegador'
      });
    } finally {
      setIsPlaying(false);
      // Remover contexto quando terminar
      import('@/services/AudioPriorityManager').then(({ audioPriorityManager }) => {
        audioPriorityManager.setContext(null);
      });
    }
  };

  const checkAnswer = () => {
    if (!selectedAnswer || !currentExercise) return;
    
    const isCorrect = selectedAnswer === currentExercise.correctAnswer;
    setShowResult(true);
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    if (isCorrect) {
      toast.success('Correto! 🎉', {
        description: `Você identificou: ${currentExercise.correctAnswer}`,
      });
    } else {
      toast.error('Incorreto', {
        description: `A resposta correta era: ${currentExercise.correctAnswer}`,
      });
    }
  };

  const replayExercise = () => {
    if (currentExercise) {
      playExercise(currentExercise.notes);
    }
  };

  useEffect(() => {
    startNewExercise();
  }, [exerciseType]);

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-[#06b6d4]" />
            <p className="text-xs text-gray-400">Acertos</p>
          </div>
          <p className="text-2xl font-bold text-white">{score.correct}/{score.total}</p>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-[#a855f7]" />
            <p className="text-xs text-gray-400">Precisão</p>
          </div>
          <p className="text-2xl font-bold text-white">{accuracy}%</p>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Volume2 className="w-4 h-4 text-[#10b981]" />
            <p className="text-xs text-gray-400">Tipo</p>
          </div>
          <p className="text-sm font-bold text-white capitalize">{
            exerciseType === 'intervals' ? 'Intervalos' :
            exerciseType === 'chords' ? 'Acordes' : 'Melodias'
          }</p>
        </Card>
      </div>

      {/* Exercise Type Selector */}
      <div className="flex gap-2">
        <Button
          onClick={() => setExerciseType('intervals')}
          variant={exerciseType === 'intervals' ? 'default' : 'outline'}
          className="flex-1"
        >
          Intervalos
        </Button>
        <Button
          onClick={() => setExerciseType('chords')}
          variant={exerciseType === 'chords' ? 'default' : 'outline'}
          className="flex-1"
        >
          Acordes
        </Button>
        <Button
          onClick={() => setExerciseType('melodies')}
          variant={exerciseType === 'melodies' ? 'default' : 'outline'}
          className="flex-1"
        >
          Melodias
        </Button>
      </div>

      {/* Exercise */}
      {currentExercise && (
        <Card className="p-6 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-2">{currentExercise.question}</h3>
            <p className="text-sm text-gray-400">Ouça com atenção e escolha a resposta correta</p>
          </div>

          {/* Play Button */}
          <div className="flex justify-center mb-6">
            <Button
              onClick={replayExercise}
              disabled={isPlaying}
              size="lg"
              className="bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:from-[#0891b2] hover:to-[#06b6d4]"
            >
              <Play className="w-5 h-5 mr-2" />
              {isPlaying ? 'Tocando...' : 'Ouvir Novamente'}
            </Button>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {currentExercise.options.map((option) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = showResult && option === currentExercise.correctAnswer;
              const isWrong = showResult && isSelected && option !== currentExercise.correctAnswer;

              return (
                <Button
                  key={option}
                  onClick={() => !showResult && setSelectedAnswer(option)}
                  disabled={showResult}
                  variant={isSelected ? 'default' : 'outline'}
                  className={`h-auto py-4 ${
                    isCorrect ? 'bg-green-600 hover:bg-green-600 border-green-500' :
                    isWrong ? 'bg-red-600 hover:bg-red-600 border-red-500' :
                    ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isCorrect && <CheckCircle2 className="w-5 h-5" />}
                    {isWrong && <XCircle className="w-5 h-5" />}
                    <span className="font-semibold">{option}</span>
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!showResult ? (
              <Button
                onClick={checkAnswer}
                disabled={!selectedAnswer}
                className="flex-1 bg-gradient-to-r from-[#a855f7] to-[#9333ea] hover:from-[#9333ea] hover:to-[#a855f7]"
              >
                Verificar Resposta
              </Button>
            ) : (
              <Button
                onClick={startNewExercise}
                className="flex-1 bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#10b981]"
              >
                Próximo Exercício
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Tips */}
      <Card className="p-5 bg-[#1a1a2e]/60 backdrop-blur-xl border-white/10">
        <h4 className="text-lg font-bold text-white mb-3">💡 Dicas para Treino de Ouvido</h4>
        <ul className="space-y-2 text-sm text-gray-300">
          <li>• <strong>Pratique diariamente:</strong> 10-15 minutos por dia são suficientes</li>
          <li>• <strong>Comece com intervalos:</strong> São a base para reconhecer acordes e melodias</li>
          <li>• <strong>Cante junto:</strong> Cantar os intervalos ajuda a internalizá-los</li>
          <li>• <strong>Use referências:</strong> Associe intervalos a músicas conhecidas</li>
          <li>• <strong>Seja paciente:</strong> O treino de ouvido leva tempo para desenvolver</li>
        </ul>
      </Card>
    </div>
  );
}
