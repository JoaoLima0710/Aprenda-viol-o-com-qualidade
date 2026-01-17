import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Check, X, TrendingUp, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { pitchDetectionService } from '@/services/PitchDetectionService';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { toast } from 'sonner';

interface Scale {
  id: string;
  name: string;
  notes: string[];
  intervals: string[];
  fretPositions: { string: number; fret: number; note: string }[];
}

interface ScalePracticeProps {
  scale: Scale;
  onComplete?: () => void;
}

type PracticeMode = 'ascending' | 'descending' | 'thirds' | 'fourths' | 'sequence';

const PRACTICE_MODES = [
  { id: 'ascending' as PracticeMode, name: 'Ascendente', description: 'Toque as notas de baixo para cima', icon: '⬆️' },
  { id: 'descending' as PracticeMode, name: 'Descendente', description: 'Toque as notas de cima para baixo', icon: '⬇️' },
  { id: 'thirds' as PracticeMode, name: 'Terças', description: 'Toque pulando uma nota (1-3-2-4-3-5...)', icon: '🎯' },
  { id: 'fourths' as PracticeMode, name: 'Quartas', description: 'Toque pulando duas notas (1-4-2-5-3-6...)', icon: '🎪' },
  { id: 'sequence' as PracticeMode, name: 'Sequência', description: 'Toque em padrões (1-2-3-2-3-4-3-4-5...)', icon: '🔄' },
];

const SPEEDS = [
  { bpm: 60, label: 'Lento', color: 'text-green-400' },
  { bpm: 90, label: 'Médio', color: 'text-yellow-400' },
  { bpm: 120, label: 'Rápido', color: 'text-orange-400' },
  { bpm: 150, label: 'Muito Rápido', color: 'text-red-400' },
];

