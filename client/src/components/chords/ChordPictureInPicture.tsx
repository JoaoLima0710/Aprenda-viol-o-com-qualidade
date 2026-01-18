import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Eye, EyeOff, Move, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChordDiagram } from './ChordDiagram';

export interface ChordSequence {
  chords: Array<{
    name: string;
    position: number; // posição na sequência (0-based)
    duration?: number; // duração em batidas
    isCurrent?: boolean;
    accuracy?: number; // 0-1, precisão do usuário
  }>;
  currentPosition: number;
  nextChord?: {
    name: string;
    timeToNext: number; // segundos até o próximo acorde
  };
}

interface ChordPictureInPictureProps {
  chordSequence: ChordSequence;
  isVisible: boolean;
  onToggleVisibility: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'floating';
  size?: 'small' | 'medium' | 'large';
  showNextChord?: boolean;
  enableDrag?: boolean;
  onChordError?: (chordName: string) => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
}

export function ChordPictureInPicture({
  chordSequence,
  isVisible,
  onToggleVisibility,
  position = 'bottom-right',
  size = 'medium',
  showNextChord = true,
  enableDrag = true,
  onChordError,
  onPositionChange
}: ChordPictureInPictureProps) {
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showErrorAnimation, setShowErrorAnimation] = useState(false);
  const pipRef = useRef<HTMLDivElement>(null);

  // Calcular posição baseada no prop position
  useEffect(() => {
    if (!enableDrag) {
      const positions = {
        'bottom-right': { x: window.innerWidth - 200, y: window.innerHeight - 200 },
        'bottom-left': { x: 20, y: window.innerHeight - 200 },
        'top-right': { x: window.innerWidth - 200, y: 20 },
        'top-left': { x: 20, y: 20 },
        'floating': { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 100 }
      };
      setCurrentPos(positions[position]);
    }
  }, [position, enableDrag]);

  // Detectar erro no acorde atual
  useEffect(() => {
    const currentChord = chordSequence.chords.find(c => c.isCurrent);
    if (currentChord && currentChord.accuracy !== undefined && currentChord.accuracy < 0.6) {
      setShowErrorAnimation(true);
      onChordError?.(currentChord.name);

      // Resetar animação após 2 segundos
      setTimeout(() => setShowErrorAnimation(false), 2000);
    }
  }, [chordSequence.chords, onChordError]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enableDrag) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - currentPos.x,
      y: e.clientY - currentPos.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !enableDrag) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Limitar aos bounds da tela
    const boundedX = Math.max(0, Math.min(window.innerWidth - 180, newX));
    const boundedY = Math.max(0, Math.min(window.innerHeight - 180, newY));

    const newPos = { x: boundedX, y: boundedY };
    setCurrentPos(newPos);
    onPositionChange?.(newPos);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const getSizeStyles = () => {
    const sizes = {
      small: { width: 120, height: 120, scale: 0.6 },
      medium: { width: 160, height: 160, scale: 0.8 },
      large: { width: 200, height: 200, scale: 1.0 }
    };
    return sizes[size];
  };

  const sizeStyles = getSizeStyles();
  const currentChord = chordSequence.chords.find(c => c.isCurrent);
  const upcomingChords = chordSequence.chords.slice(
    chordSequence.currentPosition + 1,
    chordSequence.currentPosition + 3
  );

  if (!isVisible) {
    return (
      <Button
        onClick={onToggleVisibility}
        className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 bg-adaptive-accent hover:bg-adaptive-accent/80 shadow-lg"
        size="sm"
      >
        <Eye className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <>
      {/* Overlay semi-transparente quando arrastando */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* PiP Container */}
      <motion.div
        ref={pipRef}
        className={`fixed z-50 ${enableDrag ? 'cursor-move' : ''}`}
        style={{
          left: currentPos.x,
          top: currentPos.y,
          width: sizeStyles.width,
          height: sizeStyles.height
        }}
        animate={{
          scale: showErrorAnimation ? [1, 1.1, 1] : 1,
          rotate: showErrorAnimation ? [0, -2, 2, 0] : 0
        }}
        transition={{
          duration: 0.3,
          repeat: showErrorAnimation ? 3 : 0
        }}
      >
        <Card className={`w-full h-full bg-adaptive-surface/95 backdrop-blur-md border-2 ${
          showErrorAnimation
            ? 'border-red-500 shadow-lg shadow-red-500/50'
            : 'border-adaptive-border shadow-lg'
        }`}>
          {/* Header */}
          <div
            className="flex items-center justify-between p-2 border-b border-adaptive-border"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-1">
              {enableDrag && <Move className="w-3 h-3 text-adaptive-textSecondary" />}
              <Badge variant="outline" className="text-xs px-1 py-0">
                PiP
              </Badge>
            </div>
            <Button
              onClick={onToggleVisibility}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-adaptive-surface"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          {/* Current Chord */}
          <div className="flex-1 p-2 flex flex-col items-center justify-center">
            {currentChord ? (
              <div className="text-center">
                <div className="text-sm font-bold text-adaptive-text mb-1">
                  {currentChord.name}
                </div>
                <div
                  className={`transform transition-transform`}
                  style={{ transform: `scale(${sizeStyles.scale})` }}
                >
                  <ChordDiagram
                    frets={[0, 0, 0, 0, 0, 0]} // Placeholder - seria carregado dinamicamente
                    fingers={[0, 0, 0, 0, 0, 0]}
                    name={currentChord.name}
                    size="sm"
                  />
                </div>

                {/* Indicador de precisão */}
                {currentChord.accuracy !== undefined && (
                  <div className="mt-2">
                    <div className="w-full h-1 bg-adaptive-surface rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          currentChord.accuracy > 0.8 ? 'bg-green-500' :
                          currentChord.accuracy > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${currentChord.accuracy * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-adaptive-textSecondary text-sm">
                Aguardando...
              </div>
            )}
          </div>

          {/* Next Chord Preview */}
          {showNextChord && upcomingChords.length > 0 && (
            <div className="border-t border-adaptive-border p-2">
              <div className="flex items-center justify-center gap-1">
                <span className="text-xs text-adaptive-textSecondary">Próximo:</span>
                {upcomingChords.slice(0, 2).map((chord, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className={`text-xs ${
                      index === 0 ? 'border-adaptive-accent text-adaptive-accent' :
                      'border-adaptive-textSecondary text-adaptive-textSecondary'
                    }`}
                  >
                    {chord.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Toggle Button */}
      <Button
        onClick={onToggleVisibility}
        className="fixed bottom-4 right-4 z-40 rounded-full w-12 h-12 bg-adaptive-surface hover:bg-adaptive-surface/80 shadow-lg border border-adaptive-border"
        size="sm"
      >
        <EyeOff className="w-5 h-5" />
      </Button>
    </>
  );
}
