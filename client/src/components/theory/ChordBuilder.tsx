/**
 * Construtor Interativo de Acordes
 * Permite usuário construir acordes arrastando notas e recebe feedback
 */

import { useState } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle2, XCircle, RotateCcw, Music, Info, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAudio } from '@/hooks/useAudio';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { unifiedAudioService } from '@/services/UnifiedAudioService';

const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const CHORD_INTERVALS: Record<string, number[]> = {
  'Maior': [0, 4, 7],           // Fundamental, 3ª maior, 5ª justa
  'Menor': [0, 3, 7],           // Fundamental, 3ª menor, 5ª justa
  '7': [0, 4, 7, 10],           // Dominante
  'maj7': [0, 4, 7, 11],        // Maior com 7ª maior
  'm7': [0, 3, 7, 10],          // Menor com 7ª menor
  'sus2': [0, 2, 7],            // Suspenso com 2ª
  'sus4': [0, 5, 7],            // Suspenso com 4ª
  'dim': [0, 3, 6],             // Diminuto
  'aug': [0, 4, 8],             // Aumentado
};

interface SelectedNote {
  note: string;
  octave: number;
}

export function ChordBuilder() {
  const [selectedNotes, setSelectedNotes] = useState<SelectedNote[]>([]);
  const [targetChordType, setTargetChordType] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const { addXP } = useGamificationStore();

  // Gerar acorde alvo aleatório
  const generateTarget = () => {
    const chordTypes = Object.keys(CHORD_INTERVALS);
    const randomType = chordTypes[Math.floor(Math.random() * chordTypes.length)];
    setTargetChordType(randomType);
    setSelectedNotes([]);
    setFeedback(null);
  };

  const handleNoteClick = (note: string) => {
    // Limitar a 4 notas
    if (selectedNotes.length >= 4) {
      setFeedback({
        correct: false,
        message: 'Máximo de 4 notas por acorde. Clique em "Resetar" para começar de novo.',
      });
      return;
    }

    // Verificar se nota já está selecionada
    if (selectedNotes.some(n => n.note === note)) {
      // Remover nota se já estiver selecionada
      setSelectedNotes(selectedNotes.filter(n => n.note !== note));
    } else {
      // Adicionar nota
      setSelectedNotes([...selectedNotes, { note, octave: 4 }]);
    }
    setFeedback(null);
  };

  const analyzeChord = (notes: SelectedNote[]): { type: string | null; root: string | null } => {
    if (notes.length < 3) return { type: null, root: null };

    // Ordenar notas
    const sortedNotes = [...notes].sort((a, b) => {
      const indexA = CHROMATIC_NOTES.indexOf(a.note);
      const indexB = CHROMATIC_NOTES.indexOf(b.note);
      return indexA - indexB;
    });

    const root = sortedNotes[0].note;
    const rootIndex = CHROMATIC_NOTES.indexOf(root);

    // Calcular intervalos
    const intervals: number[] = [];
    sortedNotes.forEach(note => {
      const noteIndex = CHROMATIC_NOTES.indexOf(note.note);
      let semitones = noteIndex - rootIndex;
      if (semitones < 0) semitones += 12;
      intervals.push(semitones);
    });

    // Comparar com templates de acordes
    for (const [chordType, templateIntervals] of Object.entries(CHORD_INTERVALS)) {
      if (intervals.length === templateIntervals.length) {
        const matches = intervals.every(interval => templateIntervals.includes(interval));
        if (matches) {
          return { type: chordType, root };
        }
      }
    }

    return { type: null, root };
  };

  const handleCheck = () => {
    if (!targetChordType) {
      setFeedback({
        correct: false,
        message: 'Clique em "Novo Acorde" para começar!',
      });
      return;
    }

    if (selectedNotes.length < 3) {
      setFeedback({
        correct: false,
        message: 'Selecione pelo menos 3 notas para formar um acorde.',
      });
      return;
    }

    const analysis = analyzeChord(selectedNotes);
    
    if (analysis.type === targetChordType) {
      setFeedback({
        correct: true,
        message: `Correto! Você construiu um acorde ${targetChordType} de ${analysis.root}.`,
      });
      setScore(score + 1);
      setAttempts(attempts + 1);
      addXP(10);
    } else {
      setFeedback({
        correct: false,
        message: analysis.type 
          ? `Você construiu um acorde ${analysis.type}, mas o objetivo era ${targetChordType}.`
          : 'As notas selecionadas não formam um acorde conhecido. Tente novamente!',
      });
      setAttempts(attempts + 1);
    }
  };

  const { playNotes } = useAudio();
  const playbackAbortRef = React.useRef<AbortController | null>(null);

  // Parar áudio quando componente desmontar ou notas mudarem
  React.useEffect(() => {
    return () => {
      if (playbackAbortRef.current) {
        playbackAbortRef.current.abort();
      }
      try {
        unifiedAudioService.stopAll();
      } catch (error) {
        // Ignorar erros no cleanup
      }
    };
  }, [selectedNotes]);

  const handlePlayChord = async () => {
    if (selectedNotes.length === 0) return;
    
    // Se já está tocando, parar
    if (isPlaying) {
      if (playbackAbortRef.current) {
        playbackAbortRef.current.abort();
      }
      await unifiedAudioService.stopAll();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    playbackAbortRef.current = new AbortController();
    
    try {
      await unifiedAudioService.ensureInitialized();
      for (const note of selectedNotes) {
        if (playbackAbortRef.current?.signal.aborted) break;
        await playNotes([`${note.note}${note.octave}`], { duration: 0.3 });
        if (playbackAbortRef.current?.signal.aborted) break;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Erro ao tocar acorde:', error);
    } finally {
      if (!playbackAbortRef.current?.signal.aborted) {
        setIsPlaying(false);
      }
      playbackAbortRef.current = null;
    }
  };

  const handleReset = () => {
    setSelectedNotes([]);
    setFeedback(null);
  };

  // Calcular intervalos esperados do acorde alvo
  const expectedIntervals = targetChordType ? CHORD_INTERVALS[targetChordType] : [];

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
          <Music className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Construtor de Acordes</h3>
          <p className="text-sm text-gray-400">Construa acordes selecionando notas</p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="text-sm text-gray-400">Pontuação</div>
          <div className="text-2xl font-bold text-green-400">{score}</div>
        </div>
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="text-sm text-gray-400">Tentativas</div>
          <div className="text-2xl font-bold text-cyan-400">{attempts}</div>
        </div>
      </div>

      {/* Acorde Alvo */}
      {targetChordType ? (
        <div className="mb-6 p-4 rounded-lg bg-blue-500/20 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Objetivo:</p>
              <p className="text-xl font-bold text-white">Construir acorde {targetChordType}</p>
              <p className="text-xs text-gray-400 mt-1">
                Intervalos: {expectedIntervals.join(', ')} semitons
              </p>
            </div>
            <Button
              onClick={generateTarget}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Novo Acorde
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-gray-400 mb-3">Clique em "Novo Acorde" para começar!</p>
          <Button
            onClick={generateTarget}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          >
            Novo Acorde
          </Button>
        </div>
      )}

      {/* Notas Selecionadas */}
      {selectedNotes.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-2">Notas selecionadas:</p>
          <div className="flex flex-wrap gap-2">
            {selectedNotes.map((note, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-white font-bold"
              >
                {note.note}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg mb-6 ${
              feedback.correct 
                ? 'bg-green-500/20 border border-green-500/30' 
                : 'bg-red-500/20 border border-red-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.correct ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              <p className="text-white font-medium">{feedback.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teclado Virtual */}
      <div className="mb-6">
        <p className="text-sm text-gray-400 mb-3">Clique nas notas para construir o acorde:</p>
        <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
          {CHROMATIC_NOTES.map((note) => {
            const isSelected = selectedNotes.some(n => n.note === note);
            
            return (
              <button
                key={note}
                onClick={() => handleNoteClick(note)}
                disabled={isPlaying}
                className={`p-4 rounded-lg font-bold text-white transition-all disabled:opacity-50 ${
                  isSelected
                    ? 'bg-green-500 hover:bg-green-600 scale-105'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {note}
              </button>
            );
          })}
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-3">
        <Button
          onClick={handleCheck}
          disabled={!targetChordType || selectedNotes.length < 3 || isPlaying}
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Verificar
        </Button>
        
        <Button
          onClick={handlePlayChord}
          disabled={selectedNotes.length === 0}
          variant="outline"
          className={`border-white/20 text-white hover:bg-white/10 ${
            isPlaying ? 'bg-red-500/20 border-red-500/50' : ''
          }`}
        >
          {isPlaying ? (
            <>
              <VolumeX className="w-4 h-4 mr-2" />
              Parar
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Ouvir
            </>
          )}
        </Button>
        
        <Button
          onClick={handleReset}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Dica */}
      <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <p className="text-xs text-gray-400">
          <strong className="text-blue-400">💡 Dica:</strong> Acorde Maior = Fundamental + 3ª Maior (4 semitons) + 5ª Justa (7 semitons). 
          Acorde Menor = Fundamental + 3ª Menor (3 semitons) + 5ª Justa (7 semitons).
        </p>
      </div>
    </Card>
  );
}
