/**
 * 🎵 Ear Training Component
 * 
 * Baseado em r/guitarlessons: "Singing/ear training associado à execução"
 * Cantar ou dizer o grau da escala enquanto toca
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Volume2, Music2, CheckCircle } from 'lucide-react';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { motion, AnimatePresence } from 'framer-motion';

interface EarTrainingProps {
  scaleName: string;
  root: string;
  intervals: number[];
}

const SCALE_DEGREES = ['1', '2', '3', '4', '5', '6', '7', '8'];
const DEGREE_NAMES = ['Tônica', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sétima', 'Oitava'];

export function EarTraining({ scaleName, root, intervals }: EarTrainingProps) {
  const [mode, setMode] = useState<'listen' | 'sing' | 'identify'>('listen');
  const [currentDegree, setCurrentDegree] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // Gerar notas da escala
  const rootIndex = NOTES.indexOf(root);
  const scaleNotes = intervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    return NOTES[noteIndex];
  });
  scaleNotes.push(root); // Adicionar oitava

  const playDegree = async (degree: number) => {
    setIsPlaying(true);
    setCurrentDegree(degree);
    setShowAnswer(false);
    
    try {
      await unifiedAudioService.initialize();
      const note = scaleNotes[degree];
      await unifiedAudioService.playNote(`${note}4`, 0.8);
    } catch (error) {
      console.error('Erro ao tocar grau:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  const playRandomDegree = async () => {
    const randomDegree = Math.floor(Math.random() * scaleNotes.length);
    await playDegree(randomDegree);
    setTimeout(() => setShowAnswer(true), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1a1a2e]/80 to-[#2a2a3e]/60 border border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <Mic className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">🎵 Ear Training</h3>
            <p className="text-sm text-gray-400">Cantar e reconhecer graus da escala</p>
          </div>
        </div>

        <p className="text-gray-300 mb-6 leading-relaxed">
          <strong className="text-pink-400">Por que cantar enquanto toca?</strong> Associar o som de cada 
          grau da escala com seu nome ajuda você a:
        </p>

        <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
          <li>Reconhecer intervalos e tensões auditivamente</li>
          <li>Improvisar com consciência do que está tocando</li>
          <li>Entender como cada nota se relaciona com a tônica</li>
        </ul>

        {/* Modos de Treino */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-white mb-3">Modo de Treino:</h4>
          <div className="flex gap-3">
            <Button
              onClick={() => setMode('listen')}
              variant={mode === 'listen' ? 'default' : 'outline'}
              className={mode === 'listen' 
                ? 'bg-gradient-to-r from-pink-500 to-rose-500' 
                : 'bg-white/5 border-white/10'
              }
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Ouvir
            </Button>
            <Button
              onClick={() => setMode('sing')}
              variant={mode === 'sing' ? 'default' : 'outline'}
              className={mode === 'sing' 
                ? 'bg-gradient-to-r from-pink-500 to-rose-500' 
                : 'bg-white/5 border-white/10'
              }
            >
              <Mic className="w-4 h-4 mr-2" />
              Cantar
            </Button>
            <Button
              onClick={() => setMode('identify')}
              variant={mode === 'identify' ? 'default' : 'outline'}
              className={mode === 'identify' 
                ? 'bg-gradient-to-r from-pink-500 to-rose-500' 
                : 'bg-white/5 border-white/10'
              }
            >
              <Music2 className="w-4 h-4 mr-2" />
              Identificar
            </Button>
          </div>
        </div>

        {/* Conteúdo baseado no modo */}
        {mode === 'listen' && (
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-white">Ouvir e Cantar Junto</h4>
            <p className="text-gray-400 text-sm">
              Clique em cada grau para ouvir. Tente cantar junto dizendo o nome do grau (1, 2, 3...)
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SCALE_DEGREES.slice(0, scaleNotes.length).map((degree, index) => (
                <button
                  key={degree}
                  onClick={() => playDegree(index)}
                  disabled={isPlaying}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-pink-400/50 transition-all"
                >
                  <div className="text-2xl font-bold text-pink-400 mb-1">{degree}</div>
                  <div className="text-xs text-gray-400">{DEGREE_NAMES[index]}</div>
                  <div className="text-sm text-white mt-1">{scaleNotes[index]}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'sing' && (
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-white">Cantar os Graus</h4>
            <p className="text-gray-400 text-sm">
              Toque cada nota e cante o grau correspondente. Exemplo: "Um, Dois, Três..."
            </p>
            
            <div className="p-6 bg-pink-500/10 rounded-xl border border-pink-400/30 text-center">
              <p className="text-3xl font-bold text-pink-400 mb-2">
                {currentDegree > 0 ? SCALE_DEGREES[currentDegree - 1] : '—'}
              </p>
              <p className="text-white text-sm">
                {currentDegree > 0 ? DEGREE_NAMES[currentDegree - 1] : 'Clique para começar'}
              </p>
            </div>

            <Button
              onClick={() => playDegree(0)}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500"
            >
              Tocar Tônica e Cantar "Um"
            </Button>
          </div>
        )}

        {mode === 'identify' && (
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-white">Identificar Graus</h4>
            <p className="text-gray-400 text-sm">
              Ouça a nota e tente identificar qual grau da escala é. Clique em "Tocar Nota" para começar.
            </p>
            
            <Button
              onClick={playRandomDegree}
              disabled={isPlaying}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-lg py-6"
            >
              <Music2 className="w-5 h-5 mr-2" />
              Tocar Nota Aleatória
            </Button>

            <AnimatePresence>
              {showAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-6 bg-green-500/20 rounded-xl border border-green-400/30"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <span className="text-lg font-bold text-white">Resposta:</span>
                  </div>
                  <p className="text-2xl font-bold text-green-400">
                    Grau {SCALE_DEGREES[currentDegree]} - {DEGREE_NAMES[currentDegree]}
                  </p>
                  <p className="text-white mt-2">Nota: {scaleNotes[currentDegree]}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-6 p-4 rounded-xl bg-pink-500/10 border border-pink-400/30">
          <p className="text-sm text-pink-300">
            <strong>💡 Dica:</strong> Comece cantando apenas os graus (1, 2, 3...). Depois, tente cantar 
            os nomes das notas. Isso desenvolve sua percepção auditiva rapidamente!
          </p>
        </div>
      </div>
    </div>
  );
}
