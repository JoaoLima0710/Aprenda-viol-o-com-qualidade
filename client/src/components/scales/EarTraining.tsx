/**
 * 🎵 Ear Training Component
 * 
 * Baseado em r/guitarlessons: "Singing/ear training associado à execução"
 * Cantar ou dizer o grau da escala enquanto toca
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Volume2, Music2, CheckCircle, RotateCcw, Settings } from 'lucide-react';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { motion, AnimatePresence } from 'framer-motion';
import { STIMULUS_DURATIONS } from '@/services/AuditoryStimulusConfig';

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
  const [autoReplay, setAutoReplay] = useState(false);
  const [replayCountdown, setReplayCountdown] = useState(0);

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
    setReplayCountdown(0);
    
    try {
      // CRÍTICO para tablets: Garantir inicialização primeiro
      await unifiedAudioService.ensureInitialized();
      // Delay extra para tablets garantirem AudioContext ativo
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const note = scaleNotes[degree];
      console.log('🎵 [Ear Training] Tocando grau', degree + 1, ':', note);
      // Duração padronizada para máxima clareza auditiva
      await unifiedAudioService.playNote(`${note}4`, STIMULUS_DURATIONS.singleNote);
      
      // Auto-replay após 3 segundos se habilitado
      if (autoReplay) {
        setReplayCountdown(3);
        const countdown = setInterval(() => {
          setReplayCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdown);
              playDegree(degree); // Replay
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
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
            
            {/* Indicador de Reprodução */}
            {isPlaying && (
              <div className="p-4 rounded-xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center gap-3 mb-4">
                <Volume2 className="w-5 h-5 text-pink-300 animate-pulse" />
                <span className="text-pink-300 font-semibold">🔊 Reproduzindo...</span>
                {replayCountdown > 0 && (
                  <span className="text-pink-200 text-sm">
                    (Repetindo em {replayCountdown}s)
                  </span>
                )}
              </div>
            )}

            {/* Controles de Áudio */}
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentDegree >= 0 && currentDegree < scaleNotes.length) {
                    playDegree(currentDegree);
                  }
                }}
                disabled={isPlaying}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                🔁 Ouvir Novamente
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoReplay(!autoReplay)}
                className={`${autoReplay ? 'bg-pink-500/20 border-pink-400/40' : 'bg-white/5 border-white/10'} text-white`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Auto-replay: {autoReplay ? 'ON' : 'OFF'}
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SCALE_DEGREES.slice(0, scaleNotes.length).map((degree, index) => {
                const isCurrent = isPlaying && currentDegree === index;
                return (
                  <button
                    key={degree}
                    onClick={() => playDegree(index)}
                    disabled={isPlaying}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isCurrent
                        ? 'bg-pink-500/30 border-pink-400 scale-105'
                        : 'bg-white/5 border-white/10 hover:border-pink-400/50'
                    }`}
                  >
                    <div className="text-2xl font-bold text-pink-400 mb-1">{degree}</div>
                    <div className="text-xs text-gray-400">{DEGREE_NAMES[index]}</div>
                    <div className="text-sm text-white mt-1">{scaleNotes[index]}</div>
                    {isCurrent && (
                      <div className="mt-2 flex items-center justify-center">
                        <Volume2 className="w-4 h-4 text-pink-300 animate-pulse" />
                      </div>
                    )}
                  </button>
                );
              })}
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
