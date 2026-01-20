/**
 * 🎸 Full Fretboard View Component
 * 
 * Inspirado em https://f2k.mjgibson.com/
 * Mostra TODAS as notas da escala em TODO o braço do violão
 * Com funcionalidade de tocar notas do GuitarSet ao clicar
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, Info, Volume2 } from 'lucide-react';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { toast } from 'sonner';

interface FullFretboardViewProps {
  scaleName: string;
  root: string;
  intervals: number[];
}

const STRINGS = ['E', 'B', 'G', 'D', 'A', 'E']; // Da corda mais aguda (1) para mais grave (6)
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MAX_FRETS = 24; // Mostrar até o traste 24

// Oitavas padrão para cada corda (corda aberta)
// Corda 1 (E agudo): E4, Corda 2 (B): B3, Corda 3 (G): G3, Corda 4 (D): D3, Corda 5 (A): A2, Corda 6 (E grave): E2
const STRING_OCTAVES = [4, 3, 3, 3, 2, 2];

export function FullFretboardView({ scaleName, root, intervals }: FullFretboardViewProps) {
  const [showAllFrets, setShowAllFrets] = useState(false);
  const [highlightRoot, setHighlightRoot] = useState(true);
  const [playingNote, setPlayingNote] = useState<string | null>(null);

  // Gerar todas as notas da escala
  const rootIndex = NOTES.indexOf(root.toUpperCase());
  const scaleNotes: string[] = [];
  intervals.forEach(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    scaleNotes.push(NOTES[noteIndex]);
  });
  scaleNotes.push(root.toUpperCase()); // Adicionar oitava

  // Função para obter a nota em uma posição específica (CORRIGIDA TECNICAMENTE)
  const getNoteAtPosition = (stringIndex: number, fret: number): { note: string; octave: number } => {
    const stringNote = STRINGS[stringIndex];
    const stringRootIndex = NOTES.indexOf(stringNote);
    
    // Calcular índice da nota no cromático (0-11)
    // Cada traste adiciona 1 semitom à nota da corda aberta
    const totalSemitones = stringRootIndex + fret;
    const noteIndex = totalSemitones % 12;
    const note = NOTES[noteIndex];
    
    // Calcular oitava correta
    // A oitava aumenta a cada 12 semitons completos a partir da oitava base da corda
    // Exemplo: E4 (corda 1, traste 0) → E4
    //          E4 (corda 1, traste 12) → E5 (mesma nota, oitava acima)
    //          B3 (corda 2, traste 0) → B3
    //          B3 (corda 2, traste 12) → B4
    const baseOctave = STRING_OCTAVES[stringIndex];
    const octaveOffset = Math.floor(totalSemitones / 12);
    const octave = baseOctave + octaveOffset;
    
    return { note, octave };
  };

  // Verificar se uma nota pertence à escala
  const isScaleNote = (note: string): boolean => {
    return scaleNotes.includes(note);
  };

  // Verificar se é a tônica
  const isRootNote = (note: string): boolean => {
    return note === root.toUpperCase();
  };

  // Tocar nota do GuitarSet com duração otimizada para melhor identificação
  // IMPORTANTE: Para todas as notas anteriores para evitar sobreposição (som de acorde)
  const playNote = async (stringIndex: number, fret: number) => {
    try {
      // CRÍTICO: Parar todas as notas anteriores ANTES de qualquer outra operação
      // Isso garante que apenas uma nota toque por vez, sem sobreposição ou som de acorde
      unifiedAudioService.stopAll();
      
      // Delay aumentado para garantir que TODAS as notas anteriores foram completamente paradas
      // 100ms garante que o AudioContext processe completamente o stop e desconecte todos os nós
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { note, octave } = getNoteAtPosition(stringIndex, fret);
      const noteWithOctave = `${note}${octave}`;
      
      setPlayingNote(`${stringIndex}-${fret}`);
      
      // CRÍTICO para tablets: Inicializar áudio primeiro (precisa de interação do usuário)
      await unifiedAudioService.initialize();
      
      // Delay extra para tablets garantirem AudioContext ativo
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log('🎵 Tocando nota:', noteWithOctave);
      
      // Duração aumentada para 3.0 segundos - permite identificação clara da nota
      await unifiedAudioService.playNote(noteWithOctave, 3.0);
      
      // Timeout ajustado para corresponder à duração do som + margem
      setTimeout(() => setPlayingNote(null), 3300);
    } catch (error) {
      console.error('Erro ao tocar nota:', error);
      toast.error('Erro ao tocar nota');
      setPlayingNote(null);
    }
  };

  const displayFrets = showAllFrets ? MAX_FRETS : 12;

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1a1a2e]/80 to-[#2a2a3e]/60 border border-white/20">
        {/* Header - Layout responsivo */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
              <Maximize2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg lg:text-xl font-bold text-white">🎸 Visualização Completa do Braço</h3>
              <p className="text-xs lg:text-sm text-gray-400">Todas as notas da escala {scaleName} em todo o braço</p>
            </div>
          </div>
          
          <div className="flex gap-2 flex-shrink-0">
            <Button
              onClick={() => setShowAllFrets(!showAllFrets)}
              variant="outline"
              size="sm"
              className="bg-white/5 border-white/10 whitespace-nowrap"
            >
              {showAllFrets ? (
                <>
                  <Minimize2 className="w-4 h-4 mr-2" />
                  12 trastes
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 mr-2" />
                  24 trastes
                </>
              )}
            </Button>
            
            <Button
              onClick={() => setHighlightRoot(!highlightRoot)}
              variant="outline"
              size="sm"
              className={`whitespace-nowrap ${highlightRoot 
                ? 'bg-emerald-500/20 border-emerald-400' 
                : 'bg-white/5 border-white/10'
              }`}
            >
              {highlightRoot ? '⭐ Tônica' : 'Tônica'}
            </Button>
          </div>
        </div>

        <div className="mb-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-400/30">
          <div className="flex items-center gap-4 text-xs text-emerald-200">
            <span><strong className="text-white">Clique</strong> para tocar</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500"></span> Escala</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-600"></span> Fora</span>
            {highlightRoot && <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500"></span> Tônica</span>}
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-700"></span> Solta</span>
          </div>
        </div>

        {/* Fretboard - Inspirado em f2k.mjgibson.com */}
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <div className="bg-gradient-to-br from-[#2a1a0e] to-[#1a0f05] rounded-xl p-3 border-2 border-amber-800/50">
              
              {/* Cordas do violão */}
              {STRINGS.map((stringNote, stringIndex) => (
                <div key={stringIndex} className="flex items-center mb-1">
                  {/* Corda solta (antes do traste 1) - sem número */}
                  <div
                    onClick={() => playNote(stringIndex, 0)}
                    className={`
                      w-10 flex-shrink-0 py-1.5 rounded text-sm font-bold transition-all text-center
                      ${isRootNote(stringNote) && highlightRoot
                        ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.6)]'
                        : isScaleNote(stringNote)
                        ? 'bg-amber-700 text-white shadow-[0_0_10px_rgba(180,83,9,0.4)]'
                        : 'bg-amber-800/60 text-amber-200'
                      }
                      hover:scale-110 cursor-pointer active:scale-95
                      ${playingNote === `${stringIndex}-0` ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-[#2a1a0e]' : ''}
                    `}
                    title={`${stringNote}${STRING_OCTAVES[stringIndex]} (Corda Solta) - Clique para tocar`}
                  >
                    {playingNote === `${stringIndex}-0` ? (
                      <Volume2 className="w-4 h-4 mx-auto animate-pulse" />
                    ) : (
                      stringNote
                    )}
                  </div>

                  {/* Trastes 1 em diante */}
                  {Array.from({ length: displayFrets }, (_, i) => i + 1).map((fret) => {
                    const { note, octave } = getNoteAtPosition(stringIndex, fret);
                    const isScale = isScaleNote(note);
                    const isRoot = isRootNote(note);
                    const noteKey = `${stringIndex}-${fret}`;

                    return (
                      <div
                        key={fret}
                        onClick={() => playNote(stringIndex, fret)}
                        className={`
                          flex-1 min-w-[32px] py-1.5 mx-0.5 rounded text-sm font-bold transition-all text-center
                          ${isRoot && highlightRoot
                            ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.6)]'
                            : isScale
                            ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                            : 'bg-gray-700/50 text-gray-400'
                          }
                          hover:scale-105 cursor-pointer active:scale-95
                          ${playingNote === noteKey ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-[#2a1a0e]' : ''}
                        `}
                        title={`${note}${octave} (Traste ${fret}) - Clique para tocar`}
                      >
                        {playingNote === noteKey ? (
                          <Volume2 className="w-3 h-3 mx-auto animate-pulse" />
                        ) : (
                          note
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Numeração dos trastes - ABAIXO das cordas como no f2k.mjgibson.com */}
              <div className="flex mt-2 pt-2 border-t border-amber-800/30">
                {/* Espaço para coluna da corda solta (sem número) */}
                <div className="w-10 flex-shrink-0"></div>
                {/* Números dos trastes 1-24 */}
                {Array.from({ length: displayFrets }, (_, i) => i + 1).map((fret) => (
                  <div
                    key={fret}
                    className={`
                      flex-1 text-center text-xs font-bold min-w-[32px] mx-0.5
                      ${[3, 5, 7, 9, 12, 15, 17, 19, 21, 24].includes(fret) 
                        ? 'text-amber-400' 
                        : 'text-amber-200/60'
                      }
                    `}
                  >
                    {fret}
                    {/* Marcadores de trastes (pontos) */}
                    {[3, 5, 7, 9, 15, 17, 19, 21].includes(fret) && (
                      <div className="w-1.5 h-1.5 bg-amber-400/60 rounded-full mx-auto mt-0.5" />
                    )}
                    {fret === 12 && (
                      <div className="flex justify-center gap-0.5 mt-0.5">
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                      </div>
                    )}
                    {fret === 24 && (
                      <div className="flex justify-center gap-0.5 mt-0.5">
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notas da Escala - Compacto */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400">Notas:</span>
          {scaleNotes.map((note, index) => (
            <span
              key={`${note}-${index}`}
              className={`
                px-2 py-0.5 rounded text-xs font-bold
                ${note === root
                  ? 'bg-yellow-500/30 text-yellow-400'
                  : 'bg-emerald-500/30 text-emerald-400'
                }
              `}
            >
              {note}{note === root && ' ⭐'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
