import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, StopCircle, Volume2 } from 'lucide-react';
import { unifiedAudioService } from '@/services/UnifiedAudioService';

interface Scale {
  id: string;
  name: string;
  root: string;
  intervals: number[];
  difficulty: string;
  description: string;
}

interface ScaleFretboardProps {
  scale: Scale;
  size?: 'sm' | 'md' | 'lg';
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Cores vibrantes para as notas
const NOTE_COLORS = [
  '#06b6d4', // cyan - tônica
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // green
  '#3b82f6', // blue
  '#ef4444', // red
  '#14b8a6', // teal
];

export function ScaleFretboard({ scale, size = 'md' }: ScaleFretboardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number | null>(null);

  // Calcular notas da escala
  const rootIndex = NOTE_NAMES.indexOf(scale.root);
  const scaleNotes = scale.intervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    return NOTE_NAMES[noteIndex];
  });

  // Adicionar a oitava (repetir a primeira nota)
  const fullScale = [...scaleNotes, scaleNotes[0]];

  // Definir UMA posição clara e simples da escala
  // Padrão de 1 oitava começando na corda E grave (6ª corda)
  const scalePattern = fullScale.map((note, index) => {
    // Padrão mais espalhado e natural
    // Começar na corda E grave (string 5 = 6ª corda) e subir
    let stringIndex, fret;
    
    if (index === 0) {
      stringIndex = 5; fret = 3; // E grave, 3º traste
    } else if (index === 1) {
      stringIndex = 5; fret = 5; // E grave, 5º traste
    } else if (index === 2) {
      stringIndex = 4; fret = 2; // A, 2º traste
    } else if (index === 3) {
      stringIndex = 4; fret = 3; // A, 3º traste
    } else if (index === 4) {
      stringIndex = 4; fret = 5; // A, 5º traste
    } else if (index === 5) {
      stringIndex = 3; fret = 2; // D, 2º traste
    } else if (index === 6) {
      stringIndex = 3; fret = 4; // D, 4º traste
    } else if (index === 7) {
      stringIndex = 3; fret = 5; // D, 5º traste (oitava)
    } else {
      // Fallback
      stringIndex = 5 - Math.floor(index / 3);
      fret = 3 + (index % 3) * 2;
    }
    
    return {
      note,
      string: stringIndex,
      fret: fret,
      sequence: index + 1,
      color: NOTE_COLORS[index % NOTE_COLORS.length],
    };
  });

  // Função para tocar a escala com animação
  const playScaleSequence = async () => {
    setIsPlaying(true);
    
    for (let i = 0; i < scalePattern.length; i++) {
      setCurrentNoteIndex(i);
      const note = scalePattern[i].note;
      
      // Tocar a nota
      await unifiedAudioService.playNote(note, 0.6);
      
      // Aguardar 600ms antes da próxima nota
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    setCurrentNoteIndex(null);
    setIsPlaying(false);
  };

  const stopPlaying = () => {
    unifiedAudioService.stopAll();
    setIsPlaying(false);
    setCurrentNoteIndex(null);
  };

  // Dimensões do diagrama
  const fretWidth = 120;
  const stringSpacing = 50;
  const numFrets = 8;
  const numStrings = 6;
  const startX = 100;
  const startY = 80;
  const width = 1000;
  const height = 500;

  const stringNames = ['E', 'B', 'G', 'D', 'A', 'E'];

  return (
    <div className="w-full">
      {/* Título e controles */}
      <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            🎸 Diagrama da Escala
          </h3>
          <p className="text-sm text-gray-400">
            Siga as setas e números. Comece pelo <span className="text-cyan-400 font-bold">①</span> e suba o braço.
          </p>
        </div>
        
        <div className="flex gap-2">
          {!isPlaying ? (
            <Button
              onClick={playScaleSequence}
              className="bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:from-[#0891b2] hover:to-[#06b6d4] text-white font-bold px-6 py-6 text-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Tocar Sequência
            </Button>
          ) : (
            <Button
              onClick={stopPlaying}
              variant="destructive"
              className="px-6 py-6 text-lg font-bold"
            >
              <StopCircle className="w-5 h-5 mr-2" />
              Parar
            </Button>
          )}
        </div>
      </div>

      {/* Status de reprodução */}
      {isPlaying && currentNoteIndex !== null && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-white font-semibold">
              Tocando nota {currentNoteIndex + 1} de {scalePattern.length}: 
              <span className="ml-2 text-cyan-400 text-lg">{scalePattern[currentNoteIndex].note}</span>
            </span>
          </div>
        </motion.div>
      )}

      {/* Diagrama SVG */}
      <div className="overflow-x-auto">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="mx-auto drop-shadow-2xl"
        >
          {/* Definições */}
          <defs>
            <linearGradient id="fretboard-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3d2817" />
              <stop offset="50%" stopColor="#4a3520" />
              <stop offset="100%" stopColor="#3d2817" />
            </linearGradient>
            
            {/* Filtro de brilho para nota ativa */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Fundo do braço */}
          <rect
            x={startX}
            y={startY - 20}
            width={numFrets * fretWidth}
            height={(numStrings - 1) * stringSpacing + 40}
            fill="url(#fretboard-gradient)"
            rx="16"
          />

          {/* Marcadores de posição (dots) */}
          <circle
            cx={startX + 2.5 * fretWidth}
            cy={startY + ((numStrings - 1) * stringSpacing) / 2}
            r="10"
            fill="#6b5544"
            opacity="0.3"
          />
          <circle
            cx={startX + 4.5 * fretWidth}
            cy={startY + ((numStrings - 1) * stringSpacing) / 2}
            r="10"
            fill="#6b5544"
            opacity="0.3"
          />

          {/* Trastes */}
          {Array.from({ length: numFrets + 1 }).map((_, i) => (
            <line
              key={`fret-${i}`}
              x1={startX + i * fretWidth}
              y1={startY}
              x2={startX + i * fretWidth}
              y2={startY + (numStrings - 1) * stringSpacing}
              stroke={i === 0 ? '#e5e7eb' : '#9ca3af'}
              strokeWidth={i === 0 ? 6 : 3}
            />
          ))}

          {/* Números dos trastes */}
          {Array.from({ length: numFrets }).map((_, i) => (
            <text
              key={`fret-num-${i}`}
              x={startX + i * fretWidth + fretWidth / 2}
              y={startY + (numStrings - 1) * stringSpacing + 40}
              textAnchor="middle"
              fill="#9ca3af"
              fontSize="16"
              fontWeight="700"
            >
              {i + 1}
            </text>
          ))}

          {/* Cordas */}
          {Array.from({ length: numStrings }).map((_, i) => {
            const thickness = 2 + (numStrings - i - 1) * 0.6;
            return (
              <g key={`string-${i}`}>
                <line
                  x1={startX}
                  y1={startY + i * stringSpacing}
                  x2={startX + numFrets * fretWidth}
                  y2={startY + i * stringSpacing}
                  stroke="#d4d4d8"
                  strokeWidth={thickness}
                />
                <text
                  x={startX - 45}
                  y={startY + i * stringSpacing + 7}
                  textAnchor="middle"
                  fill="#d1d5db"
                  fontSize="18"
                  fontWeight="700"
                >
                  {stringNames[i]}
                </text>
              </g>
            );
          })}

          {/* Setas conectando as notas */}
          {scalePattern.slice(0, -1).map((note, index) => {
            const nextNote = scalePattern[index + 1];
            const x1 = startX + (note.fret - 0.5) * fretWidth;
            const y1 = startY + note.string * stringSpacing;
            const x2 = startX + (nextNote.fret - 0.5) * fretWidth;
            const y2 = startY + nextNote.string * stringSpacing;

            // Calcular ponto médio para a seta
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            // Calcular ângulo da seta
            const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

            const isActive = isPlaying && currentNoteIndex === index;

            return (
              <g key={`arrow-${index}`}>
                {/* Linha conectando */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isActive ? '#fbbf24' : '#10b981'}
                  strokeWidth={isActive ? 5 : 3}
                  strokeDasharray={isActive ? '0' : '8,4'}
                  opacity={isActive ? 1 : 0.6}
                  style={{ transition: 'all 0.3s' }}
                />
                
                {/* Cabeça da seta */}
                <polygon
                  points="0,-6 12,0 0,6"
                  fill={isActive ? '#fbbf24' : '#10b981'}
                  opacity={isActive ? 1 : 0.6}
                  transform={`translate(${midX}, ${midY}) rotate(${angle})`}
                  style={{ transition: 'all 0.3s' }}
                />
              </g>
            );
          })}

          {/* Notas da escala */}
          {scalePattern.map((note, index) => {
            const x = startX + (note.fret - 0.5) * fretWidth;
            const y = startY + note.string * stringSpacing;
            const isActive = isPlaying && currentNoteIndex === index;
            const isFirst = index === 0;

            return (
              <g key={`note-${index}`}>
                {/* Círculo da nota */}
                <motion.circle
                  cx={x}
                  cy={y}
                  r={isActive ? 32 : 28}
                  fill={isActive ? '#fbbf24' : note.color}
                  stroke={isFirst ? '#10b981' : '#ffffff'}
                  strokeWidth={isFirst ? 5 : 3}
                  filter={isActive ? 'url(#glow)' : undefined}
                  style={{ transition: 'all 0.3s' }}
                />

                {/* Número de sequência */}
                <text
                  x={x}
                  y={y + 8}
                  textAnchor="middle"
                  fill="white"
                  fontSize={isActive ? '26' : '22'}
                  fontWeight="900"
                  style={{ 
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    transition: 'all 0.3s'
                  }}
                >
                  {note.sequence}
                </text>

                {/* Nome da nota abaixo */}
                <text
                  x={x}
                  y={y + 50}
                  textAnchor="middle"
                  fill={isActive ? '#fbbf24' : note.color}
                  fontSize="16"
                  fontWeight="700"
                >
                  {note.note}
                </text>

                {/* Indicador "COMECE AQUI" para a primeira nota */}
                {isFirst && (
                  <g>
                    <rect
                      x={x - 70}
                      y={y - 60}
                      width="140"
                      height="35"
                      fill="#10b981"
                      rx="8"
                    />
                    <text
                      x={x}
                      y={y - 35}
                      textAnchor="middle"
                      fill="white"
                      fontSize="16"
                      fontWeight="900"
                    >
                      ⬇️ COMECE AQUI
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legenda educacional */}
      <div className="mt-8 p-6 bg-gradient-to-br from-[#1a1a2e]/80 to-[#2a2a3e]/60 border border-white/20 rounded-2xl">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📖</span>
          <span>Como Ler Este Diagrama</span>
        </h4>
        
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold">
              1
            </div>
            <div>
              <p className="text-white font-semibold mb-1">Comece pela primeira nota</p>
              <p className="text-gray-400">Procure o círculo com o número ① e o texto "COMECE AQUI"</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
              2
            </div>
            <div>
              <p className="text-white font-semibold mb-1">Siga as setas verdes</p>
              <p className="text-gray-400">As setas mostram o caminho exato de uma nota para a próxima</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold">
              3
            </div>
            <div>
              <p className="text-white font-semibold mb-1">Toque na ordem dos números</p>
              <p className="text-gray-400">① → ② → ③ → ④... até completar a escala</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
              4
            </div>
            <div>
              <p className="text-white font-semibold mb-1">Use o botão "Tocar Sequência"</p>
              <p className="text-gray-400">Ouça como deve soar e veja as notas acenderem em amarelo</p>
            </div>
          </div>
        </div>

        {/* Dica extra */}
        <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-xl">
          <p className="text-sm text-gray-300">
            <span className="text-green-400 font-bold">💡 Dica:</span> As letras à esquerda (E, B, G, D, A, E) são os nomes das cordas. 
            Os números embaixo (1, 2, 3...) são os trastes do violão.
          </p>
        </div>
      </div>
    </div>
  );
}
