/**
 * Construtor Interativo de Intervalos
 * Permite usuário construir intervalos clicando em notas e recebe feedback imediato
 */

import { useState } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle2, XCircle, RotateCcw, Music, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAudio } from '@/hooks/useAudio';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { unifiedAudioService } from '@/services/UnifiedAudioService';

const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const INTERVAL_NAMES: Record<number, string> = {
  0: 'Uníssono',
  1: '2ª Menor',
  2: '2ª Maior',
  3: '3ª Menor',
  4: '3ª Maior',
  5: '4ª Justa',
  6: '4ª Aumentada / 5ª Diminuta',
  7: '5ª Justa',
  8: '6ª Menor',
  9: '6ª Maior',
  10: '7ª Menor',
  11: '7ª Maior',
  12: 'Oitava',
};

const INTERVAL_EXAMPLES: Record<number, string> = {
  1: 'Tema de "Tubarão"',
  2: 'Início de "Happy Birthday"',
  4: 'Início de "Oh When the Saints"',
  5: 'Início de "Twinkle Twinkle"',
  7: 'Início de "Parabéns pra Você"',
  12: 'Mesma nota, oitava diferente',
};

export function IntervalBuilder() {
  const [firstNote, setFirstNote] = useState<string | null>(null);
  const [secondNote, setSecondNote] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const { addXP } = useGamificationStore();

  const calculateInterval = (note1: string, note2: string): number => {
    const index1 = CHROMATIC_NOTES.indexOf(note1);
    const index2 = CHROMATIC_NOTES.indexOf(note2);
    
    if (index1 === -1 || index2 === -1) return -1;
    
    let semitones = index2 - index1;
    if (semitones < 0) semitones += 12;
    if (semitones === 0 && note1 !== note2) semitones = 12; // Oitava
    
    return semitones;
  };

  const handleNoteClick = (note: string) => {
    // REMOVIDO: Autoplay ao clicar - áudio agora é apenas manual via botão "Ouvir Intervalo"
    if (!firstNote) {
      setFirstNote(note);
      setSecondNote(null);
      setFeedback(null);
    } else if (!secondNote) {
      setSecondNote(note);
      const interval = calculateInterval(firstNote, note);
      const intervalName = INTERVAL_NAMES[interval] || 'Desconhecido';
      const example = INTERVAL_EXAMPLES[interval];
      setFeedback({
        correct: true,
        message: `Intervalo: ${intervalName} (${interval} semitons)${example ? ` - Exemplo: ${example}` : ''}`,
      });
      setScore(score + 1);
      setAttempts(attempts + 1);
      addXP(5);
    }
  };

  const handleReset = () => {
    setFirstNote(null);
    setSecondNote(null);
    setFeedback(null);
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
  }, [firstNote, secondNote]);

  const handlePlayInterval = async () => {
    if (!firstNote || !secondNote) return;
    
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
      await playNotes([`${firstNote}4`], { duration: 0.5 });
      if (playbackAbortRef.current?.signal.aborted) return;
      await new Promise(resolve => setTimeout(resolve, 600));
      if (playbackAbortRef.current?.signal.aborted) return;
      await playNotes([`${secondNote}4`], { duration: 0.5 });
    } catch (error) {
      console.error('Erro ao tocar intervalo:', error);
    } finally {
      if (!playbackAbortRef.current?.signal.aborted) {
        setIsPlaying(false);
      }
      playbackAbortRef.current = null;
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Music className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Construtor de Intervalos</h3>
          <p className="text-sm text-gray-400">Clique em duas notas para descobrir o intervalo</p>
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

      {/* Notas Selecionadas */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-4">
          <div className={`w-20 h-20 rounded-xl flex items-center justify-center text-2xl font-bold transition-all ${
            firstNote 
              ? 'bg-purple-500 text-white scale-110' 
              : 'bg-white/10 text-gray-500'
          }`}>
            {firstNote || '?'}
          </div>
          
          <div className="text-gray-400">→</div>
          
          <div className={`w-20 h-20 rounded-xl flex items-center justify-center text-2xl font-bold transition-all ${
            secondNote 
              ? 'bg-pink-500 text-white scale-110' 
              : 'bg-white/10 text-gray-500'
          }`}>
            {secondNote || '?'}
          </div>
        </div>
      </div>

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
        <p className="text-sm text-gray-400 mb-3">Clique em duas notas:</p>
        <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
          {CHROMATIC_NOTES.map((note) => {
            const isFirst = firstNote === note;
            const isSecond = secondNote === note;
            const isSelected = isFirst || isSecond;
            
            return (
              <button
                key={note}
                onClick={() => handleNoteClick(note)}
                disabled={isPlaying}
                className={`p-4 rounded-lg font-bold text-white transition-all disabled:opacity-50 ${
                  isFirst
                    ? 'bg-purple-500 hover:bg-purple-600 scale-105'
                    : isSecond
                    ? 'bg-pink-500 hover:bg-pink-600 scale-105'
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
          onClick={handlePlayInterval}
          disabled={!firstNote || !secondNote}
          className={`flex-1 ${
            isPlaying
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
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
              Ouvir Intervalo
            </>
          )}
        </Button>
        
        <Button
          onClick={handleReset}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Resetar
        </Button>
      </div>

      {/* Dica */}
      <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <p className="text-xs text-gray-400">
          <strong className="text-blue-400">💡 Dica:</strong> Tente identificar intervalos conhecidos! 
          Por exemplo, C → E = 3ª Maior (início de "Oh When the Saints").
        </p>
      </div>
    </Card>
  );
}
