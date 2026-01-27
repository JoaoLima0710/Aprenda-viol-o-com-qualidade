import React, { useState } from 'react';
import { useAudio } from '../../hooks/useAudio';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { Volume2, Loader2 } from 'lucide-react';

interface ScalePlayButtonProps {
  scaleName: string;
  root: string;
  intervals: number[];
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function AudioPlayScaleButton({
  scaleName,
  root,
  intervals,
  size = 'md',
  showLabel = true,
  className = ''
}: ScalePlayButtonProps) {
  const { isReady, initialize } = useAudio();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    // Mark interaction immediately - ALWAYS
    await unifiedAudioService.markUserInteraction();

    if (!isReady) {
      setIsLoading(true);
      await initialize();
      setIsLoading(false);
    }

    try {
      setIsPlaying(true);
      await unifiedAudioService.ensureInitialized();
      await unifiedAudioService.playScale(scaleName, root, intervals, 0.5);

      // Reset after scale finishes (approximate duration)
      const duration = (intervals.length + 1) * 500; // 500ms per note
      setTimeout(() => {
        setIsPlaying(false);
      }, duration);
    } catch (error) {
      console.error('Error playing scale:', error);
      setIsPlaying(false);
    }
  };

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || isPlaying}
      className={`
        ${sizeClasses[size]}
        rounded-full transition-all
        ${isPlaying
          ? 'bg-primary text-white scale-110'
          : 'bg-muted hover:bg-muted/80'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      title={`Tocar escala ${scaleName}`}
    >
      {isLoading ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : isPlaying ? (
        <Volume2 className={`${iconSizes[size]} animate-pulse`} />
      ) : (
        <Volume2 className={iconSizes[size]} />
      )}
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {isPlaying ? 'Tocando...' : 'Ouvir Escala'}
        </span>
      )}
    </button>
  );
}

export default AudioPlayScaleButton;
