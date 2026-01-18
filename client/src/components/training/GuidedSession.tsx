import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Target,
  Zap,
  Music,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionStep {
  id: string;
  type: 'warmup' | 'skill' | 'application' | 'closure';
  title: string;
  description: string;
  duration: number; // segundos
  content: React.ReactNode;
  completed: boolean;
}

interface GuidedSessionProps {
  onComplete: (results: SessionResults) => void;
  onExit: () => void;
}

interface SessionResults {
  totalTime: number;
  stepsCompleted: number;
  accuracy: number;
  skillsPracticed: string[];
}

export function GuidedSession({ onComplete, onExit }: GuidedSessionProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [stepStartTime, setStepStartTime] = useState<Date | null>(null);
  const [results, setResults] = useState<SessionResults>({
    totalTime: 0,
    stepsCompleted: 0,
    accuracy: 0,
    skillsPracticed: []
  });

  // Sessão estruturada: Aquecimento → Habilidades → Aplicação → Fechamento
  const sessionSteps: SessionStep[] = [
    {
      id: 'warmup',
      type: 'warmup',
      title: 'Aquecimento',
      description: 'Prepare seu instrumento e corpo',
      duration: 60,
      completed: false,
      content: (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Aquecimento</h3>
            <p className="text-gray-400 mb-4">
              Toque algumas cordas soltas, faça alongamentos e respire profundamente.
              Isso ajuda na precisão e reduz tensão.
            </p>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-sm text-gray-300">
                💡 <strong>Dica:</strong> Comece tocando cada corda 4 vezes,
                depois faça algumas escalas simples devagar.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'skill1',
      type: 'skill',
      title: 'Troca de Acordes',
      description: 'Pratique transições suaves',
      duration: 180,
      completed: false,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <Target className="w-12 h-12 text-blue-400 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-white">Troca de Acordes</h3>
            <p className="text-gray-400">Mantenha o ritmo constante em 80 BPM</p>
          </div>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="text-center font-mono text-xl text-white mb-4">
                <span className="text-blue-400">C</span>
                <ArrowRight className="inline mx-2 text-gray-400" />
                <span className="text-purple-400">G</span>
                <ArrowRight className="inline mx-2 text-gray-400" />
                <span className="text-green-400">Am</span>
                <ArrowRight className="inline mx-2 text-gray-400" />
                <span className="text-orange-400">F</span>
              </div>
              <p className="text-sm text-gray-400 text-center">
                4 batidas por acorde, repita 3 vezes
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">80</div>
              <div className="text-xs text-gray-400">BPM</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">12</div>
              <div className="text-xs text-gray-400">Tentativas</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'skill2',
      type: 'skill',
      title: 'Ritmo Básico',
      description: 'Mantenha o tempo constante',
      duration: 120,
      completed: false,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <Music className="w-12 h-12 text-green-400 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-white">Ritmo Básico</h3>
            <p className="text-gray-400">Toque no tempo do metrônomo</p>
          </div>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="text-center text-6xl font-mono text-green-400 mb-2">
                ♩ ♪ ♩ ♪
              </div>
              <p className="text-sm text-gray-400 text-center">
                Dedilhado alternado: baixo - cima - baixo - cima
              </p>
            </CardContent>
          </Card>

          <div className="text-center">
            <Badge variant="outline" className="text-green-400 border-green-400">
              <Play className="w-3 h-3 mr-1" />
              Metrônomo Ativo
            </Badge>
          </div>
        </div>
      )
    },
    {
      id: 'application',
      type: 'application',
      title: 'Aplique na Música',
      description: 'Toque um trecho real',
      duration: 240,
      completed: false,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <Music className="w-12 h-12 text-purple-400 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-white">Aplique na Música</h3>
            <p className="text-gray-400">Toque o início de "Tempo Perdido"</p>
          </div>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="text-left font-mono text-sm text-white leading-relaxed">
                <div className="mb-2">
                  <span className="text-purple-400 mr-4">Em</span>
                  Tudo que eu queria
                </div>
                <div className="mb-2">
                  <span className="text-blue-400 mr-4">C</span>
                  Era poder te ver
                </div>
                <div className="mb-2">
                  <span className="text-green-400 mr-4">G</span>
                  Tudo que eu sonhava
                </div>
                <div className="mb-2">
                  <span className="text-orange-400 mr-4">D</span>
                  Era ter você por perto
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-purple-400">Em</div>
              <div className="text-xs text-gray-400">Atual</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-400">C</div>
              <div className="text-xs text-gray-400">Próximo</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">80</div>
              <div className="text-xs text-gray-400">BPM</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'closure',
      type: 'closure',
      title: 'Fechamento',
      description: 'Revise seu progresso',
      duration: 30,
      completed: false,
      content: (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Sessão Concluída!</h3>
            <p className="text-gray-400 mb-4">
              Parabéns! Você praticou por {Math.round(results.totalTime / 60)} minutos
              e desenvolveu novas habilidades.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold text-green-400">
                    {results.accuracy}%
                  </div>
                  <div className="text-xs text-gray-400">Precisão</div>
                </CardContent>
              </Card>

              <Card className="bg-blue-500/10 border-blue-500/30">
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold text-blue-400">
                    {results.stepsCompleted}
                  </div>
                  <div className="text-xs text-gray-400">Etapas</div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-sm text-gray-300 mb-2">
                <strong>Próximo passo:</strong>
              </p>
              <p className="text-sm text-gray-400">
                Amanhã continue praticando estas habilidades.
                Que tal tocar a música completa?
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStep = sessionSteps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / sessionSteps.length) * 100;

  // Timer para avançar automaticamente em passos curtos
  useEffect(() => {
    if (!isPlaying || !currentStep) return;

    const timer = setTimeout(() => {
      if (currentStepIndex < sessionSteps.length - 1) {
        nextStep();
      } else {
        completeSession();
      }
    }, currentStep.duration * 1000);

    return () => clearTimeout(timer);
  }, [currentStepIndex, isPlaying, currentStep]);

  const startSession = () => {
    setIsPlaying(true);
    setSessionStartTime(new Date());
    setStepStartTime(new Date());
  };

  const pauseSession = () => {
    setIsPlaying(false);
  };

  const nextStep = () => {
    if (currentStepIndex < sessionSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setStepStartTime(new Date());
    } else {
      completeSession();
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setStepStartTime(new Date());
    }
  };

  const completeSession = () => {
    setIsPlaying(false);
    const endTime = new Date();
    const totalTime = sessionStartTime ?
      (endTime.getTime() - sessionStartTime.getTime()) / 1000 : 0;

    const finalResults: SessionResults = {
      totalTime,
      stepsCompleted: currentStepIndex + 1,
      accuracy: 85, // Simulado - viria do sistema de detecção
      skillsPracticed: ['chord_changes', 'rhythm', 'application']
    };

    setResults(finalResults);
    onComplete(finalResults);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeRemaining = () => {
    if (!currentStep || !stepStartTime) return currentStep?.duration || 0;

    const elapsed = (new Date().getTime() - stepStartTime.getTime()) / 1000;
    return Math.max(0, currentStep.duration - elapsed);
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0f0f1a]/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-bold text-white">Sessão Guiada</h1>
            <p className="text-sm text-gray-400">
              {currentStepIndex + 1} de {sessionSteps.length} etapas
            </p>
          </div>
          <Button onClick={onExit} variant="ghost" size="sm">
            ✕
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-4">
          <Progress value={progress} className="h-2 mb-2" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">{currentStep?.title}</span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400 font-mono">
                {formatTime(getTimeRemaining())}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-center gap-2 mb-6">
          {sessionSteps.map((step, index) => (
            <div
              key={step.id}
              className={`w-3 h-3 rounded-full transition-all ${
                index < currentStepIndex
                  ? 'bg-green-500'
                  : index === currentStepIndex
                  ? 'bg-purple-500 animate-pulse'
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep?.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="fixed bottom-16 left-4 right-4">
        <Card className="bg-[#0f0f1a]/95 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                onClick={previousStep}
                disabled={currentStepIndex === 0}
                variant="outline"
                size="sm"
              >
                Anterior
              </Button>

              {!isPlaying ? (
                <Button
                  onClick={startSession}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {currentStepIndex === 0 ? 'Começar Sessão' : 'Continuar'}
                </Button>
              ) : (
                <Button
                  onClick={pauseSession}
                  variant="outline"
                  size="lg"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pausar
                </Button>
              )}

              <Button
                onClick={nextStep}
                disabled={currentStepIndex >= sessionSteps.length - 1}
                variant="outline"
                size="sm"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {isPlaying && (
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-400">
                  Avançando automaticamente em {formatTime(getTimeRemaining())}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}