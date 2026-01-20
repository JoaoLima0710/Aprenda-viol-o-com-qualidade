/**
 * Onboarding Completo do MusicTutor
 * 4 Etapas: Boas-vindas + nível, Tour guiado, Primeiro exercício, Configuração
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Music,
  Target,
  BookOpen,
  Settings,
  X,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  Play,
  Bell,
  Trophy
} from 'lucide-react';
import { useUserStore } from '@/stores/useUserStore';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { Link } from 'wouter';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
}

interface UserGoals {
  mainObjective: string;
  dailyTime: number;
  experience: string;
  favoriteGenres: string[];
  hasInstrument: boolean;
}

interface CompleteOnboardingProps {
  onComplete: (goals: UserGoals) => void;
  onSkip: () => void;
}

export function CompleteOnboarding({ onComplete, onSkip }: CompleteOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userLevel, setUserLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [goals, setGoals] = useState<UserGoals>({
    mainObjective: '',
    dailyTime: 20,
    experience: 'none',
    favoriteGenres: [],
    hasInstrument: true
  });
  const [tourStep, setTourStep] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [showPlacementTest, setShowPlacementTest] = useState(false);
  const [placementTestCompleted, setPlacementTestCompleted] = useState(false);

  const handlePlacementTestComplete = (level: PlacementLevel, score: number) => {
    // Aplicar resultado do teste
    import('@/stores/useTheoryProgressionStore').then(({ useTheoryProgressionStore }) => {
      useTheoryProgressionStore.getState().applyPlacementTest(level, score);
    });
    
    import('@/stores/useProgressionStore').then(({ useProgressionStore }) => {
      useProgressionStore.getState().applyPlacementTest(level, score);
    });
    
    setUserLevel(level);
    setPlacementTestCompleted(true);
    setShowPlacementTest(false);
  };

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo ao MusicTutor! 🎸',
      description: 'Vamos configurar sua experiência de aprendizado',
      component: (
        <WelcomeStep 
          level={userLevel} 
          onLevelSelect={setUserLevel}
          onTakePlacementTest={() => setShowPlacementTest(true)}
          placementTestCompleted={placementTestCompleted}
        />
      )
    },
    {
      id: 'goals',
      title: 'Conte-nos sobre seus objetivos',
      description: 'Isso nos ajuda a personalizar seu treino',
      component: <GoalsQuestionnaire goals={goals} onGoalsChange={setGoals} />
    },
    {
      id: 'tour',
      title: 'Conheça a interface',
      description: 'Vamos fazer um tour rápido pelas principais funcionalidades',
      component: <InterfaceTour step={tourStep} onStepChange={setTourStep} onComplete={() => setShowTour(false)} />
    },
    {
      id: 'first-exercise',
      title: 'Primeiro exercício prático',
      description: 'Vamos tocar seu primeiro acorde!',
      component: <FirstExerciseStep />
    },
    {
      id: 'setup',
      title: 'Configuração final',
      description: 'Configure suas preferências e metas',
      component: <SetupStep goals={goals} />
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    // Salvar preferências
    localStorage.setItem('musictutor_onboarding_completed', 'true');
    localStorage.setItem('musictutor_user_level', userLevel);
    localStorage.setItem('musictutor_user_goals', JSON.stringify(goals));
    localStorage.setItem('musictutor_first_access', 'false');
    
    // Atualizar store
    const userStore = useUserStore.getState();
    userStore.updateUser({ level: userLevel });
    
    onComplete(goals);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-gradient-to-br from-purple-900/90 to-blue-900/90 rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
      >
        {/* Header */}
        <div className="relative p-6 border-b border-white/10">
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{currentStepData.title}</h2>
              <p className="text-white/70 text-sm">{currentStepData.description}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-white/60">
              <span>Etapa {currentStep + 1} de {steps.length}</span>
              <span>{Math.round(progress)}% completo</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStepData.component}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="text-white/70 hover:text-white"
          >
            Pular
          </Button>
          
          <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
          >
            {currentStep === steps.length - 1 ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Começar
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
      
      {/* Modal de Teste de Nivelamento */}
      <AnimatePresence>
        {showPlacementTest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowPlacementTest(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-3xl bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Teste de Nivelamento</h2>
                  <button
                    onClick={() => setShowPlacementTest(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <PlacementTest
                  onComplete={handlePlacementTestComplete}
                  onSkip={() => setShowPlacementTest(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Etapa 1: Boas-vindas e seleção de nível
function WelcomeStep({
  level,
  onLevelSelect,
  onTakePlacementTest,
  placementTestCompleted
}: {
  level: 'beginner' | 'intermediate' | 'advanced';
  onLevelSelect: (level: 'beginner' | 'intermediate' | 'advanced') => void;
  onTakePlacementTest?: () => void;
  placementTestCompleted?: boolean;
}) {
  const levels = [
    {
      id: 'beginner' as const,
      title: 'Iniciante',
      description: 'Estou começando do zero',
      icon: Sparkles,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'intermediate' as const,
      title: 'Intermediário',
      description: 'Já tenho alguma experiência',
      icon: GraduationCap,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'advanced' as const,
      title: 'Avançado',
      description: 'Quero refinar minha técnica',
      icon: Trophy,
      color: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="space-y-4">
      <p className="text-white/80 text-center mb-6">
        Selecione seu nível atual para personalizarmos seu aprendizado
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {levels.map((lvl) => {
          const Icon = lvl.icon;
          const isSelected = level === lvl.id;
          
          return (
            <motion.button
              key={lvl.id}
              onClick={() => onLevelSelect(lvl.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-6 rounded-xl border-2 transition-all ${
                isSelected
                  ? `bg-gradient-to-br ${lvl.color} border-white shadow-lg`
                  : 'bg-white/5 border-white/20 hover:border-white/40'
              }`}
            >
              <Icon className={`w-8 h-8 mb-3 ${isSelected ? 'text-white' : 'text-white/60'}`} />
              <h3 className={`font-bold text-lg mb-1 ${isSelected ? 'text-white' : 'text-white/90'}`}>
                {lvl.title}
              </h3>
              <p className={`text-sm ${isSelected ? 'text-white/90' : 'text-white/60'}`}>
                {lvl.description}
              </p>
              {isSelected && (
                <CheckCircle2 className="w-5 h-5 text-white mt-2 mx-auto" />
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Teste de Nivelamento Opcional */}
      <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-white mb-1">🎯 Não tem certeza do seu nível?</h4>
            <p className="text-sm text-gray-300">
              Faça nosso teste de nivelamento (10 questões) para determinar automaticamente seu nível inicial
            </p>
          </div>
          {!placementTestCompleted && onTakePlacementTest && (
            <Button
              onClick={onTakePlacementTest}
              variant="outline"
              className="ml-4 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
            >
              <Target className="w-4 h-4 mr-2" />
              Fazer Teste
            </Button>
          )}
          {placementTestCompleted && (
            <Badge variant="outline" className="ml-4 border-green-500/30 text-green-400">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Teste Concluído
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// Etapa 2: Questionário de objetivos
function GoalsQuestionnaire({
  goals,
  onGoalsChange
}: {
  goals: UserGoals;
  onGoalsChange: (goals: UserGoals) => void;
}) {
  const objectives = [
    { id: 'songs', label: 'Aprender músicas específicas', icon: Music },
    { id: 'improvise', label: 'Improvisar e criar', icon: Sparkles },
    { id: 'band', label: 'Tocar em banda', icon: Music },
    { id: 'theory', label: 'Entender teoria musical', icon: BookOpen },
    { id: 'fun', label: 'Tocar por diversão', icon: Play }
  ];

  const genres = [
    'MPB', 'Rock', 'Sertanejo', 'Bossa Nova', 'Samba', 'Blues', 'Jazz', 'Pop'
  ];

  const updateGoals = (updates: Partial<UserGoals>) => {
    onGoalsChange({ ...goals, ...updates });
  };

  return (
    <div className="space-y-6">
      {/* Objetivo Principal */}
      <div>
        <label className="block text-white font-semibold mb-3">
          Qual seu objetivo principal?
        </label>
        <div className="grid grid-cols-1 gap-2">
          {objectives.map((obj) => {
            const Icon = obj.icon;
            const isSelected = goals.mainObjective === obj.id;
            
            return (
              <button
                key={obj.id}
                onClick={() => updateGoals({ mainObjective: obj.id })}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'bg-purple-500/30 border-purple-400'
                    : 'bg-white/5 border-white/20 hover:border-white/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-purple-300' : 'text-white/60'}`} />
                  <span className={isSelected ? 'text-white font-medium' : 'text-white/80'}>
                    {obj.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tempo Diário */}
      <div>
        <label className="block text-white font-semibold mb-3">
          Quanto tempo você tem por dia? ({goals.dailyTime} minutos)
        </label>
        <input
          type="range"
          min="10"
          max="120"
          step="10"
          value={goals.dailyTime}
          onChange={(e) => updateGoals({ dailyTime: parseInt(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-white/60 mt-1">
          <span>10 min</span>
          <span>120 min</span>
        </div>
      </div>

      {/* Experiência */}
      <div>
        <label className="block text-white font-semibold mb-3">
          Qual sua experiência prévia?
        </label>
        <select
          value={goals.experience}
          onChange={(e) => updateGoals({ experience: e.target.value })}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
        >
          <option value="none">Nenhuma</option>
          <option value="some">Alguma (outro instrumento)</option>
          <option value="guitar">Já toquei violão antes</option>
        </select>
      </div>

      {/* Gêneros Favoritos */}
      <div>
        <label className="block text-white font-semibold mb-3">
          Quais gêneros você mais gosta? (selecione múltiplos)
        </label>
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => {
            const isSelected = goals.favoriteGenres.includes(genre);
            return (
              <button
                key={genre}
                onClick={() => {
                  const newGenres = isSelected
                    ? goals.favoriteGenres.filter(g => g !== genre)
                    : [...goals.favoriteGenres, genre];
                  updateGoals({ favoriteGenres: newGenres });
                }}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  isSelected
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tem Instrumento */}
      <div>
        <label className="block text-white font-semibold mb-3">
          Você já tem um violão/guitarra?
        </label>
        <div className="flex gap-4">
          <button
            onClick={() => updateGoals({ hasInstrument: true })}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              goals.hasInstrument
                ? 'bg-green-500/30 border-green-400 text-white'
                : 'bg-white/5 border-white/20 text-white/80'
            }`}
          >
            Sim, já tenho
          </button>
          <button
            onClick={() => updateGoals({ hasInstrument: false })}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              !goals.hasInstrument
                ? 'bg-orange-500/30 border-orange-400 text-white'
                : 'bg-white/5 border-white/20 text-white/80'
            }`}
          >
            Ainda não
          </button>
        </div>
      </div>
    </div>
  );
}

// Etapa 3: Tour pela interface
function InterfaceTour({
  step,
  onStepChange,
  onComplete
}: {
  step: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
}) {
  const tourSteps = [
    {
      title: 'Sidebar de Navegação',
      description: 'Aqui você acessa todas as seções: Acordes, Escalas, Músicas, Prática e muito mais!',
      highlight: 'sidebar'
    },
    {
      title: 'Treino do Dia',
      description: 'Seu treino personalizado aparece aqui. Complete para ganhar XP e manter seu streak!',
      highlight: 'daily-training'
    },
    {
      title: 'Meta Diária',
      description: 'Acompanhe seu progresso diário e veja quanto falta para bater sua meta.',
      highlight: 'daily-goal'
    },
    {
      title: 'Assistente IA',
      description: 'Tire dúvidas, peça recomendações e receba feedback personalizado do nosso tutor virtual.',
      highlight: 'ai-assistant'
    }
  ];

  const currentTour = tourSteps[step];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">{currentTour.title}</h3>
        <p className="text-white/70">{currentTour.description}</p>
      </div>

      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
        <div className="flex items-center justify-center h-32 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Target className="w-8 h-8 text-white" />
          </div>
        </div>
        <p className="text-white/60 text-sm text-center">
          {step < tourSteps.length - 1
            ? 'Clique em "Continuar" para ver o próximo elemento'
            : 'Você completou o tour! Agora conhece os principais elementos da interface.'}
        </p>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {tourSteps.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === step ? 'w-8 bg-purple-400' : 'w-2 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Etapa 4: Primeiro exercício prático
function FirstExerciseStep() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
          <Play className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Vamos tocar o acorde C!</h3>
        <p className="text-white/70">
          Este é um dos acordes mais importantes. Vamos aprender juntos.
        </p>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">C</div>
              <p className="text-white/60">Acorde Dó Maior</p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/80 text-sm mb-3 font-semibold">Posição dos dedos:</p>
              <ul className="space-y-2 text-white/70 text-sm">
                <li>• Corda 5 (A): 3ª casa com dedo 3</li>
                <li>• Corda 4 (D): 2ª casa com dedo 2</li>
                <li>• Corda 3 (G): Solta (sem pressionar)</li>
                <li>• Corda 2 (B): 1ª casa com dedo 1</li>
                <li>• Corda 1 (E): Solta</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1 bg-green-500 hover:bg-green-600">
                <Play className="w-4 h-4 mr-2" />
                Ouvir o som
              </Button>
              <Link href="/chords">
                <Button variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10">
                  Ver diagrama completo
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-4">
        <p className="text-blue-200 text-sm">
          💡 <strong>Dica:</strong> Pratique este acorde algumas vezes antes de continuar. 
          Não se preocupe se não sair perfeito na primeira tentativa!
        </p>
      </div>
    </div>
  );
}

// Etapa 5: Configuração final
function SetupStep({ goals }: { goals: UserGoals }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(goals.dailyTime);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Settings className="w-12 h-12 text-white/60 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-white mb-2">Últimos ajustes</h3>
        <p className="text-white/70">Configure suas preferências</p>
      </div>

      {/* Meta Diária */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5" />
            Meta Diária de Prática
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-white/80 mb-2">
                Minutos por dia: <span className="font-bold text-white">{dailyGoal}</span>
              </label>
              <input
                type="range"
                min="10"
                max="120"
                step="10"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>10 min</span>
                <span>120 min</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Lembretes de prática</p>
              <p className="text-white/60 text-sm">Receba notificações para não esquecer de praticar</p>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`w-12 h-6 rounded-full transition-colors ${
                notificationsEnabled ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-4 border border-white/10">
        <p className="text-white/90 text-sm">
          ✅ Seu perfil está configurado! Você receberá treinos personalizados baseados em seus objetivos.
        </p>
      </div>
    </div>
  );
}

// Hook para gerenciar onboarding completo
export function useCompleteOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('musictutor_onboarding_completed');
    const firstAccess = localStorage.getItem('musictutor_first_access');
    
    if (!completed && firstAccess !== 'false') {
      // Primeiro acesso - mostrar onboarding
      setShowOnboarding(true);
      localStorage.setItem('musictutor_first_access', 'true');
    }
    
    setIsCompleted(completed === 'true');
  }, []);

  const completeOnboarding = (goals: UserGoals) => {
    localStorage.setItem('musictutor_onboarding_completed', 'true');
    setShowOnboarding(false);
    setIsCompleted(true);
  };

  const skipOnboarding = () => {
    localStorage.setItem('musictutor_onboarding_completed', 'true');
    localStorage.setItem('musictutor_first_access', 'false');
    setShowOnboarding(false);
    setIsCompleted(true);
  };

  return {
    showOnboarding,
    isCompleted,
    completeOnboarding,
    skipOnboarding
  };
}
