import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, TrendingUp, Award, Mic, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface PitchDetectionResult {
  note: string;
  octave: number;
  freq: number;
  isCorrect: boolean;
}

// Converter frequência para nota
function frequencyToNote(frequency: number): { note: string; octave: number; freq: number } {
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75);
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const h = Math.round(12 * Math.log2(frequency / C0));
  const octave = Math.floor(h / 12);
  const n = h % 12;
  
  return {
    note: noteNames[n],
    octave: octave,
    freq: frequency,
  };
}

// Comparar duas notas
function notesMatch(note1: string, octave1: number, note2: string, octave2: number, tolerance: number = 1): boolean {
  // Permitir tolerância de 1 semitom
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const index1 = noteNames.indexOf(note1) + octave1 * 12;
  const index2 = noteNames.indexOf(note2) + octave2 * 12;
  return Math.abs(index1 - index2) <= tolerance;
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
  const [expectedNotes, setExpectedNotes] = useState<Array<{ note: string; octave: number; freq: number }>>([]);
  const [detectedPitch, setDetectedPitch] = useState<PitchDetectionResult | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const animationRef = useRef<number | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isListeningRef = useRef(false);

  const generateNotes = (exercise: Exercise) => {
    const notes: Array<{ note: string; octave: number; freq: number }> = [];
    const { lowestFreq, highestFreq } = vocalRange;
    
    const steps = 8; // 8 passos na escala
    const freqRange = highestFreq - lowestFreq;
    
    if (exercise.type === 'ascending') {
      for (let i = 0; i <= steps; i++) {
        const freq = lowestFreq + (freqRange * i) / steps;
        notes.push(frequencyToNote(freq));
      }
    } else if (exercise.type === 'descending') {
      for (let i = steps; i >= 0; i--) {
        const freq = lowestFreq + (freqRange * i) / steps;
        notes.push(frequencyToNote(freq));
      }
    } else if (exercise.type === 'interval') {
      const interval = exercise.id.includes('thirds') ? 3 : 7;
      const semitonesPerStep = interval;
      
      for (let i = 0; i <= steps; i++) {
        const semitones = i * semitonesPerStep;
        const freq = lowestFreq * Math.pow(2, semitones / 12);
        if (freq <= highestFreq) {
          notes.push(frequencyToNote(freq));
        }
      }
    }
    
    return notes;
  };

  // Detectar pitch em tempo real
  const detectPitch = () => {
    if (!analyserRef.current || !isListeningRef.current) return;

    const bufferLength = analyserRef.current.fftSize;
    const buffer = new Float32Array(bufferLength);
    analyserRef.current.getFloatTimeDomainData(buffer);

    const freq = autoCorrelate(buffer, audioContextRef.current!.sampleRate);
    
    if (freq > 0 && expectedNotes.length > 0 && currentStep < expectedNotes.length) {
      const detected = frequencyToNote(freq);
      const expected = expectedNotes[currentStep];
      const isCorrect = notesMatch(detected.note, detected.octave, expected.note, expected.octave);
      
      setDetectedPitch({
        ...detected,
        isCorrect,
      });

      // Auto-avançar se correto
      if (isCorrect) {
        setScore(prev => prev + 1);
        setTimeout(() => {
          setCurrentStep(prev => prev + 1);
          setDetectedPitch(null);
        }, 500);
      }
    }

    animationRef.current = requestAnimationFrame(detectPitch);
  };

  // Algoritmo de autocorrelação para detecção de pitch
  const autoCorrelate = (buffer: Float32Array, sampleRate: number): number => {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let best_offset = -1;
    let best_correlation = 0;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    
    if (rms < 0.01) return -1; // Silêncio

    let lastCorrelation = 1;
    for (let offset = 1; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;
      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }
      correlation = 1 - correlation / MAX_SAMPLES;
      
      if (correlation > 0.9 && correlation > lastCorrelation) {
        const foundGoodCorrelation = correlation > best_correlation;
        if (foundGoodCorrelation) {
          best_correlation = correlation;
          best_offset = offset;
        }
      }
      lastCorrelation = correlation;
    }
    
    if (best_correlation > 0.01) {
      return sampleRate / best_offset;
    }
    return -1;
  };

  const startExercise = async (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setCurrentStep(0);
    setScore(0);
    setDetectedPitch(null);
    
    const notes = generateNotes(exercise);
    setExpectedNotes(notes);
    setTotalSteps(notes.length);
    
    // Iniciar microfone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);
      
      setIsListening(true);
      isListeningRef.current = true;
      detectPitch();
      
      setIsPlaying(true);
      
      // Tocar nota de referência
      await unifiedAudioService.playNote(`${notes[0].note}${notes[0].octave}`, 1.5);
    } catch (error) {
      toast.error('Erro ao acessar microfone');
      console.error(error);
    }
  };

  const stopExercise = () => {
    setIsPlaying(false);
    setIsListening(false);
    isListeningRef.current = false;
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const resetExercise = () => {
    stopExercise();
    setSelectedExercise(null);
    setCurrentStep(0);
    setScore(0);
    setTotalSteps(0);
    setExpectedNotes([]);
    setDetectedPitch(null);
  };

  const playReferenceNote = async () => {
    if (expectedNotes.length > 0 && currentStep < expectedNotes.length) {
      const note = expectedNotes[currentStep];
      await unifiedAudioService.playNote(`${note.note}${note.octave}`, 1.5);
    }
  };

  useEffect(() => {
    return () => {
      stopExercise();
    };
  }, []);

  // Auto-completar exercício
  useEffect(() => {
    if (currentStep >= totalSteps && totalSteps > 0) {
      setIsPlaying(false);
      setIsListening(false);
      isListeningRef.current = false;
      toast.success(`🎉 Exercício concluído! Pontuação: ${score}/${totalSteps} (${Math.round((score/totalSteps)*100)}%)`);
    }
  }, [currentStep, totalSteps, score]);

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
            
            {/* Expected vs Detected */}
            {currentStep < totalSteps && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-xs text-gray-400 mb-2">Nota Esperada</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {expectedNotes[currentStep]?.note}{expectedNotes[currentStep]?.octave}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {expectedNotes[currentStep]?.freq.toFixed(2)} Hz
                  </p>
                </div>
                
                <div className={`p-4 rounded-xl border transition-all ${
                  detectedPitch?.isCorrect 
                    ? 'bg-green-500/20 border-green-500/50' 
                    : detectedPitch 
                    ? 'bg-red-500/20 border-red-500/50'
                    : 'bg-white/5 border-white/10'
                }`}>
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                    <Mic className="w-3 h-3" />
                    Sua Voz
                  </p>
                  {detectedPitch ? (
                    <>
                      <div className="flex items-center gap-2">
                        <p className="text-3xl font-bold text-white">
                          {detectedPitch.note}{detectedPitch.octave}
                        </p>
                        {detectedPitch.isCorrect ? (
                          <Check className="w-6 h-6 text-green-400" />
                        ) : (
                          <X className="w-6 h-6 text-red-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {detectedPitch.freq.toFixed(2)} Hz
                      </p>
                    </>
                  ) : (
                    <p className="text-2xl text-gray-500">Aguardando...</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progresso</span>
                <span>{currentStep} / {totalSteps}</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
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
              <span className="text-lg text-gray-400">
                ({totalSteps > 0 ? Math.round((score/totalSteps)*100) : 0}%)
              </span>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <Button
                onClick={playReferenceNote}
                variant="outline"
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                disabled={currentStep >= totalSteps}
              >
                <Play className="w-4 h-4 mr-2" />
                Ouvir Nota
              </Button>
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
