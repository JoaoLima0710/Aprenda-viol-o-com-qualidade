import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Hand,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

export interface BPMControlsProps {
  bpm: number;
  onBpmChange: (bpm: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  showTapTempo?: boolean;
  showPresets?: boolean;
  minBpm?: number;
  maxBpm?: number;
  stepSize?: number;
}

export function BPMControls({
  bpm,
  onBpmChange,
  isPlaying,
  onPlayPause,
  onReset,
  showTapTempo = true,
  showPresets = true,
  minBpm = 40,
  maxBpm = 200,
  stepSize = 1
}: BPMControlsProps) {
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Presets de BPM por gênero/estilo
  const bpmPresets = {
    'Lento': 60,
    'Moderado': 80,
    'Rápido': 100,
    'Rock': 120,
    'Pop': 110,
    'Samba': 100,
    'Bossa Nova': 130,
    'Balada': 70,
    'Funk': 110,
    'Reggae': 90
  };

  const adjustBpm = (delta: number) => {
    const newBpm = Math.max(minBpm, Math.min(maxBpm, bpm + delta));
    onBpmChange(newBpm);
  };

  const setBpm = (newBpm: number) => {
    onBpmChange(Math.max(minBpm, Math.min(maxBpm, newBpm)));
  };

  // Tap Tempo functionality
  const handleTap = () => {
    const now = Date.now();
    setTapTimes(prev => {
      const newTimes = [...prev, now].slice(-4); // Keep last 4 taps

      // Calculate BPM if we have at least 2 taps
      if (newTimes.length >= 2) {
        const intervals = [];
        for (let i = 1; i < newTimes.length; i++) {
          intervals.push(newTimes[i] - newTimes[i - 1]);
        }

        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const calculatedBpm = Math.round(60000 / avgInterval);

        if (calculatedBpm >= minBpm && calculatedBpm <= maxBpm) {
          onBpmChange(calculatedBpm);
        }
      }

      return newTimes;
    });

    // Clear tap times after 2 seconds of inactivity
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(() => {
      setTapTimes([]);
    }, 2000);
  };

  // Detect double tap for quick play/pause
  const [lastTap, setLastTap] = useState(0);
  const handleBpmDisplayTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      // Double tap detected
      onPlayPause();
    }
    setLastTap(now);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't interfere with text inputs
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          onPlayPause();
          break;
        case 'ArrowUp':
          if (e.shiftKey) {
            e.preventDefault();
            adjustBpm(5);
          } else {
            e.preventDefault();
            adjustBpm(stepSize);
          }
          break;
        case 'ArrowDown':
          if (e.shiftKey) {
            e.preventDefault();
            adjustBpm(-5);
          } else {
            e.preventDefault();
            adjustBpm(-stepSize);
          }
          break;
        case 'r':
        case 'R':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onReset();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onPlayPause, stepSize, onReset]);

  const getBpmCategory = (bpmValue: number): string => {
    if (bpmValue < 60) return 'Lentíssimo';
    if (bpmValue < 76) return 'Lento';
    if (bpmValue < 108) return 'Moderado';
    if (bpmValue < 120) return 'Rápido';
    if (bpmValue < 168) return 'Muito Rápido';
    return 'Extremamente Rápido';
  };

  const getBpmColor = (bpmValue: number): string => {
    if (bpmValue < 60) return 'text-blue-400';
    if (bpmValue < 76) return 'text-green-400';
    if (bpmValue < 108) return 'text-yellow-400';
    if (bpmValue < 120) return 'text-orange-400';
    if (bpmValue < 168) return 'text-red-400';
    return 'text-purple-400';
  };

  return (
    <div className="space-y-4">
      {/* Main BPM Display */}
      <div className="text-center">
        <motion.div
          className={`text-6xl font-bold font-mono ${getBpmColor(bpm)} cursor-pointer select-none`}
          onClick={handleBpmDisplayTap}
          whileTap={{ scale: 0.95 }}
        >
          {bpm}
        </motion.div>
        <div className="text-sm text-gray-400 mt-1">
          BPM • {getBpmCategory(bpm)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Double tap para play/pause
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-4">
        {/* Decrease BPM */}
        <Button
          onClick={() => adjustBpm(-stepSize)}
          variant="outline"
          size="lg"
          className="w-14 h-14 rounded-full"
          disabled={bpm <= minBpm}
        >
          <ChevronDown className="w-6 h-6" />
        </Button>

        {/* Play/Pause */}
        <Button
          onClick={onPlayPause}
          className={`w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 ${
            isPlaying ? 'ring-2 ring-purple-400' : ''
          }`}
          size="lg"
        >
          {isPlaying ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8 ml-1" />
          )}
        </Button>

        {/* Increase BPM */}
        <Button
          onClick={() => adjustBpm(stepSize)}
          variant="outline"
          size="lg"
          className="w-14 h-14 rounded-full"
          disabled={bpm >= maxBpm}
        >
          <ChevronUp className="w-6 h-6" />
        </Button>

        {/* Reset */}
        <Button
          onClick={onReset}
          variant="outline"
          size="lg"
          className="w-14 h-14 rounded-full ml-4"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center justify-center gap-3">
        {/* Tap Tempo */}
        {showTapTempo && (
          <Button
            onClick={handleTap}
            variant="outline"
            className={`px-4 py-2 ${tapTimes.length > 0 ? 'bg-purple-500/20 border-purple-400' : ''}`}
          >
            <Hand className="w-4 h-4 mr-2" />
            Tap Tempo
            {tapTimes.length > 0 && (
              <Badge variant="outline" className="ml-2 text-xs">
                {tapTimes.length}
              </Badge>
            )}
          </Button>
        )}

        {/* Presets */}
        {showPresets && (
          <div className="relative">
            <Button
              onClick={() => setShowPresetsMenu(!showPresetsMenu)}
              variant="outline"
              className="px-4 py-2"
            >
              <Zap className="w-4 h-4 mr-2" />
              Presets
            </Button>

            {showPresetsMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-[#0f0f1a] border border-white/20 rounded-lg p-2 min-w-[200px] z-10"
              >
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(bpmPresets).map(([name, presetBpm]) => (
                    <Button
                      key={name}
                      onClick={() => {
                        setBpm(presetBpm);
                        setShowPresetsMenu(false);
                      }}
                      variant={bpm === presetBpm ? "default" : "ghost"}
                      size="sm"
                      className="justify-start text-left h-auto py-2 px-3"
                    >
                      <span className="text-sm">{name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{presetBpm}</span>
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="text-center text-xs text-gray-500 space-y-1">
        <div>Teclado: ↑↓ para BPM, Shift+↑↓ para ±5, Espaço para play/pause</div>
        <div>Ctrl+R para reset</div>
      </div>

      {/* Visual Feedback for Tap Tempo */}
      {tapTimes.length > 0 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="text-center"
        >
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
            <Zap className="w-3 h-3 mr-1" />
            BPM detectado: {bpm}
          </Badge>
        </motion.div>
      )}
    </div>
  );
}

// Hook para usar controles de BPM
export function useBPMControls(initialBpm = 120) {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);

  const playPause = () => setIsPlaying(!isPlaying);
  const reset = () => {
    setIsPlaying(false);
    setBpm(initialBpm);
  };

  return {
    bpm,
    setBpm,
    isPlaying,
    playPause,
    reset
  };
}