import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Guitar,
  Volume2,
  CheckCircle2,
  ArrowRight,
  Play,
  Pause,
  Zap,
  Star,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  instruction: string;
  completed: boolean;
  skippable: boolean;
  autoAdvance?: boolean;
  duration?: number; // segundos
}

export interface OnboardingState {
  currentStep: number;
  steps: OnboardingStep[];
  isActive: boolean;
  completed: boolean;
  startTime: number;
}

interface HandsOnOnboardingProps {
  onComplete: () => void;
  onStepComplete?: (stepId: string) => void;
  onSkip?: () => void;
  tunerComponent?: React.ReactNode;
  className?: string;
}

export function HandsOnOnboarding({
  onComplete,
  onStepComplete,
  onSkip,
  tunerComponent,
  className = ''
}: HandsOnOnboardingProps) {
  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    isActive: true,
    completed: false,
    startTime: Date.now(),
    steps: [
      {
        id: 'welcome',
        title: 'Bem-vindo ao MusicTutor!',
        description: 'Vamos começar afinando seu instrumento. Isso é fundamental para uma boa experiência musical.',
        instruction: 'Toque uma corda do seu violão ou guitarra.',
        completed: false,
        skippable: false,
        autoAdvance: false,
        duration: 5
      },
      {
        id: 'tune_string',
        title: 'Afine a corda',
        description: 'Ajuste a tensão da corda até que o indicador mostre que está afinada.',
        instruction: 'Gire as tarraxas para ajustar a afinação.',
        completed: false,
        skippable: true,
        autoAdvance: false,
        duration: 30
      },
      {
        id: 'play_note',
        title: 'Toque uma nota',
        description: 'Agora que está afinado, toque uma nota e veja como o app responde.',
        instruction: 'Toque qualquer corda afinada.',
        completed: false,
        skippable: true,
        autoAdvance: true,
        duration: 10
      },
      {
        id: 'first_chord',
        title: 'Primeiro acorde',
        description: 'Vamos tentar formar um acorde simples.',
        instruction: 'Posicione os dedos conforme mostrado e toque todas as cordas.',
        completed: false,
        skippable: true,
        autoAdvance: false,
        duration: 20
      },
      {
        id: 'success',
        title: 'Parabéns!',
        description: 'Você concluiu o onboarding básico. Agora você está pronto para explorar todas as funcionalidades.',
        instruction: 'Continue praticando e descobrindo novas músicas!',
        completed: false,
        skippable: false,
        autoAdvance: false
      }
    ]
  });

  const [showTuner, setShowTuner] = useState(false);
  const [stepStartTime, setStepStartTime] = useState(Date.now());

  const currentStep = state.steps[state.currentStep];
  const progress = ((state.currentStep + 1) / state.steps.length) * 100;

  // Auto-advance timer
  useEffect(() => {
    if (!currentStep?.autoAdvance || !currentStep?.duration) return;

    const timer = setTimeout(() => {
      if (!currentStep.completed) {
        completeStep();
      }
    }, currentStep.duration * 1000);

    return () => clearTimeout(timer);
  }, [currentStep, stepStartTime]);

  // Step transition effects
  useEffect(() => {
    setStepStartTime(Date.now());
  }, [state.currentStep]);

  const completeStep = () => {
    // Feedback sonoro de avanço de etapa
    import('@/services/ActionFeedbackService').then(({ actionFeedbackService }) => {
      actionFeedbackService.playActionFeedback('step_progress');
    });
    
    setState(prev => {
      const newSteps = [...prev.steps];
      newSteps[prev.currentStep].completed = true;

      const nextStep = prev.currentStep + 1;

      if (nextStep >= prev.steps.length) {
        // Onboarding completo
        setTimeout(() => onComplete(), 1000);
        return {
          ...prev,
          steps: newSteps,
          completed: true,
          isActive: false
        };
      }

      onStepComplete?.(newSteps[prev.currentStep].id);

      return {
        ...prev,
        currentStep: nextStep,
        steps: newSteps
      };
    });
  };

  const skipStep = () => {
    if (!currentStep?.skippable) return;
    completeStep();
  };

  const startTuner = () => {
    setShowTuner(true);
    // Simular detecção de toque na corda após 2 segundos
    setTimeout(() => {
      completeStep();
    }, 2000);
  };

  const getStepIcon = (stepId: string) => {
    switch (stepId) {
      case 'welcome': return <Guitar className="w-6 h-6" />;
      case 'tune_string': return <Volume2 className="w-6 h-6" />;
      case 'play_note': return <Play className="w-6 h-6" />;
      case 'first_chord': return <Target className="w-6 h-6" />;
      case 'success': return <Star className="w-6 h-6" />;
      default: return <CheckCircle2 className="w-6 h-6" />;
    }
  };

  const getStepColor = (stepId: string) => {
    switch (stepId) {
      case 'welcome': return 'from-blue-500 to-cyan-500';
      case 'tune_string': return 'from-yellow-500 to-orange-500';
      case 'play_note': return 'from-green-500 to-emerald-500';
      case 'first_chord': return 'from-purple-500 to-pink-500';
      case 'success': return 'from-yellow-500 to-yellow-400';
      default: return 'from-gray-500 to-gray-400';
    }
  };

  if (!state.isActive) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm ${className}`}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <AnimatePresence mode="wait">
          {!showTuner ? (
            <motion.div
              key="onboarding"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md"
            >
              <Card className="bg-adaptive-surface border-adaptive-border">
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${getStepColor(currentStep.id)} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                      {getStepIcon(currentStep.id)}
                    </div>
                  </div>

                  <CardTitle className="text-adaptive-text text-xl mb-2">
                    {currentStep.title}
                  </CardTitle>

                  <p className="text-adaptive-textSecondary text-sm">
                    {currentStep.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-adaptive-textSecondary">Progresso</span>
                      <span className="text-adaptive-text font-bold">
                        {state.currentStep + 1} de {state.steps.length}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Instruction */}
                  <div className="bg-adaptive-surface/50 rounded-lg p-4 border border-adaptive-border">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-adaptive-accent rounded-full mt-2 flex-shrink-0" />
                      <p className="text-adaptive-text text-sm leading-relaxed">
                        {currentStep.instruction}
                      </p>
                    </div>
                  </div>

                  {/* Step indicators */}
                  <div className="flex items-center justify-center gap-2">
                    {state.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className={`w-3 h-3 rounded-full transition-all ${
                          index < state.currentStep
                            ? 'bg-green-500'
                            : index === state.currentStep
                            ? 'bg-adaptive-accent animate-pulse'
                            : 'bg-adaptive-surface'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {currentStep.id === 'welcome' && (
                      <Button
                        onClick={startTuner}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                        size="lg"
                      >
                        <Guitar className="w-5 h-5 mr-2" />
                        Começar Afinação
                      </Button>
                    )}

                    {currentStep.id === 'tune_string' && (
                      <div className="flex gap-2 w-full">
                        <Button
                          onClick={skipStep}
                          variant="outline"
                          className="flex-1"
                          disabled={!currentStep.skippable}
                        >
                          Pular
                        </Button>
                        <Button
                          onClick={completeStep}
                          className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Concluído
                        </Button>
                      </div>
                    )}

                    {currentStep.id === 'first_chord' && (
                      <div className="flex gap-2 w-full">
                        <Button
                          onClick={skipStep}
                          variant="outline"
                          className="flex-1"
                          disabled={!currentStep.skippable}
                        >
                          Pular
                        </Button>
                        <Button
                          onClick={completeStep}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Primeiro Acorde!
                        </Button>
                      </div>
                    )}

                    {currentStep.id === 'success' && (
                      <Button
                        onClick={completeStep}
                        className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black font-bold"
                        size="lg"
                      >
                        <Star className="w-5 h-5 mr-2" />
                        Começar a Praticar!
                      </Button>
                    )}

                    {currentStep.autoAdvance && (
                      <div className="w-full text-center">
                        <p className="text-xs text-adaptive-textSecondary mb-2">
                          Avançando automaticamente em alguns segundos...
                        </p>
                        <Button
                          onClick={completeStep}
                          variant="outline"
                          size="sm"
                        >
                          Avançar Agora
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Skip option */}
                  {currentStep.skippable && currentStep.id !== 'welcome' && (
                    <div className="text-center">
                      <button
                        onClick={onSkip}
                        className="text-xs text-adaptive-textSecondary hover:text-adaptive-text underline"
                      >
                        Pular onboarding completo
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="tuner"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md"
            >
              <Card className="bg-adaptive-surface border-adaptive-border">
                <CardHeader>
                  <CardTitle className="text-adaptive-text text-center flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Afinador Automático
                  </CardTitle>
                  <p className="text-adaptive-textSecondary text-sm text-center">
                    Toque uma corda para começar
                  </p>
                </CardHeader>

                <CardContent>
                  {/* Placeholder para o componente de tuner */}
                  <div className="text-center py-8">
                    <div className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center mb-4">
                      <Guitar className="w-12 h-12 text-yellow-400 animate-pulse" />
                    </div>

                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-adaptive-text">
                        Toque uma corda
                      </div>
                      <div className="text-sm text-adaptive-textSecondary">
                        Estamos detectando a frequência...
                      </div>
                    </div>

                    {/* Simulação visual de afinação */}
                    <div className="mt-6 space-y-2">
                      <div className="text-xs text-adaptive-textSecondary">Status da corda</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-adaptive-surface rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
                            initial={{ width: '30%' }}
                            animate={{ width: '70%' }}
                            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                          />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Ajustando...
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {tunerComponent && (
                    <div className="mt-4">
                      {tunerComponent}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Hook para gerenciar estado do onboarding
export function useHandsOnOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Verificar se o usuário já completou o onboarding
    const completed = localStorage.getItem('musictutor_onboarding_completed');
    setHasCompletedOnboarding(completed === 'true');

    // Mostrar onboarding se for a primeira vez
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('musictutor_onboarding_completed', 'true');
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
  };

  const skipOnboarding = () => {
    setShowOnboarding(false);
  };

  return {
    hasCompletedOnboarding,
    showOnboarding,
    completeOnboarding,
    skipOnboarding,
    restartOnboarding: () => {
      localStorage.removeItem('musictutor_onboarding_completed');
      setHasCompletedOnboarding(false);
      setShowOnboarding(true);
    }
  };
}