export function ScalePractice({ scale, onComplete }: ScalePracticeProps) {
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('ascending');
  const [speed, setSpeed] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPracticing, setIsPracticing] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [practiceNotes, setPracticeNotes] = useState<string[]>([]);
  const [correctNotes, setCorrectNotes] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [detectedNote, setDetectedNote] = useState<string | null>(null);
  

  
  const { addXP } = useGamificationStore();

  // Gerar sequência de notas baseada no modo de prática
  useEffect(() => {
    const notes = scale.notes;
    let sequence: string[] = [];

    switch (practiceMode) {
      case 'ascending':
        sequence = [...notes];
        break;
      case 'descending':
        sequence = [...notes].reverse();
        break;
      case 'thirds':
        // 1-3-2-4-3-5-4-6-5-7-6-8-7
        for (let i = 0; i < notes.length - 2; i++) {
          sequence.push(notes[i], notes[i + 2]);
        }
        sequence.push(notes[notes.length - 2], notes[notes.length - 1]);
        break;
      case 'fourths':
        // 1-4-2-5-3-6-4-7-5-8
        for (let i = 0; i < notes.length - 3; i++) {
          sequence.push(notes[i], notes[i + 3]);
        }
        break;
      case 'sequence':
        // 1-2-3-2-3-4-3-4-5-4-5-6-5-6-7-6-7-8
        for (let i = 0; i < notes.length - 2; i++) {
          sequence.push(notes[i], notes[i + 1], notes[i + 2]);
        }
        break;
    }

    setPracticeNotes(sequence);
    setCurrentNoteIndex(0);
  }, [practiceMode, scale]);

  // Tocar a escala como demonstração
  const playScale = async () => {
    setIsPlaying(true);
    const interval = (60 / speed) * 1000; // Converter BPM para ms

    for (let i = 0; i < practiceNotes.length; i++) {
      setCurrentNoteIndex(i);
      // Tocar nota individual (usar playChord para notas simples)
      await unifiedAudioService.playChord(practiceNotes[i], 0.3);
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    setIsPlaying(false);
    setCurrentNoteIndex(0);
  };

  // Iniciar prática com detecção de pitch
  const startPractice = async () => {
    try {
      const initialized = await pitchDetectionService.initialize();
      if (!initialized) {
        toast.error('Erro ao inicializar detecção de pitch.');
        return;
      }
      
      setIsPracticing(true);
      setCurrentNoteIndex(0);
      setCorrectNotes(0);
      setTotalAttempts(0);
      
      // Iniciar detecção com callback
      pitchDetectionService.start((result) => {
        if (result) {
          setDetectedNote(result.note);
          checkNote(result.note);
        }
      });
      
      toast.success('Prática iniciada! Toque as notas da escala.');
    } catch (error) {
      toast.error('Erro ao acessar microfone. Verifique as permissões.');
    }
  };

  // Verificar se a nota tocada está correta
  const checkNote = (note: string) => {
    const expectedNote = practiceNotes[currentNoteIndex].replace(/\d+/, ''); // Remove octave
    const detectedNoteClean = note.replace(/\d+/, '');

    if (detectedNoteClean === expectedNote) {
      setCorrectNotes(prev => prev + 1);
      setTotalAttempts(prev => prev + 1);
      
      // Avançar para próxima nota
      if (currentNoteIndex < practiceNotes.length - 1) {
        setCurrentNoteIndex(prev => prev + 1);
        toast.success(`✅ Correto! ${expectedNote}`, { 
          duration: 800,
          style: {
            background: '#10b981',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
          }
        });
      } else {
        // Completou a escala
        completePractice();
      }
    } else {
      // Nota errada - dar feedback mas não contar como tentativa
      toast.error(`❌ Esperado: ${expectedNote}, Tocado: ${detectedNoteClean}`, {
        duration: 1000,
        style: {
          background: '#ef4444',
          color: 'white',
          fontSize: '16px',
        }
      });
    }
  };

  // Completar prática
  const completePractice = () => {
    stopPractice();
    
    const accuracy = (correctNotes / totalAttempts) * 100;
    const xpGained = Math.round(accuracy * 2); // Até 200 XP
    
    addXP(xpGained);
    toast.success(`Parabéns! Você ganhou ${xpGained} XP!`);
    
    if (onComplete) {
      onComplete();
    }
  };

  // Parar prática
  const stopPractice = () => {
    setIsPracticing(false);
    pitchDetectionService.stop();
    setDetectedNote(null);
  };

  // Resetar prática
  const reset = () => {
    stopPractice();
    setCurrentNoteIndex(0);
    setCorrectNotes(0);
    setTotalAttempts(0);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopPractice();
    };
  }, []);

  const accuracy = totalAttempts > 0 ? Math.round((correctNotes / totalAttempts) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Modo Interativo - Destaque Visual */}
      {isPracticing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-cyan-500/20 border-2 border-purple-400 rounded-3xl shadow-2xl"
        >
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">🎸 Toque Esta Nota:</h3>
            
            {/* Nota Atual - GRANDE */}
            <motion.div
              key={currentNoteIndex}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-block"
            >
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-[0_0_60px_rgba(6,182,212,0.6)] mb-6">
                <span className="text-7xl font-black text-white">
                  {practiceNotes[currentNoteIndex]}
                </span>
              </div>
            </motion.div>

            {/* Progresso */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="px-6 py-3 bg-white/10 rounded-xl">
                <p className="text-sm text-gray-400">Nota</p>
                <p className="text-2xl font-bold text-white">{currentNoteIndex + 1} / {practiceNotes.length}</p>
              </div>
              <div className="px-6 py-3 bg-green-500/20 rounded-xl border border-green-400/30">
                <p className="text-sm text-gray-400">Acertos</p>
                <p className="text-2xl font-bold text-green-400">{correctNotes}</p>
              </div>
            </div>

            {/* Nota Detectada */}
            <div className="flex items-center justify-center gap-3">
              <Volume2 className="w-6 h-6 text-purple-400 animate-pulse" />
              <span className="text-lg text-gray-300">Detectando:</span>
              <span className="text-2xl font-bold text-purple-400">
                {detectedNote || '---'}
              </span>
            </div>
          </div>
        </motion.div>
      )}
      {/* Modo de Prática */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3">Modo de Prática</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {PRACTICE_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setPracticeMode(mode.id)}
              className={`
                p-4 rounded-xl border-2 transition-all text-left
                ${practiceMode === mode.id
                  ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400'
                  : 'bg-white/5 border-white/10 hover:border-purple-400/50'
                }
              `}
            >
              <div className="text-2xl mb-2">{mode.icon}</div>
              <p className="font-bold text-white text-sm">{mode.name}</p>
              <p className="text-xs text-gray-400 mt-1">{mode.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Velocidade */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3">Velocidade (BPM)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SPEEDS.map((s) => (
            <button
              key={s.bpm}
              onClick={() => setSpeed(s.bpm)}
              className={`
                p-4 rounded-xl border-2 transition-all
                ${speed === s.bpm
                  ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-400'
                  : 'bg-white/5 border-white/10 hover:border-cyan-400/50'
                }
              `}
            >
              <p className={`text-2xl font-bold ${s.color}`}>{s.bpm}</p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Sequência de Notas */}
      <div className="p-6 bg-[#1a1a2e]/60 backdrop-blur-xl rounded-2xl border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4">Sequência</h3>
        <div className="flex flex-wrap gap-2">
          {practiceNotes.map((note, index) => (
            <motion.div
              key={`${note}-${index}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: currentNoteIndex === index ? 1.2 : 1,
                opacity: 1,
              }}
              className={`
                px-4 py-2 rounded-lg font-bold transition-all
                ${currentNoteIndex === index
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                  : index < currentNoteIndex && isPracticing
                  ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                  : 'bg-white/5 text-gray-400'
                }
              `}
            >
              {note}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Estatísticas */}
      {isPracticing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-4"
        >
          <div className="p-4 bg-green-500/10 rounded-xl border border-green-400/30">
            <div className="flex items-center gap-2 mb-1">
              <Check className="w-4 h-4 text-green-400" />
              <p className="text-xs text-gray-400">Corretas</p>
            </div>
            <p className="text-2xl font-bold text-green-400">{correctNotes}</p>
          </div>
          
          <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-400/30">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <p className="text-xs text-gray-400">Acurácia</p>
            </div>
            <p className="text-2xl font-bold text-blue-400">{accuracy}%</p>
          </div>
          
          <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-400/30">
            <div className="flex items-center gap-2 mb-1">
              <Volume2 className="w-4 h-4 text-purple-400" />
              <p className="text-xs text-gray-400">Detectada</p>
            </div>
            <p className="text-2xl font-bold text-purple-400">{detectedNote || '--'}</p>
          </div>
        </motion.div>
      )}

      {/* Controles */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={playScale}
          disabled={isPlaying || isPracticing}
          className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Tocando...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Ouvir Demonstração
            </>
          )}
        </Button>

        {!isPracticing ? (
          <Button
            onClick={startPractice}
            disabled={isPlaying}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg py-6 font-bold"
          >
            <Play className="w-5 h-5 mr-2" />
            🎤 Modo Interativo (Microfone)
          </Button>
        ) : (
          <Button
            onClick={stopPractice}
            variant="destructive"
            className="flex-1"
          >
            <Pause className="w-4 h-4 mr-2" />
            Parar Prática
          </Button>
        )}

        <Button
          onClick={reset}
          variant="outline"
          className="bg-white/5 border-white/10 hover:bg-white/10"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Resetar
        </Button>
      </div>
    </div>
  );
}
