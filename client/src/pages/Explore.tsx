import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { SimplifiedNav } from '@/components/layout/SimplifiedNav';
import { Button } from '@/components/ui/button';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { Guitar, Music2, Ear, Book, Compass } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Explore() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  const { xp, level, xpToNextLevel, currentStreak } = useGamificationStore();
  const userName = "João";
  const isBeginner = level <= 3;
  
  const exploreCategories = [
    {
      id: 'chords',
      title: 'Acordes',
      description: 'Biblioteca completa de acordes',
      icon: Guitar,
      color: 'from-[#06b6d4] to-[#0891b2]',
      path: '/chords',
    },
    {
      id: 'scales',
      title: 'Escalas',
      description: 'Escalas musicais e modos',
      icon: Music2,
      color: 'from-[#f97316] to-[#ea580c]',
      path: '/scales',
    },
    {
      id: 'ear-training',
      title: 'Treino de Ouvido',
      description: 'Desenvolva seu ouvido musical',
      icon: Ear,
      color: 'from-[#ec4899] to-[#db2777]',
      path: '/practice',
    },
    {
      id: 'theory',
      title: 'Teoria Musical',
      description: 'Conceitos e fundamentos',
      icon: Book,
      color: 'from-[#10b981] to-[#059669]',
      path: '/theory',
    },
  ];
  
  return (
    <>
      {/* DESKTOP VERSION */}
      <div className="hidden lg:flex h-screen bg-[#0f0f1a] text-white overflow-hidden">
        {isBeginner ? (
          <>
            <div className="pt-20 w-full">
              <SimplifiedNav
                userName={userName}
                userLevel={level}
                currentXP={xp}
                xpToNextLevel={xpToNextLevel}
                streak={currentStreak}
              />
            </div>
          </>
        ) : (
          <Sidebar 
            userName={userName}
            userLevel={level}
            currentXP={xp}
            xpToNextLevel={xpToNextLevel}
            streak={currentStreak}
          />
        )}
        
        <div className={`flex-1 overflow-y-auto ${isBeginner ? 'pt-20' : ''}`}>
          <div className="max-w-6xl mx-auto p-8 space-y-8">
            {/* Header */}
            <header>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#a855f7] flex items-center justify-center">
                  <Compass className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">Explorar</h1>
                  <p className="text-gray-400">Descubra acordes, escalas, teoria e mais</p>
                </div>
              </div>
            </header>
            
            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exploreCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <div
                    key={category.id}
                    onClick={() => setLocation(category.path)}
                    className="relative overflow-hidden rounded-3xl p-8 backdrop-blur-xl bg-[#1a1a2e]/60 border border-white/10 hover:border-white/20 cursor-pointer transition-all group"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                    
                    <div className="relative z-10">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 shadow-lg`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      
                      <h2 className="text-2xl font-bold text-white mb-2">{category.title}</h2>
                      <p className="text-gray-400 mb-6">{category.description}</p>
                      
                      <Button
                        className={`bg-gradient-to-r ${category.color} text-white font-semibold`}
                      >
                        Explorar
                      </Button>
                    </div>
                  </div>
                );
              })}
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
        
        <main className="px-5 py-5 space-y-5 pb-24">
          {/* Header */}
          <header>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#a855f7] flex items-center justify-center">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Explorar</h1>
                <p className="text-sm text-gray-400">Descubra mais conteúdo</p>
              </div>
            </div>
          </header>
          
          {/* Categories */}
          <div className="space-y-4">
            {exploreCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.id}
                  onClick={() => setLocation(category.path)}
                  className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl bg-[#1a1a2e]/60 border border-white/10 hover:border-white/20 cursor-pointer"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-10`}></div>
                  
                  <div className="relative z-10 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-white mb-1">{category.title}</h2>
                      <p className="text-sm text-gray-400">{category.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
        
        {isBeginner ? (
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
    </>
  );
}
