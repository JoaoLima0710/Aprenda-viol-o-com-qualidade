import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { toast } from 'sonner';

/**
 * Calculate fretboard positions for any scale using a proper box pattern
 * This creates a didactically correct and technically sound scale pattern
 */
function calculateScalePositions(root: string, intervals: number[]): Array<{
  note: string;
  string: number;
  fret: number;
  sequence: number;
  color: string;
}> {
  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const STRINGS = ['E', 'B', 'G', 'D', 'A', 'E']; // From high E (index 0) to low E (index 5)

  // Convert root to uppercase and find index
  const rootNote = root.toUpperCase();
  const rootIndex = NOTES.indexOf(rootNote);

  if (rootIndex === -1) {
    console.error('Invalid root note:', root);
    return [];
  }

  // Generate scale notes in order
  const scaleNotes: string[] = [];
  intervals.forEach(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    scaleNotes.push(NOTES[noteIndex]);
  });
  // Add octave return
  scaleNotes.push(rootNote);

  console.log('🎼 Scale notes for', root, ':', scaleNotes);

  // Find starting position (root note) - prefer lower strings, lower frets
  const startPosition = findRootPosition(rootNote, STRINGS, NOTES);
  if (!startPosition) {
    console.error('Could not find starting position for root:', rootNote);
    return [];
  }

  // Build scale pattern using box pattern logic
  const positions: Array<{
    note: string;
    string: number;
    fret: number;
    sequence: number;
    color: string;
  }> = [];

  // Add root note as first position
  positions.push({
    note: rootNote,
    string: startPosition.string,
    fret: startPosition.fret,
    sequence: 1,
    color: NOTE_COLORS[0]
  });

  // Build the rest of the scale following a logical pattern
  // Strategy: Move across strings and up/down frets in a natural way
  let currentString = startPosition.string;
  let currentFret = startPosition.fret;
  const usedPositions = new Set<string>();
  usedPositions.add(`${currentString}-${currentFret}`);

  // For each scale note (skip first, already added)
  for (let i = 1; i < scaleNotes.length; i++) {
    const targetNote = scaleNotes[i];
    const position = findNextLogicalPosition(
      targetNote,
      currentString,
      currentFret,
      usedPositions,
      STRINGS,
      NOTES,
      positions
    );

    if (position) {
      positions.push({
        note: targetNote,
        string: position.string,
        fret: position.fret,
        sequence: i + 1,
        color: NOTE_COLORS[i % NOTE_COLORS.length]
      });

      currentString = position.string;
      currentFret = position.fret;
      usedPositions.add(`${position.string}-${position.fret}`);
    } else {
      // Fallback: find any available position
      const fallback = findAnyPosition(targetNote, usedPositions, STRINGS, NOTES);
      if (fallback) {
        positions.push({
          note: targetNote,
          string: fallback.string,
          fret: fallback.fret,
          sequence: i + 1,
          color: NOTE_COLORS[i % NOTE_COLORS.length]
        });
        currentString = fallback.string;
        currentFret = fallback.fret;
        usedPositions.add(`${fallback.string}-${fallback.fret}`);
      }
    }
  }

  return positions;
}

/**
 * Find root position - prefer lower strings (5th or 6th), lower frets (0-5)
 */
function findRootPosition(rootNote: string, STRINGS: string[], NOTES: string[]): { string: number; fret: number } | null {
  // Try 6th string (low E) first - most common starting position
  for (let stringIndex = 5; stringIndex >= 0; stringIndex--) {
    const stringNote = STRINGS[stringIndex];
    const stringRootIndex = NOTES.indexOf(stringNote);
    const targetIndex = NOTES.indexOf(rootNote);

    if (stringRootIndex !== -1 && targetIndex !== -1) {
      let fret = (targetIndex - stringRootIndex + 12) % 12;
      
      // Prefer open position or lower frets (0-5)
      if (fret <= 5) {
        return { string: stringIndex, fret };
      }
      
      // Also try octave down (12 frets lower)
      const fretLower = fret - 12;
      if (fretLower >= 0 && fretLower <= 5) {
        return { string: stringIndex, fret: fretLower };
      }
    }
  }

  // Fallback: any position
  for (let stringIndex = 5; stringIndex >= 0; stringIndex--) {
    const stringNote = STRINGS[stringIndex];
    const stringRootIndex = NOTES.indexOf(stringNote);
    const targetIndex = NOTES.indexOf(rootNote);

    if (stringRootIndex !== -1 && targetIndex !== -1) {
      const fret = (targetIndex - stringRootIndex + 12) % 12;
      if (fret <= 12) {
        return { string: stringIndex, fret };
      }
    }
  }

  return null;
}

