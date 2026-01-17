import { useState } from 'react';
import { useLocation } from 'wouter';
import { Bell, ChevronRight, Ear, Guitar, Mic2, Music2 } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { DailyGoalCard } from '@/components/gamification/DailyGoalCard';
import { ChallengeCard } from '@/components/gamification/ChallengeCard';
import { ContinueLearning } from '@/components/gamification/ContinueLearning';
import { TrainingModule } from '@/components/gamification/TrainingModule';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { DailyTraining } from '@/components/training/DailyTraining';
import { Button } from '@/components/ui/button';
import { useGamificationStore } from '@/stores/useGamificationStore';

export default function Home() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  const { xp, level, xpToNextLevel, currentStreak } = useGamificationStore();
  
  const userName = "João";
  
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
                <p className="text-gray-400">Escolha um módulo para praticar</p>
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
                title="Dominar 5 Acordes Maiores"
                description="Complete os acordes C, D, E, G e A com 80% de acurácia"
                xp={180}
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
            
            {/* Featured Path */}
            <section>
              <div className="relative overflow-hidden rounded-3xl p-8 backdrop-blur-xl bg-gradient-to-br from-[#8b5cf6]/20 via-[#a855f7]/10 to-transparent border border-[#8b5cf6]/40 shadow-[0_0_35px_rgba(139,92,246,0.3)]">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#8b5cf6] via-[#a855f7] to-[#8b5cf6] opacity-10 blur-3xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="inline-block px-3 py-1 rounded-lg bg-[#8b5cf6]/30 border border-[#8b5cf6]/50 mb-3">
                        <span className="text-xs uppercase tracking-wider text-[#c084fc] font-bold">Destaque</span>
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-2">Violão do Zero em 30 Dias</h3>
                      <p className="text-gray-300 mb-4">De iniciante a tocador, aprenda as suas primeiras músicas.</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>30 dias • +5000 XP disponível</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setLocation('/chords')}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white font-semibold shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:shadow-[0_0_35px_rgba(139,92,246,0.7)] transition-all"
                  >
                    <span>Explorar Trilha</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </section>
            
            <div className="h-8"></div>
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
          <section>
            <DailyGoalCard current={15} total={30} streak={currentStreak} />
          </section>
          
          <section>
            <ChallengeCard 
              title="Dominar 5 Acordes Maiores"
              description="Complete os acordes C, D, E, G e A com 80% de acurácia"
              xp={180}
            />
          </section>
          
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white mb-1">Continue de onde parou</h2>
              <p className="text-sm text-gray-400">Retome suas lições</p>
            </div>
            
            <ContinueLearning lessons={continueLearningData} />
          </section>
          
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white mb-1">Treino de Hoje</h2>
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
        
        <MobileBottomNav />
      </div>
    </>
  );
}
