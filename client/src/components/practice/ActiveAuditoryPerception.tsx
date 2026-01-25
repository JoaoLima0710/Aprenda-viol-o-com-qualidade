/**
 * Percepção Auditiva Ativa
 * Exercícios progressivos de percepção auditiva usando AudioBus
 * Foco em um som por vez, resposta antes do feedback, feedback educativo
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, ArrowUp, ArrowDown, CheckCircle2, XCircle, Volume2, Music, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAudioBus, initializeAudioSystem, getAudioMixer } from '@/audio';
import { A4_FREQUENCY, A4_MIDI_NUMBER, NOTE_NAMES } from '@/audio/types';
import {
  STIMULUS_DURATIONS,
  STIMULUS_SPACING,
  STIMULUS_OSCILLATOR_TYPE,
  STIMULUS_VOLUME,
  CHORD_FORMATION_DELAYS,
} from '@/services/AuditoryStimulusConfig';

// Converter nota para frequência (Hz) usando a mesma lógica do projeto
function getNoteFrequency(note: string): number {
  // Extrair nota e oitava (ex: "C4" -> "C" e 4, "C#4" -> "C#" e 4)
  const match = note.match(/^([A-G][#b]?)(\d+)$/);
  if (!match) return A4_FREQUENCY; // Fallback para A4
  
  const [, noteName, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);
  const noteIndex = NOTE_NAMES.indexOf(noteName as any);
  
  if (noteIndex === -1) return A4_FREQUENCY;
  
  // Calcular número MIDI e frequência
  const midiNumber = (octave + 1) * 12 + noteIndex;
  return A4_FREQUENCY * Math.pow(2, (midiNumber - A4_MIDI_NUMBER) / 12);
}

// Tipos de exercício
type ExerciseType = 'pitch-comparison' | 'interval-identification' | 'chord-recognition';

// Configurações de áudio consistentes (usando configurações centralizadas)
const AUDIO_CONFIG = {
  duration: STIMULUS_DURATIONS.interval, // Duração padronizada para intervalos
  volume: STIMULUS_VOLUME, // Volume padronizado
  channel: 'scales', // Usar canal existente 'scales' (AudioBus cria automaticamente se necessário)
  delayBetweenNotes: STIMULUS_SPACING.betweenNotes, // Delay padronizado entre notas
  oscillatorType: STIMULUS_OSCILLATOR_TYPE, // Tipo de oscilador para máxima clareza
};

// Intervalos simples para identificação
const SIMPLE_INTERVALS = [
  { name: '2ª Maior', semitones: 2, notes: ['C4', 'D4'], description: 'Dois semitons acima' },
  { name: '3ª Menor', semitones: 3, notes: ['C4', 'Eb4'], description: 'Três semitons acima' },
  { name: '3ª Maior', semitones: 4, notes: ['C4', 'E4'], description: 'Quatro semitons acima' },
  { name: '5ª Justa', semitones: 7, notes: ['C4', 'G4'], description: 'Sete semitons acima' },
];

// Acordes básicos
const BASIC_CHORDS = {
  major: ['C', 'D', 'E', 'F', 'G', 'A'],
  minor: ['Am', 'Dm', 'Em', 'Fm', 'Gm'],
};

interface Exercise {
  type: ExerciseType;
  question: string;
  correctAnswer: string;
  options: string[];
  audioData: {
    notes: string[];
    playSequence: () => Promise<void>;
  };
  explanation: string;
}

export function ActiveAuditoryPerception() {
  const [exerciseType, setExerciseType] = useState<ExerciseType>('pitch-comparison');
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializar AudioBus
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await initializeAudioSystem();
        
        // Garantir que o canal 'scales' existe (já criado no AudioMixer.initialize())
        const audioMixer = getAudioMixer();
        
        if (audioMixer && mounted) {
          // Verificar se canal existe, criar se não existir
          if (!audioMixer.getChannel(AUDIO_CONFIG.channel)) {
            audioMixer.createChannel(AUDIO_CONFIG.channel, 0.8);
          }
          setIsInitialized(true);
        } else if (mounted) {
          setIsInitialized(true);
        }
      } catch (e) {
        console.error('AudioBus init failed', e);
        if (mounted) {
          setIsInitialized(true); // Tentar mesmo assim
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Tocar nota usando AudioBus com envelope claro para máxima clareza
  const playNote = async (note: string, delay: number = 0): Promise<void> => {
    const audioBus = getAudioBus();
    if (!audioBus) {
      console.error('AudioBus not available');
      return;
    }

    const frequency = getNoteFrequency(note);
    
    // Se houver delay, aguardar primeiro
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Tocar nota com envelope claro para percepção auditiva
    const success = audioBus.playOscillator({
      frequency,
      type: AUDIO_CONFIG.oscillatorType, // Sine para máxima clareza
      duration: AUDIO_CONFIG.duration,
      channel: AUDIO_CONFIG.channel,
      volume: AUDIO_CONFIG.volume,
      useClearEnvelope: true, // Usar envelope claro para ataque definido
    });

    if (!success) {
      console.error('Failed to play note:', note);
    }
  };

  // Gerar exercício de comparação de altura
  const generatePitchComparisonExercise = (): Exercise => {
    const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
    const note1 = notes[Math.floor(Math.random() * notes.length)];
    let note2 = notes[Math.floor(Math.random() * notes.length)];
    
    // Garantir que sejam diferentes
    while (note2 === note1) {
      note2 = notes[Math.floor(Math.random() * notes.length)];
    }

    const freq1 = getNoteFrequency(note1);
    const freq2 = getNoteFrequency(note2);
    const isHigher = freq2 > freq1;

    const playSequence = async () => {
      setIsPlaying(true);
      try {
        await playNote(note1, 0);
        // Espaçamento padronizado para máxima clareza
        await playNote(note2, STIMULUS_SPACING.betweenNotes);
      } finally {
        setIsPlaying(false);
      }
    };

    return {
      type: 'pitch-comparison',
      question: 'A segunda nota é mais aguda ou mais grave que a primeira?',
      correctAnswer: isHigher ? 'Mais aguda' : 'Mais grave',
      options: ['Mais aguda', 'Mais grave'],
      audioData: {
        notes: [note1, note2],
        playSequence,
      },
      explanation: isHigher
        ? `A segunda nota (${note2}) é mais aguda que a primeira (${note1}). Notas mais agudas têm frequência maior.`
        : `A segunda nota (${note2}) é mais grave que a primeira (${note1}). Notas mais graves têm frequência menor.`,
    };
  };

  // Gerar exercício de identificação de intervalo
  const generateIntervalExercise = (): Exercise => {
    const interval = SIMPLE_INTERVALS[Math.floor(Math.random() * SIMPLE_INTERVALS.length)];
    const otherIntervals = SIMPLE_INTERVALS.filter(i => i.name !== interval.name)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    
    const options = [interval.name, ...otherIntervals.map(i => i.name)]
      .sort(() => Math.random() - 0.5);

    const playSequence = async () => {
      setIsPlaying(true);
      try {
        await playNote(interval.notes[0], 0);
        // Espaçamento padronizado para intervalos
        await playNote(interval.notes[1], STIMULUS_SPACING.betweenIntervals);
      } finally {
        setIsPlaying(false);
      }
    };

    return {
      type: 'interval-identification',
      question: 'Qual intervalo você ouviu?',
      correctAnswer: interval.name,
      options,
      audioData: {
        notes: interval.notes,
        playSequence,
      },
      explanation: `Você ouviu um ${interval.name} (${interval.description}). Este intervalo tem ${interval.semitones} semitons de distância.`,
    };
  };

  // Gerar exercício de reconhecimento de acorde
  const generateChordExercise = (): Exercise => {
    const isMajor = Math.random() > 0.5;
    const chordList = isMajor ? BASIC_CHORDS.major : BASIC_CHORDS.minor;
    const chordName = chordList[Math.floor(Math.random() * chordList.length)];
    
    // Gerar notas do acorde (tríade) usando semitons
    const rootNote = chordName.replace('m', '').replace('#', '').replace('b', '');
    const rootNoteIndex = NOTE_NAMES.indexOf(rootNote as any);
    
    if (rootNoteIndex === -1) {
      // Fallback para C
      return generateChordExercise();
    }
    
    let notes: string[];
    if (isMajor) {
      // Maior: fundamental, 3ª maior (4 semitons), 5ª justa (7 semitons)
      const thirdIndex = (rootNoteIndex + 4) % 12;
      const fifthIndex = (rootNoteIndex + 7) % 12;
      notes = [
        `${rootNote}4`,
        `${NOTE_NAMES[thirdIndex]}4`,
        `${NOTE_NAMES[fifthIndex]}4`,
      ];
    } else {
      // Menor: fundamental, 3ª menor (3 semitons), 5ª justa (7 semitons)
      const thirdIndex = (rootNoteIndex + 3) % 12;
      const fifthIndex = (rootNoteIndex + 7) % 12;
      notes = [
        `${rootNote}4`,
        `${NOTE_NAMES[thirdIndex]}4`,
        `${NOTE_NAMES[fifthIndex]}4`,
      ];
    }

    const playSequence = async () => {
      setIsPlaying(true);
      try {
        // Tocar acorde (notas quase simultaneamente com delay padronizado)
        const delays = [0, CHORD_FORMATION_DELAYS.betweenChordNotes, CHORD_FORMATION_DELAYS.betweenChordNotes * 2];
        for (let i = 0; i < notes.length; i++) {
          await playNote(notes[i], delays[i]);
        }
      } finally {
        setIsPlaying(false);
      }
    };

    return {
      type: 'chord-recognition',
      question: 'Este acorde é maior ou menor?',
      correctAnswer: isMajor ? 'Maior' : 'Menor',
      options: ['Maior', 'Menor'],
      audioData: {
        notes,
        playSequence,
      },
      explanation: isMajor
        ? `Este é um acorde maior (${chordName}). Acordes maiores soam mais alegres e brilhantes.`
        : `Este é um acorde menor (${chordName}). Acordes menores soam mais tristes e melancólicos.`,
    };
  };

  // Gerar exercício baseado no tipo
  const generateExercise = (): Exercise => {
    switch (exerciseType) {
      case 'pitch-comparison':
        return generatePitchComparisonExercise();
      case 'interval-identification':
        return generateIntervalExercise();
      case 'chord-recognition':
        return generateChordExercise();
    }
  };

  // Iniciar novo exercício
  const startNewExercise = () => {
    const exercise = generateExercise();
    setCurrentExercise(exercise);
    setSelectedAnswer(null);
    setShowResult(false);
    // Tocar automaticamente
    exercise.audioData.playSequence();
  };

  // Verificar resposta
  const checkAnswer = () => {
    if (!currentExercise || !selectedAnswer) return;

    const isCorrect = selectedAnswer === currentExercise.correctAnswer;
    setShowResult(true);
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  // Mudar tipo de exercício
  const handleExerciseTypeChange = (type: ExerciseType) => {
    setExerciseType(type);
    setScore({ correct: 0, total: 0 });
    setShowResult(false);
    setSelectedAnswer(null);
  };

  // Efeito para gerar exercício quando tipo muda
  useEffect(() => {
    if (isInitialized) {
      startNewExercise();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseType, isInitialized]);

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  const isCorrect = showResult && currentExercise && selectedAnswer === currentExercise.correctAnswer;

  if (!isInitialized) {
    return (
      <Card className="p-6 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10">
        <div className="text-center">
          <p className="text-gray-400">Inicializando sistema de áudio...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Music className="w-6 h-6 text-purple-400" />
            Percepção Auditiva Ativa
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Desenvolva sua percepção auditiva com exercícios progressivos
          </p>
        </div>
        
        {score.total > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{score.correct}/{score.total}</div>
            <div className="text-sm text-gray-400">{accuracy}% de precisão</div>
          </div>
        )}
      </div>

      {/* Seletor de Tipo */}
      <div className="flex gap-2">
        <Button
          onClick={() => handleExerciseTypeChange('pitch-comparison')}
          variant={exerciseType === 'pitch-comparison' ? 'default' : 'outline'}
          className={
            exerciseType === 'pitch-comparison'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
              : 'border-white/20 text-white hover:bg-white/10'
          }
          size="sm"
        >
          Comparação de Altura
        </Button>
        <Button
          onClick={() => handleExerciseTypeChange('interval-identification')}
          variant={exerciseType === 'interval-identification' ? 'default' : 'outline'}
          className={
            exerciseType === 'interval-identification'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              : 'border-white/20 text-white hover:bg-white/10'
          }
          size="sm"
        >
          Identificação de Intervalo
        </Button>
        <Button
          onClick={() => handleExerciseTypeChange('chord-recognition')}
          variant={exerciseType === 'chord-recognition' ? 'default' : 'outline'}
          className={
            exerciseType === 'chord-recognition'
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
              : 'border-white/20 text-white hover:bg-white/10'
          }
          size="sm"
        >
          Reconhecimento de Acorde
        </Button>
      </div>

      {/* Exercício Atual */}
      {currentExercise && (
        <Card className="p-6 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10">
          {/* Instruções */}
          <div className="text-center mb-6">
            <h4 className="text-lg font-bold text-white mb-2">{currentExercise.question}</h4>
            <p className="text-gray-300 text-sm">
              Ouça com atenção e escolha sua resposta antes de verificar
            </p>
          </div>

          {/* Botão de Tocar */}
          <div className="flex justify-center mb-6">
            <Button
              onClick={() => currentExercise.audioData.playSequence()}
              disabled={isPlaying}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Play className="w-5 h-5 mr-2" />
              {isPlaying ? 'Tocando...' : 'Ouvir Novamente'}
            </Button>
          </div>

          {/* Opções */}
          {!showResult && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {currentExercise.options.map((option) => (
                <Button
                  key={option}
                  onClick={() => setSelectedAnswer(option)}
                  variant={selectedAnswer === option ? 'default' : 'outline'}
                  className={`h-auto py-4 ${
                    selectedAnswer === option
                      ? 'bg-purple-500/20 border-2 border-purple-500/50'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span className="font-semibold text-white">{option}</span>
                </Button>
              ))}
            </div>
          )}

          {/* Botão Verificar */}
          {!showResult && selectedAnswer && (
            <div className="flex justify-center mb-4">
              <Button
                onClick={checkAnswer}
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
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
                className="space-y-4"
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
                  
                  {/* Explicação Educativa */}
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 mt-3">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-blue-300 mb-1">Explicação:</p>
                        <p className="text-sm text-blue-200">{currentExercise.explanation}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botão Próximo */}
                <Button
                  onClick={startNewExercise}
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
        <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-purple-400" />
          Como Treinar
        </h4>
        <ul className="space-y-2 text-sm text-gray-300">
          <li>• <strong>Ouça com atenção:</strong> Foque no som, não nas opções visuais</li>
          <li>• <strong>Responda antes de verificar:</strong> Isso desenvolve confiança auditiva</li>
          <li>• <strong>Leia as explicações:</strong> Elas ensinam os conceitos por trás dos sons</li>
          <li>• <strong>Pratique regularmente:</strong> 10-15 minutos por dia são suficientes</li>
          <li>• <strong>Comece simples:</strong> Use "Comparação de Altura" para começar</li>
        </ul>
      </Card>
    </div>
  );
}
