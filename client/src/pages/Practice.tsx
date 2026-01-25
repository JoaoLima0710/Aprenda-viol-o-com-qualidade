import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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
  
  return (
    <>
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

      {/* DESKTOP VERSION */}
      <div className="hidden lg:flex h-screen bg-[#0f0f1a] text-white overflow-hidden">
        <Sidebar 
          userName={userName}
          userLevel={level}
          currentXP={xp}
          xpToNextLevel={xpToNextLevel}
          streak={currentStreak}
        />
        
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8 space-y-8">
            {/* Header */}
            <header>
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-8 h-8 text-[#06b6d4]" />
                <h1 className="text-4xl font-bold text-white">Ferramentas de Prática</h1>
              </div>
              <p className="text-gray-400">Metrônomo e outras ferramentas para melhorar sua prática</p>
            </header>

            {/* Métricas de Progresso */}
            <section>
              <PracticeMetrics practiceType="general" />
            </section>

            {/* Preparação Física - Recomendado para Iniciantes */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-6 h-6 text-orange-400" />
                <h2 className="text-2xl font-bold text-white">Preparação Física</h2>
                <Badge variant="outline" className="border-orange-500/30 text-orange-400 text-xs">
                  Recomendado
                </Badge>
              </div>
              <PhysicalPreparation />
            </section>

            {/* Real-time Chord Practice - Featured */}
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
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Como Funciona:</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Toque um acorde e receba feedback visual imediato</li>
                    <li>• Veja quais cordas estão corretas (verde) ou precisam ajuste (vermelho)</li>
                    <li>• Receba sugestões específicas para correção</li>
                    <li>• Progrida através de níveis de dificuldade adaptativos</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Exercícios Práticos Desbloqueados */}
            {unlockedExercises.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Unlock className="w-6 h-6 text-green-400" />
                  <h2 className="text-2xl font-bold text-white">Exercícios Práticos Desbloqueados</h2>
                  <Badge variant="outline" className="border-green-500/30 text-green-400">
                    {unlockedExercises.length} disponíveis
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {PRACTICE_EXERCISES
                    .filter(ex => unlockedExercises.includes(ex.id))
                    .map((exercise) => (
                      <Card
                        key={exercise.id}
                        className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 hover:border-green-500/50 transition-all cursor-pointer"
                        onClick={() => {
                          // Navegar para exercício específico
                          if (exercise.id === 'interval-practice') {
                            setLocation('/practice?exercise=intervals');
                          } else if (exercise.id === 'scale-improv') {
                            setLocation('/scales?mode=improv');
                          } else if (exercise.id === 'chord-voicings') {
                            setLocation('/chords?mode=voicings');
                          } else if (exercise.id === 'progression-play') {
                            setLocation('/songs?mode=progressions');
                          } else if (exercise.id.startsWith('ear-')) {
                            // Focar no treino de ouvido
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

            {/* Exercícios Práticos Bloqueados */}
            {lockedExercises.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-6 h-6 text-gray-400" />
                  <h2 className="text-2xl font-bold text-white">Exercícios Práticos Bloqueados</h2>
                  <Badge variant="outline" className="border-gray-500/30 text-gray-400">
                    {lockedExercises.length} bloqueados
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {lockedExercises.map(({ exercise, missingRequirement }) => (
                    <Card
                      key={exercise.id}
                      className="p-4 bg-gray-800/50 border-gray-700/50 opacity-60 cursor-not-allowed"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-gray-700/50">
                          <Lock className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-400">{exercise.name}</h3>
                            <Lock className="w-4 h-4 text-gray-500" />
                          </div>
                          <p className="text-sm text-gray-500 mb-2">{exercise.description}</p>
                          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                            <div className="flex items-start gap-2">
                              <BookOpen className="w-4 h-4 text-amber-400 mt-0.5" />
                              <p className="text-xs text-gray-400">
                                <strong className="text-amber-400">Requisito:</strong> {missingRequirement}
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

            {/* Sessão de Treino Guiada */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-bold text-white">🎓 Sessão de Treino Guiada</h2>
                <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                  Recomendado
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Siga um treino completo passo a passo, como um professor ao seu lado. Começo, meio e fim claros.
              </p>
              <GuidedTrainingSession
                onComplete={() => {
                  console.log('Sessão guiada concluída!');
                }}
              />
            </div>

            {/* Recomendações de Dificuldade Adaptativa */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">📊 Recomendações Personalizadas</h2>
              <AdaptiveDifficultyRecommendations />
            </div>

            {/* Treino de Ouvido Contextual */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-bold text-white">🎵 Treino de Ouvido Contextual</h2>
                <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                  Novo
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Identifique progressões de acordes em músicas reais
              </p>
              <ContextualEarTraining />
            </div>

            {/* Transcription Exercise */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-bold text-white">🎼 Exercícios de Transcrição</h2>
                <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-xs">
                  Novo
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Ouça a melodia e reproduza no seu violão
              </p>
              <TranscriptionExercise />
            </div>

            {/* Chord Progression Practice */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-bold text-white">🎸 Treino de Troca de Acordes</h2>
                <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">
                  Novo
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Pratique progressões reais com metrônomo. Desenvolva velocidade e antecipação motora.
              </p>
              <ChordProgressionPractice
                onComplete={(accuracy, finalBpm) => {
                  console.log(`Prática concluída: ${accuracy}% de precisão a ${finalBpm} BPM`);
                }}
              />
            </div>

            {/* Rhythm Training */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-bold text-white">🥁 Treino Rítmico</h2>
                <Badge variant="outline" className="border-orange-500/30 text-orange-400 text-xs">
                  Novo
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Desenvolva seu pulso interno e precisão rítmica. Pratique palmas no 2 e 4, subdivisões e pulso constante.
              </p>
              <RhythmTraining
                onComplete={(accuracy, avgDelay) => {
                  console.log(`Treino rítmico concluído: ${accuracy}% de precisão, atraso médio ${avgDelay}ms`);
                }}
              />
            </div>

            {/* Motor Coordination Exercises */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-bold text-white">🏃 Coordenação Motora</h2>
                <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-xs">
                  Novo
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Exercícios silenciosos para desenvolver independência das mãos. Reduza a carga cognitiva e melhore o controle motor.
              </p>
              <MotorCoordinationExercises
                onComplete={(totalSessions, avgFatigue) => {
                  console.log(`Exercícios concluídos: ${totalSessions} sessões, fadiga média ${avgFatigue.toFixed(1)}`);
                }}
              />
            </div>

            {/* Intervalos Essenciais - Treino Simples */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-bold text-white">🎯 Intervalos Essenciais</h2>
                <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                  Iniciante
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Desenvolva sua percepção de altura - compare duas notas sem nomenclatura técnica
              </p>
              <EssentialIntervalTraining />
            </div>

            {/* Acordes Maior x Menor - Treino Harmônico */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-bold text-white">🎸 Acordes: Alegre x Triste</h2>
                <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-xs">
                  Essencial
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Desenvolva reconhecimento harmônico - identifique o clima dos acordes
              </p>
              <MajorMinorChordTraining />
            </div>

            {/* Memória Auditiva Curta */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-bold text-white">🧠 Memória Auditiva Curta</h2>
                <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                  Retenção
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Desenvolva retenção sonora - lembre-se de sequências curtas
              </p>
              <ShortTermMemoryTraining />
            </div>

            {/* Percepção Auditiva Ativa */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">🎵 Percepção Auditiva Ativa</h2>
              <p className="text-sm text-gray-400 mb-4">
                Exercícios progressivos usando AudioBus - um som por vez, feedback educativo
              </p>
              <ActiveAuditoryPerception />
            </div>

            {/* Ear Training */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">🎵 Treino de Ouvido Clássico</h2>
              <EarTraining />
            </div>
            
            {/* Metronome */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Metrônomo</h2>
              <Metronome />
            </div>
            
            {/* Pitch Detector */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Detector de Pitch</h2>
              <PitchDetector />
            </div>
            
            {/* Spectrum Visualizer */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Visualizador de Espectro</h2>
              <SpectrumVisualizer />
            </div>
            
            {/* Tips */}
            <div className="rounded-2xl p-6 bg-[#1a1a2e]/60 backdrop-blur-xl border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">💡 Dicas para Usar o Metrônomo</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center text-white text-sm font-bold">
                    1
                  </span>
                  <span>
                    <strong className="text-white">Comece devagar:</strong> Inicie com um BPM baixo (60-80) e aumente gradualmente conforme ganha confiança.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center text-white text-sm font-bold">
                    2
                  </span>
                  <span>
                    <strong className="text-white">Pratique com consistência:</strong> Use o metrônomo em todas as suas sessões de prática para desenvolver timing preciso.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center text-white text-sm font-bold">
                    3
                  </span>
                  <span>
                    <strong className="text-white">Use Tap Tempo:</strong> Toque no botão "Tap Tempo" no ritmo da música para descobrir o BPM automaticamente.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center text-white text-sm font-bold">
                    4
                  </span>
                  <span>
                    <strong className="text-white">Experimente diferentes compassos:</strong> Pratique com 4/4, 3/4, 6/8 e 2/4 para se familiarizar com diferentes ritmos.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center text-white text-sm font-bold">
                    5
                  </span>
                  <span>
                    <strong className="text-white">Acentue o primeiro tempo:</strong> Preste atenção ao primeiro tempo de cada compasso (marcado em azul) para manter a estrutura rítmica.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* MOBILE VERSION */}
      <div className="lg:hidden min-h-screen bg-[#0f0f1a] text-white">
        <MobileSidebar 
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          userName={userName}
          userLevel={level}
          currentXP={xp}
          xpToNextLevel={xpToNextLevel}
          streak={currentStreak}
        />
        
        <MobileHeader 
          userName={userName}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />
        
        <main className="px-5 py-5 space-y-6 pb-24">
          <header>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-6 h-6 text-[#06b6d4]" />
              <h1 className="text-2xl font-bold text-white">Prática</h1>
            </div>
            <p className="text-sm text-gray-400">Ferramentas para melhorar</p>
          </header>
          
          {/* Preparação Física - Mobile */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg font-bold text-white">Preparação Física</h2>
              <Badge variant="outline" className="border-orange-500/30 text-orange-400 text-xs">
                Recomendado
              </Badge>
            </div>
            <PhysicalPreparation />
          </div>

          {/* Exercícios Práticos Desbloqueados - Mobile */}
          {unlockedExercises.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Unlock className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-bold text-white">Exercícios Desbloqueados</h2>
                <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">
                  {unlockedExercises.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {PRACTICE_EXERCISES
                  .filter(ex => unlockedExercises.includes(ex.id))
                  .map((exercise) => (
                    <Card
                      key={exercise.id}
                      className="p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <Play className="w-5 h-5 text-green-400" />
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-sm">{exercise.name}</h3>
                          <p className="text-xs text-gray-300">{exercise.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Exercícios Bloqueados - Mobile */}
          {lockedExercises.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-bold text-white">Exercícios Bloqueados</h2>
              </div>
              <div className="space-y-3">
                {lockedExercises.slice(0, 3).map(({ exercise, missingRequirement }) => (
                  <Card
                    key={exercise.id}
                    className="p-3 bg-gray-800/50 border-gray-700/50 opacity-60"
                  >
                    <div className="flex items-start gap-3">
                      <Lock className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-400 text-sm mb-1">{exercise.name}</h3>
                        <p className="text-xs text-gray-500 mb-2">{missingRequirement}</p>
                        <Link href="/theory">
                          <Button size="sm" variant="outline" className="border-gray-600 text-gray-400 text-xs">
                            <BookOpen className="w-3 h-3 mr-1" />
                            Estudar Teoria
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Treino de Ouvido Contextual - Mobile */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-bold text-white">Treino Contextual</h2>
              <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                Novo
              </Badge>
            </div>
            <ContextualEarTraining />
          </div>

          {/* Intervalos Essenciais - Mobile */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-bold text-white">🎯 Intervalos Essenciais</h2>
              <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                Iniciante
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Compare duas notas - desenvolva sua percepção de altura
            </p>
            <EssentialIntervalTraining />
          </div>

          {/* Acordes Maior x Menor - Mobile */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-bold text-white">🎸 Acordes: Alegre x Triste</h2>
              <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-xs">
                Essencial
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Identifique o clima dos acordes - desenvolva reconhecimento harmônico
            </p>
            <MajorMinorChordTraining />
          </div>

          {/* Ritmo Auditivo Ativo - Mobile */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-bold text-white">👏 Ritmo Auditivo Ativo</h2>
              <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">
                Escuta Ativa
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Desenvolva escuta ativa de pulso - reduza dependência visual
            </p>
            <ActiveRhythmTraining />
          </div>

          {/* Memória Auditiva Curta - Mobile */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-bold text-white">🧠 Memória Auditiva Curta</h2>
              <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                Retenção
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Desenvolva retenção sonora - lembre-se de sequências curtas
            </p>
            <ShortTermMemoryTraining />
          </div>

          {/* Percepção Auditiva Ativa - Mobile */}
          <div>
            <h2 className="text-lg font-bold text-white mb-3">🎵 Percepção Auditiva Ativa</h2>
            <p className="text-xs text-gray-400 mb-3">
              Exercícios progressivos usando AudioBus
            </p>
            <ActiveAuditoryPerception />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-3">🎵 Treino de Ouvido</h2>
            <EarTraining />
          </div>
          
          <div>
            <h2 className="text-lg font-bold text-white mb-3">Metrônomo</h2>
            <Metronome />
          </div>
          
          <div className="rounded-2xl p-5 bg-[#1a1a2e]/60 backdrop-blur-xl border border-white/10">
            <h3 className="text-base font-bold text-white mb-3">💡 Dicas</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Comece devagar (60-80 BPM)</li>
              <li>• Use em todas as práticas</li>
              <li>• Tap Tempo para descobrir BPM</li>
              <li>• Experimente diferentes compassos</li>
              <li>• Acentue o primeiro tempo</li>
            </ul>
          </div>
        </main>
        
        <MobileBottomNav />
      </div>
    </>
  );
}
