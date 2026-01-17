import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { toast } from 'sonner';

interface VocalExercisesProps {
  vocalRange: {
    lowestNote: string;
    highestNote: string;
    lowestFreq: number;
    highestFreq: number;
  };
  analyser: AnalyserNode | null;
}

interface Exercise {
  id: string;
  name: string;
  description: string;
  type: 'ascending' | 'descending' | 'interval';
  difficulty: 'easy' | 'medium' | 'hard';
}

// Converter frequência para nota
function frequencyToNote(frequency: number): { note: string; octave: number } {
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75);
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const h = Math.round(12 * Math.log2(frequency / C0));
  const octave = Math.floor(h / 12);
  const n = h % 12;
  
  return {
    note: noteNames[n],
    octave: octave,
  };
}

const exercises: Exercise[] = [
  {
    id: 'asc-scale',
    name: 'Escala Ascendente',
    description: 'Suba gradualmente do grave ao agudo',
    type: 'ascending',
    difficulty: 'easy',
  },
  {
    id: 'desc-scale',
    name: 'Escala Descendente',
    description: 'Desça gradualmente do agudo ao grave',
    type: 'descending',
    difficulty: 'easy',
  },
  {
    id: 'interval-thirds',
    name: 'Intervalos de Terça',
    description: 'Saltos de 3 semitons',
    type: 'interval',
    difficulty: 'medium',
  },
  {
    id: 'interval-fifths',
    name: 'Intervalos de Quinta',
    description: 'Saltos de 7 semitons',
    type: 'interval',
    difficulty: 'hard',
  },
];

export function VocalExercises({ vocalRange, analyser }: VocalExercisesProps) {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const animationRef = useRef<number | undefined>(undefined);

  const generateNotes = (exercise: Exercise) => {
    const notes: number[] = [];
    const { lowestFreq, highestFreq } = vocalRange;
    
    const steps = 8; // 8 passos na escala
    const freqRange = highestFreq - lowestFreq;
    
    if (exercise.type === 'ascending') {
      for (let i = 0; i <= steps; i++) {
        notes.push(lowestFreq + (freqRange * i) / steps);
      }
    } else if (exercise.type === 'descending') {
      for (let i = steps; i >= 0; i--) {
        notes.push(lowestFreq + (freqRange * i) / steps);
      }
    } else if (exercise.type === 'interval') {
      const interval = exercise.id.includes('thirds') ? 3 : 7;
      const semitonesPerStep = interval;
      
      for (let i = 0; i <= steps; i++) {
        const semitones = i * semitonesPerStep;
        const freq = lowestFreq * Math.pow(2, semitones / 12);
        if (freq <= highestFreq) {
          notes.push(freq);
        }
      }
    }
    
    return notes;
  };

  const startExercise = async (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setCurrentStep(0);
    setScore(0);
    
    const notes = generateNotes(exercise);
    setTotalSteps(notes.length);
    
    setIsPlaying(true);
    
    // Tocar sequência de notas
    for (let i = 0; i < notes.length; i++) {
      if (!isPlaying) break;
      
      setCurrentStep(i);
      // Converter frequência para nota
      const noteInfo = frequencyToNote(notes[i]);
      await unifiedAudioService.playNote(`${noteInfo.note}${noteInfo.octave}`, 1.5);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2s entre notas
    }
    
    setIsPlaying(false);
    toast.success(`Exercício concluído! Pontuação: ${score}/${notes.length}`);
  };

  const stopExercise = () => {
    setIsPlaying(false);
    // Stop audio
  };

  const resetExercise = () => {
    setSelectedExercise(null);
    setCurrentStep(0);
    setScore(0);
    setTotalSteps(0);
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Stop audio
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-400" />
          Exercícios de Extensão Vocal
        </h3>
        <p className="text-gray-400">
          Pratique para expandir sua extensão vocal
        </p>
      </div>

      {!selectedExercise ? (
        <div className="grid md:grid-cols-2 gap-4">
          {exercises.map((exercise) => (
            <motion.div
              key={exercise.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl cursor-pointer hover:border-purple-400/50 transition-all"
              onClick={() => startExercise(exercise)}
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-lg font-bold text-white">{exercise.name}</h4>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    exercise.difficulty === 'easy'
                      ? 'bg-green-500/20 text-green-400'
                      : exercise.difficulty === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {exercise.difficulty === 'easy'
                    ? 'Fácil'
                    : exercise.difficulty === 'medium'
                    ? 'Médio'
                    : 'Difícil'}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-4">{exercise.description}</p>
              <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Play className="w-4 h-4 mr-2" />
                Iniciar Exercício
              </Button>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl">
            <h4 className="text-xl font-bold text-white mb-2">{selectedExercise.name}</h4>
            <p className="text-gray-300 mb-4">{selectedExercise.description}</p>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progresso</span>
                <span>{currentStep + 1} / {totalSteps}</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Score */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <Award className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-bold text-white">
                {score} / {totalSteps}
              </span>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              {isPlaying ? (
                <Button
                  onClick={stopExercise}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </Button>
              ) : (
                <Button
                  onClick={() => startExercise(selectedExercise)}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Continuar
                </Button>
              )}
              <Button
                onClick={resetExercise}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reiniciar
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
