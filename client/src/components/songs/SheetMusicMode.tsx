import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';

interface SheetMusicModeProps {
  chordSheet: string;
  title: string;
  artist: string;
  onClose?: () => void;
}

interface ChordLine {
  text: string;
  chords: Array<{ chord: string; position: number }>;
}

export function SheetMusicMode({ chordSheet, title, artist, onClose }: SheetMusicModeProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Parse chord sheet
  const parseChordSheet = (sheet: string): ChordLine[] => {
    const lines = sheet.split('\n').filter(line => line.trim());
    return lines.map((line) => {
      const chordRegex = /\[([^\]]+)\]/g;
      const chords: Array<{ chord: string; position: number }> = [];
      let match;
      
      while ((match = chordRegex.exec(line)) !== null) {
        chords.push({
          chord: match[1],
          position: match.index,
        });
      }
      
      const text = line.replace(/\[([^\]]+)\]/g, '').trim() || line;
      
      return { text, chords };
    });
  };
  
  const lines = parseChordSheet(chordSheet);
  
  const handleFullscreen = () => {
    if (!isFullscreen && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  return (
    <div
      ref={containerRef}
      className={`bg-white text-gray-900 ${
        isFullscreen ? 'fixed inset-0 z-50' : 'rounded-2xl border-2 border-gray-300'
      }`}
    >
      {/* Header Controls */}
      <div className="sticky top-0 z-10 bg-white border-b-2 border-gray-300 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600">{artist}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Font Size Control */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700"
              >
                A-
              </Button>
              <span className="text-sm text-gray-600 min-w-[3rem] text-center">{fontSize}px</span>
              <Button
                onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700"
              >
                A+
              </Button>
            </div>
            
            <Button
              onClick={handleFullscreen}
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            
            {onClose && (
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700"
              >
                Fechar
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Sheet Music Content */}
      <div 
        className="overflow-y-auto p-8"
        style={{ 
          maxHeight: isFullscreen ? 'calc(100vh - 120px)' : '600px',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {lines.map((line, index) => (
            <div
              key={index}
              className="relative py-3 border-b border-gray-200"
              style={{ fontSize: `${fontSize}px` }}
            >
              {/* Chords - Above text */}
              {line.chords.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2" style={{ minHeight: `${fontSize * 1.2}px` }}>
                  {line.chords.map((chord, chordIndex) => {
                    // Calculate position
                    const charWidth = fontSize * 0.6; // Approximate character width
                    const leftPosition = chord.position * charWidth;
                    
                    return (
                      <span
                        key={chordIndex}
                        className="absolute font-mono font-bold text-blue-700"
                        style={{
                          left: `${leftPosition}px`,
                          top: '0',
                          fontSize: `${fontSize * 0.85}px`,
                        }}
                      >
                        {chord.chord}
                      </span>
                    );
                  })}
                </div>
              )}
              
              {/* Text */}
              <div
                className="leading-relaxed text-gray-900"
                style={{ 
                  fontSize: `${fontSize}px`,
                  lineHeight: '1.8',
                  marginTop: line.chords.length > 0 ? `${fontSize * 1.2}px` : '0',
                }}
              >
                {line.text}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-300 p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Modo Partitura • Alto Contraste</span>
          <span>{lines.length} linhas</span>
        </div>
      </div>
    </div>
  );
}
