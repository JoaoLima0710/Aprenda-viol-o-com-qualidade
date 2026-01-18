import { Link, useLocation } from 'wouter';
import { Play, Music, BookOpen } from 'lucide-react';

export function BottomNavigation() {
  const [location] = useLocation();

  // Navegação simplificada: Hoje / Tocar / Biblioteca
  const navItems = [
    {
      path: '/',
      icon: Play,
      label: 'Hoje',
      description: 'Treino do dia'
    },
    {
      path: '/songs',
      icon: Music,
      label: 'Tocar',
      description: 'Suas músicas'
    },
    {
      path: '/library',
      icon: BookOpen,
      label: 'Biblioteca',
      description: 'Explorar tudo'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0f0f1a]/95 backdrop-blur-md border-t border-white/10 lg:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map(({ path, icon: Icon, label, description }) => {
          const isActive = location === path ||
            (path === '/' && location === '/practice') ||
            (path === '/library' && ['/chords', '/scales', '/theory', '/tuner'].includes(location));

          return (
            <Link key={path} href={path}>
              <a className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-purple-400 bg-purple-500/10 transform scale-105'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 active:scale-95'
              }`}>
                <Icon className={`w-5 h-5 mb-1 transition-transform ${
                  isActive ? 'scale-110' : ''
                }`} />
                <span className="text-xs font-medium">{label}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}