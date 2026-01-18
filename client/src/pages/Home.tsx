import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Bell, ChevronRight, Ear, Guitar, Mic2, Music2, Lock, Sparkles, Play, Palette, Settings } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { SimplifiedNav } from '@/components/layout/SimplifiedNav';
import { DailyGoalCard } from '@/components/gamification/DailyGoalCard';
import { ChallengeCard } from '@/components/gamification/ChallengeCard';
import { ContinueLearning } from '@/components/gamification/ContinueLearning';
import { TrainingModule } from '@/components/gamification/TrainingModule';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { DailyTraining } from '@/components/training/DailyTraining';
import { FirstSongPath } from '@/components/training/FirstSongPath';
import { SongCard } from '@/components/songs/SongCard';
import { Button } from '@/components/ui/button';
import { ProgressiveDisclosure, DisclosureItem } from '@/components/ui/ProgressiveDisclosure';
import { ThemeCustomizer } from '@/components/ui/ThemeCustomizer';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { useGestureNavigation } from '@/hooks/useGestureNavigation';
import { themeCustomizationService } from '@/services/ThemeCustomizationService';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useSongUnlockStore, checkAndUnlockSongs } from '@/stores/useSongUnlockStore';
import { songs } from '@/data/songs';

export default function Home() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  const [, setLocation] = useLocation();

  // Gesture navigation
  const { getDefaultNavigationHandlers, triggerHapticFeedback } = useGestureNavigation(
    {}, // options
    {
      enabled: true,
      threshold: 50,
      velocity: 0.3,
      hapticFeedback: true
    }
  );
  
  const { xp, level, xpToNextLevel, currentStreak } = useGamificationStore();
  const { getUnlockedSongs, getNextUnlockableSongs, getLockedSongs } = useSongUnlockStore();
  
  const userName = "João";
  
  // Check and unlock songs when component mounts or progress changes
  useEffect(() => {
    checkAndUnlockSongs();
  }, [level, xp]);
  
  const unlockedSongs = getUnlockedSongs();
  const nextUnlockable = getNextUnlockableSongs();
  const lockedSongs = getLockedSongs().slice(0, 3); // Show first 3 locked songs

  // Get user preferences for layout
  const userPreferences = themeCustomizationService.getUserPreferences();
  const isCompactMode = userPreferences.dashboard.compactMode;
  const layoutStyle = userPreferences.layout.dashboardLayout;

  // Gesture navigation handlers
  const navigationHandlers = {
    onSwipeRight: () => {
      // Navigate back in history
      window.history.back();
    },
    onSwipeLeft: () => {
      // Navigate to practice
      setLocation('/practice');
    },
    onSwipeUp: () => {
      // Open theme customizer
      setShowThemeCustomizer(true);
    },
    onSwipeDown: () => {
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Create disclosure items for progressive disclosure
  const dashboardItems: DisclosureItem[] = [
    {
      id: 'daily-training',
      title: 'Treino Diário',
      content: <DailyTraining />,
      priority: 'high',
      category: 'practice',
      metadata: { estimatedTime: 15, difficulty: 'beginner', new: false }
    },
    {
      id: 'ai-assistant',
      title: 'Assistente IA',
      content: <AIAssistant />,
      priority: 'high',
      category: 'ai',
      metadata: { estimatedTime: 10, difficulty: 'beginner', new: true }
    },
    {
      id: 'recent-activity',
      title: 'Atividades Recentes',
      content: (
        <div className="space-y-3">
          {unlockedSongs.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-white">Suas Músicas</h2>
                <button
                  onClick={() => setLocation('/songs')}
                  className="text-xs text-[#06b6d4] font-semibold"
                >
                  Ver todas
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {unlockedSongs.slice(0, 3).map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    onClick={() => setLocation(`/songs/${song.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      ),
      priority: 'medium',
      category: 'content',
      metadata: { estimatedTime: 5, difficulty: 'beginner' }
    }
  ];
  
  const continueLearningData = [
    {
      id: 1,
      title: "Acordes Básicos",
      subtitle: "Lição 3 de 8",
      progress: 37,
      color: "text-[#06b6d4]",
      iconBg: "bg-gradient-to-br from-[#06b6d4] to-[#0891b2]",
      icon: "🎸"
    },
    {
      id: 2,
      title: "Escala Pentatônica",
      subtitle: "Posição 1",
      progress: 66,
      color: "text-[#f97316]",
      iconBg: "bg-gradient-to-br from-[#f97316] to-[#ea580c]",
      icon: "🎵"
    },
    {
      id: 3,
      title: "Ritmo e Batida",
      subtitle: "Treino Inicial",
      progress: 85,
      color: "text-[#ec4899]",
      iconBg: "bg-gradient-to-br from-[#ec4899] to-[#db2777]",
      icon: "🥁"
    }
  ];
  
  const todayModules = [
    {
      icon: Ear,
      title: "TREINO DE OUVIDO",
      subtitle: "Intervalos, acordes e progressões",
      duration: "15 min/dia",
      progress: 8,
      total: 24,
      color: 'cyan' as const
    },
    {
      icon: Guitar,
      title: "ACORDES",
      subtitle: "Acordes, técnicas e transições",
      duration: "20 min/dia",
      progress: 12,
      total: 36,
      color: 'orange' as const
    },
    {
      icon: Music2,
      title: "ESCALAS",
      subtitle: "Escalas, modos e improvisação",
      duration: "15 min/dia",
      progress: 5,
      total: 30,
      color: 'pink' as const
    },
    {
      icon: Mic2,
      title: "MÚSICAS",
      subtitle: "Repertório brasileiro e internacional",
      duration: "20 min/dia",
      progress: 3,
      total: 18,
      color: 'green' as const
    }
  ];
  
  return (
    <>
      {/* DESKTOP VERSION */}
      <div className="hidden lg:flex h-screen bg-[#0f0f1a] text-white overflow-hidden">
        {level <= 3 ? (
          <>
            <SimplifiedNav
              userName={userName}
              userLevel={level}
              currentXP={xp}
              xpToNextLevel={xpToNextLevel}
              streak={currentStreak}
            />
            <div className="pt-20 flex-1 overflow-y-auto">
              <div className="max-w-6xl mx-auto p-8 space-y-8">
                {/* Header */}
            <header className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Boa tarde, {userName} 👋
                </h1>
                <p className="text-gray-400">
                  {unlockedSongs.length} músicas desbloqueadas • {nextUnlockable.length} prontas para desbloquear
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="relative p-3 rounded-2xl backdrop-blur-xl bg-[#1a1a2e]/60 border border-white/10 hover:border-[#a855f7]/40 transition-all"
              >
                <Bell className="w-6 h-6 text-white" />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#a855f7] rounded-full border-2 border-[#0f0f1a] shadow-[0_0_10px_rgba(168,85,247,0.8)]"></span>
              </Button>
            </header>
            
            {/* Featured: Next Songs to Unlock */}
            {nextUnlockable.length > 0 && (
              <section>
                <div className="relative overflow-hidden rounded-3xl p-8 backdrop-blur-xl bg-gradient-to-br from-[#8b5cf6]/30 via-[#a855f7]/20 to-transparent border border-[#8b5cf6]/40 shadow-[0_0_35px_rgba(139,92,246,0.3)]">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#8b5cf6] via-[#a855f7] to-[#8b5cf6] opacity-10 blur-3xl"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-6 h-6 text-[#c084fc]" />
                      <h2 className="text-2xl font-bold text-white">Próximas Músicas para Desbloquear</h2>
                    </div>
                    <p className="text-gray-300 mb-6">
                      Você já completou os requisitos! Clique para desbloquear e começar a tocar.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {nextUnlockable.slice(0, 3).map((song) => (
                        <div
                          key={song.id}
                          onClick={() => setLocation(`/songs/${song.id}`)}
                          className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#8b5cf6]/50 cursor-pointer transition-all hover:scale-105"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-white">{song.title}</h3>
                            <Play className="w-4 h-4 text-[#8b5cf6]" />
                          </div>
                          <p className="text-sm text-gray-400 mb-3">{song.artist}</p>
                          <div className="flex flex-wrap gap-1">
                            {song.chords.slice(0, 3).map((chord, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-[#8b5cf6]/20 text-[#c084fc] text-xs font-mono">
                                {chord}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Button
                      onClick={() => setLocation('/songs')}
                      className="mt-6 bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white font-semibold"
                    >
                      Ver Todas as Músicas
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </section>
            )}
            
            {/* Unlocked Songs */}
            {unlockedSongs.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Suas Músicas Desbloqueadas</h2>
                    <p className="text-sm text-gray-400 mt-1">Continue praticando suas músicas favoritas</p>
                  </div>
                  <button 
                    onClick={() => setLocation('/songs')}
                    className="text-sm text-[#06b6d4] font-semibold hover:text-[#22d3ee] transition-colors flex items-center gap-1"
                  >
                    <span>Ver todas</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unlockedSongs.slice(0, 6).map((song) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      onClick={() => setLocation(`/songs/${song.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}
            
            {/* Daily Training */}
            <section>
              <DailyTraining />
            </section>
            
            {/* AI Assistant */}
            <section>
              <AIAssistant />
            </section>
            
            {/* Daily Goal */}
            <section>
              <DailyGoalCard current={15} total={30} streak={currentStreak} />
            </section>
            
            {/* Today's Challenge */}
            <section>
              <ChallengeCard 
                title="Desbloquear Nova Música"
                description={`Complete ${nextUnlockable.length > 0 ? 'uma música já disponível' : 'os requisitos para desbloquear mais músicas'}`}
                xp={200}
              />
            </section>
            
            {/* Continue Learning */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Continue de onde parou</h2>
                  <p className="text-sm text-gray-400 mt-1">Retome suas lições em andamento</p>
                </div>
                <button 
                  onClick={() => setLocation('/chords')}
                  className="text-sm text-[#06b6d4] font-semibold hover:text-[#22d3ee] transition-colors flex items-center gap-1"
                >
                  <span>Ver tudo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <ContinueLearning lessons={continueLearningData} />
            </section>
            
            {/* Training Modules */}
            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-1">Treino de Hoje</h2>
                <p className="text-sm text-gray-400">Módulos de prática</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {todayModules.map((module, index) => (
                  <TrainingModule key={index} {...module} />
                ))}
              </div>
            </section>
            
            {/* First Song Path */}
            <section>
              <FirstSongPath />
            </section>
            
                <div className="h-8"></div>
              </div>
            </div>
          </>
        ) : (
          <>
            <Sidebar 
              userName={userName}
              userLevel={level}
              currentXP={xp}
              xpToNextLevel={xpToNextLevel}
              streak={currentStreak}
            />
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-6xl mx-auto p-8 space-y-8">
                {/* Header */}
                <header className="flex items-start justify-between">
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                      Boa tarde, {userName} 👋
                    </h1>
                    <p className="text-gray-400">
                      {unlockedSongs.length} músicas desbloqueadas • {nextUnlockable.length} prontas para desbloquear
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative p-3 rounded-2xl backdrop-blur-xl bg-[#1a1a2e]/60 border border-white/10 hover:border-[#a855f7]/40 transition-all"
                  >
                    <Bell className="w-6 h-6 text-white" />
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#a855f7] rounded-full border-2 border-[#0f0f1a] shadow-[0_0_10px_rgba(168,85,247,0.8)]"></span>
                  </Button>
                </header>
                
                {/* Featured: Next Songs to Unlock */}
                {nextUnlockable.length > 0 && (
                  <section>
                    <div className="relative overflow-hidden rounded-3xl p-8 backdrop-blur-xl bg-gradient-to-br from-[#8b5cf6]/30 via-[#a855f7]/20 to-transparent border border-[#8b5cf6]/40 shadow-[0_0_35px_rgba(139,92,246,0.3)]">
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#8b5cf6] via-[#a855f7] to-[#8b5cf6] opacity-10 blur-3xl"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles className="w-6 h-6 text-[#c084fc]" />
                          <h2 className="text-2xl font-bold text-white">Próximas Músicas para Desbloquear</h2>
                        </div>
                        <p className="text-gray-300 mb-6">
                          Você já completou os requisitos! Clique para desbloquear e começar a tocar.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {nextUnlockable.slice(0, 3).map((song) => (
                            <div
                              key={song.id}
                              onClick={() => setLocation(`/songs/${song.id}`)}
                              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#8b5cf6]/50 cursor-pointer transition-all hover:scale-105"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-white">{song.title}</h3>
                                <Play className="w-4 h-4 text-[#8b5cf6]" />
                              </div>
                              <p className="text-sm text-gray-400 mb-3">{song.artist}</p>
                              <div className="flex flex-wrap gap-1">
                                {song.chords.slice(0, 3).map((chord, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded bg-[#8b5cf6]/20 text-[#c084fc] text-xs font-mono">
                                    {chord}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <Button
                          onClick={() => setLocation('/songs')}
                          className="mt-6 bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white font-semibold"
                        >
                          Ver Todas as Músicas
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </section>
                )}
                
                {/* Unlocked Songs */}
                {unlockedSongs.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-white">Suas Músicas Desbloqueadas</h2>
                        <p className="text-sm text-gray-400 mt-1">Continue praticando suas músicas favoritas</p>
                      </div>
                      <button 
                        onClick={() => setLocation('/songs')}
                        className="text-sm text-[#06b6d4] font-semibold hover:text-[#22d3ee] transition-colors flex items-center gap-1"
                      >
                        <span>Ver todas</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {unlockedSongs.slice(0, 6).map((song) => (
                        <SongCard
                          key={song.id}
                          song={song}
                          onClick={() => setLocation(`/songs/${song.id}`)}
                        />
                      ))}
                    </div>
                  </section>
                )}
                
                {/* Daily Training */}
                <section>
                  <DailyTraining />
                </section>
                
                {/* AI Assistant */}
                <section>
                  <AIAssistant />
                </section>
                
                {/* Daily Goal */}
                <section>
                  <DailyGoalCard current={15} total={30} streak={currentStreak} />
                </section>
                
                {/* Today's Challenge */}
                <section>
                  <ChallengeCard 
                    title="Desbloquear Nova Música"
                    description={`Complete ${nextUnlockable.length > 0 ? 'uma música já disponível' : 'os requisitos para desbloquear mais músicas'}`}
                    xp={200}
                  />
                </section>
                
                {/* Continue Learning */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Continue de onde parou</h2>
                      <p className="text-sm text-gray-400 mt-1">Retome suas lições em andamento</p>
                    </div>
                    <button 
                      onClick={() => setLocation('/chords')}
                      className="text-sm text-[#06b6d4] font-semibold hover:text-[#22d3ee] transition-colors flex items-center gap-1"
                    >
                      <span>Ver tudo</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <ContinueLearning lessons={continueLearningData} />
                </section>
                
                {/* Training Modules */}
                <section>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-1">Treino de Hoje</h2>
                    <p className="text-sm text-gray-400">Módulos de prática</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {todayModules.map((module, index) => (
                      <TrainingModule key={index} {...module} />
                    ))}
                  </div>
                </section>
                
                {/* First Song Path */}
                <section>
                  <FirstSongPath />
                </section>
                
                <div className="h-8"></div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* MOBILE VERSION */}
      <div className="lg:hidden min-h-screen bg-[#0f0f1a] text-white pb-20">
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
          onThemeClick={() => setShowThemeCustomizer(true)}
        />

        {/* PWA Install Banner - Only show if not installed */}
        <div className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border-b border-purple-400/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Music2 className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm text-white font-medium">MusicTutor PWA</span>
            </div>
            <PWAInstallButton />
          </div>
        </div>

        <main className={`px-4 py-4 pb-24 ${isCompactMode ? 'space-y-3' : 'space-y-4'}`}>
          {/* Featured: Next Songs to Unlock */}
          {nextUnlockable.length > 0 && (
            <section>
              <div className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl bg-gradient-to-br from-[#8b5cf6]/30 via-[#a855f7]/20 to-transparent border border-[#8b5cf6]/40">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-[#c084fc]" />
                  <h2 className="text-lg font-bold text-white">Próximas Músicas</h2>
                </div>
                <p className="text-sm text-gray-300 mb-4">
                  Você já completou os requisitos!
                </p>

                <div className="space-y-2">
                  {nextUnlockable.slice(0, 2).map((song) => (
                    <div
                      key={song.id}
                      onClick={() => setLocation(`/songs/${song.id}`)}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#8b5cf6]/50 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-white text-sm">{song.title}</h3>
                          <p className="text-xs text-gray-400">{song.artist}</p>
                        </div>
                        <Play className="w-4 h-4 text-[#8b5cf6]" />
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => setLocation('/songs')}
                  className="mt-4 w-full bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white text-sm"
                >
                  Ver Todas
                </Button>
              </div>
            </section>
          )}

          {/* Progressive Disclosure Dashboard */}
          {layoutStyle === 'cards' && (
            <ProgressiveDisclosure
              items={dashboardItems}
              initialVisible={isCompactMode ? 2 : 3}
              showPriority={true}
              showMetadata={true}
              compact={isCompactMode}
            />
          )}
          
          {/* Unlocked Songs */}
          {unlockedSongs.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-white">Suas Músicas</h2>
                <button 
                  onClick={() => setLocation('/songs')}
                  className="text-xs text-[#06b6d4] font-semibold"
                >
                  Ver todas
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {unlockedSongs.slice(0, 3).map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    onClick={() => setLocation(`/songs/${song.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
          
          {/* Daily Training */}
          <section>
            <DailyTraining />
          </section>
          
          {/* AI Assistant */}
          <section>
            <AIAssistant />
          </section>
          
          <section>
            <DailyGoalCard current={15} total={30} streak={currentStreak} />
          </section>
          
          <section>
            <ChallengeCard 
              title="Desbloquear Nova Música"
              description={`Complete ${nextUnlockable.length > 0 ? 'uma música já disponível' : 'os requisitos para desbloquear mais músicas'}`}
              xp={200}
            />
          </section>
          
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white mb-1">Continue de onde parou</h2>
              <p className="text-sm text-gray-400">Retome suas lições</p>
            </div>
            
            <ContinueLearning lessons={continueLearningData} />
          </section>
          
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white mb-1">Treino de Hoje</h2>
              <p className="text-sm text-gray-400">Módulos</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {todayModules.map((module, index) => (
                <TrainingModule key={index} {...module} />
              ))}
            </div>
          </section>
          
          <section>
            <div className="relative overflow-hidden rounded-3xl p-6 backdrop-blur-xl bg-gradient-to-br from-[#8b5cf6]/20 via-[#a855f7]/10 to-transparent border border-[#8b5cf6]/40 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#8b5cf6] via-[#a855f7] to-[#8b5cf6] opacity-10 blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="inline-block px-2.5 py-1 rounded-lg bg-[#8b5cf6]/30 border border-[#8b5cf6]/50 mb-3">
                  <span className="text-xs uppercase tracking-wider text-[#c084fc] font-bold">Destaque</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Violão do Zero em 30 Dias</h3>
                <p className="text-sm text-gray-300 mb-4">De iniciante a tocador, aprenda as suas primeiras músicas.</p>
                
                <Button className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white font-semibold shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                  <span>Explorar Trilha</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </section>
        </main>
        
        {level <= 3 ? (
          <SimplifiedNav
            userName={userName}
            userLevel={level}
            currentXP={xp}
            xpToNextLevel={xpToNextLevel}
            streak={currentStreak}
          />
        ) : (
          <MobileBottomNav />
        )}
      </div>

      {/* Theme Customizer */}
      <ThemeCustomizer
        isOpen={showThemeCustomizer}
        onClose={() => setShowThemeCustomizer(false)}
      />
    </>
  );
}
