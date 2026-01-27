import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { PageLayout } from '@/components/layout/PageLayout';
import {
  Metronome,
  PitchDetector,
  SpectrumVisualizer,
  EarTraining,
  EssentialIntervalTraining,
  MajorMinorChordTraining,
  ActiveRhythmTraining,
  ShortTermMemoryTraining,
  ActiveAuditoryPerception,
  PhysicalPreparation,
  ContextualEarTraining,
  TranscriptionExercise,
  ChordProgressionPractice,
  RhythmTraining,
  MotorCoordinationExercises,
  GuidedTrainingSession,
} from '@/components/practice';
import { RealtimeChordDetector } from '@/components/chord-detection/RealtimeChordDetector';
import { AdaptiveDifficultyRecommendations } from '@/components/adaptive/AdaptiveDifficultyRecommendations';
import { PracticeMetrics } from '@/components/practice/PracticeMetrics';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useUserStore } from '@/stores/useUserStore';
import { usePracticeUnlockStore, PRACTICE_EXERCISES } from '@/stores/usePracticeUnlockStore';
import { Clock, Target, Zap, Activity, Lock, Unlock, BookOpen, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { autoSaveService } from '@/services/AutoSaveService';
import { ResumeSessionModal } from '@/components/practice/ResumeSessionModal';

export default function Practice() {
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [, setLocation] = useLocation();

  const { xp, level, xpToNextLevel, currentStreak } = useGamificationStore();
  const { user } = useUserStore();
  const {
    isExerciseUnlocked,
    getUnlockedExercises,
    getLockedExercises,
  } = usePracticeUnlockStore();

  const userName = user?.name || "Usuário";

  const unlockedExercises = getUnlockedExercises();
  const lockedExercises = getLockedExercises();

  // Verificar sessão salva ao montar
  useEffect(() => {
    const lastSession = autoSaveService.getLastSession();
    if (lastSession) {
      setShowResumeModal(true);
    }

    // Iniciar nova sessão
    autoSaveService.startSession('/practice', {
      type: 'practice',
      accuracy: 0,
      duration: 0,
      timestamp: Date.now()
    });

    // Limpar ao desmontar
    return () => {
      autoSaveService.endSession();
    };
  }, []);

  // Atualizar sessão periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      autoSaveService.updateSession({
        duration: Date.now() - (Date.now() - 60000) // Placeholder - implementar lógica real
      });
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  // Removed explicit Sidebar/Mobile imports usage as PageLayout handles them

  // NOTE: We keep specific mobile/desktop content differences by using utility classes 
  // inside the PageLayout children, rather than full tree duplication.

  return (
    <>
      <PageLayout>
        {/* Modal de Retomar Sessão */}
        {showResumeModal && (() => {
          const lastSession = autoSaveService.getLastSession();
          if (!lastSession) return null;
          return (
            <ResumeSessionModal
              session={lastSession}
              onResume={() => setShowResumeModal(false)}
              onDismiss={() => {
                autoSaveService.clearSessions();
                setShowResumeModal(false);
              }}
            />
          );
        })()}

        <div className="max-w-4xl mx-auto p-5 lg:p-8 space-y-6 lg:space-y-8">
          {/* Header */}
          <header className="lg:mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 lg:w-8 lg:h-8 text-[#06b6d4]" />
              <h1 className="text-2xl lg:text-4xl font-bold text-white">Ferramentas de Prática</h1>
            </div>
            <p className="text-sm lg:text-base text-gray-400">Metrônomo e outras ferramentas para melhorar sua prática</p>
          </header>

          {/* Métricas de Progresso - Only desktop had this explicitly in the audit, let's keep it visible for all but ensure responsive */}
          <section className="hidden lg:block">
            <PracticeMetrics practiceType="general" />
          </section>

          {/* On Mobile, metrics section might have been simpler or omitted in original code, 
                but unifying it improves checking stats on mobile. 
                We can add it back for mobile if desired, but sticking to original content logic for safety:
                Original Mobile didn't show PracticeMetrics. We will keep it hidden on mobile for now to match verified state.
             */}

          {/* Preparação Física */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 lg:w-6 lg:h-6 text-orange-400" />
              <h2 className="text-xl lg:text-2xl font-bold text-white">Preparação Física</h2>
              <Badge variant="outline" className="border-orange-500/30 text-orange-400 text-xs">
                Recomendado
              </Badge>
            </div>
            <PhysicalPreparation />
          </section>

          {/* Real-time Chord Practice - Featured (Desktop) 
                Mobile didn't have this "Featured" card at top in the original code, 
                it only listed exercises. We can make it responsive.
            */}
          <section className="hidden lg:block">
            <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-white">Prática Inteligente de Acordes</CardTitle>
                      <p className="text-gray-400">Detecção em tempo real com feedback instantâneo</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setLocation('/chord-practice')}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    size="lg"
                  >
                    <Target className="w-5 h-5 mr-2" />
                    Começar Prática
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-green-400 text-sm">✓</span>
                    </div>
                    <p className="text-sm text-gray-300">Feedback Instantâneo</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-blue-400 text-sm">🎯</span>
                    </div>
                    <p className="text-sm text-gray-300">Correções Específicas</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-purple-400 text-sm">🎸</span>
                    </div>
                    <p className="text-sm text-gray-300">Adaptação ao Nível</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Exercícios Práticos Desbloqueados */}
          {unlockedExercises.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Unlock className="w-5 h-5 lg:w-6 lg:h-6 text-green-400" />
                <h2 className="text-xl lg:text-2xl font-bold text-white">Exercícios Desbloqueados</h2>
                <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">
                  {unlockedExercises.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRACTICE_EXERCISES
                  .filter(ex => unlockedExercises.includes(ex.id))
                  .map((exercise) => (
                    <Card
                      key={exercise.id}
                      className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 hover:border-green-500/50 transition-all cursor-pointer"
                      onClick={() => {
                        if (exercise.id === 'interval-practice') {
                          setLocation('/practice?exercise=intervals');
                        } else if (exercise.id === 'scale-improv') {
                          setLocation('/scales?mode=improv');
                        } else if (exercise.id === 'chord-voicings') {
                          setLocation('/chords?mode=voicings');
                        } else if (exercise.id === 'progression-play') {
                          setLocation('/songs?mode=progressions');
                        } else if (exercise.id.startsWith('ear-')) {
                          const type = exercise.id.replace('ear-', '');
                          setLocation(`/practice?ear-training=${type}`);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-green-500/20">
                          <Play className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-white mb-1">{exercise.name}</h3>
                          <p className="text-sm text-gray-300 mb-2">{exercise.description}</p>
                          <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">
                            Desbloqueado
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Exercícios Bloqueados */}
          {lockedExercises.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400" />
                <h2 className="text-xl lg:text-2xl font-bold text-white">Exercícios Bloqueados</h2>
                <Badge variant="outline" className="border-gray-500/30 text-gray-400 text-xs">
                  {lockedExercises.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lockedExercises.slice(0, 4).map(({ exercise, missingRequirement }) => (
                  <Card
                    key={exercise.id}
                    className="p-4 bg-gray-800/50 border-gray-700/50 opacity-60 cursor-not-allowed"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-gray-700/50">
                        <Lock className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-400 mb-1">{exercise.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{exercise.description}</p>
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                          <div className="flex items-start gap-2">
                            <BookOpen className="w-4 h-4 text-amber-400 mt-0.5" />
                            <p className="text-xs text-gray-400">
                              <strong className="text-amber-400">Req:</strong> {missingRequirement}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 
               --- UNIFIED COMPONENTS LIST ---
               Here we list all the practice components. 
               The original file had many of these repeated for mobile/desktop. 
               We simply render them once here, they are mostly responsive internally or fit in the column.
            */}

          {/* Sessão de Treino Guiada */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl lg:text-2xl font-bold text-white">🎓 Sessão de Treino Guiada</h2>
              <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                Recomendado
              </Badge>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Siga um treino completo passo a passo.
            </p>
            <GuidedTrainingSession onComplete={() => console.log('Sessão concluída')} />
          </div>

          {/* Recomendações (Desktop mostly, but good for mobile too) */}
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">📊 Recomendações Personalizadas</h2>
            <AdaptiveDifficultyRecommendations />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column (or Stacked on Mobile) */}
            <div className="space-y-8">
              {/* Treino de Ouvido Contextual */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl lg:text-2xl font-bold text-white">🎵 Treino de Ouvido Contextual</h2>
                </div>
                <ContextualEarTraining />
              </div>

              {/* Transcription */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl lg:text-2xl font-bold text-white">🎼 Exercícios de Transcrição</h2>
                </div>
                <TranscriptionExercise />
              </div>

              {/* Chord Progression */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl lg:text-2xl font-bold text-white">🎸 Treino de Troca de Acordes</h2>
                </div>
                <ChordProgressionPractice onComplete={() => { }} />
              </div>
            </div>

            {/* Right Column (or Stacked on Mobile) */}
            <div className="space-y-8">
              {/* Rhythm Training */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl lg:text-2xl font-bold text-white">🥁 Treino Rítmico</h2>
                </div>
                <RhythmTraining onComplete={() => { }} />
              </div>

              {/* Motor Coordination */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl lg:text-2xl font-bold text-white">🏃 Coordenação Motora</h2>
                </div>
                <MotorCoordinationExercises onComplete={() => { }} />
              </div>

              {/* Active Auditory (Rhythm) */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl lg:text-2xl font-bold text-white">👏 Ritmo Auditivo Ativo</h2>
                </div>
                <ActiveRhythmTraining />
              </div>
            </div>
          </div>

          {/* Tools & Basics Section */}
          <div className="space-y-8">
            {/* Intervalos Essenciais */}
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">🎯 Intervalos Essenciais</h2>
              <EssentialIntervalTraining />
            </div>

            {/* Acordes Maior x Menor */}
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">🎸 Acordes: Alegre x Triste</h2>
              <MajorMinorChordTraining />
            </div>

            {/* Memória Auditiva */}
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">🧠 Memória Auditiva Curta</h2>
              <ShortTermMemoryTraining />
            </div>

            {/* Active Auditory Perception */}
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">🎵 Percepção Auditiva Ativa</h2>
              <ActiveAuditoryPerception />
            </div>

            {/* Ear Training */}
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">🎵 Treino de Ouvido Clássico</h2>
              <EarTraining />
            </div>

            {/* Tools */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">Metrônomo</h2>
                <Metronome />
              </div>
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">Detector de Pitch</h2>
                <PitchDetector />
              </div>
            </div>

            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">Visualizador de Espectro</h2>
              <SpectrumVisualizer />
            </div>
          </div>

          {/* Tips Section */}
          <div className="rounded-2xl p-6 bg-[#1a1a2e]/60 backdrop-blur-xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">💡 Dicas para Usar o Metrônomo</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center text-white text-sm font-bold">1</span>
                <span><strong className="text-white">Comece devagar:</strong> Inicie com um BPM baixo (60-80).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center text-white text-sm font-bold">2</span>
                <span><strong className="text-white">Consistência:</strong> Use em todas as práticas.</span>
              </li>
            </ul>
          </div>

        </div>
      </PageLayout>
    </>
  );
}
