import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Metronome } from '@/components/practice/Metronome';
import { PitchDetector } from '@/components/practice/PitchDetector';
import { SpectrumVisualizer } from '@/components/practice/SpectrumVisualizer';
import { EarTraining } from '@/components/practice/EarTraining';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { Clock } from 'lucide-react';

export default function Practice() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const { xp, level, xpToNextLevel, currentStreak } = useGamificationStore();
  
  const userName = "João";
  
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
          <div className="max-w-4xl mx-auto p-8 space-y-8">
            {/* Header */}
            <header>
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-8 h-8 text-[#06b6d4]" />
                <h1 className="text-4xl font-bold text-white">Ferramentas de Prática</h1>
              </div>
              <p className="text-gray-400">Metrônomo e outras ferramentas para melhorar sua prática</p>
            </header>
            
            {/* Ear Training */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">🎵 Treino de Ouvido</h2>
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
