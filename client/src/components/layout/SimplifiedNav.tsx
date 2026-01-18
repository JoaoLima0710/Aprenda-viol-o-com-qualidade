import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Home, Play, Compass, Menu, X } from 'lucide-react';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { MobileBottomNav } from './MobileBottomNav';

interface SimplifiedNavProps {
  userName: string;
  userLevel: number;
  currentXP: number;
  xpToNextLevel: number;
  streak: number;
}

export function SimplifiedNav({ userName, userLevel, currentXP, xpToNextLevel, streak }: SimplifiedNavProps) {
  const [location] = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const { level } = useGamificationStore();
  
  // Modo simplificado para iniciantes (nível 1-3)
  const isBeginner = level <= 3;
  
  if (!isBeginner) {
    return null; // Usa navegação normal para não-iniciantes
  }
  
  const navItems = [
    { path: '/', label: 'Treinar', icon: Home, description: 'Seu treino do dia' },
    { path: '/songs', label: 'Tocar', icon: Play, description: 'Suas músicas' },
    { path: '/explore', label: 'Explorar', icon: Compass, description: 'Acordes, escalas e mais' },
  ];
  
  const currentNav = navItems.find(item => location === item.path || (item.path === '/' && location === '/'));
  
  return (
    <>
      {/* Desktop Simplified Navigation */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 z-40 bg-[#0f0f1a]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#a855f7] flex items-center justify-center text-white font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{userName}</p>
                <p className="text-xs text-gray-400">Nível {userLevel}</p>
              </div>
            </div>
            
            {/* Simplified Nav Tabs */}
            <div className="flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path || (item.path === '/' && location === '/');
                
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white shadow-lg'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-semibold">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            {/* Streak */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/20 border border-orange-500/30">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-xs text-gray-400">Streak</p>
                <p className="text-sm font-bold text-orange-400">{streak} dias</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Simplified Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a2e]/95 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || (item.path === '/' && location === '/');
            
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'text-[#8b5cf6] bg-purple-500/20'
                      : 'text-gray-400'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
