import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  ChevronUp,
  ChevronDown,
  Settings,
  Maximize2,
  Minimize2,
  Repeat,
  Type,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PerformanceModeProps {
  songTitle: string;
  artist: string;
  chordSheet: string;
  bpm: number;
  onClose: () => void;
}

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  speed: number;
  loopEnabled: boolean;
  loopStart?: number;
  loopEnd?: number;
}

interface DisplaySettings {
  fontSize: 'small' | 'medium' | 'large';
  showChords: boolean;
  highContrast: boolean;
  autoScroll: boolean;
  scrollSpeed: number;
}

export function PerformanceMode({
  songTitle,
  artist,
  chordSheet,
  bpm,
  onClose
}: PerformanceModeProps) {
  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    speed: 1,
    loopEnabled: false
  });

  const [display, setDisplay] = useState<DisplaySettings>({
    fontSize: 'medium',
    showChords: true,
    highContrast: false,
    autoScroll: true,
    scrollSpeed: 30
  });

  const [transposition, setTransposition] = useState(0);
  const [capo, setCapo] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll quando tocando
  useEffect(() => {
    if (playback.isPlaying && display.autoScroll && contentRef.current) {
      scrollIntervalRef.current = setInterval(() => {
        if (contentRef.current) {
          const container = contentRef.current;
          const newScrollTop = container.scrollTop + (display.scrollSpeed * playback.speed * 0.1);

          // Verificar se chegou ao final
          if (newScrollTop >= container.scrollHeight - container.clientHeight) {
            if (playback.loopEnabled) {
              container.scrollTop = playback.loopStart || 0;
            } else {
              setPlayback(prev => ({ ...prev, isPlaying: false }));
            }
          } else {
            container.scrollTop = newScrollTop;
          }
        }
      }, 100);
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [playback.isPlaying, display.autoScroll, display.scrollSpeed, playback.speed, playback.loopEnabled]);

  // Timer de playback
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (playback.isPlaying) {
      interval = setInterval(() => {
        setPlayback(prev => ({
          ...prev,
          currentTime: prev.currentTime + 1
        }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [playback.isPlaying]);

  const togglePlayback = () => {
    setPlayback(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const restart = () => {
    setPlayback(prev => ({ ...prev, currentTime: 0, isPlaying: false }));
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

  const adjustSpeed = (delta: number) => {
    setPlayback(prev => ({
      ...prev,
      speed: Math.max(0.5, Math.min(2, prev.speed + delta))
    }));
  };

  const adjustTransposition = (delta: number) => {
    setTransposition(prev => Math.max(-12, Math.min(12, prev + delta)));
  };

  const adjustCapo = (delta: number) => {
    setCapo(prev => Math.max(0, Math.min(12, prev + delta)));
  };

  const setLoopPoint = (type: 'start' | 'end') => {
    if (!contentRef.current) return;

    const scrollTop = contentRef.current.scrollTop;
    setPlayback(prev => ({
      ...prev,
      [type === 'start' ? 'loopStart' : 'loopEnd']: scrollTop
    }));
  };

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const getFontSizeClass = () => {
    switch (display.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  const getLineHeightClass = () => {
    switch (display.fontSize) {
      case 'small': return 'leading-relaxed';
      case 'large': return 'leading-loose';
      default: return 'leading-relaxed';
    }
  };

  // Parse chord sheet and apply transposition
  const renderChordSheet = () => {
    if (!chordSheet) return null;

    const lines = chordSheet.split('\n');
    const chordRegex = /\[([^\]]+)\]/g;

    return lines.map((line, index) => {
      if (!display.showChords) {
        return (
          <div key={index} className={`${getFontSizeClass()} ${getLineHeightClass()} text-white mb-2`}>
            {line.replace(chordRegex, '')}
          </div>
        );
      }

      // Parse chords and lyrics
      const parts: Array<{ text: string; chord?: string }> = [];
      let lastIndex = 0;
      let match;

      while ((match = chordRegex.exec(line)) !== null) {
        // Add text before chord
        if (match.index > lastIndex) {
          parts.push({
            text: line.slice(lastIndex, match.index)
          });
        }

        // Add chord
        let chord = match[1];
        if (transposition !== 0) {
          chord = transposeChord(chord, transposition);
        }

        parts.push({
          text: match[0].replace(/\[/g, '').replace(/\]/g, ''),
          chord
        });

        lastIndex = match.index + match[0].length;
      }

      // Add remaining text
      if (lastIndex < line.length) {
        parts.push({
          text: line.slice(lastIndex)
        });
      }

      return (
        <div key={index} className={`relative ${getFontSizeClass()} ${getLineHeightClass()} mb-4`}>
          {/* Chords above text */}
          {display.showChords && (
            <div className="h-6 mb-1 flex">
              {parts.map((part, partIndex) => (
                part.chord ? (
                  <span
                    key={partIndex}
                    className={`font-bold text-purple-400 mr-2 ${
                      display.highContrast ? 'text-yellow-300' : ''
                    }`}
                  >
                    {part.chord}
                  </span>
                ) : (
                  <span
                    key={partIndex}
                    className="mr-2"
                    style={{ width: `${part.text.length * 0.6}em` }}
                  >
                    {' '.repeat(part.text.length)}
                  </span>
                )
              ))}
            </div>
          )}

          {/* Lyrics */}
          <div className={`text-white ${display.highContrast ? 'text-yellow-100' : ''}`}>
            {parts.map((part, partIndex) => (
              <span key={partIndex}>{part.text}</span>
            ))}
          </div>
        </div>
      );
    });
  };

  // Simple chord transposition (basic implementation)
  const transposeChord = (chord: string, semitones: number): string => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const root = chord.match(/^([A-G]#?)/)?.[1];

    if (!root) return chord;

    const currentIndex = notes.indexOf(root);
    if (currentIndex === -1) return chord;

    const newIndex = (currentIndex + semitones + 12) % 12;
    const newRoot = notes[newIndex];

    return chord.replace(root, newRoot);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen bg-[#0f0f1a] ${fullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header (collapses when scrolling) */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ height: 'auto', opacity: 1 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="sticky top-0 z-10 bg-[#0f0f1a]/95 backdrop-blur-sm border-b border-white/10"
          >
            <div className="flex items-center justify-between p-4">
              <div>
                <h1 className="text-lg font-bold text-white truncate">{songTitle}</h1>
                <p className="text-sm text-gray-400 truncate">{artist}</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Quick controls */}
                <Badge variant="outline" className="text-sm">
                  {bpm * playback.speed} BPM
                </Badge>

                <Button onClick={() => setShowControls(false)} variant="ghost" size="sm">
                  <EyeOff className="w-4 h-4" />
                </Button>

                <Button onClick={toggleFullscreen} variant="ghost" size="sm">
                  {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>

                <Button onClick={onClose} variant="ghost" size="sm">
                  ✕
                </Button>
              </div>
            </div>

            {/* Quick settings bar */}
            <div className="px-4 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Transposition */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Tom:</span>
                  <Button
                    onClick={() => adjustTransposition(-1)}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                  <span className="text-sm font-mono min-w-[2rem] text-center">
                    {transposition > 0 ? `+${transposition}` : transposition}
                  </span>
                  <Button
                    onClick={() => adjustTransposition(1)}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                </div>

                {/* Capo */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Capo:</span>
                  <Button
                    onClick={() => adjustCapo(-1)}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                  <span className="text-sm font-mono min-w-[2rem] text-center">
                    {capo}
                  </span>
                  <Button
                    onClick={() => adjustCapo(1)}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Display toggles */}
                <Button
                  onClick={() => setDisplay(prev => ({ ...prev, showChords: !prev.showChords }))}
                  variant={display.showChords ? "default" : "outline"}
                  size="sm"
                >
                  <Type className="w-4 h-4" />
                </Button>

                <Button
                  onClick={() => setDisplay(prev => ({ ...prev, highContrast: !prev.highContrast }))}
                  variant={display.highContrast ? "default" : "outline"}
                  size="sm"
                >
                  <Zap className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show controls toggle */}
      {!showControls && (
        <div className="fixed top-4 right-4 z-20">
          <Button
            onClick={() => setShowControls(true)}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm"
            size="sm"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Main content */}
      <div
        ref={contentRef}
        className={`overflow-y-auto px-4 pb-32 ${
          fullscreen ? 'h-screen' : 'h-[calc(100vh-200px)]'
        }`}
        style={{
          scrollBehavior: 'smooth'
        }}
      >
        <div className={`max-w-2xl mx-auto py-8 ${display.highContrast ? 'bg-black/20' : ''}`}>
          {renderChordSheet()}
        </div>
      </div>

      {/* Playback controls (bottom bar) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0f0f1a]/95 backdrop-blur-md border-t border-white/10">
        <div className="p-4">
          {/* Main playback controls */}
          <div className="flex items-center justify-between mb-4">
            <Button onClick={restart} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-4">
              <Button onClick={() => setPlayback(prev => ({ ...prev, currentTime: Math.max(0, prev.currentTime - 10) }))}>
                <SkipBack className="w-5 h-5" />
              </Button>

              <Button
                onClick={togglePlayback}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 w-12 h-12 rounded-full"
                size="lg"
              >
                {playback.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </Button>

              <Button onClick={() => setPlayback(prev => ({ ...prev, currentTime: prev.currentTime + 10 }))}>
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            <Button
              onClick={() => setPlayback(prev => ({ ...prev, loopEnabled: !prev.loopEnabled }))}
              variant={playback.loopEnabled ? "default" : "outline"}
              size="sm"
            >
              <Repeat className="w-4 h-4" />
            </Button>
          </div>

          {/* Secondary controls */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {/* Speed control */}
              <div className="flex items-center gap-2">
                <Button onClick={() => adjustSpeed(-0.1)} variant="outline" size="sm" className="h-8 w-8 p-0">
                  <ChevronDown className="w-3 h-3" />
                </Button>
                <span className="font-mono min-w-[3rem] text-center">
                  {playback.speed.toFixed(1)}x
                </span>
                <Button onClick={() => adjustSpeed(0.1)} variant="outline" size="sm" className="h-8 w-8 p-0">
                  <ChevronUp className="w-3 h-3" />
                </Button>
              </div>

              {/* Loop controls */}
              {playback.loopEnabled && (
                <div className="flex items-center gap-2">
                  <Button onClick={() => setLoopPoint('start')} variant="outline" size="sm">
                    A
                  </Button>
                  <Button onClick={() => setLoopPoint('end')} variant="outline" size="sm">
                    B
                  </Button>
                </div>
              )}
            </div>

            <div className="text-gray-400 font-mono">
              {formatTime(playback.currentTime)}
            </div>
          </div>

          {/* Auto-scroll indicator */}
          {playback.isPlaying && display.autoScroll && (
            <div className="mt-2 text-center">
              <Badge variant="outline" className="text-xs">
                Rolagem automática: {display.scrollSpeed}px/s
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}