/**
 * Treino de Intervalos Auditivos Essenciais
 * Foco em comparação auditiva simples para violão
 * Sem nomenclatura técnica - apenas comparação relativa
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, ArrowUp, ArrowDown, CheckCircle2, XCircle, Volume2, RotateCcw, TrendingUp, Award, RefreshCw, TrendingDown, BarChart3, Guitar } from 'lucide-react';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  STIMULUS_DURATIONS,
  STIMULUS_SPACING,
} from '@/services/AuditoryStimulusConfig';

// Intervalos essenciais para iniciantes (sem nomenclatura técnica)
const ESSENTIAL_INTERVALS = [
  { 
    id: 'unison',
    semitones: 0,
    notes: ['C4', 'C4'],
    description: 'Mesma nota (uníssono)',
    difficulty: 1
  },
  { 
    id: 'second-small',
    semitones: 1,
    notes: ['C4', 'Db4'],
    description: 'Nota muito próxima (segunda menor)',
    difficulty: 2
  },
  { 
    id: 'second-big',
    semitones: 2,
    notes: ['C4', 'D4'],
    description: 'Nota próxima (segunda maior)',
    difficulty: 2
  },
  { 
    id: 'third-small',
    semitones: 3,
    notes: ['C4', 'Eb4'],
    description: 'Nota um pouco mais distante (terça menor)',
    difficulty: 3
  },
  { 
    id: 'third-big',
    semitones: 4,
    notes: ['C4', 'E4'],
    description: 'Nota mais distante (terça maior)',
    difficulty: 3
  },
];

// Níveis de progressão
type ProgressionLevel = 'iniciante' | 'iniciante-avancado' | 'intermediario';

const LEVEL_CONFIG: Record<ProgressionLevel, { maxDifficulty: number; name: string; color: string }> = {
  'iniciante': { maxDifficulty: 1, name: 'Iniciante', color: 'green' },
  'iniciante-avancado': { maxDifficulty: 2, name: 'Iniciante Avançado', color: 'blue' },
  'intermediario': { maxDifficulty: 3, name: 'Intermediário', color: 'purple' },
};

const CONSISTENCY_REQUIREMENT = 0.7; // 70% de acerto
const CONSISTENCY_WINDOW = 5; // Últimos 5 exercícios

// Mapeamento de notas para posições simples no violão (corda e traste)
// Retorna posições fáceis (trastes baixos, cordas abertas quando possível)
const GUITAR_STRINGS = ['E', 'B', 'G', 'D', 'A', 'E']; // Da corda 1 (aguda) para corda 6 (grave)
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Encontrar posição simples de uma nota no violão
function findSimpleGuitarPosition(noteName: string): { string: number; fret: number; note: string } | null {
  // Remover oitava (ex: "C4" -> "C")
  const note = noteName.replace(/\d+/, '').toUpperCase();
  const noteIndex = NOTES.indexOf(note);
  
  if (noteIndex === -1) return null;
  
  // Tentar encontrar em trastes baixos (0-5) para facilitar
  for (let stringIndex = 0; stringIndex < GUITAR_STRINGS.length; stringIndex++) {
    const stringNote = GUITAR_STRINGS[stringIndex];
    const stringNoteIndex = NOTES.indexOf(stringNote);
    
    let fret = (noteIndex - stringNoteIndex + 12) % 12;
    
    // Preferir trastes baixos (0-5)
    if (fret <= 5) {
      return {
        string: stringIndex + 1, // Corda 1-6 (não índice 0-5)
        fret,
        note,
      };
    }
  }
  
  // Se não encontrou em trastes baixos, retornar primeira posição encontrada
  for (let stringIndex = 0; stringIndex < GUITAR_STRINGS.length; stringIndex++) {
    const stringNote = GUITAR_STRINGS[stringIndex];
    const stringNoteIndex = NOTES.indexOf(stringNote);
    const fret = (noteIndex - stringNoteIndex + 12) % 12;
    
    if (fret <= 12) {
      return {
        string: stringIndex + 1,
        fret,
        note,
      };
    }
  }
  
  return null;
}

interface Exercise {
  interval: typeof ESSENTIAL_INTERVALS[0];
  firstNote: string;
  secondNote: string;
  correctAnswer: 'same' | 'higher' | 'lower';
}

export function EssentialIntervalTraining() {
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userAnswer, setUserAnswer] = useState<'same' | 'higher' | 'lower' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [progressionLevel, setProgressionLevel] = useState<ProgressionLevel>('iniciante');
  const [recentResults, setRecentResults] = useState<boolean[]>([]); // Últimos resultados para consistência
  const [justLeveledUp, setJustLeveledUp] = useState(false);
  const [showGuitarPractice, setShowGuitarPractice] = useState(false); // Mostrar etapa de prática no violão
  
  // Rastreamento de tipos de erro para métricas
  const [errorTypes, setErrorTypes] = useState<{
    confusedHigherLower: number; // Confundiu agudo com grave ou vice-versa
    confusedWithSame: number; // Confundiu com igual
    other: number;
  }>({
    confusedHigherLower: 0,
    confusedWithSame: 0,
    other: 0,
  });
  
  // Histórico de sessão (últimos 10 exercícios para mostrar evolução)
  const [sessionHistory, setSessionHistory] = useState<boolean[]>([]);

  // Obter dificuldade máxima do nível atual
  const currentMaxDifficulty = LEVEL_CONFIG[progressionLevel].maxDifficulty;

  // Gerar exercício baseado no nível de progressão
  const generateExercise = (): Exercise => {
    // Filtrar intervalos pela dificuldade máxima do nível atual
    const availableIntervals = ESSENTIAL_INTERVALS.filter(i => i.difficulty <= currentMaxDifficulty);
    const interval = availableIntervals[Math.floor(Math.random() * availableIntervals.length)];
    
    // Escolher nota base aleatória (C, D, E, F, G, A, B)
    const baseNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const baseNote = baseNotes[Math.floor(Math.random() * baseNotes.length)];
    const octave = 4;
    
    // Calcular segunda nota baseada no intervalo
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const baseIndex = noteNames.indexOf(baseNote);
    const secondIndex = (baseIndex + interval.semitones) % 12;
    const secondNoteName = noteNames[secondIndex];
    
    // Ajustar oitava se necessário
    let secondOctave = octave;
    const totalSemitones = baseIndex + interval.semitones;
    if (totalSemitones >= 12) {
      secondOctave = octave + 1;
    } else if (totalSemitones < 0) {
      secondOctave = octave - 1;
    }
    
    // Determinar se segunda nota é mais aguda, mais grave ou igual
    let correctAnswer: 'same' | 'higher' | 'lower';
    if (interval.semitones === 0) {
      correctAnswer = 'same';
    } else if (secondOctave > octave || (secondOctave === octave && interval.semitones > 0)) {
      // Se subiu de oitava ou está na mesma oitava mas com semitons positivos, é mais aguda
      correctAnswer = 'higher';
    } else {
      // Se desceu de oitava ou está na mesma oitava mas com semitons negativos, é mais grave
      correctAnswer = 'lower';
    }
    
    return {
      interval,
      firstNote: `${baseNote}${octave}`,
      secondNote: `${secondNoteName}${secondOctave}`,
      correctAnswer,
    };
  };

  // Tocar exercício
  const playExercise = async (exercise?: Exercise) => {
    const exerciseToPlay = exercise || currentExercise;
    if (!exerciseToPlay || isPlaying) return;
    
    setIsPlaying(true);
    
    try {
      await unifiedAudioService.ensureInitialized();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Usar durações e espaçamentos padronizados para máxima clareza
      const noteDuration = STIMULUS_DURATIONS.interval;
      const delayBetweenNotes = STIMULUS_SPACING.betweenIntervals;
      
      console.log('🎵 [Intervalos Essenciais] Tocando:', exerciseToPlay.firstNote, '→', exerciseToPlay.secondNote);
      
      // Tocar primeira nota
      await unifiedAudioService.playNote(exerciseToPlay.firstNote, noteDuration);
      await new Promise(resolve => setTimeout(resolve, delayBetweenNotes));
      
      // Tocar segunda nota
      await unifiedAudioService.playNote(exerciseToPlay.secondNote, noteDuration);
      
      console.log('✅ [Intervalos Essenciais] Exercício tocado');
    } catch (error) {
      console.error('❌ Erro ao tocar exercício:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  // Verificar resposta
  const checkAnswer = (answer: 'same' | 'higher' | 'lower') => {
    if (!currentExercise || showResult) return;
    
    setUserAnswer(answer);
    
    const isCorrect = answer === currentExercise.correctAnswer;
    
    // Delay antes de mostrar feedback (não instantâneo)
    setTimeout(() => {
      setShowResult(true);
      
      // Atualizar score
      setScore(prev => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));
      
      // Adicionar resultado recente (manter apenas últimos 5)
      setRecentResults(prev => {
        const updated = [...prev, isCorrect];
        return updated.slice(-CONSISTENCY_WINDOW);
      });
      
      // Adicionar ao histórico de sessão (últimos 10)
      setSessionHistory(prev => {
        const updated = [...prev, isCorrect];
        return updated.slice(-10);
      });
      
      // Rastrear tipo de erro (apenas quando errado)
      if (!isCorrect && currentExercise && userAnswer) {
        const correct = currentExercise.correctAnswer;
        const user = userAnswer;
        
        // Confundiu agudo com grave ou vice-versa
        if ((correct === 'higher' && user === 'lower') || (correct === 'lower' && user === 'higher')) {
          setErrorTypes(prev => ({ ...prev, confusedHigherLower: prev.confusedHigherLower + 1 }));
        }
        // Confundiu com igual
        else if (correct !== 'same' && user === 'same') {
          setErrorTypes(prev => ({ ...prev, confusedWithSame: prev.confusedWithSame + 1 }));
        }
        // Outros erros
        else {
          setErrorTypes(prev => ({ ...prev, other: prev.other + 1 }));
        }
      }
      
      // Verificar se pode avançar de nível
      checkProgression();
      
      // Mostrar etapa de prática no violão após um pequeno delay
      setTimeout(() => {
        setShowGuitarPractice(true);
      }, 1000);
    }, 300); // Pequeno delay para processar a resposta
  };

  // Obter mensagem explicativa específica
  const getExplanationMessage = (): string => {
    if (!currentExercise || !userAnswer) return '';
    
    const isCorrect = userAnswer === currentExercise.correctAnswer;
    if (isCorrect) return '';
    
    // Mensagens específicas baseadas no erro
    if (currentExercise.correctAnswer === 'same' && userAnswer !== 'same') {
      return 'As duas notas eram iguais (mesma altura). Quando as notas são idênticas, não há diferença de altura.';
    }
    
    if (currentExercise.correctAnswer === 'higher' && userAnswer === 'lower') {
      return 'A segunda nota era mais aguda (mais alta). Preste atenção na direção: se a nota sobe, ela fica mais aguda.';
    }
    
    if (currentExercise.correctAnswer === 'lower' && userAnswer === 'higher') {
      return 'A segunda nota era mais grave (mais baixa). Preste atenção na direção: se a nota desce, ela fica mais grave.';
    }
    
    if (currentExercise.correctAnswer === 'higher' && userAnswer === 'same') {
      return 'A segunda nota era mais aguda que a primeira. Mesmo que a diferença seja pequena, há uma mudança de altura.';
    }
    
    if (currentExercise.correctAnswer === 'lower' && userAnswer === 'same') {
      return 'A segunda nota era mais grave que a primeira. Mesmo que a diferença seja pequena, há uma mudança de altura.';
    }
    
    return 'Compare a altura das notas: mais aguda (alta), mais grave (baixa) ou igual.';
  };

  // Tocar resposta correta para comparação
  const playCorrectAnswer = async () => {
    if (!currentExercise) return;
    
    setIsPlaying(true);
    try {
      await unifiedAudioService.ensureInitialized();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Usar durações e espaçamentos padronizados para máxima clareza
      const noteDuration = STIMULUS_DURATIONS.interval;
      const delayBetweenNotes = STIMULUS_SPACING.betweenIntervals;
      
      // Tocar novamente o exercício (resposta correta)
      await unifiedAudioService.playNote(currentExercise.firstNote, noteDuration);
      await new Promise(resolve => setTimeout(resolve, delayBetweenNotes));
      await unifiedAudioService.playNote(currentExercise.secondNote, noteDuration);
    } catch (error) {
      console.error('❌ Erro ao tocar resposta correta:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  // Verificar se pode avançar de nível
  const checkProgression = () => {
    if (recentResults.length < CONSISTENCY_WINDOW - 1) return; // Ainda não tem 5 resultados
    
    const lastFive = [...recentResults, true].slice(-CONSISTENCY_WINDOW); // Incluir resultado atual
    const correctCount = lastFive.filter(r => r).length;
    const consistency = correctCount / CONSISTENCY_WINDOW;
    
    // Se atingiu 70% de consistência e não está no nível máximo
    if (consistency >= CONSISTENCY_REQUIREMENT && progressionLevel !== 'intermediario') {
      const nextLevel: ProgressionLevel = progressionLevel === 'iniciante' 
        ? 'iniciante-avancado' 
        : 'intermediario';
      
      setProgressionLevel(nextLevel);
      setJustLeveledUp(true);
      setRecentResults([]); // Resetar para novo nível
      
      // Mostrar feedback de progresso
      setTimeout(() => setJustLeveledUp(false), 3000);
    }
  };

  // Próximo exercício
  const nextExercise = () => {
    const newExercise = generateExercise();
    setCurrentExercise(newExercise);
    setUserAnswer(null);
    setShowResult(false);
    setShowGuitarPractice(false);
    // Tocar automaticamente
    setTimeout(() => playExercise(), 300);
  };

  // Inicializar primeiro exercício
  useEffect(() => {
    const exercise = generateExercise();
    setCurrentExercise(exercise);
    // Tocar automaticamente após um pequeno delay
    const timer = setTimeout(() => {
      playExercise(exercise);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressionLevel]);

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  const currentLevelConfig = LEVEL_CONFIG[progressionLevel];
  
  // Calcular progresso para próximo nível
  const recentAccuracy = recentResults.length > 0
    ? Math.round((recentResults.filter(r => r).length / recentResults.length) * 100)
    : 0;
  const progressToNextLevel = recentResults.length >= CONSISTENCY_WINDOW - 1
    ? Math.min((recentAccuracy / (CONSISTENCY_REQUIREMENT * 100)) * 100, 100)
    : (recentResults.length / CONSISTENCY_WINDOW) * 100;
  const canAdvance = progressionLevel !== 'intermediario' && recentAccuracy >= CONSISTENCY_REQUIREMENT * 100 && recentResults.length >= CONSISTENCY_WINDOW;
  
  // Calcular métricas de evolução
  const totalErrors = errorTypes.confusedHigherLower + errorTypes.confusedWithSame + errorTypes.other;
  const mostCommonError = totalErrors > 0
    ? errorTypes.confusedHigherLower >= errorTypes.confusedWithSame && errorTypes.confusedHigherLower >= errorTypes.other
      ? 'confusedHigherLower'
      : errorTypes.confusedWithSame >= errorTypes.other
      ? 'confusedWithSame'
      : 'other'
    : null;
  
  // Evolução recente (últimos 5 vs anteriores 5)
  const recent5 = sessionHistory.slice(-5);
  const previous5 = sessionHistory.slice(-10, -5);
  const recent5Accuracy = recent5.length > 0 ? Math.round((recent5.filter(r => r).length / recent5.length) * 100) : 0;
  const previous5Accuracy = previous5.length > 0 ? Math.round((previous5.filter(r => r).length / previous5.length) * 100) : 0;
  const isImproving = recent5.length === 5 && previous5.length === 5 && recent5Accuracy > previous5Accuracy;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Volume2 className="w-6 h-6 text-purple-400" />
            Intervalos Essenciais
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Desenvolva sua percepção de altura - compare duas notas
          </p>
        </div>
        
        {/* Estatísticas */}
        {score.total > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{score.correct}/{score.total}</div>
            <div className="text-sm text-gray-400">{accuracy}% de acertos</div>
          </div>
        )}
      </div>

      {/* Métricas de Evolução */}
      {score.total > 0 && (
        <Card className="p-4 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <h4 className="text-lg font-bold text-white">Sua Evolução</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* % de Acertos */}
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-gray-400 mb-1">Taxa de Acertos</p>
              <p className="text-2xl font-bold text-white">{accuracy}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {score.correct} de {score.total} exercícios
              </p>
            </div>
            
            {/* Evolução Recente */}
            {sessionHistory.length >= 5 && (
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Últimos Exercícios</p>
                <div className="flex items-center gap-2">
                  {isImproving ? (
                    <>
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <p className="text-lg font-bold text-green-400">Melhorando!</p>
                    </>
                  ) : recent5Accuracy === previous5Accuracy ? (
                    <>
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                      <p className="text-lg font-bold text-blue-400">Estável</p>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-5 h-5 text-yellow-400" />
                      <p className="text-lg font-bold text-yellow-400">Continue</p>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {recent5Accuracy}% nos últimos 5
                </p>
              </div>
            )}
          </div>
          
          {/* Tipo de Erro Mais Comum */}
          {totalErrors > 0 && mostCommonError && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-xs text-blue-300 mb-1">
                💡 <strong>Dica para melhorar:</strong>
              </p>
              <p className="text-xs text-blue-200">
                {mostCommonError === 'confusedHigherLower'
                  ? 'Você costuma confundir notas mais agudas com mais graves. Preste atenção na direção: se a nota sobe, fica mais aguda; se desce, mais grave.'
                  : mostCommonError === 'confusedWithSame'
                  ? 'Você às vezes não percebe quando as notas são iguais. Quando não há mudança de altura, as notas são idênticas.'
                  : 'Continue praticando para identificar melhor as diferenças de altura.'}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Indicador de Nível e Progressão */}
      <Card className="p-4 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Badge 
              variant="outline" 
              className={
                progressionLevel === 'iniciante'
                  ? 'border-green-500/50 text-green-400 bg-green-500/10'
                  : progressionLevel === 'iniciante-avancado'
                  ? 'border-blue-500/50 text-blue-400 bg-blue-500/10'
                  : 'border-purple-500/50 text-purple-400 bg-purple-500/10'
              }
            >
              {currentLevelConfig.name}
            </Badge>
            {justLeveledUp && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 text-green-400"
              >
                <Award className="w-5 h-5" />
                <span className="text-sm font-semibold">Nível Avançado! 🎉</span>
              </motion.div>
            )}
          </div>
          {progressionLevel !== 'intermediario' && (
            <div className="text-right">
              <div className="text-xs text-gray-400 mb-1">
                Progresso para próximo nível
              </div>
              <div className="text-sm text-white font-semibold">
                {recentResults.length}/{CONSISTENCY_WINDOW} exercícios
              </div>
            </div>
          )}
        </div>
        
        {progressionLevel !== 'intermediario' && (
          <div className="space-y-2">
            <Progress value={progressToNextLevel} className="h-2" />
            <div className="flex justify-between text-xs text-gray-400">
              <span>
                Consistência recente: {recentAccuracy}% 
                {recentResults.length < CONSISTENCY_WINDOW && ` (${recentResults.length}/${CONSISTENCY_WINDOW})`}
              </span>
              <span>
                Requerido: {CONSISTENCY_REQUIREMENT * 100}% em {CONSISTENCY_WINDOW} exercícios
              </span>
            </div>
            {canAdvance && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2 rounded-lg bg-green-500/20 border border-green-500/50"
              >
                <p className="text-xs text-green-300 text-center">
                  ✨ Você está pronto para avançar! Continue praticando para desbloquear o próximo nível.
                </p>
              </motion.div>
            )}
          </div>
        )}
      </Card>

      {/* Exercício Atual */}
      {currentExercise && (
        <Card className="p-6 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10">
          {/* Instruções */}
          <div className="text-center mb-6">
            <h4 className="text-lg font-bold text-white mb-2">
              Ouça as duas notas e compare:
            </h4>
            <p className="text-gray-300 text-sm">
              A segunda nota é <strong className="text-white">mais aguda</strong>, 
              <strong className="text-white"> mais grave</strong> ou 
              <strong className="text-white"> igual</strong> à primeira?
            </p>
          </div>

          {/* Botão de Tocar */}
          <div className="flex justify-center mb-6">
            <Button
              onClick={playExercise}
              disabled={isPlaying}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Play className="w-5 h-5 mr-2" />
              {isPlaying ? 'Tocando...' : 'Ouvir Novamente'}
            </Button>
          </div>

          {/* Opções de Resposta */}
          {!showResult ? (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Button
                onClick={() => checkAnswer('lower')}
                disabled={isPlaying}
                className="h-auto py-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
              >
                <ArrowDown className="w-6 h-6 mb-2" />
                <div className="text-sm font-semibold">Mais Grave</div>
                <div className="text-xs opacity-80">(Mais baixa)</div>
              </Button>
              
              <Button
                onClick={() => checkAnswer('same')}
                disabled={isPlaying}
                className="h-auto py-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                <CheckCircle2 className="w-6 h-6 mb-2" />
                <div className="text-sm font-semibold">Igual</div>
                <div className="text-xs opacity-80">(Mesma altura)</div>
              </Button>
              
              <Button
                onClick={() => checkAnswer('higher')}
                disabled={isPlaying}
                className="h-auto py-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <ArrowUp className="w-6 h-6 mb-2" />
                <div className="text-sm font-semibold">Mais Aguda</div>
                <div className="text-xs opacity-80">(Mais alta)</div>
              </Button>
            </div>
          ) : (
            /* Resultado */
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Feedback */}
                <div className={`p-4 rounded-lg border-2 ${
                  userAnswer === currentExercise.correctAnswer
                    ? 'bg-green-500/20 border-green-500/50'
                    : 'bg-red-500/20 border-red-500/50'
                }`}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {userAnswer === currentExercise.correctAnswer ? (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                        <span className="text-xl font-bold text-green-400">Correto! 🎉</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-6 h-6 text-red-400" />
                        <span className="text-xl font-bold text-red-400">Vamos entender melhor</span>
                      </>
                    )}
                  </div>
                  
                  <div className="text-center text-gray-300 text-sm space-y-2">
                    <div>
                      <p className="mb-1">
                        <strong className="text-white">Sua resposta:</strong>{' '}
                        <span className={userAnswer === currentExercise.correctAnswer ? 'text-green-400' : 'text-red-400'}>
                          {userAnswer === 'higher' ? 'Mais Aguda' : 
                           userAnswer === 'lower' ? 'Mais Grave' : 'Igual'}
                        </span>
                      </p>
                      <p>
                        <strong className="text-white">Resposta correta:</strong>{' '}
                        <span className="text-green-400">
                          {currentExercise.correctAnswer === 'higher' ? 'Mais Aguda' : 
                           currentExercise.correctAnswer === 'lower' ? 'Mais Grave' : 'Igual'}
                        </span>
                      </p>
                    </div>
                    
                    {/* Mensagem explicativa quando errado */}
                    {userAnswer !== currentExercise.correctAnswer && (
                      <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <p className="text-xs text-blue-300 text-left">
                          💡 {getExplanationMessage()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Replay Comparativo */}
                {userAnswer !== currentExercise.correctAnswer && (
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-sm text-gray-300 text-center mb-3">
                      <strong className="text-white">Ouça novamente a resposta correta:</strong>
                    </p>
                    <div className="flex justify-center">
                      <Button
                        onClick={playCorrectAnswer}
                        disabled={isPlaying}
                        size="sm"
                        variant="outline"
                        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {isPlaying ? 'Tocando...' : 'Ouvir Resposta Correta'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Informação do Intervalo (após resposta) */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm text-gray-300 text-center">
                    <strong className="text-white">Intervalo tocado:</strong>{' '}
                    {currentExercise.interval.description}
                  </p>
                  <p className="text-xs text-gray-400 text-center mt-1">
                    {currentExercise.firstNote} → {currentExercise.secondNote}
                  </p>
                </div>

                {/* Prática no Violão */}
                {showGuitarPractice && currentExercise && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Guitar className="w-5 h-5 text-amber-400" />
                      <h5 className="text-lg font-bold text-white">Agora toque no violão</h5>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-4">
                      Você ouviu duas notas. Agora toque-as no violão para sentir a diferença:
                    </p>
                    
                    <div className="space-y-3 mb-4">
                      {/* Primeira Nota */}
                      {(() => {
                        const firstPos = findSimpleGuitarPosition(currentExercise.firstNote);
                        return firstPos ? (
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <p className="text-sm text-white font-semibold mb-1">
                              1. Primeira nota: <span className="text-amber-400">{currentExercise.firstNote}</span>
                            </p>
                            <p className="text-xs text-gray-300">
                              Toque na <strong className="text-white">corda {firstPos.string}</strong>
                              {firstPos.fret === 0 ? ' (corda solta)' : `, traste ${firstPos.fret}`}
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <p className="text-sm text-white">
                              1. Primeira nota: <span className="text-amber-400">{currentExercise.firstNote}</span>
                            </p>
                          </div>
                        );
                      })()}
                      
                      {/* Segunda Nota */}
                      {(() => {
                        const secondPos = findSimpleGuitarPosition(currentExercise.secondNote);
                        return secondPos ? (
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <p className="text-sm text-white font-semibold mb-1">
                              2. Segunda nota: <span className="text-amber-400">{currentExercise.secondNote}</span>
                            </p>
                            <p className="text-xs text-gray-300">
                              Toque na <strong className="text-white">corda {secondPos.string}</strong>
                              {secondPos.fret === 0 ? ' (corda solta)' : `, traste ${secondPos.fret}`}
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <p className="text-sm text-white">
                              2. Segunda nota: <span className="text-amber-400">{currentExercise.secondNote}</span>
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                    
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <p className="text-xs text-blue-300">
                        💡 <strong>Dica:</strong> Toque as duas notas e compare. Você sente a diferença que ouviu? 
                        Isso ajuda a conectar o que você ouve com o que você toca.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Botão Próximo */}
                <Button
                  onClick={() => {
                    setShowGuitarPractice(false);
                    nextExercise();
                  }}
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
          <li>• <strong>Ouça com atenção:</strong> Preste atenção na diferença de altura entre as duas notas</li>
          <li>• <strong>Compare mentalmente:</strong> A segunda nota sobe ou desce em relação à primeira?</li>
          <li>• <strong>Comece devagar:</strong> Use o nível 1 para começar com intervalos mais simples</li>
          <li>• <strong>Pratique regularmente:</strong> 5-10 minutos por dia são suficientes</li>
          <li>• <strong>Não se preocupe com nomes técnicos:</strong> Foque apenas em ouvir a diferença</li>
        </ul>
      </Card>
    </div>
  );
}
