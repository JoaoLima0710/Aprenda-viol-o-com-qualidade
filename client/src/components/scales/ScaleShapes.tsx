/**
 * 🎸 Scale Shapes Component
 * 
 * Baseado em r/guitarlessons: "CAGED e 3NPS"
 * Mostra diferentes formas/posições da mesma escala
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Layers } from 'lucide-react';

export type ScaleShapeSystem = 'caged' | '3nps' | 'box';

interface ScaleShape {
  id: string;
  name: string;
  system: ScaleShapeSystem;
  startFret: number;
  endFret: number;
  description: string;
  recommended: boolean;
}

interface ScaleShapesProps {
  scaleName: string;
  root: string;
  intervals: number[];
}

export function ScaleShapes({ scaleName, root, intervals }: ScaleShapesProps) {
  const [selectedSystem, setSelectedSystem] = useState<ScaleShapeSystem>('caged');
  const [selectedShape, setSelectedShape] = useState<string | null>(null);

  // Gerar shapes baseados no sistema
  const generateShapes = (system: ScaleShapeSystem): ScaleShape[] => {
    const shapes: ScaleShape[] = [];
    
    if (system === 'caged') {
      // Sistema CAGED - 5 posições principais
      shapes.push(
        { id: 'c-shape', name: 'C Shape', system: 'caged', startFret: 0, endFret: 3, description: 'Posição aberta (CAGED)', recommended: true },
        { id: 'a-shape', name: 'A Shape', system: 'caged', startFret: 2, endFret: 5, description: 'Segunda posição (CAGED)', recommended: true },
        { id: 'g-shape', name: 'G Shape', system: 'caged', startFret: 3, endFret: 6, description: 'Terceira posição (CAGED)', recommended: true },
        { id: 'e-shape', name: 'E Shape', system: 'caged', startFret: 0, endFret: 3, description: 'Quarta posição (CAGED)', recommended: true },
        { id: 'd-shape', name: 'D Shape', system: 'caged', startFret: 2, endFret: 5, description: 'Quinta posição (CAGED)', recommended: false },
      );
    } else if (system === '3nps') {
      // Sistema 3 Notas Por Corda
      shapes.push(
        { id: '3nps-1', name: '3NPS Posição 1', system: '3nps', startFret: 0, endFret: 4, description: '3 notas por corda - início', recommended: true },
        { id: '3nps-2', name: '3NPS Posição 2', system: '3nps', startFret: 3, endFret: 7, description: '3 notas por corda - meio', recommended: true },
        { id: '3nps-3', name: '3NPS Posição 3', system: '3nps', startFret: 5, endFret: 9, description: '3 notas por corda - final', recommended: true },
      );
    } else {
      // Box patterns tradicionais
      shapes.push(
        { id: 'box-1', name: 'Box Pattern 1', system: 'box', startFret: 0, endFret: 3, description: 'Padrão box tradicional', recommended: true },
        { id: 'box-2', name: 'Box Pattern 2', system: 'box', startFret: 3, endFret: 6, description: 'Padrão box intermediário', recommended: true },
        { id: 'box-3', name: 'Box Pattern 3', system: 'box', startFret: 5, endFret: 8, description: 'Padrão box avançado', recommended: false },
      );
    }
    
    return shapes;
  };

  const shapes = generateShapes(selectedSystem);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1a1a2e]/80 to-[#2a2a3e]/60 border border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">🎸 Formas da Escala</h3>
            <p className="text-sm text-gray-400">Diferentes posições no braço</p>
          </div>
        </div>

        <p className="text-gray-300 mb-6 leading-relaxed">
          <strong className="text-cyan-400">Escalas não são apenas um "shape" fixo!</strong> A mesma escala 
          pode ser tocada em diferentes posições do braço. Aprender múltiplas formas ajuda você a:
        </p>

        <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
          <li>Navegar pelo braço sem perder o som da escala</li>
          <li>Conectar diferentes posições fluidamente</li>
          <li>Encontrar a melhor posição para cada frase</li>
        </ul>

        {/* Sistema de Visualização */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-white mb-3">Sistema de Visualização:</h4>
          <div className="flex gap-3">
            <Button
              onClick={() => setSelectedSystem('caged')}
              variant={selectedSystem === 'caged' ? 'default' : 'outline'}
              className={selectedSystem === 'caged' 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500' 
                : 'bg-white/5 border-white/10'
              }
            >
              CAGED
            </Button>
            <Button
              onClick={() => setSelectedSystem('3nps')}
              variant={selectedSystem === '3nps' ? 'default' : 'outline'}
              className={selectedSystem === '3nps' 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500' 
                : 'bg-white/5 border-white/10'
              }
            >
              3NPS
            </Button>
            <Button
              onClick={() => setSelectedSystem('box')}
              variant={selectedSystem === 'box' ? 'default' : 'outline'}
              className={selectedSystem === 'box' 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500' 
                : 'bg-white/5 border-white/10'
              }
            >
              Box Patterns
            </Button>
          </div>
        </div>

        {/* Shapes Disponíveis */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shapes.map((shape) => (
            <button
              key={shape.id}
              onClick={() => setSelectedShape(shape.id)}
              className={`
                p-4 rounded-xl border-2 text-left transition-all
                ${selectedShape === shape.id
                  ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border-cyan-400'
                  : 'bg-white/5 border-white/10 hover:border-cyan-400/50'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-white">{shape.name}</span>
                {shape.recommended && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                    ⭐ Recomendado
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <MapPin className="w-4 h-4" />
                <span>Trastes {shape.startFret} - {shape.endFret}</span>
              </div>
              
              <p className="text-xs text-gray-500">{shape.description}</p>
            </button>
          ))}
        </div>

        {selectedShape && (
          <div className="mt-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-400/30">
            <p className="text-sm text-cyan-300">
              <strong>💡 Próximo passo:</strong> Pratique esta forma conectando com as formas adjacentes. 
              Tente tocar uma frase que comece em uma forma e termine em outra!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
