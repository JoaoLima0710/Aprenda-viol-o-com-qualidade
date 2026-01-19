/**
 * 🎸 Scale Improvisation Component
 * 
 * Baseado em r/guitarlessons: "Aplicação musical - improvisação sobre backing track"
 * Aplicar sons da escala em contexto musical real
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Music, Radio } from 'lucide-react';
import { unifiedAudioService } from '@/services/UnifiedAudioService';

interface ScaleImprovisationProps {
  scaleName: string;
  root: string;
  intervals: number[];
}

const BACKING_TRACKS = [
  { id: 'major', name: 'Backing Track Maior', chords: ['C', 'F', 'G', 'Am'], description: 'Progressão I-IV-V-vi' },
  { id: 'minor', name: 'Backing Track Menor', chords: ['Am', 'Dm', 'Em', 'F'], description: 'Progressão i-iv-v-VI' },
  { id: 'blues', name: 'Backing Track Blues', chords: ['A7', 'D7', 'E7'], description: 'Progressão blues clássica' },
];

export function ScaleImprovisation({ scaleName, root, intervals }: ScaleImprovisationProps) {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playBackingTrack = async (trackId: string) => {
    setIsPlaying(true);
    setSelectedTrack(trackId);
    
    try {
      await unifiedAudioService.initialize();
      const track = BACKING_TRACKS.find(t => t.id === trackId);
      
      if (track) {
        // Tocar progressão de acordes
        for (const chord of track.chords) {
          await unifiedAudioService.playChord(chord, 1.0);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } catch (error) {
      console.error('Erro ao tocar backing track:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1a1a2e]/80 to-[#2a2a3e]/60 border border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <Radio className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">🎸 Improvisação</h3>
            <p className="text-sm text-gray-400">Aplicar a escala em contexto musical</p>
          </div>
        </div>

        <p className="text-gray-300 mb-6 leading-relaxed">
          <strong className="text-orange-400">Aplicação musical real!</strong> Improvisar sobre uma 
          progressão de acordes é onde a teoria encontra a prática. Use as notas da escala para criar 
          frases melódicas.
        </p>

        <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-400/30">
          <h4 className="text-sm font-bold text-orange-400 mb-2">🎯 Objetivo:</h4>
          <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
            <li>Explore as notas da escala {scaleName}</li>
            <li>Crie frases que começam e terminam na tônica ({root})</li>
            <li>Experimente diferentes ritmos e padrões</li>
            <li>Use as setas do diagrama como guia</li>
          </ul>
        </div>

        {/* Backing Tracks */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-white">Backing Tracks Disponíveis:</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BACKING_TRACKS.map((track) => (
              <div
                key={track.id}
                className={`
                  p-4 rounded-xl border-2 transition-all
                  ${selectedTrack === track.id
                    ? 'bg-gradient-to-br from-orange-500/30 to-amber-500/30 border-orange-400'
                    : 'bg-white/5 border-white/10 hover:border-orange-400/50'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-bold text-white">{track.name}</h5>
                  <Music className="w-5 h-5 text-orange-400" />
                </div>
                
                <p className="text-xs text-gray-400 mb-3">{track.description}</p>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-gray-500">Acordes:</span>
                  <div className="flex gap-1">
                    {track.chords.map((chord, i) => (
                      <span key={i} className="text-xs bg-white/10 px-2 py-1 rounded text-white">
                        {chord}
                      </span>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => playBackingTrack(track.id)}
                  disabled={isPlaying}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500"
                  size="sm"
                >
                  {isPlaying && selectedTrack === track.id ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Tocando...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Tocar
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-orange-500/10 border border-orange-400/30">
          <p className="text-sm text-orange-300">
            <strong>💡 Dica:</strong> Comece tocando apenas a tônica em diferentes ritmos. Depois, 
            adicione outras notas da escala. Lembre-se: menos é mais! Frases simples e bem executadas 
            soam melhor que muitas notas rápidas.
          </p>
        </div>
      </div>
    </div>
  );
}
