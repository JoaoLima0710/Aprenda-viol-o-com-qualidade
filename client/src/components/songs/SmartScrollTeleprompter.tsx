import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Settings,
  Zap,
  Eye,
  Clock,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MusicStructure {
  sections: Array<{
    id: string;
    name: string; // "Intro", "Verse 1", "Chorus", "Solo", etc.
    type: 'lyrics' | 'tab' | 'chord_progression' | 'solo' | 'bridge' | 'outro';
    startTime: number; // em segundos
    duration: number; // em segundos
    bpm?: number;
    complexity: 'simple' | 'medium' | 'complex';
    requiresFocus: boolean; // se precisa de atenção extra (tabs, solos)
  }>;
  totalDuration: number;
}

export interface SmartScrollConfig {
  speed: number; // pixels por segundo
  focusHeight: number; // altura da zona de foco em pixels
  autoPauseOnComplex: boolean;
  highlightCurrentLine: boolean;
  smoothTransitions: boolean;
  adaptiveSpeed: boolean;
}

interface SmartScrollTeleprompterProps {
  musicStructure: MusicStructure;
  currentTime: number; // tempo atual da música em segundos
  isPlaying: boolean;
  onTimeSeek?: (time: number) => void;
  config?: Partial<SmartScrollConfig>;
  children: React.ReactNode; // conteúdo da música (cifra/tab)
}

