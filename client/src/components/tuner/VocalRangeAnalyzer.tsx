import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Play, RotateCcw, Music2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { VocalCompatibilityService, SongRecommendation } from '@/services/VocalCompatibilityService';
import { songs } from '@/data/songs';
import { FrequencySpectrum } from './FrequencySpectrum';
import { VocalExercises } from './VocalExercises';

interface VocalRange {
  lowestNote: string;
  lowestFreq: number;
  lowestOctave: number;
  highestNote: string;
  highestFreq: number;
  highestOctave: number;
  rangeInSemitones: number;
  rangeInOctaves: number;
  classification: string;
}

interface RecommendedSong {
  id: string;
  title: string;
  artist: string;
  lowestNote: string;
  highestNote: string;
  compatibility: number;
}

export function VocalRangeAnalyzer() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const isRecordingRef = useRef(false);
  const phaseRef = useRef<'idle' | 'lowest' | 'highest' | 'complete'>('idle');
  
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const [currentNote, setCurrentNote] = useState<{ note: string; freq: number; octave: number } | null>(null);
  const [lowestDetected, setLowestDetected] = useState<{ note: string; freq: number; octave: number } | null>(null);
  const [highestDetected, setHighestDetected] = useState<{ note: string; freq: number; octave: number } | null>(null);
  const [vocalRange, setVocalRange] = useState<VocalRange | null>(null);
  const [, navigate] = useLocation();
  const [recommendedSongs, setRecommendedSongs] = useState<SongRecommendation[]>([]);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'idle' | 'lowest' | 'highest' | 'complete'>('idle');
  
  // Sincronizar refs com state
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);
  
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const startAnalyzer = async () => {
    try {
      setError('');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsActive(true);
      detectPitch();
      
      console.log('🎤 Vocal range analyzer started');
    } catch (err) {
      console.error('❌ Error starting analyzer:', err);
      setError('Não foi possível acessar o microfone');
    }
  };

  const stopAnalyzer = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setIsActive(false);
    setIsRecording(false);
    setCurrentNote(null);
    
    console.log('🛑 Vocal range analyzer stopped');
  };

  const detectPitch = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const buffer = new Float32Array(bufferLength);

    const detect = () => {
      animationRef.current = requestAnimationFrame(detect);
      
      analyser.getFloatTimeDomainData(buffer);
      
      const frequency = autoCorrelate(buffer, audioContextRef.current!.sampleRate);
      
      if (frequency > 0 && isRecordingRef.current) {
        const noteInfo = frequencyToNote(frequency);
        setCurrentNote(noteInfo);
        
        // Update lowest/highest during recording
        if (phaseRef.current === 'lowest') {
          if (!lowestDetected || frequency < lowestDetected.freq) {
            setLowestDetected(noteInfo);
          }
        } else if (phaseRef.current === 'highest') {
          if (!highestDetected || frequency > highestDetected.freq) {
            setHighestDetected(noteInfo);
          }
        }
      }
    };

    detect();
  };

  const autoCorrelate = (buffer: Float32Array, sampleRate: number): number => {
    let size = buffer.length;
    let maxSamples = Math.floor(size / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;

    for (let i = 0; i < size; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / size);
    
    if (rms < 0.01) return -1;

    let lastCorrelation = 1;
    for (let offset = 0; offset < maxSamples; offset++) {
      let correlation = 0;

      for (let i = 0; i < maxSamples; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }

      correlation = 1 - correlation / maxSamples;
      
      if (correlation > 0.9 && correlation > lastCorrelation) {
        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestOffset = offset;
        }
      }
      
      lastCorrelation = correlation;
    }

    if (bestCorrelation > 0.01 && bestOffset > -1) {
      return sampleRate / bestOffset;
    }
    
    return -1;
  };

  const frequencyToNote = (frequency: number) => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);
    
    const halfSteps = 12 * Math.log2(frequency / C0);
    const octave = Math.floor(halfSteps / 12);
    const noteIndex = Math.round(halfSteps % 12);
    const note = noteNames[noteIndex];
    
    return { note, freq: frequency, octave };
  };

  const startLowestTest = async () => {
    if (!isActive) {
      await startAnalyzer();
    }
    setPhase('lowest');
    setIsRecording(true);
    setLowestDetected(null);
  };

  const finishLowestTest = () => {
    setIsRecording(false);
    if (lowestDetected) {
      setPhase('highest');
    }
  };

  const startHighestTest = () => {
    setIsRecording(true);
    setHighestDetected(null);
  };

  const finishHighestTest = () => {
    setIsRecording(false);
    if (highestDetected && lowestDetected) {
      calculateVocalRange();
    }
  };

  const calculateVocalRange = () => {
    if (!lowestDetected || !highestDetected) return;

    const semitones = Math.round(12 * Math.log2(highestDetected.freq / lowestDetected.freq));
    const octaves = semitones / 12;

    let classification = '';
    if (octaves < 1.5) classification = 'Limitada';
    else if (octaves < 2) classification = 'Média';
    else if (octaves < 2.5) classification = 'Boa';
    else if (octaves < 3) classification = 'Muito Boa';
    else classification = 'Excepcional';

    const range: VocalRange = {
      lowestNote: `${lowestDetected.note}${lowestDetected.octave}`,
      lowestFreq: lowestDetected.freq,
      lowestOctave: lowestDetected.octave,
      highestNote: `${highestDetected.note}${highestDetected.octave}`,
      highestFreq: highestDetected.freq,
      highestOctave: highestDetected.octave,
      rangeInSemitones: semitones,
      rangeInOctaves: parseFloat(octaves.toFixed(2)),
      classification,
    };

    setVocalRange(range);
    setPhase('complete');
    recommendSongs(range);
  };

  const recommendSongs = (range: VocalRange) => {
    // Usar serviço real de compatibilidade vocal
    const userRange = {
      lowestNote: range.lowestNote,
      highestNote: range.highestNote,
      rangeInSemitones: range.rangeInSemitones,
    };

    const recommendations = VocalCompatibilityService.getRecommendations(
      userRange,
      songs,
      5 // Top 5 músicas mais compatíveis
    );

    setRecommendedSongs(recommendations);
  };

  const reset = () => {
    setPhase('idle');
    setLowestDetected(null);
    setHighestDetected(null);
    setVocalRange(null);
    setRecommendedSongs([]);
    setCurrentNote(null);
  };

  useEffect(() => {
    return () => {
      stopAnalyzer();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              🎤 Avaliador de Extensão Vocal
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Descubra sua extensão vocal e receba recomendações de músicas
            </p>
          </div>
          
          <div className="flex gap-2">
            {phase !== 'idle' && (
              <Button
                onClick={reset}
                variant="outline"
                className="text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reiniciar
              </Button>
            )}
            <Button
              onClick={isActive ? stopAnalyzer : startAnalyzer}
              className={`${
                isActive
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  : 'bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:from-[#0891b2] hover:to-[#06b6d4]'
              } text-white shadow-lg`}
            >
              {isActive ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  Parar
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Iniciar
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <Mic className="w-20 h-20 mx-auto mb-4 text-gray-400" />
              <h4 className="text-xl font-bold text-white mb-2">Como funciona?</h4>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Vamos testar sua nota mais grave e mais aguda para calcular sua extensão vocal completa
              </p>
              <Button
                onClick={startLowestTest}
                className="bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white text-lg px-8 py-6"
              >
                <Play className="w-5 h-5 mr-2" />
                Começar Teste
              </Button>
              <p className="text-xs text-gray-500 mt-4">O microfone será ativado automaticamente</p>
            </motion.div>
          )}

          {phase === 'lowest' && (
            <motion.div
              key="lowest"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="py-8"
            >
              <div className="text-center mb-8">
                <h4 className="text-2xl font-bold text-white mb-2">Nota Mais Grave</h4>
                <p className="text-gray-400">Cante a nota mais grave que você consegue</p>
              </div>
              
              {/* Visualização de Espectro */}
              <div className="mb-6">
                <FrequencySpectrum analyser={analyserRef.current} isActive={isActive} />
              </div>

              <div className="text-center mb-6">
                {currentNote ? (
                  <>
                    <div className="text-8xl font-bold text-cyan-400 mb-2 animate-pulse">
                      {currentNote.note}{currentNote.octave}
                    </div>
                    <div className="text-2xl text-gray-300">
                      {currentNote.freq.toFixed(2)} Hz
                    </div>
                    {isRecording && (
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-red-400 font-semibold">GRAVANDO...</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-4xl text-gray-500 mb-2">
                    Aguardando voz...
                  </div>
                )}
              </div>

              {lowestDetected && (
                <div className="text-center mb-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Nota mais grave detectada:</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    {lowestDetected.note}{lowestDetected.octave} ({lowestDetected.freq.toFixed(2)} Hz)
                  </p>
                </div>
              )}

              <div className="flex justify-center gap-4">
                {!isRecording ? (
                  <Button
                    onClick={startLowestTest}
                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Gravar Nota Grave
                  </Button>
                ) : (
                  <Button
                    onClick={finishLowestTest}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white"
                  >
                    ✓ Confirmar e Próximo
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {phase === 'highest' && (
            <motion.div
              key="highest"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="py-8"
            >
              <div className="text-center mb-6">
                <h4 className="text-2xl font-bold text-white mb-2">Nota Mais Aguda</h4>
                <p className="text-gray-400">Cante a nota mais aguda que você consegue</p>
              </div>
              
              {/* Visualização de Espectro */}
              <div className="mb-6">
                <FrequencySpectrum analyser={analyserRef.current} isActive={isActive} />
              </div>

              <div className="text-center mb-6">
                {currentNote ? (
                  <>
                    <div className="text-8xl font-bold text-orange-400 mb-2 animate-pulse">
                      {currentNote.note}{currentNote.octave}
                    </div>
                    <div className="text-2xl text-gray-300">
                      {currentNote.freq.toFixed(2)} Hz
                    </div>
                    {isRecording && (
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-red-400 font-semibold">GRAVANDO...</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-4xl text-gray-500 mb-2">
                    Aguardando voz...
                  </div>
                )}
              </div>

              {highestDetected && (
                <div className="text-center mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Nota mais aguda detectada:</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {highestDetected.note}{highestDetected.octave} ({highestDetected.freq.toFixed(2)} Hz)
                  </p>
                </div>
              )}

              <div className="flex justify-center gap-4">
                {!isRecording ? (
                  <Button
                    onClick={startHighestTest}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Gravar Nota Aguda
                  </Button>
                ) : (
                  <Button
                    onClick={finishHighestTest}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white"
                  >
                    ✓ Finalizar Análise
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {phase === 'complete' && vocalRange && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-8"
            >
              <div className="text-center mb-8">
                <h4 className="text-3xl font-bold text-white mb-2">🎉 Análise Completa!</h4>
                <p className="text-xl text-gray-300">Sua Extensão Vocal</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                  <p className="text-sm text-gray-400 mb-2">Nota Mais Grave</p>
                  <p className="text-4xl font-bold text-cyan-400">{vocalRange.lowestNote}</p>
                  <p className="text-sm text-gray-400 mt-1">{vocalRange.lowestFreq.toFixed(2)} Hz</p>
                </div>

                <div className="p-6 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                  <p className="text-sm text-gray-400 mb-2">Nota Mais Aguda</p>
                  <p className="text-4xl font-bold text-orange-400">{vocalRange.highestNote}</p>
                  <p className="text-sm text-gray-400 mt-1">{vocalRange.highestFreq.toFixed(2)} Hz</p>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl mb-8">
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-2">Extensão Total</p>
                  <p className="text-5xl font-bold text-white mb-2">
                    {vocalRange.rangeInOctaves} oitavas
                  </p>
                  <p className="text-xl text-gray-300 mb-4">
                    ({vocalRange.rangeInSemitones} semitons)
                  </p>
                  <div className="inline-block px-6 py-2 bg-white/10 rounded-full">
                    <p className="text-lg font-semibold text-purple-400">
                      Classificação: {vocalRange.classification}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommended Songs */}
              {recommendedSongs.length > 0 && (
                <div>
                  <h5 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Music2 className="w-5 h-5 text-[#06b6d4]" />
                    Músicas Recomendadas para Você
                  </h5>
                  <div className="space-y-3">
                    {recommendedSongs.map((rec) => (
                      <Link key={rec.song.id} href={`/songs/${rec.song.id}`}>
                        <div className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-cyan-400/50 transition-all cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-white">{rec.song.title}</p>
                              <p className="text-sm text-gray-400">{rec.song.artist}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Extensão: {rec.song.vocalRange?.lowestNote} - {rec.song.vocalRange?.highestNote}
                              </p>
                              <p className="text-xs text-cyan-400 mt-1">{rec.reason}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-400">
                                {rec.compatibility}%
                              </div>
                              <p className="text-xs text-gray-400">compatível</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Vocal Exercises */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <VocalExercises 
                  vocalRange={{
                    lowestNote: vocalRange.lowestNote,
                    highestNote: vocalRange.highestNote,
                    lowestFreq: vocalRange.lowestFreq,
                    highestFreq: vocalRange.highestFreq,
                  }}
                  analyser={analyserRef.current}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
