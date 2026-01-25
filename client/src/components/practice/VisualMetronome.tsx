/**
 * Metrônomo Visual
 * Exibe pulso visual sincronizado com áudio
 */

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { rhythmScheduler } from '@/services/RhythmScheduler';

interface VisualMetronomeProps {
  bpm?: number;
  timeSignature?: [number, number]; // [beats, noteValue] e.g., [4, 4] for 4/4
  onBPMChange?: (bpm: number) => void;
  className?: string;
}

export function VisualMetronome({
  bpm = 120,
  timeSignature = [4, 4],
  onBPMChange,
  className = '',
}: VisualMetronomeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBPM, setCurrentBPM] = useState(bpm);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [beatProgress, setBeatProgress] = useState(0);
  const [volume, setVolume] = useState(0.7);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const beatCountRef = useRef<number>(0);
  const schedulerIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  useEffect(() => {
    if (onBPMChange) {
      onBPMChange(currentBPM);
    }
  }, [currentBPM, onBPMChange]);

  const start = async () => {
    if (isPlaying) return;

    try {
      // Ensure audio service is initialized
      await unifiedAudioService.ensureInitialized();
      
      // Get AudioContext from UnifiedAudioService (fonte de verdade)
      const audioContext = unifiedAudioService.getAudioContext();
      
      if (!audioContext) {
        console.error('❌ VisualMetronome: No AudioContext available');
        setIsPlaying(false);
        return;
      }

      // Use the AudioContext from UnifiedAudioService
      audioContextRef.current = audioContext;
      
      // Resume if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Create gain node for volume control
      if (!gainNodeRef.current) {
        gainNodeRef.current = audioContext.createGain();
        gainNodeRef.current.gain.value = volume;
        gainNodeRef.current.connect(audioContext.destination);
      }

      // Initialize rhythm scheduler with lookahead
      await rhythmScheduler.initialize();
      
      setIsPlaying(true);
      startTimeRef.current = audioContext.currentTime;
      beatCountRef.current = 0;
      setCurrentBeat(0);
      setBeatProgress(0);

      // Calculate interval in seconds (AudioContext time)
      const beatIntervalSeconds = 60 / currentBPM;
      const [beatsPerMeasure, noteValue] = timeSignature;
      
      // Play click sound with lookahead scheduling
      const playClick = (beat: number, audioTime: number) => {
        if (!audioContext || !gainNodeRef.current) return;

        const isDownbeat = beat === 0;
        const frequency = isDownbeat ? 800 : 600; // Higher pitch for downbeat
        const duration = isDownbeat ? 0.1 : 0.05;

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        
        gain.gain.setValueAtTime(isDownbeat ? 0.3 : 0.2, audioTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioTime + duration);
        
        oscillator.connect(gain);
        gain.connect(gainNodeRef.current);
        
        oscillator.start(audioTime);
        oscillator.stop(audioTime + duration);
      };

      // Visual update callback com compensação de latência
      let beatCount = 0;
      const updateVisual = (audioTime: number, visualTime: number, beat: number) => {
        // Usar visualTime compensado para feedback visual
        const elapsed = visualTime - startTimeRef.current;
        const currentBeatInMeasure = beat % beatsPerMeasure;
        const beatProgress = ((elapsed % beatIntervalSeconds) / beatIntervalSeconds) * 100;

        setCurrentBeat(currentBeatInMeasure);
        setBeatProgress(Math.max(0, Math.min(100, beatProgress)));

        // Play click usando audioTime (preciso)
        playClick(currentBeatInMeasure, audioTime);
      };

      // Usar RhythmScheduler com lookahead para eventos repetitivos
      const schedulerId = rhythmScheduler.scheduleRepeating(
        'beat',
        beatIntervalSeconds,
        updateVisual,
        0 // Começar imediatamente
      );
      
      schedulerIdRef.current = schedulerId;
    } catch (error) {
      console.error('Error starting metronome:', error);
      setIsPlaying(false);
    }
  };

  const stop = () => {
    // Cancel scheduled events using RhythmScheduler
    if (schedulerIdRef.current) {
      rhythmScheduler.cancelEvent(schedulerIdRef.current);
      schedulerIdRef.current = null;
    }
    
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current = null;
    }
    
    setIsPlaying(false);
    setCurrentBeat(0);
    setBeatProgress(0);
  };

  const handleBPMChange = (newBPM: number[]) => {
    const bpmValue = newBPM[0];
    setCurrentBPM(bpmValue);
    
    // Restart if playing - usar RhythmScheduler com lookahead
    if (isPlaying) {
      stop();
      // Usar rhythm scheduler para agendar restart com compensação
      rhythmScheduler.scheduleEvent('click', 0.1, () => {
        start();
      });
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = vol;
    }
  };

  const [beatsPerMeasure] = timeSignature;

  return (
    <Card className={`p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Metrônomo</h3>
            <p className="text-sm text-gray-400">
              {timeSignature[0]}/{timeSignature[1]} • {currentBPM} BPM
            </p>
          </div>
        </div>
        
        <Button
          onClick={isPlaying ? stop : start}
          variant={isPlaying ? 'destructive' : 'default'}
          size="lg"
          className="bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:from-[#0891b2] hover:to-[#06b6d4]"
        >
          {isPlaying ? (
            <>
              <Pause className="w-5 h-5 mr-2" />
              Parar
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Iniciar
            </>
          )}
        </Button>
      </div>

      {/* Visual Pulse Indicator */}
      <div className="mb-6">
        <div className="relative h-32 bg-white/5 rounded-2xl overflow-hidden flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isPlaying && (
              <motion.div
                key={currentBeat}
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ 
                  scale: currentBeat === 0 ? 1.2 : 1,
                  opacity: 1,
                }}
                exit={{ scale: 0.8, opacity: 0.5 }}
                transition={{ duration: 0.1 }}
                className={`w-24 h-24 rounded-full ${
                  currentBeat === 0 
                    ? 'bg-gradient-to-br from-[#06b6d4] to-[#0891b2]' 
                    : 'bg-gradient-to-br from-gray-600 to-gray-700'
                } flex items-center justify-center shadow-lg`}
              >
                <span className="text-3xl font-bold text-white">
                  {currentBeat + 1}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {!isPlaying && (
            <div className="text-gray-500 text-center">
              <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Clique em "Iniciar"</p>
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        {isPlaying && (
          <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#06b6d4] to-[#0891b2]"
              style={{ width: `${beatProgress}%` }}
              transition={{ duration: 0.1, ease: 'linear' }}
            />
          </div>
        )}
      </div>

      {/* Beat Indicators */}
      <div className="mb-6">
        <div className="flex gap-2 justify-center">
          {Array.from({ length: beatsPerMeasure }).map((_, index) => (
            <div
              key={index}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                index === currentBeat && isPlaying
                  ? 'bg-gradient-to-br from-[#06b6d4] to-[#0891b2] scale-110 shadow-lg'
                  : 'bg-white/10'
              }`}
            >
              <span className={`text-lg font-bold ${
                index === currentBeat && isPlaying ? 'text-white' : 'text-gray-400'
              }`}>
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* BPM Control */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">BPM</label>
            <span className="text-sm font-bold text-white">{currentBPM}</span>
          </div>
          <Slider
            value={[currentBPM]}
            onValueChange={handleBPMChange}
            min={40}
            max={200}
            step={1}
            className="w-full"
          />
        </div>

        {/* Volume Control */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Volume
            </label>
            <span className="text-sm font-bold text-white">{Math.round(volume * 100)}%</span>
          </div>
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            min={0}
            max={1}
            step={0.01}
            className="w-full"
          />
        </div>
      </div>
    </Card>
  );
}