/**
 * Find next logical position - prefer moving to adjacent strings, similar frets
 */
function findNextLogicalPosition(
  targetNote: string,
  currentString: number,
  currentFret: number,
  usedPositions: Set<string>,
  STRINGS: string[],
  NOTES: string[],
  existingPositions: any[]
): { string: number; fret: number } | null {
  const targetIndex = NOTES.indexOf(targetNote);
  if (targetIndex === -1) return null;

  const candidates: Array<{ string: number; fret: number; score: number }> = [];

  // Check adjacent strings first (prefer moving to next string)
  for (let offset = -1; offset <= 1; offset++) {
    const stringIndex = currentString + offset;
    if (stringIndex < 0 || stringIndex >= STRINGS.length) continue;

    const stringNote = STRINGS[stringIndex];
    const stringRootIndex = NOTES.indexOf(stringNote);
    if (stringRootIndex === -1) continue;

    let fret = (targetIndex - stringRootIndex + 12) % 12;
    const key = `${stringIndex}-${fret}`;

    if (usedPositions.has(key)) continue;

    // Calculate score: prefer positions close to current fret, on adjacent strings
    let score = 100;
    
    // Prefer moving to next string (ascending)
    if (offset === 1) score += 30;
    else if (offset === 0) score += 10; // Same string
    else score += 5; // Previous string

    // Prefer frets close to current (within 4 frets)
    const fretDistance = Math.abs(fret - currentFret);
    if (fretDistance <= 2) score += 40;
    else if (fretDistance <= 4) score += 20;
    else if (fretDistance <= 6) score += 10;
    else score -= 20;

    // Prefer lower frets (0-8)
    if (fret <= 8) score += 15;
    else if (fret <= 12) score += 5;
    else score -= 10;

    // Prefer ascending pattern (fret should be >= current or slightly lower)
    if (fret >= currentFret - 2) score += 20;

    candidates.push({ string: stringIndex, fret, score });
  }

  // Also check octave positions
  for (let stringIndex = 0; stringIndex < STRINGS.length; stringIndex++) {
    const stringNote = STRINGS[stringIndex];
    const stringRootIndex = NOTES.indexOf(stringNote);
    if (stringRootIndex === -1) continue;

    let fret = (targetIndex - stringRootIndex + 12) % 12;
    const fretOctave = fret + 12;
    const key = `${stringIndex}-${fretOctave}`;

    if (!usedPositions.has(key) && fretOctave <= 12) {
      let score = 50;
      const stringDistance = Math.abs(stringIndex - currentString);
      if (stringDistance <= 1) score += 20;
      if (fretOctave <= 8) score += 10;
      candidates.push({ string: stringIndex, fret: fretOctave, score });
    }
  }

  if (candidates.length === 0) return null;

  // Sort by score and return best
  candidates.sort((a, b) => b.score - a.score);
  return { string: candidates[0].string, fret: candidates[0].fret };
}

/**
 * Fallback: find any available position for a note
 */
function findAnyPosition(
  targetNote: string,
  usedPositions: Set<string>,
  STRINGS: string[],
  NOTES: string[]
): { string: number; fret: number } | null {
  const targetIndex = NOTES.indexOf(targetNote);
  if (targetIndex === -1) return null;

  for (let stringIndex = 0; stringIndex < STRINGS.length; stringIndex++) {
    const stringNote = STRINGS[stringIndex];
    const stringRootIndex = NOTES.indexOf(stringNote);
    if (stringRootIndex === -1) continue;

    let fret = (targetIndex - stringRootIndex + 12) % 12;
    const key = `${stringIndex}-${fret}`;

    if (!usedPositions.has(key) && fret <= 12) {
      return { string: stringIndex, fret };
    }

    // Try octave
    const fretOctave = fret + 12;
    const keyOctave = `${stringIndex}-${fretOctave}`;
    if (!usedPositions.has(keyOctave) && fretOctave <= 12) {
      return { string: stringIndex, fret: fretOctave };
    }
  }

  return null;
}

interface ScaleFretboardProps {
  scaleName: string;
  scaleNotes: string[];
  tonic: string;
  intervals: number[];
}

const STRINGS = ['E', 'B', 'G', 'D', 'A', 'E'];
const NOTE_COLORS = [
  '#06b6d4', // cyan
  '#a855f7', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // green
  '#3b82f6', // blue
  '#ef4444', // red
  '#14b8a6', // teal
];

