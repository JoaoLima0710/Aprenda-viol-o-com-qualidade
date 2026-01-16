import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChordSheetWithPlayerProps {
  chordSheet: string;
  bpm: number;
  title: string;
}

export function ChordSheetWithPlayer({ chordSheet, bpm, title }: ChordSheetWithPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1); // 0.5x, 0.75x, 1x, 1.25x, 1.5x
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Parse chord sheet into lines
  const lines = chordSheet.split('\n').filter(line => line.trim() !== '');

  // Calculate time per line based on BPM and speed
  const timePerLine = (60 / bpm) * 4 * (1 / speed); // 4 beats per line

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 0.1;
          const newLineIndex = Math.floor(newTime / timePerLine);
          
          if (newLineIndex >= lines.length) {
            // End of song
            setIsPlaying(false);
            setCurrentTime(0);
            setCurrentLineIndex(0);
            return 0;
          }
          
          setCurrentLineIndex(newLineIndex);
          
          // Auto-scroll to current line
          if (lineRefs.current[newLineIndex]) {
            lineRefs.current[newLineIndex]?.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
          
          return newTime;
        });
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, timePerLine, lines.length]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentLineIndex(0);
    if (lineRefs.current[0]) {
      lineRefs.current[0]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const handleSpeedChange = (delta: number) => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5];
    const currentIndex = speeds.indexOf(speed);
    const newIndex = Math.max(0, Math.min(speeds.length - 1, currentIndex + delta));
    setSpeed(speeds[newIndex]);
  };

  const isChordLine = (line: string) => {
    // Check if line contains chord markers like [G], [Am], etc.
    return line.includes('[') && line.includes(']');
  };

  const renderLine = (line: string, index: number) => {
    const isActive = index === currentLineIndex && isPlaying;
    const isChord = isChordLine(line);

    // Parse chords and lyrics
    if (isChord) {
      const parts = line.split(/(\[[^\]]+\])/g);
      return (
        <motion.div
          key={index}
          ref={el => { lineRefs.current[index] = el; }}
          className={`py-2 px-4 rounded-lg transition-all duration-300 ${
            isActive
              ? 'bg-gradient-to-r from-[#06b6d4]/30 to-[#0891b2]/20 border-l-4 border-cyan-400 scale-105'
              : 'hover:bg-white/5'
          }`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.02 }}
        >
          <div className="flex flex-wrap items-baseline gap-1">
            {parts.map((part, i) => {
              if (part.match(/\[[^\]]+\]/)) {
                // Chord
                const chord = part.replace(/[\[\]]/g, '');
                return (
                  <span
                    key={i}
                    className={`font-bold text-sm px-2 py-0.5 rounded ${
                      isActive
                        ? 'text-cyan-300 bg-cyan-900/30'
                        : 'text-cyan-400 bg-cyan-900/20'
                    }`}
                  >
                    {chord}
                  </span>
                );
              } else if (part.trim()) {
                // Lyrics
                return (
                  <span
                    key={i}
                    className={`text-base ${
                      isActive ? 'text-white font-semibold' : 'text-gray-300'
                    }`}
                  >
                    {part}
                  </span>
                );
              }
              return null;
            })}
          </div>
        </motion.div>
      );
    } else if (line.startsWith('[') && line.endsWith(']')) {
      // Section marker like [Intro], [Verso 1], etc.
      return (
        <div
          key={index}
          ref={el => { lineRefs.current[index] = el; }}
          className="mt-6 mb-2"
        >
          <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white font-bold text-sm">
            {line.replace(/[\[\]]/g, '')}
          </div>
        </div>
      );
    } else {
      // Regular text line
      return (
        <div
          key={index}
          ref={el => { lineRefs.current[index] = el; }}
          className={`py-2 px-4 rounded-lg transition-all duration-300 ${
            isActive
              ? 'bg-gradient-to-r from-[#06b6d4]/30 to-[#0891b2]/20 border-l-4 border-cyan-400 scale-105'
              : 'hover:bg-white/5'
          }`}
        >
          <span className={`text-base ${isActive ? 'text-white font-semibold' : 'text-gray-300'}`}>
            {line}
          </span>
        </div>
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Player Controls */}
      <div className="sticky top-0 z-10 p-4 rounded-2xl bg-gradient-to-br from-[#1a1a2e]/95 to-[#2a2a3e]/90 backdrop-blur-xl border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          {/* Play/Pause and Reset */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePlayPause}
              className={`${
                isPlaying
                  ? 'bg-gradient-to-r from-[#ef4444] to-[#dc2626] hover:from-[#dc2626] hover:to-[#ef4444]'
                  : 'bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:from-[#0891b2] hover:to-[#06b6d4]'
              } text-white font-semibold px-6`}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              <span className="ml-2">{isPlaying ? 'Pausar' : 'Tocar'}</span>
            </Button>
            
            <Button
              onClick={handleReset}
              variant="outline"
              className="bg-[#1a1a2e]/60 border-white/20 text-gray-300 hover:bg-white/10"
            >
              <RotateCcw size={20} />
            </Button>
          </div>

          {/* Speed Control */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 font-semibold">Velocidade:</span>
            <Button
              onClick={() => handleSpeedChange(-1)}
              variant="outline"
              size="sm"
              className="bg-[#1a1a2e]/60 border-white/20 text-gray-300 hover:bg-white/10"
              disabled={speed === 0.5}
            >
              <Minus size={16} />
            </Button>
            <span className="text-lg font-bold text-cyan-400 min-w-[60px] text-center">
              {speed}x
            </span>
            <Button
              onClick={() => handleSpeedChange(1)}
              variant="outline"
              size="sm"
              className="bg-[#1a1a2e]/60 border-white/20 text-gray-300 hover:bg-white/10"
              disabled={speed === 1.5}
            >
              <Plus size={16} />
            </Button>
          </div>

          {/* Progress */}
          <div className="flex-1 max-w-xs">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Linha {currentLineIndex + 1}</span>
              <span>{lines.length} linhas</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#06b6d4] to-[#0891b2]"
                initial={{ width: '0%' }}
                animate={{ width: `${((currentLineIndex + 1) / lines.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chord Sheet */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1a1a2e]/80 to-[#2a2a3e]/60 border border-white/20 shadow-xl">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="w-1 h-8 bg-gradient-to-b from-[#06b6d4] to-[#0891b2] rounded-full" />
          {title}
        </h3>
        
        <div className="space-y-1 font-mono text-sm max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-cyan-600 scrollbar-track-transparent">
          {lines.map((line, index) => renderLine(line, index))}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 rounded-xl bg-[#1a1a2e]/60 border border-white/10">
        <h4 className="text-sm font-bold text-white mb-2">💡 Como Usar</h4>
        <ul className="space-y-1 text-xs text-gray-400">
          <li>• Clique em <strong className="text-cyan-400">Tocar</strong> para iniciar o marcador de tempo</li>
          <li>• A linha atual será destacada em <strong className="text-cyan-400">azul</strong></li>
          <li>• Ajuste a <strong className="text-cyan-400">velocidade</strong> para praticar mais devagar</li>
          <li>• O scroll automático acompanha a música</li>
        </ul>
      </div>
    </div>
  );
}
