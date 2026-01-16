import { motion } from 'framer-motion';

interface ChordDiagramProps {
  frets: (number | 'x')[];
  fingers: (number | 0)[];
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ChordDiagram({ frets, fingers, name, size = 'md' }: ChordDiagramProps) {
  const sizeConfig = {
    sm: {
      width: 140,
      height: 180,
      fretHeight: 30,
      stringSpacing: 22,
      dotSize: 16,
      fontSize: 'text-xs',
      titleSize: 'text-lg',
    },
    md: {
      width: 200,
      height: 260,
      fretHeight: 45,
      stringSpacing: 32,
      dotSize: 24,
      fontSize: 'text-sm',
      titleSize: 'text-2xl',
    },
    lg: {
      width: 260,
      height: 340,
      fretHeight: 60,
      stringSpacing: 42,
      dotSize: 32,
      fontSize: 'text-base',
      titleSize: 'text-3xl',
    },
  };
  
  const config = sizeConfig[size];
  const numStrings = 6;
  const numFrets = 4;
  const startX = 30;
  const startY = 50;
  
  // Calcular a altura total do braço
  const fretboardHeight = numFrets * config.fretHeight;
  const fretboardWidth = (numStrings - 1) * config.stringSpacing;
  
  return (
    <motion.div 
      className="flex flex-col items-center gap-3"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      key={name}
    >
      {/* Nome do Acorde */}
      <motion.h3 
        className={`${config.titleSize} font-bold text-white`}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {name}
      </motion.h3>
      
      {/* SVG do Diagrama */}
      <motion.svg
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
        className="select-none"
      >
        {/* Fundo */}
        <rect
          x={startX - 10}
          y={startY - 25}
          width={fretboardWidth + 20}
          height={fretboardHeight + 35}
          fill="#1a1a2e"
          rx="12"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
        
        {/* Cordas (linhas verticais) */}
        {Array.from({ length: numStrings }).map((_, i) => (
          <line
            key={`string-${i}`}
            x1={startX + i * config.stringSpacing}
            y1={startY}
            x2={startX + i * config.stringSpacing}
            y2={startY + fretboardHeight}
            stroke="#9ca3af"
            strokeWidth="2"
          />
        ))}
        
        {/* Trastes (linhas horizontais) */}
        {Array.from({ length: numFrets + 1 }).map((_, i) => (
          <line
            key={`fret-${i}`}
            x1={startX}
            y1={startY + i * config.fretHeight}
            x2={startX + fretboardWidth}
            y2={startY + i * config.fretHeight}
            stroke={i === 0 ? '#ffffff' : '#6b7280'}
            strokeWidth={i === 0 ? '4' : '2'}
          />
        ))}
        
        {/* Marcadores de cordas (X ou O no topo) */}
        {frets.map((fret, stringIndex) => {
          const x = startX + stringIndex * config.stringSpacing;
          const y = startY - 15;
          
          if (fret === 'x') {
            // X vermelho para corda não tocada
            return (
              <g key={`marker-${stringIndex}`}>
                <line
                  x1={x - 6}
                  y1={y - 6}
                  x2={x + 6}
                  y2={y + 6}
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <line
                  x1={x + 6}
                  y1={y - 6}
                  x2={x - 6}
                  y2={y + 6}
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>
            );
          }
          
          if (fret === 0) {
            // O verde para corda solta
            return (
              <circle
                key={`marker-${stringIndex}`}
                cx={x}
                cy={y}
                r="7"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
              />
            );
          }
          
          return null;
        })}
        
        {/* Posições dos dedos (bolinhas) */}
        {frets.map((fret, stringIndex) => {
          if (typeof fret !== 'number' || fret === 0) return null;
          
          const x = startX + stringIndex * config.stringSpacing;
          const y = startY + (fret - 0.5) * config.fretHeight;
          const fingerNumber = fingers[stringIndex];
          
          return (
            <g key={`finger-${stringIndex}`}>
              {/* Sombra */}
              <circle
                cx={x}
                cy={y + 2}
                r={config.dotSize / 2}
                fill="rgba(0,0,0,0.3)"
              />
              {/* Bolinha com gradiente */}
              <defs>
                <radialGradient id={`grad-${stringIndex}`}>
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </radialGradient>
              </defs>
              <circle
                cx={x}
                cy={y}
                r={config.dotSize / 2}
                fill={`url(#grad-${stringIndex})`}
                stroke="#ffffff"
                strokeWidth="2"
              />
              {/* Número do dedo */}
              {fingerNumber !== 0 && (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#ffffff"
                  fontSize={config.dotSize * 0.6}
                  fontWeight="bold"
                  fontFamily="Inter, sans-serif"
                >
                  {fingerNumber}
                </text>
              )}
            </g>
          );
        })}
        
        {/* Números das cordas (E A D G B e) */}
        {['E', 'A', 'D', 'G', 'B', 'e'].map((note, i) => (
          <text
            key={`note-${i}`}
            x={startX + i * config.stringSpacing}
            y={startY + fretboardHeight + 20}
            textAnchor="middle"
            fill="#9ca3af"
            fontSize="12"
            fontWeight="600"
            fontFamily="Inter, sans-serif"
          >
            {note}
          </text>
        ))}
      </motion.svg>
      
      {/* Legenda dos dedos */}
      <div className={`${config.fontSize} text-gray-400 text-center space-y-1`}>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#22d3ee] to-[#06b6d4] flex items-center justify-center text-white text-xs font-bold">1</span>
            <span>Indicador</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#22d3ee] to-[#06b6d4] flex items-center justify-center text-white text-xs font-bold">2</span>
            <span>Médio</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#22d3ee] to-[#06b6d4] flex items-center justify-center text-white text-xs font-bold">3</span>
            <span>Anelar</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#22d3ee] to-[#06b6d4] flex items-center justify-center text-white text-xs font-bold">4</span>
            <span>Mindinho</span>
          </span>
        </div>
        <div className="flex items-center justify-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="text-green-400 font-bold">○</span>
            <span>Corda solta</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-red-400 font-bold">✕</span>
            <span>Não tocar</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}
