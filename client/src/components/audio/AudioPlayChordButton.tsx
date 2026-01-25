import React, { useState, useEffect, useRef } from 'react';
import { useAudio } from '../../hooks/useAudio';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { Volume2, VolumeX, Loader2, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioPlayChordButtonProps {
  chordNotes?: string[]; // Array de notas (ex: ["C4", "E4", "G4"])
  chordName?: string; // Nome do acorde (ex: "C", "Am") - alternativa a chordNotes
  duration?: number; // Duração em segundos
  label?: string; // Label do botão
  sequential?: boolean; // Se true, toca notas sequencialmente; se false, simultaneamente
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function AudioPlayChordButton({
  chordNotes,
  chordName,
  duration = 0.5,
  label,
  sequential = false,
  className = '',
  size = 'md',
}: AudioPlayChordButtonProps) {
  const { isReady, initialize } = useAudio();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [canStop, setCanStop] = useState(false);
  const playbackAbortRef = useRef<AbortController | null>(null);

  // Parar áudio quando componente desmontar ou props mudarem
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [chordNotes, chordName]);

  const stopAudio = async () => {
    if (playbackAbortRef.current) {
      playbackAbortRef.current.abort();
      playbackAbortRef.current = null;
    }
    try {
      await unifiedAudioService.stopAll();
    } catch (error) {
      console.error('Erro ao parar áudio:', error);
    }
    setIsPlaying(false);
    setCanStop(false);
  };

  const playAudio = async () => {
    // Se já está tocando, parar primeiro
    if (isPlaying) {
      await stopAudio();
      return;
    }

    if (!isReady) {
      setIsLoading(true);
      try {
        await initialize();
      } catch (error) {
        console.error('Erro ao inicializar áudio:', error);
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    }

    setIsPlaying(true);
    setCanStop(true);
    playbackAbortRef.current = new AbortController();

    try {
      await unifiedAudioService.ensureInitialized();

      if (chordNotes && chordNotes.length > 0) {
        // Tocar array de notas
        if (sequential) {
          // Sequencial: tocar uma nota por vez
          for (let i = 0; i < chordNotes.length; i++) {
            if (playbackAbortRef.current?.signal.aborted) break;
            await unifiedAudioService.playNote(chordNotes[i], duration);
            if (i < chordNotes.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }
        } else {
          // Simultâneo: tocar todas as notas quase ao mesmo tempo
          const playPromises = chordNotes.map((note, index) => {
            return new Promise<void>((resolve) => {
              setTimeout(async () => {
                if (!playbackAbortRef.current?.signal.aborted) {
                  try {
                    await unifiedAudioService.playNote(note, duration);
                  } catch (error) {
                    console.error(`Erro ao tocar nota ${note}:`, error);
                  }
                }
                resolve();
              }, index * 50); // 50ms entre cada nota para formar acorde
            });
          });
          await Promise.all(playPromises);
        }
      } else if (chordName) {
        // Tocar acorde por nome
        await unifiedAudioService.playChord(chordName, duration);
      }
    } catch (error) {
      console.error('Erro ao tocar áudio:', error);
    } finally {
      if (!playbackAbortRef.current?.signal.aborted) {
        setIsPlaying(false);
        setCanStop(false);
      }
      playbackAbortRef.current = null;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const displayLabel = label || (isPlaying ? 'Parar' : 'Ouvir');

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        onClick={playAudio}
        disabled={isLoading}
        variant={isPlaying ? 'destructive' : 'default'}
        size={size}
        className={sizeClasses[size]}
      >
        {isLoading ? (
          <Loader2 className={`${iconSizes[size]} animate-spin mr-1`} />
        ) : isPlaying ? (
          <VolumeX className={`${iconSizes[size]} mr-1`} />
        ) : (
          <Play className={`${iconSizes[size]} mr-1`} />
        )}
        {displayLabel}
      </Button>
      
      {canStop && (
        <Button
          onClick={stopAudio}
          variant="outline"
          size={size}
          className={sizeClasses[size]}
        >
          <VolumeX className={`${iconSizes[size]} mr-1`} />
          Parar
        </Button>
      )}
    </div>
  );
}

// Named export para compatibilidade
export const ChordPlayButton = AudioPlayChordButton;
