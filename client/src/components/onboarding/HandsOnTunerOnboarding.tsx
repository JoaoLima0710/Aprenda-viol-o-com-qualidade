import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Guitar,
  Mic,
  Volume2,
  CheckCircle2,
  X,
  Zap,
  ArrowRight,
  Play,
  Pause,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioFeedbackSystem, useAudioFeedback } from '@/components/audio/AudioFeedbackSystem';

interface HandsOnTunerOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

type OnboardingStep = 'welcome' | 'instrument' | 'audio_setup' | 'tune_test' | 'success';

export function HandsOnTunerOnboarding({ onComplete, onSkip }: HandsOnTunerOnboardingProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [selectedInstrument, setSelectedInstrument] = useState<'guitar' | 'bass' | null>(null);
  const [audioGranted, setAudioGranted] = useState(false);
  const [tuningAttempts, setTuningAttempts] = useState(0);

  const {
    signal,
    isListening,
    startListening,
    stopListening,
    requestPermission
  } = useAudioFeedback();

  // Auto-progressão baseada em ações do usuário
  useEffect(() => {
    if (currentStep === 'audio_setup' && audioGranted) {
      setTimeout(() => setCurrentStep('tune_test'), 1000);
    }
  }, [audioGranted, currentStep]);

  useEffect(() => {
    if (currentStep === 'tune_test' && tuningAttempts >= 2) {
      setTimeout(() => setCurrentStep('success'), 2000);
    }
  }, [tuningAttempts, currentStep]);

  const handleInstrumentSelect = (instrument: 'guitar' | 'bass') => {
    setSelectedInstrument(instrument);
    setCurrentStep('audio_setup');
  };

  const handleAudioSetup = async () => {
    const granted = await requestPermission();
    setAudioGranted(granted);

    if (granted) {
      startListening();
    }
  };

  const handleTuneAttempt = () => {
    setTuningAttempts(prev => prev + 1);
    // Simular feedback háptico
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  const handleComplete = () => {
    stopListening();
    onComplete();
  };

  const getStepProgress = () => {
    const steps = ['welcome', 'instrument', 'audio_setup', 'tune_test', 'success'];
    return ((steps.indexOf(currentStep) + 1) / steps.length) * 100;
  };

  const renderWelcomeStep = () => (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="text-center space-y-6"
    >
      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
        <Guitar className="w-10 h-10 text-white" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Bem-vindo ao MusicTutor!
        </h2>
        <p className="text-gray-400 mb-6">
          Vamos começar afinando seu instrumento. Isso leva menos de 2 minutos e garante que tudo funcione perfeitamente.
        </p>

        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span>Dica: Tenha seu instrumento em mãos</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={onSkip} variant="outline" className="flex-1">
          Pular por enquanto
        </Button>
        <Button
          onClick={() => setCurrentStep('instrument')}
          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
        >
          Vamos começar!
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );

  const renderInstrumentStep = () => (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -50, opacity: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">
          Qual instrumento você vai tocar?
        </h2>
        <p className="text-gray-400">
          Isso ajuda a configurar tudo corretamente
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card
          className={`cursor-pointer transition-all ${
            selectedInstrument === 'guitar'
              ? 'bg-purple-500/20 border-purple-400 ring-2 ring-purple-400/50'
              : 'bg-white/5 border-white/10 hover:border-white/20'
          }`}
          onClick={() => handleInstrumentSelect('guitar')}
        >
          <CardContent className="p-4 text-center">
            <Guitar className="w-12 h-12 text-purple-400 mx-auto mb-2" />
            <h3 className="font-semibold text-white mb-1">Violão/Guitarra</h3>
            <p className="text-sm text-gray-400">6 cordas, afinação padrão Mi-La-Ré-Sol-Si-Mi</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            selectedInstrument === 'bass'
              ? 'bg-blue-500/20 border-blue-400 ring-2 ring-blue-400/50'
              : 'bg-white/5 border-white/10 hover:border-white/20'
          }`}
          onClick={() => handleInstrumentSelect('bass')}
        >
          <CardContent className="p-4 text-center">
            <Guitar className="w-12 h-12 text-blue-400 mx-auto mb-2" />
            <h3 className="font-semibold text-white mb-1">Baixo</h3>
            <p className="text-sm text-gray-400">4 cordas, afinação Mi-La-Ré-Sol</p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );

  const renderAudioSetupStep = () => (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -50, opacity: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mic className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Permissão para usar o microfone
        </h2>
        <p className="text-gray-400 mb-6">
          Precisamos acessar seu microfone para detectar as notas e te dar feedback em tempo real.
        </p>
      </div>

      <div className="bg-white/5 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-white mb-2">O que isso permite:</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Detectar se você está tocando a nota certa</li>
          <li>• Medir precisão e timing</li>
          <li>• Dar feedback personalizado</li>
          <li>• Funciona apenas quando você está praticando</li>
        </ul>
      </div>

      {!audioGranted ? (
        <Button
          onClick={handleAudioSetup}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500"
          size="lg"
        >
          <Mic className="w-5 h-5 mr-2" />
          Permitir acesso ao microfone
        </Button>
      ) : (
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <span className="text-green-400 font-semibold">Microfone configurado!</span>
          </div>
          <p className="text-sm text-gray-400">
            Avançando automaticamente...
          </p>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={onSkip}
          className="text-sm text-gray-500 underline hover:text-gray-400"
        >
          Configurar depois
        </button>
      </div>
    </motion.div>
  );

  const renderTuneTestStep = () => (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -50, opacity: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">
          Teste de Afinação
        </h2>
        <p className="text-gray-400 mb-6">
          Toque qualquer corda do seu {selectedInstrument === 'guitar' ? 'violão' : 'baixo'} para testar se tudo está funcionando.
        </p>
      </div>

      {/* Audio Feedback System */}
      <AudioFeedbackSystem
        signal={signal}
        isListening={isListening}
        onPermissionRequest={requestPermission}
        onRetry={() => startListening()}
        showDetailed={true}
      />

      {/* Tuner Simulation */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-center flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Detector de Afinação
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-4xl font-mono text-white mb-4">
            {signal.quality === 'none' ? '--' : signal.pitch ? `${Math.round(signal.pitch)} Hz` : '--'}
          </div>

          <div className="flex justify-center gap-2 mb-4">
            <Badge variant="outline" className={
              signal.quality === 'strong' || signal.quality === 'good' ? 'border-green-400 text-green-400' :
              signal.quality === 'ok' ? 'border-yellow-400 text-yellow-400' :
              'border-red-400 text-red-400'
            }>
              {signal.quality === 'strong' || signal.quality === 'good' ? 'Afinado!' :
               signal.quality === 'ok' ? 'Quase lá' :
               signal.quality === 'weak' ? 'Muito baixo' : 'Toque uma corda'}
            </Badge>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-400">Tentativas: {tuningAttempts}/2</p>
            <Progress value={(tuningAttempts / 2) * 100} className="h-2" />
          </div>

          {tuningAttempts >= 2 && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Perfeito! Tudo funcionando.</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleTuneAttempt} variant="outline" className="flex-1">
          <Play className="w-4 h-4 mr-2" />
          Testar Afinação
        </Button>
        <Button onClick={onSkip} variant="outline" className="flex-1">
          Pular teste
        </Button>
      </div>
    </motion.div>
  );

  const renderSuccessStep = () => (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="text-center space-y-6"
    >
      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10 text-white" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Tudo pronto! 🎸
        </h2>
        <p className="text-gray-400 mb-6">
          Seu {selectedInstrument === 'guitar' ? 'violão' : 'baixo'} está configurado e o MusicTutor está funcionando perfeitamente.
        </p>

        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-white mb-2">O que você pode fazer agora:</h4>
          <ul className="text-sm text-gray-300 space-y-1 text-left">
            <li>• Praticar exercícios personalizados</li>
            <li>• Aprender músicas com acompanhamento</li>
            <li>• Melhorar sua técnica com feedback em tempo real</li>
            <li>• Acompanhar seu progresso diário</li>
          </ul>
        </div>
      </div>

      <Button
        onClick={handleComplete}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
        size="lg"
      >
        Começar a tocar!
        <Play className="w-5 h-5 ml-2" />
      </Button>
    </motion.div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'instrument':
        return renderInstrumentStep();
      case 'audio_setup':
        return renderAudioSetupStep();
      case 'tune_test':
        return renderTuneTestStep();
      case 'success':
        return renderSuccessStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Header with progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-white">Configuração Inicial</h1>
              <Button onClick={onSkip} variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <Progress value={getStepProgress()} className="h-2 mb-2" />
            <div className="text-xs text-gray-400 text-center">
              {Math.round(getStepProgress())}% concluído
            </div>
          </div>

          {/* Main content */}
          <Card className="bg-[#0f0f1a] border-white/20">
            <CardContent className="p-6">
              <AnimatePresence mode="wait">
                {renderCurrentStep()}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Footer hint */}
          <div className="text-center mt-4">
            <p className="text-xs text-gray-500">
              Este processo leva menos de 2 minutos e garante a melhor experiência
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook para gerenciar o estado do onboarding
export function useHandsOnTunerOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Verificar se já foi completado
    const completed = localStorage.getItem('musictutor_hands_on_onboarding_completed');
    const hasSkipped = localStorage.getItem('musictutor_onboarding_skipped');

    if (!completed && !hasSkipped) {
      // Pequeno delay para não aparecer imediatamente
      setTimeout(() => setShowOnboarding(true), 1000);
    }

    setIsCompleted(completed === 'true');
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('musictutor_hands_on_onboarding_completed', 'true');
    setShowOnboarding(false);
    setIsCompleted(true);
  };

  const skipOnboarding = () => {
    localStorage.setItem('musictutor_onboarding_skipped', 'true');
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('musictutor_hands_on_onboarding_completed');
    localStorage.removeItem('musictutor_onboarding_skipped');
    setIsCompleted(false);
    setShowOnboarding(true);
  };

  return {
    showOnboarding,
    isCompleted,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding
  };
}