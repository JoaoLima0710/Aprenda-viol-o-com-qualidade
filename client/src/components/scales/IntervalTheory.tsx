/**
 * 🎼 Interval Theory Component
 * 
 * Baseado em r/guitarlessons: "Intervalos antes de padrões"
 * Ensina intervalos como fundamento antes de escalas
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Volume2, Music } from 'lucide-react';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { motion } from 'framer-motion';

interface Interval {
  name: string;
  semitones: number;
  description: string;
  sound: string;
  color: string;
}

const INTERVALS: Interval[] = [
  { name: 'Uníssono', semitones: 0, description: 'Mesma nota', sound: 'neutro', color: '#06b6d4' },
  { name: '2ª Menor', semitones: 1, description: 'Meio tom', sound: 'tenso', color: '#a855f7' },
  { name: '2ª Maior', semitones: 2, description: 'Tom inteiro', sound: 'suave', color: '#f472b6' },
  { name: '3ª Menor', semitones: 3, description: 'Tom e meio', sound: 'triste', color: '#fb923c' },
  { name: '3ª Maior', semitones: 4, description: 'Dois tons', sound: 'alegre', color: '#fbbf24' },
  { name: '4ª Justa', semitones: 5, description: 'Dois tons e meio', sound: 'estável', color: '#4ade80' },
  { name: '4ª Aumentada/5ª Diminuta', semitones: 6, description: 'Três tons (tritono)', sound: 'instável', color: '#ef4444' },
  { name: '5ª Justa', semitones: 7, description: 'Três tons e meio', sound: 'poderoso', color: '#22d3ee' },
  { name: '6ª Menor', semitones: 8, description: 'Quatro tons', sound: 'melancólico', color: '#a78bfa' },
  { name: '6ª Maior', semitones: 9, description: 'Quatro tons e meio', sound: 'doce', color: '#f472b6' },
  { name: '7ª Menor', semitones: 10, description: 'Cinco tons', sound: 'jazzy', color: '#fb923c' },
  { name: '7ª Maior', semitones: 11, description: 'Cinco tons e meio', sound: 'tenso', color: '#fbbf24' },
  { name: '8ª (Oitava)', semitones: 12, description: 'Seis tons', sound: 'resolvido', color: '#10b981' },
];

interface IntervalTheoryProps {
  rootNote?: string;
}

export function IntervalTheory({ rootNote = 'C' }: IntervalTheoryProps) {
  const [selectedInterval, setSelectedInterval] = useState<Interval | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playInterval = async (interval: Interval) => {
    setIsPlaying(true);
    setSelectedInterval(interval);
    
    try {
      await unifiedAudioService.initialize();
      
      // Tocar nota raiz
      await unifiedAudioService.playNote(`${rootNote}4`, 0.5);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Tocar nota do intervalo
      const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const rootIndex = NOTES.indexOf(rootNote);
      const targetIndex = (rootIndex + interval.semitones) % 12;
      const targetNote = NOTES[targetIndex];
      
      await unifiedAudioService.playNote(`${targetNote}4`, 0.5);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Tocar ambas juntas
      await unifiedAudioService.playNote(`${rootNote}4`, 0.5);
      await unifiedAudioService.playNote(`${targetNote}4`, 0.5);
      
    } catch (error) {
      console.error('Erro ao tocar intervalo:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1a1a2e]/80 to-[#2a2a3e]/60 border border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">🎵 Teoria de Intervalos</h3>
            <p className="text-sm text-gray-400">Fundação antes de escalas</p>
          </div>
        </div>
        
        <p className="text-gray-300 mb-6 leading-relaxed">
          <strong className="text-purple-400">Por que aprender intervalos primeiro?</strong> Intervalos são as 
          "letras" da música. Entender como cada distância soa ajuda você a reconhecer escalas auditivamente 
          e construir frases melódicas conscientemente.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {INTERVALS.map((interval) => (
            <motion.button
              key={interval.name}
              onClick={() => playInterval(interval)}
              disabled={isPlaying}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                p-4 rounded-xl border-2 text-left transition-all
                ${selectedInterval?.name === interval.name
                  ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-purple-400'
                  : 'bg-white/5 border-white/10 hover:border-purple-400/50'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span 
                  className="text-lg font-bold text-white"
                  style={{ color: interval.color }}
                >
                  {interval.name}
                </span>
                <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded">
                  {interval.semitones} semitons
                </span>
              </div>
              
              <p className="text-sm text-gray-400 mb-1">{interval.description}</p>
              <p className="text-xs text-gray-500">Som: {interval.sound}</p>
              
              {selectedInterval?.name === interval.name && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex items-center gap-2 text-purple-400"
                >
                  <Volume2 className="w-4 h-4" />
                  <span className="text-xs font-semibold">Tocando...</span>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-400/30">
          <p className="text-sm text-blue-300">
            <strong>💡 Dica:</strong> Clique em cada intervalo para ouvir como soa. Tente cantar junto 
            para internalizar o som de cada distância!
          </p>
        </div>
      </div>
    </div>
  );
}