export function SmartScrollTeleprompter({
  musicStructure,
  currentTime,
  isPlaying,
  onTimeSeek,
  config: userConfig = {},
  children
}: SmartScrollTeleprompterProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [config, setConfig] = useState<SmartScrollConfig>({
    speed: 30, // pixels/segundo
    focusHeight: 200, // pixels
    autoPauseOnComplex: true,
    highlightCurrentLine: true,
    smoothTransitions: true,
    adaptiveSpeed: true,
    ...userConfig
  });

  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [nextSection, setNextSection] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Encontrar seção atual baseada no tempo
  useEffect(() => {
    const section = musicStructure.sections.find(
      s => currentTime >= s.startTime && currentTime < s.startTime + s.duration
    );

    if (section) {
      setCurrentSection(section.id);

      // Próxima seção
      const currentIndex = musicStructure.sections.indexOf(section);
      const nextSectionData = musicStructure.sections[currentIndex + 1];
      setNextSection(nextSectionData?.id || null);
    }
  }, [currentTime, musicStructure.sections]);

  // Calcular velocidade adaptativa baseada na seção atual
  const getAdaptiveSpeed = useCallback(() => {
    if (!config.adaptiveSpeed) return config.speed;

    const currentSectionData = musicStructure.sections.find(s => s.id === currentSection);
    if (!currentSectionData) return config.speed;

    // Reduzir velocidade para seções complexas
    const complexityMultiplier = {
      simple: 1.0,
      medium: 0.8,
      complex: 0.5
    };

    // Reduzir ainda mais para seções que requerem foco
    const focusMultiplier = currentSectionData.requiresFocus ? 0.7 : 1.0;

    return config.speed * complexityMultiplier[currentSectionData.complexity] * focusMultiplier;
  }, [config, currentSection, musicStructure.sections]);

  // Auto-scroll inteligente
  useEffect(() => {
    if (!isPlaying || !isAutoScrolling || !scrollContainerRef.current) return;

    const speed = getAdaptiveSpeed();
    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const newPosition = container.scrollTop + (speed * 0.1); // Ajuste fino

        // Verificar se chegou ao final
        if (newPosition >= container.scrollHeight - container.clientHeight) {
          setIsAutoScrolling(false);
          return;
        }

        container.scrollTop = newPosition;
        setScrollPosition(newPosition);

        // Centralizar na zona de foco
        maintainFocusZone();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, isAutoScrolling, getAdaptiveSpeed]);

  // Manter zona de foco centralizada
  const maintainFocusZone = useCallback(() => {
    if (!scrollContainerRef.current || !config.highlightCurrentLine) return;

    const container = scrollContainerRef.current;
    const focusCenter = container.clientHeight / 2;
    const focusZone = config.focusHeight / 2;

    // Encontrar linha atual baseada no tempo
    const currentSectionData = musicStructure.sections.find(s => s.id === currentSection);
    if (!currentSectionData) return;

    // Calcular posição aproximada baseada no progresso da seção
    const sectionProgress = (currentTime - currentSectionData.startTime) / currentSectionData.duration;
    const estimatedLinePosition = sectionProgress * container.scrollHeight;

    // Ajustar scroll para manter a linha na zona de foco
    const targetPosition = Math.max(0, estimatedLinePosition - focusCenter + focusZone);
    container.scrollTo({
      top: targetPosition,
      behavior: config.smoothTransitions ? 'smooth' : 'auto'
    });
  }, [currentTime, currentSection, config, musicStructure.sections]);

  // Pausar automaticamente em seções complexas
  useEffect(() => {
    if (!config.autoPauseOnComplex) return;

    const currentSectionData = musicStructure.sections.find(s => s.id === currentSection);
    if (currentSectionData?.requiresFocus && isAutoScrolling) {
      // Pausar por 3 segundos para seções que requerem foco
      setTimeout(() => {
        if (isAutoScrolling) {
          setIsAutoScrolling(false);
        }
      }, 3000);
    }
  }, [currentSection, config.autoPauseOnComplex, isAutoScrolling]);

  const toggleAutoScroll = () => {
    setIsAutoScrolling(!isAutoScrolling);
  };

  const seekToSection = (sectionId: string) => {
    const section = musicStructure.sections.find(s => s.id === sectionId);
    if (section && onTimeSeek) {
      onTimeSeek(section.startTime);
    }
  };

  const adjustSpeed = (delta: number) => {
    setConfig(prev => ({
      ...prev,
      speed: Math.max(10, Math.min(100, prev.speed + delta))
    }));
  };

  // Calcular progresso visual da música
  const totalProgress = (currentTime / musicStructure.totalDuration) * 100;

  return (
    <div className="relative w-full h-full bg-adaptive-background">
      {/* Barra de progresso superior */}
      <div className="sticky top-0 z-10 bg-adaptive-surface/95 backdrop-blur-sm border-b border-adaptive-border p-2">
        <div className="flex items-center gap-2">
          {/* Progresso da música */}
          <div className="flex-1">
            <div className="h-2 bg-adaptive-surface rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-adaptive-accent to-adaptive-chord"
                style={{ width: `${totalProgress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>

          {/* Seção atual */}
          {currentSection && (
            <Badge variant="outline" className="text-xs">
              {musicStructure.sections.find(s => s.id === currentSection)?.name || 'N/A'}
            </Badge>
          )}

          {/* Controles de scroll */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={isAutoScrolling ? "default" : "outline"}
              onClick={toggleAutoScroll}
              disabled={!isPlaying}
              className="h-8 w-8 p-0"
            >
              {isAutoScrolling ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowControls(!showControls)}
              className="h-8 w-8 p-0"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Controles expandidos */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2 pt-2 border-t border-adaptive-border"
            >
              <div className="flex items-center gap-4 text-sm">
                {/* Velocidade */}
                <div className="flex items-center gap-2">
                  <span className="text-adaptive-textSecondary">Velocidade:</span>
                  <Button size="sm" variant="outline" onClick={() => adjustSpeed(-5)}>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                  <span className="text-adaptive-text font-mono w-12 text-center">
                    {config.speed}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => adjustSpeed(5)}>
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                </div>

                {/* Navegação por seções */}
                <div className="flex items-center gap-2">
                  <span className="text-adaptive-textSecondary">Seções:</span>
                  {musicStructure.sections.slice(0, 5).map((section, index) => (
                    <Button
                      key={section.id}
                      size="sm"
                      variant={currentSection === section.id ? "default" : "outline"}
                      onClick={() => seekToSection(section.id)}
                      className="text-xs px-2 py-1 h-6"
                    >
                      {section.name}
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Container de scroll inteligente */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto relative"
        style={{
          scrollBehavior: config.smoothTransitions ? 'smooth' : 'auto'
        }}
      >
        {/* Zona de foco visual */}
        {config.highlightCurrentLine && (
          <div
            className="absolute left-0 right-0 pointer-events-none z-0 opacity-20"
            style={{
              top: `calc(50% - ${config.focusHeight / 2}px)`,
              height: `${config.focusHeight}px`,
              background: `linear-gradient(to bottom,
                transparent 0%,
                var(--adaptive-accent) 20%,
                var(--adaptive-accent) 80%,
                transparent 100%)`
            }}
          />
        )}

        {/* Conteúdo da música */}
        <div ref={contentRef} className="relative z-10 p-4">
          {children}
        </div>

        {/* Indicador de seção próxima */}
        {nextSection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-20 right-4 bg-adaptive-surface border border-adaptive-border rounded-lg p-3 shadow-lg"
          >
            <div className="flex items-center gap-2 text-sm">
              <Eye className="w-4 h-4 text-adaptive-accent" />
              <span className="text-adaptive-text">Próxima:</span>
              <span className="text-adaptive-accent font-medium">
                {musicStructure.sections.find(s => s.id === nextSection)?.name}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Controles inferiores (Bottom Navigation) */}
      <div className="sticky bottom-0 bg-adaptive-surface/95 backdrop-blur-sm border-t border-adaptive-border p-3">
        <div className="flex items-center justify-between">
          {/* Navegação temporal */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const prevSection = musicStructure.sections.find(s => s.id === currentSection);
                if (prevSection) {
                  const prevIndex = musicStructure.sections.indexOf(prevSection) - 1;
                  if (prevIndex >= 0) {
                    seekToSection(musicStructure.sections[prevIndex].id);
                  }
                }
              }}
              disabled={!currentSection}
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (nextSection) {
                  seekToSection(nextSection);
                }
              }}
              disabled={!nextSection}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Status e tempo */}
          <div className="flex items-center gap-2 text-sm text-adaptive-textSecondary">
            <Clock className="w-4 h-4" />
            <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}</span>
            {isAutoScrolling && (
              <Badge variant="outline" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Auto
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
