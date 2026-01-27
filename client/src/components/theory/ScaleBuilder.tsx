/**
 * Construtor Interativo de Escalas
 * Permite usuário construir escalas selecionando intervalos e recebe feedback
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

const SCALE_TEMPLATES: Record<string, { intervals: number[]; name: string; description: string }> = {
  'Maior': {
    intervals: [0, 2, 4, 5, 7, 9, 11],
    name: 'Escala Maior',
    description: 'Tom - Tom - Semitom - Tom - Tom - Tom - Semitom',
  },
  'Menor Natural': {
    intervals: [0, 2, 3, 5, 7, 8, 10],
    name: 'Escala Menor Natural',
    description: 'Tom - Semitom - Tom - Tom - Semitom - Tom - Tom',
  },
  'Pentatônica Menor': {
    intervals: [0, 3, 5, 7, 10],
    name: 'Escala Pentatônica Menor',
    description: '5 notas: Fundamental, 3ª menor, 4ª, 5ª, 7ª menor',
  },
  'Pentatônica Maior': {
    intervals: [0, 2, 4, 7, 9],
    name: 'Escala Pentatônica Maior',
    description: '5 notas: Fundamental, 2ª maior, 3ª maior, 5ª, 6ª maior',
  },
  'Dórico': {
    intervals: [0, 2, 3, 5, 7, 9, 10],
    name: 'Modo Dórico',
    description: 'Menor natural com 6ª maior',
  },
  'Mixolídio': {
    intervals: [0, 2, 4, 5, 7, 9, 10],
    name: 'Modo Mixolídio',
    description: 'Maior com 7ª menor',
  },
};

const INTERVAL_LABELS = ['T', 'T', 'S', 'T', 'T', 'T', 'S']; // Tom, Semitom

export function ScaleBuilder() {
  const [rootNote, setRootNote] = useState<string>('C');
  const [selectedIntervals, setSelectedIntervals] = useState<number[]>([]);
  const [targetScaleType, setTargetScaleType] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const { addXP } = useGamificationStore();

  // Gerar escala alvo aleatória
  const generateTarget = () => {
    const scaleTypes = Object.keys(SCALE_TEMPLATES);
    const randomType = scaleTypes[Math.floor(Math.random() * scaleTypes.length)];
    setTargetScaleType(randomType);
    setSelectedIntervals([]);
    setFeedback(null);
  };

  const handleIntervalToggle = (interval: number) => {
    if (selectedIntervals.includes(interval)) {
      setSelectedIntervals(selectedIntervals.filter(i => i !== interval));
    } else {
      // Adicionar intervalo mantendo ordem
      const newIntervals = [...selectedIntervals, interval].sort((a, b) => a - b);
      setSelectedIntervals(newIntervals);
    }
    setFeedback(null);
  };

  const handleCheck = () => {
    if (!targetScaleType) {
      setFeedback({
        correct: false,
        message: 'Clique em "Nova Escala" para começar!',
      });
      return;
    }

    const targetIntervals = SCALE_TEMPLATES[targetScaleType].intervals;

    // Comparar intervalos (ignorar ordem, apenas valores)
    const selectedSorted = [...selectedIntervals].sort((a, b) => a - b);
    const targetSorted = [...targetIntervals].sort((a, b) => a - b);

    const matches = selectedSorted.length === targetSorted.length &&
      selectedSorted.every((val, idx) => val === targetSorted[idx]);

    if (matches) {
      const scaleName = SCALE_TEMPLATES[targetScaleType].name;
      setFeedback({
        correct: true,
        message: `Correto! Você construiu a ${scaleName} de ${rootNote}.`,
      });
      setScore(score + 1);
      setAttempts(attempts + 1);
      addXP(15);
    } else {
      setFeedback({
        correct: false,
        message: `Os intervalos não correspondem à ${SCALE_TEMPLATES[targetScaleType].name}. Tente novamente!`,
      });
      setAttempts(attempts + 1);
    }
  };

  const { isReady } = useAudio();
  const playbackAbortRef = React.useRef<AbortController | null>(null);

  // Parar áudio quando componente desmontar ou escala mudar
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
  }, [selectedIntervals, rootNote]);

  const handlePlayScale = async () => {
    if (selectedIntervals.length === 0) return;

    // Mark interaction immediately - ALWAYS
    await unifiedAudioService.markUserInteraction();

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
      const rootIndex = CHROMATIC_NOTES.indexOf(rootNote);
      const scaleNotes: string[] = [];
      selectedIntervals.forEach(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        scaleNotes.push(CHROMATIC_NOTES[noteIndex]);
      });
      for (let i = 0; i < scaleNotes.length; i++) {
        if (playbackAbortRef.current?.signal.aborted) break;
        await unifiedAudioService.playNote(`${scaleNotes[i]}4`, 0.3);
        if (playbackAbortRef.current?.signal.aborted) break;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      if (!playbackAbortRef.current?.signal.aborted) {
        await unifiedAudioService.playNote(`${rootNote}5`, 0.3);
      }
    } catch (error) {
      console.error('Erro ao tocar escala:', error);
    } finally {
      if (!playbackAbortRef.current?.signal.aborted) {
        setIsPlaying(false);
      }
      playbackAbortRef.current = null;
    }
  };

  const handleReset = () => {
    setSelectedIntervals([]);
    setFeedback(null);
  };

  // Gerar notas da escala baseado nos intervalos selecionados
  const generateScaleNotes = (): string[] => {
    const rootIndex = CHROMATIC_NOTES.indexOf(rootNote);
    const notes: string[] = [];

    selectedIntervals.forEach(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      notes.push(CHROMATIC_NOTES[noteIndex]);
    });

    return notes;
  };

  const scaleNotes = generateScaleNotes();
  const targetIntervals = targetScaleType ? SCALE_TEMPLATES[targetScaleType].intervals : [];

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
          <Music className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Construtor de Escalas</h3>
          <p className="text-sm text-gray-400">Construa escalas selecionando intervalos</p>
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

      {/* Seletor de Tônica */}
      <div className="mb-6">
        <p className="text-sm text-gray-400 mb-2">Tônica (nota fundamental):</p>
        <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
          {CHROMATIC_NOTES.map((note) => (
            <button
              key={note}
              onClick={() => setRootNote(note)}
              className={`p-3 rounded-lg font-bold text-white transition-all ${rootNote === note
                ? 'bg-amber-500 hover:bg-amber-600 scale-105'
                : 'bg-white/10 hover:bg-white/20'
                }`}
            >
              {note}
            </button>
          ))}
        </div>
      </div>

      {/* Escala Alvo */}
      {targetScaleType ? (
        <div className="mb-6 p-4 rounded-lg bg-blue-500/20 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Objetivo:</p>
              <p className="text-xl font-bold text-white">
                Construir {SCALE_TEMPLATES[targetScaleType].name}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {SCALE_TEMPLATES[targetScaleType].description}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Intervalos: {targetIntervals.join(', ')} semitons
              </p>
            </div>
            <Button
              onClick={generateTarget}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Nova Escala
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-gray-400 mb-3">Clique em "Nova Escala" para começar!</p>
          <Button
            onClick={generateTarget}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          >
            Nova Escala
          </Button>
        </div>
      )}

      {/* Intervalos Selecionados */}
      {selectedIntervals.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-2">Intervalos selecionados:</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedIntervals.map((interval, index) => (
              <motion.div
                key={interval}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-white font-bold text-sm"
              >
                {interval} semitons
              </motion.div>
            ))}
          </div>
          {scaleNotes.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-400 mb-1">Notas da escala:</p>
              <div className="flex flex-wrap gap-2">
                {scaleNotes.map((note, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-lg bg-white/10 text-white font-medium text-sm"
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg mb-6 ${feedback.correct
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

      {/* Seletor de Intervalos */}
      <div className="mb-6">
        <p className="text-sm text-gray-400 mb-3">Clique nos intervalos para construir a escala:</p>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((interval) => {
            const isSelected = selectedIntervals.includes(interval);

            return (
              <button
                key={interval}
                onClick={() => handleIntervalToggle(interval)}
                disabled={isPlaying}
                className={`p-3 rounded-lg font-bold text-white transition-all disabled:opacity-50 ${isSelected
                  ? 'bg-amber-500 hover:bg-amber-600 scale-105'
                  : 'bg-white/10 hover:bg-white/20'
                  }`}
              >
                {interval}
                <div className="text-xs mt-1 opacity-75">
                  {interval === 0 ? 'Fund.' : `${interval}st`}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-3">
        <Button
          onClick={handleCheck}
          disabled={!targetScaleType || selectedIntervals.length === 0 || isPlaying}
          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Verificar
        </Button>

        <Button
          onClick={handlePlayScale}
          disabled={selectedIntervals.length === 0}
          variant="outline"
          className={`border-white/20 text-white hover:bg-white/10 ${isPlaying ? 'bg-red-500/20 border-red-500/50' : ''
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
          <strong className="text-blue-400">💡 Dica:</strong> Escala Maior = 0, 2, 4, 5, 7, 9, 11 semitons.
          Escala Menor Natural = 0, 2, 3, 5, 7, 8, 10 semitons.
        </p>
      </div>
    </Card>
  );
}
