/**
 * 🎸 Full Fretboard View Component
 * 
 * Inspirado em https://f2k.mjgibson.com/
 * Mostra TODAS as notas da escala em TODO o braço do violão
 * Útil para entender como a escala se espalha pelo braço inteiro
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, Info } from 'lucide-react';

interface FullFretboardViewProps {
  scaleName: string;
  root: string;
  intervals: number[];
}

const STRINGS = ['E', 'B', 'G', 'D', 'A', 'E']; // Da corda mais aguda (1) para mais grave (6)
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MAX_FRETS = 24; // Mostrar até o traste 24

export function FullFretboardView({ scaleName, root, intervals }: FullFretboardViewProps) {
  const [showAllFrets, setShowAllFrets] = useState(false);
  const [highlightRoot, setHighlightRoot] = useState(true);

  // Gerar todas as notas da escala
  const rootIndex = NOTES.indexOf(root);
  const scaleNotes: string[] = [];
  intervals.forEach(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    scaleNotes.push(NOTES[noteIndex]);
  });
  scaleNotes.push(root); // Adicionar oitava

  // Função para obter a nota em uma posição específica
  const getNoteAtPosition = (stringIndex: number, fret: number): string => {
    const stringNote = STRINGS[stringIndex];
    const stringRootIndex = NOTES.indexOf(stringNote);
    const noteIndex = (stringRootIndex + fret) % 12;
    return NOTES[noteIndex];
  };

  // Verificar se uma nota pertence à escala
  const isScaleNote = (note: string): boolean => {
    return scaleNotes.includes(note);
  };

  // Verificar se é a tônica
  const isRootNote = (note: string): boolean => {
    return note === root;
  };

  const displayFrets = showAllFrets ? MAX_FRETS : 12;

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1a1a2e]/80 to-[#2a2a3e]/60 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Maximize2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">🎸 Visualização Completa do Braço</h3>
              <p className="text-sm text-gray-400">Todas as notas da escala {scaleName} em todo o braço</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAllFrets(!showAllFrets)}
              variant="outline"
              size="sm"
              className="bg-white/5 border-white/10"
            >
              {showAllFrets ? (
                <>
                  <Minimize2 className="w-4 h-4 mr-2" />
                  Mostrar 12 trastes
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Mostrar 24 trastes
                </>
              )}
            </Button>
            
            <Button
              onClick={() => setHighlightRoot(!highlightRoot)}
              variant="outline"
              size="sm"
              className={highlightRoot 
                ? 'bg-emerald-500/20 border-emerald-400' 
                : 'bg-white/5 border-white/10'
              }
            >
              {highlightRoot ? '⭐ Tônica' : 'Tônica'}
            </Button>
          </div>
        </div>

        <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/30">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div className="text-sm text-emerald-300">
              <p className="font-semibold mb-1">Como usar esta visualização:</p>
              <ul className="list-disc list-inside space-y-1 text-emerald-200">
                <li>Notas <span className="font-bold text-white">brancas</span> = pertencem à escala</li>
                <li>Notas <span className="font-bold text-gray-500">cinzas</span> = não pertencem à escala</li>
                {highlightRoot && (
                  <li>Notas <span className="font-bold text-yellow-400">amarelas</span> = tônica ({root})</li>
                )}
                <li>Use esta visualização para encontrar todas as posições possíveis de cada nota</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Fretboard */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="bg-gradient-to-br from-[#2a1a0e] to-[#1a0f05] rounded-xl p-4 border-2 border-amber-800/50">
              {/* Header com números dos trastes */}
              <div className="flex mb-2">
                <div className="w-16 flex-shrink-0"></div>
                {Array.from({ length: displayFrets }, (_, i) => i + 1).map((fret) => (
                  <div
                    key={fret}
                    className="flex-1 text-center text-xs font-bold text-amber-200 min-w-[40px]"
                  >
                    {fret}
                  </div>
                ))}
              </div>

              {/* Cordas */}
              {STRINGS.map((stringNote, stringIndex) => (
                <div key={stringIndex} className="flex items-center mb-1">
                  {/* Nome da corda */}
                  <div className="w-16 flex-shrink-0 text-center">
                    <div className="text-lg font-bold text-amber-300 bg-amber-900/30 px-2 py-1 rounded">
                      {stringNote}
                    </div>
                  </div>

                  {/* Traste 0 (casa aberta) */}
                  <div className="flex-1 min-w-[40px] text-center">
                    <div
                      className={`
                        mx-1 py-2 rounded text-sm font-bold transition-all
                        ${isRootNote(stringNote) && highlightRoot
                          ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.6)]'
                          : isScaleNote(stringNote)
                          ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                          : 'bg-gray-700/50 text-gray-400'
                        }
                      `}
                    >
                      {stringNote}
                    </div>
                  </div>

                  {/* Trastes 1-24 */}
                  {Array.from({ length: displayFrets }, (_, i) => i + 1).map((fret) => {
                    const note = getNoteAtPosition(stringIndex, fret);
                    const isScale = isScaleNote(note);
                    const isRoot = isRootNote(note);

                    return (
                      <div key={fret} className="flex-1 min-w-[40px] text-center">
                        <div
                          className={`
                            mx-1 py-2 rounded text-sm font-bold transition-all
                            ${isRoot && highlightRoot
                              ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.6)]'
                              : isScale
                              ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                              : 'bg-gray-700/50 text-gray-400'
                            }
                            hover:scale-110 cursor-pointer
                          `}
                          title={`${note} - ${isScale ? 'Pertence à escala' : 'Não pertence à escala'}${isRoot ? ' (Tônica)' : ''}`}
                        >
                          {note}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-emerald-500"></div>
              <span className="text-sm font-bold text-white">Notas da Escala</span>
            </div>
            <p className="text-xs text-gray-400">
              Todas as notas que pertencem à escala {scaleName}
            </p>
          </div>

          {highlightRoot && (
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-400/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded bg-yellow-500"></div>
                <span className="text-sm font-bold text-white">Tônica ({root})</span>
              </div>
              <p className="text-xs text-gray-400">
                Nota fundamental da escala - onde a escala resolve
              </p>
            </div>
          )}

          <div className="p-4 rounded-xl bg-gray-700/20 border border-gray-600/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-gray-700"></div>
              <span className="text-sm font-bold text-white">Outras Notas</span>
            </div>
            <p className="text-xs text-gray-400">
              Notas que não pertencem à escala
            </p>
          </div>
        </div>

        {/* Notas da Escala */}
        <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-sm font-bold text-white mb-2">Notas da Escala {scaleName}:</h4>
          <div className="flex flex-wrap gap-2">
            {scaleNotes.map((note, index) => (
              <span
                key={`${note}-${index}`}
                className={`
                  px-3 py-1 rounded-lg font-bold text-sm
                  ${note === root
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                  }
                `}
              >
                {note}
                {note === root && ' ⭐'}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
