import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  RotateCcw,
  Zap,
  Settings,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGestureNavigation } from '@/hooks/useGestureNavigation';
import { hapticRhythmService } from '@/services/HapticRhythmService';

export interface PlaybackControls {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  speed: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onSpeedChange: (speed: number) => void;
  onRestart: () => void;
}

export interface NavigationState {
  showControls: boolean;
  showSettings: boolean;
  gestureMode: boolean;
  hapticEnabled: boolean;
  autoHide: boolean;
}

interface GestureBottomNavigationProps {
  controls: PlaybackControls;
  navigationState: NavigationState;
  onNavigationStateChange: (state: Partial<NavigationState>) => void;
  onFullscreenToggle?: () => void;
  onPictureInPictureToggle?: () => void;
  compact?: boolean;
  className?: string;
}

export function GestureBottomNavigation({
  controls,
  navigationState,
  onNavigationStateChange,
  onFullscreenToggle,
  onPictureInPictureToggle,
  compact = false,
  className = ''
}: GestureBottomNavigationProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [showSpeedControl, setShowSpeedControl] = useState(false);
  const [lastGesture, setLastGesture] = useState<string | null>(null);

  // Gesture navigation
  const { getDefaultNavigationHandlers } = useGestureNavigation(
    {
      onSwipeLeft: () => {
        controls.onSeek(Math.min(controls.duration, controls.currentTime + 10));
        setLastGesture('seek-forward');
        hapticRhythmService.singleVibration(50, 'subtle');
      },
      onSwipeRight: () => {
        controls.onSeek(Math.max(0, controls.currentTime - 10));
        setLastGesture('seek-back');
        hapticRhythmService.singleVibration(50, 'subtle');
      },
      onSwipeUp: () => {
        onNavigationStateChange({ showControls: !navigationState.showControls });
        setLastGesture('toggle-controls');
        hapticRhythmService.singleVibration(30, 'normal');
      },
      onSwipeDown: () => {
        controls.onPlayPause();
        setLastGesture('play-pause');
        hapticRhythmService.singleVibration(70, 'normal');
      },
      onDoubleTap: () => {
        onFullscreenToggle?.();
        setLastGesture('fullscreen');
        hapticRhythmService.vibrationSequence([50, 50]);
      },
      onPinch: (scale) => {
        if (scale > 1.2) {
          controls.onVolumeChange(Math.min(1, controls.volume + 0.1));
          setLastGesture('volume-up');
        } else if (scale < 0.8) {
          controls.onVolumeChange(Math.max(0, controls.volume - 0.1));
          setLastGesture('volume-down');
        }
        hapticRhythmService.singleVibration(30, 'subtle');
      }
    },
    {
      enabled: navigationState.gestureMode,
      threshold: 50,
      velocity: 0.3,
      hapticFeedback: navigationState.hapticEnabled
    }
  );

  // Auto-hide controls
  useEffect(() => {
    if (!navigationState.autoHide) return;

    let hideTimeout: NodeJS.Timeout;

    const resetHideTimer = () => {
      clearTimeout(hideTimeout);
      onNavigationStateChange({ showControls: true });

      hideTimeout = setTimeout(() => {
        if (!isDragging) {
          onNavigationStateChange({ showControls: false });
        }
      }, 3000);
    };

    // Reset timer on any interaction
    const handleInteraction = () => resetHideTimer();
    document.addEventListener('touchstart', handleInteraction);
    document.addEventListener('click', handleInteraction);

    resetHideTimer();

    return () => {
      clearTimeout(hideTimeout);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
    };
  }, [navigationState.autoHide, isDragging, onNavigationStateChange]);

  // Seek bar drag handling
  const handleSeekStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStart(clientX);
  };

  const handleSeekMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;

    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const seekBar = e.currentTarget as HTMLElement;
    const rect = seekBar.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = percentage * controls.duration;

    controls.onSeek(newTime);
  };

  const handleSeekEnd = () => {
    setIsDragging(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGestureIndicator = () => {
    if (!lastGesture) return null;

    const indicators = {
      'seek-forward': { icon: <SkipForward className="w-4 h-4" />, text: 'Avançar 10s' },
      'seek-back': { icon: <SkipBack className="w-4 h-4" />, text: 'Voltar 10s' },
      'toggle-controls': { icon: <Eye className="w-4 h-4" />, text: 'Controles' },
      'play-pause': { icon: controls.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />, text: 'Play/Pause' },
      'fullscreen': { icon: <Maximize2 className="w-4 h-4" />, text: 'Tela Cheia' },
      'volume-up': { icon: <Volume2 className="w-4 h-4" />, text: 'Volume +' },
      'volume-down': { icon: <VolumeX className="w-4 h-4" />, text: 'Volume -' }
    };

    const indicator = indicators[lastGesture as keyof typeof indicators];
    if (!indicator) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap"
      >
        <div className="flex items-center gap-2">
          {indicator.icon}
          {indicator.text}
        </div>
      </motion.div>
    );
  };

  if (compact) {
    return (
      <div className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}>
        {/* Compact Controls */}
        <div className="bg-adaptive-surface/95 backdrop-blur-md border-t border-adaptive-border p-3">
          <div className="flex items-center justify-between">
            {/* Time display */}
            <div className="text-sm text-adaptive-textSecondary font-mono">
              {formatTime(controls.currentTime)}
            </div>

            {/* Main controls */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={controls.onRestart}
                className="text-adaptive-text hover:text-adaptive-accent"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={controls.onPlayPause}
                className="text-adaptive-text hover:text-adaptive-accent"
              >
                {controls.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-1">
              {onPictureInPictureToggle && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onPictureInPictureToggle}
                  className="text-adaptive-text hover:text-adaptive-accent"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={() => onNavigationStateChange({ showSettings: !navigationState.showSettings })}
                className="text-adaptive-text hover:text-adaptive-accent"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Gesture indicator */}
        <AnimatePresence>
          {lastGesture && getGestureIndicator()}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}>
      <AnimatePresence>
        {navigationState.showControls && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-adaptive-surface/95 backdrop-blur-md border-t border-adaptive-border"
          >
            {/* Seek Bar */}
            <div className="px-4 py-3">
              <div
                className="relative w-full h-2 bg-adaptive-surface rounded-full cursor-pointer"
                onMouseDown={handleSeekStart}
                onTouchStart={handleSeekStart}
                onMouseMove={handleSeekMove}
                onTouchMove={handleSeekMove}
                onMouseUp={handleSeekEnd}
                onTouchEnd={handleSeekEnd}
              >
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-adaptive-accent to-adaptive-chord rounded-full"
                  style={{ width: `${(controls.currentTime / controls.duration) * 100}%` }}
                />
                <div
                  className="absolute w-4 h-4 bg-adaptive-accent rounded-full border-2 border-adaptive-surface shadow-lg transform -translate-y-1"
                  style={{ left: `${(controls.currentTime / controls.duration) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-2 text-sm text-adaptive-textSecondary">
                <span className="font-mono">{formatTime(controls.currentTime)}</span>
                <span className="font-mono">{formatTime(controls.duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between">
                {/* Left controls */}
                <div className="flex items-center gap-2">
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={controls.onRestart}
                    className="text-adaptive-text hover:text-adaptive-accent"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </Button>

                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => controls.onSeek(Math.max(0, controls.currentTime - 10))}
                    className="text-adaptive-text hover:text-adaptive-accent"
                  >
                    <SkipBack className="w-5 h-5" />
                  </Button>
                </div>

                {/* Play/Pause */}
                <Button
                  size="lg"
                  onClick={controls.onPlayPause}
                  className="bg-adaptive-accent hover:bg-adaptive-accent/80 text-white rounded-full w-14 h-14"
                >
                  {controls.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </Button>

                {/* Right controls */}
                <div className="flex items-center gap-2">
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => controls.onSeek(Math.min(controls.duration, controls.currentTime + 10))}
                    className="text-adaptive-text hover:text-adaptive-accent"
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>

                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => setShowSpeedControl(!showSpeedControl)}
                    className="text-adaptive-text hover:text-adaptive-accent"
                  >
                    <Zap className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Speed Control */}
              <AnimatePresence>
                {showSpeedControl && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 pt-4 border-t border-adaptive-border"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-adaptive-textSecondary">Velocidade:</span>
                      <Slider
                        value={[controls.speed]}
                        onValueChange={([value]) => controls.onSpeedChange(value)}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        className="flex-1"
                      />
                      <span className="text-sm font-bold text-adaptive-text min-w-[3rem]">
                        {controls.speed.toFixed(1)}x
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Secondary Controls */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-adaptive-border">
                <div className="flex items-center gap-4">
                  {/* Volume */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => controls.onVolumeChange(Math.max(0, controls.volume - 0.1))}
                      className="text-adaptive-text hover:text-adaptive-accent"
                    >
                      <VolumeX className="w-4 h-4" />
                    </Button>
                    <div className="w-20">
                      <Slider
                        value={[controls.volume]}
                        onValueChange={([value]) => controls.onVolumeChange(value)}
                        min={0}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => controls.onVolumeChange(Math.min(1, controls.volume + 0.1))}
                      className="text-adaptive-text hover:text-adaptive-accent"
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Quick toggles */}
                  {onPictureInPictureToggle && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onPictureInPictureToggle}
                      className="text-adaptive-text hover:text-adaptive-accent"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}

                  {onFullscreenToggle && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onFullscreenToggle}
                      className="text-adaptive-text hover:text-adaptive-accent"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onNavigationStateChange({ showSettings: !navigationState.showSettings })}
                    className="text-adaptive-text hover:text-adaptive-accent"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Gesture hints */}
              {navigationState.gestureMode && (
                <div className="mt-4 pt-4 border-t border-adaptive-border">
                  <div className="flex flex-wrap gap-2 text-xs text-adaptive-textSecondary">
                    <Badge variant="outline" className="text-xs">
                      👆 Swipe cima: Controles
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      👇 Swipe baixo: Play/Pause
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      👈 Swipe esquerda: Avançar
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      👉 Swipe direita: Voltar
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      👆👆 Double tap: Tela cheia
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed indicator */}
      {!navigationState.showControls && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="bg-adaptive-surface/95 backdrop-blur-md border-t border-adaptive-border p-2"
        >
          <div className="flex items-center justify-center">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onNavigationStateChange({ showControls: true })}
              className="text-adaptive-textSecondary hover:text-adaptive-accent"
            >
              <Eye className="w-4 h-4 mr-2" />
              Mostrar Controles
            </Button>
          </div>
        </motion.div>
      )}

      {/* Gesture indicator */}
      <AnimatePresence>
        {lastGesture && getGestureIndicator()}
      </AnimatePresence>
    </div>
  );
}
