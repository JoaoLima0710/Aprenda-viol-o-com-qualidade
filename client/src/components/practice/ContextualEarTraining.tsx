/**
 * Treino de Ouvido Contextual
 * Exercícios usando músicas reais
 * Exemplo: Intro de "Tempo Perdido" → identificar progressão
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Volume2, 
  CheckCircle2, 
  XCircle, 
  Music, 
  Trophy,
  RotateCcw,
  Info
} from 'lucide-react';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { toast } from 'sonner';
import { songs, Song, getSongById } from '@/data/songs';
import { useGamificationStore } from '@/stores/useGamificationStore';
import {
  STIMULUS_DURATIONS,
  STIMULUS_SPACING,
  CHORD_FORMATION_DELAYS,
} from '@/services/AuditoryStimulusConfig';

interface ContextualExercise {
  songId: string;
  song: Song;
  section: 'intro' | 'verse' | 'chorus';
  progression: string[]; // Sequência de acordes
  correctAnswer: string; // Progressão como string (ex: "C-G-Am-F")
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Gerar exercício contextual baseado em músicas reais
const generateContextualExercise = (difficulty: 'beginner' | 'intermediate' | 'advanced'): ContextualExercise | null => {
  // Filtrar músicas por dificuldade
  const availableSongs = songs.filter(song => song.difficulty === difficulty);
  
  if (availableSongs.length === 0) {
    return null;
  }
  
  // Selecionar música aleatória
  const song = availableSongs[Math.floor(Math.random() * availableSongs.length)];
  
  // Usar progressão da música (primeiros 4-6 acordes)
  const progression = song.chords.slice(0, Math.min(6, song.chords.length));
  const correctAnswer = progression.join('-');
  
  // Selecionar seção aleatória
  const sections: Array<'intro' | 'verse' | 'chorus'> = ['intro', 'verse', 'chorus'];
  const section = sections[Math.floor(Math.random() * sections.length)];
  
  return {
    songId: song.id,
    song,
    section,
    progression,
    correctAnswer,
    difficulty: song.difficulty,
  };
};

// Gerar opções de resposta (progressões similares)
const generateOptions = (correctProgression: string[], allSongs: Song[]): string[] => {
  const options = [correctProgression.join('-')];
  
  // Gerar progressões similares de outras músicas
  const otherSongs = allSongs
    .filter(s => s.chords.length >= correctProgression.length)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  
  otherSongs.forEach(song => {
    const similarProgression = song.chords.slice(0, correctProgression.length).join('-');
    if (similarProgression !== options[0] && !options.includes(similarProgression)) {
      options.push(similarProgression);
    }
  });
  
  // Se não tiver 4 opções, adicionar progressões genéricas
  while (options.length < 4) {
    const generic = ['C-G-Am-F', 'Am-F-C-G', 'C-F-G-C', 'G-C-D-G'][options.length - 1];
    if (!options.includes(generic)) {
      options.push(generic);
    }
  }
  
  return options.sort(() => Math.random() - 0.5);
};

export function ContextualEarTraining() {
  const [currentExercise, setCurrentExercise] = useState<ContextualExercise | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [options, setOptions] = useState<string[]>([]);
  const { addXP } = useGamificationStore();

  const startNewExercise = () => {
    const exercise = generateContextualExercise(difficulty);
    if (!exercise) {
      toast.error('Não há músicas disponíveis para este nível');
      return;
    }
    
    const exerciseOptions = generateOptions(exercise.progression, songs);
    setCurrentExercise(exercise);
    setOptions(exerciseOptions);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const playProgression = async () => {
    if (!currentExercise || isPlaying) return;
    
    setIsPlaying(true);
    
    try {
      // Tocar progressão de acordes
      // Para cada acorde, tocar as notas do acorde
      for (let i = 0; i < currentExercise.progression.length; i++) {
        const chordName = currentExercise.progression[i];
        
        // Mapear acorde para notas (simplificado)
        const chordNotes = getChordNotes(chordName);
        
        // Usar durações e espaçamentos padronizados para máxima clareza
        const chordDuration = STIMULUS_DURATIONS.chord;
        
        const playPromises = chordNotes.map((note, index) => {
          return new Promise<void>((resolve) => {
            setTimeout(async () => {
              try {
                // Duração padronizada para todos os acordes na progressão
                await unifiedAudioService.playNote(note, chordDuration);
                resolve();
              } catch (error) {
                console.error(`Erro ao tocar nota ${note}:`, error);
                resolve();
              }
            }, index * CHORD_FORMATION_DELAYS.betweenChordNotes); // Delay padronizado
          });
        });
        
        await Promise.all(playPromises);
        
        // Espaçamento padronizado entre acordes para máxima clareza
        if (i < currentExercise.progression.length - 1) {
          await new Promise(resolve => setTimeout(resolve, STIMULUS_SPACING.betweenProgressionChords));
        }
      }
    } catch (error) {
      console.error('Erro ao tocar progressão:', error);
      toast.error('Erro ao reproduzir áudio');
    } finally {
      setIsPlaying(false);
    }
  };

  // Mapear nome do acorde para notas (simplificado)
  const getChordNotes = (chordName: string): string[] => {
    // Remover modificadores (sus, add, etc) para simplificar
    const baseChord = chordName.replace(/sus|add|dim|aug|\d+/g, '').trim();
    const isMinor = baseChord.includes('m') || baseChord.includes('min');
    const root = baseChord.replace(/m|min|M|maj/gi, '').trim();
    
    // Mapear root para nota base
    const rootNote = root.length > 1 && root[1] === '#' 
      ? `${root[0].toUpperCase()}#` 
      : root[0].toUpperCase();
    
    const rootIndex = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(rootNote);
    
    if (rootIndex === -1) {
      // Fallback para C
      return isMinor ? ['C4', 'Eb4', 'G4'] : ['C4', 'E4', 'G4'];
    }
    
    // Terça maior ou menor
    const third = isMinor ? 3 : 4;
    const fifth = 7;
    
    const thirdNote = (rootIndex + third) % 12;
    const fifthNote = (rootIndex + fifth) % 12;
    
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    return [
      `${notes[rootIndex]}4`,
      `${notes[thirdNote]}4`,
      `${notes[fifthNote]}4`,
    ];
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
      addXP(30);
      toast.success('Correto! 🎉', {
        description: `Você identificou a progressão de "${currentExercise.song.title}"`,
      });
    } else {
      toast.error('Incorreto', {
        description: `A progressão correta era: ${currentExercise.correctAnswer}`,
      });
    }
  };

  useEffect(() => {
    startNewExercise();
  }, [difficulty]);

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">🎵 Treino de Ouvido Contextual</h3>
            <p className="text-sm text-gray-300">
              Identifique progressões de acordes em músicas reais
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <p className="text-xs text-gray-400">Acertos</p>
            </div>
            <p className="text-2xl font-bold text-white">{score.correct}/{score.total}</p>
          </div>
          
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <p className="text-xs text-gray-400">Precisão</p>
            </div>
            <p className="text-2xl font-bold text-white">{accuracy}%</p>
          </div>
          
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Music className="w-4 h-4 text-purple-400" />
              <p className="text-xs text-gray-400">Dificuldade</p>
            </div>
            <p className="text-sm font-bold text-white capitalize">{difficulty}</p>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="flex gap-2">
          {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
            <Button
              key={level}
              onClick={() => setDifficulty(level)}
              variant={difficulty === level ? 'default' : 'outline'}
              size="sm"
              className={
                difficulty === level
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                  : 'border-white/20 text-white hover:bg-white/10'
              }
            >
              {level === 'beginner' ? 'Iniciante' :
               level === 'intermediate' ? 'Intermediário' : 'Avançado'}
            </Button>
          ))}
        </div>

        {/* Current Exercise */}
        {currentExercise && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-white mb-1">{currentExercise.song.title}</h4>
                  <p className="text-sm text-gray-400">{currentExercise.song.artist}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    currentExercise.difficulty === 'beginner' ? 'border-green-500/30 text-green-400' :
                    currentExercise.difficulty === 'intermediate' ? 'border-yellow-500/30 text-yellow-400' :
                    'border-red-500/30 text-red-400'
                  }
                >
                  {currentExercise.section === 'intro' ? 'Intro' :
                   currentExercise.section === 'verse' ? 'Verso' : 'Refrão'}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-300 mb-4">
                Ouça a progressão de acordes e identifique a sequência correta:
              </p>

              {/* Play Button */}
              <div className="flex justify-center mb-4">
                <Button
                  onClick={playProgression}
                  disabled={isPlaying}
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {isPlaying ? 'Tocando...' : 'Ouvir Progressão'}
                </Button>
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {options.map((option) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = showResult && option === currentExercise.correctAnswer;
                const isWrong = showResult && isSelected && option !== currentExercise.correctAnswer;

                return (
                  <motion.button
                    key={option}
                    onClick={() => !showResult && setSelectedAnswer(option)}
                    disabled={showResult}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      isCorrect
                        ? 'bg-green-500/20 border-green-500/50 text-green-400'
                        : isWrong
                        ? 'bg-red-500/20 border-red-500/50 text-red-400'
                        : isSelected
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                        : 'bg-white/5 border-white/10 text-white hover:border-white/20 hover:bg-white/10'
                    }`}
                    whileHover={!showResult ? { scale: 1.02 } : {}}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{option}</span>
                      {showResult && (
                        isCorrect ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isWrong ? (
                          <XCircle className="w-5 h-5" />
                        ) : null
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!showResult ? (
                <Button
                  onClick={checkAnswer}
                  disabled={!selectedAnswer}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  Verificar Resposta
                </Button>
              ) : (
                <Button
                  onClick={startNewExercise}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  Próximo Exercício
                </Button>
              )}
              <Button
                onClick={playProgression}
                disabled={isPlaying}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Song Info */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30"
              >
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">
                      <strong className="text-blue-400">Música:</strong> {currentExercise.song.title} - {currentExercise.song.artist}
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      <strong className="text-blue-400">Progressão:</strong> {currentExercise.correctAnswer}
                    </p>
                    {currentExercise.song.description && (
                      <p className="text-xs text-gray-400 mt-2">{currentExercise.song.description}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <h4 className="text-sm font-bold text-white mb-2">💡 Dicas</h4>
          <ul className="space-y-1 text-xs text-gray-300">
            <li>• Preste atenção na sensação de cada acorde (maior/menor)</li>
            <li>• Tente identificar o primeiro acorde (tônica)</li>
            <li>• Associe progressões a músicas que você conhece</li>
            <li>• Pratique regularmente para desenvolver seu ouvido</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
