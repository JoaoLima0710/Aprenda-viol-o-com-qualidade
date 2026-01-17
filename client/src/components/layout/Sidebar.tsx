import { Home, Guitar, Music2, Trophy, Target, User, Flame, Music, Clock, Settings } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Progress } from '@/components/ui/progress';

interface SidebarProps {
  userName: string;
  userLevel: number;
  currentXP: number;
  xpToNextLevel: number;
  streak: number;
}

export function Sidebar({ userName, userLevel, currentXP, xpToNextLevel, streak }: SidebarProps) {
  const [location] = useLocation();
  
  const navItems = [
    { path: '/', label: 'Início', icon: Home },
    { path: '/chords', label: 'Acordes', icon: Guitar },
    { path: '/scales', label: 'Escalas', icon: Music2 },
    { path: '/songs', label: 'Músicas', icon: Music },
    { path: '/practice', label: 'Prática', icon: Clock },
    { path: '/missions', label: 'Missões', icon: Target },
    { path: '/achievements', label: 'Conquistas', icon: Trophy },
    { path: '/profile', label: 'Perfil', icon: User },
    { path: '/settings', label: 'Configurações', icon: Settings },
  ];
  
  const xpPercentage = (currentXP / xpToNextLevel) * 100;
  
  return (
    <aside className="w-72 h-screen flex flex-col bg-[#0f0f1a] border-r border-white/10">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a855f7] to-[#8b5cf6] flex items-center justify-center">
            <Guitar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">MusicTutor</h1>
            <p className="text-xs text-gray-400">Aprenda Violão</p>
          </div>
        </div>
      </div>
      
      {/* User Info */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center">
            <span className="text-lg font-bold text-white">{userName.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">{userName}</h3>
            <p className="text-sm text-gray-400">Nível {userLevel}</p>
          </div>
        </div>
        
        {/* XP Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">XP</span>
            <span className="text-white font-semibold">{currentXP}/{xpToNextLevel}</span>
          </div>
          <Progress value={xpPercentage} className="h-2" />
        </div>
        
        {/* Streak */}
        <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-gradient-to-br from-[#f97316]/20 to-transparent border border-[#f97316]/30">
          <Flame className="w-5 h-5 text-[#f97316]" />
          <div className="flex-1">
            <p className="text-xs text-gray-400">Streak</p>
            <p className="text-sm font-bold text-white">{streak} dias</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer
                    ${isActive 
                      ? 'bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
        })}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-gray-500 text-center">
          MusicTutor © 2026
        </div>
      </div>
    </aside>
  );
}