export function ScaleFretboard({ scaleName, scaleNotes, tonic, intervals }: ScaleFretboardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number | null>(null);

  // Calcular posições dinâmicas da escala
  const scalePattern = calculateScalePositions(tonic, intervals);

  console.log('🎸 ScaleFretboard - NEW VERSION LOADED');
  console.log('🎸 Scale:', scaleName, 'Root:', tonic, 'Intervals:', intervals);
  console.log('🎸 Scale positions calculated:', scalePattern);

  // Função para tocar a escala com animação - CORRIGIDA
  const playScaleSequence = async () => {
    if (scalePattern.length === 0) {
      toast.error('Não foi possível calcular as posições da escala');
      return;
    }

    setIsPlaying(true);

    try {
      // Garantir que o audio service está inicializado
      await unifiedAudioService.initialize();
      
      console.log('🎵 Tocando escala com', scalePattern.length, 'notas');

      for (let i = 0; i < scalePattern.length; i++) {
        setCurrentNoteIndex(i);

        // Usar o audio service para tocar a nota correta
        // Adicionar oitava se não tiver (padrão: 4)
        let noteToPlay = scalePattern[i].note;
        if (!/\d/.test(noteToPlay)) {
          noteToPlay = noteToPlay + '4';
        }

        console.log('🎼 Tocando nota:', noteToPlay, 'na posição', scalePattern[i].string, scalePattern[i].fret);

        // Tocar nota com delay entre notas
        await unifiedAudioService.playNote(noteToPlay, 0.5);
        
        // Aguardar antes da próxima nota (ajustado para melhor timing)
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setCurrentNoteIndex(null);
      setIsPlaying(false);
      toast.success('🎵 Sequência completa!');

    } catch (error) {
      console.error('❌ Erro ao tocar escala:', error);
      setIsPlaying(false);
      setCurrentNoteIndex(null);
      toast.error('Erro ao tocar a escala. Verifique se o áudio está habilitado.');
    }
  };

  const stopPlaying = () => {
    unifiedAudioService.stopAll();
    setIsPlaying(false);
    setCurrentNoteIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Título e Botão - MELHORADO */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex-1">
          <h3 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3 mb-2">
            <span className="text-4xl">🎸</span>
            <span>Diagrama da Escala</span>
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">
              v2.0
            </span>
          </h3>
          <p className="text-sm md:text-base text-gray-400">
            Siga os números na ordem sequencial (① → ② → ③...). As setas verdes mostram o caminho lógico. A nota com ⭐ é a tônica.
          </p>
        </div>
        
        <div className="flex gap-3">
          {!isPlaying ? (
            <Button
              onClick={playScaleSequence}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold px-6 py-3 text-base shadow-lg hover:shadow-xl transition-all"
            >
              <Play className="w-5 h-5 mr-2" />
              Tocar Sequência
            </Button>
          ) : (
            <Button
              onClick={stopPlaying}
              variant="destructive"
              className="px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Square className="w-5 h-5 mr-2" />
              Parar
            </Button>
          )}
        </div>
      </div>

      {/* Indicador de Progresso */}
      <AnimatePresence>
        {isPlaying && currentNoteIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl p-4 text-center"
          >
            <p className="text-cyan-400 font-semibold text-lg">
              Tocando nota {currentNoteIndex + 1} de {scalePattern.length}: <span className="text-white text-2xl ml-2">{scalePattern[currentNoteIndex].note}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diagrama do Braço do Violão - MELHORADO */}
      <div className="relative bg-gradient-to-br from-[#1a1a2e] to-[#16162a] rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl">
        <svg
          viewBox="0 0 700 450"
          className="w-full h-auto"
          style={{ maxHeight: '550px' }}
        >
          {/* Fundo do braço - mais realista */}
          <defs>
            <linearGradient id="fretboardGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4a3a2a" />
              <stop offset="50%" stopColor="#3d2817" />
              <stop offset="100%" stopColor="#2a1810" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            {/* Gradientes para notas */}
            {scalePattern.map((note, index) => (
              <linearGradient key={`grad-${index}`} id={`noteGradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={note.color} stopOpacity="1" />
                <stop offset="100%" stopColor={note.color} stopOpacity="0.7" />
              </linearGradient>
            ))}
          </defs>
          
          <rect
            x="120"
            y="50"
            width="550"
            height="320"
            rx="10"
            fill="url(#fretboardGradient)"
            stroke="#5a4a3a"
            strokeWidth="2"
          />

          {/* Cordas (6 linhas horizontais) - mais visíveis */}
          {STRINGS.map((_, index) => (
            <line
              key={`string-${index}`}
              x1="120"
              y1={80 + index * 50}
              x2="670"
              y2={80 + index * 50}
              stroke="#f4d03f"
              strokeWidth={index === 0 || index === 5 ? "3" : "2.5"}
              opacity="0.8"
              filter="url(#glow)"
            />
          ))}

          {/* Traste 0 (nut) - linha mais grossa */}
          <line
            x1="120"
            y1="50"
            x2="120"
            y2="370"
            stroke="#8b7355"
            strokeWidth="4"
            opacity="0.8"
          />
          {/* Trastes (linhas verticais) - mais realistas */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((fret) => (
            <g key={`fret-${fret}`}>
              {/* Sombra do traste */}
              <line
                x1={120 + fret * 70 + 1}
                y1="50"
                x2={120 + fret * 70 + 1}
                y2="370"
                stroke="#1a1a1a"
                strokeWidth="2"
                opacity="0.5"
              />
              {/* Traste principal */}
              <line
                x1={120 + fret * 70}
                y1="50"
                x2={120 + fret * 70}
                y2="370"
                stroke="#c9a961"
                strokeWidth="3"
              />
            </g>
          ))}

          {/* Números dos trastes - incluindo traste 0 (casa aberta) */}
          <text
            x={120 - 35}
            y="380"
            fill="#9ca3af"
            fontSize="16"
            fontWeight="600"
            textAnchor="middle"
          >
            0
          </text>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((fret) => (
            <text
              key={`fret-label-${fret}`}
              x={120 + fret * 70 - 35}
              y="380"
              fill="#9ca3af"
              fontSize="18"
              fontWeight="600"
              textAnchor="middle"
            >
              {fret}
            </text>
          ))}

          {/* Nomes das cordas (à esquerda) */}
          {STRINGS.map((string, index) => (
            <text
              key={`string-label-${index}`}
              x="90"
              y={85 + index * 50}
              fill="#d1d5db"
              fontSize="20"
              fontWeight="bold"
              textAnchor="end"
            >
              {string}
            </text>
          ))}

          {/* Setas conectando as notas - apenas se a distância for razoável */}
          {scalePattern.slice(0, -1).map((note, index) => {
            const nextNote = scalePattern[index + 1];
            const x1 = 120 + note.fret * 70 - 35;
            const y1 = 80 + note.string * 50;
            const x2 = 120 + nextNote.fret * 70 - 35;
            const y2 = 80 + nextNote.string * 50;

            // Calcular distância
            const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            
            // Só mostrar seta se a distância for razoável (não muito longa)
            // e se as notas estiverem em strings adjacentes ou próximas
            const stringDistance = Math.abs(nextNote.string - note.string);
            const fretDistance = Math.abs(nextNote.fret - note.fret);
            
            // Mostrar seta apenas se:
            // 1. Strings adjacentes (distância <= 1) OU
            // 2. Mesma string e frets próximos (distância <= 3) OU
            // 3. Distância visual não muito grande (< 200px)
            const shouldShowArrow = 
              (stringDistance <= 1 && fretDistance <= 5) ||
              (stringDistance === 0 && fretDistance <= 3) ||
              (distance < 200 && stringDistance <= 2);

            if (!shouldShowArrow) return null;

            return (
              <g key={`arrow-${index}`}>
                <defs>
                  <marker
                    id={`arrowhead-${index}`}
                    markerWidth="8"
                    markerHeight="8"
                    refX="7"
                    refY="2.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 8 2.5, 0 5"
                      fill="#10b981"
                    />
                  </marker>
                </defs>
                {/* Linha de fundo (mais grossa, mais escura) */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#065f46"
                  strokeWidth="5"
                  opacity="0.3"
                />
                {/* Linha principal */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#10b981"
                  strokeWidth="2.5"
                  markerEnd={`url(#arrowhead-${index})`}
                  opacity="0.85"
                />
              </g>
            );
          })}

          {/* Notas da escala (círculos coloridos com números) - MELHORADO */}
          {scalePattern.map((note, index) => {
            const x = 120 + note.fret * 70 - 35;
            const y = 80 + note.string * 50;
            const isPlaying = currentNoteIndex === index;
            const isFirst = index === 0;
            const isRoot = note.note === tonic;

            return (
              <g key={`note-${index}`} filter={isPlaying ? "url(#glow)" : undefined}>
                {/* Sombra do círculo */}
                <circle
                  cx={x + 2}
                  cy={y + 2}
                  r={isPlaying ? 30 : isRoot ? 28 : 26}
                  fill="rgba(0,0,0,0.4)"
                />
                
                {/* Círculo da nota - com gradiente */}
                <motion.circle
                  cx={x}
                  cy={y}
                  r={isPlaying ? 28 : isRoot ? 26 : 24}
                  fill={isPlaying ? '#fbbf24' : (isRoot ? `url(#noteGradient-${index})` : note.color)}
                  stroke={isRoot ? "#fbbf24" : (isPlaying ? "#fff" : "white")}
                  strokeWidth={isRoot ? "4" : (isPlaying ? "4" : "3")}
                  animate={{
                    scale: isPlaying ? [1, 1.3, 1] : 1,
                    opacity: isPlaying ? [1, 0.8, 1] : 1,
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: isPlaying ? Infinity : 0,
                  }}
                />

                {/* Número da sequência - mais legível */}
                <text
                  x={x}
                  y={y + 9}
                  fill="white"
                  fontSize="22"
                  fontWeight="900"
                  textAnchor="middle"
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth="1"
                >
                  {note.sequence}
                </text>

                {/* Nome da nota (abaixo do círculo) - melhorado */}
                <text
                  x={x}
                  y={y + 48}
                  fill={isPlaying ? "#fbbf24" : note.color}
                  fontSize="16"
                  fontWeight="bold"
                  textAnchor="middle"
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth="0.5"
                >
                  {note.note}
                </text>
                
                {/* Indicador de tônica */}
                {isRoot && !isPlaying && (
                  <text
                    x={x}
                    y={y - 35}
                    fill="#fbbf24"
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    ⭐ Tônica
                  </text>
                )}

                {/* Ícone de mão apontando para a primeira nota */}
                {isFirst && (
                  <g>
                    <text
                      x={x - 50}
                      y={y + 5}
                      fontSize="32"
                    >
                      👉
                    </text>
                    <text
                      x={x - 90}
                      y={y - 15}
                      fill="#10b981"
                      fontSize="14"
                      fontWeight="bold"
                    >
                      COMECE
                    </text>
                    <text
                      x={x - 90}
                      y={y + 5}
                      fill="#10b981"
                      fontSize="14"
                      fontWeight="bold"
                    >
                      AQUI
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legenda: Como Ler Este Diagrama - MELHORADA */}
      <div className="bg-gradient-to-br from-[#1a1a2e]/80 to-[#16162a]/60 rounded-2xl p-6 border border-white/10">
        <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          📖 Como Ler Este Diagrama
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
              1
            </div>
            <div>
              <p className="text-white font-bold text-base mb-1">Localize a Tônica</p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Procure a nota marcada com ⭐ (estrela dourada). Esta é a nota fundamental da escala. Geralmente está na 6ª ou 5ª corda.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
              2
            </div>
            <div>
              <p className="text-white font-bold text-base mb-1">Siga a Sequência Numérica</p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Toque as notas na ordem: ① → ② → ③ → ④ → ⑤ → ⑥ → ⑦ → ⑧. Os números estão dentro dos círculos coloridos.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
              3
            </div>
            <div>
              <p className="text-white font-bold text-base mb-1">Use as Setas como Guia</p>
              <p className="text-gray-400 text-sm leading-relaxed">
                As setas verdes mostram o caminho entre notas próximas. Elas aparecem apenas quando faz sentido musicalmente.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
              4
            </div>
            <div>
              <p className="text-white font-bold text-base mb-1">Pratique com Áudio</p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Use o botão "Tocar Sequência" para ouvir como a escala deve soar. As notas acenderão em amarelo durante a reprodução.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎸</span>
            <div>
              <p className="text-white font-semibold text-sm mb-1">Estrutura do Diagrama</p>
              <p className="text-gray-400 text-sm">
                <strong className="text-gray-300">Cordas (esquerda):</strong> E, B, G, D, A, E - da mais aguda (topo) para a mais grave (fundo)
              </p>
              <p className="text-gray-400 text-sm mt-1">
                <strong className="text-gray-300">Trastes (embaixo):</strong> 0 (casa aberta), 1, 2, 3... - números indicam em qual traste pressionar
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 mt-4">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-white font-semibold text-sm mb-1">Dica de Execução</p>
              <p className="text-gray-400 text-sm">
                A escala segue um padrão "box" tradicional. Tente manter os dedos próximos e mover-se suavemente entre as cordas. 
                Pratique devagar primeiro, depois aumente a velocidade.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
