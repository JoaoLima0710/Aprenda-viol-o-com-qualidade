import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Type,
  ZoomIn,
  ZoomOut,
  Palette,
  Eye,
  EyeOff
} from 'lucide-react';

export interface TypographySettings {
  fontSize: 'small' | 'medium' | 'large';
  showChords: boolean;
  chordPosition: 'above' | 'inline';
  lineHeight: 'compact' | 'comfortable' | 'spacious';
  chordSpacing: 'tight' | 'normal' | 'loose';
  fontFamily: 'mono' | 'sans' | 'serif';
}

interface ChordTypographyProps {
  children: React.ReactNode;
  settings?: Partial<TypographySettings>;
  onSettingsChange?: (settings: TypographySettings) => void;
  className?: string;
}

export function ChordTypography({
  children,
  settings: userSettings = {},
  onSettingsChange,
  className = ''
}: ChordTypographyProps) {
  const [settings, setSettings] = useState<TypographySettings>({
    fontSize: 'medium',
    showChords: true,
    chordPosition: 'above',
    lineHeight: 'comfortable',
    chordSpacing: 'normal',
    fontFamily: 'mono',
    ...userSettings
  });

  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    onSettingsChange?.(settings);
  }, [settings, onSettingsChange]);

  const updateSetting = <K extends keyof TypographySettings>(
    key: K,
    value: TypographySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const cycleFontSize = () => {
    const sizes: Array<TypographySettings['fontSize']> = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(settings.fontSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    updateSetting('fontSize', sizes[nextIndex]);
  };

  const cycleLineHeight = () => {
    const heights: Array<TypographySettings['lineHeight']> = ['compact', 'comfortable', 'spacious'];
    const currentIndex = heights.indexOf(settings.lineHeight);
    const nextIndex = (currentIndex + 1) % heights.length;
    updateSetting('lineHeight', heights[nextIndex]);
  };

  const getContainerClasses = () => {
    const classes = ['relative'];

    // Font size
    switch (settings.fontSize) {
      case 'small':
        classes.push('text-sm');
        break;
      case 'large':
        classes.push('text-lg');
        break;
      default:
        classes.push('text-base');
    }

    // Line height
    switch (settings.lineHeight) {
      case 'compact':
        classes.push('leading-tight');
        break;
      case 'spacious':
        classes.push('leading-loose');
        break;
      default:
        classes.push('leading-relaxed');
    }

    // Font family
    switch (settings.fontFamily) {
      case 'sans':
        classes.push('font-sans');
        break;
      case 'serif':
        classes.push('font-serif');
        break;
      default:
        classes.push('font-mono');
    }

    if (className) classes.push(className);

    return classes.join(' ');
  };

  const getChordClasses = () => {
    const classes = ['font-bold', 'text-purple-400'];

    // Chord spacing
    switch (settings.chordSpacing) {
      case 'tight':
        classes.push('mr-1');
        break;
      case 'loose':
        classes.push('mr-4');
        break;
      default:
        classes.push('mr-2');
    }

    return classes.join(' ');
  };

  const getLyricsClasses = () => {
    const classes = ['text-white'];

    if (settings.fontFamily === 'mono') {
      classes.push('font-mono');
    }

    return classes.join(' ');
  };

  return (
    <div className={getContainerClasses()}>
      {/* Floating Controls */}
      <div className="fixed top-4 right-4 z-20 flex flex-col gap-2">
        {/* Typography Controls Toggle */}
        <Button
          onClick={() => setShowControls(!showControls)}
          variant="outline"
          size="sm"
          className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20"
        >
          <Type className="w-4 h-4" />
        </Button>

        {/* Quick Controls */}
        <div className="flex flex-col gap-1">
          <Button
            onClick={() => updateSetting('showChords', !settings.showChords)}
            variant="outline"
            size="sm"
            className={`bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 ${
              !settings.showChords ? 'opacity-50' : ''
            }`}
          >
            {settings.showChords ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>

          <Button
            onClick={cycleFontSize}
            variant="outline"
            size="sm"
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20"
          >
            <Type className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Expanded Controls Panel */}
      {showControls && (
        <div className="fixed top-16 right-4 z-20 bg-[#0f0f1a]/95 backdrop-blur-md border border-white/20 rounded-lg p-4 min-w-[250px] shadow-xl">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Type className="w-4 h-4" />
            Tipografia
          </h3>

          <div className="space-y-3">
            {/* Font Size */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">Tamanho da Fonte</label>
              <div className="flex gap-1">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <Button
                    key={size}
                    onClick={() => updateSetting('fontSize', size)}
                    variant={settings.fontSize === size ? "default" : "outline"}
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    {size === 'small' ? 'P' : size === 'medium' ? 'M' : 'G'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Line Height */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">Espaçamento</label>
              <div className="flex gap-1">
                {(['compact', 'comfortable', 'spacious'] as const).map((height) => (
                  <Button
                    key={height}
                    onClick={() => updateSetting('lineHeight', height)}
                    variant={settings.lineHeight === height ? "default" : "outline"}
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    {height === 'compact' ? 'Ajustado' : height === 'comfortable' ? 'Confortável' : 'Espaçoso'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Font Family */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">Fonte</label>
              <div className="flex gap-1">
                {([
                  { key: 'mono' as const, label: 'Mono' },
                  { key: 'sans' as const, label: 'Sans' },
                  { key: 'serif' as const, label: 'Serif' }
                ]).map(({ key, label }) => (
                  <Button
                    key={key}
                    onClick={() => updateSetting('fontFamily', key)}
                    variant={settings.fontFamily === key ? "default" : "outline"}
                    size="sm"
                    className="flex-1 text-xs"
                    style={{
                      fontFamily: key === 'mono' ? 'monospace' :
                                 key === 'serif' ? 'serif' : 'sans-serif'
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Show Chords */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">Mostrar Acordes</label>
              <Button
                onClick={() => updateSetting('showChords', !settings.showChords)}
                variant={settings.showChords ? "default" : "outline"}
                size="sm"
              >
                {settings.showChords ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            </div>

            {/* Chord Position */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">Posição dos Acordes</label>
              <div className="flex gap-1">
                {(['above', 'inline'] as const).map((position) => (
                  <Button
                    key={position}
                    onClick={() => updateSetting('chordPosition', position)}
                    variant={settings.chordPosition === position ? "default" : "outline"}
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    {position === 'above' ? 'Acima' : 'Inline'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Chord Spacing */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">Espaçamento dos Acordes</label>
              <div className="flex gap-1">
                {(['tight', 'normal', 'loose'] as const).map((spacing) => (
                  <Button
                    key={spacing}
                    onClick={() => updateSetting('chordSpacing', spacing)}
                    variant={settings.chordSpacing === spacing ? "default" : "outline"}
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    {spacing === 'tight' ? 'Ajustado' : spacing === 'normal' ? 'Normal' : 'Solto'}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Current Settings Summary */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">
                {settings.fontSize}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {settings.lineHeight}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {settings.fontFamily}
              </Badge>
              {settings.showChords && (
                <Badge variant="outline" className="text-xs">
                  acordes
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content with Typography Styles */}
      <div
        className={`transition-all duration-200 ${
          settings.chordPosition === 'above' ? 'chord-layout-above' : 'chord-layout-inline'
        }`}
        style={{
          '--chord-spacing': settings.chordSpacing === 'tight' ? '0.25rem' :
                           settings.chordSpacing === 'loose' ? '1rem' : '0.5rem'
        } as React.CSSProperties}
      >
        {children}
      </div>

      {/* CSS for chord positioning */}
      <style>{`
        .chord-layout-above {
          line-height: ${settings.lineHeight === 'compact' ? '1.2' :
                        settings.lineHeight === 'spacious' ? '2.0' : '1.6'};
        }

        .chord-layout-inline {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: var(--chord-spacing);
        }
      `}</style>
    </div>
  );
}

// Hook para gerenciar configurações de tipografia
export function useChordTypography(initialSettings?: Partial<TypographySettings>) {
  const [settings, setSettings] = useState<TypographySettings>({
    fontSize: 'medium',
    showChords: true,
    chordPosition: 'above',
    lineHeight: 'comfortable',
    chordSpacing: 'normal',
    fontFamily: 'mono',
    ...initialSettings
  });

  const updateSettings = (newSettings: Partial<TypographySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetToDefaults = () => {
    setSettings({
      fontSize: 'medium',
      showChords: true,
      chordPosition: 'above',
      lineHeight: 'comfortable',
      chordSpacing: 'normal',
      fontFamily: 'mono'
    });
  };

  return {
    settings,
    updateSettings,
    resetToDefaults
  };
}